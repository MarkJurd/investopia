/* หน้าคอร์สกราฟสาธารณะ — รายชื่อบทมาจาก Convex (แก้ที่ /admin) ข้อความจาก lib/content.ts */
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import CoursePublic from "@/components/CoursePublic";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = {
  title: `${CONTENT.courses.chart.title} — ${CONTENT.brand.name}`,
  description: CONTENT.courses.chart.desc,
};

export default function CourseChartPage() {
  return <ToolsShell C={CONTENT} chip={CONTENT.courses.page.chip}><CoursePublic /></ToolsShell>;
}
