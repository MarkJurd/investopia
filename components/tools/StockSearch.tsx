"use client";

/* ช่องค้นหุ้นช่องเดียวของเว็บ → ไปหน้าหุ้น /tools/stock/<ticker> (มีรายการแนะนำตอนพิมพ์จาก convex/screener.ts → suggest) */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent, type Content } from "@/components/ContentContext";
import { BOOT_NOW } from "@/components/community/helpers";

const prefix = (C: Content) => (C.locale.base === "/" ? "" : C.locale.base);
export const toolsPath = (C: Content) => `${prefix(C)}/tools`;
export const stockPath = (C: Content, symbol: string) => `${prefix(C)}/tools/stock/${encodeURIComponent(symbol.trim().toUpperCase().replace(/\./g, "-"))}`;

export default function StockSearch({ initial = "" }: { initial?: string }) {
  const C = useContent();
  const T = C.tools;
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const suggestions = useQuery(api.screener.suggest, q.trim() !== "" && q !== initial ? { q, now: BOOT_NOW } : "skip") ?? [];

  return (
    <form className="card sc-search" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(stockPath(C, q)); }}>
      <label className="tool-field">
        <span>{T.searchLabel}</span>
        <div className="sc-row">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.searchPh} list="stock-suggest" autoComplete="off" maxLength={40} />
          <button className="btn btn-primary">{T.searchBtn}</button>
        </div>
      </label>
      <datalist id="stock-suggest">
        {suggestions.map((x) => <option key={x.ticker} value={x.ticker}>{x.name}</option>)}
      </datalist>
    </form>
  );
}
