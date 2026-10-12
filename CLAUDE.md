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
2. ⏳ Convex + ล็อกอิน — **ล็อกอินด้วย Google เท่านั้น** (เลือกแล้ว) · แอดมิน = บัญชี Google ที่กำหนดไว้ (อีเมลแอดมินห้ามแสดงบนเว็บ — เจ้าของไม่อยากเปิดเผยอีเมลส่วนตัว)
3. ⏳ Stripe Checkout + webhook เปิดสิทธิ์ — **2 แพ็กเกจ (ยืนยันแล้ว): รายเดือน ฿990 = 30 วัน, รายปี ฿4,990 = 365 วัน** · จ่ายครั้งเดียวต่อรอบ **ไม่ตัดเงินอัตโนมัติ** (พร้อมเพย์ + บัตร) · ใกล้หมดอายุแจ้งเตือนในเว็บ · ตัด 3 เดือน/Lifetime ออกแล้ว
4. ⏳ หน้าเรียน (ล็อกตามแพ็กเกจ/วันหมดอายุ) + ที่เก็บวิดีโอ (แนะนำ Bunny Stream / Mux — ยังไม่เลือก)
5. ⏳ Q&A real-time ด้วย Convex — **เฉพาะสมาชิก** (คอมมูนิตี้ + ใต้วิดีโอ) ผู้สอนตอบในเว็บ ไม่ใช้อีเมล · คนทั่วไปเห็นแค่ FAQ + ปุ่มชวนสมัคร
6. ⏳ นโยบายความเป็นส่วนตัว (PDPA), โดเมน, เปิดขายจริง

## Git
- commit ด้วยชื่อ `MarkJurd` + อีเมล noreply ของ GitHub (ตั้งเฉพาะ repo นี้) — ห้ามใช้อีเมลส่วนตัวของเจ้าของ

## TODO เนื้อหา
- วิดีโอแนะนำตัว: ใส่ `hero.video.youtubeId` หรือ `file`
- รูปผู้สอน: วางไฟล์ใน `public/` แล้วใส่ `instructor.photo: "/me.jpg"`
- ลิงก์โซเชียลใน footer ยังเป็น `#`
