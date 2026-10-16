/* โครงหน้าของเครื่องมือ (/tools/...) — เมนูบน + ส่วนท้าย ใช้ร่วมกันทุกเครื่องมือและทั้ง 2 ภาษา
 * ข้อความมาจาก lib/content.ts (อย่าพิมพ์ข้อความลงไฟล์นี้ตรงๆ) */
import Link from "next/link";
import { ContentProvider, type Content } from "@/components/ContentContext";
import AuthButton from "@/components/AuthButton";

export default function ToolsShell({ C, chip, children }: { C: Content; path?: string; chip?: string; children: React.ReactNode }) {
  return (
    <ContentProvider value={C}>
      <div lang={C.locale.code} className="tool-shell">
        <header className="nav scrolled">
          <div className="container nav-inner">
            <div className="learn-brand">
              <Link href={C.locale.base} className="logo">
                <img src="/logo.svg" alt="" className="logo-mark" width={32} height={32} />
                <span>{C.brand.name}</span>
              </Link>
              <span className="learn-chip">{chip ?? C.dividend.tools}</span>
            </div>
            <div className="nav-cta">
              <AuthButton />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <div className="container">
            <div className="disclaimer">
              <strong style={{ color: "var(--body)" }}>{C.footer.disclaimerLabel}</strong> {C.footer.disclaimer}<br /><br />
              <span className="legal-links"><Link href="/privacy">{C.legal.footerPrivacy}</Link> · <Link href="/terms">{C.legal.footerTerms}</Link></span><br />
              {C.footer.copyright}
            </div>
          </div>
        </footer>
      </div>
    </ContentProvider>
  );
}
