/* หน้า /admin → แท็บ "บทเรียน": แก้โมดูล / บท / วิดีโอ / ไฟล์แนบ / แบบทดสอบ — แอดมินเท่านั้น (เช็กทุกฟังก์ชัน)
 * ⚠️ key ของบท/โมดูล ผูกกับความคืบหน้าผู้เรียน → ไม่มีฟังก์ชันไหนแก้ key */
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdminUser, requireAdmin } from "./admin";
import { codeCourse, loadCourse, MAX_FILE_MB, quizItemValidator, type QuizItem } from "./course";

const MAX_TITLE = 200;
const MAX_TEXT = 5000;
const FANOUT_BATCH = 100;

function clean(s: string, max: number): string {
  const t = s.trim();
  if (t.length > max) throw new ConvexError("TOO_LONG");
  return t;
}

async function uniqueKey(ctx: MutationCtx, table: "courseModules" | "courseLessons", prefix: string): Promise<string> {
  for (;;) {
    const key = `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const hit = table === "courseModules"
      ? await ctx.db.query("courseModules").withIndex("by_key", (q) => q.eq("key", key)).first()
      : await ctx.db.query("courseLessons").withIndex("by_key", (q) => q.eq("key", key)).first();
    if (hit === null) return key;
  }
}

async function requireImported(ctx: MutationCtx) {
  if ((await ctx.db.query("courseModules").withIndex("by_order").first()) === null) throw new ConvexError("NOT_IMPORTED");
}

/* ---------- อ่านทั้งคอร์ส (รวมเฉลย/ส่วนที่ซ่อน) ---------- */
const fileOut = v.object({ id: v.union(v.id("lessonFiles"), v.null()), name: v.string(), size: v.number(), url: v.union(v.string(), v.null()) });
const lessonOut = v.object({
  id: v.union(v.id("courseLessons"), v.null()), key: v.string(), title: v.string(), notes: v.string(), videoId: v.string(),
  minutes: v.number(), hidden: v.boolean(), indicatorOnly: v.boolean(), free: v.boolean(), newSince: v.union(v.number(), v.null()), files: v.array(fileOut),
});
const moduleOut = v.object({
  id: v.union(v.id("courseModules"), v.null()), key: v.string(), title: v.string(), practice: v.string(), hidden: v.boolean(),
  quiz: v.array(quizItemValidator), lessons: v.array(lessonOut),
});

export const tree = query({
  args: {},
  returns: v.object({ fromDb: v.boolean(), bunnyListReady: v.boolean(), modules: v.array(moduleOut) }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const { fromDb, modules } = await loadCourse(ctx);
    const out = [];
    for (const m of modules) {
      const lessons = [];
      for (const l of m.lessons) {
        const files = [];
        for (const f of l.files) files.push({ id: f.id, name: f.name, size: f.size, url: await ctx.storage.getUrl(f.storageId) });
        lessons.push({ ...l, files });
      }
      out.push({ ...m, lessons });
    }
    return {
      fromDb,
      bunnyListReady: Boolean(process.env.BUNNY_API_KEY && process.env.BUNNY_LIBRARY_ID),
      modules: out,
    };
  },
});

/* ---------- นำเข้าคอร์สจาก lib/course.ts (ครั้งแรกครั้งเดียว) ---------- */
export const importCourse = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    if ((await ctx.db.query("courseModules").withIndex("by_order").first()) !== null) throw new ConvexError("ALREADY_IMPORTED");
    let mi = 0;
    for (const m of codeCourse()) {
      const moduleId = await ctx.db.insert("courseModules", {
        key: m.key, order: mi++, title: m.title, practice: m.practice, hidden: false, quiz: m.quiz,
      });
      let li = 0;
      for (const l of m.lessons) {
        await ctx.db.insert("courseLessons", {
          key: l.key, moduleId, order: li++, title: l.title, notes: l.notes, videoId: l.videoId,
          minutes: l.minutes, hidden: false, indicatorOnly: l.indicatorOnly,
        });
      }
    }
    return null;
  },
});

/* ---------- โมดูล ---------- */
export const addModule = mutation({
  args: { title: v.string() },
  returns: v.id("courseModules"),
  handler: async (ctx, { title }) => {
    await requireAdmin(ctx);
    await requireImported(ctx);
    const last = await ctx.db.query("courseModules").withIndex("by_order").order("desc").first();
    return await ctx.db.insert("courseModules", {
      key: await uniqueKey(ctx, "courseModules", "mod"), order: (last?.order ?? -1) + 1,
      title: clean(title, MAX_TITLE) || "โมดูลใหม่", practice: "", hidden: true, quiz: [],
    });
  },
});

export const saveModule = mutation({
  args: { id: v.id("courseModules"), title: v.string(), practice: v.string(), hidden: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, title, practice, hidden }) => {
    await requireAdmin(ctx);
    const t = clean(title, MAX_TITLE);
    if (!t) throw new ConvexError("EMPTY");
    await ctx.db.patch("courseModules", id, { title: t, practice: clean(practice, MAX_TEXT), hidden });
    return null;
  },
});

/** ลบโมดูล: ถ้ามีบทข้างใน ต้องส่ง deleteLessons: true (หน้าเว็บถามยืนยันก่อน) → ลบบททั้งหมด + ไฟล์แนบของบทเหล่านั้นด้วย
 *  ความคืบหน้า/ผลแบบทดสอบเดิมของผู้เรียนไม่ถูกลบ แต่จะไม่แสดงอีก (ไม่มีบท/โมดูลนั้นแล้ว) */
export const deleteModule = mutation({
  args: { id: v.id("courseModules"), deleteLessons: v.optional(v.boolean()) },
  returns: v.object({ lessons: v.number(), files: v.number() }),
  handler: async (ctx, { id, deleteLessons }) => {
    await requireAdmin(ctx);
    const lessons = await ctx.db.query("courseLessons").withIndex("by_moduleId_and_order", (q) => q.eq("moduleId", id)).take(500);
    if (lessons.length > 0 && deleteLessons !== true) throw new ConvexError("HAS_LESSONS");
    let files = 0;
    for (const l of lessons) {
      for (const f of await ctx.db.query("lessonFiles").withIndex("by_lessonId", (q) => q.eq("lessonId", l._id)).take(50)) {
        await ctx.storage.delete(f.storageId);
        await ctx.db.delete("lessonFiles", f._id);
        files++;
      }
      await ctx.db.delete("courseLessons", l._id);
    }
    await ctx.db.delete("courseModules", id);
    return { lessons: lessons.length, files };
  },
});

export const reorderModules = mutation({
  args: { ids: v.array(v.id("courseModules")) },
  returns: v.null(),
  handler: async (ctx, { ids }) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("courseModules").withIndex("by_order").take(100);
    if (ids.length !== all.length || new Set(ids).size !== ids.length || !all.every((m) => ids.includes(m._id))) {
      throw new ConvexError("STALE");
    }
    for (let i = 0; i < ids.length; i++) await ctx.db.patch("courseModules", ids[i], { order: i });
    return null;
  },
});

export const saveQuiz = mutation({
  args: { moduleId: v.id("courseModules"), quiz: v.array(quizItemValidator) },
  returns: v.null(),
  handler: async (ctx, { moduleId, quiz }) => {
    await requireAdmin(ctx);
    if (quiz.length > 50) throw new ConvexError("TOO_LONG");
    const out: QuizItem[] = quiz.map((q) => {
      const choices = q.choices.map((c) => clean(c, MAX_TITLE)).filter(Boolean);
      const item = { q: clean(q.q, MAX_TEXT), choices, answer: q.answer, explain: clean(q.explain, MAX_TEXT) };
      if (!item.q || choices.length < 2 || choices.length > 8) throw new ConvexError("BAD_QUIZ");
      if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= choices.length) throw new ConvexError("BAD_QUIZ");
      return item;
    });
    await ctx.db.patch("courseModules", moduleId, { quiz: out });
    return null;
  },
});

/* ---------- บทเรียน ---------- */
export const addLesson = mutation({
  args: { moduleId: v.id("courseModules"), title: v.string() },
  returns: v.id("courseLessons"),
  handler: async (ctx, { moduleId, title }) => {
    await requireAdmin(ctx);
    if ((await ctx.db.get("courseModules", moduleId)) === null) throw new ConvexError("NOT_FOUND");
    const last = await ctx.db.query("courseLessons").withIndex("by_moduleId_and_order", (q) => q.eq("moduleId", moduleId)).order("desc").first();
    // บทใหม่เริ่มแบบ "ซ่อน" — กรอกให้ครบแล้วค่อยกดแสดง
    return await ctx.db.insert("courseLessons", {
      key: await uniqueKey(ctx, "courseLessons", "l"), moduleId, order: (last?.order ?? -1) + 1,
      title: clean(title, MAX_TITLE) || "บทใหม่", notes: "", videoId: "", minutes: 0, hidden: true, indicatorOnly: false,
    });
  },
});

export const saveLesson = mutation({
  args: {
    id: v.id("courseLessons"), title: v.string(), notes: v.string(), videoId: v.string(),
    minutes: v.number(), hidden: v.boolean(), indicatorOnly: v.boolean(), free: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, a) => {
    await requireAdmin(ctx);
    const t = clean(a.title, MAX_TITLE);
    if (!t) throw new ConvexError("EMPTY");
    const videoId = a.videoId.trim();
    if (videoId !== "" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId)) throw new ConvexError("BAD_VIDEO_ID");
    await ctx.db.patch("courseLessons", a.id, {
      title: t, notes: clean(a.notes, MAX_TEXT), videoId: videoId.toLowerCase(),
      minutes: Math.max(0, Math.min(600, Math.round(a.minutes))), hidden: a.hidden, indicatorOnly: a.indicatorOnly,
      ...(a.free !== undefined ? { free: a.free } : {}),
    });
    return null;
  },
});

export const deleteLesson = mutation({
  args: { id: v.id("courseLessons") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    for (const f of await ctx.db.query("lessonFiles").withIndex("by_lessonId", (q) => q.eq("lessonId", id)).take(30)) {
      await ctx.storage.delete(f.storageId);
      await ctx.db.delete("lessonFiles", f._id);
    }
    await ctx.db.delete("courseLessons", id);
    return null;
  },
});

/** เรียงบทใหม่ภายในโมดูล (ids = บททั้งหมดของโมดูลนั้นตามลำดับใหม่) */
export const reorderLessons = mutation({
  args: { moduleId: v.id("courseModules"), ids: v.array(v.id("courseLessons")) },
  returns: v.null(),
  handler: async (ctx, { moduleId, ids }) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("courseLessons").withIndex("by_moduleId_and_order", (q) => q.eq("moduleId", moduleId)).take(200);
    if (ids.length !== all.length || new Set(ids).size !== ids.length || !all.every((l) => ids.includes(l._id))) {
      throw new ConvexError("STALE");
    }
    for (let i = 0; i < ids.length; i++) await ctx.db.patch("courseLessons", ids[i], { order: i });
    return null;
  },
});

/** ย้ายบทไปท้ายโมดูลอื่น */
export const moveLesson = mutation({
  args: { id: v.id("courseLessons"), moduleId: v.id("courseModules") },
  returns: v.null(),
  handler: async (ctx, { id, moduleId }) => {
    await requireAdmin(ctx);
    if ((await ctx.db.get("courseModules", moduleId)) === null) throw new ConvexError("NOT_FOUND");
    const last = await ctx.db.query("courseLessons").withIndex("by_moduleId_and_order", (q) => q.eq("moduleId", moduleId)).order("desc").first();
    await ctx.db.patch("courseLessons", id, { moduleId, order: (last?.order ?? -1) + 1 });
    return null;
  },
});

/* ---------- ป้าย "ใหม่" + แจ้งเตือนผู้เรียน ---------- */
export const announceLesson = mutation({
  args: { id: v.id("courseLessons"), notify: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { id, notify }) => {
    const adminId = await requireAdmin(ctx);
    const l = await ctx.db.get("courseLessons", id);
    if (l === null) throw new ConvexError("NOT_FOUND");
    await ctx.db.patch("courseLessons", id, { newSince: Date.now() });
    if (notify && !l.hidden) {
      await ctx.scheduler.runAfter(0, internal.adminCourse.notifyNewLesson, {
        lessonKey: l.key, actorId: adminId, preview: l.title.slice(0, 100), cursor: null,
      });
    }
    return null;
  },
});

export const clearNew = mutation({
  args: { id: v.id("courseLessons") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    await ctx.db.patch("courseLessons", id, { newSince: undefined });
    return null;
  },
});

/** ส่งแจ้งเตือน "บทเรียนใหม่" ให้สมาชิกที่ยังไม่หมดอายุ ทีละชุด (ทำงานเบื้องหลัง) */
export const notifyNewLesson = internalMutation({
  args: { lessonKey: v.string(), actorId: v.id("users"), preview: v.string(), cursor: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, a) => {
    const now = Date.now();
    const page = await ctx.db.query("memberships").paginate({ numItems: FANOUT_BATCH, cursor: a.cursor });
    const seen = new Set<string>();
    for (const m of page.page) {
      if (m.status !== "active" || m.expiresAt <= now || m.userId === a.actorId || seen.has(m.userId)) continue;
      seen.add(m.userId);
      const dup = await ctx.db
        .query("notifications")
        .withIndex("by_userId_and_lessonKey", (q) => q.eq("userId", m.userId).eq("lessonKey", a.lessonKey))
        .first();
      if (dup !== null) continue;
      await ctx.db.insert("notifications", {
        userId: m.userId, type: "new_lesson", actorId: a.actorId, lessonKey: a.lessonKey,
        byAdmin: true, preview: a.preview, read: false,
      });
    }
    if (!page.isDone) await ctx.scheduler.runAfter(0, internal.adminCourse.notifyNewLesson, { ...a, cursor: page.continueCursor });
    return null;
  },
});

/* ---------- ไฟล์แนบใต้คลิป ---------- */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const addLessonFile = mutation({
  args: { lessonId: v.id("courseLessons"), storageId: v.id("_storage"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, { lessonId, storageId, name }) => {
    await requireAdmin(ctx);
    const meta = await ctx.db.system.get("_storage", storageId);
    const lesson = await ctx.db.get("courseLessons", lessonId);
    const count = (await ctx.db.query("lessonFiles").withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId)).take(30)).length;
    if (!meta || !lesson || meta.size > MAX_FILE_MB * 1024 * 1024 || count >= 20) {
      await ctx.storage.delete(storageId);
      throw new ConvexError(!meta || !lesson ? "NOT_FOUND" : count >= 20 ? "TOO_MANY_FILES" : "FILE_TOO_BIG");
    }
    const n = name.trim().slice(0, 150) || "file";
    await ctx.db.insert("lessonFiles", { lessonId, storageId, name: n, size: meta.size });
    return null;
  },
});

export const deleteLessonFile = mutation({
  args: { id: v.id("lessonFiles") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const f = await ctx.db.get("lessonFiles", id);
    if (f === null) return null;
    await ctx.storage.delete(f.storageId);
    await ctx.db.delete("lessonFiles", id);
    return null;
  },
});

/* ---------- รายชื่อคลิปใน Bunny (ให้เลือกแทนการก๊อป Video ID) — ต้องตั้ง BUNNY_API_KEY ---------- */
export const isAdminInternal = internalQuery({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, { userId }) => isAdminUser(ctx, userId),
});

export const bunnyVideos = action({
  args: { search: v.optional(v.string()) },
  returns: v.array(v.object({ guid: v.string(), title: v.string(), seconds: v.number(), ready: v.boolean() })),
  handler: async (ctx, { search }): Promise<{ guid: string; title: string; seconds: number; ready: boolean }[]> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null || !(await ctx.runQuery(internal.adminCourse.isAdminInternal, { userId }))) throw new ConvexError("NOT_ADMIN");
    const key = process.env.BUNNY_API_KEY;
    const lib = process.env.BUNNY_LIBRARY_ID;
    if (!key || !lib) throw new ConvexError("BUNNY_NOT_CONFIGURED");
    const out: { guid: string; title: string; seconds: number; ready: boolean }[] = [];
    for (let page = 1; page <= 5; page++) {
      const params = new URLSearchParams({ page: String(page), itemsPerPage: "100", orderBy: "date" });
      if (search) params.set("search", search);
      const res = await fetch(`https://video.bunnycdn.com/library/${lib}/videos?${params}`, { headers: { AccessKey: key, accept: "application/json" } });
      if (!res.ok) throw new ConvexError(res.status === 401 ? "BUNNY_BAD_KEY" : "BUNNY_ERROR");
      const data = (await res.json()) as { items?: { guid?: unknown; title?: unknown; length?: unknown; status?: unknown }[]; totalItems?: unknown };
      for (const it of data.items ?? []) {
        if (typeof it.guid !== "string") continue;
        out.push({
          guid: it.guid,
          title: typeof it.title === "string" ? it.title : it.guid,
          seconds: typeof it.length === "number" ? it.length : 0,
          ready: it.status === 4,     // 4 = Bunny แปลงไฟล์เสร็จ พร้อมเล่น
        });
      }
      if (out.length >= (typeof data.totalItems === "number" ? data.totalItems : 0) || (data.items ?? []).length < 100) break;
    }
    return out;
  },
});

export type AdminLessonId = Id<"courseLessons">;
