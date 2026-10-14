"use client";

/* คอมมูนิตี้ (/community, /en/community) — ห่อทุกหน้าผ่าน app/community/layout.tsx
 * สิทธิ์ถูกเช็กที่เซิร์ฟเวอร์ (convex/community.ts) — ฝั่งนี้แค่เลือกว่าจะแสดงอะไร */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { ContentProvider, useContent, type Content } from "@/components/ContentContext";
import AppHeader from "@/components/AppHeader";
import Feed from "@/components/community/Feed";
import PostDetail from "@/components/community/PostDetail";
import { BOOT_NOW, communityPath, langOf } from "@/components/community/helpers";
import { pricingPath } from "@/components/learn/steps";

function usePostId(): string | undefined {
  const m = usePathname().match(/\/community\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

function Gate({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="learn-gate card">
      <h1>{title}</h1>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

function Body() {
  const C = useContent();
  const D = C.community;
  const postId = usePostId();
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.community.me, isAuthenticated ? { lang: langOf(C), now: BOOT_NOW } : "skip");

  if (isLoading || (isAuthenticated && me === undefined)) return <p className="learn-loading" role="status">{D.loading}</p>;
  if (!isAuthenticated || !me || me.status === "signedOut") {
    return (
      <Gate title={D.signInTitle} text={D.signInText} action={
        <button className="btn btn-primary" onClick={() => void signIn("google", { redirectTo: communityPath(C, postId) })}>
          <span className="g-logo" aria-hidden="true">G</span> {C.auth.signIn}
        </button>
      } />
    );
  }
  if (me.status === "noMembership") {
    return <Gate title={D.noMemberTitle} text={D.noMemberText} action={<Link href={pricingPath(C)} className="btn btn-primary">{D.seePlans}</Link>} />;
  }
  return postId ? <PostDetail postId={postId} me={me} /> : <Feed me={me} />;
}

export default function CommunityApp({ C }: { C: Content }) {
  return (
    <ContentProvider value={C}>
      <div lang={C.locale.code} className="learn-page">
        <AppHeader active="community" />
        <main className="container learn-main comm-main"><Body /></main>
      </div>
    </ContentProvider>
  );
}
