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

  /* ---------- คอมมูนิตี้ (/community) — เฉพาะสมาชิก + แอดมิน ---------- */
  // ชื่อที่แสดงในคอมมูนิตี้ (ตั้งเอง ไม่ใช้ชื่อจริงจาก Google)
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
  }).index("by_userId", ["userId"]),

  posts: defineTable({
    authorId: v.id("users"),
    body: v.string(),
    tag: v.union(v.literal("general"), v.literal("lesson")),
    lessonId: v.optional(v.string()),            // ใช้เมื่อ tag = lesson (id บทเรียนจาก lib/course.ts)
    imageIds: v.array(v.id("_storage")),
    likeCount: v.number(),
    commentCount: v.number(),
    reportCount: v.number(),
    pinned: v.boolean(),
    hidden: v.boolean(),                         // แอดมินซ่อน
    editedAt: v.optional(v.number()),
  })
    .index("by_hidden_and_tag", ["hidden", "tag"])
    .index("by_tag", ["tag"])
    .index("by_pinned", ["pinned"])
    .index("by_authorId", ["authorId"])
    .searchIndex("search_body", { searchField: "body", filterFields: ["hidden"] }),

  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    body: v.string(),
    likeCount: v.number(),
    reportCount: v.number(),
    editedAt: v.optional(v.number()),
  })
    .index("by_postId", ["postId"])
    .index("by_authorId", ["authorId"]),

  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(),                        // id ของโพสต์หรือคอมเมนต์
  })
    .index("by_userId_and_targetId", ["userId", "targetId"])
    .index("by_targetId", ["targetId"]),

  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    targetId: v.string(),
  })
    .index("by_reporterId_and_targetId", ["reporterId", "targetId"])
    .index("by_targetId", ["targetId"]),

  // ข้อความที่บอท Telegram ส่งหาเจ้าของ → โพสต์ไหน (ใช้ตอนเจ้าของ reply ใน Telegram แล้วโพสต์เป็นคอมเมนต์บนเว็บ)
  telegramThreads: defineTable({
    telegramMessageId: v.number(),
    postId: v.id("posts"),
  })
    .index("by_telegramMessageId", ["telegramMessageId"])
    .index("by_postId", ["postId"]),

  // update_id ที่ประมวลผลแล้ว (Telegram อาจส่งซ้ำ)
  telegramSeen: defineTable({ updateId: v.number() }).index("by_updateId", ["updateId"]),

  notifications: defineTable({
    userId: v.id("users"),                       // ผู้รับ
    type: v.union(v.literal("like_post"), v.literal("like_comment"), v.literal("comment"), v.literal("new_post")),
    actorId: v.id("users"),
    postId: v.id("posts"),
    byAdmin: v.boolean(),                        // คนทำเป็นแอดมินไหม (ใช้เน้นว่า "ผู้สอนตอบแล้ว")
    preview: v.string(),
    read: v.boolean(),
  })
    .index("by_userId_and_read", ["userId", "read"])
    .index("by_userId", ["userId"])
    .index("by_postId", ["postId"]),
});
