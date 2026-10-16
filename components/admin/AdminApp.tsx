"use client";

/* คอนโซลแอดมิน (/admin) — เห็นเฉพาะบัญชีใน ADMIN_EMAILS
 * ทุกฟังก์ชันฝั่งเซิร์ฟเวอร์เช็กสิทธิ์แอดมินซ้ำเอง (convex/adminCourse.ts, convex/adminMembers.ts) — หน้านี้แค่เลือกว่าจะแสดงอะไร */
import Link from "next/link";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { ContentProvider, useContent, type Content } from "@/components/ContentContext";
import AuthButton from "@/components/AuthButton";
import CourseTab from "@/components/admin/CourseTab";
import MembersTab from "@/components/admin/MembersTab";
import SalesTab from "@/components/admin/SalesTab";
import CouponsTab from "@/components/admin/CouponsTab";

type Tab = "course" | "members" | "sales" | "coupons";
const TABS: Tab[] = ["course", "members", "sales", "coupons"];

function Body() {
  const C = useContent();
  const A = C.admin;
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const [tab, setTab] = useState<Tab>("course");

  if (isLoading || (isAuthenticated && me === undefined)) return <p className="learn-loading" role="status">{A.loading}</p>;
  if (!isAuthenticated || !me?.admin) {
    return (
      <div className="learn-gate card">
        <h1>{A.notAdminTitle}</h1>
        <p>{A.notAdminText}</p>
        {!isAuthenticated && (
          <button className="btn btn-primary" onClick={() => void signIn("google", { redirectTo: "/admin" })}>
            <span className="g-logo" aria-hidden="true">G</span> {C.auth.signIn}
          </button>
        )}
      </div>
    );
  }
  return (
    <>
      <nav className="adm-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{A.tabs[t]}</button>
        ))}
      </nav>
      {tab === "course" && <CourseTab />}
      {tab === "members" && <MembersTab />}
      {tab === "sales" && <SalesTab />}
      {tab === "coupons" && <CouponsTab />}
    </>
  );
}

export default function AdminApp({ C }: { C: Content }) {
  return (
    <ContentProvider value={C}>
      <div lang={C.locale.code} className="learn-page adm-page">
        <header className="nav scrolled">
          <div className="container nav-inner">
            <div className="learn-brand">
              <Link href="/" className="logo">
                <img src="/logo.svg" alt="" className="logo-mark" width={32} height={32} />
                <span>{C.brand.name}</span>
              </Link>
              <span className="learn-chip">{C.admin.title}</span>
            </div>
            <div className="nav-cta"><AuthButton /></div>
          </div>
        </header>
        <main className="container adm-main"><Body /></main>
      </div>
    </ContentProvider>
  );
}
