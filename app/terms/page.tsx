/* เงื่อนไขการใช้งานและการคืนเงิน (/terms) — ข้อความที่ lib/content.ts → legal.terms */
import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.legal.terms.title} — ${CONTENT.brand.name}`,
};

export default function TermsPage() {
  return <LegalPage C={CONTENT} doc={CONTENT.legal.terms} />;
}
