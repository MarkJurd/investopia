import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isAdminUser } from "./admin";

// ข้อมูลผู้ใช้ที่ล็อกอินอยู่ (null = ยังไม่ล็อกอิน) — ใช้แสดงชื่อ/รูปบนเมนู
export const me = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({ name: v.union(v.string(), v.null()), image: v.union(v.string(), v.null()), admin: v.boolean() }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user === null) return null;
    return { name: user.name ?? null, image: user.image ?? null, admin: await isAdminUser(ctx, userId) };
  },
});
