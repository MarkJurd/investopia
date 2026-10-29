"use client";

/* งบการเงินเทียบคู่แข่ง (ส่วนล่างของหน้าหุ้น) — ฟรีวันละ 5 บริษัท สมาชิกไม่จำกัด (นับที่ server ใน convex/screenerSec.ts)
 * รายชื่อกลุ่ม/เกณฑ์: lib/screener.ts · ข้อความ: lib/content.ts (screener)
 * กติกา: เทียบรายข้อเท่านั้น ไม่มีคะแนนรวม/ไม่จัดอันดับ */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { pricingPath } from "@/components/learn/steps";
import {
  RATIOS, SCREENER_GROUPS, average, compare, explain, isEstimated, median, passes, type RatioDef, type Why, type YearFacts,
} from "@/lib/screener";

type Result = NonNullable<Awaited<ReturnType<ReturnType<typeof useAction<typeof api.screenerSec.compare>>>>>;
type Company = Result["companies"][number];

const FIN_KEYS = ["revenue", "grossProfit", "sga", "operatingIncome", "interestExpense", "netIncome", "depreciation", "longTermDebt"] as const;
const tpl = (s: string, x: string | number) => s.replace("{x}", String(x));
const latest = (c: Company) => c.years[c.years.length - 1];

export default function Financials({ symbol }: { symbol: string }) {
  const C = useContent();
  const D = C.screener;
  const run = useAction(api.screenerSec.compare);
  // ผลลัพธ์ผูกกับ symbol ที่ขอ — symbol เปลี่ยนแล้วผลเก่ายังไม่ตรง = กำลังโหลด
  const [got, setGot] = useState<{ symbol: string; status: "idle" | "error" | "notListed" | "quota"; result: Result | null } | null>(null);
  const lang = C.locale.code === "en" ? "en" : "th";

  useEffect(() => {
    let alive = true;
    run({ ticker: symbol })
      .then((r) => { if (alive) setGot({ symbol, status: r ? "idle" : "notListed", result: r }); })
      .catch((e) => { if (alive) setGot({ symbol, status: e instanceof ConvexError && e.data === "QUOTA" ? "quota" : "error", result: null }); });
    return () => { alive = false; };
  }, [run, symbol]);
  const status = got?.symbol === symbol ? got.status : "loading";
  const result = got?.symbol === symbol ? got.result : null;

  const self = result?.companies.find((c) => c.cik === result.selfCik);
  const peers = result?.companies.filter((c) => c.cik !== result.selfCik && c.years.length > 0) ?? [];
  const g = result?.group;
  const ownerGroup = g?.kind === "owner" ? SCREENER_GROUPS.find((x) => x.id === g.id) : undefined;
  const groupName = ownerGroup ? ownerGroup.name[lang] : g?.kind === "sic" ? `${g.desc} (SIC ${g.sic})` : "";
  // ค่ากลางต้องมีคู่แข่งอย่างน้อย 2 รายที่คำนวณได้ ไม่งั้นไม่เทียบ
  const peerMedian = (def: RatioDef) => { const xs = peers.map((c) => def.calc(latest(c))).filter((x): x is number => x !== null); return xs.length >= 2 ? median(xs) : null; };
  const fmt = (def: RatioDef, x: number | null, y?: YearFacts) =>
    x === null ? D.na : `${y && isEstimated(def, y) ? "≈" : ""}${def.unit === "%" ? `${x.toFixed(1)}%` : `${x.toFixed(1)} ${D.times}`}`;
  const whyText = (w: Why) => (D.why[w.kind] as Record<string, string>)[w.field] ?? "";
  const gaps = self ? [self, ...peers].flatMap((c) => RATIOS.flatMap((r) => { const w = explain(r, latest(c)); return w ? [{ c, r, w }] : []; })) : [];
  const anyEst = self ? [self, ...peers].some((c) => c.years.slice(-5).some((y) => y.est?.length)) : false;

  return (
    <section className="sc-stack" aria-labelledby="fin-title">
      <h2 id="fin-title" className="tool-h2 tool-list-title">{D.sectionTitle}</h2>
      {status === "loading" && <p className="tool-warn" role="status">{D.loading}</p>}
      {status === "error" && <p className="tool-warn bad" role="alert">{D.error}</p>}
      {status === "notListed" && <p className="tool-warn" role="status">{tpl(D.notListed, symbol)}</p>}
      {status === "quota" && (
        <div className="tool-warn" role="status">
          <p>{D.quotaOut}</p>
          <Link href={pricingPath(C)} className="btn btn-primary btn-sm">{D.seePlans}</Link>
        </div>
      )}
      {status === "idle" && result?.quota && <p className="sc-note">{tpl(D.quotaUsed, result.quota.used)}</p>}
      {status === "idle" && result && result.failed.length > 0 && <p className="tool-warn" role="status">{tpl(D.failed, result.failed.join(", "))}</p>}
      {status === "idle" && result?.finance && <p className="tool-warn" role="status">{D.finance}</p>}
      {status === "idle" && self && self.years.length === 0 && <p className="tool-warn" role="status">{tpl(D.noData, self.ticker)}</p>}
      {status === "idle" && self && self.years.length > 0 && peers.length === 0 && <p className="tool-warn" role="status">{D.noPeers}</p>}

      {status === "idle" && result && self && self.years.length > 0 && (
        <>
          <section className="card sc-card">
            <h3 className="tool-h2">{D.tableTitle}</h3>
            {groupName && <p className="tool-asof">{D.group}: <b>{groupName}</b>{g?.kind === "sic" && <> · {D.sicPeers}</>}</p>}
            <div className="sc-scroll">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th scope="col">{D.colCompany}</th>
                    {RATIOS.map((r) => <th scope="col" key={r.id}>{D.ratios[r.id].name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[self, ...peers].map((c) => (
                    <tr key={c.cik} className={c.cik === self.cik ? "sc-self" : ""}>
                      <th scope="row"><b>{c.ticker}</b><span>{c.name} · {latest(c).end}</span></th>
                      {RATIOS.map((r) => { const x = r.calc(latest(c)); const ref = peerMedian(r); return <td key={r.id} className={x !== null && ref !== null ? `sc-c-${compare(r, x, ref)}` : ""}>{fmt(r, x, latest(c))}</td>; })}
                    </tr>
                  ))}
                  <tr className="sc-median">
                    <th scope="row">{D.peerMedian}</th>
                    {RATIOS.map((r) => <td key={r.id}>{fmt(r, peerMedian(r))}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="sc-legend">{D.legend}</p>
            {anyEst && <p className="sc-note">{D.estNote}</p>}
            {gaps.length > 0 && (
              <div className="sc-gaps">
                <h4>{D.gapsTitle}</h4>
                <ul>{gaps.map(({ c, r, w }) => <li key={`${c.ticker}-${r.id}`}><b>{c.ticker} · {D.ratios[r.id].name}</b> {whyText(w)}</li>)}</ul>
              </div>
            )}
          </section>

          <h3 className="tool-h2 tool-list-title">{tpl(D.summaryTitle, self.ticker)}</h3>
          <div className="sc-grid">
            {RATIOS.map((r) => {
              const T = D.ratios[r.id];
              const last5 = self.years.slice(-5);
              const values = last5.map((y) => r.calc(y));
              const now = values[values.length - 1];
              const avg = average(values);
              const ref = peerMedian(r);
              const vs = now !== null && ref !== null ? compare(r, now, ref) : null;
              const tr = now !== null && avg !== null && values.filter((x) => x !== null).length >= 2 ? compare(r, now, avg) : null;
              const ok = now !== null ? passes(r, now) : null;
              const w = explain(r, last5[last5.length - 1]);
              return (
                <section key={r.id} className={`card sc-ratio sc-b-${vs ?? "none"}`}>
                  <h4>{T.name}</h4>
                  <p className="sc-formula">{T.formula}</p>
                  <b className={`sc-value sc-v-${vs ?? "none"}`}>{fmt(r, now, last5[last5.length - 1])}</b>
                  {w ? <p className="sc-why" role="note">{whyText(w)}</p> : <ul className="sc-facts">
                    <li><span>{D.vsPeers} ({D.peerMedian} {fmt(r, ref)})</span>{vs && <em className={`sc-tag ${vs}`}>{D.verdict[vs]}</em>}</li>
                    <li><span>{D.trend} ({D.avg5} {fmt(r, avg)})</span>{tr && <em className={`sc-tag ${tr}`}>{D.trendWord[tr]}</em>}</li>
                    <li><span>{D.rule}: {T.rule || D.noRule}</span>{ok !== null && <em className={`sc-tag ${ok ? "better" : "worse"}`}>{ok ? D.pass : D.fail}</em>}</li>
                  </ul>}
                  <p className="sc-history">{last5.map((y, i) => <span key={y.end}>{y.end.slice(0, 4)}: {fmt(r, values[i], y)}</span>)}</p>
                  <p className="sc-desc">{T.d}</p>
                </section>
              );
            })}
          </div>

          <section className="card sc-card">
            <h3 className="tool-h2">{tpl(D.finTitle, self.ticker)}</h3>
            <div className="sc-scroll">
              <table className="sc-table sc-fin">
                <thead>
                  <tr><th scope="col" />{self.years.slice(-5).map((y) => <th scope="col" key={y.end}>{y.end}</th>)}</tr>
                </thead>
                <tbody>
                  {FIN_KEYS.map((k) => (
                    <tr key={k}>
                      <th scope="row">{D.fin[k]}</th>
                      {self.years.slice(-5).map((y) => { const n = y[k]; return <td key={y.end}>{n === undefined ? D.na : `${y.est?.includes(k) ? "≈" : ""}${(n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}</td>; })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="sc-note">
              {tpl(D.source, new Date(Math.min(...result.companies.map((c) => c.fetchedAt))).toLocaleDateString(C.locale.code === "en" ? "en-US" : "th-TH"))}
              {" · "}
              <a href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${self.cik}&type=10-K`} target="_blank" rel="noopener noreferrer">{D.secLink}</a>
            </p>
          </section>
        </>
      )}
    </section>
  );
}
