"use client";

/* หน้าฟีดคอมมูนิตี้: กติกา · กล่องเขียนโพสต์ · ค้นหา · ตัวกรองหัวข้อ · โพสต์ปักหมุด · รายการโพสต์ (โหลดเพิ่มได้) */
import { useDeferredValue, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import Composer, { type Me } from "@/components/community/Composer";
import PostCard from "@/components/community/PostCard";
import { BOOT_NOW, langOf } from "@/components/community/helpers";

type Tag = "all" | "general" | "lesson";

export default function Feed({ me }: { me: Me }) {
  const C = useContent();
  const D = C.community;
  const lang = langOf(C);
  const params = useSearchParams();
  const ask = params.get("ask") ?? undefined;
  const askValid = ask && me.lessons.some((l) => l.id === ask) ? ask : undefined;

  const [tag, setTag] = useState<Tag>("all");
  const [text, setText] = useState("");
  const [rules, setRules] = useState(false);
  const q = useDeferredValue(text.trim());
  const searching = q.length >= 2;

  const feed = usePaginatedQuery(api.community.feed, searching ? "skip" : { tag: tag === "all" ? undefined : tag, lang, now: BOOT_NOW }, { initialNumItems: 10 });
  const found = useQuery(api.community.search, searching ? { text: q, lang, now: BOOT_NOW } : "skip");
  const pinned = useQuery(api.community.pinned, { lang, now: BOOT_NOW });

  const pinnedIds = new Set((pinned ?? []).map((p) => p.id));
  const showPinned = !searching && tag === "all" && pinned && pinned.length > 0;
  const list = searching ? (found ?? []) : feed.results.filter((p) => !(showPinned && pinnedIds.has(p.id)));

  return (
    <div className="community">
      <div className="comm-head">
        <h1 className="learn-h1">{D.title}</h1>
        <button className="link-btn" onClick={() => setRules((r) => !r)} aria-expanded={rules}>{rules ? D.rulesHide : D.rulesShow}</button>
      </div>
      {rules && (
        <div className="card rules">
          <b>{D.rulesTitle}</b>
          <ul>{D.rules.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}

      <Composer key={askValid ?? "plain"} me={me} askLessonId={askValid} />

      <div className="comm-tools">
        <input className="comm-search" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={D.searchPh} aria-label={D.searchPh} />
        <div className="chips" role="tablist">
          {(["all", "lesson", "general"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tag === t} className={tag === t ? "on" : ""} onClick={() => setTag(t)}>
              {t === "all" ? D.filterAll : t === "lesson" ? D.tagLesson : D.tagGeneral}
            </button>
          ))}
        </div>
      </div>
      {text.trim().length === 1 && <p className="composer-hint">{D.searchHint}</p>}

      {showPinned && pinned.map((p) => <PostCard key={`pin-${p.id}`} post={p} isAdmin={me.isAdmin} />)}

      {searching && found !== undefined && found.length === 0 && <p className="board-empty">{D.searchEmpty}</p>}
      {!searching && feed.status === "LoadingFirstPage" && <p className="learn-loading" role="status">{D.loading}</p>}
      {!searching && feed.status !== "LoadingFirstPage" && list.length === 0 && !showPinned && <p className="board-empty">{D.empty}</p>}

      {list.map((p) => <PostCard key={p.id} post={p} isAdmin={me.isAdmin} />)}

      {!searching && feed.status === "CanLoadMore" && (
        <div className="load-more"><button className="btn btn-ghost" onClick={() => feed.loadMore(10)}>{D.loadMore}</button></div>
      )}
    </div>
  );
}
