/* ตัวคำนวณปันผล (ไทย) — ข้อความที่ lib/content.ts (dividend), ตัวเลขที่ lib/yields.ts */
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import DividendCalculator from "@/components/tools/DividendCalculator";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.dividend.metaTitle} — ${CONTENT.brand.name}`,
  description: CONTENT.dividend.metaDesc,
  alternates: { languages: { th: "/tools/dividend", en: "/en/tools/dividend" } },
};

export default function DividendPage() {
  return <ToolsShell C={CONTENT} path="/tools/dividend"><DividendCalculator /></ToolsShell>;
}
