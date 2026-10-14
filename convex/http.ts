import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { PLANS, isPlanId } from "./plans";
import { webhook as telegramWebhook } from "./telegram";

const http = httpRouter();

// เส้นทางที่ Google ส่งผู้ใช้กลับมาหลังล็อกอิน (/api/auth/callback/google)
auth.addHttpRoutes(http);

/* ---------- Telegram: เจ้าของ reply ข้อความบอท → โพสต์เป็นคอมเมนต์แอดมินบนเว็บ ---------- */
http.route({ path: "/telegram/webhook", method: "POST", handler: telegramWebhook });

/* ---------- ตรวจลายเซ็นของ Stripe (กันคนปลอมข้อความ "จ่ายแล้ว") ---------- */
async function verifyStripeSignature(payload: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, val]) => val);
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false; // เก่ากว่า 5 นาที = ไม่รับ
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${payload}`)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => {
    if (s.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < s.length; i++) diff |= s.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

type StripeEvent = { type?: unknown; data?: { object?: Record<string, unknown> } };

/* ---------- Stripe แจ้งผลการจ่ายเงิน/คืนเงินมาที่นี่ ---------- */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return new Response("webhook not configured", { status: 500 });
    const payload = await req.text();
    if (!(await verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret))) {
      return new Response("bad signature", { status: 400 });
    }
    let event: StripeEvent;
    try { event = JSON.parse(payload) as StripeEvent; } catch { return new Response("bad json", { status: 400 }); }
    const obj = event.data?.object ?? {};

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (obj.payment_status !== "paid") return new Response("pending", { status: 200 }); // พร้อมเพย์ที่ยังไม่โอน
      const meta = (obj.metadata ?? {}) as Record<string, unknown>;
      const plan = meta.plan, userId = meta.userId, amountTotal = obj.amount_total, sessionId = obj.id;
      if (!isPlanId(plan) || typeof userId !== "string" || typeof sessionId !== "string" || typeof amountTotal !== "number") {
        return new Response("bad session data", { status: 400 });
      }
      if (amountTotal !== PLANS[plan].amount * 100 || obj.currency !== "thb") {
        console.error("amount mismatch", sessionId, plan, amountTotal);
        return new Response("amount mismatch", { status: 400 });
      }
      await ctx.runMutation(internal.payments.grantFromCheckout, {
        stripeSessionId: sessionId,
        userId,
        plan,
        amount: amountTotal / 100,
        paymentIntentId: typeof obj.payment_intent === "string" ? obj.payment_intent : null,
      });
    } else if (event.type === "charge.refunded") {
      // คืนเงินเต็มจำนวน (จากหน้า Stripe) = ยกเลิกสิทธิ์อัตโนมัติ
      if (obj.refunded === true && typeof obj.payment_intent === "string") {
        await ctx.runMutation(internal.payments.revokeByPaymentIntent, { paymentIntentId: obj.payment_intent });
      }
    }
    return new Response("ok", { status: 200 });
  }),
});

export default http;
