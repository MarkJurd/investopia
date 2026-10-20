/* นโยบายความเป็นส่วนตัว (/privacy) — ข้อความที่ lib/content.ts → legal.privacy */
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.legal.privacy.title} — ${CONTENT.brand.name}`,
  alternates: { languages: { th: "/privacy", en: "/en/privacy" } },
};

export default function PrivacyPage() {
  return <LegalPage C={CONTENT} doc={CONTENT.legal.privacy} path="/privacy" />;
}
