/* ย้ายไปรวมที่หน้าเครื่องมือ (/tools) แล้ว — เก็บ URL เดิมไว้ให้ลิงก์เก่ายังใช้ได้ */
import { permanentRedirect } from "next/navigation";

export default function Moved() {
  permanentRedirect("/tools");
}
