"use client";

/* คลิปตัวอย่างหน้าแรก: แสดงรูปปกก่อน กดเล่นแล้วค่อยขอลิงก์ Bunny จากเซิร์ฟเวอร์ (convex/learn.ts → landingVideoUrl)
 * ขอลิงก์ไม่สำเร็จ = เล่นไฟล์สำรองใน public · ข้อความและรูปปกตั้งใน lib/content.ts → hero.video */
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "bunny"; url: string } | { kind: "file" };

export default function HeroVideo() {
  const V = useContent().hero.video;
  const getUrl = useAction(api.learn.landingVideoUrl);
  const [state, setState] = useState<State>({ kind: "idle" });

  const play = () => {
    setState({ kind: "loading" });
    // รอลิงก์ไม่เกิน 8 วินาที ถ้าช้ากว่านั้นเล่นไฟล์สำรอง
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
    Promise.race([getUrl({}), timeout])
      .then((url) => setState(url ? { kind: "bunny", url: `${url}&autoplay=true` } : { kind: "file" }))
      .catch(() => setState({ kind: "file" }));
  };

  let box;
  if (state.kind === "bunny") {
    box = <iframe src={state.url} title={V.placeholderTitle} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />;
  } else if (state.kind === "file") {
    box = <video controls autoPlay playsInline poster={V.poster} src={V.file} />;
  } else {
    box = (
      <button className="vid-ph" type="button" aria-label={V.placeholderTitle} onClick={play} disabled={state.kind === "loading"}>
        <img className="vid-poster" src={V.poster} alt="" />
        <span className="play">▶</span>
      </button>
    );
  }

  return (
    <div className="video-card">
      <div className="video-box">{box}</div>
      <div className="video-cap">{V.caption}</div>
    </div>
  );
}
