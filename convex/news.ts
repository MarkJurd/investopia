/* ข่าวหุ้นสำคัญรายวัน → กลุ่ม Telegram
 * 06:00 ไทย: ดึงพาดหัวจาก Finnhub ของหุ้นใน lib/news.ts → ให้ Claude สรุปสั้นเป็นภาษาไทยด้วยถ้อยคำของเราเอง → ส่งร่างให้เจ้าของ (TELEGRAM_CHAT_ID)
 * 08:00 ไทย: ส่งเข้ากลุ่ม (TELEGRAM_NEWS_CHAT_ID) ถ้าเจ้าของไม่พิมพ์ /cancel
 * ต้องตั้ง env (เจ้าของตั้งเอง ห้ามส่งในแชท): FINNHUB_API_KEY, ANTHROPIC_API_KEY
 * ทดสอบทันที: npx convex run news:runNow  (ร่าง+ส่งเข้ากลุ่มเลย ไม่รอ 08:00) */
import { internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { bangkokDay } from "./screener";
import { levelsFor } from "./market";
import { sendMessage } from "./telegram";
import { NEWS_MAX_ITEMS, NEWS_PER_TICKER, NEWS_TICKERS } from "../lib/news";

const MODEL = "claude-haiku-5-5";
const WINDOW_MS = 30 * 3600 * 1000;

const itemValidator = v.object({ ticker: v.string(), changePct: v.union(v.number(), v.null()), headline: v.string(), body: v.string(), source: v.string(), url: v.string() });
type Item = { ticker: string; changePct: number | null; headline: string; body: string; source: string; url: string };
type Article = { headline: string; summary: string; source: string; url: string; datetime: number };

export const byDay = internalQuery({
  args: { day: v.string() },
  returns: v.union(v.null(), v.object({ _id: v.id("newsDrafts"), status: v.string(), items: v.array(itemValidator) })),
  handler: async (ctx, { day }) => {
    const d = await ctx.db.query("newsDrafts").withIndex("by_day", (q) => q.eq("day", day)).unique();
    return d ? { _id: d._id, status: d.status, items: d.items } : null;
  },
});

export const saveDraft = internalMutation({
  args: { day: v.string(), items: v.array(itemValidator) },
  returns: v.null(),
  handler: async (ctx, { day, items }) => {
    const old = await ctx.db.query("newsDrafts").withIndex("by_day", (q) => q.eq("day", day)).unique();
    if (old) await ctx.db.delete("newsDrafts", old._id);
    await ctx.db.insert("newsDrafts", { day, status: "draft", items, createdAt: Date.now() });
    return null;
  },
});

export const setStatus = internalMutation({
  args: { id: v.id("newsDrafts"), status: v.union(v.literal("cancelled"), v.literal("sent")) },
  returns: v.null(),
  handler: async (ctx, { id, status }) => { await ctx.db.patch("newsDrafts", id, { status }); return null; },
});

/** เจ้าของพิมพ์ /cancel ใน Telegram — true = ยกเลิกร่างของวันนี้ได้ */
export const cancelToday = internalMutation({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const d = await ctx.db.query("newsDrafts").withIndex("by_day", (q) => q.eq("day", bangkokDay())).unique();
    if (!d || d.status !== "draft") return false;
    await ctx.db.patch("newsDrafts", d._id, { status: "cancelled" });
    return true;
  },
});

