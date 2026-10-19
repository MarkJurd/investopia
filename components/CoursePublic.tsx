"use client";

/* หน้าคอร์สกราฟสาธารณะ (/course/chart): ทุกคนดูรายชื่อโมดูล/บทได้ · บทฟรี = ล็อกอินแล้วเรียนได้ · บทอื่น = ต้องเป็นสมาชิก */
import Link from "next/link";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";

export default function CoursePublic() {
  const C = useContent();
  const K = C.courses, P = K.page;
  const outline = useQuery(api.course.publicOutline);
  const { isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [showMember, setShowMember] = useState(false);

  const open = (id: string, free: boolean) => {
    if (!free) { setShowMember(true); return; }
    const path = `/learn/${id}`;
    if (isAuthenticated) router.push(path);
    else void signIn("google", { redirectTo: path });
  };

  return (
    <div className="container course-page">
      <Link href="/#courses" className="back-link">{P.back}</Link>
      <div className="cp-head">
        <img src="/courses/card-chart.jpg" alt="" />
        <div>
          <span className="badge-soft">{K.level}</span>
          <h1>{K.chart.title}</h1>
          <p>{K.chart.desc}</p>
        </div>
      </div>
      <p className="legend"><span className="free-pill">{P.legendFree}</span> {P.legendFreeText} · {P.legendMember}</p>

      {outline === undefined && <p role="status">{P.loading}</p>}
      {outline?.map((m, i) => (
        <section className="cp-mod card" key={m.id}>
          <h2><span className="cp-n">{i + 1}</span>{m.title}</h2>
          <ul>
            {m.lessons.map((l) => (
              <li key={l.id}>
                <button type="button" className="cp-les" onClick={() => open(l.id, l.free)}>
                  <span className="t">{l.title}</span>
                  {l.free ? <span className="free-pill">{P.freeBadge}</span> : <span className="lock">{P.memberBadge}</span>}
                  {l.soon && <span className="soon-pill">{P.soonBadge}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {showMember && (
        <div className="cp-note card" role="alert">
          <b>{P.memberNoteTitle}</b>
          <p>{P.memberNoteText}</p>
          <Link href="/#pricing" className="btn btn-primary btn-sm">{P.seePlans}</Link>
        </div>
      )}
      <div style={{ textAlign: "center", margin: "28px 0 60px" }}>
        <Link href="/#pricing" className="btn btn-primary">{P.cta}</Link>
      </div>
    </div>
  );
}
