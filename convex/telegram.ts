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
import { levelsFor } from "./market";
import { nearestLevels } from "../lib/sr";

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
      (s.indicator ? "\n🎁 ได้สิทธิ์ Indicator — ลูกค้าจะทักไลน์ @investopia มารับ" : "") +
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

  // ผู้ใช้ทั่วไป: เชื่อม/ยกเลิกรับสรุป Watchlist รายสัปดาห์ (ลิงก์ t.me/<bot>?start=<รหัส> จากหน้า /tools)
  const raw = typeof msg.text === "string" ? msg.text.trim() : "";
  const start = raw.match(/^\/start\s+([a-f0-9]{36})$/);
  if (start || raw === "/stop") {
    if (typeof update.update_id === "number" && !(await ctx.runMutation(internal.telegram.markSeen, { updateId: update.update_id }))) return ok;
    if (start) {
      const linked: boolean = await ctx.runMutation(internal.watchlist.linkTelegram, { token: start[1], chatId: Number(chatId) });
      await sendMessage(token, chatId, linked
        ? "✅ เชื่อมกับบัญชี INVESTOPIA แล้ว — จะได้รับสรุป Watchlist ทุกเช้าวันเสาร์\nพิมพ์ /stop เมื่อต้องการหยุดรับ"
        : "❌ ลิงก์หมดอายุหรือใช้ไปแล้ว — กลับไปกด \"เชื่อม Telegram\" ที่หน้าเครื่องมือบนเว็บอีกครั้ง");
    } else {
      await ctx.runMutation(internal.watchlist.unlinkTelegram, { chatId: Number(chatId) });
      await sendMessage(token, chatId, "หยุดส่งสรุป Watchlist แล้ว");
    }
    return ok;
  }

  // /chatid ในแชท/กลุ่มไหนก็ได้ → บอกรหัสแชท (ใช้ตั้ง TELEGRAM_NEWS_CHAT_ID ของกลุ่มข่าว) — รหัสแชทไม่ใช่ความลับ
  if (/^\/chatid(@\w+)?$/.test(raw)) {
    await sendMessage(token, chatId, `รหัสแชทนี้คือ ${chatId}`);
    return ok;
  }

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

/* ---------- สรุป Watchlist รายสัปดาห์ (สมาชิกที่เชื่อม Telegram) — cron เช้าวันเสาร์ ---------- */
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`;
const stars = (n: number) => "★".repeat(n) + "☆".repeat(3 - n);

export const weeklyDigest = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    const site = process.env.SITE_URL ?? "https://investopiaclass.com";
    const recipients = await ctx.runQuery(internal.watchlist.digestRecipients, {});
    const cache = new Map<string, Awaited<ReturnType<typeof levelsFor>>>();
    for (const r of recipients) {
      const lines: string[] = [];
      for (const sym of r.symbols) {
        if (!cache.has(sym)) {
          try { cache.set(sym, await levelsFor(ctx, sym)); } catch (e) { console.error(sym, e); cache.set(sym, null); }
        }
        const d = cache.get(sym);
        if (!d) { lines.push(`${sym} — ดึงข้อมูลไม่ได้สัปดาห์นี้`, ""); continue; }
        const { support, resistance } = nearestLevels(d.levels.short, d.levels.long);
        lines.push(`${d.symbol}  ${money(d.price)} ${d.currency}${d.weekClose ? `  (${pct(((d.price - d.weekClose) / d.weekClose) * 100)} ใน 1 สัปดาห์)` : ""}`);
        if (support) lines.push(`  แนวรับใกล้สุด ${money(support.price)} (${pct(support.distPct)}) ความมั่นใจ ${stars(support.stars)}`);
        if (resistance) lines.push(`  แนวต้านใกล้สุด ${money(resistance.price)} (${pct(resistance.distPct)}) ความมั่นใจ ${stars(resistance.stars)}`);
        lines.push("");
      }
      const text = ["📋 สรุป Watchlist ประจำสัปดาห์ — INVESTOPIA", "", ...lines,
        `ดูรายละเอียด: ${site}/tools`,
        "ข้อมูลเพื่อการศึกษา ไม่ใช่สัญญาณซื้อขายหรือคำแนะนำการลงทุน ราคาอาจดีเลย์",
        "พิมพ์ /stop เพื่อหยุดรับ"].join("\n");
      await sendMessage(token, r.chatId, text);
      await new Promise((res) => setTimeout(res, 100));   // Telegram จำกัด ~30 ข้อความ/วินาที
    }
    return null;
  },
});

/* ---------- กลุ่มข่าว: ส่งข้อความทดสอบ (npx convex run telegram:sendNewsTest) — ต้องตั้ง TELEGRAM_NEWS_CHAT_ID ---------- */
export const sendNewsTest = internalAction({
  args: {},
  returns: v.string(),
  handler: async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_NEWS_CHAT_ID;
    if (!token || !chatId) return "ยังไม่ได้ตั้ง TELEGRAM_BOT_TOKEN / TELEGRAM_NEWS_CHAT_ID";
    const site = process.env.SITE_URL ?? "https://investopiaclass.com";
    const id = await sendMessage(token, chatId, [
      "🧪 ทดสอบข่าวหุ้นสั้น — ข้อมูลสมมติ ไม่ใช่ข่าวจริง", "",
      "📰 NVDA +2.4%", "NVDA ได้ดีลชิป AI รายใหญ่ (ตัวอย่างข้อความ)", "",
      "ที่มา: (ตัวอย่าง)", `ดูหน้าหุ้น: ${site}/tools/stock/NVDA`,
      "ข้อมูลเพื่อการศึกษา ไม่ใช่สัญญาณซื้อขายหรือคำแนะนำการลงทุน"].join("\n"));
    return id === null ? "ส่งไม่สำเร็จ — เช็กว่าบอทอยู่ในกลุ่ม และรหัสกลุ่มถูกต้อง" : "ส่งแล้ว";
  },
});
