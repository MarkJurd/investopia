"use client";

/* ส่วนผู้สอน: รูปตัดพื้นหลังเด้งขึ้นมาตอนเลื่อนมาถึง + ข้อความแนะนำตัวพิมพ์ทีละตัวอักษร
 * ถ้าผู้ใช้เปิด "ลดการเคลื่อนไหว" จะแสดงทั้งหมดทันที */
import { useEffect, useRef, useState } from "react";
import { useContent } from "@/components/ContentContext";

const STEP_MS = 28;      // พิมพ์ทุกกี่ ms
const CHARS_PER_STEP = 3;

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
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setCount(ins.bio.length), 0);
      return () => clearTimeout(t);
    }
    // เริ่มพิมพ์หลังรูปเด้งขึ้นมานิดหนึ่ง
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
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
    <div className="instructor ins-pop" ref={rootRef}>
      <div className={`ins-photo${shown ? " on" : ""}`}>
        <span className="ins-disc" aria-hidden="true" />
        {ins.photo
          ? <img src={ins.photo} alt={ins.name} />
          : <span className="avatar">{ins.initial}</span>}
      </div>
      <div>
        <h3 style={{ fontSize: 22, marginBottom: 4 }}>{ins.name}</h3>
        <p style={{ color: "var(--blue)", fontWeight: 600, marginBottom: 14 }}>{ins.role}</p>
        <p className="sr-only">{ins.bio}</p>
        <p className="ins-bio" aria-hidden="true">
          {ins.bio.slice(0, count)}
          {typing && <span className="ins-caret" />}
          {/* จองความสูงไว้ล่วงหน้า กันหน้ากระโดดระหว่างพิมพ์ */}
          <span className="ins-ghost">{ins.bio.slice(count)}</span>
        </p>
        <a href="#pricing" className="btn btn-primary">{ins.cta}</a>
      </div>
    </div>
  );
}
