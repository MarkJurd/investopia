"use client";

/* การ์ดโพสต์ (ใช้ทั้งในฟีดและหน้ารายละเอียด) — ไลก์ · ความคิดเห็น · แชร์ลิงก์ · เมนู แก้ไข/ลบ/รายงาน/ปักหมุด/ซ่อน */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useContent } from "@/components/ContentContext";
import { communityPath, errorText, timeAgo } from "@/components/community/helpers";
import { learnPath } from "@/components/learn/steps";
import { formatSize } from "@/components/learn/LessonView";

export type PostView = FunctionReturnType<typeof api.community.post> extends infer T ? Exclude<T, null> : never;
export type CommentView = FunctionReturnType<typeof api.community.comments>[number];

/** โพล: กดเลือกได้ทันที (กดซ้ำ = ยกเลิก) · เห็นผลหลังโหวต · ไม่บอกว่าใครเลือกอะไร */
function Poll({ postId, poll }: { postId: Id<"posts">; poll: NonNullable<PostView["poll"]> }) {
  const C = useContent();
  const D = C.community;
  const vote = useMutation(api.community.vote);
  const [err, setErr] = useState<string | null>(null);
  const voted = poll.myChoices.length > 0;
  const showResults = voted || poll.closed;
  const total = poll.counts.reduce((a, b) => a + b, 0);

  const pick = async (i: number) => {
    setErr(null);
    const mine = new Set(poll.myChoices);
    let next: number[];
    if (poll.multi) { if (mine.has(i)) mine.delete(i); else mine.add(i); next = [...mine]; }
    else next = mine.has(i) ? [] : [i];
    try { await vote({ postId, choices: next }); } catch (e) { setErr(errorText(e, C)); }
  };

  return (
    <div className="poll">
      {poll.options.map((o, i) => {
        const pct = total ? Math.round((poll.counts[i] / total) * 100) : 0;
        const mine = poll.myChoices.includes(i);
        return (
          <button key={i} className={`poll-opt${mine ? " mine" : ""}`} disabled={poll.closed} onClick={() => void pick(i)} aria-pressed={mine}>
            {showResults && <i className="poll-bar" style={{ width: `${pct}%` }} />}
            <span>{mine ? "✓ " : ""}{o}</span>
            {showResults && <span className="poll-pct">{pct}% · {poll.counts[i]}</span>}
          </button>
        );
      })}
      <span className="poll-meta">
        {poll.voters} {D.pollVoters}{poll.multi && ` · ${D.pollMultiHint}`}
        {poll.closed ? ` · ${D.pollClosed}` : poll.closesAt ? ` · ${D.pollClosesAt} ${new Date(poll.closesAt).toLocaleDateString(C.locale.dateLocale, { day: "numeric", month: "short" })}` : ""}
        {!showResults && ` · ${D.pollVoteToSee}`}
      </span>
      {err && <span className="learn-error" role="alert">{err}</span>}
    </div>
  );
}

export function Avatar({ name, admin }: { name: string; admin: boolean }) {
  return <span className={`c-avatar${admin ? " admin" : ""}`} aria-hidden="true">{[...name][0]?.toUpperCase() ?? "?"}</span>;
}

