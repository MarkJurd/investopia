/* คอนโซลแอดมิน (/admin) — แก้บทเรียน / สมาชิก / ยอดขาย / โค้ดส่วนลด · เห็นเฉพาะแอดมิน */
import { Suspense } from "react";
import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.admin.title} — ${CONTENT.brand.name}`,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <Suspense><AdminApp C={CONTENT} /></Suspense>;
}
