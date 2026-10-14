/* ห้องเรียน (/learn): เนื้อหาบทเรียน · ความคืบหน้า · แบบทดสอบ
 * ทุกฟังก์ชันเช็กสิทธิ์สมาชิกที่นี่ (ฝั่งเซิร์ฟเวอร์) — หน้าเว็บไม่มีทางได้เนื้อหา/เฉลยถ้าไม่ใช่สมาชิก
 * เนื้อหาบทเรียนอยู่ที่ lib/course.ts (ไทย) และ lib/course.en.ts (อังกฤษ) */
import { internalMutation, mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getMembership } from "./payments";
import { planValidator } from "./plans";
import { COURSE, type Course } from "../lib/course";
import { COURSE_EN } from "../lib/course.en";

const PASS_PERCENT = 70;        // ผ่านแบบทดสอบเมื่อได้ ≥ 70%

const LESSON_IDS = new Set(COURSE.modules.flatMap((m) => m.lessons.map((l) => l.id)));
const QUIZ_MODULE_IDS = new Set(COURSE.modules.filter((m) => m.quiz.length > 0).map((m) => m.id));

const langValidator = v.union(v.literal("th"), v.literal("en"));
const courseFor = (lang: "th" | "en"): Course => (lang === "en" ? COURSE_EN : COURSE);

/** ลิงก์เล่นวิดีโอ — ยังไม่ได้เลือกที่เก็บวิดีโอ จึงคืน null (หน้าเว็บแสดงกรอบ "เร็วๆ นี้")
 *  เลือกแล้ว (เช่น Bunny Stream) ให้สร้างลิงก์แบบมีวันหมดอายุที่นี่ — คนที่ไม่ใช่สมาชิกจะไม่มีทางได้ลิงก์ */
function videoEmbedUrl(videoId: string): string | null {
  void videoId;
  return null;
}

/* ---------- สิทธิ์ ---------- */
async function requireMember(ctx: QueryCtx, now: number): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
  if ((await getMembership(ctx, userId, now)) === null) throw new ConvexError("NOT_A_MEMBER");
  return userId;
}

/* ---------- ข้อมูลความคืบหน้าของผู้เรียน (จำนวนแถวจำกัดตามขนาดคอร์ส) ---------- */
async function loadProgress(ctx: QueryCtx, userId: Id<"users">) {
  const lessons = await ctx.db
    .query("lessonProgress")
    .withIndex("by_userId_and_lessonId", (q) => q.eq("userId", userId))
    .take(500);
  const quizzes = await ctx.db
    .query("quizResults")
    .withIndex("by_userId_and_moduleId", (q) => q.eq("userId", userId))
    .take(200);
  return { lessons, quizzes };
}

/* ---------- หน้าห้องเรียน: เนื้อหา (ไม่มีเฉลย) + ความคืบหน้าของฉัน ---------- */
const lessonOut = v.object({
  id: v.string(), title: v.string(), notes: v.string(), minutes: v.number(),
  embedUrl: v.union(v.string(), v.null()),     // null = ยังไม่มีวิดีโอ → แสดง "เร็วๆ นี้"
});
const moduleOut = v.object({
  id: v.string(), tag: v.string(), title: v.string(), practice: v.string(),
  lessons: v.array(lessonOut),
  quiz: v.array(v.object({ q: v.string(), choices: v.array(v.string()) })),
});
const quizOut = v.object({
  moduleId: v.string(), total: v.number(), bestCorrect: v.number(),
  passed: v.boolean(), attempts: v.number(),
});