/** เมนู ⋯ ของโพสต์/คอมเมนต์: รายการเมนูส่งเข้ามาเป็น array */
export function MoreMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const C = useContent();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  if (items.length === 0) return null;
  return (
    <div className="more-wrap" ref={ref}>
      <button className="more-btn" onClick={() => setOpen((o) => !o)} aria-label={C.community.more} aria-expanded={open}>⋯</button>
      {open && (
        <div className="more-pop" role="menu">
          {items.map((it) => (
            <button key={it.label} role="menuitem" className={it.danger ? "danger" : ""} onClick={() => { setOpen(false); it.onClick(); }}>{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditBox({ initial, onSave, onCancel }: { initial: string; onSave: (text: string) => Promise<void>; onCancel: () => void }) {
  const C = useContent();
  const D = C.community;
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try { await onSave(text); } catch (err) { setError(errorText(err, C)); setBusy(false); }
  };
  return (
    <div className="edit-box">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={3000} aria-label={D.edit} />
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()} onClick={() => void save()}>{D.save}</button>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={onCancel}>{D.cancel}</button>
      </div>
      {error && <p className="learn-error" role="alert">{error}</p>}
    </div>
  );
}

export function LikeButton({ liked, count, onToggle, label }: { liked: boolean; count: number; onToggle: () => void; label: string }) {
  return (
    <button className={`act-btn${liked ? " liked" : ""}`} onClick={onToggle} aria-pressed={liked} aria-label={label}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.6 3.6 4.5 6.8 4.5c2 0 3.3 1.1 5.2 3.1 1.9-2 3.2-3.1 5.2-3.1 3.2 0 5.1 3.1 4 6.2C19.500 15.400 12 20 12 20z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}

export default function PostCard({ post, isAdmin, detail }: { post: PostView; isAdmin: boolean; detail?: boolean }) {
  const C = useContent();
  const D = C.community;
  const toggleLike = useMutation(api.community.toggleLike);
  const editPost = useMutation(api.community.editPost);
  const deletePost = useMutation(api.community.deletePost);
  const setPinned = useMutation(api.community.setPinned);
  const setHidden = useMutation(api.community.setHidden);
  const report = useMutation(api.community.report);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const postId = post.id as Id<"posts">;
  const href = communityPath(C, post.id);

  const flash = (msg: string) => { setNote(msg); setTimeout(() => setNote(null), 2500); };
  const share = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}${href}`); flash(D.copied); } catch { flash(D.errGeneric); }
  };

  const menu: { label: string; onClick: () => void; danger?: boolean }[] = [];
  if (post.isMine) menu.push({ label: D.edit, onClick: () => setEditing(true) });
  if (!post.isMine) menu.push({ label: D.report, onClick: () => void report({ targetType: "post", targetId: post.id }).then(() => flash(D.reported)) });
  if (isAdmin) {
    menu.push({ label: post.pinned ? D.unpin : D.pin, onClick: () => void setPinned({ postId, pinned: !post.pinned }) });
    menu.push({ label: post.hidden ? D.unhide : D.hide, onClick: () => void setHidden({ postId, hidden: !post.hidden }) });
  }
  if (post.isMine || isAdmin) {
    menu.push({ label: D.delete, danger: true, onClick: () => { if (window.confirm(D.confirmDelete)) void deletePost({ postId }); } });
  }

  return (
    <article className={`card post${post.pinned ? " pinned" : ""}${post.hidden ? " is-hidden" : ""}`}>
      <header className="post-head">
        <Avatar name={post.authorName} admin={post.authorIsAdmin} />
        <div className="post-who">
          <b>{post.authorName}</b>
          {post.authorIsAdmin && <span className="badge-admin">{D.adminBadge}</span>}
          {isAdmin && post.authorPlan && <span className="badge-plan" title={D.adminOnlyHint}>{C.planLabels[post.authorPlan]}</span>}
          <span className="post-time">{timeAgo(post.createdAt, C.locale.dateLocale)}{post.editedAt && ` · ${D.edited}`}</span>
        </div>
        <div className="post-flags">
          {post.pinned && <span className="flag">📌 {D.pinnedLabel}</span>}
          {isAdmin && post.hidden && <span className="flag warn">{D.hiddenLabel}</span>}
          {isAdmin && post.reportCount > 0 && <span className="flag warn">{D.reportsLabel} {post.reportCount}</span>}
        </div>
        <MoreMenu items={menu} />
      </header>

      {post.tag === "lesson" && post.lessonTitle && post.lessonId && (
        <Link className="lesson-chip" href={learnPath(C, post.lessonId)}>{D.lessonChip}: {post.lessonTitle}</Link>
      )}

      {editing ? (
        <EditBox initial={post.body} onCancel={() => setEditing(false)} onSave={async (text) => { await editPost({ postId, body: text }); setEditing(false); }} />
      ) : detail ? (
        <p className="post-body">{post.body}</p>
      ) : (
        <Link href={href} className="post-body clamp">{post.body}</Link>
      )}

      {post.imageUrls.length > 0 && (
        <div className={`post-imgs n${post.imageUrls.length}`}>
          {post.imageUrls.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" loading="lazy" /></a>
          ))}
        </div>
      )}

      {post.files.length > 0 && (
        <ul className="post-files">
          {post.files.map((f, i) => (
            <li key={i}>{f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" download={f.name}>📄 {f.name} <small>({formatSize(f.size)})</small></a> : <span>📄 {f.name}</span>}</li>
          ))}
        </ul>
      )}

      {post.poll && <Poll postId={postId} poll={post.poll} />}

      <footer className="post-foot">
        <LikeButton liked={post.likedByMe} count={post.likeCount} label={D.like}
          onToggle={() => void toggleLike({ targetType: "post", targetId: post.id })} />
        <Link className="act-btn" href={href} aria-label={D.commentsTitle}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.800 7L3 21l2-5.500A8 8 0 1 1 21 12z" /></svg>
          <span>{post.commentCount}</span>
        </Link>
        <button className="act-btn" onClick={() => void share()} aria-label={D.share}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d="M21 3 10 14" /><path d="M21 3l-7 18-4-7-7-4z" /></svg>
        </button>
        {note && <span className="post-note" role="status">{note}</span>}
      </footer>
    </article>
  );
}
