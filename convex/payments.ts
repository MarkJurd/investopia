import { action, internalMutation, internalQuery, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  PLANS, FOR_SALE, type PlanId, planValidator, VIP_SEATS_PER_MONTH, INDICATOR_BONUS_LIMIT, LAUNCH, daysToMs, bangkokMonthKey,
} from "./plans";

/* ---------- ที่นั่ง VIP ที่เหลือเดือนนี้ ---------- */
async function countVipSeatsLeft(ctx: QueryCtx): Promise<number> {
  const sold = await ctx.db
    .query("memberships")
    .withIndex("by_plan_and_monthKey", (q) => q.eq("plan", "vip").eq("monthKey", bangkokMonthKey(Date.now())))
    .take(VIP_SEATS_PER_MONTH + 1);
  const active = sold.filter((m) => m.status === "active").length;
  return Math.max(0, VIP_SEATS_PER_MONTH - active);
}

export const vipSeatsLeft = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => countVipSeatsLeft(ctx),
});

export const vipSeatsLeftInternal = internalQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => countVipSeatsLeft(ctx),
});

/* ---------- รอบเปิดตัว: ที่นั่งรายปีที่เหลือ (นับคนที่จ่ายผ่าน Stripe และสิทธิ์ยังใช้งานอยู่) ---------- */
async function countLaunchSeatsLeft(ctx: QueryCtx): Promise<number> {
  const rows = await ctx.db
    .query("memberships")
    .withIndex("by_plan_and_monthKey", (q) => q.eq("plan", LAUNCH.plan))
    .take(2000);
  const people = new Set(rows.filter((m) => m.status === "active" && m.source !== "manual").map((m) => m.userId));
  return Math.max(0, LAUNCH.seats - people.size);
}

export const launchStatus = query({
  args: {},
  returns: v.object({ seatsLeft: v.number(), total: v.number(), endsAt: v.number() }),
  handler: async (ctx) => ({ seatsLeft: await countLaunchSeatsLeft(ctx), total: LAUNCH.seats, endsAt: LAUNCH.endsAt }),
});

export const launchSeatsLeftInternal = internalQuery({
  args: {},
  returns: v.number(),
  handler: async (ctx) => countLaunchSeatsLeft(ctx),
});

/* ---------- สิทธิ์ปัจจุบันของผู้ใช้ที่ล็อกอินอยู่ ---------- */
export type Membership = { plan: PlanId; expiresAt: number; indicatorBonus: boolean };

/** สิทธิ์ที่ใช้ได้ ณ เวลา now (null = ไม่มี/หมดอายุ) — ใช้ร่วมกับห้องเรียน (convex/learn.ts) */
export async function getMembership(ctx: QueryCtx, userId: Id<"users">, now: number): Promise<Membership | null> {
  const rows = await ctx.db.query("memberships").withIndex("by_userId", (q) => q.eq("userId", userId)).take(500);
  const live = rows.filter((m) => m.status === "active" && m.startsAt <= now && m.expiresAt > now);
  if (live.length === 0) return null;
  // แพ็กเกจที่สูงสุดที่ใช้อยู่ตอนนี้ + วันหมดอายุของแพ็กเกจนั้น (รวมที่ต่ออายุไว้ล่วงหน้า)
  const top = live.reduce((a, b) => (PLANS[b.plan].rank > PLANS[a.plan].rank ? b : a));
  const sameLater = rows.filter((m) => m.status === "active" && m.plan === top.plan && m.expiresAt > now);
  return {
    plan: top.plan,
    expiresAt: Math.max(...sameLater.map((m) => m.expiresAt)),
    indicatorBonus: rows.some((m) => m.status === "active" && m.indicatorBonus),
  };
}

export const myMembership = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({ plan: planValidator, expiresAt: v.number(), indicatorBonus: v.boolean() }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await getMembership(ctx, userId, Date.now());
  },
});

export const userEmail = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { userId }) => (await ctx.db.get(userId))?.email ?? null,
});

/* ---------- โค้ดส่วนลด (สร้างในหน้า /admin) ---------- */
const MIN_PRICE = 20;   // ราคาหลังลดต่ำสุด (บาท) — Stripe ไม่รับยอดต่ำเกินไป

