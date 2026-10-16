/* ห้องเรียน (/learn): เนื้อหาบทเรียน · ความคืบหน้า · แบบทดสอบ · ไฟล์แนบ · ใบประกาศ
 * ทุกฟังก์ชันเช็กสิทธิ์สมาชิกที่นี่ (ฝั่งเซิร์ฟเวอร์) — หน้าเว็บไม่มีทางได้เนื้อหา/เฉลยถ้าไม่ใช่สมาชิก
 * เนื้อหาคอร์สอยู่ในฐานข้อมูล (แก้ที่หน้า /admin) — ดู convex/course.ts */
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getMembership } from "./payments";
import { isAdminUser } from "./admin";
import { planValidator } from "./plans";
import { signBunnyEmbedUrl } from "./bunny";
import { findVisibleLesson, findVisibleModule, loadCourse, NEW_LESSON_DAYS, visibleModules } from "./course";

const PASS_PERCENT = 70;        // ผ่านแบบทดสอบเมื่อได้ ≥ 70%
const DAY = 24 * 60 * 60 * 1000;

const langValidator = v.optional(v.union(v.literal("th"), v.literal("en")));   // ไม่ใช้แล้ว (เว็บเหลือภาษาไทย) — เก็บไว้ให้หน้าเว็บเวอร์ชันเก่าไม่พัง

/* ---------- วิดีโอ (Bunny Stream) ----------
 * videoId ของแต่ละบทแก้ได้ในหน้า /admin · ลิงก์เล่นสร้างตอนเปิดบทเท่านั้น (action videoUrl)
 * ยังไม่ตั้งค่า Bunny (BUNNY_LIBRARY_ID / BUNNY_TOKEN_KEY) หรือบทไม่มี videoId = ขึ้น "เร็วๆ นี้" */
const VIDEO_LINK_HOURS = 4;    // ลิงก์เล่นหมดอายุกี่ชั่วโมง (เปิดบทใหม่ = ได้ลิงก์ใหม่)
const bunnyReady = () => Boolean(process.env.BUNNY_LIBRARY_ID && process.env.BUNNY_TOKEN_KEY);

/* ---------- สิทธิ์ ---------- */
/** สิทธิ์เข้าห้องเรียน: สมาชิกที่ยังไม่หมดอายุ หรือแอดมิน (แอดมินที่ไม่มีแพ็กเกจ = ดูได้ทุกบทเหมือน VIP) */
async function getAccess(ctx: QueryCtx, userId: Id<"users">, now: number) {
  const membership = await getMembership(ctx, userId, now);
  if (membership !== null) return membership;
  if (await isAdminUser(ctx, userId)) return { plan: "vip" as const, expiresAt: now + 10 * 365 * 24 * 60 * 60 * 1000, indicatorBonus: true };
  return null;
}

async function requireMember(ctx: QueryCtx, now: number): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
  if ((await getAccess(ctx, userId, now)) === null) throw new ConvexError("NOT_A_MEMBER");
  return userId;
}

