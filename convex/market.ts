/* ราคาปัจจุบัน + แนวรับ–แนวต้าน (หน้าหุ้น /tools/stock/...) — ใช้ฟรี แต่ต้องล็อกอิน (กันบอทยิงแหล่งข้อมูล)
 * แหล่งข้อมูล: Yahoo Finance chart endpoint (ไม่เป็นทางการ ไม่มีสัญญา — ดู fetchYahoo) ราคาอาจดีเลย์
 * เปลี่ยนแหล่งข้อมูลได้ที่ fetchYahoo() ที่เดียว (ต้องคืน type Snapshot) · คำนวณแนวที่ lib/sr.ts */
import { action, internalMutation, internalQuery } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { computeSr, nearestLevels, type Bar, type Horizon, type Level, type Trend } from "../lib/sr";

const CACHE_MS = 60 * 1000;
const STALE_OK_MS = 6 * 60 * 60 * 1000;   // ดึงใหม่ไม่ได้ → ใช้ของเก่าไม่เกิน 6 ชม. (แจ้งผู้ใช้ว่าเก่า)

const barValidator = v.object({ t: v.number(), o: v.number(), h: v.number(), l: v.number(), c: v.number() });
const snapshotValidator = v.object({
  symbol: v.string(), fetchedAt: v.number(), name: v.string(), currency: v.string(), price: v.number(),
  regStart: v.number(), regEnd: v.number(), bars: v.array(barValidator),
});
type Snapshot = {
  symbol: string; fetchedAt: number; name: string; currency: string; price: number;
  regStart: number; regEnd: number; bars: Bar[];
};

type LevelsOut = {
  symbol: string; name: string; currency: string; price: number; prevClose: number | null; weekClose: number | null; asOf: number; live: boolean; stale: boolean;
  trend: Trend; atr: number | null; ema50: number | null; ema200: number | null; levels: Record<Horizon, Level[]>;
} | null;

const levelValidator = v.object({
  kind: v.union(v.literal("support"), v.literal("resistance")),
  price: v.number(), distPct: v.number(), distAtr: v.union(v.number(), v.null()),
  stars: v.number(), tools: v.array(v.string()), labels: v.array(v.string()), touches: v.number(), score: v.number(),
});

export const cached = internalQuery({
  args: { symbol: v.string() },
  returns: v.union(snapshotValidator, v.null()),
  handler: async (ctx, { symbol }) => {
    const r = await ctx.db.query("marketCache").withIndex("by_symbol", (q) => q.eq("symbol", symbol)).unique();
    return r === null ? null : { symbol: r.symbol, fetchedAt: r.fetchedAt, name: r.name, currency: r.currency, price: r.price, regStart: r.regStart, regEnd: r.regEnd, bars: r.bars };
  },
});

export const save = internalMutation({
  args: snapshotValidator,
  returns: v.null(),
  handler: async (ctx, snap) => {
    const r = await ctx.db.query("marketCache").withIndex("by_symbol", (q) => q.eq("symbol", snap.symbol)).unique();
    if (r === null) await ctx.db.insert("marketCache", snap);
    else await ctx.db.replace("marketCache", r._id, snap);
    return null;
  },
});

type Chart = {
  chart?: { result?: {
    meta: { regularMarketPrice?: number; currency?: string; longName?: string; shortName?: string; instrumentType?: string; currentTradingPeriod?: { regular?: { start: number; end: number } } };
    timestamp?: number[];
    indicators: { quote: { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[] }[] };
  }[] };
};

