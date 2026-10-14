"use client";

/* แบบทดสอบท้ายโมดูล — ตรวจคำตอบที่เซิร์ฟเวอร์ แล้วค่อยแสดงเฉลย + คำอธิบาย */
import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { Outline, StepNav } from "@/components/learn/Outline";
import type { Step } from "@/components/learn/steps";

type Result = FunctionReturnType<typeof api.learn.submitQuiz>;

export default function QuizView({ steps, index, passPercent }: { steps: Step[]; index: number; passPercent: number }) {
  const C = useContent();
  const L = C.learn;
  const step = steps[index] as Extract<Step, { kind: "quiz" }>;
  const { module: mod } = step;
  const submitQuiz = useMutation(api.learn.submitQuiz);
  const [answers, setAnswers] = useState<(number | null)[]>(() => mod.quiz.map(() => null));
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const complete = answers.every((a) => a !== null);

  const submit = async () => {
    if (!complete) { setError(L.answerAll); return; }
    setBusy(true);
    setError(null);
    try {
      setResult(await submitQuiz({ moduleId: mod.id, lang: C.locale.code === "en" ? "en" : "th", answers: answers as number[] }));
    } catch {
      setError(L.error);
    } finally {
      setBusy(false);
    }
  };

  const retake = () => {
    setAnswers(mod.quiz.map(() => null));
    setResult(null);
    setError(null);
  };

  return (
    <div className="learn-grid">
      <article className="learn-content">
        <p className="learn-kicker">{mod.tag} · {mod.title}</p>
        <h1 className="learn-h1">{L.quizTitle}</h1>
        <p className="learn-meta">
          {L.quizIntro.replace("{pass}", String(passPercent))}
          {step.result && <> · {L.bestScore} {step.result.bestCorrect}/{step.result.total}{step.result.passed && <> · <b className="ok-text">{L.passed}</b></>}</>}
        </p>

        {result && (
          <div className={`quiz-result ${result.passed ? "ok" : ""}`} role="status">
            <b>{L.scoreBefore} {result.correct}/{result.total} {L.scoreAfter} — {result.passed ? L.passedMsg : L.failedMsg}</b>
          </div>
        )}

        <ol className="quiz-list">
          {mod.quiz.map((q, qi) => {
            const r = result?.results[qi];
            return (
              <li key={qi} className="quiz-q card">
                <fieldset disabled={!!result || busy}>
                  <legend>{qi + 1}. {q.q}</legend>
                  {q.choices.map((choice, ci) => {
                    const state = r ? (ci === r.answer ? " right" : ci === answers[qi] ? " wrong" : "") : "";
                    return (
                      <label key={ci} className={`quiz-choice${answers[qi] === ci ? " sel" : ""}${state}`}>
                        <input type="radio" name={`q${qi}`} checked={answers[qi] === ci}
                          onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? ci : v)))} />
                        <span>{choice}</span>
                      </label>
                    );
                  })}
                </fieldset>
                {r && (
                  <p className={`quiz-explain ${r.correct ? "ok" : ""}`}>
                    <b>{r.correct ? L.correct : `${L.wrongBefore} “${q.choices[r.answer]}”`}</b> {r.explain}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="learn-done">
          {result
            ? <button className="btn btn-ghost" onClick={retake}>{L.retake}</button>
            : <button className="btn btn-primary" disabled={busy} onClick={() => void submit()}>{L.submit}</button>}
          {error && <span className="learn-error" role="alert">{error}</span>}
        </div>

        <section className="learn-notes card">
          <h2>{L.practiceTitle}</h2>
          <p>{mod.practice}</p>
        </section>

        <StepNav steps={steps} index={index} />
      </article>
      <Outline steps={steps} current={step} />
    </div>
  );
}