async function fetchArticles(key: string, symbol: string): Promise<Article[]> {
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const res = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${day(new Date(Date.now() - 2 * 86400 * 1000))}&to=${day(new Date())}&token=${key}`);
  if (!res.ok) throw new Error(`finnhub ${symbol} ${res.status}`);
  const rows = (await res.json()) as { headline?: string; summary?: string; source?: string; url?: string; datetime?: number }[];
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const r of rows) {
    if (!r.headline || !r.url || typeof r.datetime !== "number" || r.datetime * 1000 < Date.now() - WINDOW_MS) continue;
    const k = r.headline.toLowerCase().slice(0, 60);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ headline: r.headline, summary: (r.summary ?? "").slice(0, 400), source: r.source ?? "", url: r.url, datetime: r.datetime });
  }
  return out.sort((a, b) => b.datetime - a.datetime);
}

const SYSTEM = `คุณเป็นบรรณาธิการข่าวหุ้นสหรัฐฯ ของเว็บสอนลงทุนมือใหม่ เลือกข่าวที่สำคัญจริงเท่านั้น (ผลประกอบการ ดีลใหญ่ ผลิตภัณฑ์/กฎระเบียบที่กระทบธุรกิจ ผู้บริหารเปลี่ยน) ข้ามข่าวเชิงวิเคราะห์ราคา ข่าวแนะนำซื้อขาย และข่าวซ้ำ
เขียนเป็นภาษาไทยด้วยถ้อยคำของคุณเอง ห้ามคัดลอกประโยคจากต้นฉบับ
กติกาเด็ดขาด: ห้ามใช้คำว่า ซื้อ ขาย น่าลงทุน น่าสนใจ ควรถือ เป้าราคา สัญญาณ · ห้ามคาดการณ์ราคา · ใช้เฉพาะข้อเท็จจริงและตัวเลขที่อยู่ในพาดหัว/สรุปที่ให้มาเท่านั้น ห้ามเดาหรือเติมตัวเลข
ตอบเป็น JSON ล้วน รูปแบบ {"items":[{"ref":"<ticker>#<เลขข่าว>","headline":"พาดหัวไทยไม่เกิน 45 ตัวอักษร","body":"สรุป 1–2 ประโยค ไม่เกิน 160 ตัวอักษร"}]} เลือกไม่เกิน ${NEWS_MAX_ITEMS} ข่าว หุ้นละไม่เกิน 1 ข่าว ถ้าไม่มีข่าวสำคัญตอบ {"items":[]}`;

async function summarize(apiKey: string, cands: { ticker: string; articles: Article[] }[]): Promise<{ ref: string; headline: string; body: string }[]> {
  const input = cands.map((c) => `## ${c.ticker}\n` + c.articles.map((a, i) => `${c.ticker}#${i + 1}: ${a.headline}\n${a.summary}`).join("\n")).join("\n\n");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: SYSTEM, messages: [{ role: "user", content: input }] }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((c) => c.type === "text")?.text ?? "";
  const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as { items?: { ref?: unknown; headline?: unknown; body?: unknown }[] };
  return (parsed.items ?? []).flatMap((i) => typeof i.ref === "string" && typeof i.headline === "string" && typeof i.body === "string" ? [{ ref: i.ref, headline: i.headline, body: i.body }] : []);
}

const pct = (n: number) => `${n >= 0 ? "▲ +" : "▼ −"}${Math.abs(n).toFixed(1)}%`;
function format(day: string, items: Item[], head: string): string {
  const site = process.env.SITE_URL ?? "https://investopiaclass.com";
  return [head, `📅 ${day}`, "",
    ...items.flatMap((it, i) => [`${i + 1}) ${it.ticker}${it.changePct !== null ? ` ${pct(it.changePct)}` : ""} — ${it.headline}`, it.body, `ที่มา: ${it.source} ${it.url}`, ""]),
    `ดูราคาและงบ: ${site}/tools`,
    "สรุปโดย AI จากพาดหัวข่าวต้นฉบับ เพื่อการศึกษา ไม่ใช่สัญญาณซื้อขายหรือคำแนะนำการลงทุน"].join("\n");
}

