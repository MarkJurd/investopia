/* =============================================================================
 * แนวรับ–แนวต้าน (/tools/levels) — คำนวณจากแท่งราคารายวันย้อนหลัง ไม่มีการคาดการณ์
 * =============================================================================
 * วิธี: เก็บ "จุดราคาที่น่าสนใจ" จาก 4 ชนิดเครื่องมือ → รวมจุดที่อยู่ใกล้กัน → ให้คะแนนตามจำนวนชนิดที่ตรงกัน + จำนวนครั้งที่ราคาเคยไปแตะ
 *   ระยะสั้น: EMA 10/20 · Swing (±2 แท่ง ย้อน 40 วัน) · Pivot ของวันล่าสุด · รวมจุดที่ห่างกัน ≤ 0.6%
 *   ระยะยาว : EMA 50/100/200 · Swing (±6 แท่ง ย้อน 250 วัน) · High/Low 52 สัปดาห์ · รวมจุดที่ห่างกัน ≤ 1.5%
 * สูตร Pivot / EMA / Swing เป็นความรู้ทั่วไป · น้ำหนักคะแนนและเกณฑ์ต่างๆ ด้านล่างเจ้าของปรับได้
 * กติกา: ผลเป็นเพียง "ระดับราคาที่เคยมีการตอบสนอง" ไม่ใช่สัญญาณซื้อขาย
 * ========================================================================== */

export type Bar = { t: number; o: number; h: number; l: number; c: number };   // t = เวลา (วินาที, unix)
export type Tool = "ema" | "swing" | "pivot" | "range52w";
export type Horizon = "short" | "long";
export type Level = {
  kind: "support" | "resistance";
  price: number;
  distPct: number;       // ห่างจากราคาปัจจุบัน (%) บวก = เหนือราคา
  distAtr: number | null; // ห่างกี่เท่าของ ATR14
  stars: 1 | 2 | 3;      // ความมั่นใจ: จำนวนชนิดเครื่องมือที่ชี้ตรงกัน (+1 ถ้าราคาเคยแตะ ≥ 4 รอบ) สูงสุด 3
  tools: Tool[];
  labels: string[];      // เช่น "EMA50", "Swing", "Pivot R1"
  touches: number;       // จำนวนรอบที่ราคาเคยไปแตะแนวนี้ (ย้อน 250 วัน)
  score: number;
};
export type Trend = "up" | "down" | "sideways";
export type SrResult = { price: number; trend: Trend; atr: number | null; ema50: number | null; ema200: number | null; levels: Record<Horizon, Level[]> };

const WEIGHT: Record<Tool, number> = { swing: 2, range52w: 1.5, ema: 1, pivot: 1 };   // น้ำหนักต่อ "ชนิด" เครื่องมือที่ตรงกัน
const TOUCH_BONUS = 0.5;       // คะแนนต่อรอบที่ราคาแตะ (สูงสุด 5 รอบ)
const CFG: Record<Horizon, { tol: number; maxDist: number; perSide: number }> = {
  short: { tol: 0.006, maxDist: 0.10, perSide: 4 },
  long:  { tol: 0.015, maxDist: 0.30, perSide: 4 },
};
const MIN_BARS = 60;

type Cand = { price: number; tool: Tool; label: string };

export function ema(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let e = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;   // เริ่มจาก SMA
  for (let i = period; i < closes.length; i++) e = closes[i] * k + e * (1 - k);
  return e;
}

/** ATR14 แบบ Wilder */
export function atr14(bars: Bar[]): number | null {
  if (bars.length < 15) return null;
  const tr = (i: number) => Math.max(bars[i].h - bars[i].l, Math.abs(bars[i].h - bars[i - 1].c), Math.abs(bars[i].l - bars[i - 1].c));
  let a = 0;
  for (let i = 1; i <= 14; i++) a += tr(i);
  a /= 14;
  for (let i = 15; i < bars.length; i++) a = (a * 13 + tr(i)) / 14;
  return a;
}

/** จุดสูง/ต่ำสุดใน ±n แท่ง (n แท่งท้ายสุดยังยืนยันไม่ได้ จึงไม่นับ) ย้อนไม่เกิน lookback แท่ง */
function swings(bars: Bar[], n: number, lookback: number): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = Math.max(n, bars.length - lookback); i < bars.length - n; i++) {
    let hi = true;
    let lo = true;
    for (let j = i - n; j <= i + n; j++) {
      if (j === i) continue;
      if (bars[j].h >= bars[i].h) hi = false;
      if (bars[j].l <= bars[i].l) lo = false;
    }
    if (hi) highs.push(bars[i].h);
    if (lo) lows.push(bars[i].l);
  }
  return { highs, lows };
}

/** Pivot มาตรฐานจากแท่งที่ปิดแล้ว */
export function pivots(b: Bar): Record<string, number> {
  const p = (b.h + b.l + b.c) / 3;
  return { P: p, R1: 2 * p - b.l, R2: p + (b.h - b.l), S1: 2 * p - b.h, S2: p - (b.h - b.l) };
}

/** จำนวนรอบที่ราคาแตะแนว (แท่งที่ช่วง low–high คร่อมแนว±tol/2) แท่งติดกันนับเป็นรอบเดียว */
function touchVisits(bars: Bar[], price: number, tol: number): number {
  let visits = 0;
  let inside = false;
  for (const b of bars.slice(-250)) {
    const hit = b.l <= price * (1 + tol / 2) && b.h >= price * (1 - tol / 2);
    if (hit && !inside) visits++;
    inside = hit;
  }
  return visits;
}

