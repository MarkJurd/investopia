/* เนื้อหาคอร์ส (โมดูล / บทเรียน / แบบทดสอบ / ไฟล์แนบ) — เก็บในฐานข้อมูล แก้ได้จากหน้า /admin
 * ถ้าฐานข้อมูลยังว่าง (ยังไม่กด "นำเข้าคอร์ส" ในหน้าแอดมิน) จะใช้เนื้อหาจาก lib/course.ts แทน เว็บจึงไม่พัง
 * ⚠️ key ของบท/โมดูล (เช่น "m2-1") ผูกกับความคืบหน้าของผู้เรียน — ระบบไม่ให้แก้ */
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { COURSE, INDICATOR_ONLY_LESSONS } from "../lib/course";

export const MODULE_TAG = "โมดูล";          // ป้ายหน้าชื่อโมดูล → "โมดูล 1", "โมดูล 2", ... (เลขตามลำดับที่แสดง)
export const NEW_LESSON_DAYS = 14;          // ป้าย "ใหม่" แสดงกี่วัน
export const MAX_FILE_MB = 50;              // ขนาดไฟล์แนบสูงสุดต่อไฟล์

export const quizItemValidator = v.object({
  q: v.string(),
  choices: v.array(v.string()),
  answer: v.number(),          // ลำดับข้อที่ถูก (ข้อแรก = 0)
  explain: v.string(),
});
export type QuizItem = { q: string; choices: string[]; answer: number; explain: string };

export type CourseFile = { id: Id<"lessonFiles"> | null; storageId: Id<"_storage">; name: string; size: number };
export type CourseLesson = {
  id: Id<"courseLessons"> | null;   // null = มาจาก lib/course.ts (ยังไม่นำเข้า)
  key: string;
  title: string;
  notes: string;
  videoId: string;
  minutes: number;
  hidden: boolean;
  indicatorOnly: boolean;
  newSince: number | null;
  files: CourseFile[];
};
export type CourseModule = {
  id: Id<"courseModules"> | null;
  key: string;
  title: string;
  practice: string;
  hidden: boolean;
  quiz: QuizItem[];
  lessons: CourseLesson[];
};

/** โมดูลทั้งหมด (รวมที่ซ่อน) เรียงตามลำดับ — ถ้าฐานข้อมูลว่างใช้ lib/course.ts */
export async function loadCourse(ctx: QueryCtx): Promise<{ fromDb: boolean; modules: CourseModule[] }> {
  const mods = await ctx.db.query("courseModules").withIndex("by_order").take(100);
  if (mods.length === 0) return { fromDb: false, modules: codeCourse() };

  const modules: CourseModule[] = [];
  for (const m of mods) {
    const lessons = await ctx.db
      .query("courseLessons")
      .withIndex("by_moduleId_and_order", (q) => q.eq("moduleId", m._id))
      .take(200);
    const out: CourseLesson[] = [];
    for (const l of lessons) out.push({ ...lessonFields(l), files: await lessonFiles(ctx, l._id) });
    modules.push({ id: m._id, key: m.key, title: m.title, practice: m.practice, hidden: m.hidden, quiz: m.quiz, lessons: out });
  }
  return { fromDb: true, modules };
}

/** เฉพาะส่วนที่ผู้เรียนเห็น: ตัดโมดูล/บทที่ซ่อนออก แล้วใส่ป้าย "โมดูล N" ตามลำดับ */
export function visibleModules(modules: CourseModule[]): (CourseModule & { tag: string })[] {
  return modules
    .filter((m) => !m.hidden)
    .map((m, i) => ({ ...m, tag: `${MODULE_TAG} ${i + 1}`, lessons: m.lessons.filter((l) => !l.hidden) }));
}

/** หาบทจาก key (ใช้ตอนผู้เรียนกดเรียนจบ / ขอลิงก์วิดีโอ) — บทที่ซ่อนหรือโมดูลที่ซ่อน = ไม่พบ */
export async function findVisibleLesson(ctx: QueryCtx, key: string): Promise<CourseLesson | null> {
  const l = await ctx.db.query("courseLessons").withIndex("by_key", (q) => q.eq("key", key)).unique();
  if (l === null) {
    const anyDb = await ctx.db.query("courseModules").withIndex("by_order").first();
    if (anyDb !== null) return null;
    for (const m of codeCourse()) for (const cl of m.lessons) if (cl.key === key) return cl;
    return null;
  }
  const mod = await ctx.db.get("courseModules", l.moduleId);
  if (l.hidden || mod === null || mod.hidden) return null;
  return { ...lessonFields(l), files: await lessonFiles(ctx, l._id) };
}

export async function findVisibleModule(ctx: QueryCtx, key: string): Promise<CourseModule | null> {
  const { modules } = await loadCourse(ctx);
  return modules.find((m) => m.key === key && !m.hidden) ?? null;
}

function lessonFields(l: Doc<"courseLessons">): Omit<CourseLesson, "files"> {
  return {
    id: l._id, key: l.key, title: l.title, notes: l.notes, videoId: l.videoId, minutes: l.minutes,
    hidden: l.hidden, indicatorOnly: l.indicatorOnly, newSince: l.newSince ?? null,
  };
}

async function lessonFiles(ctx: QueryCtx, lessonId: Id<"courseLessons">): Promise<CourseFile[]> {
  const rows = await ctx.db.query("lessonFiles").withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId)).take(30);
  return rows.map((f) => ({ id: f._id, storageId: f.storageId, name: f.name, size: f.size }));
}

/** เนื้อหาตั้งต้นจาก lib/course.ts (ใช้ก่อนนำเข้า และใช้ตอนกด "นำเข้าคอร์ส") */
export function codeCourse(): CourseModule[] {
  return COURSE.modules.map((m) => ({
    id: null, key: m.id, title: m.title, practice: m.practice, hidden: false,
    quiz: m.quiz.map((q) => ({ q: q.q, choices: [...q.choices], answer: q.answer, explain: q.explain })),
    lessons: m.lessons.map((l) => ({
      id: null, key: l.id, title: l.title, notes: l.notes, videoId: l.videoId, minutes: l.minutes,
      hidden: false, indicatorOnly: INDICATOR_ONLY_LESSONS.has(l.id), newSince: null, files: [],
    })),
  }));
}

/** ชื่อบท (ใช้แสดงแท็ก "ถามเรื่องบทเรียน" ในคอมมูนิตี้) */
export async function lessonTitle(ctx: QueryCtx, key: string): Promise<string | null> {
  const l = await ctx.db.query("courseLessons").withIndex("by_key", (q) => q.eq("key", key)).unique();
  if (l !== null) return l.title;
  for (const m of codeCourse()) for (const cl of m.lessons) if (cl.key === key) return cl.title;
  return null;
}
