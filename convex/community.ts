/* คอมมูนิตี้ (/community): โพสต์ · คอมเมนต์ · ไลก์ · แจ้งเตือน · ค้นหา · ภาพ
 * เข้าได้เฉพาะ "สมาชิกที่ยังไม่หมดอายุ" และ "แอดมิน" — เช็กที่เซิร์ฟเวอร์ทุกฟังก์ชัน
 * แอดมินกำหนดจาก env ADMIN_EMAILS (ดู convex/admin.ts)
 * กติกาเนื้อหา: ห้ามชี้ชวนซื้อขายหุ้นรายตัว / ห้ามตรวจพอร์ต / รายเดือน-3 เดือน ห้ามระบุเวลาตอบ */
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getMembership } from "./payments";
import { adminUserIds, isAdminUser } from "./admin";
import { planValidator } from "./plans";
import { COURSE } from "../lib/course";
import { COURSE_EN } from "../lib/course.en";

const MAX_POST = 3000;
const MAX_COMMENT = 2000;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const POSTS_PER_HOUR = 10;
const COMMENTS_PER_HOUR = 30;
const HOUR = 60 * 60 * 1000;
const NAME_MIN = 2;
const NAME_MAX = 20;
// ชื่อที่ห้ามใช้ (กันสวมรอยเป็นผู้สอน/ทีมงาน) — แอดมินใช้ได้
const RESERVED = ["admin", "แอดมิน", "ผู้สอน", "ทีมงาน", "investopia", "instructor", "staff", "moderator"];

const langValidator = v.union(v.literal("th"), v.literal("en"));
const tagValidator = v.union(v.literal("general"), v.literal("lesson"));
const targetTypeValidator = v.union(v.literal("post"), v.literal("comment"));

const LESSONS = {
  th: new Map(COURSE.modules.flatMap((m) => m.lessons.map((l) => [l.id, { title: l.title, moduleTag: m.tag }] as const))),
  en: new Map(COURSE_EN.modules.flatMap((m) => m.lessons.map((l) => [l.id, { title: l.title, moduleTag: m.tag }] as const))),
};

/* ---------- สิทธิ์ ---------- */
type Viewer = { userId: Id<"users">; admin: boolean };

async function getViewer(ctx: QueryCtx, clientNow: number): Promise<{ status: "signedOut" } | { status: "noMembership" } | { status: "ok"; viewer: Viewer }> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return { status: "signedOut" };
  if (await isAdminUser(ctx, userId)) return { status: "ok", viewer: { userId, admin: true } };
  if ((await getMembership(ctx, userId, Math.max(clientNow, Date.now()))) === null) return { status: "noMembership" };
  return { status: "ok", viewer: { userId, admin: false } };
}

async function requireViewer(ctx: QueryCtx): Promise<Viewer> {
  const r = await getViewer(ctx, 0);
  if (r.status === "signedOut") throw new ConvexError("NOT_SIGNED_IN");
  if (r.status === "noMembership") throw new ConvexError("NOT_A_MEMBER");
  return r.viewer;
}

async function getProfile(ctx: QueryCtx, userId: Id<"users">): Promise<Doc<"profiles"> | null> {
  return await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
}

/* ---------- ข้อมูลผู้เขียน (แคชต่อคำขอ) ---------- */
type AuthorInfo = { name: string; isAdmin: boolean; plan: Doc<"memberships">["plan"] | null };
type AuthorCache = Map<Id<"users">, AuthorInfo>;

async function authorInfo(ctx: QueryCtx, authorId: Id<"users">, viewer: Viewer, lang: "th" | "en", now: number, cache: AuthorCache): Promise<AuthorInfo> {
  const hit = cache.get(authorId);
  if (hit) return hit;
  const profile = await getProfile(ctx, authorId);
  const isAdmin = await isAdminUser(ctx, authorId);
  const name = profile?.displayName ?? (isAdmin ? (lang === "en" ? "Mark" : "มาร์ค") : (lang === "en" ? "Member" : "สมาชิก"));
  // แผนของผู้เขียน: เห็นเฉพาะแอดมิน (ใช้ดูว่าใครควรตอบก่อน) — สมาชิกคนอื่นไม่เห็น
  const plan = viewer.admin && !isAdmin ? ((await getMembership(ctx, authorId, now))?.plan ?? null) : null;
  const info = { name, isAdmin, plan };
  cache.set(authorId, info);
  return info;
}

