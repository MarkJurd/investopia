"use client";

/* บรรยากาศการเรียนจริง (ใต้ Hero): ภาพกราฟค้างซ้าย ข้อความ 5 ขั้นเลื่อนขวา
 * ข้อความจาก content.ts → teach · ภาพใน public/teach/ (step1–5 กราฟ, me1–5 หน้าผู้สอนสลับเอง)
 * ผู้เรียน: รูปจริงถ้ามี photo ไม่งั้นตัวอักษรย่อ · ช่องผู้เรียนเปลี่ยนตาม steps[].student
 * prefers-reduced-motion = ไม่สลับหน้าผู้สอน */
import { useEffect, useRef, useState } from "react";
import { useContent } from "@/components/ContentContext";

const ME = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `/teach/me${n}.webp`);
const chart = (i: number) => `/teach/step${i + 1}.webp`;

export default function TeachSection() {
  const T = useContent().teach;
  const [step, setStep] = useState(0);
  const [me, setMe] = useState(0);
  const steps = useRef<(HTMLDivElement | null)[]>([]);
  const who = T.steps[step].student;

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setStep(steps.current.indexOf(e.target as HTMLDivElement)); }),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    steps.current.forEach((el) => el && io.observe(el));
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = still ? 0 : window.setInterval(() => setMe((k) => (k + 1) % ME.length), 3200);
    return () => { io.disconnect(); clearInterval(t); };
  }, []);

  const teacher = (
    <div className="teach-pic">
      {ME.map((src, i) => <img key={src} src={src} className={i === me ? "on" : ""} alt={i === 0 ? T.teacherLabel : ""} aria-hidden={i === 0 ? undefined : true} />)}
      <span className="teach-chip">{T.teacherLabel}</span>
    </div>
  );
  const student = (k: number) => {
    const s = T.students[k];
    return (
      <div className={`teach-pic${s.photo ? "" : " teach-ava"}`}>
        {s.photo ? <img src={s.photo} className="on" alt={s.name} loading="lazy" /> : <b>{s.initial}</b>}
        <span className="teach-chip">{s.label}</span>
      </div>
    );
  };

  return (
    <section className="teach" id="teach">
      <div className="container">
        <div className="teach-head">
          <span className="eyebrow">{T.eyebrow}</span>
          <h2>{T.title}<br /><span className="blue">{T.titleAccent}</span></h2>
        </div>

        <div className="teach-split">
          <div className="teach-stage">
            <div className="teach-sc">
              <div className="teach-pic teach-chart">
                {T.steps.map((s, i) => <img key={i} src={chart(i)} className={i === step ? "on" : ""} alt="" loading="lazy" />)}
              </div>
              <div className="teach-people">
                <div className="teach-swap">
                  {T.students.map((s, k) => <div key={s.initial} className={k === who ? "on" : ""}>{student(k)}</div>)}
                </div>
                {teacher}
              </div>
            </div>
          </div>
          <div>
            <div className="teach-people-m">{teacher}</div>
            {T.steps.map((s, i) => (
              <div key={i} ref={(el) => { steps.current[i] = el; }} className={`teach-step${i === step ? " on" : ""}`}>
                <div className="teach-m">
                  <img src={chart(i)} alt="" loading="lazy" />
                  <span className="teach-chip">{T.students[s.student].label}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                {s.quote && <blockquote className="teach-say">{s.quote}<cite>— {T.students[s.student].name}</cite></blockquote>}
              </div>
            ))}
          </div>
        </div>
        <p className="teach-note">{T.note}</p>

        <div className="teach-cta">
          <h2>{T.ctaTitle}</h2>
          <p>{T.ctaText}</p>
          <div className="teach-btns">
            <a className="btn btn-line btn-lg" href={T.lineHref} target="_blank" rel="noopener noreferrer">{T.ctaLine}</a>
            <a className="btn btn-ghost btn-lg" href="#pricing">{T.ctaPricing}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
