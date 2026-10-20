/* หน้าแรก — ข้อความมาจาก lib/content.ts
 * อย่าพิมพ์ข้อความลงไฟล์นี้ตรงๆ */
import Link from "next/link";
import InstructorIntro from "@/components/InstructorIntro";
import { ContentProvider, type Content } from "@/components/ContentContext";
import Effects from "@/components/Effects";
import HeroStage from "@/components/HeroStage";
import Reviews from "@/components/Reviews";
import CourseCards from "@/components/CourseCards";
import Pricing from "@/components/Pricing";
import QABox from "@/components/QABox";
import AuthButton from "@/components/AuthButton";
import CheckoutBanner from "@/components/CheckoutBanner";

type Vars = React.CSSProperties & Record<`--${string}`, string>;

// รูปทรงลอยหลัง Hero: s = ความเร็วตอนเลื่อน, r = การหมุน
const SHAPES = [
  { cls: "s-circle", s: ".35", r: "0",    st: { width: 260, height: 260, left: -90, top: 40 } },
  { cls: "s-ring",   s: ".2",  r: ".15",  st: { width: 150, height: 150, right: "6%", top: 30 } },
  { cls: "s-sq",     s: ".5",  r: "-.25", st: { width: 64, height: 64, left: "44%", bottom: 40 } },
  { cls: "s-bars",   s: ".28", r: ".08",  st: { left: "6%", bottom: 60 }, bars: [26, 44, 64] },
  { cls: "s-dot",    s: ".6",  r: "0",    st: { width: 20, height: 20, left: "42%", top: 80 } },
  { cls: "s-circle", s: ".15", r: "0",    st: { width: 130, height: 130, right: -30, bottom: -20 } },
];

function Logo({ name }: { name: string }) {
  return (
    <a href="#" className="logo">
      <img src="/logo.svg" alt="" className="logo-mark" width={32} height={32} />
      <span>{name}</span>
    </a>
  );
}

export default function HomePage({ C }: { C: Content }) {
  const H = C.hero;

  return (
    <ContentProvider value={C}>
    <div lang={C.locale.code}>
      <div id="scrollBar" />
      {C.prototypeBanner && <div className="protobar">{C.prototypeBanner}</div>}
      <CheckoutBanner />

      <header className="nav" id="nav">
        <div className="container nav-inner">
          <Logo name={C.brand.name} />
          <nav className="nav-links">{C.nav.links.map((l) => <a key={l.href} href={l.href}>{l.text}</a>)}</nav>
          <div className="nav-cta">
            <AuthButton />
            <a href="#pricing" className="btn btn-primary">{C.nav.primary}</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="shapes" aria-hidden="true">
          {SHAPES.map((sh, i) => (
            <div key={i} className={`shape ${sh.cls}`} data-s={sh.s} data-r={sh.r} style={sh.st}>
              {sh.bars?.map((h) => <i key={h} style={{ height: h }} />)}
            </div>
          ))}
        </div>
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">{H.eyebrow}</span>
            {/* หัวข้อ 3 บรรทัด: แต่ละบรรทัดไม่ถูกตัดกลางคำ */}
            <h1><span>{H.title.before}</span><span className="blue">{H.title.accent}</span><span>{H.title.after}</span></h1>
            <p className="lead">{H.lead}</p>
            <div className="hero-cta">
              <Link href="/learn" className="btn btn-free btn-lg">▶ {H.ctaFree}</Link>
              <a href="#pricing" className="btn btn-ghost btn-lg">{H.ctaPrimary}</a>
              <span className="free-hint">{H.ctaFreeHint}</span>
            </div>
            <div className="hero-points">
              {H.points.map((p) => <div className="hero-point" key={p}><span className="check">✓</span> {p}</div>)}
            </div>
          </div>
          <HeroStage H={H} />
        </div>
      </section>

      {/* แถบจุดเด่น */}
      <div className="facts"><div className="container">{C.facts.map((f) => <span key={f}>{f}</span>)}</div></div>

      {/* เลือกคอร์ส */}
      <CourseCards />

      {/* รีวิว */}
      <Reviews />

      {/* FIT */}
      <section className="section" id="fit">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{C.fit.eyebrow}</span><h2>{C.fit.title}</h2><p>{C.fit.sub}</p>
          </div>
          <div className="fit-grid">
            <div className="card fit-card yes reveal">
              <h3>{C.fit.yesTitle}</h3>
              <ul>{C.fit.yes.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="card fit-card no reveal" style={{ "--d": "0.1s" } as Vars}>
              <h3>{C.fit.noTitle}</h3>
              <ul>{C.fit.no.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      {/* INSTRUCTOR */}
      <section className="ins-section" id="instructor">
        <InstructorIntro />
      </section>

      {/* PRICING */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{C.pricing.eyebrow}</span><h2>{C.pricing.title}</h2><p>{C.pricing.sub}</p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-soft" id="faq">
        <div className="container">
          <div className="section-head"><span className="eyebrow">{C.faq.eyebrow}</span><h2>{C.faq.title}</h2><p>{C.faq.sub}</p></div>
          <div className="faq">
            {C.faq.items.map((f, i) => (
              <details key={f.q} open={i === 0}><summary>{f.q}</summary><div className="ans">{f.a}</div></details>
            ))}
          </div>
          <QABox />
        </div>
      </section>

      {/* CTA BAND */}
      <section className="section">
        <div className="container">
          <div className="cta-band reveal">
            <h2>{C.cta.title}</h2><p>{C.cta.sub}</p>
            <a href="#pricing" className="btn btn-lg">{C.cta.button}</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="foot-grid">
            <div><Logo name={C.brand.name} /><p>{C.footer.about}</p></div>
            <div className="foot-col"><h5>{C.footer.menuTitle}</h5>{C.footer.menu.map((m) => <a key={m.text} href={m.href}>{m.text}</a>)}</div>
            <div className="foot-col"><h5>{C.footer.contactTitle}</h5>{C.footer.contact.map((m) => <a key={m.text} href={m.href}>{m.text}</a>)}</div>
          </div>
          <div className="disclaimer">
            <strong style={{ color: "var(--body)" }}>{C.footer.disclaimerLabel}</strong> {C.footer.disclaimer}<br /><br />
            <span className="legal-links"><a href="/privacy">{C.legal.footerPrivacy}</a> · <a href="/terms">{C.legal.footerTerms}</a></span><br />
            {C.footer.copyright}
          </div>
        </div>
      </footer>

      <Effects />
    </div>
    </ContentProvider>
  );
}
