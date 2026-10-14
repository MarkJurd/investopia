"use client";

/* ตัวคำนวณปันผลต่อปี — ใช้ฟรี ไม่ต้องล็อกอิน · คำนวณในเบราว์เซอร์ทั้งหมด (ไม่ส่งข้อมูลอะไรออกไป)
 * ตัวเลข Yield/ภาษี: lib/yields.ts · ข้อความ: lib/content.ts (dividend) และ content.en.ts */
import Link from "next/link";
import { useMemo, useState } from "react";
import { useContent } from "@/components/ContentContext";
import {
  YIELDS_AS_OF, YIELD_GROUPS, YIELD_ROWS, netYield, type YieldGroup, type YieldRow,
} from "@/lib/yields";

const EPS = 0.0001;
const SHARE_RE = /^\d{0,3}(\.\d{0,2})?$/;       // สัดส่วน/เป้า: ตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง
const toNum = (s: string) => (s === "" || s === "." ? 0 : Number(s));
const fmt = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (n: number) => `${fmt(n)}%`;

// กลุ่มที่ Net Yield สูงสุด (เป็นข้อเท็จจริงจากตัวเลข ไม่ใช่คำแนะนำ)
const TOP_IN_GROUP: Record<string, string> = (() => {
  const best: Record<string, YieldRow> = {};
  for (const r of YIELD_ROWS) if (!best[r.group] || netYield(r) > netYield(best[r.group])) best[r.group] = r;
  return Object.fromEntries(Object.entries(best).map(([g, r]) => [g, r.id]));
})();