/** สร้างข่าวของวันนี้ — null = ยังไม่ได้ตั้ง key */
async function build(ctx: ActionCtx): Promise<Item[] | null> {
  const fh = process.env.FINNHUB_API_KEY, an = process.env.ANTHROPIC_API_KEY;
  if (!fh || !an) return null;
  const cands: { ticker: string; articles: Article[] }[] = [];
  for (const t of NEWS_TICKERS) {
    try { const a = await fetchArticles(fh, t); if (a.length) cands.push({ ticker: t, articles: a }); } catch (e) { console.error(e); }
    await new Promise((r) => setTimeout(r, 120));   // Finnhub ฟรี 60 ครั้ง/นาที
  }
  // หุ้นที่มีข่าวใหม่เยอะสุดก่อน — ให้ AI คัดเอง
  cands.sort((a, b) => b.articles.length - a.articles.length);
  const top = cands.slice(0, 12).map((c) => ({ ticker: c.ticker, articles: c.articles.slice(0, NEWS_PER_TICKER) }));
  if (!top.length) return [];
  const items: Item[] = [];
  for (const p of await summarize(an, top)) {
    const [ticker, n] = p.ref.split("#");
    const art = top.find((c) => c.ticker === ticker)?.articles[Number(n) - 1];
    if (!art || items.some((i) => i.ticker === ticker)) continue;
    let changePct: number | null = null;
    try { const d = await levelsFor(ctx, ticker); if (d && d.prevClose) changePct = ((d.price - d.prevClose) / d.prevClose) * 100; } catch { /* ไม่มีราคา = ไม่แสดง % */ }
    items.push({ ticker, changePct, headline: p.headline.trim(), body: p.body.trim(), source: art.source || "ข่าวต้นฉบับ", url: art.url });
    if (items.length >= NEWS_MAX_ITEMS) break;
  }
  return items;
}

/** 06:00 ไทย: ร่าง + ส่งให้เจ้าของดู */
export const draft = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const token = process.env.TELEGRAM_BOT_TOKEN, owner = process.env.TELEGRAM_CHAT_ID;
    const day = bangkokDay();
    const items = await build(ctx);
    if (!token || !owner) return null;
    if (items === null) { await sendMessage(token, owner, "📰 ข่าวหุ้น: ยังไม่ได้ตั้ง FINNHUB_API_KEY / ANTHROPIC_API_KEY"); return null; }
    if (!items.length) { await sendMessage(token, owner, "📰 วันนี้ไม่มีข่าวสำคัญพอ — จะไม่ส่งเข้ากลุ่ม"); return null; }
    await ctx.runMutation(internal.news.saveDraft, { day, items });
    await sendMessage(token, owner, format(day, items, "📝 ร่างข่าวหุ้น — จะส่งเข้ากลุ่มเวลา 08:00 พิมพ์ /cancel เพื่อยกเลิก"));
    return null;
  },
});

/** 08:00 ไทย: ส่งเข้ากลุ่ม */
export const publish = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const token = process.env.TELEGRAM_BOT_TOKEN, group = process.env.TELEGRAM_NEWS_CHAT_ID;
    if (!token || !group) return null;
    const day = bangkokDay();
    const d = await ctx.runQuery(internal.news.byDay, { day });
    if (!d || d.status !== "draft") return null;
    const id = await sendMessage(token, group, format(day, d.items, "📰 ข่าวหุ้นสำคัญวันนี้ — INVESTOPIA"));
    if (id !== null) await ctx.runMutation(internal.news.setStatus, { id: d._id, status: "sent" });
    return null;
  },
});

/** ทดสอบ: ร่างแล้วส่งเข้ากลุ่มทันที */
export const runNow = internalAction({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const token = process.env.TELEGRAM_BOT_TOKEN, group = process.env.TELEGRAM_NEWS_CHAT_ID;
    if (!token || !group) return "ยังไม่ได้ตั้ง TELEGRAM_BOT_TOKEN / TELEGRAM_NEWS_CHAT_ID";
    const day = bangkokDay();
    const items = await build(ctx);
    if (items === null) return "ยังไม่ได้ตั้ง FINNHUB_API_KEY / ANTHROPIC_API_KEY";
    if (!items.length) return "ไม่มีข่าวสำคัญพอ";
    await ctx.runMutation(internal.news.saveDraft, { day, items });
    const id = await sendMessage(token, group, format(day, items, "📰 ข่าวหุ้นสำคัญวันนี้ — INVESTOPIA"));
    return id === null ? "ส่งไม่สำเร็จ" : `ส่งแล้ว ${items.length} ข่าว`;
  },
});
