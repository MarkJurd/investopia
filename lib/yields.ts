/* =============================================================================
 * ข้อมูลสำหรับ "ตัวคำนวณปันผล" (/tools/dividend) — แก้ตัวเลข Yield / ภาษี ที่นี่ที่เดียว
 * =============================================================================
 * วิธีอัปเดต:
 *   1. แก้ YIELDS_AS_OF เป็นวันที่ของข้อมูล (รูปแบบ "ปี-เดือน-วัน" เช่น "2026-10-10")
 *   2. แก้ yield (%) และ tax (%) ของแต่ละแถว — ตัวเลขเป็น "เปอร์เซ็นต์" เช่น 4.62 = 4.62%
 *   3. Net Yield (หลังหักภาษี) ระบบคำนวณเอง = yield × (1 − tax ÷ 100) ไม่ต้องกรอก
 *   4. เพิ่มแถวใหม่: คัดลอกแถวเดิมแล้วเปลี่ยน id (ต้องไม่ซ้ำ) + group ให้ตรงกับกลุ่มด้านล่าง
 *   5. ข้อความไทย/อังกฤษของแต่ละแถวอยู่ในแถวนี้ (desc / extra) ส่วนชื่อกลุ่มอยู่ใน lib/content.ts และ content.en.ts
 *
 * กติกา: ใส่เฉพาะข้อเท็จจริง (ชื่อดัชนี/กองทุน, Yield, ภาษี) — ห้ามใส่คำว่า "น่าซื้อ/แนะนำ/ดีกว่า"
 * ========================================================================== */

export type YieldGroup = "thEquity" | "thBond" | "globalEquity" | "reit" | "usBond" | "coveredCall";

export type Bilingual = { th: string; en: string };

export type YieldRow = {
  id: string;
  name: string;          // ชื่อดัชนี/กองทุน (ใช้ชื่อทางการ ไม่แปล)
  code: string;          // ตัวย่อ/ticker ("" = ไม่มี)
  group: YieldGroup;
  desc: Bilingual;       // คำอธิบายสั้น
  yield: number;         // Yield ต่อปี (%) ก่อนหักภาษี
  tax: number;           // ภาษีที่ใช้คิด (%)
  extra?: Bilingual;     // หมายเหตุเพิ่มเติม (ไม่ต้องการก็ลบบรรทัดนี้)
};

/** วันที่ของข้อมูลในตารางนี้ (แสดงบนหน้าเว็บ) */
export const YIELDS_AS_OF = "2026-10-10";

/** ลำดับกลุ่มบนหน้าเว็บ */
export const YIELD_GROUPS: YieldGroup[] = ["thEquity", "thBond", "globalEquity", "reit", "usBond", "coveredCall"];

