/* Stock page (English): price + support & resistance + financials vs peers · text in lib/content.en.ts */
import { Suspense } from "react";
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import { StockPage } from "@/components/tools/ToolsPages";
import { CONTENT_EN } from "@/lib/content.en";

type Props = { params: Promise<{ symbol: string }> };
const clean = (s: string) => decodeURIComponent(s).toUpperCase().slice(0, 12);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = clean((await params).symbol);
  return {
    title: `${symbol} — ${CONTENT_EN.tools.metaTitle} — ${CONTENT_EN.brand.name}`,
    description: CONTENT_EN.tools.metaDesc,
    alternates: { languages: { th: `/tools/stock/${symbol}`, en: `/en/tools/stock/${symbol}` } },
  };
}

// อ่าน params ต้องอยู่ใน <Suspense> (Next 16 — ไม่งั้นหน้าโหลดช้า/เตือน blocking-prerender)
async function Shell({ params }: Props) {
  const symbol = clean((await params).symbol);
  return <ToolsShell C={CONTENT_EN} path={`/tools/stock/${symbol}`}><StockPage symbol={symbol} /></ToolsShell>;
}

export default function StockRouteEn({ params }: Props) {
  return <Suspense fallback={null}><Shell params={params} /></Suspense>;
}
