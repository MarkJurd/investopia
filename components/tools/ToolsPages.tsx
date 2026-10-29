"use client";

/* หน้าเครื่องมือ (/tools) และหน้าหุ้น (/tools/stock/XXX) — ข้อความที่ lib/content.ts (tools / levels / screener)
 * สิทธิ์: ราคา+แนวรับต้าน ฟรี (ต้องล็อกอิน) · งบเทียบคู่แข่ง ฟรีวันละ 5 บริษัท สมาชิกไม่จำกัด · ปันผล ฟรีไม่ต้องล็อกอิน */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import SignInGate from "@/components/tools/SignInGate";
import StockSearch, { stockPath, toolsPath } from "@/components/tools/StockSearch";
import LevelsPanel from "@/components/tools/LevelsPanel";
import Financials from "@/components/tools/Financials";
import Watchlist, { WatchButton } from "@/components/tools/Watchlist";

function Caution() {
  const T = useContent().tools;
  return (
    <section className="card tool-caution">
      <h2 className="tool-h2">{T.cautionTitle}</h2>
      <ul>{T.caution.map((c) => <li key={c}>{c}</li>)}</ul>
    </section>
  );
}

export function ToolsHub() {
  const C = useContent();
  const T = C.tools;
  const prefix = C.locale.base === "/" ? "" : C.locale.base;
  return (
    <div className="tool-page">
      <section className="container tool-hero">
        <Link href={C.locale.base} className="tool-back">{C.dividend.backHome}</Link>
        <h1>{T.title}</h1>
        <p className="lead">{T.lead}</p>
      </section>
      <div className="container sc-main">
        <SignInGate pathHere={toolsPath(C)}>
          <StockSearch />
          <Watchlist />
        </SignInGate>
        <h2 className="tool-h2 tool-list-title">{T.whatTitle}</h2>
        <div className="hub-grid">
          {T.cards.map((c) => (
            <div key={c.t} className="card hub-card"><b>{c.t}</b><p>{c.d}</p><span className="hub-tag">{c.tag}</span></div>
          ))}
          <Link href={`${prefix}/tools/dividend`} className="card hub-card hub-link">
            <b>{T.dividendTitle}</b><p>{T.dividendText}</p><span className="hub-tag">{T.dividendTag}</span><span className="hub-open">{T.open}</span>
          </Link>
        </div>
        <Caution />
      </div>
    </div>
  );
}

export function StockPage({ symbol }: { symbol: string }) {
  const C = useContent();
  return (
    <div className="tool-page">
      <section className="container tool-hero tool-hero-sm">
        <Link href={toolsPath(C)} className="tool-back">{C.tools.back}</Link>
      </section>
      <div className="container sc-main">
        <SignInGate pathHere={stockPath(C, symbol)}>
          <StockSearch key={symbol} initial={symbol} />
          <LevelsPanel symbol={symbol} actions={<WatchButton symbol={symbol} />} />
          <Financials symbol={symbol} />
        </SignInGate>
        <Caution />
      </div>
    </div>
  );
}
