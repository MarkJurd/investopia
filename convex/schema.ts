import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { planValidator } from "./plans";

// ตารางของระบบล็อกอิน (users, sessions, accounts ฯลฯ) มาจาก Convex Auth
export default defineSchema({
  ...authTables,

  // สิทธิ์สมาชิก 1 แถว = การจ่ายเงิน 1 ครั้ง (ต่ออายุ = แถวใหม่)
  memberships: defineTable({
    userId: v.id("users"),
    plan: planValidator,
    status: v.union(v.literal("active"), v.literal("refunded")),
    startsAt: v.number(),
    expiresAt: v.number(),
    amount: v.number(),                       // บาท
    stripeSessionId: v.string(),
    paymentIntentId: v.union(v.string(), v.null()),
    indicatorBonus: v.boolean(),              // ได้ Indicator (รายปี 50 คนแรก / VIP)
    monthKey: v.string(),                     // เดือนที่ซื้อ (เวลาไทย) ใช้นับที่นั่ง VIP
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSessionId", ["stripeSessionId"])
    .index("by_paymentIntentId", ["paymentIntentId"])
    .index("by_plan_and_monthKey", ["plan", "monthKey"])
    .index("by_plan_and_indicatorBonus", ["plan", "indicatorBonus"]),

  /* ---------- ห้องเรียน (/learn) — id บทเรียน/โมดูลมาจาก lib/course.ts ---------- */
  // บทที่ผู้เรียนกด "เรียนจบแล้ว" (1 แถว = 1 บท)
  lessonProgress: defineTable({
    userId: v.id("users"),
    lessonId: v.string(),
    completedAt: v.number(),
  }).index("by_userId_and_lessonId", ["userId", "lessonId"]),

  // ผลแบบทดสอบท้ายโมดูล (1 แถว = 1 โมดูล) — เก็บคะแนนดีสุดไว้ตัดสินว่าผ่านหรือยัง
  quizResults: defineTable({
    userId: v.id("users"),
    moduleId: v.string(),
    total: v.number(),
    bestCorrect: v.number(),
    passed: v.boolean(),
    attempts: v.number(),
  }).index("by_userId_and_moduleId", ["userId", "moduleId"]),
});
