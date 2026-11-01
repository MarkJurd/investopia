/* Tools hub (English): stock search + Watchlist + dividend calculator link · text in lib/content.en.ts (tools) */
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import { ToolsHub } from "@/components/tools/ToolsPages";
import { CONTENT_EN } from "@/lib/content.en";

export const metadata: Metadata = {
  title: `${CONTENT_EN.tools.metaTitle} — ${CONTENT_EN.brand.name}`,
  description: CONTENT_EN.tools.metaDesc,
  alternates: { languages: { th: "/tools", en: "/en/tools" } },
};

export default function ToolsPageEn() {
  return <ToolsShell C={CONTENT_EN} path="/tools"><ToolsHub /></ToolsShell>;
}
