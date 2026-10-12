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
lib/content.ts        ⭐ ข้อความทั้งหมดของเว็บ (เจ้าของแก้ไฟล์นี้ไฟล์เดียว)
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
- **ห้าม hardcode ข้อความใน .tsx** — ทุกข้อความมาจาก `lib/content.ts`
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
2. 🔧 Convex + ล็อกอินด้วย Google — **โค้ดเสร็จแล้ว** (convex/auth.ts, auth.config.ts, http.ts, schema.ts, users.ts + components/AuthButton.tsx) · ตั้ง JWT_PRIVATE_KEY/JWKS/SITE_URL บน dev แล้ว · **รอเจ้าของสร้าง Google OAuth client แล้วตั้ง AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET เอง**
   - Redirect URI ใน Google Cloud: https://superb-rabbit-529.convex.site/api/auth/callback/google (dev)
   - ตอนขึ้น production: ต้องตั้ง env ชุดเดียวกันบน prod deployment + SITE_URL = โดเมนจริง + เพิ่ม redirect URI ของ prod
   - แอดมิน = บัญชี Google ที่กำหนด (อีเมลแอดมินห้ามแสดงบนเว็บ)
3. ⏳ Stripe Checkout + webhook เปิดสิทธิ์ — แพ็กเกจ (ยืนยันแล้ว): **รายเดือน ฿990/30 วัน · 3 เดือน ฿2,490/90 วัน · รายปี ฿4,990/365 วัน** · จ่ายครั้งเดียวต่อรอบ ไม่ตัดเงินอัตโนมัติ (พร้อมเพย์ + บัตร)
   - รายปีเท่านั้น: ตอบคำถามภายใน 24 ชม. (รายเดือน/3 เดือน **ห้ามระบุเวลาตอบ**), ปรึกษา 1:1 = โค้ชด้านการเรียน (ห้ามดูพอร์ต/แนะนำหุ้น), คอร์สใหม่, โบนัสเช็กลิสต์ก่อนกดซื้อ, **Indicator (มูลค่า ฿2,990) เฉพาะ 50 คนแรก** → ระบบต้องนับลำดับผู้ซื้อรายปี
   - ทุกแพ็กเกจ: Live กลุ่มเดือนละครั้ง + ดูย้อนหลังได้ · **รับประกันคืนเงินเต็มจำนวนภายใน 7 วันหลังชำระ** (รับประกันความพอใจ ไม่ใช่กำไร)
   - **VIP ตัวต่อตัว ฿13,990** (ยืนยันแล้ว): เรียน 8 โมดูลแบบ 1:1 (8 × 1.5 ชม.) + ดูวิดีโอได้ + ทุกอย่างในรายปี 1 ปี + Indicator · **จำกัด 3 ที่/เดือน** (อาจเพิ่มเป็น 5 ภายหลัง) · คืนเงินได้ก่อนเริ่มเรียนครั้งแรกเท่านั้น
   - Live กลุ่ม: เดือนละ 1 ครั้งรวมทุกคน · รายปีได้ 1:1 = 2 ครั้ง (ยืนยันแล้ว)
   - ไม่มีการทบทวนพอร์ตในทุกแพ็กเกจ (เจ้าของไม่ใช่ผู้จัดการกองทุน)
   - Indicator ห้ามเรียกว่า "สัญญาณซื้อขาย" — ใช้ "เครื่องมือช่วยอ่านเทรนด์"
4. ⏳ หน้าเรียน (ล็อกตามแพ็กเกจ/วันหมดอายุ) + **แถบความคืบหน้า %, คะแนนแบบฝึกหัด, ranking (คะแนนสูงสุด / เรียนจบไวสุด)** — ranking ให้ผู้เรียนตั้งชื่อเล่นที่แสดงเอง (PDPA) + ที่เก็บวิดีโอ (แนะนำ Bunny Stream / Mux — ยังไม่เลือก)
5. ⏳ Q&A real-time ด้วย Convex — **เฉพาะสมาชิก** (คอมมูนิตี้ + ใต้วิดีโอ) ผู้สอนตอบในเว็บ ไม่ใช้อีเมล · คนทั่วไปเห็นแค่ FAQ + ปุ่มชวนสมัคร
6. ⏳ นโยบายความเป็นส่วนตัว (PDPA), โดเมน, เปิดขายจริง

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
