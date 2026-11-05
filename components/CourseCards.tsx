"use client";

/* หน้าแรก: สรุปลำดับการเรียนของคอร์สกราฟ + ลิงก์ไปหน้าคอร์ส — ข้อความจาก lib/content.ts (courses) */
import Link from "next/link";
import { useContent } from "@/components/ContentContext";

export default function CourseCards() {
  const K = useContent().courses;
  return (
    <section className="section" id="courses">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{K.eyebrow}</span><h2>{K.title}</h2><p>{K.sub}</p>
        </div>
        <ol className="home-steps">
          {K.homeSteps.map((s) => <li key={s.title}><b>{s.title}</b><span>{s.text}</span></li>)}
        </ol>
        <div className="home-steps-cta"><Link href={K.chart.href} className="btn btn-primary">{K.view}</Link></div>
      </div>
    </section>
  );
}
