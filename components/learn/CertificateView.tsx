"use client";

/* ใบประกาศเรียนจบ (/learn/certificate) — server ตรวจว่าเรียนครบจริงก่อน (convex/learn.ts → certificate)
 * กด "พิมพ์" แล้วเลือก "บันทึกเป็น PDF" ได้ — ตอนพิมพ์ซ่อนเมนู/ปุ่มอื่น (globals.css @media print) */
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { learnPath } from "@/components/learn/steps";

export default function CertificateView({ now }: { now: number }) {
  const C = useContent();
  const L = C.learn;
  const cert = useQuery(api.learn.certificate, { now });

  if (cert === undefined) return <p className="learn-loading" role="status">{L.loading}</p>;
  if (cert.status === "notEligible") {
    return (
      <div className="learn-gate card">
        <h1>{L.certCardTitle}</h1>
        <p>{L.certNotYet} {cert.done}/{cert.total}</p>
        <Link href={learnPath(C)} className="btn btn-primary">{L.backToClassroom}</Link>
      </div>
    );
  }
  const date = new Date(cert.completedAt).toLocaleDateString(C.locale.dateLocale, { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="cert-wrap">
      <div className="cert-actions no-print">
        <Link href={learnPath(C)} className="btn btn-ghost btn-sm">{L.backToClassroom}</Link>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>{L.certPrint}</button>
      </div>
      <article className="cert-paper">
        <img src="/logo.svg" alt="" width={56} height={56} className="cert-logo" />
        <p className="cert-brand">{C.brand.name}</p>
        <h1 className="cert-h">{L.certHeading}</h1>
        <p className="cert-sub">{L.certSub}</p>
        <p className="cert-name">{cert.name || L.certNoName}</p>
        <p className="cert-body">{L.certBody}</p>
        <div className="cert-foot">
          <div><span>{L.certDate}</span><b>{date}</b></div>
          <div><span>{L.certIdLabel}</span><b>{cert.certId}</b></div>
          <div><span className="cert-sign">{L.certSigner}</span></div>
        </div>
        <p className="cert-note">{L.certNote}</p>
      </article>
    </div>
  );
}
