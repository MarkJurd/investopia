/* /en/privacy — text in lib/content.en.ts → legal.privacy (the Thai version prevails) */
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTENT_EN } from "@/lib/content.en";

export const metadata: Metadata = {
  title: `${CONTENT_EN.legal.privacy.title} — ${CONTENT_EN.brand.name}`,
  alternates: { languages: { th: "/privacy", en: "/en/privacy" } },
};

export default function PrivacyPageEn() {
  return <LegalPage C={CONTENT_EN} doc={CONTENT_EN.legal.privacy} path="/privacy" />;
}
