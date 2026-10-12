/* หน้าแรก — ข้อความทั้งหมดมาจาก lib/content.ts (อย่าพิมพ์ข้อความลงไฟล์นี้ตรงๆ) */
import { CONTENT as C } from "@/lib/content";
import Effects from "@/components/Effects";
import HeroVideo from "@/components/HeroVideo";
import Curriculum from "@/components/Curriculum";
import Pricing from "@/components/Pricing";
import QABox from "@/components/QABox";

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

export default function Home() {
  const H = C.hero;
  const ins = C.instructor;
  const ticks = C.marquee.items.map((it) => (
    <span className="tick" key={it.sym}>
      <span className="tk">{"logo" in it && it.logo ? <img src={it.logo as string} alt="" /> : it.sym.charAt(0)}</span>
      <b>{it.sym}</b><span className="nm">{it.name}</span>
    </span>
  ));

  return (
    <>
      <div id="scrollBar" />
      {C.prototypeBanner && <div className="protobar">{C.prototypeBanner}</div>}

      <header className="nav" id="nav">
        <div className="container nav-inner">
          <Logo name={C.brand.name} />
          <nav className="nav-links">{C.nav.links.map((l) => <a key={l.href} href={l.href}>{l.text}</a>)}</nav>
          <div className="nav-cta">
            <a href="#pricing" className="btn btn-ghost">{C.nav.ghost}</a>
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
            <h1>{H.title.before}<span className="blue"> {H.title.accent}</span><br />{H.title.after}</h1>
            <p className="lead">{H.lead}</p>
            <div className="hero-cta">
              <a href="#pricing" className="btn btn-primary btn-lg">{H.ctaPrimary}</a>
              <a href="#curriculum" className="btn btn-ghost btn-lg">{H.ctaSecondary}</a>
            </div>
            <div className="hero-points">
              {H.points.map((p) => <div className="hero-point" key={p}><span className="check">✓</span> {p}</div>)}
            </div>
          </div>
          <HeroVideo />
        </div>
      </section>

      {/* แถบหุ้นสหรัฐฯ วิ่ง */}
      <div className="marquee-wrap" aria-hidden="true">
        <div className="marquee"><div className="m-row" id="mRow">{ticks}{ticks}</div></div>
      </div>
      <p className="marquee-note">{C.marquee.note}</p>

      {/* แนะนำคอร์ส + กราฟแท่งเทียนวิ่ง */}
      <section className="section" id="course">
        <div className="container course-grid">
          <div className="chart-card">
            <div className="chart-head"><span className="live" /> <span>{H.chartCaption}</span></div>
            <canvas id="chart" />
            <div className="chart-legend">
              {H.chartLegend.map((l) => (
                <span key={l.text}><i className={`sw ${l.color === "ema" ? "sw-ema" : l.color === "up" ? "sw-up" : "sw-dn"}`} /> {l.text}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">{C.course.eyebrow}</span>
            <h2>{C.course.title}</h2>
            <p className="course-text">{C.course.text}</p>
            <ul className="course-points">
              {C.course.points.map((p) => <li key={p.text}><span className="ic">{p.icon}</span>{p.text}</li>)}
            </ul>
            <a href="#curriculum" className="btn btn-primary">{C.course.cta}</a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="stats">
            {C.stats.map((s, i) => (
              <div className="stat reveal" key={s.label} style={{ "--d": `${i * 0.08}s` } as Vars}>
                <div className="num" data-count={s.count} data-suffix={s.suffix}>0</div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAIN */}
      <section className="section section-soft" id="pain">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{C.pain.eyebrow}</span><h2>{C.pain.title}</h2><p>{C.pain.sub}</p>
          </div>
          <div className="cards-3">
            {C.pain.cards.map((c, i) => (
              <div className="card reveal" key={c.title} style={{ "--d": `${i * 0.1}s` } as Vars}>
                <div className="card-icon">{c.icon}</div><h3>{c.title}</h3><p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section className="section" id="curriculum">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{C.curriculum.eyebrow}</span><h2>{C.curriculum.title}</h2><p>{C.curriculum.sub}</p>
          </div>
          <Curriculum />
        </div>
      </section>

      {/* INSTRUCTOR */}
      <section className="section section-soft" id="instructor">
        <div className="container">
          <div className="section-head"><span className="eyebrow">{ins.eyebrow}</span><h2>{ins.title}</h2></div>
          <div className="instructor reveal">
            <div className={`avatar${ins.photo ? " has-photo" : ""}`}>
              {ins.photo ? <img src={ins.photo} alt={ins.name} /> : ins.initial}
            </div>
            <div>
              <h3 style={{ fontSize: 22, marginBottom: 4 }}>{ins.name}</h3>
              <p style={{ color: "var(--blue)", fontWeight: 600, marginBottom: 14 }}>{ins.role}</p>
              <p style={{ fontSize: 15, marginBottom: 18 }}>{ins.bio}</p>
              <a href="#pricing" className="btn btn-primary">{ins.cta}</a>
            </div>
          </div>
        </div>
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
            {C.footer.copyright}
          </div>
        </div>
      </footer>

      <Effects />
    </>
  );
}
