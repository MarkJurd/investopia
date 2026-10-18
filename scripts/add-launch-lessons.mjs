// usage: node scripts/add-launch-lessons.mjs dev|prod <adminUserId> — เพิ่ม TradingView (โมดูล 1) + MACD/Fibonacci พร้อมแบบฝึกหัด (โมดูล 2), เปลี่ยนชื่อโมดูล 1
import { spawnSync } from "node:child_process";
const [target, uid] = process.argv.slice(2);
const ADM = JSON.stringify({ subject: `${uid}|s` });
function run(fn, args) {
  const a = ["node_modules/convex/bin/main.js", "run", ...(target === "prod" ? ["--prod"] : []), fn, JSON.stringify(args ?? {}), "--identity", ADM];
  const r = spawnSync(process.execPath, a, { cwd: "C:/w00d/investopia/Webpage", encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  if (r.status !== 0) throw new Error(fn + " failed: " + out.slice(-300));
  const i = out.search(/^[\[{"\dntf]/m);
  try { return JSON.parse(out.slice(i)); } catch { return out.trim(); }
}
const T = run("adminCourse:tree");
const m1 = T.modules.find((m) => m.title === "เรียนกราฟไปทำไม?");
const m2 = T.modules.find((m) => m.title === "การใช้อินดิเคเตอร์ต่างๆ");
if (!m1 || !m2) throw new Error("modules not found (already done?)");
run("adminCourse:saveModule", { id: m1.id, title: "ปลดล็อกกราฟ: เรียนไปทำไม?", practice: "", hidden: false });
const add = (mid, title, videoId = "", notes = "") => {
  const id = run("adminCourse:addLesson", { moduleId: mid, title });
  run("adminCourse:saveLesson", { id, title, notes, videoId, minutes: 0, hidden: false, indicatorOnly: false });
  return id;
};
const tv = add(m1.id, "TradingView: สอนใช้งานแอป");
const l1 = run("adminCourse:tree").modules.find((m) => m.id === m1.id).lessons.map((l) => l.id);
run("adminCourse:reorderLessons", { moduleId: m1.id, ids: [tv, ...l1.filter((x) => x !== tv)] });
const macd = m2.lessons.find((l) => l.title.startsWith("MACD"));
run("adminCourse:saveLesson", { id: macd.id, title: macd.title, notes: macd.notes, videoId: "10e5413c-da6c-44fb-a2c1-309d2880c6a4", minutes: 0, hidden: false, indicatorOnly: false });
add(m2.id, "แบบฝึกหัด MACD 1", "aa88f531-d014-47af-b65f-01daac9fa4b6");
add(m2.id, "แบบฝึกหัด MACD 2", "b3d339c3-2ec7-420f-9284-cd6e834cbcb1");
add(m2.id, "แบบฝึกหัด MACD 3", "ecae5ac3-c838-4b60-93d5-f8f538b5cf39");
add(m2.id, "Fibonacci", "1af51641-a77f-401a-90bb-97362811fbd7");
add(m2.id, "แบบฝึกหัด Fibonacci 1", "729dbc27-d670-476c-863f-a97ff65bfd98");
add(m2.id, "แบบฝึกหัด Fibonacci 2", "82c21875-c06a-4dba-a67c-c3d7369bdc14");
add(m2.id, "แบบฝึกหัด Fibonacci 3", "7b1e2d5f-f7fa-4a5e-ab49-21e43cca4f17");
for (const m of run("adminCourse:tree").modules.slice(0, 2)) console.log(m.title, "→", m.lessons.map((l) => l.title + (l.videoId ? "🎬" : "")).join(" | "));
