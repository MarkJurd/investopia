/* หน้า /admin → แท็บ "สมาชิก" / "ยอดขาย" / "โค้ดส่วนลด" — แอดมินเท่านั้น (เช็กทุกฟังก์ชัน)
 * ให้สิทธิ์ด้วยมือ = แถวใหม่ในตาราง memberships (source: "manual", amount 0) → อยู่ในบันทึกยอดขายด้วย
 * ให้สิทธิ์อีเมลที่ยังไม่เคยล็อกอิน = เก็บใน pendingGrants แล้วเปิดใช้อัตโนมัติตอนล็อกอินครั้งแรก (convex/auth.ts) */
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { requireAdmin } from "./admin";
import { getMembership } from "./payments";
import { PLANS, planValidator, bangkokMonthKey, daysToMs, type PlanId } from "./plans";

const MAX_DAYS = 3650;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- ให้สิทธิ์ (ใช้ร่วมกับ auth.ts ตอนเปิดใช้สิทธิ์ที่รอไว้) ---------- */
export async function insertManualGrant(
  ctx: MutationCtx,
  a: { userId: Id<"users">; plan: PlanId; days: number; note: string; indicatorBonus: boolean },
): Promise<Id<"memberships">> {
  const now = Date.now();
  // ต่อจากวันหมดอายุของแพ็กเกจเดียวกัน (ถ้ายังไม่หมด) — เหมือนการซื้อต่ออายุ
  const rows = await ctx.db.query("memberships").withIndex("by_userId", (q) => q.eq("userId", a.userId)).take(500);
  const startsAt = Math.max(now, ...rows.filter((m) => m.status === "active" && m.plan === a.plan).map((m) => m.expiresAt));
  return await ctx.db.insert("memberships", {
    userId: a.userId,
    plan: a.plan,
    status: "active",
    startsAt,
    expiresAt: startsAt + daysToMs(a.days),
    amount: 0,
    stripeSessionId: `manual-${now}-${Math.random().toString(36).slice(2, 8)}`,
    paymentIntentId: null,
    indicatorBonus: a.indicatorBonus,
    monthKey: bangkokMonthKey(now),
    source: "manual",
    note: a.note,
  });
}

/** เรียกตอนผู้ใช้ล็อกอิน: มีสิทธิ์ที่แอดมินให้ไว้กับอีเมลนี้ไหม → เปิดใช้ */
export async function applyPendingGrants(ctx: MutationCtx, userId: Id<"users">): Promise<void> {
  const user = await ctx.db.get("users", userId);
  const email = user?.email?.toLowerCase();
  if (!email || user?.emailVerificationTime === undefined) return;   // ต้องเป็นอีเมลที่ Google ยืนยันแล้ว
  const pending = await ctx.db.query("pendingGrants").withIndex("by_email", (q) => q.eq("email", email)).take(20);
  for (const p of pending) {
    if (p.appliedAt !== null) continue;
    await insertManualGrant(ctx, { userId, plan: p.plan, days: p.days, note: p.note, indicatorBonus: p.plan === "vip" });
    await ctx.db.patch("pendingGrants", p._id, { appliedAt: Date.now() });
  }
}

function checkDays(days: number): number {
  const d = Math.round(days);
  if (!Number.isFinite(d) || d < 1 || d > MAX_DAYS) throw new ConvexError("BAD_DAYS");
  return d;
}

/* ---------- ค้นหาสมาชิก ---------- */
const memberRow = v.object({
  userId: v.id("users"), name: v.string(), email: v.string(),
  plan: v.union(planValidator, v.null()), expiresAt: v.union(v.number(), v.null()), indicatorBonus: v.boolean(),
});

async function toMemberRow(ctx: QueryCtx, user: Doc<"users">, now: number) {
  const m = await getMembership(ctx, user._id, now);
  return {
    userId: user._id, name: user.name ?? "", email: user.email ?? "",
    plan: m?.plan ?? null, expiresAt: m?.expiresAt ?? null, indicatorBonus: m?.indicatorBonus ?? false,
  };
}

