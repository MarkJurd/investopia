import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { planValidator } from "./plans";
import { quizItemValidator } from "./course";
import { screenerYearValidator } from "./screener";

// ตารางของระบบล็อกอิน (users, sessions, accounts ฯลฯ) มาจาก Convex Auth
export default defineSchema({
  ...authTables,

  // สิทธิ์สมาชิก 1 แถว = การจ่ายเงิน 1 ครั้ง (ต่ออายุ = แถวใหม่)
  memberships: defineTable({
    userId: v.id("users"),
    plan: planValidator,
    status: v.union(v.literal("active"), v.literal("refunded"), v.literal("revoked")),  // revoked = แอดมินยกเลิกเอง
    startsAt: v.number(),
    expiresAt: v.number(),
    amount: v.number(),                       // บาท
    stripeSessionId: v.string(),
    paymentIntentId: v.union(v.string(), v.null()),
    indicatorBonus: v.boolean(),              // ได้ Indicator (รายปี 50 คนแรก / VIP)
    monthKey: v.string(),                     // เดือนที่ซื้อ (เวลาไทย) ใช้นับที่นั่ง VIP
    source: v.optional(v.union(v.literal("stripe"), v.literal("manual"))),  // ไม่มี = stripe (ข้อมูลเก่า)
    listAmount: v.optional(v.number()),       // ราคาเต็มก่อนส่วนลด (บาท)
    couponCode: v.optional(v.string()),       // โค้ดส่วนลดที่ใช้
    note: v.optional(v.string()),             // บันทึกของแอดมิน (เช่น "ลูกค้าเก่า ให้ฟรี 1 เดือน")
    changedAt: v.optional(v.number()),        // เวลาที่แอดมินแก้/ยกเลิกล่าสุด
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSessionId", ["stripeSessionId"])
    .index("by_paymentIntentId", ["paymentIntentId"])
    .index("by_plan_and_monthKey", ["plan", "monthKey"])
    .index("by_plan_and_indicatorBonus", ["plan", "indicatorBonus"]),

  // สิทธิ์ที่แอดมินให้ล่วงหน้าด้วยอีเมล (ลูกค้าที่ยังไม่เคยล็อกอิน) — เปิดใช้อัตโนมัติตอนล็อกอินครั้งแรก
  pendingGrants: defineTable({
    email: v.string(),                        // ตัวพิมพ์เล็ก
    plan: planValidator,
    days: v.number(),
    note: v.string(),
    appliedAt: v.union(v.number(), v.null()),
  }).index("by_email", ["email"]),

  // โค้ดส่วนลด (สร้างในหน้า /admin) — ผู้ซื้อกรอกตอนกดจ่ายเงิน
  coupons: defineTable({
    code: v.string(),                         // ตัวพิมพ์ใหญ่ เช่น "NEWYEAR"
    kind: v.union(v.literal("percent"), v.literal("amount")),
    value: v.number(),                        // percent: 1–90 · amount: บาท
    plans: v.array(planValidator),            // ใช้ได้กับแพ็กเกจไหน
    maxUses: v.union(v.number(), v.null()),   // null = ไม่จำกัด
    uses: v.number(),
    expiresAt: v.union(v.number(), v.null()),
    active: v.boolean(),
    note: v.string(),
  }).index("by_code", ["code"]),

  /* ---------- เนื้อหาคอร์ส (แก้จาก /admin) — ดู convex/course.ts ---------- */
  courseModules: defineTable({
    key: v.string(),                          // เช่น "m0" (ห้ามเปลี่ยน — ผลแบบทดสอบผูกกับ key)
    order: v.number(),
    title: v.string(),
    practice: v.string(),                     // งานลงมือทำท้ายโมดูล
    hidden: v.boolean(),
    quiz: v.array(quizItemValidator),
  })
    .index("by_order", ["order"])
    .index("by_key", ["key"]),

  courseLessons: defineTable({
    key: v.string(),                          // เช่น "m2-1" (ห้ามเปลี่ยน — ความคืบหน้าผูกกับ key)
    moduleId: v.id("courseModules"),
    order: v.number(),
    title: v.string(),
    notes: v.string(),
    videoId: v.string(),                      // Bunny Video ID ("" = ยังไม่มีวิดีโอ)
    minutes: v.number(),
    hidden: v.boolean(),
    indicatorOnly: v.boolean(),               // เปิดเฉพาะผู้ได้ Indicator + แอดมิน
    free: v.optional(v.boolean()),            // บทเรียนฟรี: คนที่ล็อกอิน Google (ยังไม่ซื้อ) ดูได้ — แก้ที่ /admin
    newSince: v.optional(v.number()),         // ป้าย "ใหม่" นับจากเวลานี้
    links: v.optional(v.array(v.object({ title: v.string(), url: v.string() }))),  // ลิงก์เว็บใต้คลิป (เช่น TradingView, Google Drive)
  })
    .index("by_moduleId_and_order", ["moduleId", "order"])
    .index("by_key", ["key"]),

  // ไฟล์แนบใต้คลิป (ใบงาน PDF ฯลฯ) — ดาวน์โหลดได้เฉพาะคนที่เปิดบทนั้นได้
  lessonFiles: defineTable({
    lessonId: v.id("courseLessons"),
    storageId: v.id("_storage"),
    name: v.string(),
    size: v.number(),
  }).index("by_lessonId", ["lessonId"]),

  /* ---------- ห้องเรียน (/learn) — key บทเรียน/โมดูลมาจากตาราง courseLessons / courseModules ---------- */
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
    files: v.optional(v.array(v.object({ storageId: v.id("_storage"), name: v.string(), size: v.number() }))),  // ไฟล์แนบ (แอดมินเท่านั้น)
    poll: v.optional(v.object({                  // โพล (แอดมินเท่านั้น) — ไม่เปิดเผยว่าใครโหวตอะไร
      options: v.array(v.string()),
      counts: v.array(v.number()),
      multi: v.boolean(),                        // เลือกได้หลายข้อ
      closesAt: v.union(v.number(), v.null()),
      voters: v.number(),
    })),
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

  pollVotes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    choices: v.array(v.number()),
  }).index("by_postId_and_userId", ["postId", "userId"]),

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

  // ข่าวหุ้นรายวัน: ร่าง 06:00 → ส่งเข้ากลุ่ม 08:00 ถ้าเจ้าของไม่ยกเลิก
  newsDrafts: defineTable({
    day: v.string(),                              // วันที่เวลาไทย YYYY-MM-DD
    status: v.union(v.literal("draft"), v.literal("cancelled"), v.literal("sent")),
    items: v.array(v.object({ ticker: v.string(), changePct: v.union(v.number(), v.null()), headline: v.string(), body: v.string(), source: v.string(), url: v.string() })),
    createdAt: v.number(),
  }).index("by_day", ["day"]),

  // update_id ที่ประมวลผลแล้ว (Telegram อาจส่งซ้ำ)
  telegramSeen: defineTable({ updateId: v.number() }).index("by_updateId", ["updateId"]),

  notifications: defineTable({
    userId: v.id("users"),                       // ผู้รับ
    type: v.union(v.literal("like_post"), v.literal("like_comment"), v.literal("comment"), v.literal("new_post"), v.literal("new_lesson")),
    actorId: v.id("users"),
    postId: v.optional(v.id("posts")),           // ไม่มีเมื่อ type = new_lesson
    lessonKey: v.optional(v.string()),           // ใช้เมื่อ type = new_lesson
    byAdmin: v.boolean(),                        // คนทำเป็นแอดมินไหม (ใช้เน้นว่า "ผู้สอนตอบแล้ว")
    preview: v.string(),
    read: v.boolean(),
  })
    .index("by_userId_and_read", ["userId", "read"])
    .index("by_userId", ["userId"])
    .index("by_postId", ["postId"])
    .index("by_userId_and_lessonKey", ["userId", "lessonKey"]),

  // หุ้นสหรัฐฯ (NYSE/Nasdaq) + งบปีจาก SEC EDGAR สำหรับเครื่องมือเทียบงบ — อัปเดตอัตโนมัติทุกสัปดาห์ (convex/crons.ts)
  screenerCompanies: defineTable({
    cik: v.number(),
    ticker: v.string(),                       // ticker หลัก (บางบริษัทมีหลายตัว ดู screenerTickers)
    name: v.string(),
    exchange: v.string(),
    sic: v.optional(v.string()),              // รหัสอุตสาหกรรมของ SEC (ใช้หาคู่แข่ง)
    sicDesc: v.optional(v.string()),
    lastFiled: v.optional(v.string()),        // วันที่ยื่น 10-K ล่าสุด (ใช้เช็กว่ามีงบใหม่ไหม)
    fetchedAt: v.number(),                    // 0 = ยังไม่เคยดึง
    ver: v.optional(v.number()),              // เวอร์ชันวิธีอ่านงบ (EXTRACT_VERSION ใน screenerSec.ts)
    years: v.array(screenerYearValidator),
  })
    .index("by_cik", ["cik"])
    .index("by_sic", ["sic"])
    .searchIndex("search_name", { searchField: "name" }),

  screenerTickers: defineTable({ ticker: v.string(), cik: v.number() }).index("by_ticker", ["ticker"]),

  // ราคา + แท่งรายวันล่าสุดของหุ้น (เครื่องมือแนวรับ–แนวต้าน) — แคช ~1 นาทีต่อ symbol กันยิงแหล่งข้อมูลซ้ำ
  marketCache: defineTable({
    symbol: v.string(),
    fetchedAt: v.number(),
    name: v.string(),
    currency: v.string(),
    price: v.number(),
    regStart: v.number(),                     // ช่วงตลาดปกติของวันนี้ (วินาที unix) ใช้ดูว่าตลาดเปิดอยู่ไหม
    regEnd: v.number(),
    bars: v.array(v.object({ t: v.number(), o: v.number(), h: v.number(), l: v.number(), c: v.number() })),
  }).index("by_symbol", ["symbol"]),

  // โควตาฟรีของเครื่องมือเทียบงบ: บริษัทที่ผู้ใช้ (ไม่ใช่สมาชิก) ดูไปแล้วในวันนั้น (เวลาไทย)
  toolUsage: defineTable({ userId: v.id("users"), day: v.string(), tickers: v.array(v.string()) })
    .index("by_userId_and_day", ["userId", "day"]),

  // Watchlist ของผู้ใช้ (ฟรี 3 ตัว · สมาชิก 20 ตัว)
  watchlist: defineTable({ userId: v.id("users"), symbol: v.string(), addedAt: v.number() }).index("by_userId", ["userId"]),

  // ผูกบัญชีเว็บกับแชท Telegram (รับสรุป Watchlist รายสัปดาห์) · token = รหัสใช้ครั้งเดียวตอนกดเชื่อม
  telegramLinks: defineTable({
    userId: v.id("users"),
    chatId: v.optional(v.number()),
    token: v.optional(v.string()),
    tokenAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]).index("by_token", ["token"]).index("by_chatId", ["chatId"]),
});
