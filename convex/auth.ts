import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { applyPendingGrants } from "./adminMembers";

// ล็อกอินด้วย Google อย่างเดียว — ต้องตั้ง AUTH_GOOGLE_ID และ AUTH_GOOGLE_SECRET บน Convex
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    // ล็อกอินทุกครั้ง: ถ้าแอดมินให้สิทธิ์ไว้กับอีเมลนี้ (ลูกค้าเก่า) → เปิดใช้สิทธิ์
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      await applyPendingGrants(ctx as unknown as MutationCtx, userId as Id<"users">);
    },
  },
});
