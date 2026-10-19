"use client";

/* ส่วนผู้สอน: ฉากหลังกราฟิกน้ำเงิน + รูปตัดพื้นหลังเด้งขึ้นมาตอนเลื่อนมาถึง + ข้อความแนะนำตัวพิมพ์ทีละตัวอักษร
 * ถ้าผู้ใช้เปิด "ลดการเคลื่อนไหว" จะแสดงทั้งหมดทันที */
import { useEffect, useRef, useState } from "react";
import { useContent } from "@/components/ContentContext";

const STEP_MS = 28;      // พิมพ์ทุกกี่ ms
const CHARS_PER_STEP = 3;

/* กราฟแท่งเทียนประกอบฉากในวงกลมน้ำเงิน (ค่าคงที่ — ไม่ใช่ข้อมูลจริง) */
const CANDLES = (() => {
  let seed = 4;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let p = 560;
  const out: { x: number; hi: number; lo: number; top: number; h: number; up: boolean }[] = [];
  for (let i = 0; i < 26; i++) {
    const o = p;
    p = Math.max(160, Math.min(620, p + (rnd() - 0.62) * 70));
    out.push({ x: 40 + i * 28, hi: Math.min(o, p) - 14, lo: Math.max(o, p) + 14, top: Math.min(o, p), h: Math.abs(o - p) + 3, up: p < o });
  }
  return out;
})();

export default function InstructorIntro() {
  const ins = useContent().instructor;
  const rootRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setCount(ins.bio.length), 0);
      return () => clearTimeout(t);
    }
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {   // เริ่มพิมพ์หลังรูปเด้งขึ้นมานิดหนึ่ง
      timer = setInterval(() => {
        setCount((c) => {
          const n = Math.min(ins.bio.length, c + CHARS_PER_STEP);
          if (n >= ins.bio.length && timer) clearInterval(timer);
          return n;
        });
      }, STEP_MS);
    }, 500);
    return () => { clearTimeout(start); if (timer) clearInterval(timer); };
  }, [shown, ins.bio]);

  const typing = shown && count < ins.bio.length;

  return (
    <div className="ins2" ref={rootRef}>
      <div className="ins2-arc" aria-hidden="true">
        <svg viewBox="0 0 780 780" preserveAspectRatio="none">
          {CANDLES.map((c) => (
            <g key={c.x} stroke="#fff" strokeWidth="2">
              <line x1={c.x} x2={c.x} y1={c.hi} y2={c.lo} />
              <rect x={c.x - 8} y={c.top} width="16" height={c.h} rx="2" fill={c.up ? "#fff" : "none"} />
            </g>
          ))}
          <polyline fill="none" stroke="#FACC15" strokeWidth="4" points={CANDLES.map((c) => `${c.x},${c.top}`).join(" ")} />
        </svg>
      </div>
      <span className="ins2-ring" aria-hidden="true" />
      <span className="ins2-dots" aria-hidden="true" />
      <span className="ins2-wm" aria-hidden="true">INVESTOPIA</span>

      <div className="ins2-txt">
        <span className="eyebrow">{ins.eyebrow}</span>
        <h2>{ins.title.before}<br /><span>{ins.title.accent}</span> {ins.title.after}</h2>
        <div className="ins2-who"><i aria-hidden="true">▶</i><div><b>{ins.name}</b><small>{ins.role}</small></div></div>
        <p className="sr-only">{ins.bio}</p>
        <p className="ins2-bio" aria-hidden="true">
          {ins.bio.slice(0, count)}
          {typing && <span className="ins-caret" />}
          {/* จองความสูงไว้ล่วงหน้า กันหน้ากระโดดระหว่างพิมพ์ */}
          <span className="ins-ghost">{ins.bio.slice(count)}</span>
        </p>
        <a href="#pricing" className="btn btn-primary">{ins.cta}</a>
      </div>

      <div className={`ins2-photo${shown ? " on" : ""}`}>
        {ins.photo
          ? <img src={ins.photo} alt={ins.name} />
          : <span className="avatar">{ins.initial}</span>}
      </div>
      <div className="ins2-tag"><b aria-hidden="true">✓</b>{ins.tag}</div>
    </div>
  );
}
