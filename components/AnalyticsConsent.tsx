"use client";

/* แบนเนอร์ขอความยินยอม + Microsoft Clarity (โหลดหลังกดยอมรับเท่านั้น, เฉพาะหน้าสาธารณะ)
 * ข้อความอยู่ที่ content.ts → consent · ไม่ตั้ง NEXT_PUBLIC_CLARITY_ID = ไม่แสดงแบนเนอร์ ไม่โหลดอะไร
 * ลิงก์ในเว็บที่ชี้ #analytics-settings จะเปิดแบนเนอร์อีกครั้ง เพื่อเปลี่ยนใจ/ถอนความยินยอม */
import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Content } from "@/components/ContentContext";

type Clarity = (...args: unknown[]) => void;
type Win = Window & { clarity?: Clarity & { q?: unknown[] } };

const ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const KEY = "investopia-analytics-consent";
const EVENT = "investopia-analytics-consent";
const HASH = "#analytics-settings";
const PRIVATE = /^(\/en)?\/(admin|learn|community)(\/|$)/;

let saved: string | null = null;  // ใช้แทนเมื่อเบราว์เซอร์ปิด local storage
let clarity: "idle" | "on" | "off" = "idle";

function read() {
  try { return localStorage.getItem(KEY) ?? saved; } catch { return saved; }
}
function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
function decide(value: "yes" | "no") {
  saved = value;
  try { localStorage.setItem(KEY, value); } catch { /* จำแค่หน้านี้ */ }
  window.dispatchEvent(new Event(EVENT));
}
function loadClarity() {
  const w = window as Win;
  w.clarity ??= Object.assign((...args: unknown[]) => { (w.clarity!.q ??= []).push(args); }, {});
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${encodeURIComponent(ID!)}`;
  document.head.appendChild(s);
  w.clarity("consent");
}

export default function AnalyticsConsent({ th, en }: { th: Content["consent"]; en: Content["consent"] }) {
  const path = usePathname();
  const choice = useSyncExternalStore(subscribe, read, () => "server");
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const onHash = () => {
      if (location.hash !== HASH) return;
      setReopened(true);
      history.replaceState(null, "", location.pathname + location.search);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!ID) return;
    const allowed = choice === "yes" && !PRIVATE.test(path);
    // ?code= คือรหัสล็อกอิน Google ตอนกลับเข้าเว็บ — ไม่ให้ติดไปกับ URL ที่บันทึก
    if (allowed && clarity === "idle" && !new URLSearchParams(location.search).has("code")) {
      loadClarity();
      clarity = "on";
    } else if (!allowed && clarity === "on") {
      const w = window as Win;
      if (choice === "no") w.clarity?.("consent", false);  // ลบคุกกี้ของ Clarity
      w.clarity?.("stop");
      // shortcut: หยุดแล้วไม่เริ่มใหม่จนกว่าจะโหลดหน้าใหม่, ถ้าอยากได้ช่วงกลับจาก /learn ค่อยเรียก start
      clarity = "off";
    }
  }, [choice, path]);

  if (!ID || PRIVATE.test(path) || choice === "server" || (choice !== null && !reopened)) return null;

  const isEn = /^\/en(\/|$)/.test(path);
  const T = isEn ? en : th;
  const pick = (value: "yes" | "no") => { decide(value); setReopened(false); };
  return (
    <div className="consent" role="dialog" aria-label={T.title} lang={isEn ? "en" : "th"}>
      <p><strong>{T.title}</strong> {T.text} <Link href={isEn ? "/en/privacy" : "/privacy"}>{T.more}</Link></p>
      <div className="consent-btns">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => pick("no")}>{T.decline}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => pick("yes")}>{T.accept}</button>
      </div>
    </div>
  );
}
