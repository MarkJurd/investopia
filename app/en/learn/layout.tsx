/* English learn (/en/learn) — every page renders through one LearnApp */
import { Suspense } from "react";
import type { Metadata } from "next";
import LearnApp from "@/components/learn/LearnApp";
import { CONTENT_EN } from "@/lib/content.en";

export const metadata: Metadata = {
  title: `${CONTENT_EN.learn.title} — ${CONTENT_EN.brand.name}`,
  robots: { index: false },
};

export default function LearnLayoutEn({ children }: LayoutProps<"/en/learn">) {
  return (
    <>
      <Suspense><LearnApp C={CONTENT_EN} /></Suspense>
      {children}
    </>
  );
}
