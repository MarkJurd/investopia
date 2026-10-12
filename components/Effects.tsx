"use client";

/* เอฟเฟกต์ทั้งหน้า (ย้ายมาจาก app.js เดิม) — ไม่ต้องแก้ตอนแก้เนื้อหา
 * แถบความคืบหน้า, nav, reveal, count-up, รูปทรงลอย + แถบหุ้นวิ่ง, กราฟแท่งเทียนวิ่ง */
import { useEffect } from "react";

export default function Effects() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    /* ---- Reveal on scroll ---- */
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    /* ---- Count-up stats ---- */
    const countUp = (el: HTMLElement) => {
      const target = +(el.dataset.count || 0), suffix = el.dataset.suffix || "";
      if (reduce) { el.textContent = target + suffix; return; }
      const dur = 1400, start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const statIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { countUp(en.target as HTMLElement); statIO.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => statIO.observe(el));
    cleanups.push(() => statIO.disconnect());

    /* ---- Scroll progress + nav ---- */
    const bar = document.getElementById("scrollBar");
    const nav = document.getElementById("nav");
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1);
      if (bar) bar.style.transform = `scaleX(${p})`;
      nav?.classList.toggle("scrolled", h.scrollTop > 16);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    /* ---- รูปทรงลอยหลัง Hero + แถบหุ้นวิ่ง (เร่งเมื่อเลื่อน) ---- */
    if (!reduce) {
      const shapes = document.querySelectorAll<HTMLElement>(".shape");
      const heroEl = document.getElementById("hero");
      const mrow = document.getElementById("mRow");
      let mx = 0, my = 0, mxs = 0, mys = 0, mx0 = 0, lastY = window.scrollY, boost = 0, raf = 0;
      const onMove = (e: MouseEvent) => {
        if (!heroEl) return;
        const r = heroEl.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
      };
      heroEl?.addEventListener("mousemove", onMove);
      const loop = () => {
        const y = Math.min(window.scrollY, window.innerHeight * 1.5);
        mxs += (mx - mxs) * 0.08; mys += (my - mys) * 0.08;
        shapes.forEach((el) => {
          const sp = +(el.dataset.s || 0), rt = +(el.dataset.r || 0);
          el.style.transform = `translate(${mxs * sp * 60}px,${y * sp + mys * sp * 60}px) rotate(${y * rt}deg)`;
        });
        boost = boost * 0.9 + Math.abs(window.scrollY - lastY) * 0.1; lastY = window.scrollY;
        if (mrow && mrow.scrollWidth) {
          mx0 = (mx0 + 0.6 + boost * 0.8) % (mrow.scrollWidth / 2);
          mrow.style.transform = `translateX(${-mx0}px)`;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      cleanups.push(() => { cancelAnimationFrame(raf); heroEl?.removeEventListener("mousemove", onMove); });
    }

    /* ---- กราฟแท่งเทียนวิ่ง ---- */
    const canvas = document.getElementById("chart") as HTMLCanvasElement | null;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      let W = 0, H = 0;
      const COUNT = 34;
      type K = { o: number; h: number; l: number; c: number };
      const data: K[] = [];
      const makeCandle = (prevClose: number, drift: number): K => {
        const o = prevClose, c = o + (Math.random() - 0.5) * 2.4 + drift;
        return { o, c, h: Math.max(o, c) + Math.random() * 1.5, l: Math.min(o, c) - Math.random() * 1.5 };
      };
      let price = 100;
      for (let i = 0; i < COUNT; i++) { const k = makeCandle(price, 0.35); data.push(k); price = k.c; }
      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        W = canvas.clientWidth; H = canvas.clientHeight;
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const ema = (period: number) => {
        const k = 2 / (period + 1), out: number[] = [];
        let prev = data[0].c;
        data.forEach((d, i) => { const v = i === 0 ? d.c : d.c * k + prev * (1 - k); out.push(v); prev = v; });
        return out;
      };
      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        const padT = 16, padB = 16, padL = 10, padR = 10;
        const e = ema(9);
        let hi = -Infinity, lo = Infinity;
        data.forEach((d, i) => { hi = Math.max(hi, d.h, e[i]); lo = Math.min(lo, d.l, e[i]); });
        const range = (hi - lo) || 1;
        const x = (i: number) => padL + (W - padL - padR) * (i / (data.length - 1));
        const y = (v: number) => padT + (H - padT - padB) * (1 - (v - lo) / range);
        const cw = Math.max(3, (W - padL - padR) / data.length * 0.58);
        ctx.strokeStyle = "rgba(148,163,184,.14)"; ctx.lineWidth = 1;
        for (let g = 0; g <= 3; g++) { const yy = padT + (H - padT - padB) * g / 3; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
        data.forEach((d, i) => {
          const cx = x(i), up = d.c >= d.o;
          ctx.strokeStyle = ctx.fillStyle = up ? "#22C55E" : "#EF4444";
          ctx.beginPath(); ctx.moveTo(cx, y(d.h)); ctx.lineTo(cx, y(d.l)); ctx.stroke();
          const yo = y(d.o), yc = y(d.c);
          ctx.fillRect(cx - cw / 2, Math.min(yo, yc), cw, Math.max(1.5, Math.abs(yc - yo)));
        });
        ctx.beginPath(); ctx.strokeStyle = "#2563EB"; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
        e.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))));
        ctx.stroke();
      };
      const onResize = () => { resize(); draw(); };
      resize(); draw();
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));
      if (!reduce) {
        const iv = setInterval(() => { const last = data[data.length - 1]; data.shift(); data.push(makeCandle(last.c, 0.3)); draw(); }, 1500);
        cleanups.push(() => clearInterval(iv));
      }
    }

    return () => cleanups.forEach((f) => f());
  }, []);

  return null;
}
