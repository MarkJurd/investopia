"use client";

/* หน้าแรกของห้องเรียน: วันหมดอายุ · ความคืบหน้า % · เรียนต่อจากที่ค้าง · รายการโมดูล */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { COURSE_CHART_STEP, countable, learnPath, pricingPath, type Overview, type Step } from "@/components/learn/steps";

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
  const freeCount = data.modules.reduce((n, m) => n + m.lessons.filter((l) => l.free).length, 0);
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
            <Link href={learnPath(C, COURSE_CHART_STEP)} className="card course-card on">
              <span className="cc-art"><img src="/courses/card-chart.jpg" alt="" /></span>
              <span className="cc-body">
                <span className="badge-soft">{L.courseLevel}</span>
                <b>{L.chartCourse}</b>
                <span>{L.chartCourseSub}</span>
                {freeCount > 0 && <span className="free-pill">{L.courseHasFree}</span>}
                <span className="btn btn-primary btn-sm">{L.courseEnter}</span>
              </span>
            </Link>
            <div className="card course-card soon" aria-disabled="true">
              <span className="cc-art"><img src="/courses/card-fs.jpg" alt="" /></span>
              <span className="cc-body">
                <span className="badge-soft">{L.courseLevel}</span>
                <b>{L.fsCourse}</b>
                <span>{L.fsCourseSub}</span>
                <span className="soon-pill">{L.comingSoon}</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