/* ---------- รูปแบบข้อมูลที่ส่งให้หน้าเว็บ ---------- */
const postOut = v.object({
  id: v.string(), authorName: v.string(), authorIsAdmin: v.boolean(), isMine: v.boolean(),
  body: v.string(), tag: tagValidator, lessonId: v.union(v.string(), v.null()), lessonTitle: v.union(v.string(), v.null()),
  imageUrls: v.array(v.string()), likeCount: v.number(), commentCount: v.number(), likedByMe: v.boolean(),
  createdAt: v.number(), editedAt: v.union(v.number(), v.null()), pinned: v.boolean(),
  hidden: v.boolean(), reportCount: v.number(), authorPlan: v.union(planValidator, v.null()),
});
const commentOut = v.object({
  id: v.string(), authorName: v.string(), authorIsAdmin: v.boolean(), isMine: v.boolean(),
  body: v.string(), likeCount: v.number(), likedByMe: v.boolean(), createdAt: v.number(),
  editedAt: v.union(v.number(), v.null()), reportCount: v.number(), authorPlan: v.union(planValidator, v.null()),
});

async function likedBy(ctx: QueryCtx, userId: Id<"users">, targetId: string): Promise<boolean> {
  const row = await ctx.db.query("likes").withIndex("by_userId_and_targetId", (q) => q.eq("userId", userId).eq("targetId", targetId)).first();
  return row !== null;
}

async function toPostView(ctx: QueryCtx, post: Doc<"posts">, viewer: Viewer, lang: "th" | "en", now: number, cache: AuthorCache) {
  const a = await authorInfo(ctx, post.authorId, viewer, lang, now, cache);
  const urls: string[] = [];
  for (const id of post.imageIds) {
    const url = await ctx.storage.getUrl(id);
    if (url) urls.push(url);
  }
  return {
    id: post._id,
    authorName: a.name, authorIsAdmin: a.isAdmin, isMine: post.authorId === viewer.userId,
    body: post.body, tag: post.tag,
    lessonId: post.lessonId ?? null,
    lessonTitle: post.lessonId ? (LESSONS[lang].get(post.lessonId)?.title ?? null) : null,
    imageUrls: urls, likeCount: post.likeCount, commentCount: post.commentCount,
    likedByMe: await likedBy(ctx, viewer.userId, post._id),
    createdAt: post._creationTime, editedAt: post.editedAt ?? null, pinned: post.pinned,
    hidden: viewer.admin ? post.hidden : false,
    reportCount: viewer.admin ? post.reportCount : 0,
    authorPlan: a.plan,
  };
}

async function toCommentView(ctx: QueryCtx, c: Doc<"comments">, viewer: Viewer, lang: "th" | "en", now: number, cache: AuthorCache) {
  const a = await authorInfo(ctx, c.authorId, viewer, lang, now, cache);
  return {
    id: c._id, authorName: a.name, authorIsAdmin: a.isAdmin, isMine: c.authorId === viewer.userId,
    body: c.body, likeCount: c.likeCount, likedByMe: await likedBy(ctx, viewer.userId, c._id),
    createdAt: c._creationTime, editedAt: c.editedAt ?? null,
    reportCount: viewer.admin ? c.reportCount : 0, authorPlan: a.plan,
  };
}

