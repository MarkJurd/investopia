"use client";

/* วิดีโอแนะนำตัว: file > youtubeId (โหลดเมื่อกดเล่น) > กรอบ "เร็วๆ นี้" — ตั้งค่าใน lib/content.ts → hero.video */
import { useState } from "react";
import { useContent } from "@/components/ContentContext";

export default function HeroVideo() {
  const CONTENT = useContent();
  const V = CONTENT.hero.video;
  const [playing, setPlaying] = useState(false);
  const poster = V.poster ? <img className="vid-poster" src={V.poster} alt="" /> : null;

  let box;
  if (V.file) {
    box = <video controls playsInline preload="none" poster={V.poster || undefined} src={V.file} />;
  } else if (V.youtubeId && playing) {
    box = (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(V.youtubeId)}?autoplay=1&rel=0`}
        title={V.placeholderTitle}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  } else if (V.youtubeId) {
    box = (
      <button className="vid-ph" type="button" aria-label={V.placeholderTitle} onClick={() => setPlaying(true)}>
        {poster}<span className="play">▶</span><span className="vid-t">{V.placeholderTitle}</span>
      </button>
    );
  } else {
    box = (
      <div className="vid-ph">
        {poster}<span className="play">▶</span><span className="vid-t">{V.placeholderTitle}</span>
        <span className="vid-s">{V.placeholderText}</span>
      </div>
    );
  }

  return (
    <div className="video-card">
      <div className="video-box">{box}</div>
      <div className="video-cap">{V.caption}</div>
    </div>
  );
}
