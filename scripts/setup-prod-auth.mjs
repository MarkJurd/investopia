// สร้างกุญแจ JWT ชุดใหม่แล้วตั้งบน Convex PRODUCTION (ไม่พิมพ์กุญแจออกหน้าจอ)
// ใช้: node scripts/setup-prod-auth.mjs https://โดเมนจริงของเว็บ
import { generateKeyPair, exportPKCS8, exportJWK } from "jose";
import { spawnSync } from "node:child_process";

const siteUrl = process.argv[2];
if (!siteUrl || !siteUrl.startsWith("https://")) {
  console.error("ใส่ที่อยู่เว็บจริงขึ้นต้น https:// เช่น node scripts/setup-prod-auth.mjs https://investopia.vercel.app");
  process.exit(1);
}

const { publicKey, privateKey } = await generateKeyPair("RS256", { extractable: true });
const privatePem = (await exportPKCS8(privateKey)).trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(publicKey)) }] });

function setEnv(name, value) {
  const r = spawnSync(process.execPath, ["node_modules/convex/bin/main.js", "env", "set", "--prod", name, "--", value], { stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) { console.error("ตั้ง " + name + " ไม่สำเร็จ"); process.exit(1); }
  console.log("ตั้ง " + name + " แล้ว");
}

setEnv("JWT_PRIVATE_KEY", privatePem);
setEnv("JWKS", jwks);
setEnv("SITE_URL", siteUrl.replace(/\/$/, ""));
