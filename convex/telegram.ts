/* บอท Telegram สำหรับเจ้าของ (ตอบคอมมูนิตี้จากมือถือ)
 *  ขาออก: มีโพสต์ใหม่ / สมาชิกตอบต่อ → บอทส่งข้อความหาเจ้าของ (ระบุผู้เขียน + แพ็กเกจ)
 *  ขาเข้า: เจ้าของ "Reply" ข้อความนั้นใน Telegram → ระบบโพสต์เป็นคอมเมนต์ของแอดมินบนเว็บ + แจ้งผู้ถาม
 * ความปลอดภัย: webhook ต้องมีหัว secret ที่ตรงกับ TELEGRAM_WEBHOOK_SECRET · รับคำสั่งเฉพาะจากแชทของเจ้าของ (TELEGRAM_CHAT_ID)
 * ตั้งค่า (เจ้าของทำเอง ห้ามส่งในแชท): npx convex env set TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET / TELEGRAM_CHAT_ID
 * ยังไม่ตั้งค่า = ระบบเงียบ ไม่ทำอะไร */
import { httpAction, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { adminUserIds } from "./admin";
import { getMembership } from "./payments";
import { insertComment } from "./community";
import { PLANS } from "./plans";

const API = "https://api.telegram.org";
const MAX_REPLY = 2000;
const PREVIEW = 600;

/** เทียบข้อความแบบใช้เวลาเท่ากันเสมอ (กันเดาความลับจากเวลาตอบ) */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** ส่งข้อความ (ข้อความล้วน ไม่ใช้ markdown เพราะข้อความสมาชิกอาจมีอักขระพิเศษ) — คืน message_id หรือ null */
async function sendMessage(token: string, chatId: string | number, text: string): Promise<number | null> {
  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: { message_id?: unknown } };
    return typeof data.result?.message_id === "number" ? data.result.message_id : null;
  } catch {
    return null;
  }
}

/* ---------- ขาออก: แจ้งเจ้าของ ---------- */
export const describe = internalQuery({
  args: { actorId: v.id("users"), postId: v.id("posts") },
  returns: v.object({ name: v.string(), plan: v.union(v.string(), v.null()), priority: v.boolean() }),
  handler: async (ctx, { actorId, postId }) => {
    const profile = await ctx.db.query("profiles").withIndex("by_userId", (q) => q.eq("userId", actorId)).unique();
    const m = await getMembership(ctx, actorId, Date.now());
    void postId;
    return {
      name: profile?.displayName ?? "สมาชิก",
      plan: m ? PLANS[m.plan].name : null,
      priority: m ? m.plan === "yearly" || m.plan === "vip" : false,   // รายปี/VIP = ตอบก่อน (เห็นเฉพาะเจ้าของใน Telegram)
    };
  },
});

export const saveThread = internalMutation({
  args: { messageId: v.number(), postId: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, { messageId, postId }) => {
    await ctx.db.insert("telegramThreads", { telegramMessageId: messageId, postId });
    return null;
  },
});

export const notifyOwner = internalAction({
  args: { postId: v.id("posts"), kind: v.union(v.literal("new_post"), v.literal("comment")), actorId: v.id("users"), text: v.string() },
  returns: v.null(),
  handler: async (ctx, { postId, kind, actorId, text }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return null;
    const who: { name: string; plan: string | null; priority: boolean } = await ctx.runQuery(internal.telegram.describe, { actorId, postId });
    const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
    const head = kind === "new_post" ? "📝 โพสต์ใหม่" : "💬 สมาชิกตอบต่อในโพสต์";
    const body = text.length > PREVIEW ? `${text.slice(0, PREVIEW)}…` : text;
    const message =
      `${who.priority ? "⭐ " : ""}${head} — ${who.name}${who.plan ? ` (${who.plan})` : ""}\n\n${body}\n\n` +
      `↩️ ตอบ: กด Reply ข้อความนี้ แล้วพิมพ์คำตอบ\n🔗 ${site}/community/${postId}`;
    const messageId = await sendMessage(token, chatId, message);
    if (messageId !== null) await ctx.runMutation(internal.telegram.saveThread, { messageId, postId });
    return null;
  },
});

/* ---------- ขาออก: มีคนจ่ายเงินสำเร็จ → แจ้งยอดขาย ---------- */
export const saleInfo = internalQuery({
  args: { membershipId: v.id("memberships") },
  returns: v.union(v.null(), v.object({
    name: v.string(), email: v.string(), plan: v.string(), amount: v.number(), listAmount: v.number(),
    coupon: v.union(v.string(), v.null()), indicator: v.boolean(), monthRevenue: v.number(), monthCount: v.number(),
  })),
  handler: async (ctx, { membershipId }) => {
    const m = await ctx.db.get("memberships", membershipId);
    if (m === null) return null;
    const u = await ctx.db.get("users", m.userId);
    // ยอดเดือนนี้ (เดือนไทย) — นับเฉพาะที่จ่ายผ่าน Stripe และยังไม่คืนเงิน
    const recent = await ctx.db.query("memberships").order("desc").take(1000);
    const month = recent.filter((r) => r.monthKey === m.monthKey && (r.source ?? "stripe") === "stripe" && r.status !== "refunded");
    return {
      name: u?.name ?? "-", email: u?.email ?? "-", plan: PLANS[m.plan].name, amount: m.amount,
      listAmount: m.listAmount ?? PLANS[m.plan].amount, coupon: m.couponCode ?? null, indicator: m.indicatorBonus,
      monthRevenue: month.reduce((s, r) => s + r.amount, 0), monthCount: month.length,
    };
  },
});

