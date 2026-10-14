/* ห้องเรียนภาษาไทย (/learn) — ทุกหน้าในห้องเรียนแสดงผ่าน LearnApp ตัวเดียว (ไม่ต้องโหลดข้อมูลใหม่ตอนเปลี่ยนบท) */
import { Suspense } from "react";
import type { Metadata } from "next";
import LearnApp from "@/components/learn/LearnApp";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.learn.title} — ${CONTENT.brand.name}`,
  robots: { index: false },
};

export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <>
      <Suspense><LearnApp C={CONTENT} /></Suspense>
      {children}
    </>
  );
}