/* ---------- สถานะของฉัน + ตัวเลือกบทเรียนสำหรับแท็ก ---------- */
export const me = query({
  args: { lang: langValidator, now: v.number() },
  returns: v.union(
    v.object({ status: v.literal("signedOut") }),
    v.object({ status: v.literal("noMembership") }),
    v.object({
      status: v.literal("ok"),
      isAdmin: v.boolean(),
      displayName: v.union(v.string(), v.null()),
      lessons: v.array(v.object({ id: v.string(), title: v.string(), moduleTag: v.string() })),
    }),
  ),
  handler: async (ctx, { lang, now }) => {
    const r = await getViewer(ctx, now);
    if (r.status === "signedOut") return { status: "signedOut" as const };
    if (r.status === "noMembership") return { status: "noMembership" as const };
    const profile = await getProfile(ctx, r.viewer.userId);
    return {
      status: "ok" as const,
      isAdmin: r.viewer.admin,
      displayName: profile?.displayName ?? null,
      lessons: [...LESSONS[lang].entries()].map(([id, l]) => ({ id, title: l.title, moduleTag: l.moduleTag })),
    };
  },
});

export const setDisplayName = mutation({
  args: { name: v.string() },
  returns: v.null(),
  handler: async (ctx, { name }) => {
    const viewer = await requireViewer(ctx);
    const clean = name.trim().replace(/\s+/g, " ");
    if ([...clean].length < NAME_MIN || [...clean].length > NAME_MAX || !/^[\p{L}\p{M}\p{N} _.-]+$/u.test(clean)) {
      throw new ConvexError("NAME_INVALID");
    }
    const lower = clean.toLowerCase();
    if (!viewer.admin && RESERVED.some((w) => lower.includes(w))) throw new ConvexError("NAME_RESERVED");
    const existing = await getProfile(ctx, viewer.userId);
    if (existing) await ctx.db.patch("profiles", existing._id, { displayName: clean });
    else await ctx.db.insert("profiles", { userId: viewer.userId, displayName: clean });
    return null;
  },
});

/* ---------- อ่านโพสต์ ---------- */
const emptyPage = { page: [], isDone: true, continueCursor: "" };

export const feed = query({
  args: { paginationOpts: paginationOptsValidator, tag: v.optional(tagValidator), lang: langValidator, now: v.number() },
  returns: paginationResultValidator(postOut),
  handler: async (ctx, { paginationOpts, tag, lang, now }) => {
    const r = await getViewer(ctx, now);
    if (r.status !== "ok") return emptyPage;
    const { viewer } = r;
    const eff = Math.max(now, Date.now());
    const result = viewer.admin
      ? await (tag
          ? ctx.db.query("posts").withIndex("by_tag", (q) => q.eq("tag", tag)).order("desc").paginate(paginationOpts)
          : ctx.db.query("posts").order("desc").paginate(paginationOpts))
      : await ctx.db
          .query("posts")
          .withIndex("by_hidden_and_tag", (q) => (tag ? q.eq("hidden", false).eq("tag", tag) : q.eq("hidden", false)))
          .order("desc")
          .paginate(paginationOpts);
    const cache: AuthorCache = new Map();
    const page = [];
    for (const p of result.page) page.push(await toPostView(ctx, p, viewer, lang, eff, cache));
    return { ...result, page };
  },
});

export const pinned = query({
  args: { lang: langValidator, now: v.number() },
  returns: v.array(postOut),
  handler: async (ctx, { lang, now }) => {
    const r = await getViewer(ctx, now);
    if (r.status !== "ok") return [];
    const rows = await ctx.db.query("posts").withIndex("by_pinned", (q) => q.eq("pinned", true)).order("desc").take(5);
    const cache: AuthorCache = new Map();
    const out = [];
    for (const p of rows) if (r.viewer.admin || !p.hidden) out.push(await toPostView(ctx, p, r.viewer, lang, Math.max(now, Date.now()), cache));
    return out;
  },
});

export const search = query({
  args: { text: v.string(), lang: langValidator, now: v.number() },
  returns: v.array(postOut),
  handler: async (ctx, { text, lang, now }) => {
    const r = await getViewer(ctx, now);
    const t = text.trim();
    if (r.status !== "ok" || t.length < 2) return [];
    const rows = await ctx.db
      .query("posts")
      .withSearchIndex("search_body", (q) => (r.viewer.admin ? q.search("body", t) : q.search("body", t).eq("hidden", false)))
      .take(20);
    const cache: AuthorCache = new Map();
    const out = [];
    for (const p of rows) out.push(await toPostView(ctx, p, r.viewer, lang, Math.max(now, Date.now()), cache));
    return out;
  },
});

