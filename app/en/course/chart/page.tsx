/* Public chart course page (/en/course/chart) — lesson list comes from Convex (edited at /admin, in Thai) */
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import CoursePublic from "@/components/CoursePublic";
import { CONTENT_EN } from "@/lib/content.en";

export const metadata: Metadata = {
  title: `${CONTENT_EN.courses.chart.title} — ${CONTENT_EN.brand.name}`,
  description: CONTENT_EN.courses.chart.desc,
  alternates: { languages: { th: "/course/chart", en: "/en/course/chart" } },
};

export default function CourseChartPageEn() {
  return <ToolsShell C={CONTENT_EN} path="/course/chart" chip={CONTENT_EN.courses.page.chip}><CoursePublic /></ToolsShell>;
}
