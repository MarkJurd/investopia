"use client";

/* แถบด้านบนหลังกลับจากหน้าชำระเงินของ Stripe (?checkout=success / cancel)
 * สิทธิ์จะขึ้นเองแบบ real-time ทันทีที่ webhook ของ Stripe มาถึง */
import { useState, useSyncExternalStore } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";

const noSubscribe = () => () => {};
function readCheckoutParam(): "success" | "cancel" | null {
  const v = new URLSearchParams(window.location.search).get("checkout");
  return v === "success" || v === "cancel" ? v : null;
}

export default function CheckoutBanner() {
  const CONTENT = useContent();
  const K = CONTENT.checkout;
  const fromUrl = useSyncExternalStore(noSubscribe, readCheckoutParam, () => null);
  const [dismissed, setDismissed] = useState(false);
  const me = useQuery(api.payments.myMembership);
  const state = dismissed ? null : fromUrl;

  if (!state) return null;
  const close = () => {
    setDismissed(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.toString());
  };

  let body;
  if (state === "cancel") {
    body = <p>{K.cancelText}</p>;
  } else if (!me) {
    body = <><b>{K.pendingTitle}</b><p>{K.pendingText}</p></>;
  } else {
    const until = new Date(me.expiresAt).toLocaleDateString(CONTENT.locale.dateLocale, { day: "numeric", month: "long", year: "numeric" });
    body = (
      <>
        <b>{K.successTitle}</b>
        <p>{K.successText} {CONTENT.planLabels[me.plan]} {K.until} {until}</p>
        {me.indicatorBonus && <p>{K.indicatorNote}</p>}
      </>
    );
  }

  return (
    <div className={`checkout-banner ${state === "success" && me ? "ok" : ""}`} role="status">
      <div className="container cb-inner">
        <div>{body}</div>
        <button className="btn btn-ghost btn-sm" onClick={close}>{K.close}</button>
      </div>
    </div>
  );
}
