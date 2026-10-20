/* /en/terms — text in lib/content.en.ts → legal.terms (the Thai version prevails) */
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTENT_EN } from "@/lib/content.en";

export const metadata: Metadata = {
  title: `${CONTENT_EN.legal.terms.title} — ${CONTENT_EN.brand.name}`,
  alternates: { languages: { th: "/terms", en: "/en/terms" } },
};

export default function TermsPageEn() {
  return <LegalPage C={CONTENT_EN} doc={CONTENT_EN.legal.terms} path="/terms" />;
}
