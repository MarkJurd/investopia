@AGENTS.md

# CLAUDE.md — คู่มือส่งต่องาน INVESTOPIA (เวอร์ชัน Next.js)

เว็บขายคอร์สออนไลน์สอนลงทุนสำหรับมือใหม่ แบรนด์ `INVESTOPIA` ผู้สอน/เจ้าของ: มาร์ค
ย้ายมาจากเว็บ HTML ล้วนใน `C:\Users\Mark\investopia` (เก็บไว้เป็นต้นฉบับอ้างอิง)

## Stack (เจ้าของเลือกแล้ว 2026-10-12)
- **Next.js 16 (App Router) + TypeScript** → deploy บน **Vercel** (repo: github.com/MarkJurd/investopia)
- **Convex** = backend: ล็อกอิน, ฐานข้อมูล, real-time (Q&A), รับ webhook — *ยังไม่ได้ติดตั้ง*
- **Stripe** = รับเงิน ผ่าน Stripe Checkout (หน้าจ่ายเงินของ Stripe) — *ยังไม่ได้ต่อ*
- ไม่ใช้ Tailwind — สไตล์อยู่ใน `app/globals.css` (ย้ายมาจาก styles.css เดิม)
- Next.js รุ่นนี้มี breaking changes — อ่าน `node_modules/next/dist/docs/` ก่อนเขียนโค้ด (ดู AGENTS.md)

## โครงสร้าง
```
lib/content.ts        ⭐ ข้อความภาษาไทย (หน้า /)
lib/content.en.ts     ⭐ ข้อความภาษาอังกฤษ (หน้า /en) — โครงต้องตรงกับ content.ts ทุกช่อง (TypeScript บังคับ)
components/HomePage.tsx    หน้าแรก ใช้ร่วมทั้ง 2 ภาษา (รับข้อความเป็น prop) · client components อ่านข้อความผ่าน useContent()
app/page.tsx          หน้าแรก (Server Component) — ประกอบ section จาก content.ts
app/layout.tsx        ฟอนต์ Anuphan (next/font) + metadata
app/globals.css       สี (:root) + สไตล์ทั้งหมด
app/icon.svg          favicon (= logo)
public/logo.svg       โลโก้ Bar-i (ชั่วคราว)
components/Effects.tsx     เอฟเฟกต์: scroll bar, reveal, count-up, รูปทรงลอย, แถบหุ้นวิ่ง, กราฟแท่งเทียน
components/HeroVideo.tsx   วิดีโอแนะนำตัว (youtubeId / file / placeholder)
components/Curriculum.tsx  หลักสูตร: เลขโมดูล + วงแหวนค้างซ้าย
components/Pricing.tsx     การ์ดราคา + modal ชำระเงิน (ยังจำลอง)
components/QABox.tsx       กล่องถามคำถาม (ยังเป็น alert)
```

## วิธีรัน / วิธีแก้ข้อความ (สำหรับเจ้าของ)
1. เปิดเทอร์มินัลในโฟลเดอร์นี้ → `npm run dev` → เปิด http://localhost:3000
2. แก้ข้อความใน `lib/content.ts` (เฉพาะใน "...") → Ctrl+S → หน้าเว็บเปลี่ยนเอง
3. เว็บจริงเปลี่ยนเมื่อ push ขึ้น GitHub (Vercel deploy อัตโนมัติ)

## กติกาสำหรับ AI
- **ห้าม hardcode ข้อความใน .tsx** — ทุกข้อความมาจาก `lib/content.ts` (ไทย) และ `lib/content.en.ts` (อังกฤษ) — **แก้ข้อความ/เพิ่มช่องต้องแก้ทั้ง 2 ไฟล์**
- เพิ่ม section ใหม่: เพิ่มข้อมูลใน content.ts + เพิ่ม JSX ใน page.tsx (หรือ component ใหม่)
- เคารพ `prefers-reduced-motion` · ต้อง responsive (มือถือ 375px ไม่ล้นจอ)
- ธีม: น้ำเงิน ~10% + ขาว เรียบ · ฟอนต์ Anuphan
- **Secret keys (Stripe `sk_`, `whsec_`) ห้ามอยู่ในโค้ด/แชท** — เจ้าของตั้งเองด้วย `npx convex env set ...` ; ใช้ test mode (`pk_test_`/`sk_test_`) ระหว่างพัฒนา
- เจ้าของอยากรู้เมื่อโมเดลที่ใช้ "เกินงาน" เพื่อประหยัดโทเคน (Opus = งานระบบ/เงิน/ความปลอดภัย, Sonnet = UI, Haiku = แก้ข้อความ)

