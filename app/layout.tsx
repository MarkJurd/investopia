import { Suspense } from "react";
import type { Metadata } from "next";
import { Anuphan } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CONTENT } from "@/lib/content";
import { CONTENT_EN } from "@/lib/content.en";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import AnalyticsConsent from "@/components/AnalyticsConsent";
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
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Suspense fallback={null}><AnalyticsConsent th={CONTENT.consent} en={CONTENT_EN.consent} /></Suspense>
        <Analytics />
      </body>
    </html>
  );
}
