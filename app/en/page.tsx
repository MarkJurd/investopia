/* English home page (/en) — edit the text in lib/content.en.ts */
import type { Metadata } from "next";
import HomePage from "@/components/HomePage";
import { CONTENT_EN } from "@/lib/content.en";

const t = CONTENT_EN.hero.title;

export const metadata: Metadata = {
  title: `${CONTENT_EN.brand.name} — ${t.before} ${t.accent} ${t.after}`,
  description: CONTENT_EN.footer.about,
  alternates: { languages: { th: "/", en: "/en" } },
};

export default function HomeEn() {
  return <HomePage C={CONTENT_EN} />;
}
