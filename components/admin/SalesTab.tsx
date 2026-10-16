"use client";

/* แท็บ "ยอดขาย": สรุปยอด · ตารางทุกรายการ (จ่ายผ่าน Stripe + ให้ด้วยมือ) · ดาวน์โหลด CSV */
import { useState } from "react";
import { useConvex, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { baht, fmtDateTime, fmtDate } from "@/components/admin/shared";

export default function SalesTab() {
  const C = useContent();
  const A = C.admin;
  const convex = useConvex();
  const [now] = useState(() => Math.floor(Date.now() / 60000) * 60000);
  const sum = useQuery(api.adminMembers.salesSummary, { now });
  const { results, status, loadMore } = usePaginatedQuery(api.adminMembers.sales, {}, { initialNumItems: 50 });
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows = await convex.query(api.adminMembers.salesExport, {});
      const head = ["date", "name", "email", "plan", "amount_thb", "list_price_thb", "coupon", "source", "status", "expires", "indicator", "note", "stripe_payment_intent"];
      const esc = (x: unknown) => `"${String(x ?? "").replace(/"/g, '""')}"`;
      const lines = rows.map((r) => [
        new Date(r.createdAt).toISOString(), r.name, r.email, r.plan, r.amount, r.listAmount ?? "", r.couponCode ?? "",
        r.source, r.status, new Date(r.expiresAt).toISOString().slice(0, 10), r.indicatorBonus ? "yes" : "", r.note, r.paymentIntentId ?? "",
      ].map(esc).join(","));
      // BOM ให้ Excel อ่านภาษาไทยถูก
      const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `investopia-sales-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="adm-sales">
      <p className="adm-hint">{A.salesHint}</p>
      {sum && (
        <div className="adm-stats">
          <div className="card"><span>{A.thisMonth}</span><b>{baht(sum.thisMonth.revenue)}</b><small>{sum.thisMonth.count} {A.orders}</small></div>
          <div className="card"><span>{A.lastMonth}</span><b>{baht(sum.lastMonth.revenue)}</b><small>{sum.lastMonth.count} {A.orders}</small></div>
          <div className="card"><span>{A.allTime}</span><b>{baht(sum.allTime.revenue)}</b><small>{sum.allTime.count} {A.orders} · {A.refunded} {baht(sum.allTime.refunded)}</small></div>
          <div className="card"><span>{A.activeMembers}</span><b>{sum.activeMembers}</b><small>{A.indicatorGiven}: {sum.indicatorGiven}/50</small></div>
        </div>
      )}
      {sum?.capped && <p className="adm-sub">{A.capped}</p>}
      <div className="adm-row">
        <button className="btn btn-ghost btn-sm" disabled={exporting} onClick={() => void exportCsv()}>{exporting ? A.loading : A.exportCsv}</button>
      </div>
      <div className="adm-table-wrap card">
        <table className="adm-table">
          <thead><tr>
            <th>{A.cols.date}</th><th>{A.cols.buyer}</th><th>{A.cols.plan}</th><th>{A.cols.amount}</th><th>{A.cols.coupon}</th>
            <th>{A.cols.source}</th><th>{A.cols.status}</th><th>{A.cols.expires}</th><th>{A.cols.note}</th>
          </tr></thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className={r.status !== "active" ? "dim" : ""}>
                <td>{fmtDateTime(r.createdAt, C)}</td>
                <td><b>{r.name || "—"}</b><br /><small>{r.email}</small></td>
                <td>{C.planLabels[r.plan]}{r.indicatorBonus && " 🎁"}</td>
                <td>{baht(r.amount)}{r.listAmount !== null && r.listAmount !== r.amount && <><br /><small className="strike">{baht(r.listAmount)}</small></>}</td>
                <td>{r.couponCode ?? ""}</td>
                <td>{A.source[r.source]}</td>
                <td>{A.status[r.status]}</td>
                <td>{fmtDate(r.expiresAt, C)}</td>
                <td>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {status === "CanLoadMore" && <button className="btn btn-ghost btn-sm" onClick={() => loadMore(50)}>{A.loadMore}</button>}
      {status === "LoadingFirstPage" && <p className="adm-sub">{A.loading}</p>}
    </div>
  );
}
