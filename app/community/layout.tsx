/* คอมมูนิตี้ภาษาไทย (/community) — ทุกหน้าแสดงผ่าน CommunityApp ตัวเดียว */
import { Suspense } from "react";
import type { Metadata } from "next";
import CommunityApp from "@/components/community/CommunityApp";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.community.title} — ${CONTENT.brand.name}`,
  robots: { index: false },
};

export default function CommunityLayout({ children }: LayoutProps<"/community">) {
  return (
    <>
      <Suspense><CommunityApp C={CONTENT} /></Suspense>
      {children}
    </>
  );
}