export const overview = query({
  // now = เวลาจากหน้าเว็บ (ตอนเปิดหน้า) — ใช้คู่กับเวลาเซิร์ฟเวอร์ เอาค่าที่ใหม่กว่า จึงย้อนเวลาเพื่อยืดสิทธิ์ไม่ได้
  args: { lang: langValidator, now: v.number() },
  returns: v.union(
    v.object({ status: v.literal("signedOut") }),
    v.object({ status: v.literal("noMembership") }),
    v.object({
      status: v.literal("ok"),
      membership: v.object({ plan: planValidator, expiresAt: v.number() }),
      modules: v.array(moduleOut),
      doneLessonIds: v.array(v.string()),
      quizzes: v.array(quizOut),
      passPercent: v.number(),
    }),
  ),
  handler: async (ctx, { lang, now: clientNow }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { status: "signedOut" as const };
    const membership = await getMembership(ctx, userId, Math.max(clientNow, Date.now()));
    if (membership === null) return { status: "noMembership" as const };

    const { lessons, quizzes } = await loadProgress(ctx, userId);
    return {
      status: "ok" as const,
      membership: { plan: membership.plan, expiresAt: membership.expiresAt },
      modules: courseFor(lang).modules.map((m) => ({
        id: m.id, tag: m.tag, title: m.title, practice: m.practice,
        lessons: m.lessons.map((l) => ({
          id: l.id, title: l.title, notes: l.notes, minutes: l.minutes, embedUrl: videoEmbedUrl(l.videoId),
        })),
        quiz: m.quiz.map((q) => ({ q: q.q, choices: q.choices })),  // ไม่ส่งเฉลย/คำอธิบาย
      })),
      doneLessonIds: lessons.map((l) => l.lessonId),
      quizzes: quizzes.map((r) => ({
        moduleId: r.moduleId, total: r.total, bestCorrect: r.bestCorrect, passed: r.passed, attempts: r.attempts,
      })),
      passPercent: PASS_PERCENT,
    };
  },
});

/* ---------- กด "เรียนจบบทนี้" / ยกเลิก ---------- */
export const setLessonDone = mutation({
  args: { lessonId: v.string(), done: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { lessonId, done }) => {
    const now = Date.now();
    const userId = await requireMember(ctx, now);
    if (!LESSON_IDS.has(lessonId)) throw new ConvexError("UNKNOWN_LESSON");
    const row = await ctx.db
      .query("lessonProgress")
      .withIndex("by_userId_and_lessonId", (q) => q.eq("userId", userId).eq("lessonId", lessonId))
      .unique();
    if (done && !row) await ctx.db.insert("lessonProgress", { userId, lessonId, completedAt: now });
    if (!done && row) await ctx.db.delete("lessonProgress", row._id);
    return null;
  },
});

/* ---------- ส่งคำตอบแบบทดสอบ — ตรวจที่เซิร์ฟเวอร์ แล้วค่อยส่งเฉลยกลับไป ---------- */
export const submitQuiz = mutation({
  args: { moduleId: v.string(), lang: langValidator, answers: v.array(v.number()) },
  returns: v.object({
    correct: v.number(),
    total: v.number(),
    passed: v.boolean(),
    results: v.array(v.object({ correct: v.boolean(), answer: v.number(), explain: v.string() })),
  }),
  handler: async (ctx, { moduleId, lang, answers }) => {
    const userId = await requireMember(ctx, Date.now());
    const mod = courseFor(lang).modules.find((m) => m.id === moduleId);
    if (!mod || !QUIZ_MODULE_IDS.has(moduleId)) throw new ConvexError("UNKNOWN_QUIZ");
    if (answers.length !== mod.quiz.length) throw new ConvexError("BAD_ANSWERS");

    const results = mod.quiz.map((q, i) => ({ correct: answers[i] === q.answer, answer: q.answer, explain: q.explain }));
    const correct = results.filter((r) => r.correct).length;
    const total = mod.quiz.length;
    const passes = (n: number) => n * 100 >= PASS_PERCENT * total;

    const prev = await ctx.db
      .query("quizResults")
      .withIndex("by_userId_and_moduleId", (q) => q.eq("userId", userId).eq("moduleId", moduleId))
      .unique();
    if (prev) {
      const best = Math.max(prev.bestCorrect, correct);
      await ctx.db.patch("quizResults", prev._id, {
        total, bestCorrect: best, passed: prev.passed || passes(best), attempts: prev.attempts + 1,
      });
    } else {
      await ctx.db.insert("quizResults", { userId, moduleId, total, bestCorrect: correct, passed: passes(correct), attempts: 1 });
    }
    return { correct, total, passed: passes(correct) || (prev?.passed ?? false), results };
  },
});

/* ---------- แอดมิน: ล้างความคืบหน้าของผู้เรียน 1 คน (เรียกจาก Convex dashboard / CLI เท่านั้น) ----------
 * npx convex run learn:resetProgress '{"userId":"..."}' */
export const resetProgress = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const { lessons, quizzes } = await loadProgress(ctx, userId);
    for (const l of lessons) await ctx.db.delete("lessonProgress", l._id);
    for (const q of quizzes) await ctx.db.delete("quizResults", q._id);
    return null;
  },
});
