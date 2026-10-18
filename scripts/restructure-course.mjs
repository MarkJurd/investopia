// usage: node restructure.mjs dev|prod <adminUserId>
import { spawnSync } from "node:child_process";
const CWD = "C:/w00d/investopia/Webpage";
const [target, uid] = process.argv.slice(2);
const ADM = JSON.stringify({ subject: `${uid}|s` });
function run(fn, args) {
  const a = ["node_modules/convex/bin/main.js", "run", ...(target === "prod" ? ["--prod"] : []), fn, JSON.stringify(args ?? {}), "--identity", ADM];
  const r = spawnSync(process.execPath, a, { cwd: CWD, encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status !== 0) throw new Error(fn + " failed: " + out.slice(-300));
  const i = out.search(/^[\[{"\dntf]/m);
  try { return JSON.parse(out.slice(i)); } catch { return out.trim(); }
}
const NOTES = {
  "แท่งเทียน": "รูปทรงแต่ละแท่งคือภาพแรงซื้อ-แรงขายของช่วงเวลานั้น บอกว่าซื้อหรือขายชนะ",
  "Dow Theory": "ราคาเคลื่อนที่เป็นคลื่น จากแรงซื้อ-แรงขายที่ไม่สมดุลต่อเนื่อง",
  "Time Frame": "กราฟมีหลายช่วงเวลา เลือกให้ตรงสไตล์การถือ",
  "EMA": "เส้นเฉลี่ยให้น้ำหนักกับราคาล่าสุด ใช้ดูทิศทางเทรนด์ (EMA 20/50/100/200 ที่คนนิยมใช้กัน)",
  "Multi-Timeframe": "ดูหลายไทม์เฟรมร่วมกันเพื่อเพิ่มความมั่นใจก่อนเข้า-ออก และเช็กว่ากราฟพร้อมแล้วหรือควรรอก่อน",
  "การแบ่งไม้เข้าออก": "แบ่งไม้เข้า-ออก และกำหนดขนาดไม้ให้เหมาะกับความเสี่ยง",
};
const PLAN = [
  ["เรียนกราฟไปทำไม?", ["แท่งเทียน", "Trend", "Dow Theory", "Time Frame", "แอปซื้อหุ้นที่ผู้สอนชอบและไม่ชอบ"]],
  ["การใช้อินดิเคเตอร์ต่างๆ", ["EMA", "RSI", "MACD (ตัวที่ผู้สอนใช้ประจำที่สุด)"]],
  ["Chart Pattern และแนวรับแนวต้าน", ["Chart Pattern", "แนวรับแนวต้าน โดยดูจากชาร์ต"]],
  ["เทคนิคส่วนตัว", ["Multi-Timeframe", "Double Confirmation"]],
  ["Risk Reward", ["การแบ่งไม้เข้าออก"]],
  ["SMC", ["BOS", "CHoCH", "OB", "FVG", "Liquidity Sweep (การย่อตัวตามธรรมชาติ)"]],
  ["Bonus", ["เทคนิคพ่อมดเทรดเดอร์ Mark Minervini"]],
];
const before = run("adminCourse:tree");
if (before.modules.some((m) => m.title === "เรียนกราฟไปทำไม?")) throw new Error("already restructured");
const old = before.modules.filter((m) => /^m\d$/.test(m.key));
const ind = old.flatMap((m) => m.lessons).find((l) => l.indicatorOnly);
console.log("old modules", old.length, "indicator lesson", ind?.key);
for (const [title, lessons] of PLAN) {
  const mid = run("adminCourse:addModule", { title });
  run("adminCourse:saveModule", { id: mid, title, practice: "", hidden: false });
  for (const lt of lessons) {
    const lid = run("adminCourse:addLesson", { moduleId: mid, title: lt });
    run("adminCourse:saveLesson", { id: lid, title: lt, notes: NOTES[lt] ?? "", videoId: "", minutes: 0, hidden: false, indicatorOnly: false });
  }
  console.log("created", title);
}
if (ind) {
  const hm = run("adminCourse:addModule", { title: "อินดิเคเตอร์ของผู้สอน (ซ่อน)" });
  run("adminCourse:saveModule", { id: hm, title: "อินดิเคเตอร์ของผู้สอน (ซ่อน)", practice: "", hidden: true });
  run("adminCourse:moveLesson", { id: ind.id, moduleId: hm });
  run("adminCourse:saveLesson", { id: ind.id, title: ind.title, notes: ind.notes, videoId: ind.videoId, minutes: ind.minutes, hidden: true, indicatorOnly: true });
  console.log("moved indicator lesson (hidden)");
}
for (const m of old) { const r = run("adminCourse:deleteModule", { id: m.id, deleteLessons: true }); console.log("deleted", m.key, JSON.stringify(r)); }
const after = run("adminCourse:tree");
for (const m of after.modules) console.log(m.hidden ? "(hidden)" : "", m.title, m.lessons.map((l) => l.title).join(" | "));
