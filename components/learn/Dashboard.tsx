"use client";

/* หน้าแรกของห้องเรียน: วันหมดอายุ · ความคืบหน้า % · เรียนต่อจากที่ค้าง · รายการโมดูล */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { countable, learnPath, moduleStepId, pricingPath, type Overview, type Step } from "@/components/learn/steps";

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
  const counted = countable(steps);
  const doneCount = counted.filter((s) => s.done).length;
  const percent = counted.length ? Math.round((doneCount / counted.length) * 100) : 0;
  const next = counted.find((s) => !s.done);
  const newLessons = steps.filter((s) => s.kind === "lesson" && s.lesson.isNew && !s.lesson.locked);
  const mem = data.membership;   // null = ทดลองเรียนฟรี
  const daysLeft = mem ? Math.ceil((mem.expiresAt - now) / DAY) : Infinity;
  const until = mem ? new Date(mem.expiresAt).toLocaleDateString(C.locale.dateLocale, { day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <div className="learn-dash">
      <div className="dash-head">
        <div>
          <h1 className="learn-h1">{L.welcome}</h1>
          <p className="learn-meta">
            {mem ? <><span className="plan-badge">{C.planLabels[mem.plan]}</span> {L.validUntil} {until}</> : <span className="plan-badge">{L.previewBadge}</span>}
          </p>
        </div>
      </div>

      {!mem && (
        <div className="renew-bar" role="status">
          <span>{L.previewText}</span>
          <a href={pricingPath(C)} className="btn btn-primary btn-sm">{L.seePlans}</a>
        </div>
      )}

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
          <b className="pc-steps">{doneCount} / {counted.length} {L.stepsUnit}</b>
          <div className="pc-bar"><i style={{ width: `${percent}%` }} /></div>
          {next ? (
            <Link href={learnPath(C, next.id)} className="btn btn-primary">
              {doneCount === 0 ? L.startBtn : L.continueBtn}: {next.kind === "lesson" ? next.lesson.title : `${next.module.tag} · ${L.quizTitle}`}
            </Link>
          ) : counted.length === 0 ? (
            <p>{L.rollingNote}</p>
          ) : (
            <p><b>{L.allDoneTitle}</b> {L.allDoneText} {L.rollingNote}</p>
          )}
        </div>
      </section>

      {newLessons.length > 0 && (
        <section className="new-lessons card">
          <h2 className="dash-h2">{L.newLessonsTitle}</h2>
          <ul>
            {newLessons.map((s) => s.kind === "lesson" && (
              <li key={s.id}>
                <Link href={learnPath(C, s.id)}><span className="new-badge sm">{L.newBadge}</span> {s.lesson.title} <i>· {s.module.tag}</i></Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="dash-grid">
        <section>
          <h2 className="dash-h2">{L.coursesTitle}</h2>
          <div className="course-pick">
            <a href="#chart-modules" className="card course-card on"><b>{L.chartCourse}</b><span>{L.chartCourseSub}</span></a>
            <div className="card course-card soon" aria-disabled="true"><b>{L.fsCourse}</b><span>{L.fsCourseSub}</span></div>
          </div>
          <h2 className="dash-h2" id="chart-modules">{L.modulesTitle}</h2>
          <div className="mod-list">
            {data.modules.map((m, n) => {
              const own = counted.filter((s) => s.module.id === m.id);
              const done = own.filter((s) => s.done).length;
              const total = m.lessons.length;
              const open = m.lessons.filter((l) => !l.locked && l.hasVideo).length;
              return (
                <Link key={m.id} href={learnPath(C, moduleStepId(m.id))} className={`mod-card card${own.length > 0 && done === own.length ? " complete" : ""}`}>
                  <span className="mc-num" aria-hidden="true">{n + 1}</span>
                  <span className="mc-body">
                    <span className="mc-tag">{m.tag}</span>
                    <b className="mc-title">{m.title}</b>
                    <span className="mc-meta">
                      {total} {L.lessonsUnit} · {open > 0 ? `${L.openLessons} ${open}` : L.comingSoon}
                    </span>
                    {own.length > 0 && <span className="pc-bar sm"><i style={{ width: `${Math.round((done / own.length) * 100)}%` }} /></span>}
                  </span>
                  <span className="mc-go" aria-hidden="true">›</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