export const post = query({
  args: { postId: v.string(), lang: langValidator, now: v.number() },
  returns: v.union(v.null(), postOut),
  handler: async (ctx, { postId, lang, now }) => {
    const r = await getViewer(ctx, now);
    if (r.status !== "ok") return null;
    const id = ctx.db.normalizeId("posts", postId);
    const p = id ? await ctx.db.get("posts", id) : null;
    if (!p || (p.hidden && !r.viewer.admin)) return null;
    return await toPostView(ctx, p, r.viewer, lang, Math.max(now, Date.now()), new Map());
  },
});

export const comments = query({
  args: { postId: v.string(), lang: langValidator, now: v.number() },
  returns: v.array(commentOut),
  handler: async (ctx, { postId, lang, now }) => {
    const r = await getViewer(ctx, now);
    if (r.status !== "ok") return [];
    const id = ctx.db.normalizeId("posts", postId);
    if (!id) return [];
    const p = await ctx.db.get("posts", id);
    if (!p || (p.hidden && !r.viewer.admin)) return [];
    const rows = await ctx.db.query("comments").withIndex("by_postId", (q) => q.eq("postId", id)).order("asc").take(300);
    const cache: AuthorCache = new Map();
    const out = [];
    for (const c of rows) out.push(await toCommentView(ctx, c, r.viewer, lang, Math.max(now, Date.now()), cache));
    return out;
  },
});

/* ---------- เขียน/แก้/ลบโพสต์ ---------- */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireViewer(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

function cleanBody(raw: string, max: number): string {
  const body = raw.trim();
  if (body.length < 1) throw new ConvexError("EMPTY");
  if (body.length > max) throw new ConvexError("TOO_LONG");
  return body;
}

async function notify(ctx: MutationCtx, n: Omit<Doc<"notifications">, "_id" | "_creationTime" | "read">) {
  if (n.userId === n.actorId) return;
  await ctx.db.insert("notifications", { ...n, read: false });
}

export const createPost = mutation({
  args: { body: v.string(), tag: tagValidator, lessonId: v.optional(v.string()), imageIds: v.array(v.id("_storage")) },
  returns: v.string(),
  handler: async (ctx, { body, tag, lessonId, imageIds }) => {
    const viewer = await requireViewer(ctx);
    const discard = async () => { for (const id of imageIds) await ctx.storage.delete(id); };
    try {
      const text = cleanBody(body, MAX_POST);
      if (!viewer.admin && !(await getProfile(ctx, viewer.userId))) throw new ConvexError("NEED_DISPLAY_NAME");
      if (tag === "lesson" && (!lessonId || !LESSONS.th.has(lessonId))) throw new ConvexError("UNKNOWN_LESSON");
      if (imageIds.length > MAX_IMAGES) throw new ConvexError("TOO_MANY_IMAGES");
      for (const id of imageIds) {
        const meta = await ctx.db.system.get("_storage", id);
        if (!meta || meta.size > MAX_IMAGE_BYTES || !meta.contentType || !IMAGE_TYPES.has(meta.contentType)) throw new ConvexError("BAD_IMAGE");
      }
      const recent = await ctx.db.query("posts").withIndex("by_authorId", (q) => q.eq("authorId", viewer.userId)).order("desc").take(POSTS_PER_HOUR);
      if (recent.length >= POSTS_PER_HOUR && Date.now() - recent[POSTS_PER_HOUR - 1]._creationTime < HOUR) throw new ConvexError("RATE_LIMIT");

      const id = await ctx.db.insert("posts", {
        authorId: viewer.userId, body: text, tag, lessonId: tag === "lesson" ? lessonId : undefined, imageIds,
        likeCount: 0, commentCount: 0, reportCount: 0, pinned: false, hidden: false,
      });
      if (!viewer.admin) {
        for (const adminId of await adminUserIds(ctx)) {
          await notify(ctx, { userId: adminId, type: "new_post", actorId: viewer.userId, postId: id, byAdmin: false, preview: text.slice(0, 100) });
        }
      }
      return id;
    } catch (e) {
      await discard();
      throw e;
    }
  },
});

export const editPost = mutation({
  args: { postId: v.id("posts"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, { postId, body }) => {
    const viewer = await requireViewer(ctx);
    const p = await ctx.db.get("posts", postId);
    if (!p || p.authorId !== viewer.userId) throw new ConvexError("FORBIDDEN");
    await ctx.db.patch("posts", postId, { body: cleanBody(body, MAX_POST), editedAt: Date.now() });
    return null;
  },
});

async function removeLikesAndReports(ctx: MutationCtx, targetId: string) {
  for (const l of await ctx.db.query("likes").withIndex("by_targetId", (q) => q.eq("targetId", targetId)).take(1000)) await ctx.db.delete("likes", l._id);
  for (const r of await ctx.db.query("reports").withIndex("by_targetId", (q) => q.eq("targetId", targetId)).take(1000)) await ctx.db.delete("reports", r._id);
}

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, { postId }) => {
    const viewer = await requireViewer(ctx);
    const p = await ctx.db.get("posts", postId);
    if (!p) return null;
    if (p.authorId !== viewer.userId && !viewer.admin) throw new ConvexError("FORBIDDEN");
    for (const c of await ctx.db.query("comments").withIndex("by_postId", (q) => q.eq("postId", postId)).take(1000)) {
      await removeLikesAndReports(ctx, c._id);
      await ctx.db.delete("comments", c._id);
    }
    await removeLikesAndReports(ctx, postId);
    for (const n of await ctx.db.query("notifications").withIndex("by_postId", (q) => q.eq("postId", postId)).take(1000)) await ctx.db.delete("notifications", n._id);
    for (const id of p.imageIds) await ctx.storage.delete(id);
    await ctx.db.delete("posts", postId);
    return null;
  },
});

