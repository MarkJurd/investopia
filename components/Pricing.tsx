"use client";

/* การ์ดราคา + ปุ่มจ่ายเงินจริง (Stripe Checkout)
 * ยังไม่ล็อกอิน → ล็อกอินด้วย Google ก่อน แล้วพาไปหน้าจ่ายเงินต่ออัตโนมัติ */
import { useCallback, useEffect, useRef, useState } from "react";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import type { PlanId } from "@/convex/plans";
import { CONTENT } from "@/lib/content";

const PENDING_KEY = "investopia.pendingPlan"; // จำแพ็กเกจที่กดไว้ระหว่างไปล็อกอิน
const PLAN_IDS: PlanId[] = ["monthly", "quarterly", "yearly", "vip"];

function readPending(): PlanId | null {
  try {
    const v = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return PLAN_IDS.includes(v as PlanId) ? (v as PlanId) : null;
  } catch { return null; }
}

export default function Pricing() {
  const P = CONTENT.pricing, K = CONTENT.checkout;
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const createCheckout = useAction(api.payments.createCheckout);
  const vipLeft = useQuery(api.payments.vipSeatsLeft);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [msg, setMsg] = useState("");

  const pay = useCallback(async (plan: PlanId) => {
    setMsg("");
    setBusy(plan);
    try {
      const { url } = await createCheckout({ plan });
      window.location.href = url;
    } catch (e) {
      setBusy(null);
      setMsg(String(e).includes("VIP_FULL") ? K.vipFull : K.error);
    }
  }, [createCheckout, K.vipFull, K.error]);

  const choose = async (plan: PlanId) => {
    if (isAuthenticated) return pay(plan);
    try { sessionStorage.setItem(PENDING_KEY, plan); } catch { /* ไม่มี storage ก็แค่ต้องกดซ้ำหลังล็อกอิน */ }
    setMsg(K.signInFirst);
    await signIn("google", { redirectTo: "/#pricing" });
  };

  // กลับมาจากล็อกอินแล้ว → ไปหน้าจ่ายเงินของแพ็กเกจที่กดไว้ต่อเลย
  const resumed = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || resumed.current) return;
    resumed.current = true;
    const plan = readPending();
    if (plan) setTimeout(() => void pay(plan), 0);
  }, [isAuthenticated, pay]);

  return (
    <>
      <div className="price-grid">
        {P.packages.map((p, i) => {
          const id = p.id as PlanId;
          const full = id === "vip" && vipLeft === 0;
          return (
            <div key={p.name} className={`price-card reveal${p.featured ? " featured" : ""}`} style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}>
              {p.badge && <span className={p.badgeType === "limited" ? "badge-limited" : "badge-best"}>{p.badge}</span>}
              <div className="price-name">{p.name}</div>
              <div className="price-for">{p.for}</div>
              <div className="price-num">฿{p.num}{p.numStrike && <span className="strike">{p.numStrike}</span>}</div>
              <div className="price-per">{p.per}</div>
              <ul className="price-feats">
                {p.feats.map((f) => <li key={f.text} className={f.off ? "off" : undefined}>{f.text}</li>)}
              </ul>
              <button
                className={`btn ${p.btnType === "primary" ? "btn-primary" : "btn-ghost"} btn-block`}
                disabled={full || busy !== null}
                onClick={() => void choose(id)}
              >
                {full ? K.vipFull : busy === id ? K.redirecting : p.btn}
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
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 10 }}>{P.note}</p>
    </>
  );
}
