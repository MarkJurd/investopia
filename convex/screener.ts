/* เครื่องมือเทียบงบการเงินกับคู่แข่ง (/tools/screener) — เฉพาะสมาชิกที่ยังไม่หมดอายุ + แอดมิน
 * ส่วนนี้: เช็กสิทธิ์ + อ่าน/เขียนฐานข้อมูล · การดึงจาก SEC + งานอัปเดตอัตโนมัติอยู่ที่ convex/screenerSec.ts */
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getMembership } from "./payments";
import { isAdminUser } from "./admin";

export const screenerYearValidator = v.object({
  end: v.string(),
  revenue: v.optional(v.number()),
  grossProfit: v.optional(v.number()),
  sga: v.optional(v.number()),
  operatingIncome: v.optional(v.number()),
  interestExpense: v.optional(v.number()),
  netIncome: v.optional(v.number()),
  depreciation: v.optional(v.number()),
  longTermDebt: v.optional(v.number()),
  est: v.optional(v.array(v.string())),   // รายการที่ประมาณเอง (งบไม่ได้แสดงตรงๆ) เช่น ["grossProfit"]
});

export const companyValidator = v.object({
  cik: v.number(),
  ticker: v.string(),
  name: v.string(),
  exchange: v.string(),
  sic: v.optional(v.string()),
  sicDesc: v.optional(v.string()),
  lastFiled: v.optional(v.string()),
  fetchedAt: v.number(),
  ver: v.optional(v.number()),
  years: v.array(screenerYearValidator),
});

/** ผู้ที่ไม่ใช่สมาชิก: ดูงบเทียบคู่แข่งได้วันละกี่บริษัท */
export const FREE_PER_DAY = 5;
/** วันที่ตามเวลาไทย "YYYY-MM-DD" (โควตารีเซ็ตเที่ยงคืนเวลาไทย) */
export const bangkokDay = (ms = Date.now()) => new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);

const strip = ({ _id, _creationTime, ...c }: Doc<"screenerCompanies">) => { void _id; void _creationTime; return c; };

const accessValidator = v.union(v.literal("signedOut"), v.literal("noMembership"), v.literal("ok"));

async function accessOf(ctx: QueryCtx, userId: Id<"users"> | null, now: number) {
  if (userId === null) return "signedOut" as const;
  if (await isAdminUser(ctx, userId)) return "ok" as const;
  return (await getMembership(ctx, userId, now)) === null ? ("noMembership" as const) : ("ok" as const);
}

/** หน้าเว็บใช้เลือกว่าจะแสดงปุ่มล็อกอิน / ปุ่มดูแพ็กเกจ / เครื่องมือ */
export const access = query({
  args: { now: v.number() },
  returns: accessValidator,
  handler: async (ctx, { now }) => accessOf(ctx, await getAuthUserId(ctx), now),
});

export const accessFor = internalQuery({
  args: { userId: v.id("users") },
  returns: accessValidator,
  handler: async (ctx, { userId }) => accessOf(ctx, userId, Date.now()),
});

/** คำแนะนำตอนพิมพ์ค้นหา: ticker ที่ขึ้นต้นด้วยคำค้น + ชื่อบริษัท */
export const suggest = query({
  args: { q: v.string(), now: v.number() },
  returns: v.array(v.object({ ticker: v.string(), name: v.string() })),
  handler: async (ctx, { q, now }) => {
    const text = q.trim().slice(0, 40);
    void now;
    if (text === "" || (await getAuthUserId(ctx)) === null) return [];
    const up = text.toUpperCase();
    const out = new Map<string, string>();
    const byTicker = await ctx.db.query("screenerTickers").withIndex("by_ticker", (x) => x.gte("ticker", up).lt("ticker", `${up}￿`)).take(6);
    for (const t of byTicker) {
      const c = await ctx.db.query("screenerCompanies").withIndex("by_cik", (x) => x.eq("cik", t.cik)).unique();
      if (c) out.set(t.ticker, c.name);
    }
    for (const c of await ctx.db.query("screenerCompanies").withSearchIndex("search_name", (x) => x.search("name", text)).take(6)) {
      if (!out.has(c.ticker)) out.set(c.ticker, c.name);
    }
    return [...out].slice(0, 8).map(([ticker, name]) => ({ ticker, name }));
  },
});

/* ---------- ใช้ภายใน (เรียกจาก convex/screenerSec.ts) ---------- */

export const lookup = internalQuery({
  args: { ticker: v.string() },
  returns: v.union(companyValidator, v.null()),
  handler: async (ctx, { ticker }) => {
    const t = await ctx.db.query("screenerTickers").withIndex("by_ticker", (x) => x.eq("ticker", ticker.trim().toUpperCase())).unique();
    if (t === null) return null;
    const c = await ctx.db.query("screenerCompanies").withIndex("by_cik", (x) => x.eq("cik", t.cik)).unique();
    return c === null ? null : strip(c);
  },
});

