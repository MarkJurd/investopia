/* เครื่องมือเล็กๆ ของคอมมูนิตี้: ลิงก์ · เวลา · ข้อความ error · ย่อรูปก่อนอัปโหลด */
import { ConvexError } from "convex/values";
import type { Content } from "@/components/ContentContext";

/** เวลาตอนโหลดหน้า (ปัดเป็นนาที) ใช้ร่วมกันทุก query เพื่อให้ใช้ subscription เดียวกัน — เซิร์ฟเวอร์ใช้ค่าที่ใหม่กว่าเสมอ */
export const BOOT_NOW = Math.floor(Date.now() / 60000) * 60000;

export function communityPath(C: Content, postId?: string): string {
  const base = C.locale.base === "/" ? "" : C.locale.base;
  return `${base}/community${postId ? `/${postId}` : ""}`;
}

export function langOf(C: Content): "th" | "en" {
  return C.locale.code === "en" ? "en" : "th";
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400], ["month", 30 * 86400], ["week", 7 * 86400], ["day", 86400], ["hour", 3600], ["minute", 60],
];

/** "5 นาทีที่แล้ว" / "5 minutes ago" */
export function timeAgo(ts: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diff = Math.round((ts - Date.now()) / 1000);
  for (const [unit, sec] of UNITS) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return rtf.format(0, "second");
}

/** รหัส error จาก server (ConvexError) → ข้อความที่แสดงให้ผู้ใช้ */
export function errorText(err: unknown, C: Content): string {
  const D = C.community;
  const code = err instanceof ConvexError && typeof err.data === "string" ? err.data : "";
  switch (code) {
    case "RATE_LIMIT": return D.errRateLimit;
    case "BAD_IMAGE": case "TOO_MANY_IMAGES": return D.errImage;
    case "TOO_LONG": return D.errTooLong;
    case "EMPTY": return D.errEmpty;
    case "NAME_INVALID": return D.nameInvalid;
    case "NAME_RESERVED": return D.nameReserved;
    default: return D.errGeneric;
  }
}

/** ย่อรูปที่ใหญ่เกินไป (ด้านยาวสุด 1600px, JPEG) — ภาพถ่ายจากมือถือมักใหญ่กว่า 5 MB */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) { bitmap.close(); return file; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}
