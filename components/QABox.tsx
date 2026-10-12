/* กล่องท้าย FAQ — Q&A เปิดเฉพาะสมาชิก (คอมมูนิตี้สมาชิกจะทำในเฟส Q&A ด้วย Convex)
 * คนทั่วไปเห็นแค่ปุ่มชวนสมัคร */
import { CONTENT } from "@/lib/content";

export default function QABox() {
  const F = CONTENT.faq;
  return (
    <div style={{ maxWidth: 620, margin: "32px auto 0", background: "#fff", border: "1px solid var(--line)", borderRadius: 16, padding: 26, textAlign: "center" }}>
      <h3 style={{ fontSize: 17, marginBottom: 6 }}>{F.qaTitle}</h3>
      <p style={{ fontSize: 14, marginBottom: 16 }}>{F.qaSub}</p>
      <a href="#pricing" className="btn btn-primary">{F.qaButton}</a>
    </div>
  );
}
