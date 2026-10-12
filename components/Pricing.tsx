"use client";

/* การ์ดราคา + หน้าต่างชำระเงิน (ยังเป็นระบบจำลอง — จะต่อ Stripe Checkout ในเฟสรับเงิน) */
import { useEffect, useState } from "react";
import { CONTENT } from "@/lib/content";

type Pkg = { name: string; price: string };

export default function Pricing() {
  const P = CONTENT.pricing, K = CONTENT.checkout;
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [done, setDone] = useState(false);
  const [pay, setPay] = useState(0);

  const open = (p: Pkg) => { setPkg(p); setDone(false); };
  const close = () => setPkg(null);

  useEffect(() => {
    document.body.style.overflow = pkg ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pkg]);

  return (
    <>
      <div className="price-grid">
        {P.packages.map((p, i) => (
          <div key={p.name} className={`price-card reveal${p.featured ? " featured" : ""}`} style={{ "--d": `${i * 0.08}s` } as React.CSSProperties}>
            {p.badge && <span className={p.badgeType === "limited" ? "badge-limited" : "badge-best"}>{p.badge}</span>}
            <div className="price-name">{p.name}</div>
            <div className="price-for">{p.for}</div>
            <div className="price-num">฿{p.num}{p.numStrike && <span className="strike">{p.numStrike}</span>}</div>
            <div className="price-per">{p.per}</div>
            <ul className="price-feats">
              {p.feats.map((f) => <li key={f.text} className={f.off ? "off" : undefined}>{f.text}</li>)}
            </ul>
            <button className={`btn ${p.btnType === "primary" ? "btn-primary" : "btn-ghost"} btn-block`}
              onClick={() => open({ name: p.name, price: p.priceLabel })}>{p.btn}</button>
          </div>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 26 }}>{P.note}</p>

      <div className={`modal-overlay${pkg ? " active" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="modal">
          <button className="modal-close" onClick={close} aria-label={K.successClose}>&times;</button>
          {!done ? (
            <div>
              <h3>{K.title}</h3>
              <p className="sub">{K.sub}</p>
              <div className="order-box">
                <div><div className="pkg">{pkg?.name}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{K.pkgLabel}</div></div>
                <div className="amt">{pkg?.price}</div>
              </div>
              <div className="field"><label htmlFor="ckName">{K.name}</label><input id="ckName" type="text" placeholder={K.namePlaceholder} /></div>
              <div className="field"><label htmlFor="ckEmail">{K.email}</label><input id="ckEmail" type="email" placeholder={K.emailPlaceholder} /></div>
              <div className="field"><label htmlFor="ckTel">{K.tel}</label><input id="ckTel" type="tel" placeholder={K.telPlaceholder} /></div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 9 }}>{K.payLabel}</label>
              <div className="pay-opts">
                {[["📱", K.payPromptPay], ["💳", K.payCard]].map(([ic, label], i) => (
                  <label key={label} className={`pay-opt${pay === i ? " sel" : ""}`} onClick={() => setPay(i)}>
                    <input type="radio" name="pay" checked={pay === i} readOnly /><span className="pay-ic">{ic}</span><span>{label}</span>
                  </label>
                ))}
              </div>
              <button className="btn btn-primary btn-block btn-lg" onClick={() => setDone(true)}>{K.payButton}</button>
              <p className="secure-note">{K.secureNote}</p>
            </div>
          ) : (
            <div className="success">
              <div className="ok">✓</div>
              <h3>{K.successTitle}</h3>
              <p>{K.successText}</p>
              <button className="btn btn-primary btn-block" onClick={close}>{K.successClose}</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
