import { action, internalMutation, internalQuery, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  PLANS, planValidator, VIP_SEATS_PER_MONTH, INDICATOR_BONUS_LIMIT, daysToMs, bangkokMonthKey,
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

/* ---------- สิทธิ์ปัจจุบันของผู้ใช้ที่ล็อกอินอยู่ ---------- */
export const myMembership = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({ plan: planValidator, expiresAt: v.number(), indicatorBonus: v.boolean() }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const now = Date.now();
    const rows = await ctx.db.query("memberships").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
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
  },
});

export const userEmail = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { userId }) => (await ctx.db.get(userId))?.email ?? null,
});

/* ---------- เริ่มจ่ายเงิน: สร้าง Stripe Checkout แล้วส่ง URL กลับไปให้หน้าเว็บพาไป ---------- */
export const createCheckout = action({
  args: { plan: planValidator, lang: v.optional(v.union(v.literal("th"), v.literal("en"))) },
  returns: v.object({ url: v.string() }),
  handler: async (ctx, { plan, lang }): Promise<{ url: string }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("NOT_SIGNED_IN");
    if (plan === "vip") {
      const left: number = await ctx.runQuery(internal.payments.vipSeatsLeftInternal, {});
      if (left <= 0) throw new Error("VIP_FULL");
    }
    const secret = process.env.STRIPE_SECRET_KEY;
    const site = process.env.SITE_URL;
    if (!secret || !site) throw new Error("PAYMENT_NOT_CONFIGURED");

    const p = PLANS[plan];
    const en = lang === "en";
    const home = `${site}${en ? "/en" : "/"}`;
    const email: string | null = await ctx.runQuery(internal.payments.userEmail, { userId });
    const form = new URLSearchParams({
      mode: "payment",
      locale: en ? "en" : "th",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "thb",
      "line_items[0][price_data][unit_amount]": String(p.amount * 100), // สตางค์
      "line_items[0][price_data][product_data][name]": en ? p.nameEn : p.name,
      success_url: `${home}?checkout=success`,
      cancel_url: `${home}?checkout=cancel#pricing`,
      client_reference_id: userId,
      "metadata[userId]": userId,
      "metadata[plan]": plan,
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
    const rows = await ctx.db.query("memberships").withIndex("by_userId", (q) => q.eq("userId", userId)).collect();
    const samePlanEnd = Math.max(now, ...rows.filter((m) => m.status === "active" && m.plan === a.plan).map((m) => m.expiresAt));
    const startsAt = samePlanEnd;

    let indicatorBonus = a.plan === "vip";
    if (a.plan === "yearly") {
      const given = await ctx.db
        .query("memberships")
        .withIndex("by_plan_and_indicatorBonus", (q) => q.eq("plan", "yearly").eq("indicatorBonus", true))
        .take(INDICATOR_BONUS_LIMIT);
      indicatorBonus = given.length < INDICATOR_BONUS_LIMIT;
    }

    await ctx.db.insert("memberships", {
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
    });
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