function candidates(bars: Bar[], horizon: Horizon, liveLast: boolean): Cand[] {
  const closes = bars.map((b) => b.c);
  const out: Cand[] = [];
  if (horizon === "short") {
    for (const p of [10, 20]) { const e = ema(closes, p); if (e !== null) out.push({ price: e, tool: "ema", label: `EMA${p}` }); }
    const s = swings(bars, 2, 40);
    for (const x of [...s.highs, ...s.lows]) out.push({ price: x, tool: "swing", label: "Swing" });
    const done = liveLast ? bars[bars.length - 2] : bars[bars.length - 1];   // วันที่ยังเทรดอยู่ H/L ยังไม่นิ่ง → ใช้วันก่อนหน้า
    if (done) for (const [k, x] of Object.entries(pivots(done))) out.push({ price: x, tool: "pivot", label: k === "P" ? "Pivot" : `Pivot ${k}` });
  } else {
    for (const p of [50, 100, 200]) { const e = ema(closes, p); if (e !== null) out.push({ price: e, tool: "ema", label: `EMA${p}` }); }
    const s = swings(bars, 6, 250);
    for (const x of [...s.highs, ...s.lows]) out.push({ price: x, tool: "swing", label: "Swing" });
    const yr = bars.slice(-252);
    if (yr.length >= 200) {
      out.push({ price: Math.max(...yr.map((b) => b.h)), tool: "range52w", label: "High 52w" });
      out.push({ price: Math.min(...yr.map((b) => b.l)), tool: "range52w", label: "Low 52w" });
    }
  }
  return out.filter((c) => Number.isFinite(c.price) && c.price > 0);
}

/** รวมจุดที่ห่างกันไม่เกิน tol (เรียงราคาแล้วต่อโซ่) */
function cluster(cs: Cand[], tol: number): Cand[][] {
  const sorted = [...cs].sort((a, b) => a.price - b.price);
  const groups: Cand[][] = [];
  for (const c of sorted) {
    const g = groups[groups.length - 1];
    if (g && c.price <= g[g.length - 1].price * (1 + tol)) g.push(c);
    else groups.push([c]);
  }
  return groups;
}

export function computeSr(bars: Bar[], price: number, liveLast: boolean): SrResult | null {
  if (bars.length < MIN_BARS || !(price > 0)) return null;
  const closes = bars.map((b) => b.c);
  const atr = atr14(bars);
  const e50 = ema(closes, 50);
  const e200 = ema(closes, 200);
  const trend: Trend = e50 !== null && e200 !== null && price > e50 && e50 > e200 ? "up" : e50 !== null && e200 !== null && price < e50 && e50 < e200 ? "down" : "sideways";

  const levels = {} as Record<Horizon, Level[]>;
  for (const h of ["short", "long"] as const) {
    const { tol, maxDist, perSide } = CFG[h];
    const all: Level[] = cluster(candidates(bars, h, liveLast), tol).flatMap((g) => {
      const p = g.reduce((a, c) => a + c.price, 0) / g.length;
      const distPct = ((p - price) / price) * 100;
      if (Math.abs(distPct) > maxDist * 100 || Math.abs(distPct) < 0.05) return [];   // ไกลเกินไป หรือทับราคาพอดี (ไม่ใช่ทั้งรับและต้าน)
      const tools = [...new Set(g.map((c) => c.tool))];
      const touches = touchVisits(bars, p, tol);
      return [{
        kind: p < price ? ("support" as const) : ("resistance" as const),
        price: p, distPct, distAtr: atr ? Math.abs(p - price) / atr : null,
        stars: Math.min(3, tools.length + (touches >= 4 ? 1 : 0)) as 1 | 2 | 3, tools,   // ความมั่นใจ: หลายวิธีชี้ตรงกัน + ราคาเคยแตะบ่อย
        labels: [...new Set(g.map((c) => c.label))], touches,
        score: tools.reduce((a, t) => a + WEIGHT[t], 0) + Math.min(touches, 5) * TOUCH_BONUS,
      }];
    });
    const pick = (kind: Level["kind"]) => all.filter((l) => l.kind === kind).sort((a, b) => b.score - a.score).slice(0, perSide);
    levels[h] = [...pick("resistance"), ...pick("support")].sort((a, b) => b.price - a.price);   // บนลงล่าง
  }
  return { price, trend, atr, ema50: e50, ema200: e200, levels };
}

/** แนวรับ/แนวต้านที่ใกล้ราคาที่สุด (ระยะสั้นก่อน ไม่มีค่อยใช้ระยะยาว) — ใช้ใน Watchlist และสรุปรายสัปดาห์ */
export function nearestLevels<L extends { kind: "support" | "resistance"; distPct: number }>(short: L[], long: L[]): { support: L | null; resistance: L | null } {
  const near = (kind: L["kind"]) => {
    for (const ls of [short, long]) {
      const xs = ls.filter((l) => l.kind === kind).sort((a, b) => Math.abs(a.distPct) - Math.abs(b.distPct));
      if (xs.length) return xs[0];
    }
    return null;
  };
  return { support: near("support"), resistance: near("resistance") };
}