/** q = อีเมล (ตรงทั้งหมด) · ไม่ใส่ = ผู้ที่ซื้อ/ได้สิทธิ์ล่าสุด 50 คน */
export const searchMembers = query({
  args: { q: v.string(), now: v.number() },
  returns: v.object({
    members: v.array(memberRow),
    pending: v.array(v.object({ id: v.id("pendingGrants"), email: v.string(), plan: planValidator, days: v.number(), note: v.string(), appliedAt: v.union(v.number(), v.null()) })),
  }),
  handler: async (ctx, { q, now }) => {
    await requireAdmin(ctx);
    const text = q.trim().toLowerCase();
    const members = [];
    if (text) {
      const users = await ctx.db.query("users").withIndex("email", (x) => x.eq("email", text)).take(5);
      for (const u of users) members.push(await toMemberRow(ctx, u, Math.max(now, Date.now())));
      const pending = await ctx.db.query("pendingGrants").withIndex("by_email", (x) => x.eq("email", text)).take(20);
      return { members, pending: pending.map((p) => ({ id: p._id, email: p.email, plan: p.plan, days: p.days, note: p.note, appliedAt: p.appliedAt })) };
    }
    const recent = await ctx.db.query("memberships").order("desc").take(200);
    const seen = new Set<string>();
    for (const m of recent) {
      if (seen.has(m.userId) || seen.size >= 50) continue;
      seen.add(m.userId);
      const u = await ctx.db.get("users", m.userId);
      if (u) members.push(await toMemberRow(ctx, u, Math.max(now, Date.now())));
    }
    const pending = await ctx.db.query("pendingGrants").order("desc").take(50);
    return {
      members,
      pending: pending.filter((p) => p.appliedAt === null).map((p) => ({ id: p._id, email: p.email, plan: p.plan, days: p.days, note: p.note, appliedAt: p.appliedAt })),
    };
  },
});

/* ---------- รายละเอียดสมาชิก 1 คน ---------- */
const membershipRow = v.object({
  id: v.id("memberships"), plan: planValidator, status: v.union(v.literal("active"), v.literal("refunded"), v.literal("revoked")),
  startsAt: v.number(), expiresAt: v.number(), amount: v.number(), listAmount: v.union(v.number(), v.null()),
  couponCode: v.union(v.string(), v.null()), source: v.union(v.literal("stripe"), v.literal("manual")),
  indicatorBonus: v.boolean(), note: v.string(), createdAt: v.number(),
});

function toMembershipRow(m: Doc<"memberships">) {
  return {
    id: m._id, plan: m.plan, status: m.status, startsAt: m.startsAt, expiresAt: m.expiresAt, amount: m.amount,
    listAmount: m.listAmount ?? null, couponCode: m.couponCode ?? null, source: m.source ?? ("stripe" as const),
    indicatorBonus: m.indicatorBonus, note: m.note ?? "", createdAt: m._creationTime,
  };
}