type Quote = { ok: true; code: string | null; listAmount: number; amount: number } | { ok: false; error: string };

async function quote(ctx: QueryCtx, plan: PlanId, rawCode: string | undefined, now: number): Promise<Quote> {
  let listAmount: number = PLANS[plan].amount;
  if (plan === LAUNCH.plan && now <= LAUNCH.endsAt && (await countLaunchSeatsLeft(ctx)) > 0) listAmount = LAUNCH.price;
  const code = (rawCode ?? "").trim().toUpperCase();
  if (!code) return { ok: true, code: null, listAmount, amount: listAmount };
  const c = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", code)).first();
  if (c === null || !c.active) return { ok: false, error: "COUPON_INVALID" };
  if (c.expiresAt !== null && c.expiresAt <= now) return { ok: false, error: "COUPON_EXPIRED" };
  if (c.maxUses !== null && c.uses >= c.maxUses) return { ok: false, error: "COUPON_USED_UP" };
  if (!c.plans.includes(plan)) return { ok: false, error: "COUPON_NOT_FOR_PLAN" };
  const off = c.kind === "percent" ? Math.round((listAmount * c.value) / 100) : c.value;
  return { ok: true, code, listAmount, amount: Math.max(MIN_PRICE, listAmount - off) };
}

const quoteValidator = v.union(
  v.object({ ok: v.literal(true), code: v.union(v.string(), v.null()), listAmount: v.number(), amount: v.number() }),
  v.object({ ok: v.literal(false), error: v.string() }),
);

/** หน้าเว็บใช้ตรวจโค้ดก่อนกดจ่าย (แสดงราคาหลังลด) */
export const checkCoupon = query({
  args: { plan: planValidator, code: v.string(), now: v.number() },
  returns: quoteValidator,
  handler: async (ctx, { plan, code, now }) => quote(ctx, plan, code, now),
});

export const quoteInternal = internalQuery({
  args: { plan: planValidator, code: v.optional(v.string()) },
  returns: quoteValidator,
  handler: async (ctx, { plan, code }) => quote(ctx, plan, code, Date.now()),
});

/* ---------- เริ่มจ่ายเงิน: สร้าง Stripe Checkout แล้วส่ง URL กลับไปให้หน้าเว็บพาไป ---------- */
export const createCheckout = action({
  args: { plan: planValidator, lang: v.optional(v.union(v.literal("th"), v.literal("en"))), coupon: v.optional(v.string()) },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, { plan, coupon }): Promise<{ url: string }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("NOT_SIGNED_IN");
    if (!FOR_SALE.has(plan)) throw new Error("PLAN_NOT_FOR_SALE");
    if (plan === "vip") {
      const left: number = await ctx.runQuery(internal.payments.vipSeatsLeftInternal, {});
      if (left <= 0) throw new Error("VIP_FULL");
    }
    const secret = process.env.STRIPE_SECRET_KEY;
    const site = process.env.SITE_URL;
    if (!secret || !site) throw new Error("PAYMENT_NOT_CONFIGURED");

    const q: Quote = await ctx.runQuery(internal.payments.quoteInternal, { plan, code: coupon });
    if (!q.ok) throw new ConvexError(q.error);
    const p = PLANS[plan];
    const home = `${site}/`;
    const email: string | null = await ctx.runQuery(internal.payments.userEmail, { userId });
    const form = new URLSearchParams({
      mode: "payment",
      locale: "th",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "thb",
      "line_items[0][price_data][unit_amount]": String(q.amount * 100), // สตางค์ (หลังหักส่วนลดแล้ว)
      "line_items[0][price_data][product_data][name]": q.code ? `${p.name} (โค้ด ${q.code} ลดจาก ฿${q.listAmount.toLocaleString("en-US")})` : p.name,
      success_url: `${home}?checkout=success`,
      cancel_url: `${home}?checkout=cancel#pricing`,
      client_reference_id: userId,
      "metadata[userId]": userId,
      "metadata[plan]": plan,
      "metadata[amount]": String(q.amount),          // ยอดที่ต้องได้รับ (webhook ตรวจซ้ำ)
      "metadata[listAmount]": String(q.listAmount),
      "metadata[coupon]": q.code ?? "",
      "payment_intent_data[metadata][userId]": userId,
      "payment_intent_data[metadata][plan]": plan,
      expires_at: String(Math.floor(Date.now() / 1000) + 30 * 60), // หน้าจ่ายเงินหมดอายุใน 30 นาที
    });
    if (email) form.set("customer_email", email);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const json = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !json.url) {
      console.error("Stripe checkout error:", json.error?.message ?? res.status);
      throw new Error("PAYMENT_FAILED");
    }
    return { url: json.url };
  },
});

