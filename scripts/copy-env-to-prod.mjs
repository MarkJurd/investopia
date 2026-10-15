// คัดลอกค่า env จาก Convex dev ไปตั้งบน PRODUCTION โดยไม่พิมพ์ค่าออกหน้าจอ
// ใช้: node scripts/copy-env-to-prod.mjs
import { spawnSync } from "node:child_process";

const NAMES = ["ADMIN_EMAILS", "AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "BUNNY_LIBRARY_ID", "BUNNY_TOKEN_KEY"];
const cli = (args) => spawnSync(process.execPath, ["node_modules/convex/bin/main.js", ...args], { encoding: "utf8" });

for (const name of NAMES) {
  const got = cli(["env", "get", name]);
  const value = (got.stdout ?? "").trim();
  if (got.status !== 0 || !value) { console.log("ข้าม " + name + " (ไม่มีค่าบน dev)"); continue; }
  const set = cli(["env", "set", "--prod", name, "--", value]);
  console.log(set.status === 0 ? "ตั้ง " + name + " บน prod แล้ว" : "ตั้ง " + name + " ไม่สำเร็จ: " + (set.stderr ?? "").trim());
}
