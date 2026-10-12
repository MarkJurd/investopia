import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { CONTENT } from "@/lib/content";
import "./globals.css";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const t = CONTENT.hero.title;

export const metadata: Metadata = {
  title: `${CONTENT.brand.name} — ${t.before} ${t.accent}${t.after}`,
  description: CONTENT.footer.about,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={anuphan.variable}>
      <body>{children}</body>
    </html>
  );
}
