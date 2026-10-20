/* หน้ากฎหมาย (/privacy, /terms) — ข้อความทั้งหมดอยู่ที่ lib/content.ts → legal
 * {operator} และ {email} ในข้อความจะถูกแทนด้วยค่าใน legal.operator / legal.email */
import Link from "next/link";
import ToolsShell from "@/components/tools/ToolsShell";
import type { Content } from "@/components/ContentContext";

type Doc = Content["legal"]["privacy"];

export default function LegalPage({ C, doc, path }: { C: Content; doc: Doc; path: string }) {
  const L = C.legal;
  const fill = (s: string) => s.replaceAll("{operator}", L.operator).replaceAll("{email}", L.email);
  return (
    <ToolsShell C={C} path={path} chip={L.chip}>
      <article className="container legal">
        <Link href={C.locale.base} className="tool-back">{L.backHome}</Link>
        <h1>{doc.title}</h1>
        <p className="legal-updated">{L.updatedLabel}: {L.updated}</p>
        <p className="legal-intro">{fill(doc.intro)}</p>
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((para, i) => <p key={i}>{fill(para)}</p>)}
            {s.list.length > 0 && <ul>{s.list.map((li, i) => <li key={i}>{fill(li)}</li>)}</ul>}
          </section>
        ))}
      </article>
    </ToolsShell>
  );
}