/** ผู้ที่เห็นบท Indicator ได้: แอดมิน หรือสมาชิกที่ได้รับ Indicator (รายปี 50 คนแรก / VIP) */
async function canSeeIndicator(ctx: QueryCtx, userId: Id<"users">, indicatorBonus: boolean): Promise<boolean> {
  return indicatorBonus || (await isAdminUser(ctx, userId));
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
const fileOut = v.object({ name: v.string(), size: v.number(), url: v.union(v.string(), v.null()) });
const lessonOut = v.object({
  id: v.string(), title: v.string(), notes: v.string(), minutes: v.number(),
  hasVideo: v.boolean(),                        // false = ยังไม่มีวิดีโอ → แสดง "เร็วๆ นี้"
  locked: v.boolean(),                          // true = บทนี้สำหรับผู้ที่ได้ Indicator เท่านั้น (ไม่ส่งเนื้อหา)
  isNew: v.boolean(),                           // ป้าย "ใหม่"
  files: v.array(fileOut),                      // ไฟล์แนบใต้คลิป (ว่างถ้าล็อก)
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
  handler: async (ctx, { now: clientNow }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { status: "signedOut" as const };
    const now = Math.max(clientNow, Date.now());
    const membership = await getAccess(ctx, userId, now);
    if (membership === null) return { status: "noMembership" as const };

    const { lessons, quizzes } = await loadProgress(ctx, userId);
    const videosOn = bunnyReady();
    const canIndicator = await canSeeIndicator(ctx, userId, membership.indicatorBonus);
    const modules = [];
    for (const m of visibleModules((await loadCourse(ctx)).modules)) {
      const outLessons = [];
      for (const l of m.lessons) {
        const locked = l.indicatorOnly && !canIndicator;
        const files = [];
        if (!locked) for (const f of l.files) files.push({ name: f.name, size: f.size, url: await ctx.storage.getUrl(f.storageId) });
        outLessons.push({
          id: l.key, title: l.title, notes: locked ? "" : l.notes, minutes: l.minutes, locked,
          hasVideo: !locked && videosOn && l.videoId !== "",
          isNew: l.newSince !== null && now - l.newSince < NEW_LESSON_DAYS * DAY,
          files,
        });
      }
      modules.push({
        id: m.key, tag: m.tag, title: m.title, practice: m.practice, lessons: outLessons,
        quiz: m.quiz.map((q) => ({ q: q.q, choices: q.choices })),  // ไม่ส่งเฉลย/คำอธิบาย
      });
    }
    return {
      status: "ok" as const,
      membership: { plan: membership.plan, expiresAt: membership.expiresAt },
      modules,
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
    const lesson = await findVisibleLesson(ctx, lessonId);
    if (lesson === null) throw new ConvexError("UNKNOWN_LESSON");
    if (lesson.indicatorOnly) {
      const m = await getAccess(ctx, userId, now);
      if (!(await canSeeIndicator(ctx, userId, m?.indicatorBonus ?? false))) throw new ConvexError("LOCKED");
    }
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
  handler: async (ctx, { moduleId, answers }) => {
    const userId = await requireMember(ctx, Date.now());
    const mod = await findVisibleModule(ctx, moduleId);
    if (!mod || mod.quiz.length === 0) throw new ConvexError("UNKNOWN_QUIZ");
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
      // จำนวนข้อเปลี่ยน (แอดมินแก้แบบทดสอบ) = เริ่มนับคะแนนดีสุดใหม่ แต่ "ผ่านแล้ว" ยังคงอยู่
      const best = prev.total === total ? Math.max(prev.bestCorrect, correct) : correct;
      await ctx.db.patch("quizResults", prev._id, {
        total, bestCorrect: best, passed: prev.passed || passes(best), attempts: prev.attempts + 1,
      });
    } else {
      await ctx.db.insert("quizResults", { userId, moduleId, total, bestCorrect: correct, passed: passes(correct), attempts: 1 });
    }
    return { correct, total, passed: passes(correct) || (prev?.passed ?? false), results };
  },
});

/* ---------- ลิงก์เล่นวิดีโอ: เช็กสิทธิ์สมาชิกก่อน แล้วค่อยเซ็นลิงก์ (คนที่ไม่ใช่สมาชิกไม่มีทางได้ลิงก์) ---------- */
export const videoIdForMember = internalQuery({
  args: { userId: v.id("users"), lessonId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { userId, lessonId }) => {
    const m = await getAccess(ctx, userId, Date.now());
    if (m === null) return null;
    const lesson = await findVisibleLesson(ctx, lessonId);
    if (lesson === null || lesson.videoId === "") return null;
    if (lesson.indicatorOnly && !(await canSeeIndicator(ctx, userId, m.indicatorBonus))) return null;
    return lesson.videoId;
  },
});

export const videoUrl = action({
  args: { lessonId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { lessonId }): Promise<string | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const tokenKey = process.env.BUNNY_TOKEN_KEY;
    if (!libraryId || !tokenKey) return null;
    const videoId: string | null = await ctx.runQuery(internal.learn.videoIdForMember, { userId, lessonId });
    if (videoId === null) return null;
    const expires = Math.floor(Date.now() / 1000) + VIDEO_LINK_HOURS * 3600;
    return await signBunnyEmbedUrl(libraryId, tokenKey, videoId, expires);
  },
});

/* ---------- ใบประกาศเรียนจบ: เรียนจบทุกบท (ที่เปิดได้) + ผ่านแบบทดสอบทุกโมดูล ---------- */
export const certificate = query({
  args: { now: v.number() },
  returns: v.union(
    v.object({ status: v.literal("notEligible"), done: v.number(), total: v.number() }),
    v.object({ status: v.literal("ok"), name: v.string(), completedAt: v.number(), certId: v.string() }),
  ),
  handler: async (ctx, { now: clientNow }) => {
    const now = Math.max(clientNow, Date.now());
    const userId = await requireMember(ctx, now);
    const m = await getAccess(ctx, userId, now);
    const canIndicator = await canSeeIndicator(ctx, userId, m?.indicatorBonus ?? false);
    const { lessons, quizzes } = await loadProgress(ctx, userId);
    const doneAt = new Map(lessons.map((l) => [l.lessonId, l.completedAt]));
    const passed = new Set(quizzes.filter((q) => q.passed).map((q) => q.moduleId));

    let total = 0, done = 0, last = 0;
    for (const mod of visibleModules((await loadCourse(ctx)).modules)) {
      for (const l of mod.lessons) {
        if (l.indicatorOnly && !canIndicator) continue;
        total++;
        const t = doneAt.get(l.key);
        if (t !== undefined) { done++; last = Math.max(last, t); }
      }
      if (mod.quiz.length > 0) { total++; if (passed.has(mod.key)) done++; }
    }
    if (total === 0 || done < total) return { status: "notEligible" as const, done, total };

    const user = await ctx.db.get("users", userId);
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    return {
      status: "ok" as const,
      name: user?.name ?? profile?.displayName ?? "",
      completedAt: last || now,
      certId: `INV-${(userId as string).slice(-8).toUpperCase()}`,
    };
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
