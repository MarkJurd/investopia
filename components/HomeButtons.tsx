"use client";

/* ปุ่มหน้าแรกที่เปลี่ยนตามสถานะ: คนทั่วไป = คุยทาง LINE/ดูแพ็กเกจ · นักเรียน = เข้าห้องเรียน/คอมมูนิตี้ */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { useStudent } from "@/components/useStudent";
import { learnPath } from "@/components/learn/steps";
import { communityPath } from "@/components/community/helpers";

export function NavPrimary() {
  const C = useContent();
  const { isStudent } = useStudent();
  return isStudent
    ? <Link href={learnPath(C)} className="btn btn-primary">{C.nav.studentPrimary}</Link>
    : <a href="#pricing" className="btn btn-primary">{C.nav.primary}</a>;
}

export function HeroCta() {
  const C = useContent();
  const H = C.hero;
  const { isStudent } = useStudent();
  if (isStudent) {
    return (
      <div className="hero-cta">
        <Link href={learnPath(C)} className="btn btn-free btn-lg">▶ {H.ctaStudent}</Link>
        <Link href={communityPath(C)} className="btn btn-ghost btn-lg">{C.auth.community}</Link>
      </div>
    );
  }
  return (
    <div className="hero-cta">
      <a href={C.teach.lineHref} className="btn btn-line btn-lg" target="_blank" rel="noopener noreferrer">{H.ctaLine}</a>
      <a href="#pricing" className="btn btn-ghost btn-lg">{H.ctaPrimary}</a>
    </div>
  );
}