export const memberDetail = query({
  args: { userId: v.id("users"), now: v.number() },
  returns: v.union(v.null(), v.object({
    member: memberRow,
    rows: v.array(membershipRow),
    lessonsDone: v.number(),
    quizzesPassed: v.number(),
    displayName: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, { userId, now }) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get("users", userId);
    if (user === null) return null;
    const rows = await ctx.db.query("memberships").withIndex("by_userId", (q) => q.eq("userId", userId)).order("desc").take(100);
    const lessons = await ctx.db.query("lessonProgress").withIndex("by_userId_and_lessonId", (q) => q.eq("userId", userId)).take(500);
    const quizzes = await ctx.db.query("quizResults").withIndex("by_userId_and_moduleId", (q) => q.eq("userId", userId)).take(200);
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    return {
      member: await toMemberRow(ctx, user, Math.max(now, Date.now())),
      rows: rows.map(toMembershipRow),
      lessonsDone: lessons.length,
      quizzesPassed: quizzes.filter((q) => q.passed).length,
      displayName: profile?.displayName ?? null,
    };
  },
});

/* ---------- ให้ / ต่อ / ยกเลิกสิทธิ์ด้วยมือ ---------- */
export const grant = mutation({
  args: { email: v.string(), plan: planValidator, days: v.number(), note: v.string(), indicatorBonus: v.boolean() },
  returns: v.union(v.literal("granted"), v.literal("pending")),
  handler: async (ctx, a) => {
    await requireAdmin(ctx);
    const email = a.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ConvexError("BAD_EMAIL");
    const days = checkDays(a.days);
    const note = a.note.trim().slice(0, 300);
    const user = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
    if (user) {
      await insertManualGrant(ctx, { userId: user._id, plan: a.plan, days, note, indicatorBonus: a.indicatorBonus });
      return "granted" as const;
    }
    await ctx.db.insert("pendingGrants", { email, plan: a.plan, days, note, appliedAt: null });
    return "pending" as const;
  },
});

export const cancelPending = mutation({
  args: { id: v.id("pendingGrants") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const p = await ctx.db.get("pendingGrants", id);
    if (p && p.appliedAt === null) await ctx.db.delete("pendingGrants", id);
    return null;
  },
});

/** ยกเลิกสิทธิ์ 1 รายการ (ไม่คืนเงินให้อัตโนมัติ — ถ้าจะคืนเงิน ให้กดคืนใน Stripe ระบบจะยกเลิกสิทธิ์เอง) */
export const revoke = mutation({
  args: { id: v.id("memberships"), note: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, note }) => {
    await requireAdmin(ctx);
    const m = await ctx.db.get("memberships", id);
    if (m === null || m.status !== "active") return null;
    const extra = note.trim().slice(0, 300);
    await ctx.db.patch("memberships", id, {
      status: "revoked", changedAt: Date.now(),
      note: [m.note, extra && `ยกเลิก: ${extra}`].filter(Boolean).join(" · "),
    });
    return null;
  },
});

export const setIndicator = mutation({
  args: { id: v.id("memberships"), value: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, value }) => {
    await requireAdmin(ctx);
    await ctx.db.patch("memberships", id, { indicatorBonus: value, changedAt: Date.now() });
    return null;
  },
});

export const setNote = mutation({
  args: { id: v.id("memberships"), note: v.string() },
  returns: v.null(),
  handler: async (ctx, { id, note }) => {
    await requireAdmin(ctx);
    await ctx.db.patch("memberships", id, { note: note.trim().slice(0, 500) });
    return null;
  },
});

/* ---------- บันทึกยอดขาย ---------- */
const saleRow = v.object({
  id: v.id("memberships"), createdAt: v.number(), userId: v.id("users"), name: v.string(), email: v.string(),
  plan: planValidator, amount: v.number(), listAmount: v.union(v.number(), v.null()), couponCode: v.union(v.string(), v.null()),
  source: v.union(v.literal("stripe"), v.literal("manual")), status: v.union(v.literal("active"), v.literal("refunded"), v.literal("revoked")),
  expiresAt: v.number(), indicatorBonus: v.boolean(), note: v.string(), paymentIntentId: v.union(v.string(), v.null()),
});

async function toSaleRow(ctx: QueryCtx, m: Doc<"memberships">) {
  const u = await ctx.db.get("users", m.userId);
  return {
    id: m._id, createdAt: m._creationTime, userId: m.userId, name: u?.name ?? "", email: u?.email ?? "",
    plan: m.plan, amount: m.amount, listAmount: m.listAmount ?? null, couponCode: m.couponCode ?? null,
    source: m.source ?? ("stripe" as const), status: m.status, expiresAt: m.expiresAt, indicatorBonus: m.indicatorBonus,
    note: m.note ?? "", paymentIntentId: m.paymentIntentId,
  };
}

export const sales = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: v.object({ page: v.array(saleRow), isDone: v.boolean(), continueCursor: v.string(), splitCursor: v.optional(v.union(v.string(), v.null())), pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())) }),
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    const result = await ctx.db.query("memberships").order("desc").paginate(paginationOpts);
    const page = [];
    for (const m of result.page) page.push(await toSaleRow(ctx, m));
    return { ...result, page };
  },
});