export default function DividendCalculator() {
  const C = useContent();
  const D = C.dividend;
  const lang = C.locale.code === "en" ? "en" : "th";
  const [shares, setShares] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState("");     // ตัวเลขล้วน (ไม่มีลูกน้ำ)
  const [target, setTarget] = useState("");

  const calc = useMemo(() => {
    let total = 0;
    let expected = 0;
    const contrib: Record<string, number> = {};
    for (const r of YIELD_ROWS) {
      const s = toNum(shares[r.id] ?? "");
      const c = (s * netYield(r)) / 100;
      contrib[r.id] = c;
      total += s;
      expected += c;
    }
    return { total, expected, contrib };
  }, [shares]);

  const amountNum = amount === "" ? 0 : Number(amount);
  const targetNum = toNum(target);
  const over = calc.total > 100 + EPS;
  const under = calc.total > EPS && calc.total < 100 - EPS;
  const full = Math.abs(calc.total - 100) <= EPS;
  const perYear = (amountNum * calc.expected) / 100;
  const showMoney = !over && amountNum > 0;
  const diff = calc.expected - targetNum;
  const asOf = new Date(YIELDS_AS_OF).toLocaleDateString(C.locale.dateLocale, { day: "numeric", month: "long", year: "numeric" });
  const tpl = (s: string, x: number) => s.replace("{x}", fmt(x));

  const setShare = (id: string, v: string) => {
    if (SHARE_RE.test(v) && toNum(v) <= 100) setShares((s) => ({ ...s, [id]: v }));
  };
  const reset = () => { setShares({}); setAmount(""); setTarget(""); };
  const anything = calc.total > 0 || amount !== "" || target !== "";

  const Summary = (
    <>
      <h2 className="tool-h2">{D.resultTitle}</h2>

      <div className="tool-meter" aria-hidden="true"><i className={over ? "over" : full ? "full" : ""} style={{ width: `${Math.min(100, calc.total)}%` }} /></div>
      <p className="tool-alloc">
        {D.allocated} <b>{fmtPct(calc.total)}</b> / 100%
        {under && <> · {D.left} {fmtPct(100 - calc.total)}</>}
        {over && <> · <span className="neg">{fmtPct(calc.total - 100)} {D.over}</span></>}
      </p>
      {over && <p className="tool-warn bad" role="alert">{tpl(D.warnOver, calc.total - 100)}</p>}
      {under && <p className="tool-warn" role="status">{tpl(D.warnUnder, 100 - calc.total)}</p>}
      {full && <p className="tool-warn ok" role="status">{D.okFull}</p>}

      <div className="tool-big">
        <span className="tool-big-label">{D.expectedLabel}</span>
        <b>{over ? "–" : fmtPct(calc.expected)}</b>
        <span className="tool-big-sub">{D.ofPortfolio}</span>
      </div>

      {showMoney ? (
        <div className="tool-money">
          <div><span>{D.perYear}</span><b>{fmt(perYear, 0)} {D.baht}</b></div>
          <div><span>{D.perMonth}</span><b>{fmt(perYear / 12, 0)} {D.baht}</b></div>
        </div>
      ) : (
        !over && <p className="tool-hint">{D.needAmount}</p>
      )}

      {targetNum > 0 && !over && calc.total > 0 && (
        <p className={`tool-target ${diff >= -EPS ? "ok" : "low"}`}>
          <span>{D.vsTarget} {fmtPct(targetNum)}</span>
          <b>{Math.abs(diff) <= EPS ? D.exactMsg : diff > 0 ? tpl(D.reachedMsg, diff) : tpl(D.belowMsg, -diff)}</b>
        </p>
      )}
    </>
  );

  return (
    <div className="tool-page">
      <section className="container tool-hero">
        <Link href={C.locale.base} className="tool-back">{D.backHome}</Link>
        <span className="eyebrow">{D.chip}</span>
        <h1>{D.title}</h1>
        <p className="lead">{D.lead}</p>
        <ol className="tool-steps">
          {D.steps.map((s) => (
            <li key={s.n}><span className="tool-step-n">{s.n}</span><div><b>{s.t}</b><p>{s.d}</p></div></li>
          ))}
        </ol>
        <p className="tool-asof"><b>{D.dataAsOf} {asOf}</b> · {D.dataNote}</p>
      </section>

      <div className="container tool-grid">
        <div className="tool-main">
          <section className="card tool-inputs">
            <h2 className="tool-h2">{D.inputsTitle}</h2>
            <div className="tool-fields">
              <label className="tool-field">
                <span>{D.amountLabel} <em>{D.amountHint}</em></span>
                <input inputMode="numeric" autoComplete="off" placeholder={D.amountPh}
                  value={amount === "" ? "" : Number(amount).toLocaleString("en-US")}
                  onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 12); setAmount(d.replace(/^0+(?=\d)/, "")); }} />
              </label>
              <label className="tool-field">
                <span>{D.targetLabel} <em>{D.targetHint}</em></span>
                <input inputMode="decimal" autoComplete="off" placeholder={D.targetPh} value={target}
                  onChange={(e) => { if (SHARE_RE.test(e.target.value) && toNum(e.target.value) <= 100) setTarget(e.target.value); }} />
              </label>
            </div>
            {anything && <button className="btn btn-ghost btn-sm" onClick={reset}>{D.reset}</button>}
          </section>

          <h2 className="tool-h2 tool-list-title">{D.listTitle}</h2>
          {YIELD_GROUPS.map((g: YieldGroup) => (
            <section key={g} className="tool-group">
              <h3>{D.groups[g].label}</h3>
              <p className="tool-blurb">{D.groups[g].blurb}</p>
              <div className="y-head" aria-hidden="true">
                <span />
                <span>{D.colYield}</span><span>{D.colTax}</span><span>{D.colNet}</span>
                <span>{D.colShare}</span><span>{D.colContrib}</span>
              </div>
              {YIELD_ROWS.filter((r) => r.group === g).map((r) => {
                const net = netYield(r);
                return (
                  <div className="y-row" key={r.id}>
                    <div className="y-name">
                      <b>{r.name}</b>{r.code && <span className="y-code">{r.code}</span>}
                      <span className="y-desc">{r.desc[lang]}{r.extra && <em> · {r.extra[lang]}</em>}</span>
                      {TOP_IN_GROUP[g] === r.id && <span className="y-top">{D.topInGroup}</span>}
                    </div>
                    <div className="y-num"><i>{D.colYield}</i>{fmtPct(r.yield)}</div>
                    <div className="y-num"><i>{D.colTax}</i>{r.tax}%</div>
                    <div className="y-num y-net"><i>{D.colNet}</i>{fmtPct(net)}</div>
                    <label className="y-input">
                      <input inputMode="decimal" autoComplete="off" placeholder="0" value={shares[r.id] ?? ""}
                        aria-label={`${D.shareLabel} ${r.name}`} onChange={(e) => setShare(r.id, e.target.value)} />
                      <span>%</span>
                    </label>
                    <div className="y-num y-contrib"><i>{D.colContrib}</i>{calc.contrib[r.id] > 0 ? `+${fmtPct(calc.contrib[r.id])}` : "–"}</div>
                  </div>
                );
              })}
            </section>
          ))}

          <section className="card tool-caution">
            <h2 className="tool-h2">{D.cautionTitle}</h2>
            <ul>{D.caution.map((c) => <li key={c}>{c}</li>)}</ul>
          </section>

          <section className="card tool-learn">
            <h2 className="tool-h2">{D.learnTitle}</h2>
            <dl>{D.learn.map((l) => <div key={l.t}><dt>{l.t}</dt><dd>{l.d}</dd></div>)}</dl>
          </section>

          <section className="tool-cta">
            <div><b>{D.ctaTitle}</b><p>{D.ctaText}</p></div>
            <Link href={`${C.locale.base === "/" ? "/" : `${C.locale.base}/`}#curriculum`} className="btn btn-primary">{D.ctaButton}</Link>
          </section>
        </div>

        <aside className="card tool-result" aria-live="polite">{Summary}</aside>
      </div>

      {/* แถบสรุปติดขอบล่างบนมือถือ (เห็นผลตลอดระหว่างเลื่อนตาราง) */}
      <div className="tool-mini" aria-hidden="true">
        <span>{D.mini} <b className={over ? "neg" : ""}>{fmtPct(calc.total)}</b></span>
        <span>{D.expectedLabel} <b>{over ? "–" : fmtPct(calc.expected)}</b></span>
      </div>
    </div>
  );
}
