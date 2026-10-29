/* กราฟเส้นต่อการ์ดอัตราส่วน: ตัวเอง เทียบค่ากลางคู่แข่งรายปี + เส้นเกณฑ์ผู้สอน (ไม่มีคะแนนรวม) */
export type ChartPoint = { year: string; self: number | null; med: number | null };

const W = 320, H = 150, L = 34, R = 10, T = 10, B = 22;

export default function RatioChart({ points, rule, fmt, labels }: {
  points: ChartPoint[]; rule: number | null; fmt: (x: number) => string;
  labels: { self: string; med: string; rule: string; aria: string };
}) {
  const vals = points.flatMap((p) => [p.self, p.med]).concat(rule === null ? [] : [rule]).filter((x): x is number => x !== null);
  if (points.length < 2 || vals.length === 0) return null;
  const lo = Math.min(0, ...vals), hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i: number) => L + (i * (W - L - R)) / (points.length - 1);
  const y = (v: number) => T + (1 - (v - lo) / span) * (H - T - B);
  // เส้นขาดช่วงเมื่อปีนั้นไม่มีค่า (ไม่เดาเป็น 0)
  const path = (k: "self" | "med") => points.map((p, i) => (p[k] === null ? "" : `${i > 0 && points[i - 1][k] !== null ? "L" : "M"}${x(i)} ${y(p[k] as number)}`)).join("");
  const last = points[points.length - 1].self;
  return (
    <div className="sc-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={labels.aria}>
        {[lo, (lo + hi) / 2, hi].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" /><text x={L - 4} y={y(v) + 3} textAnchor="end">{fmt(v)}</text></g>)}
        {points.map((p, i) => (points.length <= 6 || i % 2 === (points.length - 1) % 2) && <text key={p.year} x={x(i)} y={H - 6} textAnchor="middle">{p.year}</text>)}
        {rule !== null && <line x1={L} x2={W - R} y1={y(rule)} y2={y(rule)} className="rule" />}
        <path d={path("med")} className="med" />
        <path d={path("self")} className="self" />
        {points.map((p, i) => p.self !== null && <circle key={p.year} cx={x(i)} cy={y(p.self)} r="3" className="dot" />)}
        {last !== null && <text x={W - R} y={y(last) - 7} textAnchor="end" className="val">{fmt(last)}</text>}
      </svg>
      <p className="sc-chart-legend">
        <span><i className="self" />{labels.self}</span>
        <span><i className="med" />{labels.med}</span>
        {rule !== null && <span><i className="rule" />{labels.rule}</span>}
      </p>
    </div>
  );
}
