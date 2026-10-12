import { v } from "convex/values";

/* แพ็กเกจที่ขายจริง — ราคา/ระยะเวลาที่ "ระบบใช้คิดเงิน" อยู่ที่นี่ (ฝั่งเซิร์ฟเวอร์)
 * ⚠️ ถ้าเปลี่ยนราคา ต้องแก้ทั้งที่นี่ และข้อความที่แสดงใน lib/content.ts ให้ตรงกัน */
export const PLANS = {
  monthly:   { name: "INVESTOPIA รายเดือน",       amount: 990,   days: 30,  rank: 1 },
  quarterly: { name: "INVESTOPIA 3 เดือน",        amount: 2490,  days: 90,  rank: 2 },
  yearly:    { name: "INVESTOPIA รายปี",          amount: 4990,  days: 365, rank: 3 },
  vip:       { name: "INVESTOPIA VIP ตัวต่อตัว",  amount: 13990, days: 365, rank: 4 },
} as const;

export type PlanId = keyof typeof PLANS;

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
export const INDICATOR_BONUS_LIMIT = 50;   // รายปี N คนแรกได้ Indicator (VIP ได้ทุกคน)

const DAY = 24 * 60 * 60 * 1000;
export const daysToMs = (d: number) => d * DAY;

/** เดือนปัจจุบันตามเวลาไทย เช่น "2026-10" — ใช้นับที่นั่ง VIP ต่อเดือน */
export function bangkokMonthKey(ts: number): string {
  const d = new Date(ts + 7 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