export const YIELD_ROWS: YieldRow[] = [
  /* ---------- หุ้นไทย ---------- */
  { id: "set50", name: "SET50", code: "", group: "thEquity",
    desc: { th: "หุ้นไทยขนาดใหญ่", en: "Thai large cap" }, yield: 4.62, tax: 10 },
  { id: "sethd", name: "SETHD", code: "", group: "thEquity",
    desc: { th: "หุ้นไทยปันผลสูง", en: "Thai high dividend" }, yield: 5.92, tax: 10 },

  /* ---------- พันธบัตร/ตราสารหนี้ไทย ---------- */
  { id: "th-gov", name: "Thai Gov Bond", code: "", group: "thBond",
    desc: { th: "พันธบัตรรัฐบาลไทย", en: "Thai government bond" }, yield: 2.79, tax: 15 },
  { id: "th-lt-gov", name: "Thai LT Gov Bond", code: "", group: "thBond",
    desc: { th: "พันธบัตรรัฐบาลไทยระยะยาว", en: "Thai long-term government bond" }, yield: 3.13, tax: 15,
    extra: { th: "อายุมากกว่า 10 ปี", en: "Over 10 years" } },
  { id: "th-ig", name: "Thai IG Bond", code: "", group: "thBond",
    desc: { th: "หุ้นกู้เอกชนไทยเกรดลงทุนได้", en: "Thai investment-grade bond" }, yield: 2.39, tax: 15 },
  { id: "th-lt-ig", name: "Thai LT IG Bond", code: "", group: "thBond",
    desc: { th: "หุ้นกู้เอกชนไทยเกรดลงทุนได้ ระยะยาว", en: "Thai long-term investment-grade bond" }, yield: 3.15, tax: 15,
    extra: { th: "เรตติ้ง A+ · 7.16 ปี", en: "Rating A+ · 7.16 years" } },
  { id: "th-hy", name: "Thai HY Bond", code: "", group: "thBond",
    desc: { th: "หุ้นกู้เอกชนไทยผลตอบแทนสูง (ความเสี่ยงสูงกว่า)", en: "Thai high-yield bond (higher risk)" }, yield: 7.06, tax: 15,
    extra: { th: "เรตติ้ง BBB- · 7.01 ปี", en: "Rating BBB- · 7.01 years" } },

  /* ---------- หุ้นปันผลต่างประเทศ ---------- */
  { id: "spyd", name: "S&P 500 High Dividend", code: "SPYD", group: "globalEquity",
    desc: { th: "หุ้นสหรัฐฯ ขนาดใหญ่ ปันผลสูง", en: "US large cap high dividend" }, yield: 4.50, tax: 15 },
  { id: "schd", name: "Dow Jones U.S. Dividend 100 Index", code: "SCHD", group: "globalEquity",
    desc: { th: "หุ้นสหรัฐฯ ขนาดใหญ่ ปันผลสูง", en: "US large cap high dividend" }, yield: 3.18, tax: 15 },
  { id: "vym", name: "FTSE High Dividend Yield Index", code: "VYM", group: "globalEquity",
    desc: { th: "หุ้นสหรัฐฯ ปันผลสูง", en: "US high dividend" }, yield: 2.32, tax: 15 },
  { id: "vymi", name: "FTSE All-World ex US High Dividend Yield Index", code: "VYMI", group: "globalEquity",
    desc: { th: "หุ้นปันผลสูงนอกสหรัฐฯ", en: "Ex-US high dividend" }, yield: 3.72, tax: 15 },
  { id: "wdiv", name: "S&P Global Dividend Aristocrats Index", code: "WDIV", group: "globalEquity",
    desc: { th: "หุ้นปันผลทั่วโลกที่จ่ายปันผลต่อเนื่องยาวนาน", en: "Global dividend aristocrats" }, yield: 4.29, tax: 15 },
  { id: "3116", name: "Solactive Asia Pacific High Dividend Yield Index", code: "3116", group: "globalEquity",
    desc: { th: "หุ้นเอเชีย-แปซิฟิก ปันผลสูง", en: "Asia high dividend" }, yield: 4.08, tax: 0 },

  /* ---------- REIT (อสังหาริมทรัพย์) ---------- */
  { id: "reet", name: "FTSE EPRA Nareit Global REITs Index", code: "REET", group: "reit",
    desc: { th: "REIT ทั่วโลก", en: "Global REIT" }, yield: 3.65, tax: 15 },
  { id: "vnq", name: "MSCI US Investable Market Real Estate 25/50 Index", code: "VNQ", group: "reit",
    desc: { th: "REIT สหรัฐฯ", en: "US REIT" }, yield: 3.81, tax: 15 },
  { id: "vnqi", name: "S&P Global ex-U.S. Property Index", code: "VNQI", group: "reit",
    desc: { th: "REIT นอกสหรัฐฯ", en: "Global ex-US REIT" }, yield: 5.16, tax: 15 },
  { id: "sret", name: "Solactive Global SuperDividend REIT Index", code: "SRET", group: "reit",
    desc: { th: "REIT ทั่วโลก ปันผลสูง", en: "Global high dividend REIT" }, yield: 9.82, tax: 15 },

  /* ---------- พันธบัตร/ตราสารหนี้สหรัฐฯ และทั่วโลก ---------- */
  { id: "vglt", name: "Spl Bloomberg US Long Treasury Index", code: "VGLT", group: "usBond",
    desc: { th: "พันธบัตรรัฐบาลสหรัฐฯ ระยะยาว", en: "US long-term government bond" }, yield: 5.04, tax: 0 },
  { id: "vclt", name: "Bloomberg U.S. 10+ Year Corporate Bond Index", code: "VCLT", group: "usBond",
    desc: { th: "หุ้นกู้เอกชนสหรัฐฯ เกรดลงทุนได้ ระยะยาว", en: "US long-term investment-grade corporate bond" }, yield: 6.01, tax: 15 },
  { id: "bndw", name: "Bloomberg Global Aggregate Float Adjusted Composite Index", code: "BNDW", group: "usBond",
    desc: { th: "ตราสารหนี้ทั่วโลก", en: "Global bond" }, yield: 4.42, tax: 15 },
  { id: "hyg", name: "iBoxx USD Liquid High Yield Index", code: "HYG", group: "usBond",
    desc: { th: "หุ้นกู้ผลตอบแทนสูงสหรัฐฯ (ความเสี่ยงสูงกว่า)", en: "US high-yield bond (higher risk)" }, yield: 6.09, tax: 15 },
  { id: "ghyg", name: "iBoxx Global Developed Markets High Yield Index", code: "GHYG", group: "usBond",
    desc: { th: "หุ้นกู้ผลตอบแทนสูงตลาดพัฒนาแล้ว (ความเสี่ยงสูงกว่า)", en: "Developed-market high-yield bond (higher risk)" }, yield: 6.51, tax: 15 },

  /* ---------- Covered Call ---------- */
  { id: "pbp", name: "S&P 500 Covered Call", code: "PBP", group: "coveredCall",
    desc: { th: "หุ้น S&P 500 + ขายสิทธิ์ Call", en: "S&P 500 covered call" }, yield: 11.28, tax: 15,
    extra: { th: "รูปแบบคล้าย JEPI", en: "Similar in style to JEPI" } },
  { id: "jepq", name: "Nasdaq 100 Covered Call", code: "JEPQ", group: "coveredCall",
    desc: { th: "หุ้น Nasdaq 100 + ขายสิทธิ์ Call", en: "Nasdaq 100 covered call" }, yield: 11.30, tax: 15 },
];

/** Yield หลังหักภาษี (%) */
export const netYield = (r: Pick<YieldRow, "yield" | "tax">): number => r.yield * (1 - r.tax / 100);
