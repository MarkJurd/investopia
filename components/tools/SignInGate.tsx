"use client";

/* เครื่องมือ (/tools) ใช้ฟรีแต่ต้องล็อกอิน — ยังไม่ล็อกอินแสดงปุ่มเข้าสู่ระบบแทนเนื้อหา (server เช็กซ้ำทุกครั้ง) */
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useContent } from "@/components/ContentContext";

export default function SignInGate({ pathHere, children }: { pathHere: string; children: React.ReactNode }) {
  const C = useContent();
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <p className="learn-loading" role="status">{C.community.loading}</p>;
  if (!isAuthenticated) {
    return (
      <div className="learn-gate card">
        <h2>{C.tools.signInTitle}</h2>
        <p>{C.tools.signInText}</p>
        <button className="btn btn-primary" onClick={() => void signIn("google", { redirectTo: pathHere })}>
          <span className="g-logo" aria-hidden="true">G</span> {C.auth.signIn}
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
