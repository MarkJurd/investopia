"use client";

/* หน้าแรก: เลือกคอร์ส (กราฟ / งบการเงิน) + ประโยคจุดขาย — ข้อความจาก lib/content.ts (courses) */
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";

export default function CourseCards() {
  const K = useContent().courses;
  const outline = useQuery(api.course.publicOutline);
  const hasFree = outline?.some((m) => m.lessons.some((l) => l.free)) ?? false;

  return (
    <section className="section section-soft" id="courses">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{K.eyebrow}</span><h2>{K.title}</h2><p>{K.sub}</p>
        </div>
        <div className="course-pick home">
          <Link href={K.chart.href} className="card course-card on reveal">
            <span className="cc-art"><img src="/courses/card-chart.jpg" alt="" /></span>
            <span className="cc-body">
              <span className="badge-soft">{K.level}</span>
              <b>{K.chart.title}</b>
              <span>{K.chart.desc}</span>
              {hasFree && <span className="free-pill">{K.hasFree}</span>}
              <span className="btn btn-primary btn-sm">{K.view}</span>
            </span>
          </Link>
          <div className="card course-card soon reveal" aria-disabled="true" style={{ "--d": "0.1s" } as React.CSSProperties}>
            <span className="cc-art"><img src="/courses/card-fs.jpg" alt="" /></span>
            <span className="cc-body">
              <span className="badge-soft">{K.level}</span>
              <b>{K.fs.title}</b>
              <span>{K.fs.desc}</span>
              <span className="soon-pill">{K.soon}</span>
            </span>
          </div>
        </div>
        <div className="usp reveal">
          <b>{K.usp}</b>
          <span>{K.uspSub}</span>
        </div>
      </div>
    </section>
  );
}
