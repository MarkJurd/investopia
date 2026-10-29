/* =============================================================================
 * เครื่องมือ "เทียบงบการเงินกับคู่แข่ง" (/tools/screener) — เฉพาะสมาชิก
 * =============================================================================
 * เจ้าของแก้ที่นี่:
 *   1. SCREENER_GROUPS = กลุ่มคู่แข่งที่ผู้สอนจัดเอง (ไม่บังคับ) — หุ้นที่อยู่ในกลุ่มนี้ใช้คู่แข่งตามกลุ่ม
 *      หุ้นอื่นทั้งหมด (NYSE/Nasdaq ~6,000 บริษัท) ค้นได้เหมือนกัน คู่แข่ง = รหัสอุตสาหกรรม SEC (SIC) เดียวกันที่รายได้ใกล้เคียง
 *      - ใช้เมื่อ SIC จับคู่ไม่ตรง (เช่น อยากเทียบ KO กับ PEP ทั้งที่ SIC ต่างกัน) · หุ้นตัวเดียวอยู่ได้กลุ่มเดียว
 *   2. RATIOS → threshold = เกณฑ์ของผู้สอน (null = ไม่มีเกณฑ์ เทียบกับคู่แข่งอย่างเดียว)
 * ข้อมูลงบมาจาก SEC EDGAR (ฟรี เป็นข้อมูลสาธารณะ) ดึงที่ convex/screenerSec.ts · อัปเดตเองทุกสัปดาห์ (convex/crons.ts)
 *
 * กติกา: ไม่มีคะแนนรวม ไม่จัดอันดับ ไม่ใช้คำว่า "น่าซื้อ/แนะนำ" — เทียบรายข้อกับกลุ่มเท่านั้น
 * ========================================================================== */
import type { Bilingual } from "./yields";

export type ScreenerGroup = { id: string; name: Bilingual; tickers: string[] };

/** ตัวอย่างตั้งต้น (AI ใส่ไว้) — เจ้าของเพิ่ม/ลบ/ย้ายได้ตามต้องการ */
export const SCREENER_GROUPS: ScreenerGroup[] = [
  { id: "semis",       name: { th: "เซมิคอนดักเตอร์ (ชิป)", en: "Semiconductors" },          tickers: ["NVDA", "AMD", "INTC", "QCOM", "AVGO", "TXN"] },
  { id: "software",    name: { th: "ซอฟต์แวร์",            en: "Software" },                  tickers: ["MSFT", "ORCL", "ADBE", "CRM"] },
  { id: "beverages",   name: { th: "เครื่องดื่ม",           en: "Beverages" },                 tickers: ["KO", "PEP", "KDP"] },
  { id: "retail",      name: { th: "ค้าปลีก",              en: "Retail" },                    tickers: ["WMT", "COST", "TGT"] },
  { id: "restaurants", name: { th: "ร้านอาหาร",            en: "Restaurants" },               tickers: ["MCD", "SBUX", "CMG", "YUM"] },
];

export function findGroup(ticker: string): ScreenerGroup | undefined {
  const t = ticker.trim().toUpperCase();
  return SCREENER_GROUPS.find((g) => g.tickers.includes(t));
}

/** ตัวเลขงบปีหนึ่งปี (หน่วย USD) — undefined = งบไม่ได้รายงานรายการนี้ */
export type YearFacts = {
  end: string;                // วันสิ้นปีบัญชี "YYYY-MM-DD"
  revenue?: number;
  grossProfit?: number;
  sga?: number;
  operatingIncome?: number;
  interestExpense?: number;
  netIncome?: number;
  depreciation?: number;
  longTermDebt?: number;      // หนี้ระยะยาวที่มีดอกเบี้ย (รวมส่วนที่ถึงกำหนดใน 1 ปี ถ้างบแยกไว้)
  est?: string[];             // รายการที่ระบบประมาณเอง เพราะงบไม่ได้แสดงตรงๆ (เช่น "grossProfit")
};