## ข้อควรระวังเนื้อหา (กฎหมาย)
- ต้องคง disclaimer ใน footer · ห้าม "การันตีกำไร" / "สัญญาณซื้อขาย" / "แนะนำซื้อหุ้นตัว X" / "ปลอดภัย"
- แถบหุ้นสหรัฐฯ เป็นรายชื่อประกอบภาพ (มีข้อความกำกับ) ไม่ใช่คำแนะนำ
- เจ้าของไม่มีใบอนุญาตด้านการลงทุน — ห้ามเขียนให้ดูเหมือนมี และไม่ต้องเขียนว่าไม่มี

## แผนพัฒนา (ทำทีละเฟส)
1. ✅ ย้ายเว็บไป Next.js (หน้าตาเหมือนเดิม)
2. ✅ Convex + ล็อกอินด้วย Google — **ใช้งานได้แล้ว (เจ้าของทดสอบล็อกอินสำเร็จ 2026-10-12)** (convex/auth.ts, auth.config.ts, http.ts, schema.ts, users.ts + components/AuthButton.tsx) · ตั้ง JWT_PRIVATE_KEY/JWKS/SITE_URL บน dev แล้ว · ตั้ง AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET แล้ว (Google Cloud project: investopia, No organization, Audience: External, ยังอยู่โหมด Testing — ต้องกด Publish ก่อนเปิดขายจริง)
   - Redirect URI ใน Google Cloud: https://superb-rabbit-529.convex.site/api/auth/callback/google (dev)
   - ตอนขึ้น production: ต้องตั้ง env ชุดเดียวกันบน prod deployment + SITE_URL = โดเมนจริง + เพิ่ม redirect URI ของ prod
   - แอดมิน = บัญชี Google ที่กำหนด (อีเมลแอดมินห้ามแสดงบนเว็บ)
3. ✅ Stripe Checkout + webhook เปิดสิทธิ์ — **ใช้งานได้แล้ว (เจ้าของซื้อทดสอบรายเดือนสำเร็จ 2026-10-12)** · ตั้ง STRIPE_SECRET_KEY (sk_test) + STRIPE_WEBHOOK_SECRET แล้ว · ราคาจริงที่ใช้คิดเงินอยู่ใน convex/plans.ts (ต้องตรงกับ lib/content.ts) · webhook: https://superb-rabbit-529.convex.site/stripe/webhook (checkout.session.completed, checkout.session.async_payment_succeeded, charge.refunded) · คืนเงินเต็มจำนวนใน Stripe = ยกเลิกสิทธิ์อัตโนมัติ — แพ็กเกจ (ยืนยันแล้ว): **รายเดือน ฿990/30 วัน · 3 เดือน ฿2,490/90 วัน · รายปี ฿4,990/365 วัน** · จ่ายครั้งเดียวต่อรอบ ไม่ตัดเงินอัตโนมัติ (พร้อมเพย์ + บัตร)
   - รายปีเท่านั้น: ตอบคำถามภายใน 24 ชม. (รายเดือน/3 เดือน **ห้ามระบุเวลาตอบ**), ปรึกษา 1:1 = โค้ชด้านการเรียน (ห้ามดูพอร์ต/แนะนำหุ้น), คอร์สใหม่, โบนัสเช็กลิสต์ก่อนกดซื้อ, **Indicator (มูลค่า ฿2,990) เฉพาะ 50 คนแรก** → ระบบต้องนับลำดับผู้ซื้อรายปี
   - ทุกแพ็กเกจ: Live กลุ่มเดือนละครั้ง + ดูย้อนหลังได้ · **รับประกันคืนเงินเต็มจำนวนภายใน 7 วันหลังชำระ** (รับประกันความพอใจ ไม่ใช่กำไร)
   - **VIP ตัวต่อตัว ฿13,990** (ยืนยันแล้ว): เรียน 8 โมดูลแบบ 1:1 (8 × 1.5 ชม.) + ดูวิดีโอได้ + ทุกอย่างในรายปี 1 ปี + Indicator · **จำกัด 3 ที่/เดือน** (อาจเพิ่มเป็น 5 ภายหลัง) · คืนเงินได้ก่อนเริ่มเรียนครั้งแรกเท่านั้น
   - Live กลุ่ม: เดือนละ 1 ครั้งรวมทุกคน · รายปีได้ 1:1 = 2 ครั้ง (ยืนยันแล้ว)
   - ไม่มีการทบทวนพอร์ตในทุกแพ็กเกจ (เจ้าของไม่ใช่ผู้จัดการกองทุน)
   - Indicator ห้ามเรียกว่า "สัญญาณซื้อขาย" — ใช้ "เครื่องมือช่วยอ่านเทรนด์"
