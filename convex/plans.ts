import { v } from "convex/values";

/* แพ็กเกจที่ขายจริง — ราคา/ระยะเวลาที่ "ระบบใช้คิดเงิน" อยู่ที่นี่ (ฝั่งเซิร์ฟเวอร์)
 * ⚠️ ถ้าเปลี่ยนราคา ต้องแก้ทั้งที่นี่ และข้อความที่แสดงใน lib/content.ts ให้ตรงกัน */
export const PLANS = {
  monthly:   { name: "INVESTOPIA รายเดือน",       nameEn: "INVESTOPIA Monthly",        amount: 990,   days: 30,  rank: 1 },
  quarterly: { name: "INVESTOPIA 3 เดือน",        nameEn: "INVESTOPIA 3 Months",       amount: 2490,  days: 90,  rank: 2 },
  yearly:    { name: "INVESTOPIA รายปี",          nameEn: "INVESTOPIA Yearly",         amount: 4990,  days: 365, rank: 3 },
  vip:       { name: "INVESTOPIA Exclusive VIP ติว 1:1",  nameEn: "INVESTOPIA Exclusive VIP 1:1 Coaching", amount: 13990, days: 365, rank: 4 },
} as const;

export type PlanId = keyof typeof PLANS;

/** แพ็กเกจที่เปิดขายตอนนี้ — รายเดือน/3 เดือน เลิกขายแล้ว (2026-10-16) แต่ยังเก็บไว้ในระบบเพื่อสมาชิกเดิม */
export const FOR_SALE: ReadonlySet<PlanId> = new Set<PlanId>(["yearly", "vip"]);

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
export const INDICATOR_BONUS_LIMIT = 10;   // VIP N คนแรกได้ Indicator (รายปีไม่ได้แล้ว — เจ้าของเปลี่ยน 2026-10-18)

/** รอบเปิดตัว: รายปี ฿3,990 จำกัด 15 ที่ และถึง 31 ต.ค. 2569 (= ค.ศ. 2026) 23:59 เวลาไทย (= 16:59 UTC) */
/** price = ราคาปล่อยตัวระหว่างรอบ · หลังหมดเวลา/เต็ม ขายต่อที่ราคาเต็ม PLANS.yearly.amount (฿4,990 — เจ้าของยืนยัน 2026-10-18) */
export const LAUNCH = { plan: "yearly" as PlanId, price: 3990, seats: 15, countFrom: 1792315022000 /* นับเฉพาะการซื้อหลังเวลานี้ (ตัดรายการทดสอบก่อนเปิดรอบ) */, endsAt: Date.UTC(2026, 9, 31, 16, 59, 0) };

const DAY = 24 * 60 * 60 * 1000;
export const daysToMs = (d: number) => d * DAY;

/** เดือนปัจจุบันตามเวลาไทย เช่น "2026-10" — ใช้นับที่นั่ง VIP ต่อเดือน */
export function bangkokMonthKey(ts: number): string {
  const d = new Date(ts + 7 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
