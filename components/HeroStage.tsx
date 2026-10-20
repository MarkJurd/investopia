/* รูปผู้สอนใน Hero: รูปตัดพื้นหลังเต็มตัว + ป้ายคำจุดเด่น (2 การ์ดล่างบังขอบรูปที่ถูกตัด) + แสงเหลืองวาบครั้งเดียว
 * แอนิเมชันเป็น CSS ล้วน (app/globals.css → .hstage) · ข้อความ/ป้ายมาจาก content.ts → hero */
import type { ReactNode } from "react";
import type { Content } from "@/components/ContentContext";

const ICONS: Record<string, ReactNode> = {
  steps: <><path d="M3 20h5v-5h5v-5h5V5h3" /><path d="M3 20h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  bulb: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z" />,
  abc: <><path d="M4 17l3-9 3 9M5 14h4M13 8h3a2 2 0 0 1 0 4h-3zm0 4h3.5a2.5 2.5 0 0 1 0 5H13z" /><path d="M3 21L21 3" stroke="#DC2626" /></>,
};

function Badge({ cls, icon, text }: { cls: string; icon: string; text: string }) {
  return (
    <div className={cls}>
      <i aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ICONS[icon]}</svg>
      </i>
      <b>{text.split("\n").map((t, i) => <span key={i}>{t}</span>)}</b>
    </div>
  );
}

export default function HeroStage({ H }: { H: Content["hero"] }) {
  const b = H.badges;
  return (
    <div className="hstage">
      <span className="hglow" aria-hidden="true" />
      <span className="hpanel" aria-hidden="true" />
      {b.slice(0, 4).map((x, i) => <Badge key={x.text} cls={`bchip c${i + 1}`} {...x} />)}
      <img className="hppl" src={H.photo} alt="" />
      {b.slice(4, 6).map((x, i) => <Badge key={x.text} cls={`fcard ${i ? "br" : "bl"}`} {...x} />)}
      <span className="hfade" aria-hidden="true" />
    </div>
  );
}