4. ⏳ หน้าเรียน (ล็อกตามแพ็กเกจ/วันหมดอายุ) + **แถบความคืบหน้า %, คะแนนแบบฝึกหัด, ranking (คะแนนสูงสุด / เรียนจบไวสุด)** — ranking ให้ผู้เรียนตั้งชื่อเล่นที่แสดงเอง (PDPA) + ที่เก็บวิดีโอ (แนะนำ Bunny Stream / Mux — ยังไม่เลือก)
5. ⏳ Q&A real-time ด้วย Convex — **เฉพาะสมาชิก** (คอมมูนิตี้ + ใต้วิดีโอ) ผู้สอนตอบในเว็บ ไม่ใช้อีเมล · คนทั่วไปเห็นแค่ FAQ + ปุ่มชวนสมัคร
6. ⏳ นโยบายความเป็นส่วนตัว (PDPA), โดเมน, เปิดขายจริง

## บัญชีของแบรนด์
- อีเมลแบรนด์ (เปิดเผยได้): investopia.admin@gmail.com — ใช้กับ Google Cloud (หน้ายินยอมล็อกอิน), บัญชีแอดมินบนเว็บ, อีเมลติดต่อใน footer/ใบเสร็จ Stripe
- GitHub/Convex/Vercel ใช้อีเมลส่วนตัวของเจ้าของ — **ห้ามแสดงอีเมลส่วนตัวบนเว็บ**

## Git
- commit ด้วยชื่อ `MarkJurd` + อีเมล noreply ของ GitHub (ตั้งเฉพาะ repo นี้) — ห้ามใช้อีเมลส่วนตัวของเจ้าของ

