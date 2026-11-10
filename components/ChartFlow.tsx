"use client";

/* แอนิเมชันกราฟตามการเลื่อน: 7 ขั้นหาจุดเข้า-ออก (ข้อความมาจาก content.ts → flow)
 * กราฟเป็นข้อมูลสมมติที่วาดขึ้นเอง — ไม่ใช่หุ้นจริง
 * ปิดแอนิเมชันเมื่อผู้ใช้ตั้ง prefers-reduced-motion (แสดงภาพสุดท้ายนิ่งๆ) */
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useContent } from "@/components/ContentContext";
import { useStudent } from "@/components/useStudent";
import { learnPath } from "@/components/learn/steps";

const N = 40;
const CX = (i: number) => 24 + i * 15;
const SUP_Y = 268, RES_Y = 112, MACD_ZERO = 336, MACD_AMP = 34;
// จุดบังคับของราคา (ดัชนีแท่ง, ตำแหน่ง y — ค่าน้อย = ราคาสูง)
const KEY: [number, number][] = [[0, 105], [6, 130], [12, 190], [18, 235], [22, 262], [24, 255], [27, 205], [30, 232], [33, 210], [36, 185], [39, 160]];
// ช่วงความคืบหน้าเลื่อน → จำนวนแท่งที่แสดง
const SHOWN: [number, number][] = [[0, 0], [0.14, 18], [0.28, 18], [0.42, 24], [0.56, 29], [0.72, 37], [0.85, 37], [1, 40]];
const STEP_AT = [0, 0.14, 0.28, 0.42, 0.56, 0.72, 0.85];

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
function lerpKeys(keys: [number, number][], x: number) {
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][0]) {
      const [x0, y0] = keys[i - 1], [x1, y1] = keys[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return keys[keys.length - 1][1];
}
const ema = (xs: number[], n: number) => {
  const k = 2 / (n + 1);
  return xs.reduce<number[]>((a, x) => (a.push(a.length ? x * k + a[a.length - 1] * (1 - k) : x), a), []);
};

function buildData() {
  let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const keyed = new Set(KEY.map(([i]) => i));
  const close = Array.from({ length: N }, (_, i) => lerpKeys(KEY, i) + (keyed.has(i) ? 0 : (rnd() - 0.5) * 16));
  const candles = close.map((c, i) => {
    const o = i ? close[i - 1] : c + 6;
    const top = Math.min(o, c) - rnd() * 8, bot = Math.max(o, c) + rnd() * 8;
    return { o, c, top, bot: i === 22 ? SUP_Y : Math.min(bot, SUP_Y) };
  });
  // MACD (12,26,9) คำนวณจากราคาจริงของกราฟสมมติ
  const p = close.map((y) => -y);
  const macd = ema(p, 12).map((v, i) => v - ema(p, 26)[i]);
  const sig = ema(macd, 9);
  const hist = macd.map((m, i) => m - sig[i]);
  const max = Math.max(...hist.map(Math.abs)) || 1;
  return { candles, hist: hist.map((h) => (h / max) * MACD_AMP) };
}

export default function ChartFlow() {
  const C = useContent();
  const F = C.flow;
  const { isStudent } = useStudent();
  const { candles, hist } = useMemo(buildData, []);
  const track = useRef<HTMLDivElement>(null);
  const [pr, setPr] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = track.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPr(clamp(-r.top / (r.height - innerHeight)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  const p = reduce ? 1 : pr;
  const shown = lerpKeys(SHOWN, p);
  const step = reduce ? F.steps.length - 1 : STEP_AT.filter((a) => p >= a).length - 1;
  const supA = seg(p, 0.28, 0.36), resA = seg(p, 0.85, 0.95);
  const tfLit = (i: number) => p >= 0.14 + (i * 0.14) / F.timeframes.length;
  const sw = candles[30], hh = candles[36];
  const freeId = C.hero.freeLessonId || undefined;

  return (
    <section className="flow" id="flow" aria-label={F.title}>
      <div className="container flow-head">
        <span className="eyebrow">{F.eyebrow}</span>
        <h2>{F.title}</h2>
        <p className="flow-for"><b>{F.forLabel}</b>{F.forItems.map((t) => <span key={t}>{t}</span>)}</p>
      </div>

      <div className={`flow-track${reduce ? " static" : ""}`} ref={track}>
        <div className="flow-stage container">
          <div className="flow-chart">
            <div className="flow-tf" aria-hidden="true">
              {F.timeframes.map((t, i) => <span key={t} className={tfLit(i) ? "on" : ""}>{t}</span>)}
            </div>
            <svg viewBox="0 0 640 390" role="img" aria-label={F.steps[step].title}>
              <line x1="20" x2="630" y1={MACD_ZERO} y2={MACD_ZERO} className="zero" />
              <text x="22" y="292" className="lbl dim">{F.labels.macd}</text>
              {candles.map((k, i) => {
                const col = k.c < k.o ? "var(--up)" : "var(--down)";
                const op = clamp(shown - i);
                const h = hist[i];
                return (
                  <g key={i} style={{ opacity: op }}>
                    <line x1={CX(i)} x2={CX(i)} y1={k.top} y2={k.bot} stroke={col} strokeWidth="2" />
                    <rect x={CX(i) - 5} y={Math.min(k.o, k.c)} width="10" height={Math.max(3, Math.abs(k.o - k.c))} fill={col} rx="2" />
                    <rect x={CX(i) - 4} y={h >= 0 ? MACD_ZERO - h : MACD_ZERO} width="8" height={Math.max(1, Math.abs(h))} fill={h >= 0 ? "var(--up)" : "var(--down)"} opacity=".55" />
                  </g>
                );
              })}
              <line x1="20" x2="630" y1={SUP_Y} y2={SUP_Y} className="lvl" strokeDasharray="610" strokeDashoffset={610 * (1 - supA)} />
              <text x="540" y={SUP_Y + 18} className="lbl" opacity={supA > 0.9 ? 1 : 0}>{F.labels.support}</text>
              <line x1="20" x2="630" y1={RES_Y} y2={RES_Y} className="lvl" strokeDasharray="610" strokeDashoffset={610 * (1 - resA)} />
              <text x="530" y={RES_Y - 8} className="lbl" opacity={resA > 0.9 ? 1 : 0}>{F.labels.resistance}</text>
              <g className="pop" style={{ opacity: p > 0.64 ? 1 : 0 }}>
                <text x={CX(30)} y={sw.bot + 18} className="lbl sm" textAnchor="middle">{F.labels.hl}</text>
              </g>
              <g className="pop" style={{ opacity: p > 0.7 ? 1 : 0 }}>
                <text x={CX(36)} y={hh.top - 10} className="lbl sm" textAnchor="middle">{F.labels.hh}</text>
              </g>
              <g className="pop" style={{ opacity: p > 0.76 ? 1 : 0 }}>
                <circle cx={CX(36)} cy={hh.c} r="9" className="dot entry" />
                <text x={CX(36) - 16} y={hh.c + 28} className="lbl sm entry-t" textAnchor="end">{F.labels.entry}</text>
              </g>
              <g className="pop" style={{ opacity: p > 0.95 ? 1 : 0 }}>
                <circle cx={CX(39) + 8} cy={RES_Y} r="9" className="dot exit" />
                <text x={CX(39) - 6} y={RES_Y + 26} className="lbl sm exit-t" textAnchor="end">{F.labels.exit}</text>
              </g>
            </svg>
            <p className="flow-note">{F.note}</p>
          </div>

          <div className="flow-steps">
            {F.steps.map((s, i) => (
              <div key={s.title} className={`flow-step${i === step || reduce ? " on" : ""}`}>
                <small>{F.stepLabel} {i + 1} / {F.steps.length}</small>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
            {(reduce || step === F.steps.length - 1) && (
              <Link href={learnPath(C, isStudent ? undefined : freeId)} className="btn btn-free btn-lg">
                {isStudent ? C.hero.ctaStudent : C.hero.ctaFree}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
