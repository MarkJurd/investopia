"use client";

/* ห้องเรียน (/learn, /en/learn) — ห่อทุกหน้าในห้องเรียนผ่าน app/learn/layout.tsx
 * จึงโหลดข้อมูลครั้งเดียว แล้วเปลี่ยนบทได้ทันทีโดยไม่ต้องโหลดใหม่
 * สิทธิ์ถูกเช็กที่เซิร์ฟเวอร์ (convex/learn.ts) — ฝั่งนี้แค่เลือกว่าจะแสดงอะไร */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { ContentProvider, useContent, type Content } from "@/components/ContentContext";
import AppHeader from "@/components/AppHeader";
import Dashboard from "@/components/learn/Dashboard";
import LessonView from "@/components/learn/LessonView";
import QuizView from "@/components/learn/QuizView";
import CertificateView from "@/components/learn/CertificateView";
import ModuleView from "@/components/learn/ModuleView";
import { buildSteps, CERT_STEP, MODULE_PREFIX, learnPath, pricingPath } from "@/components/learn/steps";

function useStepId(): string | undefined {
  const m = usePathname().match(/\/learn\/([^/]+)/);
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
  const L = C.learn;
  const stepId = useStepId();
  const { signIn } = useAuthActions();
  const { isLoading, isAuthenticated } = useConvexAuth();
  // เวลาตอนเปิดหน้า (ปัดเป็นนาที) — เซิร์ฟเวอร์ใช้ค่าที่ใหม่กว่าระหว่างค่านี้กับนาฬิกาของมันเอง
  const [now] = useState(() => Math.floor(Date.now() / 60000) * 60000);
  const data = useQuery(api.learn.overview, isAuthenticated ? { now } : "skip");

  if (isLoading || (isAuthenticated && data === undefined)) {
    return <p className="learn-loading" role="status">{L.loading}</p>;
  }
  if (!isAuthenticated || data?.status === "signedOut") {
    return (
      <Gate title={L.signInTitle} text={L.signInText} action={
        <button className="btn btn-primary" onClick={() => void signIn("google", { redirectTo: learnPath(C, stepId) })}>
          <span className="g-logo" aria-hidden="true">G</span> {C.auth.signIn}
        </button>
      } />
    );
  }
  if (!data || data.status === "noMembership") {
    return <Gate title={L.noMemberTitle} text={L.noMemberText} action={<a href={pricingPath(C)} className="btn btn-primary">{L.seePlans}</a>} />;
  }

  const steps = buildSteps(data);
  if (!stepId) return <Dashboard data={data} steps={steps} now={now} />;
  if (stepId.startsWith(MODULE_PREFIX)) {
    const mod = data.modules.find((m) => m.id === stepId.slice(MODULE_PREFIX.length));
    if (mod) return <ModuleView module={mod} steps={steps} />;
  }
  if (stepId === CERT_STEP) return <CertificateView now={now} />;
  const index = steps.findIndex((s) => s.id === stepId);
  if (index === -1) {
    return <Gate title={L.notFound} text="" action={<Link href={learnPath(C)} className="btn btn-primary">{L.backToClassroom}</Link>} />;
  }
  const step = steps[index];
  return step.kind === "lesson"
    ? <LessonView steps={steps} index={index} />
    : <QuizView key={step.id} steps={steps} index={index} passPercent={data.passPercent} />;
}

export default function LearnApp({ C }: { C: Content }) {
  return (
    <ContentProvider value={C}>
      <div lang={C.locale.code} className="learn-page">
        <AppHeader active="learn" />
        <main className="container learn-main"><Body /></main>
      </div>
    </ContentProvider>
  );
}