## TODO เนื้อหา
- วิดีโอแนะนำตัว: ใส่ `hero.video.youtubeId` หรือ `file`
- รูปผู้สอน: วางไฟล์ใน `public/` แล้วใส่ `instructor.photo: "/me.jpg"`
- ลิงก์โซเชียลใน footer ยังเป็น `#`

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## 🔁 สถานะล่าสุด + งานถัดไป (อัปเดต 2026-10-12 — อ่านส่วนนี้ก่อนเริ่มงาน)
**ใช้งานได้แล้ว:** หน้าเว็บไทย `/` + อังกฤษ `/en` · ล็อกอิน Google · จ่ายเงิน Stripe (โหมดทดสอบ) + webhook เปิดสิทธิ์ · แพ็กเกจ 4 แบบ · เมนูผู้ใช้แบบ avatar dropdown
**ยังไม่ได้ deploy ขึ้นอินเทอร์เน็ต** — ตอนนี้รันในเครื่องเท่านั้น (`npm run dev` → http://localhost:3000)

### วิธีเริ่มงาน (ทุกครั้ง)
1. เปิดเทอร์มินัลในโฟลเดอร์นี้ → `npm run dev` (ต้องเปิดค้างไว้ เว็บถึงจะเข้าได้)
2. ถ้าแก้ไฟล์ใน `convex/` → รัน `npx convex dev` ค้างไว้อีกแท็บ (หรือ `npx convex dev --once`)
3. Windows: ถ้าสั่ง Convex CLI จาก Node script ให้ใช้ `node node_modules/convex/bin/main.js ...` (spawn npx.cmd ตรงๆ ไม่ได้)

### งานเนื้อหา (เจ้าของทำเอง/ใช้ Haiku-Sonnet ก็พอ)
- [ ] ปรับถ้อยคำใน `lib/content.ts` และ `lib/content.en.ts` (แก้ให้ตรงกันทั้ง 2 ไฟล์) — ให้เจ้าของภาษาตรวจ EN โดยเฉพาะ disclaimer/bio
- [ ] รูปผู้สอน → `public/me.jpg` + `instructor.photo: "/me.jpg"` (ทั้ง 2 ภาษา)
- [ ] วิดีโอแนะนำตัว → `hero.video.youtubeId` หรือ `file`
- [ ] ลิงก์ Facebook / YouTube / LINE ใน footer (ยังเป็น `#`)
- [ ] ภาพประกอบอื่นๆ (วางใน `public/`)

### เฟส 4: หน้าเรียน (ใช้ Opus) — ยังไม่เริ่ม
- ต้องตัดสินใจก่อน: ที่เก็บวิดีโอ (แนะนำ Bunny Stream หรือ Mux) + เจ้าของมีวิดีโออัดแล้วหรือยัง
- หน้า `/learn` เฉพาะสมาชิก (เช็กสิทธิ์ฝั่ง server ด้วย `payments.myMembership` logic ห้ามเช็กแค่ฝั่ง client)
- แถบความคืบหน้า %, คะแนนแบบฝึกหัด, ranking (ชื่อเล่นที่ผู้เรียนตั้งเอง — PDPA)
- ระบบจองคิว 1:1 (รายปี 2 ครั้ง / VIP 8 ครั้ง) + ส่ง Indicator ให้คนมีสิทธิ์ (ตอนนี้ต้องส่งเองทางอีเมล)
- แจ้งเตือนใกล้หมดอายุในเว็บ (สัญญาไว้ใน FAQ แล้ว)

### เฟส 5: Q&A คอมมูนิตี้ real-time (Convex) — เฉพาะสมาชิก, รายปี/VIP ติดป้าย "ตอบใน 24 ชม."

### เฟส 6: เช็กลิสต์ก่อนเปิดขายจริง
- [ ] หน้า นโยบายความเป็นส่วนตัว (PDPA) + เงื่อนไขการใช้งาน/การคืนเงิน (ให้คนรู้กฎหมายตรวจ)
- [ ] Convex production deployment + ตั้ง env ทั้งหมดใหม่บน prod (JWT_PRIVATE_KEY, JWKS, SITE_URL=โดเมนจริง, AUTH_GOOGLE_*, STRIPE_*)
- [ ] Google Cloud: เพิ่ม redirect URI ของ prod + กด Publish app (ออกจากโหมด Testing)
- [ ] Stripe: ยืนยันตัวตนบัญชีจริง → ใช้ `sk_live_` + สร้าง webhook ของ prod → ตั้ง `STRIPE_WEBHOOK_SECRET` ของ prod
- [ ] Hosting: Vercel Pro (~$20/เดือน — แพ็กเกจฟรีห้ามใช้เชิงพาณิชย์) หรือ Cloudflare · ผูกโดเมน
- [ ] ลบ/เปลี่ยน `prototypeBanner` (แถบ "โหมดทดสอบ")
- [ ] ลบข้อมูลทดสอบใน Convex dev ที่ไม่ใช้ (สมาชิกรายเดือนจากการซื้อทดสอบ 12 ต.ค.)

### ไฟล์/โฟลเดอร์เก่า (ไม่ใช้แล้ว เก็บไว้อ้างอิง)
- `C:\Users\Mark\investopia` = เว็บ HTML เดิม · `C:\w00d\investopia\Webpage` = โฟลเดอร์ session แรก (มี `.claude/launch.json`)
