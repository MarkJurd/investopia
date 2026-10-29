/* หน้าเครื่องมือ (ไทย): ค้นหุ้น + Watchlist + ลิงก์ตัวคำนวณปันผล · ข้อความที่ lib/content.ts (tools) */
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import { ToolsHub } from "@/components/tools/ToolsPages";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.tools.metaTitle} — ${CONTENT.brand.name}`,
  description: CONTENT.tools.metaDesc,
  alternates: { languages: { th: "/tools", en: "/en/tools" } },
};

export default function ToolsPage() {
  return <ToolsShell C={CONTENT} path="/tools"><ToolsHub /></ToolsShell>;
}
