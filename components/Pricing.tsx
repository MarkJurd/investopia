"use client";

/* การ์ดราคา + ปุ่มจ่ายเงินจริง (Stripe Checkout)
 * ยังไม่ล็อกอิน → ล็อกอินด้วย Google ก่อน แล้วพาไปหน้าจ่ายเงินต่ออัตโนมัติ */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import type { PlanId } from "@/convex/plans";
import { useContent } from "@/components/ContentContext";

const PENDING_KEY = "investopia.pendingPlan"; // จำแพ็กเกจที่กดไว้ระหว่างไปล็อกอิน
const COUPON_KEY = "investopia.pendingCoupon";
const PLAN_IDS: PlanId[] = ["monthly", "vip"]; // แพ็กเกจที่เปิดขาย (ต้องตรงกับ FOR_SALE ใน convex/plans.ts)

function readPending(): PlanId | null {
  try {
    const v = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return PLAN_IDS.includes(v as PlanId) ? (v as PlanId) : null;
  } catch { return null; }
}

function couponError(code: string, K: ReturnType<typeof useContent>["checkout"]): string {
  switch (code) {
    case "COUPON_EXPIRED": return K.couponExpired;
    case "COUPON_USED_UP": return K.couponUsedUp;
    case "COUPON_NOT_FOR_PLAN": return K.couponNotForPlan;
    default: return K.couponInvalid;
  }
}

