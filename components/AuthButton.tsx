"use client";

/* ปุ่มบนเมนู: ยังไม่ล็อกอิน = "เข้าสู่ระบบด้วย Google"
 * ล็อกอินแล้ว = รูปโปรไฟล์ (กดแล้วเปิดเมนูเล็ก: ชื่อ, ป้ายสมาชิก, ออกจากระบบ) — ไม่กินที่บนแถบเมนู */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { learnPath } from "@/components/learn/steps";
import { communityPath } from "@/components/community/helpers";

function UserMenu() {
  const CONTENT = useContent();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me);
  const member = useQuery(api.payments.myMembership);
  const A = CONTENT.auth;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = me?.name ?? A.member;

  // คลิกนอกเมนู หรือกด Esc = ปิดเมนู
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button className="avatar-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label={name}>
        {me?.image
          ? <img src={me.image} alt="" className="user-avatar" referrerPolicy="no-referrer" />
          : <span className="user-avatar user-initial">{name.charAt(0)}</span>}
        {member && <span className="member-dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="user-pop" role="menu">
          <div className="up-name">{name}</div>
          {member && <span className="plan-badge">{CONTENT.planLabels[member.plan]}</span>}
          {member && <Link href={learnPath(CONTENT)} className="btn btn-primary btn-sm btn-block" role="menuitem" onClick={() => setOpen(false)}>{A.classroom}</Link>}
          {member && <Link href={communityPath(CONTENT)} className="btn btn-ghost btn-sm btn-block" role="menuitem" onClick={() => setOpen(false)}>{A.community}</Link>}
          <button className="btn btn-ghost btn-sm btn-block" role="menuitem" onClick={() => void signOut()}>{A.signOut}</button>
        </div>
      )}
    </div>
  );
}

export default function AuthButton() {
  const CONTENT = useContent();
  const { signIn } = useAuthActions();
  return (
    <>
      <AuthLoading><span className="auth-wait" aria-hidden="true" /></AuthLoading>
      <Unauthenticated>
        <button className="btn btn-ghost auth-btn" onClick={() => void signIn("google", { redirectTo: CONTENT.locale.base })} aria-label={CONTENT.auth.signIn}>
          <span className="g-logo" aria-hidden="true">G</span>
          <span className="lbl-long">{CONTENT.auth.signIn}</span><span className="lbl-short">{CONTENT.auth.signInShort}</span>
        </button>
      </Unauthenticated>
      <Authenticated><UserMenu /></Authenticated>
    </>
  );
}
