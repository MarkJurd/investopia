/* นโยบายความเป็นส่วนตัว (/privacy) — ข้อความที่ lib/content.ts → legal.privacy */
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.legal.privacy.title} — ${CONTENT.brand.name}`,
};

export default function PrivacyPage() {
  return <LegalPage C={CONTENT} doc={CONTENT.legal.privacy} />;
}
