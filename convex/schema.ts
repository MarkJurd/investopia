import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";

// ตารางของระบบล็อกอิน (users, sessions, accounts ฯลฯ) มาจาก Convex Auth
// ตารางของเว็บเอง (สมาชิก/แพ็กเกจ, ความคืบหน้า, Q&A) จะเพิ่มในเฟสถัดไป
export default defineSchema({
  ...authTables,
});
