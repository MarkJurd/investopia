"use client";

/* ราคาปัจจุบัน + แนวรับ–แนวต้าน (ส่วนบนของหน้าหุ้น) — ใช้ฟรี (ต้องล็อกอิน) · คำนวณที่ lib/sr.ts ผ่าน convex/market.ts
 * แสดงแค่ราคา ระยะห่าง และระดับความมั่นใจ (เจ้าของสั่ง: ไม่ต้องโชว์ศัพท์ Swing/Pivot/ATR/จำนวนครั้งที่แตะ) */
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import type { Horizon } from "@/lib/sr";

type Result = NonNullable<Awaited<ReturnType<ReturnType<typeof useAction<typeof api.market.levels>>>>>;

const tpl = (s: string, x: string | number) => s.replace("{x}", String(x));
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Confidence({ stars }: { stars: number }) {
  const D = useContent().levels;
  const n = Math.max(1, Math.min(3, stars)) as 1 | 2 | 3;
  return (
    <span className={`lv-conf c${n}`} title={D.confHint}>
      <span aria-hidden="true">{"★".repeat(n)}<s>{"★".repeat(3 - n)}</s></span> {D.confLabel} {D.conf[n]}
    </span>
  );
}

export default function LevelsPanel({ symbol, actions }: { symbol: string; actions?: React.ReactNode }) {
  const C = useContent();
  const D = C.levels;
  const run = useAction(api.market.levels);
  const [got, setGot] = useState<{ symbol: string; status: "idle" | "error" | "notFound"; result: Result | null } | null>(null);
  const [horizon, setHorizon] = useState<Horizon>("short");

  useEffect(() => {
    let alive = true;
    run({ symbol })
      .then((r) => { if (alive) setGot({ symbol, status: r ? "idle" : "notFound", result: r }); })
      .catch(() => { if (alive) setGot({ symbol, status: "error", result: null }); });
    return () => { alive = false; };
  }, [run, symbol]);
  const status = got?.symbol === symbol ? got.status : "loading";
  const result = got?.symbol === symbol ? got.result : null;

  if (status === "loading") return <p className="tool-warn" role="status">{D.loading}</p>;
  if (status === "error") return <p className="tool-warn bad" role="alert">{D.error}</p>;
  if (status === "notFound" || !result) return <p className="tool-warn" role="status">{tpl(D.notFound, symbol)}</p>;

  const change = result.prevClose ? ((result.price - result.prevClose) / result.prevClose) * 100 : null;
  const levels = result.levels[horizon];
  const above = levels.filter((l) => l.kind === "resistance");
  const below = levels.filter((l) => l.kind === "support");
  const row = (l: (typeof levels)[number]) => (
    <li key={`${l.kind}-${l.price}`} className={`lv-row ${l.kind}`}>
      <span className="lv-kind">{l.kind === "support" ? D.support : D.resistance}</span>
      <b className="lv-p">{money(l.price)}</b>
      <span className="lv-d">{l.distPct > 0 ? "+" : ""}{l.distPct.toFixed(1)}%</span>
      <Confidence stars={l.stars} />
    </li>
  );

  return (
    <>
      <section className="card lv-head">
        <div>
          <h1 className="lv-name">{result.symbol} <span>{result.name}</span></h1>
          <p className="lv-big">
            <b>{money(result.price)}</b> <span>{result.currency}</span>
            {change !== null && <em className={change >= 0 ? "up" : "down"}>{change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}% <i>{D.vsPrev}</i></em>}
          </p>
          <p className="lv-sub">
            {D.trendLabel}: <b className={`lv-trend ${result.trend}`}>{D.trend[result.trend]}</b>
            {" · "}{result.live ? D.marketOpen : D.marketClosed}
            {" · "}{tpl(D.asOf, new Date(result.asOf).toLocaleTimeString(C.locale.code === "en" ? "en-US" : "th-TH"))}
          </p>
        </div>
        {actions && <div className="lv-actions">{actions}</div>}
      </section>
      {result.stale && <p className="tool-warn" role="status">{D.stale}</p>}

      <section className="card sc-card">
        <div className="lv-top">
          <h2 className="tool-h2">{D.ladderTitle}</h2>
          <div className="lv-tabs" role="tablist">
            {(["short", "long"] as const).map((h) => (
              <button key={h} role="tab" aria-selected={horizon === h} className={horizon === h ? "on" : ""} onClick={() => setHorizon(h)}>{D.horizon[h]}</button>
            ))}
          </div>
        </div>
        {levels.length === 0 ? <p className="tool-hint">{D.noLevels}</p> : (
          <ul className="lv-ladder">
            {above.map(row)}
            <li className="lv-now"><b>{D.now}</b><span>{money(result.price)}</span></li>
            {below.map(row)}
          </ul>
        )}
        <p className="sc-legend">{D.confHint} · {D.delayNote}</p>
      </section>
    </>
  );
}
