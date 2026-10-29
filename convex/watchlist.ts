/* Watchlist (หน้า /tools) — ทุกคนที่ล็อกอิน: ฟรี 3 ตัว · สมาชิก/แอดมิน 20 ตัว
 * + เชื่อม Telegram เพื่อรับสรุป Watchlist รายสัปดาห์ (เฉพาะสมาชิก — ส่งโดย telegram.weeklyDigest) */
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getMembership } from "./payments";
import { isAdminUser } from "./admin";

export const FREE_LIMIT = 3;
export const MEMBER_LIMIT = 20;
const TOKEN_TTL = 30 * 60 * 1000;
const SYMBOL_RE = /^[A-Z0-9][A-Z0-9-]{0,9}$/;

async function isMember(ctx: QueryCtx, userId: Id<"users">, now: number) {
  return (await isAdminUser(ctx, userId)) || (await getMembership(ctx, userId, now)) !== null;
}

async function itemsOf(ctx: QueryCtx, userId: Id<"users">) {
  return await ctx.db.query("watchlist").withIndex("by_userId", (q) => q.eq("userId", userId)).take(MEMBER_LIMIT + 10);
}

export const mine = query({
  args: { now: v.number() },
  returns: v.union(v.null(), v.object({
    symbols: v.array(v.string()), limit: v.number(), member: v.boolean(),
    telegram: v.boolean(), botUsername: v.union(v.string(), v.null()),
  })),
  handler: async (ctx, { now }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const member = await isMember(ctx, userId, now);
    const link = await ctx.db.query("telegramLinks").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    return {
      symbols: (await itemsOf(ctx, userId)).sort((a, b) => a.addedAt - b.addedAt).map((w) => w.symbol),
      limit: member ? MEMBER_LIMIT : FREE_LIMIT, member,
      telegram: link?.chatId !== undefined, botUsername: process.env.TELEGRAM_BOT_USERNAME ?? null,
    };
  },
});

export const add = mutation({
  args: { symbol: v.string() },
  returns: v.null(),
  handler: async (ctx, { symbol: raw }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
    const symbol = raw.trim().toUpperCase().replace(/\./g, "-");
    if (!SYMBOL_RE.test(symbol)) throw new ConvexError("BAD_SYMBOL");
    const items = await itemsOf(ctx, userId);
    if (items.some((w) => w.symbol === symbol)) return null;
    const limit = (await isMember(ctx, userId, Date.now())) ? MEMBER_LIMIT : FREE_LIMIT;
    if (items.length >= limit) throw new ConvexError("WATCHLIST_FULL");
    await ctx.db.insert("watchlist", { userId, symbol, addedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { symbol: v.string() },
  returns: v.null(),
  handler: async (ctx, { symbol }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
    for (const w of await itemsOf(ctx, userId)) if (w.symbol === symbol) await ctx.db.delete("watchlist", w._id);
    return null;
  },
});

export const symbolsFor = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.string()),
  handler: async (ctx, { userId }) => (await itemsOf(ctx, userId)).sort((a, b) => a.addedAt - b.addedAt).map((w) => w.symbol),
});

/* ---------- เชื่อม Telegram ---------- */

/** สร้างรหัสใช้ครั้งเดียว (30 นาที) → หน้าเว็บเปิด t.me/<bot>?start=<รหัส> → บอทเรียก linkTelegram */
export const telegramToken = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
    if (!(await isMember(ctx, userId, Date.now()))) throw new ConvexError("NOT_A_MEMBER");
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const link = await ctx.db.query("telegramLinks").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (link === null) await ctx.db.insert("telegramLinks", { userId, token, tokenAt: Date.now() });
    else await ctx.db.patch("telegramLinks", link._id, { token, tokenAt: Date.now() });
    return token;
  },
});

export const unlinkMine = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("NOT_SIGNED_IN");
    const link = await ctx.db.query("telegramLinks").withIndex("by_userId", (q) => q.eq("userId", userId)).unique();
    if (link) await ctx.db.delete("telegramLinks", link._id);
    return null;
  },
});

async function dropChat(ctx: MutationCtx, chatId: number) {
  for (const l of await ctx.db.query("telegramLinks").withIndex("by_chatId", (q) => q.eq("chatId", chatId)).take(10)) await ctx.db.delete("telegramLinks", l._id);
}

export const linkTelegram = internalMutation({
  args: { token: v.string(), chatId: v.number() },
  returns: v.boolean(),
  handler: async (ctx, { token, chatId }) => {
    const link = await ctx.db.query("telegramLinks").withIndex("by_token", (q) => q.eq("token", token)).unique();
    if (link === null || link.tokenAt === undefined || Date.now() - link.tokenAt > TOKEN_TTL) return false;
    await dropChat(ctx, chatId);   // แชทหนึ่งผูกได้บัญชีเดียว
    await ctx.db.patch("telegramLinks", link._id, { chatId, token: undefined, tokenAt: undefined });
    return true;
  },
});

export const unlinkTelegram = internalMutation({
  args: { chatId: v.number() },
  returns: v.null(),
  handler: async (ctx, { chatId }) => { await dropChat(ctx, chatId); return null; },
});

/** ผู้รับสรุปรายสัปดาห์: เชื่อม Telegram แล้ว + ยังเป็นสมาชิก + มีหุ้นใน Watchlist */
export const digestRecipients = internalQuery({
  args: {},
  returns: v.array(v.object({ chatId: v.number(), symbols: v.array(v.string()) })),
  handler: async (ctx) => {
    const out: { chatId: number; symbols: string[] }[] = [];
    // shortcut: อ่านทุกแถวในรอบเดียว (สมาชิกหลักร้อย) — ถ้าเกินหลายพันคนให้แบ่งเป็นหน้าๆ
    for (const l of await ctx.db.query("telegramLinks").take(2000)) {
      if (l.chatId === undefined || !(await isMember(ctx, l.userId, Date.now()))) continue;
      const symbols = (await itemsOf(ctx, l.userId)).sort((a, b) => a.addedAt - b.addedAt).map((w) => w.symbol);
      if (symbols.length) out.push({ chatId: l.chatId, symbols });
    }
    return out;
  },
});
