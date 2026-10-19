"use client";

/* หน้าคอร์สกราฟ (/learn/course-chart): รายการโมดูลทั้งหมดของคอร์ส */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { countable, learnPath, moduleStepId, type Overview, type Step } from "@/components/learn/steps";

export default function CourseView({ data, steps }: { data: Overview; steps: Step[] }) {
  const C = useContent();
  const L = C.learn;
  const counted = countable(steps);
  return (
    <div className="learn-modpage">
      <Link href={learnPath(C)} className="back-link">{L.backToCourses}</Link>
      <h1 className="learn-h1">{L.chartCourse}</h1>
      <p className="learn-meta">{L.chartCourseSub}</p>
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
    </div>
  );
}
