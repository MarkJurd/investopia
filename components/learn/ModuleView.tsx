"use client";

/* หน้ารวมบทของโมดูลเดียว (/learn/module-<id>): แถวใหญ่ อ่านง่าย บอกสถานะแต่ละบท */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { COURSE_CHART_STEP, countable, isLocked, isSoon, learnPath, type Module, type Step } from "@/components/learn/steps";

export default function ModuleView({ module, steps }: { module: Module; steps: Step[] }) {
  const C = useContent();
  const L = C.learn;
  const own = steps.filter((s) => s.module.id === module.id);
  const counted = countable(own);
  const done = counted.filter((s) => s.done).length;
  const percent = counted.length ? Math.round((done / counted.length) * 100) : 0;
  let n = 0;

  return (
    <div className="learn-modpage">
      <Link href={learnPath(C, COURSE_CHART_STEP)} className="back-link">{L.backToCourse}</Link>
      <p className="learn-kicker">{module.tag}</p>
      <h1 className="learn-h1">{module.title}</h1>
      {counted.length > 0 && (
        <div className="mp-progress"><span className="pc-bar"><i style={{ width: `${percent}%` }} /></span><b>{done} / {counted.length} {L.stepsUnit}</b></div>
      )}
      <ol className="les-list">
        {own.map((s) => {
          const soon = isSoon(s), locked = isLocked(s);
          if (s.kind === "lesson") n++;
          const label = s.kind === "lesson" && s.lesson.paywalled ? `🔒 ${L.paywallBadge}` : locked ? `🔒 ${L.lockedBadge}` : soon ? L.comingSoon : s.done ? L.doneLabel : L.openNow;
          return (
            <li key={s.id}>
              <Link href={learnPath(C, s.id)} className={`les-row card${s.done ? " done" : ""}${soon ? " soon" : ""}`}>
                <span className="les-n" aria-hidden="true">{s.done ? "✓" : s.kind === "lesson" ? n : "?"}</span>
                <span className="les-title">
                  {s.kind === "lesson" ? s.lesson.title : L.quizTitle}
                  {s.kind === "lesson" && s.lesson.free && <span className="new-badge sm">{L.freeBadge}</span>}
                  {s.kind === "lesson" && s.lesson.isNew && !locked && <span className="new-badge sm">{L.newBadge}</span>}
                </span>
                <span className="les-status">{label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