export const notifySale = internalAction({
  args: { membershipId: v.id("memberships") },
  returns: v.null(),
  handler: async (ctx, { membershipId }) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return null;
    const s: { name: string; email: string; plan: string; amount: number; listAmount: number; coupon: string | null; indicator: boolean; monthRevenue: number; monthCount: number } | null =
      await ctx.runQuery(internal.telegram.saleInfo, { membershipId });
    if (s === null) return null;
    const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;
    const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
    const message =
      `💰 ขายได้! ${s.plan} ${baht(s.amount)}` +
      (s.coupon ? ` (โค้ด ${s.coupon} ลดจาก ${baht(s.listAmount)})` : "") +
      `\n👤 ${s.name} · ${s.email}` +
      (s.indicator ? "\n🎁 ได้ Indicator — ส่งให้ลูกค้าด้วย" : "") +
      `\n📈 เดือนนี้: ${s.monthCount} รายการ รวม ${baht(s.monthRevenue)}` +
      `\n🔗 ${site}/admin`;
    await sendMessage(token, chatId, message);
    return null;
  },
});

/* ---------- ขาเข้า: เจ้าของ reply ใน Telegram ---------- */
export const markSeen = internalMutation({
  args: { updateId: v.number() },
  returns: v.boolean(),                       // true = เพิ่งเห็นครั้งแรก
  handler: async (ctx, { updateId }) => {
    const seen = await ctx.db.query("telegramSeen").withIndex("by_updateId", (q) => q.eq("updateId", updateId)).first();
    if (seen) return false;
    await ctx.db.insert("telegramSeen", { updateId });
    return true;
  },
});

export const replyAsAdmin = internalMutation({
  args: { telegramMessageId: v.number(), body: v.string() },
  returns: v.union(v.literal("ok"), v.literal("no_thread"), v.literal("no_post"), v.literal("no_admin")),
  handler: async (ctx, { telegramMessageId, body }) => {
    const thread = await ctx.db.query("telegramThreads").withIndex("by_telegramMessageId", (q) => q.eq("telegramMessageId", telegramMessageId)).first();
    if (!thread) return "no_thread";
    const post = await ctx.db.get("posts", thread.postId);
    if (!post) return "no_post";
    const admin = (await adminUserIds(ctx))[0];
    if (!admin) return "no_admin";
    await insertComment(ctx, { post, authorId: admin, authorIsAdmin: true, text: body.trim().slice(0, MAX_REPLY) });
    return "ok";
  },
});

type TgMessage = { message_id?: unknown; text?: unknown; chat?: { id?: unknown }; reply_to_message?: { message_id?: unknown } };

export const webhook = httpAction(async (ctx, req) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !token) return new Response("not configured", { status: 503 });
  if (!safeEqual(req.headers.get("x-telegram-bot-api-secret-token") ?? "", secret)) return new Response("forbidden", { status: 403 });

  let update: { update_id?: unknown; message?: TgMessage };
  try { update = (await req.json()) as typeof update; } catch { return new Response("bad json", { status: 400 }); }
  const ok = new Response("ok", { status: 200 });          // Telegram ส่งซ้ำถ้าไม่ได้ 200
  const msg = update.message;
  const chatId = msg?.chat?.id;
  if (!msg || (typeof chatId !== "number" && typeof chatId !== "string")) return ok;

  // ยังไม่ได้ตั้ง TELEGRAM_CHAT_ID: บอกรหัสแชทของคนที่ทักมา (เจ้าของใช้ตั้งค่า) — ยังไม่ทำอะไรกับเว็บ
  const owner = process.env.TELEGRAM_CHAT_ID;
  if (!owner) {
    await sendMessage(token, chatId, `รหัสแชทของคุณคือ ${chatId}\nนำไปตั้งค่า TELEGRAM_CHAT_ID แล้วบอทจะเริ่มทำงาน`);
    return ok;
  }
  if (String(chatId) !== owner) return ok;                  // คนอื่นทักบอท = เงียบ

  if (typeof update.update_id === "number" && !(await ctx.runMutation(internal.telegram.markSeen, { updateId: update.update_id }))) return ok;

  const text = typeof msg.text === "string" ? msg.text.trim() : "";
  const replyTo = msg.reply_to_message?.message_id;
  if (!text || text.startsWith("/") || typeof replyTo !== "number") {
    await sendMessage(token, chatId, "ตอบสมาชิก: กด Reply ที่ข้อความโพสต์ที่บอทส่งมา แล้วพิมพ์คำตอบ (ข้อความตัวอักษรเท่านั้น)");
    return ok;
  }
  const result: "ok" | "no_thread" | "no_post" | "no_admin" = await ctx.runMutation(internal.telegram.replyAsAdmin, { telegramMessageId: replyTo, body: text });
  const answer = result === "ok" ? "✅ ตอบบนเว็บแล้ว และแจ้งผู้ถามแล้ว"
    : result === "no_post" ? "❌ ไม่พบโพสต์นี้ (อาจถูกลบแล้ว)"
    : result === "no_thread" ? "❌ ข้อความนี้ไม่ใช่ข้อความโพสต์จากบอท — Reply ที่ข้อความที่บอทส่งมาเท่านั้น"
    : "❌ ยังไม่ได้ตั้งค่าบัญชีแอดมิน (ADMIN_EMAILS)";
  await sendMessage(token, chatId, answer);
  return ok;
});
