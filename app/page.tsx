/* หน้าแรกภาษาไทย (/) — แก้ข้อความที่ lib/content.ts */
import HomePage from "@/components/HomePage";
import type { Metadata } from "next";
import { CONTENT } from "@/lib/content";

export const metadata: Metadata = { alternates: { languages: { th: "/", en: "/en" } } };

export default function Home() {
  return <HomePage C={CONTENT} />;
}
