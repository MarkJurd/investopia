"use client";

/* รีวิวจากผู้เรียน: การ์ด 3 ใบ + ภาพวาดประกอบ (ไม่ใช่รูปจริง) · รีวิวยาวย่อไว้ 7 บรรทัด กด "อ่านต่อ" ได้
 * ข้อความอยู่ที่ content.ts → reviews */
import { useState, type ReactNode } from "react";
import { useContent } from "@/components/ContentContext";

const FACE = "M8 66c1-13 10-19 24-19s23 6 24 19z";
const AVATARS: Record<string, ReactNode> = {
  // ผมบ็อบน้ำตาล แว่นกรอบหนา เสื้อฮู้ดเทา
  net: <>
    <path d={FACE} fill="#64748B" /><path d="M24 47c2 5 14 5 16 0" fill="none" />
    <path d="M14 40c-2-16 5-27 18-27s20 11 18 27c-2 3-5 4-7 3V27H21v16c-2 1-5 0-7-3z" fill="#8B4A2B" />
    <rect x="27" y="38" width="10" height="9" fill="#F2C9A8" />
    <ellipse cx="32" cy="31" rx="11" ry="12.5" fill="#F7D6BC" />
    <path d="M20 27c4-7 15-9 23-3-6-1-14 0-23 3z" fill="#8B4A2B" />
    <rect x="21.5" y="27" width="9" height="7" rx="2" fill="#fff" fillOpacity=".4" /><rect x="33.5" y="27" width="9" height="7" rx="2" fill="#fff" fillOpacity=".4" /><path d="M30.5 30h3" fill="none" />
    <path d="M27 37c3 3 7 3 10 0" fill="#fff" />
  </>,
  // ผมสั้นดำชี้ เสื้อกล้ามเขียว
  fang: <>
    <path d={FACE} fill="#F2C9A8" /><path d="M18 66V52h7c2 5 12 5 14 0h7v14z" fill="#4D6B3C" />
    <rect x="27" y="38" width="10" height="10" fill="#F2C9A8" />
    <ellipse cx="32" cy="31" rx="11" ry="12.5" fill="#F7D6BC" />
    <path d="M20 31c-2-11 4-17 12-17 9 0 14 6 12 17-1-6-4-9-7-9-3 2-9 2-12 0-3 0-4 3-5 9z" fill="#111827" />
    <path d="M33 15c1-5 5-7 7-6-2 1-3 3-3 6" fill="#111827" />
    <circle cx="27.5" cy="31" r="1.3" fill="#0F172A" /><circle cx="36.5" cy="31" r="1.3" fill="#0F172A" />
    <path d="M28 37c2.5 2 5.5 2 8 0" fill="#fff" />
  </>,
  // ผู้ชายทั่วไป (ไม่ได้วาดจากหน้าจริง)
  mike: <>
    <path d={FACE} fill="#1D4ED8" /><path d="M26 47l6 7 6-7" fill="#fff" />
    <rect x="27" y="38" width="10" height="9" fill="#E8B993" />
    <ellipse cx="32" cy="31" rx="11" ry="12.5" fill="#F0C7A2" />
    <path d="M20.5 29c-1-10 5-15 11.5-15s13 4 11.5 15c-1-4-3-6-5-7-5 2-12 2-15 0-2 1-2.5 3-3 7z" fill="#3F2A1D" />
    <circle cx="27.5" cy="31" r="1.3" fill="#0F172A" /><circle cx="36.5" cy="31" r="1.3" fill="#0F172A" />
    <path d="M28 37c2.5 2 5.5 2 8 0" fill="none" />
  </>,
};

const LONG = 220;   // ตัวอักษร — ยาวกว่านี้ถึงจะมีปุ่ม "อ่านต่อ"

function Card({ name, avatar, text, role, more, less }: { name: string; avatar: string; text: string; role: string; more: string; less: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > LONG;
  return (
    <article className="card rcard reveal">
      <div className="stars" aria-label="5/5">★★★★★</div>
      <q className={long && !open ? "clamp" : undefined}>{text}</q>
      {long && <button type="button" className="rmore" onClick={() => setOpen(!open)}>{open ? less : more}</button>}
      <div className="rhead">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <defs><clipPath id={`av-${avatar}`}><circle cx="32" cy="32" r="32" /></clipPath></defs>
          <circle cx="32" cy="32" r="32" fill="#DBEAFE" />
          <g clipPath={`url(#av-${avatar})`} stroke="#0F172A" strokeWidth="1.6" strokeLinejoin="round">{AVATARS[avatar]}</g>
        </svg>
        <div><b>{name}</b><small>{role}</small></div>
      </div>
    </article>
  );
}

export default function Reviews() {
  const R = useContent().reviews;
  return (
    <section className="section section-soft" id="reviews">
      <div className="container">
        <div className="section-head"><span className="eyebrow">{R.eyebrow}</span><h2>{R.title}</h2></div>
        <div className="rev-grid">
          {R.items.map((it) => <Card key={it.name} {...it} role={R.role} more={R.more} less={R.less} />)}
        </div>
      </div>
    </section>
  );
}
