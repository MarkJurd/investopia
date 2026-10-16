"use client";

/* แท็บ "สมาชิก": ค้นหาด้วยอีเมล · ดูรายละเอียด/ประวัติ · ให้/ต่อ/ยกเลิกสิทธิ์ด้วยมือ · สลับ Indicator */
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { PlanId } from "@/convex/plans";
import { useContent } from "@/components/ContentContext";
import { adminError, baht, fmtDate } from "@/components/admin/shared";

const GRANT_PLANS: PlanId[] = ["yearly", "vip", "monthly", "quarterly"];
const DAY_PRESETS = [30, 90, 365];

export default function MembersTab() {
  const C = useContent();
  const A = C.admin;
  const [now] = useState(() => Math.floor(Date.now() / 60000) * 60000);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Id<"users"> | null>(null);
  const found = useQuery(api.adminMembers.searchMembers, { q, now });
  const cancelPending = useMutation(api.adminMembers.cancelPending);

  return (
    <div className="adm-members">
      <GrantForm defaultEmail={q} />

      <section className="card adm-card">
        <form className="adm-row" onSubmit={(e) => { e.preventDefault(); setQ(input.trim()); setSelected(null); }}>
          <input className="adm-grow" type="email" value={input} onChange={(e) => setInput(e.target.value)} placeholder={A.searchPlaceholder} />
          <button className="btn btn-primary btn-sm" type="submit">{A.search}</button>
          {q && <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setQ(""); setInput(""); }}>{A.cancel}</button>}
        </form>
        {!q && <h3 className="adm-h3">{A.recentMembers}</h3>}
        {found === undefined && <p className="adm-sub">{A.loading}</p>}
        {found && found.members.length === 0 && found.pending.length === 0 && <p className="adm-sub">{A.noMembers}</p>}
        <ul className="adm-list">
          {found?.members.map((m) => (
            <li key={m.userId}>
              <button className={`adm-member${selected === m.userId ? " on" : ""}`} onClick={() => setSelected(selected === m.userId ? null : m.userId)}>
                <b>{m.name || "—"}</b> <span className="adm-sub">{m.email}</span>
                <span className="adm-badges">
                  {m.plan ? <i className="b-ok">{C.planLabels[m.plan]} · {A.expires} {fmtDate(m.expiresAt as number, C)}</i> : <i className="b-muted">{A.noPlan}</i>}
                  {m.indicatorBonus && <i>{A.indicatorOn}</i>}
                </span>
              </button>
              {selected === m.userId && <MemberDetail userId={m.userId} now={now} />}
            </li>
          ))}
        </ul>
        {found && found.pending.length > 0 && (
          <>
            <h3 className="adm-h3">{A.pendingTitle}</h3>
            <ul className="adm-list">
              {found.pending.map((p) => (
                <li key={p.id} className="adm-pending">
                  <span><b>{p.email}</b> · {C.planLabels[p.plan]} {p.days} {A.daysUnit} {p.note && <span className="adm-sub">· {p.note}</span>}</span>
                  {p.appliedAt === null && <button className="btn btn-ghost btn-sm adm-danger" onClick={() => void cancelPending({ id: p.id })}>{A.cancelPending}</button>}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function GrantForm({ defaultEmail }: { defaultEmail: string }) {
  const C = useContent();
  const A = C.admin;
  const grant = useMutation(api.adminMembers.grant);
  const [email, setEmail] = useState(defaultEmail);
  const [plan, setPlan] = useState<PlanId>("yearly");
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");
  const [indicator, setIndicator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await grant({ email, plan, days, note, indicatorBonus: indicator });
      setMsg(r === "granted" ? A.granted : A.pendingSaved);
      setEmail(""); setNote(""); setIndicator(false);
    } catch (err) {
      setMsg(adminError(err, C));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card adm-card">
      <h2>{A.grantTitle}</h2>
      <p className="adm-sub">{A.grantHint}</p>
      <form className="adm-form" onSubmit={(e) => void submit(e)}>
        <label>{A.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@gmail.com" /></label>
        <div className="adm-grid2">
          <label>{A.plan}
            <select value={plan} onChange={(e) => setPlan(e.target.value as PlanId)}>
              {GRANT_PLANS.map((p) => <option key={p} value={p}>{C.planLabels[p]}</option>)}
            </select>
          </label>
          <label>{A.days}
            <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))} />
            <span className="adm-presets">{DAY_PRESETS.map((d) => <button type="button" key={d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>{d}</button>)}</span>
          </label>
        </div>
        <label>{A.note}<input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></label>
        <label className="adm-check"><input type="checkbox" checked={indicator} onChange={(e) => setIndicator(e.target.checked)} /> {A.giveIndicator}</label>
        <div className="adm-row">
          <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>{busy ? A.saving : A.grantBtn}</button>
          {msg && <span className="adm-msg">{msg}</span>}
        </div>
      </form>
    </section>
  );
}

function MemberDetail({ userId, now }: { userId: Id<"users">; now: number }) {
  const C = useContent();
  const A = C.admin;
  const d = useQuery(api.adminMembers.memberDetail, { userId, now });
  const revoke = useMutation(api.adminMembers.revoke);
  const setIndicator = useMutation(api.adminMembers.setIndicator);
  const [msg, setMsg] = useState("");

  const act = async (fn: () => Promise<unknown>) => {
    setMsg("");
    try { await fn(); } catch (e) { setMsg(adminError(e, C)); }
  };

  if (d === undefined) return <p className="adm-sub">{A.loading}</p>;
  if (d === null) return null;
  return (
    <div className="adm-detail">
      <p>
        {d.displayName && <>{A.displayName}: <b>{d.displayName}</b> · </>}
        {A.lessonsDone}: <b>{d.lessonsDone}</b> · {A.quizzesPassed}: <b>{d.quizzesPassed}</b>
      </p>
      <h4>{A.history}</h4>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>{A.cols.date}</th><th>{A.cols.plan}</th><th>{A.cols.amount}</th><th>{A.cols.source}</th><th>{A.cols.status}</th><th>{A.cols.expires}</th><th>{A.cols.note}</th><th /></tr></thead>
          <tbody>
            {d.rows.map((r) => (
              <tr key={r.id} className={r.status !== "active" ? "dim" : ""}>
                <td>{fmtDate(r.createdAt, C)}</td>
                <td>{C.planLabels[r.plan]}{r.indicatorBonus && " 🎁"}</td>
                <td>{baht(r.amount)}{r.couponCode && <small> ({r.couponCode})</small>}</td>
                <td>{A.source[r.source]}</td>
                <td>{A.status[r.status]}</td>
                <td>{fmtDate(r.expiresAt, C)}</td>
                <td>{r.note}</td>
                <td className="adm-actions">
                  {r.status === "active" && (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => void act(() => setIndicator({ id: r.id, value: !r.indicatorBonus }))}>{r.indicatorBonus ? A.indicatorOff : A.giveIndicator}</button>
                      <button className="btn btn-ghost btn-sm adm-danger" onClick={() => {
                        if (!confirm(A.revokeConfirm)) return;
                        const reason = prompt(A.revokeReason) ?? "";
                        void act(() => revoke({ id: r.id, note: reason }));
                      }}>{A.revoke}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {msg && <p className="adm-msg">{msg}</p>}
    </div>
  );
}
