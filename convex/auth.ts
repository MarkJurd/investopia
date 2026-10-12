import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

// ล็อกอินด้วย Google อย่างเดียว — ต้องตั้ง AUTH_GOOGLE_ID และ AUTH_GOOGLE_SECRET บน Convex
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
});
