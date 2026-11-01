import { v } from "convex/values";

/* แพ็กเกจที่ขายจริง — ราคา/ระยะเวลาที่ "ระบบใช้คิดเงิน" อยู่ที่นี่ (ฝั่งเซิร์ฟเวอร์)
 * ⚠️ ถ้าเปลี่ยนราคา ต้องแก้ทั้งที่นี่ และข้อความที่แสดงใน lib/content.ts ให้ตรงกัน */
export const PLANS = {
  monthly:   { name: "INVESTOPIA เรียนชิลๆ ตามจังหวะตัวเอง", nameEn: "INVESTOPIA Easy Self-Paced", amount: 1290,  days: 30,  rank: 1 },
  quarterly: { name: "INVESTOPIA 3 เดือน",        nameEn: "INVESTOPIA 3 Months",       amount: 2490,  days: 90,  rank: 2 },
  yearly:    { name: "INVESTOPIA รายปี",          nameEn: "INVESTOPIA Yearly",         amount: 4990,  days: 365, rank: 3 },
  vip:       { name: "INVESTOPIA สายเก่งไว ติว 1:1 ใน 30 วัน", nameEn: "INVESTOPIA Fast-Track 1:1 in 30 Days", amount: 4990, days: 30, rank: 4 },  // เปลี่ยน 2026-10-24 (เดิม ฿13,990 / 365 วัน)
} as const;

export type PlanId = keyof typeof PLANS;

/** แพ็กเกจที่เปิดขายตอนนี้ — 3 เดือนเลิกขายแล้ว (2026-10-16) ยังเก็บไว้เพื่อสมาชิกเดิม · รายเดือน ฿1,290 เปิดขายอีกครั้ง 2026-10-20 เป็น "ตัวเลือกช่วงเปิดตัว" (เจ้าของจะเลิกขายเมื่อมีคอร์สเพิ่ม → ถอดออกจากที่นี่ + Pricing.tsx + CouponsTab) */
/** 2026-10-24: เลิกขายรายปี (เก็บไว้เพื่อสมาชิกเดิม) — เปิดขายเฉพาะ เรียนชิลๆ ฿1,290 + ติว 1:1 ฿4,990 */
export const FOR_SALE: ReadonlySet<PlanId> = new Set<PlanId>(["monthly", "vip"]);

export const planValidator = v.union(
  v.literal("monthly"),
  v.literal("quarterly"),
  v.literal("yearly"),
  v.literal("vip"),
);

export function isPlanId(x: unknown): x is PlanId {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(PLANS, x);
}

export const VIP_SEATS_PER_MONTH = 3;      // VIP รับกี่คนต่อเดือน

/** ⚠️ ไม่ใช้แล้ว 2026-10-24 (รายปีเลิกขาย — มีผลเฉพาะ plan yearly ซึ่งไม่อยู่ใน FOR_SALE) · รอบเปิดตัว: รายปี ฿3,990 จำกัด 15 ที่ และถึง 31 ต.ค. 2569 (= ค.ศ. 2026) 23:59 เวลาไทย (= 16:59 UTC) */
/** price = ราคาปล่อยตัวระหว่างรอบ · หลังหมดเวลา/เต็ม ขายต่อที่ราคาเต็ม PLANS.yearly.amount (฿4,990 — เจ้าของยืนยัน 2026-10-18) */
export const LAUNCH = { plan: "yearly" as PlanId, price: 3990, seats: 15, countFrom: 1792315022000 /* นับเฉพาะการซื้อหลังเวลานี้ (ตัดรายการทดสอบก่อนเปิดรอบ) */, endsAt: Date.UTC(2026, 9, 31, 16, 59, 0) };

/** 2026-11-01: เรียนชิลๆ (monthly) และติว 1:1 (vip) จ่ายครั้งเดียว เรียนคอร์สกราฟได้ตลอดไป — แถวสิทธิ์ที่ซื้อใหม่ใส่ lifetime: true
 *  LIFETIME_AT = "วันหมดอายุ" ที่ส่งให้หน้าเว็บ (ปี 2100) · หน้าเว็บถือว่า expiresAt >= ค่านี้ = ตลอดไป */
export const LIFETIME_AT = Date.UTC(2100, 0, 1);
export const LIFETIME_PLANS: ReadonlySet<PlanId> = new Set<PlanId>(["monthly", "vip"]);
/** Indicator ของเรียนชิลๆ ใช้ได้ 1 เดือนนับจากวันซื้อ — ติว 1:1 ถาวร */
export const INDICATOR_DAYS_MONTHLY = 30;

const DAY = 24 * 60 * 60 * 1000;
export const daysToMs = (d: number) => d * DAY;

/** เดือนปัจจุบันตามเวลาไทย เช่น "2026-10" — ใช้นับที่นั่ง VIP ต่อเดือน */
export function bangkokMonthKey(ts: number): string {
  const d = new Date(ts + 7 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
