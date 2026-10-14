"use client";

/* หน้าบทเรียน: วิดีโอ + สรุป + ปุ่ม "เรียนจบบทนี้แล้ว" */
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { Outline, StepNav } from "@/components/learn/Outline";
import type { Step } from "@/components/learn/steps";

export default function LessonView({ steps, index }: { steps: Step[]; index: number }) {
  const C = useContent();
  const L = C.learn;
  const step = steps[index] as Extract<Step, { kind: "lesson" }>;
  const { lesson, module } = step;
  const setDone = useMutation(api.learn.setLessonDone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const toggle = async (done: boolean) => {
    setBusy(true);
    setError(false);
    try {
      await setDone({ lessonId: lesson.id, done });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="learn-grid">
      <article className="learn-content">
        <div className="learn-video">
          {lesson.embedUrl
            ? <iframe src={lesson.embedUrl} title={lesson.title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            : (
              <div className="lv-soon">
                <span className="lv-play" aria-hidden="true">▶</span>
                <b>{L.videoSoonTitle}</b>
                <p>{L.videoSoonText}</p>
              </div>
            )}
        </div>

        <p className="learn-kicker">{module.tag} · {module.title}</p>
        <h1 className="learn-h1">{lesson.title}</h1>
        {lesson.minutes > 0 && <p className="learn-meta">{lesson.minutes} {L.minutesUnit}</p>}

        <section className="learn-notes card">
          <h2>{L.notesTitle}</h2>
          <p>{lesson.notes}</p>
        </section>

        <div className="learn-done">
          {step.done ? (
            <>
              <span className="done-pill">{L.doneLabel}</span>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void toggle(false)}>{L.undoDone}</button>
            </>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={() => void toggle(true)}>{L.markDone}</button>
          )}
          {error && <span className="learn-error" role="alert">{L.error}</span>}
        </div>

        <StepNav steps={steps} index={index} />
      </article>
      <Outline steps={steps} current={step} />
    </div>
  );
}
