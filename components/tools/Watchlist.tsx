"use client";

/* Watchlist (หน้า /tools) + ปุ่มเพิ่ม/เอาออก (หน้าหุ้น) + เชื่อม Telegram รับสรุปรายสัปดาห์ (สมาชิก)
 * จำนวนสูงสุดเช็กที่ server (convex/watchlist.ts): ฟรี 3 ตัว · สมาชิก 20 ตัว */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { BOOT_NOW } from "@/components/community/helpers";
import { pricingPath } from "@/components/learn/steps";
import { stockPath } from "@/components/tools/StockSearch";
import { Confidence } from "@/components/tools/LevelsPanel";

type Item = Awaited<ReturnType<ReturnType<typeof useAction<typeof api.market.watchlistView>>>>[number];

const tpl = (s: string, ...xs: (string | number)[]) => xs.reduce<string>((a, x, i) => a.replace(i === 0 ? "{x}" : "{y}", String(x)), s);
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const norm = (s: string) => s.trim().toUpperCase().replace(/\./g, "-");

export function WatchButton({ symbol }: { symbol: string }) {
  const T = useContent().tools;
  const mine = useQuery(api.watchlist.mine, { now: BOOT_NOW });
  const add = useMutation(api.watchlist.add);
  const remove = useMutation(api.watchlist.remove);
  const [err, setErr] = useState("");
  if (!mine) return null;
  const s = norm(symbol);
  const inList = mine.symbols.includes(s);
  return (
    <div className="wl-btn">
      <button className={`btn btn-sm ${inList ? "btn-ghost" : "btn-primary"}`} onClick={async () => {
        setErr("");
        try {
          if (inList) await remove({ symbol: s });
          else await add({ symbol: s });
        } catch (e) {
          setErr(e instanceof ConvexError && e.data === "WATCHLIST_FULL" ? tpl(T.watchFull, mine.limit) : String(e));
        }
      }}>{inList ? T.watchAdded : T.watchAdd}</button>
      {err && <p className="sc-note" role="alert">{err}</p>}
    </div>
  );
}

function TelegramBox({ member, linked, bot }: { member: boolean; linked: boolean; bot: string | null }) {
  const C = useContent();
  const T = C.tools;
  const token = useMutation(api.watchlist.telegramToken);
  const unlink = useMutation(api.watchlist.unlinkMine);
  const [opened, setOpened] = useState(false);
  return (
    <div className="wl-tg">
      <div>
        <b>{T.tgTitle}</b>
        <p>{T.tgText}</p>
        {opened && !linked && <p className="sc-note" role="status">{T.tgOpened}</p>}
      </div>
      {!member ? (
        <Link href={pricingPath(C)} className="btn btn-ghost btn-sm">{T.tgMemberOnly} · {T.seePlans}</Link>
      ) : linked ? (
        <span className="wl-tg-on">{T.tgConnected} <button className="wl-link" onClick={() => void unlink({})}>{T.tgDisconnect}</button></span>
      ) : bot ? (
        <button className="btn btn-primary btn-sm" onClick={async () => {
          const w = window.open("", "_blank");   // เปิดหน้าต่างก่อน (กันเบราว์เซอร์บล็อก popup หลังรอ server)
          const t = await token({});
          const url = `https://t.me/${bot}?start=${t}`;
          if (w) w.location.href = url; else window.location.href = url;
          setOpened(true);
        }}>{T.tgConnect}</button>
      ) : (
        <span className="sc-note">{T.tgNotReady}</span>
      )}
    </div>
  );
}

export default function Watchlist() {
  const C = useContent();
  const T = C.tools;
  const mine = useQuery(api.watchlist.mine, { now: BOOT_NOW });
  const view = useAction(api.market.watchlistView);
  const remove = useMutation(api.watchlist.remove);
  const [got, setGot] = useState<{ key: string; items: Item[] } | null>(null);
  const key = mine?.symbols.join(",") ?? "";

  useEffect(() => {
    if (!key) return;
    let alive = true;
    view({}).then((r) => { if (alive) setGot({ key, items: r }); }).catch(() => { if (alive) setGot({ key, items: [] }); });
    return () => { alive = false; };
  }, [view, key]);
  const items = !key ? [] : got?.key === key ? got.items : null;   // null = กำลังโหลด

  if (!mine) return null;
  return (
    <section className="card sc-card wl" aria-labelledby="wl-title">
      <div className="lv-top">
        <h2 id="wl-title" className="tool-h2">{T.watchTitle}</h2>
        <span className="sc-note">{tpl(T.watchCount, mine.symbols.length, mine.limit)}</span>
      </div>
      {mine.symbols.length === 0 ? <p className="tool-hint">{T.watchEmpty}</p> : items === null ? <p className="tool-hint" role="status">{T.watchLoading}</p> : (
        <ul className="wl-list">
          {items.map((it) => (
            <li key={it.symbol} className="wl-row">
              <Link href={stockPath(C, it.symbol)} className="wl-sym"><b>{it.symbol}</b>{"name" in it && <span>{it.name}</span>}</Link>
              {"missing" in it ? <span className="sc-note">{T.watchMissing}</span> : (
                <>
                  <span className="wl-price"><b>{money(it.price)}</b>{it.changePct !== null && <em className={it.changePct >= 0 ? "up" : "down"}>{it.changePct >= 0 ? "▲" : "▼"} {Math.abs(it.changePct).toFixed(2)}%</em>}</span>
                  <span className="wl-lv">{it.resistance && <><small>{T.nearResistance}</small> {money(it.resistance.price)} <i>(+{it.resistance.distPct.toFixed(1)}%)</i> <Confidence stars={it.resistance.stars} /></>}</span>
                  <span className="wl-lv">{it.support && <><small>{T.nearSupport}</small> {money(it.support.price)} <i>({it.support.distPct.toFixed(1)}%)</i> <Confidence stars={it.support.stars} /></>}</span>
                </>
              )}
              <button className="wl-link" aria-label={`${T.watchRemove} ${it.symbol}`} onClick={() => void remove({ symbol: it.symbol })}>{T.watchRemove}</button>
            </li>
          ))}
        </ul>
      )}
      {!mine.member && <p className="sc-note">{T.watchFree}</p>}
      <TelegramBox member={mine.member} linked={mine.telegram} bot={mine.botUsername} />
    </section>
  );
}
