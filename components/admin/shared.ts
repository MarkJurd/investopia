/* เครื่องมือเล็กๆ ของหน้าแอดมิน: ข้อความ error · วันที่ · เงิน · อัปโหลดไฟล์ */
import { ConvexError } from "convex/values";
import type { Content } from "@/components/ContentContext";

export function adminError(err: unknown, C: Content): string {
  const code = err instanceof ConvexError && typeof err.data === "string" ? err.data : "";
  return C.admin.errors[code] ?? C.admin.error;
}

export const fmtDate = (ts: number, C: Content) =>
  new Date(ts).toLocaleDateString(C.locale.dateLocale, { day: "numeric", month: "short", year: "numeric" });

export const fmtDateTime = (ts: number, C: Content) =>
  new Date(ts).toLocaleString(C.locale.dateLocale, { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;

/** อัปโหลดไฟล์ไปที่ Convex storage (ได้ storageId กลับมา) */
export async function uploadFile(uploadUrl: string, file: File): Promise<string> {
  const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
  if (!res.ok) throw new Error("UPLOAD_FAILED");
  const { storageId } = (await res.json()) as { storageId: string };
  return storageId;
}
