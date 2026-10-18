/* งานดูแลข้อมูลแบบครั้งเดียว (internal เท่านั้น — เรียกได้จาก CLI/Convex dashboard ไม่ใช่จากหน้าเว็บ)
 * markTestPurchasesRefunded: รายการซื้อที่ทำในโหมดทดสอบของ Stripe (stripeSessionId ขึ้นต้น "cs_test_") ที่ค้างอยู่ใน prod
 *   → ปรับสถานะเป็น "refunded" เพื่อไม่ให้นับเป็นรายได้ในหน้ายอดขาย (ไม่ลบข้อมูล ยังเห็นเป็นแถวที่มีหมายเหตุ) */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const markTestPurchasesRefunded = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const rows = await ctx.db.query("memberships").order("desc").take(1000);
    let n = 0;
    for (const m of rows) {
      if (!m.stripeSessionId.startsWith("cs_test_") || m.status === "refunded") continue;
      await ctx.db.patch("memberships", m._id, {
        status: "refunded",
        changedAt: Date.now(),
        note: [m.note, "รายการทดสอบ (โหมดทดสอบของ Stripe) — ไม่ใช่เงินจริง"].filter(Boolean).join(" · "),
      });
      n++;
    }
    return n;
  },
});