export type RatioId = "gpm" | "sga" | "interest" | "npm" | "dep" | "debt";

type NumKey = Exclude<keyof YearFacts, "end" | "est">;

export type RatioDef = {
  id: RatioId;
  num: NumKey;                // ตัวตั้ง
  den: NumKey;                // ตัวหาร
  higherIsBetter: boolean;
  unit: "%" | "x";
  /** เกณฑ์ผู้สอน: ค่าต้อง "มากกว่า" (higherIsBetter) หรือ "น้อยกว่า" ตัวเลขนี้ · null = ไม่มีเกณฑ์ */
  threshold: number | null;
  calc: (y: YearFacts) => number | null;
};

// ตัวหารต้อง > 0 (ขาดทุน = ตัวหารติดลบ ตีความไม่ได้) · ไม่มีรายการในงบ = null ไม่เดาเป็น 0
const ratio = (id: RatioId, num: NumKey, den: NumKey, unit: "%" | "x", higherIsBetter: boolean, threshold: number | null): RatioDef => ({
  id, num, den, unit, higherIsBetter, threshold,
  calc: (y) => {
    const a = y[num];
    const b = y[den];
    return a === undefined || b === undefined || b <= 0 ? null : (a / b) * (unit === "%" ? 100 : 1);
  },
});

export const RATIOS: RatioDef[] = [
  ratio("gpm",      "grossProfit",     "revenue",         "%", true,  null),
  ratio("sga",      "sga",             "grossProfit",     "%", false, 30),
  ratio("interest", "interestExpense", "operatingIncome", "%", false, 15),
  ratio("npm",      "netIncome",       "revenue",         "%", true,  20),
  ratio("dep",      "depreciation",    "revenue",         "%", false, 15),
  ratio("debt",     "longTermDebt",    "netIncome",       "x", false, null),
];

/** อัตราส่วนนี้ใช้ตัวเลขที่ระบบประมาณเองหรือไม่ (แสดง ≈) */
export const isEstimated = (def: RatioDef, y: YearFacts) => Boolean(y.est?.some((f) => f === def.num || f === def.den));

export type Why = { kind: "noItem" | "loss"; field: NumKey };

/** ทำไมถึงคำนวณไม่ได้ (null = คำนวณได้) — noItem: งบไม่มีรายการนั้น · loss: ตัวหารขาดทุน/เป็นศูนย์ */
export function explain(def: RatioDef, y: YearFacts): Why | null {
  if (y[def.num] === undefined) return { kind: "noItem", field: def.num };
  const b = y[def.den];
  if (b === undefined) return { kind: "noItem", field: def.den };
  return b <= 0 ? { kind: "loss", field: def.den } : null;
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type Verdict = "better" | "similar" | "worse";

/** เทียบ value กับ ref — ห่างกันไม่เกิน 10% ของค่าอ้างอิง (หรือ 1 หน่วย สำหรับค่าใกล้ศูนย์) = ใกล้เคียง */
export function compare(def: RatioDef, value: number, ref: number): Verdict {
  const tol = Math.max(Math.abs(ref) * 0.1, def.unit === "%" ? 1 : 0.1);
  if (Math.abs(value - ref) <= tol) return "similar";
  return (value > ref) === def.higherIsBetter ? "better" : "worse";
}

export function passes(def: RatioDef, value: number): boolean | null {
  if (def.threshold === null) return null;
  return def.higherIsBetter ? value > def.threshold : value < def.threshold;
}

/** ค่าเฉลี่ยของปีที่คำนวณได้ (ใช้ดูแนวโน้ม: ปีล่าสุดเทียบค่าเฉลี่ย 5 ปีของตัวเอง) */
export function average(xs: (number | null)[]): number | null {
  const ok = xs.filter((x): x is number => x !== null);
  return ok.length === 0 ? null : ok.reduce((a, b) => a + b, 0) / ok.length;
}
