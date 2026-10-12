"use client";

/* ปุ่มบนเมนู: ยังไม่ล็อกอิน = "เข้าสู่ระบบด้วย Google" / ล็อกอินแล้ว = รูป + ชื่อ + ออกจากระบบ */
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CONTENT } from "@/lib/content";

function UserMenu() {
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me);
  const member = useQuery(api.payments.myMembership);
  const A = CONTENT.auth;
  return (
    <div className="user-menu">
      {me?.image && <img src={me.image} alt="" className="user-avatar" referrerPolicy="no-referrer" />}
      <span className="user-name">{me?.name ?? A.member}</span>
      {member && <span className="plan-badge">{CONTENT.planLabels[member.plan]}</span>}
      <button className="btn btn-ghost btn-sm" onClick={() => void signOut()}>{A.signOut}</button>
    </div>
  );
}

export default function AuthButton() {
  const { signIn } = useAuthActions();
  return (
    <>
      <AuthLoading><span className="auth-wait" aria-hidden="true" /></AuthLoading>
      <Unauthenticated>
        <button className="btn btn-ghost auth-btn" onClick={() => void signIn("google")} aria-label={CONTENT.auth.signIn}>
          <span className="g-logo" aria-hidden="true">G</span>
          <span className="lbl-long">{CONTENT.auth.signIn}</span><span className="lbl-short">{CONTENT.auth.signInShort}</span>
        </button>
      </Unauthenticated>
      <Authenticated><UserMenu /></Authenticated>
    </>
  );
}
