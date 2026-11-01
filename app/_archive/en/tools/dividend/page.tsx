/* Dividend calculator (English) — text in lib/content.en.ts (dividend), numbers in lib/yields.ts */
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import DividendCalculator from "@/components/tools/DividendCalculator";
import { CONTENT_EN } from "@/lib/content.en";

export const metadata: Metadata = {
  title: `${CONTENT_EN.dividend.metaTitle} — ${CONTENT_EN.brand.name}`,
  description: CONTENT_EN.dividend.metaDesc,
  alternates: { languages: { th: "/tools/dividend", en: "/en/tools/dividend" } },
};

export default function DividendPageEn() {
  return <ToolsShell C={CONTENT_EN} path="/tools/dividend"><DividendCalculator /></ToolsShell>;
}