/** สรุปยอด (นับจากรายการล่าสุดไม่เกิน 5,000 รายการ) + ไฟล์ CSV ใช้ข้อมูลชุดเดียวกัน */
export const salesSummary = query({
  args: { now: v.number() },
  returns: v.object({
    thisMonth: v.object({ revenue: v.number(), count: v.number() }),
    lastMonth: v.object({ revenue: v.number(), count: v.number() }),
    allTime: v.object({ revenue: v.number(), count: v.number(), refunded: v.number() }),
    activeMembers: v.number(),
    indicatorGiven: v.number(),
    capped: v.boolean(),
  }),
  handler: async (ctx, { now }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("memberships").order("desc").take(5000);
    const thisKey = bangkokMonthKey(now);
    const d = new Date(now + 7 * 3600 * 1000);
    const lastKey = bangkokMonthKey(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 15));
    const out = { thisMonth: { revenue: 0, count: 0 }, lastMonth: { revenue: 0, count: 0 }, allTime: { revenue: 0, count: 0, refunded: 0 } };
    const active = new Set<string>();
    let indicatorGiven = 0;
    for (const m of rows) {
      const paid = (m.source ?? "stripe") === "stripe";
      if (m.status === "refunded") out.allTime.refunded += m.amount;
      if (m.status === "active" && m.startsAt <= now && m.expiresAt > now) active.add(m.userId);
      if (m.status === "active" && m.indicatorBonus && m.plan === "yearly") indicatorGiven++;
      if (!paid || m.status === "refunded") continue;
      out.allTime.revenue += m.amount; out.allTime.count++;
      if (m.monthKey === thisKey) { out.thisMonth.revenue += m.amount; out.thisMonth.count++; }
      if (m.monthKey === lastKey) { out.lastMonth.revenue += m.amount; out.lastMonth.count++; }
    }
    return { ...out, activeMembers: active.size, indicatorGiven, capped: rows.length >= 5000 };
  },
});

export const salesExport = query({
  args: {},
  returns: v.array(saleRow),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("memberships").order("desc").take(5000);
    const out = [];
    for (const m of rows) out.push(await toSaleRow(ctx, m));
    return out;
  },
});

/* ---------- โค้ดส่วนลด ---------- */
const couponRow = v.object({
  id: v.id("coupons"), code: v.string(), kind: v.union(v.literal("percent"), v.literal("amount")), value: v.number(),
  plans: v.array(planValidator), maxUses: v.union(v.number(), v.null()), uses: v.number(),
  expiresAt: v.union(v.number(), v.null()), active: v.boolean(), note: v.string(), createdAt: v.number(),
});

export const coupons = query({
  args: {},
  returns: v.array(couponRow),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("coupons").order("desc").take(200);
    return rows.map((c) => ({
      id: c._id, code: c.code, kind: c.kind, value: c.value, plans: c.plans, maxUses: c.maxUses, uses: c.uses,
      expiresAt: c.expiresAt, active: c.active, note: c.note, createdAt: c._creationTime,
    }));
  },
});

export const createCoupon = mutation({
  args: {
    code: v.string(), kind: v.union(v.literal("percent"), v.literal("amount")), value: v.number(),
    plans: v.array(planValidator), maxUses: v.union(v.number(), v.null()), expiresAt: v.union(v.number(), v.null()), note: v.string(),
  },
  returns: v.id("coupons"),
  handler: async (ctx, a) => {
    await requireAdmin(ctx);
    const code = a.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new ConvexError("BAD_CODE");
    if ((await ctx.db.query("coupons").withIndex("by_code", (q) => q.eq("code", code)).first()) !== null) throw new ConvexError("CODE_TAKEN");
    const value = Math.round(a.value);
    if (a.kind === "percent" && (value < 1 || value > 90)) throw new ConvexError("BAD_VALUE");
    if (a.kind === "amount" && (value < 1 || a.plans.some((p) => PLANS[p].amount - value < 20))) throw new ConvexError("BAD_VALUE");
    if (a.plans.length === 0) throw new ConvexError("NO_PLANS");
    if (a.maxUses !== null && (!Number.isInteger(a.maxUses) || a.maxUses < 1)) throw new ConvexError("BAD_VALUE");
    return await ctx.db.insert("coupons", {
      code, kind: a.kind, value, plans: [...new Set(a.plans)], maxUses: a.maxUses, uses: 0,
      expiresAt: a.expiresAt, active: true, note: a.note.trim().slice(0, 200),
    });
  },
});

export const setCouponActive = mutation({
  args: { id: v.id("coupons"), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, active }) => {
    await requireAdmin(ctx);
    await ctx.db.patch("coupons", id, { active });
    return null;
  },
});