/* ---------- แอดมินจัดการโพสต์ ---------- */
export const setPinned = mutation({
  args: { postId: v.id("posts"), pinned: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { postId, pinned }) => {
    const viewer = await requireViewer(ctx);
    if (!viewer.admin) throw new ConvexError("FORBIDDEN");
    await ctx.db.patch("posts", postId, { pinned });
    return null;
  },
});

export const setHidden = mutation({
  args: { postId: v.id("posts"), hidden: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { postId, hidden }) => {
    const viewer = await requireViewer(ctx);
    if (!viewer.admin) throw new ConvexError("FORBIDDEN");
    await ctx.db.patch("posts", postId, { hidden });
    return null;
  },
});

/* ---------- คอมเมนต์ ---------- */
export const createComment = mutation({
  args: { postId: v.id("posts"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, { postId, body }) => {
    const viewer = await requireViewer(ctx);
    const text = cleanBody(body, MAX_COMMENT);
    const p = await ctx.db.get("posts", postId);
    if (!p || (p.hidden && !viewer.admin)) throw new ConvexError("NOT_FOUND");
    if (!viewer.admin && !(await getProfile(ctx, viewer.userId))) throw new ConvexError("NEED_DISPLAY_NAME");
    const recent = await ctx.db.query("comments").withIndex("by_authorId", (q) => q.eq("authorId", viewer.userId)).order("desc").take(COMMENTS_PER_HOUR);
    if (recent.length >= COMMENTS_PER_HOUR && Date.now() - recent[COMMENTS_PER_HOUR - 1]._creationTime < HOUR) throw new ConvexError("RATE_LIMIT");

    // ผู้ที่เคยคอมเมนต์ในโพสต์นี้เป็นแอดมิน ต้องรู้เมื่อมีคนตอบต่อ (เช่น คำถามต่อเนื่อง)
    const before = await ctx.db.query("comments").withIndex("by_postId", (q) => q.eq("postId", postId)).take(300);
    await ctx.db.insert("comments", { postId, authorId: viewer.userId, body: text, likeCount: 0, reportCount: 0 });
    await ctx.db.patch("posts", postId, { commentCount: p.commentCount + 1 });

    const recipients = new Set<Id<"users">>([p.authorId]);
    if (!viewer.admin) {
      for (const uid of new Set(before.map((c) => c.authorId))) if (await isAdminUser(ctx, uid)) recipients.add(uid);
    }
    for (const userId of recipients) {
      await notify(ctx, { userId, type: "comment", actorId: viewer.userId, postId, byAdmin: viewer.admin, preview: text.slice(0, 100) });
    }
    return null;
  },
});

export const editComment = mutation({
  args: { commentId: v.id("comments"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, { commentId, body }) => {
    const viewer = await requireViewer(ctx);
    const c = await ctx.db.get("comments", commentId);
    if (!c || c.authorId !== viewer.userId) throw new ConvexError("FORBIDDEN");
    await ctx.db.patch("comments", commentId, { body: cleanBody(body, MAX_COMMENT), editedAt: Date.now() });
    return null;
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  returns: v.null(),
  handler: async (ctx, { commentId }) => {
    const viewer = await requireViewer(ctx);
    const c = await ctx.db.get("comments", commentId);
    if (!c) return null;
    if (c.authorId !== viewer.userId && !viewer.admin) throw new ConvexError("FORBIDDEN");
    await removeLikesAndReports(ctx, commentId);
    await ctx.db.delete("comments", commentId);
    const p = await ctx.db.get("posts", c.postId);
    if (p) await ctx.db.patch("posts", p._id, { commentCount: Math.max(0, p.commentCount - 1) });
    return null;
  },
});

/* ---------- ไลก์ / รายงาน ---------- */
export const toggleLike = mutation({
  args: { targetType: targetTypeValidator, targetId: v.string() },
  returns: v.boolean(),                       // true = ไลก์อยู่ตอนนี้
  handler: async (ctx, { targetType, targetId }) => {
    const viewer = await requireViewer(ctx);
    const normalized = targetType === "post" ? ctx.db.normalizeId("posts", targetId) : ctx.db.normalizeId("comments", targetId);
    if (!normalized) throw new ConvexError("NOT_FOUND");
    const target = targetType === "post" ? await ctx.db.get("posts", normalized as Id<"posts">) : await ctx.db.get("comments", normalized as Id<"comments">);
    if (!target) throw new ConvexError("NOT_FOUND");
    const postId = targetType === "post" ? (target._id as Id<"posts">) : (target as Doc<"comments">).postId;

    const existing = await ctx.db.query("likes").withIndex("by_userId_and_targetId", (q) => q.eq("userId", viewer.userId).eq("targetId", targetId)).first();
    const delta = existing ? -1 : 1;
    if (existing) await ctx.db.delete("likes", existing._id);
    else await ctx.db.insert("likes", { userId: viewer.userId, targetType, targetId });
    const count = Math.max(0, target.likeCount + delta);
    if (targetType === "post") await ctx.db.patch("posts", target._id as Id<"posts">, { likeCount: count });
    else await ctx.db.patch("comments", target._id as Id<"comments">, { likeCount: count });

    if (!existing && target.authorId !== viewer.userId) {
      // แจ้งครั้งเดียวต่อคน/ต่อเป้าหมาย (ไลก์-เลิกไลก์-ไลก์ใหม่ ไม่แจ้งซ้ำ)
      const type = targetType === "post" ? "like_post" : "like_comment";
      const recent = await ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", target.authorId)).order("desc").take(50);
      if (!recent.some((n) => n.actorId === viewer.userId && n.postId === postId && n.type === type)) {
        await notify(ctx, { userId: target.authorId, type, actorId: viewer.userId, postId, byAdmin: viewer.admin, preview: target.body.slice(0, 100) });
      }
    }
    return !existing;
  },
});

export const report = mutation({
  args: { targetType: targetTypeValidator, targetId: v.string() },
  returns: v.null(),
  handler: async (ctx, { targetType, targetId }) => {
    const viewer = await requireViewer(ctx);
    const normalized = targetType === "post" ? ctx.db.normalizeId("posts", targetId) : ctx.db.normalizeId("comments", targetId);
    if (!normalized) throw new ConvexError("NOT_FOUND");
    const already = await ctx.db.query("reports").withIndex("by_reporterId_and_targetId", (q) => q.eq("reporterId", viewer.userId).eq("targetId", targetId)).first();
    if (already) return null;
    await ctx.db.insert("reports", { reporterId: viewer.userId, targetType, targetId });
    if (targetType === "post") {
      const p = await ctx.db.get("posts", normalized as Id<"posts">);
      if (p) await ctx.db.patch("posts", p._id, { reportCount: p.reportCount + 1 });
    } else {
      const c = await ctx.db.get("comments", normalized as Id<"comments">);
      if (c) await ctx.db.patch("comments", c._id, { reportCount: c.reportCount + 1 });
    }
    return null;
  },
});

/* ---------- แจ้งเตือน ---------- */
export const unreadCount = query({
  args: { now: v.number() },
  returns: v.number(),
  handler: async (ctx, { now }) => {
    const r = await getViewer(ctx, now);
    if (r.status !== "ok") return 0;
    const rows = await ctx.db.query("notifications").withIndex("by_userId_and_read", (q) => q.eq("userId", r.viewer.userId).eq("read", false)).take(100);
    return rows.length;
  },
});

export const notifications = query({
  args: { lang: langValidator, now: v.number() },
  returns: v.array(v.object({
    id: v.string(), type: v.union(v.literal("like_post"), v.literal("like_comment"), v.literal("comment"), v.literal("new_post")),
    actorName: v.string(), byAdmin: v.boolean(), postId: v.string(), preview: v.string(), read: v.boolean(), createdAt: v.number(),
  })),
  handler: async (ctx, { lang, now }) => {
    const r = await getViewer(ctx, now);
    if (r.status !== "ok") return [];
    const rows = await ctx.db.query("notifications").withIndex("by_userId", (q) => q.eq("userId", r.viewer.userId)).order("desc").take(30);
    const cache: AuthorCache = new Map();
    const out = [];
    for (const n of rows) {
      const a = await authorInfo(ctx, n.actorId, r.viewer, lang, Math.max(now, Date.now()), cache);
      out.push({ id: n._id as string, type: n.type, actorName: a.name, byAdmin: n.byAdmin, postId: n.postId as string, preview: n.preview, read: n.read, createdAt: n._creationTime });
    }
    return out;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, { notificationId }) => {
    const viewer = await requireViewer(ctx);
    const n = await ctx.db.get("notifications", notificationId);
    if (n && n.userId === viewer.userId && !n.read) await ctx.db.patch("notifications", notificationId, { read: true });
    return null;
  },
});

export const markAllRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db.query("notifications").withIndex("by_userId_and_read", (q) => q.eq("userId", viewer.userId).eq("read", false)).take(200);
    for (const n of rows) await ctx.db.patch("notifications", n._id, { read: true });
    return null;
  },
});

/** เปิดดูโพสต์ = แจ้งเตือนของโพสต์นั้นเป็นอ่านแล้วทั้งหมด */
export const markPostRead = mutation({
  args: { postId: v.string() },
  returns: v.null(),
  handler: async (ctx, { postId }) => {
    const viewer = await requireViewer(ctx);
    const id = ctx.db.normalizeId("posts", postId);
    if (!id) return null;
    const rows = await ctx.db.query("notifications").withIndex("by_userId_and_read", (q) => q.eq("userId", viewer.userId).eq("read", false)).take(200);
    for (const n of rows) if (n.postId === id) await ctx.db.patch("notifications", n._id, { read: true });
    return null;
  },
});
