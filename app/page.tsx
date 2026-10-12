/* หน้าแรกภาษาไทย (/) — แก้ข้อความที่ lib/content.ts */
import HomePage from "@/components/HomePage";
import { CONTENT } from "@/lib/content";

export default function Home() {
  return <HomePage C={CONTENT} />;
}
