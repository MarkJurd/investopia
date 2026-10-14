"use client";

/* กรอบวิดีโอของบทเรียน: มีวิดีโอ = ขอลิงก์เล่นที่เซ็นแล้วจาก server (เฉพาะสมาชิก) · ไม่มี = "เร็วๆ นี้"
 * ใส่ key={lessonId} ตอนเรียกใช้ เปลี่ยนบทแล้วสถานะจะรีเซ็ตเอง */
import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";

type State = { kind: "loading" } | { kind: "ready"; url: string } | { kind: "soon" } | { kind: "error" };

export default function LessonVideo({ lessonId, title, hasVideo }: { lessonId: string; title: string; hasVideo: boolean }) {
  const L = useContent().learn;
  const getUrl = useAction(api.learn.videoUrl);
  const [state, setState] = useState<State>(hasVideo ? { kind: "loading" } : { kind: "soon" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!hasVideo) return;
    let alive = true;
    getUrl({ lessonId })
      .then((url) => { if (alive) setState(url ? { kind: "ready", url } : { kind: "soon" }); })
      .catch(() => { if (alive) setState({ kind: "error" }); });
    return () => { alive = false; };
  }, [hasVideo, lessonId, getUrl, attempt]);

  return (
    <div className="learn-video">
      {state.kind === "ready" ? (
        <iframe src={state.url} title={title} loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
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