/* ---------- เรียกจาก webhook เท่านั้น: เปิดสิทธิ์หลังจ่ายเงินสำเร็จ (ทำซ้ำได้ไม่เพิ่มสิทธิ์ซ้ำ) ---------- */
export const grantFromCheckout = internalMutation({
  args: {
    stripeSessionId: v.string(),
    userId: v.string(),
    plan: planValidator,
    amount: v.number(),
    listAmount: v.optional(v.number()),
    couponCode: v.optional(v.string()),
    paymentIntentId: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, a) => {
    const dup = await ctx.db
      .query("memberships")
      .withIndex("by_stripeSessionId", (q) => q.eq("stripeSessionId", a.stripeSessionId))
      .unique();
    if (dup) return null;
    const userId = ctx.db.normalizeId("users", a.userId) as Id<"users"> | null;
    if (userId === null) {
      console.error("grantFromCheckout: unknown user", a.userId);
      return null;
    }
    const now = Date.now();
    // ต่ออายุแพ็กเกจเดิม = ต่อจากวันหมดอายุเดิม / เปลี่ยนแพ็กเกจ = เริ่มทันที
    const rows = await ctx.db.query("memberships").withIndex("by_userId", (q) => q.eq("userId", userId)).take(500);
    const samePlanEnd = Math.max(now, ...rows.filter((m) => m.status === "active" && m.plan === a.plan).map((m) => m.expiresAt));
    const startsAt = samePlanEnd;

    let indicatorBonus = false;
    if (a.plan === "vip") {
      const given = await ctx.db
        .query("memberships")
        .withIndex("by_plan_and_indicatorBonus", (q) => q.eq("plan", "vip").eq("indicatorBonus", true))
        .take(1000);
      // นับเป็น "คน" ที่ยังได้สิทธิ์อยู่ — รายการที่คืนเงิน/ยกเลิกแล้วไม่กินโควตา 10 คน · ต่ออายุ = ได้ต่อโดยไม่นับเพิ่ม
      const holders = new Set(given.filter((m) => m.status === "active").map((m) => m.userId));
      indicatorBonus = holders.has(userId) || holders.size < INDICATOR_BONUS_LIMIT;
    }

    const membershipId = await ctx.db.insert("memberships", {
      userId,
      plan: a.plan,
      status: "active",
      startsAt,
      expiresAt: startsAt + daysToMs(PLANS[a.plan].days),
      amount: a.amount,
      stripeSessionId: a.stripeSessionId,
      paymentIntentId: a.paymentIntentId,
      indicatorBonus,
      monthKey: bangkokMonthKey(now),
      source: "stripe",
      listAmount: a.listAmount ?? PLANS[a.plan].amount,
      couponCode: a.couponCode,
    });
    if (a.couponCode) {
      const code = a.couponCode;
      const c = await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", code)).first();
      if (c) await ctx.db.patch("coupons", c._id, { uses: c.uses + 1 });
    }
    await ctx.scheduler.runAfter(0, internal.telegram.notifySale, { membershipId });
    return null;
  },
});

/* ---------- เรียกจาก webhook: คืนเงินเต็มจำนวนแล้ว = ยกเลิกสิทธิ์ ---------- */
export const revokeByPaymentIntent = internalMutation({
  args: { paymentIntentId: v.string() },
  returns: v.null(),
  handler: async (ctx, { paymentIntentId }) => {
    const rows = await ctx.db
      .query("memberships")
      .withIndex("by_paymentIntentId", (q) => q.eq("paymentIntentId", paymentIntentId))
      .take(10);
    for (const m of rows) await ctx.db.patch(m._id, { status: "refunded" });
    return null;
  },
});
