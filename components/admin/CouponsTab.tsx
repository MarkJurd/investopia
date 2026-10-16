"use client";

/* แท็บ "โค้ดส่วนลด": สร้างโค้ด (% หรือบาท, แพ็กเกจ, จำนวนครั้ง, วันหมดอายุ) · เปิด/ปิดโค้ด */
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { PlanId } from "@/convex/plans";
import { useContent } from "@/components/ContentContext";
import { adminError, baht, fmtDate } from "@/components/admin/shared";

const SALE_PLANS: PlanId[] = ["yearly", "vip"];

export default function CouponsTab() {
  const C = useContent();
  const A = C.admin;
  const list = useQuery(api.adminMembers.coupons);
  const create = useMutation(api.adminMembers.createCoupon);
  const setActive = useMutation(api.adminMembers.setCouponActive);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState(10);
  const [plans, setPlans] = useState<PlanId[]>(["yearly"]);
  const [maxUses, setMaxUses] = useState("");
  const [expires, setExpires] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      // วันหมดอายุ = สิ้นวันนั้นตามเวลาไทย
      const exp = expires ? new Date(`${expires}T23:59:59+07:00`).getTime() : null;
      await create({ code, kind, value, plans, maxUses: maxUses ? Number(maxUses) : null, expiresAt: exp, note });
      setMsg(A.couponCreated);
      setCode(""); setNote(""); setMaxUses(""); setExpires("");
    } catch (err) {
      setMsg(adminError(err, C));
    } finally {
      setBusy(false);
    }
  };

  const describe = (k: "percent" | "amount", v: number) => (k === "percent" ? `${v}%` : baht(v));

  return (
    <div className="adm-coupons">
      <p className="adm-hint">{A.couponHint}</p>
      <section className="card adm-card">
        <h2>{A.couponCreate}</h2>
        <form className="adm-form" onSubmit={(e) => void submit(e)}>
          <div className="adm-grid2">
            <label>{A.couponCode}<input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={30} placeholder="NEWYEAR" spellCheck={false} /></label>
            <label>{A.couponKind}
              <select value={kind} onChange={(e) => setKind(e.target.value as "percent" | "amount")}>
                <option value="percent">{A.couponPercent}</option>
                <option value="amount">{A.couponAmount}</option>
              </select>
            </label>
            <label>{A.couponValue} ({kind === "percent" ? "%" : "฿"})<input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>
            <fieldset className="adm-plans">
              <legend>{A.couponPlans}</legend>
              {SALE_PLANS.map((p) => (
                <label key={p} className="adm-check">
                  <input type="checkbox" checked={plans.includes(p)} onChange={(e) => setPlans(e.target.checked ? [...plans, p] : plans.filter((x) => x !== p))} /> {C.planLabels[p]}
                </label>
              ))}
            </fieldset>
            <label>{A.couponMaxUses}<input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></label>
            <label>{A.couponExpires}<input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} /></label>
          </div>
          <label>{A.couponNote}<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} /></label>
          <div className="adm-row">
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>{busy ? A.saving : A.couponCreateBtn}</button>
            {msg && <span className="adm-msg">{msg}</span>}
          </div>
        </form>
      </section>

      <section className="card adm-card">
        {list === undefined && <p className="adm-sub">{A.loading}</p>}
        {list && list.length === 0 && <p className="adm-sub">{A.couponEmpty}</p>}
        {list && list.length > 0 && (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>{A.couponCode}</th><th>{A.couponValue}</th><th>{A.couponPlans}</th><th>{A.couponUses}</th><th>{A.cols.expires}</th><th>{A.cols.note}</th><th>{A.cols.status}</th><th /></tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className={c.active ? "" : "dim"}>
                    <td><code>{c.code}</code></td>
                    <td>{describe(c.kind, c.value)}</td>
                    <td>{c.plans.map((p) => C.planLabels[p]).join(", ")}</td>
                    <td>{c.uses} / {c.maxUses ?? A.couponUnlimited}</td>
                    <td>{c.expiresAt ? fmtDate(c.expiresAt, C) : A.couponNoExpiry}</td>
                    <td>{c.note}</td>
                    <td>{c.active ? A.couponActive : A.couponInactive}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => void setActive({ id: c.id, active: !c.active })}>{c.active ? A.couponDisable : A.couponEnable}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
