"use client";

/* หลักสูตร: แผงเลขโมดูล + วงแหวน (ค้างซ้าย) เปลี่ยนตามโมดูลที่อ่านอยู่กลางจอ */
import { useEffect, useRef, useState } from "react";
import { CONTENT } from "@/lib/content";

const RING = 597; // เส้นรอบวงของวงแหวน (2πr, r = 95)

export default function Curriculum() {
  const M = CONTENT.curriculum.modules;
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(+(en.target as HTMLElement).dataset.i!); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    listRef.current?.querySelectorAll(".mod").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="story">
      <div className="panel">
        <div className="ringwrap">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle className="rg-bg" cx="110" cy="110" r="95" />
            <circle className="rg-fg" cx="110" cy="110" r="95" style={{ strokeDashoffset: RING * (1 - (active + 1) / M.length) }} />
          </svg>
          <div className="num"><span key={active}>{active}</span></div>
        </div>
        <div className="p-tag">{M[active].tag}</div>
        <div className="p-title">{M[active].title}</div>
      </div>
      <div className="mods" ref={listRef}>
        {M.map((m, i) => (
          <div key={m.tag} className={`mod${m.core ? " core" : ""}${i === active ? " on" : ""}`} data-i={i}>
            <div className="tl-top">
              <span className="tl-tag">{m.tag}</span>
              {m.badge && <span className="tl-badge">{m.badge}</span>}
            </div>
            <div className="tl-title">{m.title}</div>
            {m.desc && <div className="tl-desc">{m.desc}</div>}
            <ul className="tl-lessons">
              {m.lessons.map((l) => <li key={l.b}><b>{l.b}</b> {l.t}</li>)}
            </ul>
            {m.exercise && <div className="tl-ex"><b>{m.exercise.b}</b>{m.exercise.t}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
