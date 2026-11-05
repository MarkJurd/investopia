"use client";

/* ปุ่มค้างล่างจอ (เฉพาะมือถือ — คุมใน globals.css): โผล่เมื่อเลื่อนพ้น Hero · นักเรียนไม่เห็น */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { useStudent } from "@/components/useStudent";
import { learnPath } from "@/components/learn/steps";

export default function StickyCta() {
  const C = useContent();
  const { isStudent } = useStudent();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (isStudent) return null;
  return (
    <div className={`sticky-cta${on ? " on" : ""}`}>
      <Link href={learnPath(C, C.hero.freeLessonId || undefined)} className="btn btn-free">{C.hero.ctaFree}</Link>
      <a href="#pricing">{C.stickyCta.pricing}</a>
    </div>
  );
}
