"use client";

/* กรอบวิดีโอของบทเรียน: มีวิดีโอ = ขอลิงก์เล่นที่เซ็นแล้วจาก server (เฉพาะสมาชิก) · ไม่มี = "เร็วๆ นี้"
 * ใช้ <iframe> ตัวเดียวตลอด เปลี่ยนบท = เปลี่ยน src (ไม่สร้างกรอบใหม่) — เคยเกิดปัญหาเครื่องเล่นของบทก่อนๆ ค้างซ้อนกันบนหน้าเว็บจริง */
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";

type State = { kind: "loading" } | { kind: "ready"; url: string } | { kind: "soon" } | { kind: "error" };

export default function LessonVideo({ lessonId, title, hasVideo }: { lessonId: string; title: string; hasVideo: boolean }) {
  const L = useContent().learn;
  const getUrl = useAction(api.learn.videoUrl);
  const initial = (): State => (hasVideo ? { kind: "loading" } : { kind: "soon" });
  const [state, setState] = useState<State>(initial);
  const [shownFor, setShownFor] = useState(lessonId);
  const [attempt, setAttempt] = useState(0);
  // เปลี่ยนบท → รีเซ็ตสถานะทันที (ไม่ให้คลิปบทเก่าค้างระหว่างรอลิงก์ใหม่)
  if (shownFor !== lessonId) {
    setShownFor(lessonId);
    setState(initial());
  }

  useEffect(() => {
    if (!hasVideo) return;
    let alive = true;
    getUrl({ lessonId })
      .then((url) => { if (alive) setState(url ? { kind: "ready", url } : { kind: "soon" }); })
      .catch(() => { if (alive) setState({ kind: "error" }); });
    return () => { alive = false; };
  }, [hasVideo, lessonId, getUrl, attempt]);

  const ready = state.kind === "ready";
  return (
    <div className="learn-video">
      <iframe src={ready ? state.url : "about:blank"} title={title} hidden={!ready}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      {!ready && (
        <div className="lv-soon">
          {state.kind === "loading" && <p role="status">{L.loading}</p>}
          {state.kind === "error" && (
            <>
              <b>{L.videoErrorTitle}</b>
              <button className="btn btn-ghost btn-sm" onClick={() => { setState({ kind: "loading" }); setAttempt((n) => n + 1); }}>{L.videoRetry}</button>
            </>
          )}
          {state.kind === "soon" && (
            <>
              <span className="lv-play" aria-hidden="true">▶</span>
              <b>{L.videoSoonTitle}</b>
              <p>{L.videoSoonText}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