export default function Pricing() {
  const CONTENT = useContent();
  const P = CONTENT.pricing, K = CONTENT.checkout;
  const prefix = CONTENT.locale.base === "/" ? "" : CONTENT.locale.base;
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const createCheckout = useAction(api.payments.createCheckout);
  const vipLeft = useQuery(api.payments.vipSeatsLeft);
  const launch = useQuery(api.payments.launchStatus);
  // ปิดรอบตามเวลา — อ่านเวลาใน timeout เท่านั้น (หน้านี้ถูก prerender)
  const [launchOver, setLaunchOver] = useState(false);
  useEffect(() => {
    if (!launch) return;
    const t = setTimeout(() => setLaunchOver(Date.now() > launch.endsAt), 0);
    return () => clearTimeout(t);
  }, [launch]);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState("");
  const [codeInput, setCodeInput] = useState("");
  // โค้ดที่กด "ใช้โค้ด" + เวลาตอนกด (อ่านเวลาใน event handler เท่านั้น — หน้านี้ถูก prerender)
  const [appliedState, setAppliedState] = useState<{ code: string; at: number } | null>(null);
  const applied = appliedState?.code ?? "";
  const setApplied = (code: string) => setAppliedState(code ? { code, at: Math.floor(Date.now() / 60000) * 60000 } : null);
  const now = appliedState?.at ?? 0;
  const qMonthly = useQuery(api.payments.checkCoupon, applied ? { plan: "monthly", code: applied, now } : "skip");
  const qVip = useQuery(api.payments.checkCoupon, applied ? { plan: "vip", code: applied, now } : "skip");
  const quotes: Partial<Record<PlanId, typeof qVip>> = { monthly: qMonthly, vip: qVip };
  const anyOk = Object.values(quotes).some((q) => q?.ok);
  const firstErr = Object.values(quotes).find((q) => q && !q.ok);

  const pay = useCallback(async (plan: PlanId, coupon?: string) => {
    setMsg("");
    setBusy(plan);
    try {
      const { url } = await createCheckout({ plan, coupon: coupon || undefined, lang: CONTENT.locale.code === "en" ? "en" : "th" });
      window.location.href = url;
    } catch (e) {
      setBusy(null);
      const code = e instanceof ConvexError && typeof e.data === "string" ? e.data : String(e);
      setMsg(code.includes("VIP_FULL") ? K.vipFull : code.startsWith("COUPON_") ? couponError(code, K) : K.error);
    }
  }, [createCheckout, K]);

  const couponFor = (plan: PlanId) => (quotes[plan]?.ok ? applied : undefined);

  const choose = async (plan: PlanId) => {
    if (isAuthenticated) return pay(plan, couponFor(plan));
    try {
      sessionStorage.setItem(PENDING_KEY, plan);
      const c = couponFor(plan);
      if (c) sessionStorage.setItem(COUPON_KEY, c); else sessionStorage.removeItem(COUPON_KEY);
    } catch { /* ไม่มี storage ก็แค่ต้องกดซ้ำหลังล็อกอิน */ }
    setMsg(K.signInFirst);
    await signIn("google", { redirectTo: `${CONTENT.locale.base}#pricing` });
  };

  // กลับมาจากล็อกอินแล้ว → ไปหน้าจ่ายเงินของแพ็กเกจที่กดไว้ต่อเลย
  const resumed = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || resumed.current) return;
    resumed.current = true;
    const plan = readPending();
    let coupon: string | undefined;
    try { coupon = sessionStorage.getItem(COUPON_KEY) ?? undefined; sessionStorage.removeItem(COUPON_KEY); } catch { /* ไม่มี storage */ }
    if (plan) setTimeout(() => void pay(plan, coupon), 0);
  }, [isAuthenticated, pay]);

  return (
    <>
      <form className="coupon-box" onSubmit={(e) => { e.preventDefault(); setApplied(codeInput.trim().toUpperCase()); }}>
        <label htmlFor="coupon">{K.couponLabel}</label>
        <input id="coupon" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={K.couponPlaceholder}
          maxLength={30} autoComplete="off" spellCheck={false} />
        {applied
          ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setApplied(""); setCodeInput(""); }}>{K.couponRemove}</button>
          : <button type="submit" className="btn btn-ghost btn-sm" disabled={!codeInput.trim()}>{K.couponApply}</button>}
        {applied && anyOk && <span className="coupon-ok" role="status">✓ {K.couponApplied} {applied}</span>}
        {applied && !anyOk && firstErr && !firstErr.ok && <span className="coupon-err" role="alert">{couponError(firstErr.error, K)}</span>}
      </form>
      <div className="price-grid">
        {P.packages.map((p, i) => {
          const id = p.id as PlanId;
          const launchFull = id === "yearly" && launch !== undefined && launch.seatsLeft <= 0;
          const launchClosed = id === "yearly" && launchOver;
          const regular = launchFull || launchClosed;   // จบรอบเปิดตัว → ขายต่อที่ราคาปกติ
          const full = id === "vip" && vipLeft === 0;
          const fullLabel = K.vipFull;
          return (
            <div key={p.name} className={`price-card reveal${p.featured ? " featured" : ""}`} style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}>
              {(regular ? P.regular.badge : p.badge) && <span className={p.badgeType === "limited" ? "badge-limited" : "badge-best"}>{regular ? P.regular.badge : p.badge}</span>}
              <div className="price-name">{p.name}</div>
              <div className="price-for">{p.for}</div>
              {(() => {
                const q = quotes[id];
                return q?.ok && q.code
                  ? <div className="price-num">฿{q.amount.toLocaleString("en-US")}<span className="strike">{q.listAmount.toLocaleString("en-US")}</span><span className="coupon-tag">{K.couponAfter}</span></div>
                  
                  : <div className="price-num">{p.numStrike && !regular && <span className="old-price">฿{p.numStrike}</span>}<span className={p.numStrike && !regular ? "new-price" : undefined}>฿{regular ? P.regular.num : p.num}</span></div>;
              })()}
              <div className="price-per">{regular ? P.regular.per : p.per}</div>
              {id === "yearly" && !regular && (
                <div className="price-per" role="status">
                  <strong>{P.launch.deadline}</strong>
                  {launch !== undefined && launch.seatsLeft > 0 && !launchOver && <> · {P.launch.seats.replace("{n}", String(launch.seatsLeft))}</>}
                </div>
              )}
              <ul className="price-feats">
                {p.feats.map((f) => <li key={f.text} className={f.off ? "off" : undefined}>{f.text}</li>)}
              </ul>
              <button
                className={`btn ${p.btnType === "primary" ? "btn-primary" : "btn-ghost"} btn-block`}
                disabled={full || busy !== null}
                onClick={() => void choose(id)}
              >
                {full ? fullLabel : busy === id ? K.redirecting : p.btn}
              </button>
            </div>
          );
        })}
      </div>
      {msg && <p className="pay-msg" role="status">{msg}</p>}
      <div className="guarantee reveal">
        <span className="g-ic" aria-hidden="true">🛡️</span>
        <div><div className="g-t">{P.guarantee.title}</div><div className="g-s">{P.guarantee.text}</div></div>
      </div>
      <p className="secure-note">{K.secureNote}</p>
      <p className="secure-note legal-agree">
        {CONTENT.legal.checkoutAgreeBefore} <a href={`${prefix}/terms`}>{CONTENT.legal.footerTerms}</a> {CONTENT.legal.checkoutAgreeAnd} <a href={`${prefix}/privacy`}>{CONTENT.legal.footerPrivacy}</a>
      </p>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 10 }}>{P.rolling}</p>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 10 }}>{P.note}</p>
    </>
  );
}
