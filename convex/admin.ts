/* แอดมิน = บัญชี Google ที่อยู่ใน env ADMIN_EMAILS (คั่นด้วยจุลภาค) และอีเมลผ่านการยืนยันจาก Google แล้ว
 * ตั้งค่า: npx convex env set ADMIN_EMAILS "a@gmail.com,b@gmail.com"  (ไม่เขียนอีเมลลงโค้ด/หน้าเว็บ) */
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function isAdminUser(ctx: QueryCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get("users", userId);
  const email = user?.email?.toLowerCase();
  return Boolean(email) && user?.emailVerificationTime !== undefined && adminEmails().includes(email as string);
}

/** รหัสผู้ใช้ของแอดมินทุกคน (ใช้ส่งแจ้งเตือนเมื่อมีโพสต์ใหม่) */
export async function adminUserIds(ctx: QueryCtx): Promise<Id<"users">[]> {
  const ids: Id<"users">[] = [];
  for (const email of adminEmails()) {
    const user = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).first();
    if (user && user.emailVerificationTime !== undefined) ids.push(user._id);
  }
  return ids;
}

/** ใช้ในฟังก์ชันของหน้า /admin — ไม่ใช่แอดมิน = ปฏิเสธ */
export async function requireAdmin(ctx: QueryCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (userId === null || !(await isAdminUser(ctx, userId))) throw new ConvexError("NOT_ADMIN");
  return userId;
}