/** null = ไม่พบหุ้นนี้ (หรือไม่ใช่หุ้น/ETF) · throw = แหล่งข้อมูลล่ม */
async function fetchYahoo(symbol: string): Promise<Snapshot | null> {
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2y&includePrePost=false`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; INVESTOPIA)" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`yahoo ${res.status}`);
  const r = ((await res.json()) as Chart).chart?.result?.[0];
  const q = r?.indicators.quote[0];
  if (!r || !q || !r.timestamp || r.meta.regularMarketPrice === undefined) return null;
  if (r.meta.instrumentType !== "EQUITY" && r.meta.instrumentType !== "ETF") return null;
  const bars: Bar[] = [];
  r.timestamp.forEach((t, i) => {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
    if (o != null && h != null && l != null && c != null) bars.push({ t, o, h, l, c });
  });
  const reg = r.meta.currentTradingPeriod?.regular;
  return {
    symbol, fetchedAt: Date.now(), name: r.meta.longName ?? r.meta.shortName ?? symbol, currency: r.meta.currency ?? "USD",
    price: r.meta.regularMarketPrice, regStart: reg?.start ?? 0, regEnd: reg?.end ?? 0, bars,
  };
}

export const levels = action({
  args: { symbol: v.string() },
  returns: v.union(v.null(), v.object({
    symbol: v.string(), name: v.string(), currency: v.string(),
    price: v.number(), prevClose: v.union(v.number(), v.null()), weekClose: v.union(v.number(), v.null()), asOf: v.number(), live: v.boolean(), stale: v.boolean(),
    trend: v.union(v.literal("up"), v.literal("down"), v.literal("sideways")),
    atr: v.union(v.number(), v.null()), ema50: v.union(v.number(), v.null()), ema200: v.union(v.number(), v.null()),
    levels: v.object({ short: v.array(levelValidator), long: v.array(levelValidator) }),
  })),
  handler: async (ctx, { symbol }): Promise<LevelsOut> => {
    if ((await getAuthUserId(ctx)) === null) throw new ConvexError("NOT_SIGNED_IN");
    return await levelsFor(ctx, symbol);
  },
});

/** ราคา + แนวรับ–ต้านของหุ้น 1 ตัว (ใช้ทั้งหน้าหุ้น, Watchlist และสรุปรายสัปดาห์) · null = ไม่พบ/ข้อมูลน้อยเกินไป */
export async function levelsFor(ctx: ActionCtx, raw: string): Promise<LevelsOut> {
  const symbol = raw.trim().toUpperCase().replace(/\./g, "-");   // BRK.B → BRK-B (รูปแบบของ Yahoo)
  if (!/^[A-Z0-9][A-Z0-9-]{0,9}$/.test(symbol)) return null;

  let snap: Snapshot | null = await ctx.runQuery(internal.market.cached, { symbol });
  let stale = false;
  if (snap === null || Date.now() - snap.fetchedAt > CACHE_MS) {
    try {
      const fresh = await fetchYahoo(symbol);
      if (fresh === null) return null;
      await ctx.runMutation(internal.market.save, fresh);
      snap = fresh;
    } catch (e) {
      console.error(e);
      if (snap === null || Date.now() - snap.fetchedAt > STALE_OK_MS) throw new ConvexError("UPSTREAM");
      stale = true;
    }
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const live = snap.regStart > 0 && nowSec >= snap.regStart && nowSec < snap.regEnd && !stale;
  const bars = snap.bars.slice();
  // ตลาดเปิดอยู่: แท่งวันนี้ยังไม่ปิด ใช้ราคาปัจจุบันเป็น close ล่าสุด
  if (live && bars.length > 0 && bars[bars.length - 1].t >= snap.regStart) {
    const last = bars[bars.length - 1];
    bars[bars.length - 1] = { ...last, c: snap.price, h: Math.max(last.h, snap.price), l: Math.min(last.l, snap.price) };
  }
  const sr = computeSr(bars, snap.price, live);
  if (sr === null) return null;   // ประวัติราคาน้อยเกินไป (เช่น เพิ่งเข้าตลาด)
  const { price, ...rest } = sr;
  return {
    symbol, name: snap.name, currency: snap.currency, price, prevClose: bars.length >= 2 ? bars[bars.length - 2].c : null,
    weekClose: bars.length >= 6 ? bars[bars.length - 6].c : null,   // ราคาปิดเมื่อ 5 วันทำการก่อน
    asOf: snap.fetchedAt, live, stale, ...rest,
  };
}

const levelLite = v.union(v.null(), v.object({ price: v.number(), distPct: v.number(), stars: v.number() }));
type LevelLite = { price: number; distPct: number; stars: number } | null;
type WatchItem = { symbol: string; name: string; currency: string; price: number; changePct: number | null; support: LevelLite; resistance: LevelLite }
  | { symbol: string; missing: true };

/** ราคา + แนวใกล้สุดของทุกตัวใน Watchlist ของผู้ใช้ (ตัวที่ดึงไม่ได้ → missing) */
export const watchlistView = action({
  args: {},
  returns: v.array(v.union(
    v.object({ symbol: v.string(), name: v.string(), currency: v.string(), price: v.number(), changePct: v.union(v.number(), v.null()), support: levelLite, resistance: levelLite }),
    v.object({ symbol: v.string(), missing: v.literal(true) }),
  )),
  handler: async (ctx): Promise<WatchItem[]> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
    const symbols: string[] = await ctx.runQuery(internal.watchlist.symbolsFor, { userId });
    const out: WatchItem[] = [];
    for (const symbol of symbols) {
      let d: LevelsOut = null;
      try { d = await levelsFor(ctx, symbol); } catch (e) { console.error(symbol, e); }
      if (!d) { out.push({ symbol, missing: true }); continue; }
      const n = nearestLevels(d.levels.short, d.levels.long);
      const lite = (l: Level | null): LevelLite => (l ? { price: l.price, distPct: l.distPct, stars: l.stars } : null);
      out.push({ symbol: d.symbol, name: d.name, currency: d.currency, price: d.price,
        changePct: d.prevClose ? ((d.price - d.prevClose) / d.prevClose) * 100 : null, support: lite(n.support), resistance: lite(n.resistance) });
    }
    return out;
  },
});
