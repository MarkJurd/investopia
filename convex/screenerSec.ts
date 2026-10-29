"use node";
/* ดึงงบปี (10-K) จาก SEC EDGAR สำหรับเครื่องมือเทียบงบ (/tools/screener) — หุ้น NYSE/Nasdaq ทั้งหมด (~6,000 บริษัท)
 * ใช้ Node runtime เพราะไฟล์ companyfacts ของบริษัทใหญ่ใหญ่หลาย MB (runtime ปกติหน่วยความจำไม่พอ)
 * SEC กำหนดให้ระบุ User-Agent ที่ติดต่อได้ และไม่เกิน 10 ครั้ง/วินาที → เว้น 250ms ทุกครั้ง (≈4 ครั้ง/วินาที)
 * อัปเดตอัตโนมัติทุกสัปดาห์ (convex/crons.ts): ตรวจวันยื่น 10-K ของทุกบริษัท ดึงงบใหม่เฉพาะบริษัทที่ยื่นงบใหม่ */
import { action, internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { findGroup, type YearFacts } from "../lib/screener";
import { companyValidator, FREE_PER_DAY, bangkokDay } from "./screener";

const UA = { "User-Agent": "INVESTOPIA investopia.admin@gmail.com", Accept: "application/json" };
const PACE_MS = 250;
const BATCH = 40;            // บริษัทต่อ 1 รอบ action (~40–60 วินาที)
const SIC_PEERS = 7;         // จำนวนคู่แข่งจาก SIC
const KEEP_YEARS = 10;
const EXTRACT_VERSION = 2;   // เพิ่มเลขนี้เมื่อแก้วิธีอ่านงบ → รอบอัปเดตถัดไปจะดึงงบทุกบริษัทใหม่
const DAY = 24 * 60 * 60 * 1000;

type Fact = { start?: string; end: string; val: number; form: string; filed: string };
type Facts = Record<string, { units?: { USD?: Fact[] } }>;

/** ค่ารายปีของรายการหนึ่ง: key = วันสิ้นปีบัญชี · ลองชื่อรายการ (XBRL tag) ตามลำดับ ปีที่ชื่อแรกไม่มีค่อยใช้ชื่อถัดไป
 *  flow (รายได้/ค่าใช้จ่าย) = ช่วงเวลา ~1 ปี · instant (หนี้) = ยอด ณ วันสิ้นปี · ค่าซ้ำใช้ตัวที่ยื่นล่าสุด (งบแก้ไข) */
function annual(facts: Facts, tags: string[], instant = false): Map<string, number> {
  const out = new Map<string, number>();
  for (const tag of tags) {
    const best = new Map<string, Fact>();
    for (const f of facts[tag]?.units?.USD ?? []) {
      if (!f.form.startsWith("10-K")) continue;
      if (instant ? f.start !== undefined : f.start === undefined) continue;
      if (!instant) {
        const days = (Date.parse(f.end) - Date.parse(f.start as string)) / DAY;
        if (days < 350 || days > 380) continue;
      }
      const prev = best.get(f.end);
      if (!prev || f.filed > prev.filed) best.set(f.end, f);
    }
    for (const [end, f] of best) if (!out.has(end)) out.set(end, f.val);
  }
  return out;
}

function extractYears(facts: Facts): YearFacts[] {
  const revenue = annual(facts, ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet", "SalesRevenueGoodsNet"]);
  const gross = annual(facts, ["GrossProfit"]);
  const cost = annual(facts, ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold"]);
  const sga = annual(facts, ["SellingGeneralAndAdministrativeExpense"]);
  const selling = annual(facts, ["SellingAndMarketingExpense"]);
  const ga = annual(facts, ["GeneralAndAdministrativeExpense"]);
  const op = annual(facts, ["OperatingIncomeLoss"]);
  const totalCosts = annual(facts, ["CostsAndExpenses", "OperatingCostsAndExpenses"]);
  const interest = annual(facts, ["InterestExpense", "InterestExpenseNonoperating", "InterestExpenseDebt", "InterestAndDebtExpense"]);
  const net = annual(facts, ["NetIncomeLoss", "ProfitLoss"]);
  const dep = annual(facts, ["DepreciationDepletionAndAmortization", "DepreciationAndAmortization", "DepreciationAmortizationAndAccretionNet", "Depreciation"]);
  const debtTotal = annual(facts, ["LongTermDebt"], true);
  const debtNon = annual(facts, ["LongTermDebtNoncurrent", "LongTermDebtAndCapitalLeaseObligations"], true);
  const debtCur = annual(facts, ["LongTermDebtCurrent", "LongTermDebtAndCapitalLeaseObligationsCurrent"], true);

  const ends = [...new Set([...revenue.keys(), ...net.keys()])].sort().slice(-KEEP_YEARS);
  return ends.map((end) => {
    const r = revenue.get(end);
    const c = cost.get(end);
    const s = selling.get(end);
    const g = ga.get(end);
    const dn = debtNon.get(end);
    const d = dep.get(end);
    const est: string[] = [];
    let sgaV = sga.get(end) ?? (s !== undefined && g !== undefined ? s + g : undefined);
    if (sgaV === undefined && g !== undefined) { sgaV = g; est.push("sga"); }   // มีแต่ค่าใช้จ่ายบริหาร (G&A)
    let gp = gross.get(end) ?? (r !== undefined && c !== undefined ? r - c : undefined);
    // งบไม่มีกำไรขั้นต้น (เช่น ร้านอาหาร): ประมาณ = รายได้ − (ค่าใช้จ่ายรวม − SG&A − ค่าเสื่อม) ใกล้เคียงวิธีของเว็บข้อมูลหุ้นทั่วไป
    const tc = totalCosts.get(end);
    if (gp === undefined && r !== undefined && tc !== undefined && sgaV !== undefined) {
      const cogs = tc - sgaV - (d ?? 0);
      if (cogs > 0 && cogs < r * 1.5) { gp = r - cogs; est.push("grossProfit"); }
    }
    return {
      end,
      revenue: r,
      grossProfit: gp,
      sga: sgaV,
      ...(est.length ? { est } : {}),
      operatingIncome: op.get(end),
      interestExpense: interest.get(end),
      netIncome: net.get(end),
      depreciation: d,
      longTermDebt: debtTotal.get(end) ?? (dn !== undefined ? dn + (debtCur.get(end) ?? 0) : undefined),
    };
  });
}

class SecError extends Error {
  constructor(public status: number, url: string) { super(`SEC ${status} ${url}`); }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<unknown> {
  await sleep(PACE_MS);
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new SecError(res.status, url);
  return res.json();
}

const pad = (cik: number) => String(cik).padStart(10, "0");

type Known = { cik: number; lastFiled?: string; fetchedAt: number; ver?: number };
type Submissions = { name?: string; sic?: string; sicDescription?: string; filings?: { recent?: { form: string[]; filingDate: string[] } } };

/** ตรวจ 1 บริษัท: ดูวันยื่น 10-K ล่าสุด → ถ้ามีงบใหม่ (หรือยังไม่เคยดึง) ค่อยดึงตัวเลขงบ */
async function syncCompany(ctx: ActionCtx, known: Known): Promise<void> {
  const sub = (await getJson(`https://data.sec.gov/submissions/CIK${pad(known.cik)}.json`)) as Submissions;
  const recent = sub.filings?.recent;
  const i = recent ? recent.form.findIndex((f) => f === "10-K" || f === "10-K/A") : -1;   // เรียงใหม่ → เก่า
  // shortcut: บริษัทที่ยื่นเอกสารเกิน 1,000 ฉบับ/ปี (ส่วนใหญ่เป็นธนาคาร) 10-K อาจไม่อยู่ใน "recent" → ดึงงบแค่ครั้งแรก ถ้าต้องแม่นขึ้นให้อ่านไฟล์ filings.files เพิ่ม
  const lastFiled = i >= 0 ? recent!.filingDate[i] : known.lastFiled;
  const meta = { cik: known.cik, name: sub.name ?? "", sic: sub.sic || undefined, sicDesc: sub.sicDescription || undefined, lastFiled, fetchedAt: Date.now() };
  const changed = known.fetchedAt === 0 || known.ver !== EXTRACT_VERSION || (lastFiled !== undefined && lastFiled !== known.lastFiled);
  if (!changed) { await ctx.runMutation(internal.screener.saveCompany, meta); return; }
  let years: YearFacts[] = [];
  try {
    const body = (await getJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${pad(known.cik)}.json`)) as { facts?: { "us-gaap"?: Facts } };
    years = extractYears(body.facts?.["us-gaap"] ?? {});
  } catch (e) {
    if (!(e instanceof SecError && e.status === 404)) throw e;   // 404 = ไม่มีงบ XBRL (เช่น กองทุน/บริษัทต่างชาติ)
  }
  await ctx.runMutation(internal.screener.saveCompany, { ...meta, years, ver: EXTRACT_VERSION });
}

/** เริ่มรอบอัปเดต (cron ทุกสัปดาห์ หรือสั่งเอง: npx convex run screenerSec:syncAll)
 *  1) ดึงรายชื่อหุ้น NYSE/Nasdaq จาก SEC  2) ทยอยตรวจทีละชุด (syncBatch) จนครบทุกบริษัท */
export const syncAll = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const list = (await getJson("https://www.sec.gov/files/company_tickers_exchange.json")) as { data: [number, string, string, string | null][] };
    const byCik = new Map<number, { cik: number; name: string; exchange: string; tickers: string[] }>();
    for (const [cik, name, ticker, exchange] of list.data) {
      if (exchange !== "NYSE" && exchange !== "Nasdaq") continue;
      if (/-(WT|WS|UN|U|RT|R)$/.test(ticker)) continue;   // ใบสำคัญแสดงสิทธิ/หน่วย SPAC/สิทธิ ไม่ใช่หุ้น
      const row = byCik.get(cik);
      if (row) row.tickers.push(ticker.toUpperCase());
      else byCik.set(cik, { cik, name, exchange, tickers: [ticker.toUpperCase()] });   // ticker แรก = ตัวหลัก
    }
    const rows = [...byCik.values()];
    for (let i = 0; i < rows.length; i += 200) await ctx.runMutation(internal.screener.upsertUniverse, { rows: rows.slice(i, i + 200) });
    await ctx.scheduler.runAfter(0, internal.screenerSec.syncBatch, { cursor: null });
    return null;
  },
});

export const syncBatch = internalAction({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, { cursor }) => {
    const r = await ctx.runQuery(internal.screener.page, { cursor, numItems: BATCH });
    for (const known of r.page) {
      try {
        await syncCompany(ctx, known);
      } catch (e) {
        if (e instanceof SecError && (e.status === 429 || e.status === 403)) {
          console.warn("SEC rate limit — pausing 10 min", e.message);
          await ctx.scheduler.runAfter(10 * 60 * 1000, internal.screenerSec.syncBatch, { cursor });   // ทำชุดนี้ซ้ำ (ข้ามตัวที่ตรวจแล้วได้เร็ว)
          return null;
        }
        console.error(known.cik, e);
      }
    }
    if (!r.isDone) await ctx.scheduler.runAfter(0, internal.screenerSec.syncBatch, { cursor: r.continueCursor });
    return null;
  },
});

type Company = { ver?: number; cik: number; ticker: string; name: string; exchange: string; sic?: string; sicDesc?: string; lastFiled?: string; fetchedAt: number; years: YearFacts[] };
type Result = {
  selfCik: number;
  group: { kind: "owner"; id: string } | { kind: "sic"; sic: string; desc: string };
  finance: boolean;
  companies: Company[];
  failed: string[];
  quota: { used: number; limit: number } | null;   // null = สมาชิก/แอดมิน (ไม่จำกัด)
} | null;

/** ค้นหุ้น 1 ตัว → งบของตัวเอง + คู่แข่ง (กลุ่มที่ผู้สอนจัดไว้ก่อน ถ้าไม่มีใช้ SIC เดียวกันที่ขนาดใกล้เคียง)
 *  null = ไม่พบหุ้นนี้ในรายชื่อ NYSE/Nasdaq */
export const compare = action({
  args: { ticker: v.string() },
  returns: v.union(v.null(), v.object({
    selfCik: v.number(),
    group: v.union(v.object({ kind: v.literal("owner"), id: v.string() }), v.object({ kind: v.literal("sic"), sic: v.string(), desc: v.string() })),
    finance: v.boolean(),
    companies: v.array(companyValidator),
    failed: v.array(v.string()),
    quota: v.union(v.null(), v.object({ used: v.number(), limit: v.number() })),
  })),
  handler: async (ctx, { ticker }): Promise<Result> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
    const member = (await ctx.runQuery(internal.screener.accessFor, { userId })) === "ok";

    // ยังไม่เคยดึงงบ หรือดึงด้วยวิธีอ่านงบรุ่นเก่า → ดึงใหม่ตอนนี้เลย
    const fresh = async (c: Company): Promise<Company> => {
      if (c.fetchedAt > 0 && c.ver === EXTRACT_VERSION) return c;
      await syncCompany(ctx, c);
      return (await ctx.runQuery(internal.screener.lookup, { ticker: c.ticker })) ?? c;
    };
    const load = async (t: string): Promise<Company | null> => {
      const c: Company | null = await ctx.runQuery(internal.screener.lookup, { ticker: t });
      return c === null ? null : await fresh(c);
    };

    const found: Company | null = await ctx.runQuery(internal.screener.lookup, { ticker });
    if (found === null) return null;
    // ไม่ใช่สมาชิก: วันละ FREE_PER_DAY บริษัท (ดูบริษัทเดิมซ้ำในวันเดียวกันไม่นับเพิ่ม)
    let quota: { used: number; limit: number } | null = null;
    if (!member) {
      const q = await ctx.runQuery(internal.screener.quotaFor, { userId, day: bangkokDay(), add: found.ticker });
      if (!q.allowed) throw new ConvexError("QUOTA");
      await ctx.runMutation(internal.screener.useQuota, { userId, day: bangkokDay(), ticker: found.ticker });
      quota = { used: q.used, limit: FREE_PER_DAY };
    }
    const self = await fresh(found);
    const failed: string[] = [];
    const owner = findGroup(ticker) ?? findGroup(self.ticker);
    const peers: Company[] = [];
    if (owner) {
      for (const t of owner.tickers) {
        if (t === ticker.trim().toUpperCase() || t === self.ticker) continue;
        try {
          const c = await load(t);
          if (c && c.cik !== self.cik) peers.push(c); else if (!c) failed.push(t);
        } catch (e) { console.error(e); failed.push(t); }
      }
    } else if (self.sic) {
      const y = self.years[self.years.length - 1];
      const found: Company[] = await ctx.runQuery(internal.screener.peersBySic, { cik: self.cik, sic: self.sic, revenue: y?.revenue && y.revenue > 0 ? y.revenue : 1e9, now: Date.now(), limit: SIC_PEERS });
      for (const c of found) {
        try { peers.push(await fresh(c)); } catch (e) { console.error(e); peers.push(c); }
      }
    }
    const sicNum = Number(self.sic);
    return {
      selfCik: self.cik,
      group: owner ? { kind: "owner", id: owner.id } : { kind: "sic", sic: self.sic ?? "", desc: self.sicDesc ?? "" },
      finance: sicNum >= 6000 && sicNum <= 6799,   // ธนาคาร/ประกัน/โบรกเกอร์/REIT — ratio ชุดนี้ใช้ไม่ได้
      companies: [self, ...peers],
      failed,
      quota,
    };
  },
});
