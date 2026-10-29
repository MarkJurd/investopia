/* Moved into the tools hub (/en/tools) — keep the old URL working */
import { permanentRedirect } from "next/navigation";

export default function Moved() {
  permanentRedirect("/en/tools");
}
