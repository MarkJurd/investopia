"use client";

/* หน้าแรกของห้องเรียน: วันหมดอายุ · ความคืบหน้า % · เรียนต่อจากที่ค้าง · รายการโมดูล */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { learnPath, pricingPath, type Overview, type Step } from "@/components/learn/steps";

const DAY = 24 * 60 * 60 * 1000;
const WARN_DAYS = 7;   // เตือนต่ออายุเมื่อเหลือไม่เกินกี่วัน

function Ring({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r={r} className="ring-bg" />
      <circle cx="60" cy="60" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      <text x="60" y="60" className="ring-txt">{percent}%</text>
    </svg>
  );
}

export default function Dashboard({ data, steps, now }: { data: Overview; steps: Step[]; now: number }) {
  const C = useContent();
  const L = C.learn;
  const doneCount = steps.filter((s) => s.done).length;
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const next = steps.find((s) => !s.done);
  const daysLeft = Math.ceil((data.membership.expiresAt - now) / DAY);
  const until = new Date(data.membership.expiresAt).toLocaleDateString(C.locale.dateLocale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="learn-dash">
      <div className="dash-head">
        <div>
          <h1 className="learn-h1">{L.welcome}</h1>
          <p className="learn-meta">
            <span className="plan-badge">{C.planLabels[data.membership.plan]}</span> {L.validUntil} {until}
          </p>
        </div>
      </div>

      {daysLeft <= WARN_DAYS && (
        <div className="renew-bar" role="status">
          <span>{L.expiringBefore} <b>{daysLeft}</b> {L.expiringAfter}</span>
          <a href={pricingPath(C)} className="btn btn-primary btn-sm">{L.renew}</a>
        </div>
      )}

      <section className="progress-card card">
        <Ring percent={percent} />
        <div className="pc-body">
          <span className="pc-label">{L.progressLabel}</span>
          <b className="pc-steps">{doneCount} / {steps.length} {L.stepsUnit}</b>
          <div className="pc-bar"><i style={{ width: `${percent}%` }} /></div>
          {next ? (
            <Link href={learnPath(C, next.id)} className="btn btn-primary">
              {doneCount === 0 ? L.startBtn : L.continueBtn}: {next.kind === "lesson" ? next.lesson.title : `${next.module.tag} · ${L.quizTitle}`}
            </Link>
          ) : (
            <p><b>{L.allDoneTitle}</b> {L.allDoneText}</p>
          )}
        </div>
      </section>

      <div className="dash-grid">
        <section>
          <h2 className="dash-h2">{L.modulesTitle}</h2>
          <div className="mod-list">
            {data.modules.map((m) => {
              const own = steps.filter((s) => s.module.id === m.id);
              const done = own.filter((s) => s.done).length;
              const target = own.find((s) => !s.done) ?? own[0];
              const quiz = own.find((s) => s.kind === "quiz");
              return (
                <Link key={m.id} href={learnPath(C, target.id)} className={`mod-card card${done === own.length ? " complete" : ""}`}>
                  <span className="mc-tag">{m.tag}</span>
                  <b className="mc-title">{m.title}</b>
                  <span className="mc-meta">
                    {m.lessons.length} {L.lessonsUnit}
                    {quiz?.kind === "quiz" && quiz.result && <> · {L.bestScore} {quiz.result.bestCorrect}/{quiz.result.total}</>}
                    {quiz?.done && <> · <b className="ok-text">{L.passed}</b></>}
                  </span>
                  <span className="pc-bar sm"><i style={{ width: `${Math.round((done / own.length) * 100)}%` }} /></span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
