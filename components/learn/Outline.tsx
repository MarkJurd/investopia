"use client";

/* สารบัญด้านข้าง (ทุกโมดูล ✓ ที่เรียนจบ) + ปุ่มก่อนหน้า/ถัดไป — ใช้ทั้งหน้าบทเรียนและหน้าแบบทดสอบ */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { learnPath, type Step } from "@/components/learn/steps";

export function Outline({ steps, current }: { steps: Step[]; current: Step }) {
  const C = useContent();
  const L = C.learn;
  const modules = [...new Map(steps.map((s) => [s.module.id, s.module])).values()];
  return (
    <nav className="learn-outline card" aria-label={L.modulesTitle}>
      <Link href={learnPath(C)} className="lo-back">{L.backToClassroom}</Link>
      {modules.map((m) => {
        const own = steps.filter((s) => s.module.id === m.id);
        const done = own.filter((s) => s.done).length;
        return (
          <details key={m.id} open={m.id === current.module.id}>
            <summary>
              <span className="lo-tag">{m.tag}</span>
              <span className="lo-title">{m.title}</span>
              <span className="lo-count">{done}/{own.length}</span>
            </summary>
            <ol>
              {own.map((s) => (
                <li key={s.id}>
                  <Link href={learnPath(C, s.id)} className={`lo-step${s.id === current.id ? " on" : ""}${s.done ? " done" : ""}`}
                    aria-current={s.id === current.id ? "page" : undefined}>
                    <span className="lo-check" aria-hidden="true">{s.done ? "✓" : s.kind === "quiz" ? "?" : ""}</span>
                    <span className="lo-label">{s.kind === "lesson" ? s.lesson.title : L.quizTitle}</span>
                    {s.kind === "lesson" && !s.lesson.embedUrl && <span className="lo-soon">{L.comingSoon}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          </details>
        );
      })}
    </nav>
  );
}

export function StepNav({ steps, index }: { steps: Step[]; index: number }) {
  const C = useContent();
  const prev = steps[index - 1];
  const next = steps[index + 1];
  return (
    <div className="learn-stepnav">
      {prev ? <Link href={learnPath(C, prev.id)} className="btn btn-ghost">{C.learn.prev}</Link> : <span />}
      {next ? <Link href={learnPath(C, next.id)} className="btn btn-primary">{C.learn.next}</Link>
            : <Link href={learnPath(C)} className="btn btn-primary">{C.learn.backToClassroom}</Link>}
    </div>
  );
}