/** คู่แข่ง = รหัสอุตสาหกรรม (SIC) เดียวกัน ที่มีงบปีล่าสุดไม่เก่ากว่า 2 ปี เรียงตามขนาดรายได้ที่ใกล้เคียงที่สุด */
export const peersBySic = internalQuery({
  args: { cik: v.number(), sic: v.string(), revenue: v.number(), now: v.number(), limit: v.number() },
  returns: v.array(companyValidator),
  handler: async (ctx, { cik, sic, revenue, now, limit }) => {
    const minEnd = new Date(now - 2 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const rows = await ctx.db.query("screenerCompanies").withIndex("by_sic", (x) => x.eq("sic", sic)).take(1000);
    const scored = rows.flatMap((c) => {
      const y = c.years[c.years.length - 1];
      if (c.cik === cik || !y || y.end < minEnd || !(y.revenue && y.revenue > 0) || y.netIncome === undefined) return [];
      return [{ c, d: Math.abs(Math.log(y.revenue / revenue)) }];
    });
    return scored.sort((a, b) => a.d - b.d).slice(0, limit).map((s) => strip(s.c));
  },
});

/** รายชื่อหุ้นจาก SEC: เพิ่มบริษัทใหม่ / อัปเดตชื่อ-ticker (ไม่แตะงบที่ดึงไว้แล้ว) */
export const upsertUniverse = internalMutation({
  args: { rows: v.array(v.object({ cik: v.number(), name: v.string(), exchange: v.string(), tickers: v.array(v.string()) })) },
  returns: v.null(),
  handler: async (ctx, { rows }) => {
    for (const r of rows) {
      const c = await ctx.db.query("screenerCompanies").withIndex("by_cik", (x) => x.eq("cik", r.cik)).unique();
      if (c === null) await ctx.db.insert("screenerCompanies", { cik: r.cik, ticker: r.tickers[0], name: r.name, exchange: r.exchange, fetchedAt: 0, years: [] });
      else if (c.ticker !== r.tickers[0] || c.exchange !== r.exchange) await ctx.db.patch("screenerCompanies", c._id, { ticker: r.tickers[0], exchange: r.exchange });
      for (const ticker of r.tickers) {
        const t = await ctx.db.query("screenerTickers").withIndex("by_ticker", (x) => x.eq("ticker", ticker)).unique();
        if (t === null) await ctx.db.insert("screenerTickers", { ticker, cik: r.cik });
        else if (t.cik !== r.cik) await ctx.db.patch("screenerTickers", t._id, { cik: r.cik });   // ticker ถูกเอาไปใช้กับบริษัทอื่น
      }
    }
    return null;
  },
});

export const page = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  returns: v.object({
    page: v.array(v.object({ cik: v.number(), lastFiled: v.optional(v.string()), fetchedAt: v.number(), ver: v.optional(v.number()) })),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, { cursor, numItems }) => {
    const r = await ctx.db.query("screenerCompanies").paginate({ cursor, numItems });
    return { page: r.page.map((c) => ({ cik: c.cik, lastFiled: c.lastFiled, fetchedAt: c.fetchedAt, ver: c.ver })), continueCursor: r.continueCursor, isDone: r.isDone };
  },
});

export const saveCompany = internalMutation({
  args: {
    cik: v.number(),
    name: v.string(),
    sic: v.optional(v.string()),
    sicDesc: v.optional(v.string()),
    lastFiled: v.optional(v.string()),
    fetchedAt: v.number(),
    years: v.optional(v.array(screenerYearValidator)),   // ไม่ส่ง = งบไม่เปลี่ยน แค่บันทึกว่าตรวจแล้ว
    ver: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, { cik, years, ver, ...rest }) => {
    const c = await ctx.db.query("screenerCompanies").withIndex("by_cik", (x) => x.eq("cik", cik)).unique();
    if (c !== null) await ctx.db.patch("screenerCompanies", c._id, years === undefined ? rest : { ...rest, years, ver });
    return null;
  },
});

/* ---------- โควตาฟรี (ผู้ที่ไม่ใช่สมาชิก) ---------- */

export const quotaFor = internalQuery({
  args: { userId: v.id("users"), day: v.string(), add: v.string() },
  returns: v.object({ allowed: v.boolean(), used: v.number() }),
  handler: async (ctx, { userId, day, add }) => {
    const row = await ctx.db.query("toolUsage").withIndex("by_userId_and_day", (q) => q.eq("userId", userId).eq("day", day)).unique();
    const seen = row?.tickers ?? [];
    if (seen.includes(add)) return { allowed: true, used: seen.length };
    return { allowed: seen.length < FREE_PER_DAY, used: seen.length + 1 };
  },
});

export const useQuota = internalMutation({
  args: { userId: v.id("users"), day: v.string(), ticker: v.string() },
  returns: v.null(),
  handler: async (ctx, { userId, day, ticker }) => {
    const row = await ctx.db.query("toolUsage").withIndex("by_userId_and_day", (q) => q.eq("userId", userId).eq("day", day)).unique();
    if (row === null) await ctx.db.insert("toolUsage", { userId, day, tickers: [ticker] });
    else if (!row.tickers.includes(ticker)) {
      if (row.tickers.length >= FREE_PER_DAY) throw new ConvexError("QUOTA");   // กันกดพร้อมกันหลายแท็บ
      await ctx.db.patch("toolUsage", row._id, { tickers: [...row.tickers, ticker] });
    }
    return null;
  },
});

/** หน้าเว็บแสดง "วันนี้เหลือกี่บริษัท" · null = ยังไม่ล็อกอิน */
export const myQuota = query({
  args: { now: v.number() },
  returns: v.union(v.null(), v.object({ member: v.boolean(), used: v.number(), limit: v.number() })),
  handler: async (ctx, { now }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    if ((await accessOf(ctx, userId, now)) === "ok") return { member: true, used: 0, limit: FREE_PER_DAY };
    const row = await ctx.db.query("toolUsage").withIndex("by_userId_and_day", (q) => q.eq("userId", userId).eq("day", bangkokDay(now))).unique();
    return { member: false, used: row?.tickers.length ?? 0, limit: FREE_PER_DAY };
  },
});
