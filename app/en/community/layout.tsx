/* English community (/en/community) — every community page renders through one CommunityApp */
import { Suspense } from "react";
import type { Metadata } from "next";
import CommunityApp from "@/components/community/CommunityApp";
import { CONTENT_EN } from "@/lib/content.en";

export const metadata: Metadata = {
  title: `${CONTENT_EN.community.title} — ${CONTENT_EN.brand.name}`,
  robots: { index: false },
};

export default function CommunityLayoutEn({ children }: LayoutProps<"/en/community">) {
  return (
    <>
      <Suspense><CommunityApp C={CONTENT_EN} /></Suspense>
      {children}
    </>
  );
}
