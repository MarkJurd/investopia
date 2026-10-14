"use client";

/* เมนูบนร่วมของห้องเรียน + คอมมูนิตี้: โลโก้ · ห้องเรียน · คอมมูนิตี้ · ภาษา · กระดิ่งแจ้งเตือน · บัญชี */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import AuthButton from "@/components/AuthButton";
import NotificationBell from "@/components/community/NotificationBell";
import { BOOT_NOW, communityPath, langOf } from "@/components/community/helpers";
import { learnPath } from "@/components/learn/steps";

export default function AppHeader({ active }: { active: "learn" | "community" }) {
  const C = useContent();
  const path = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.community.me, isAuthenticated ? { lang: langOf(C), now: BOOT_NOW } : "skip");
  const otherBase = C.locale.switchHref === "/" ? "" : C.locale.switchHref;
  const rest = C.locale.code === "en" ? path.replace(/^\/en/, "") : path;
  return (
    <header className="nav scrolled">
      <div className="container nav-inner">
        <div className="learn-brand">
          <Link href={C.locale.base} className="logo">
            <img src="/logo.svg" alt="" className="logo-mark" width={32} height={32} />
            <span>{C.brand.name}</span>
          </Link>
          <nav className="app-tabs" aria-label={C.brand.name}>
            <Link href={learnPath(C)} className={active === "learn" ? "on" : ""} aria-current={active === "learn" ? "page" : undefined}>{C.learn.title}</Link>
            <Link href={communityPath(C)} className={active === "community" ? "on" : ""} aria-current={active === "community" ? "page" : undefined}>{C.community.title}</Link>
          </nav>
        </div>
        <div className="nav-cta">
          <a href={`${otherBase}${rest}`} className="lang-switch">{C.locale.switchLabel}</a>
          {me?.status === "ok" && <NotificationBell />}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
