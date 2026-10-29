/* หน้าหุ้น (ไทย): ราคา + แนวรับ–แนวต้าน + งบเทียบคู่แข่ง · ข้อความที่ lib/content.ts (tools / levels / screener) */
import { Suspense } from "react";
import type { Metadata } from "next";
import ToolsShell from "@/components/tools/ToolsShell";
import { StockPage } from "@/components/tools/ToolsPages";
import { CONTENT } from "@/lib/content";

type Props = { params: Promise<{ symbol: string }> };
const clean = (s: string) => decodeURIComponent(s).toUpperCase().slice(0, 12);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = clean((await params).symbol);
  return {
    title: `${symbol} — ${CONTENT.tools.metaTitle} — ${CONTENT.brand.name}`,
    description: CONTENT.tools.metaDesc,
    alternates: { languages: { th: `/tools/stock/${symbol}`, en: `/en/tools/stock/${symbol}` } },
  };
}

// อ่าน params ต้องอยู่ใน <Suspense> (Next 16 — ไม่งั้นหน้าโหลดช้า/เตือน blocking-prerender)
async function Shell({ params }: Props) {
  const symbol = clean((await params).symbol);
  return <ToolsShell C={CONTENT} path={`/tools/stock/${symbol}`}><StockPage symbol={symbol} /></ToolsShell>;
}

export default function StockRoute({ params }: Props) {
  return <Suspense fallback={null}><Shell params={params} /></Suspense>;
}
