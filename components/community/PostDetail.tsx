"use client";

/* หน้าโพสต์เดี่ยว + ความคิดเห็น — เปิดแล้วแจ้งเตือนของโพสต์นี้ถูกทำเป็น "อ่านแล้ว" อัตโนมัติ */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useContent } from "@/components/ContentContext";
import PostCard, { Avatar, EditBox, LikeButton, MoreMenu, type CommentView } from "@/components/community/PostCard";
import type { Me } from "@/components/community/Composer";
import DisplayNameForm from "@/components/community/DisplayNameForm";
import { BOOT_NOW, communityPath, errorText, langOf, timeAgo } from "@/components/community/helpers";

function CommentRow({ c, isAdmin }: { c: CommentView; isAdmin: boolean }) {
  const C = useContent();
  const D = C.community;
  const toggleLike = useMutation(api.community.toggleLike);
  const editComment = useMutation(api.community.editComment);
  const deleteComment = useMutation(api.community.deleteComment);
  const report = useMutation(api.community.report);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const id = c.id as Id<"comments">;

  const menu: { label: string; onClick: () => void; danger?: boolean }[] = [];
  if (c.isMine) menu.push({ label: D.edit, onClick: () => setEditing(true) });
  if (!c.isMine) menu.push({ label: D.report, onClick: () => void report({ targetType: "comment", targetId: c.id }).then(() => { setNote(D.reported); setTimeout(() => setNote(null), 2500); }) });
  if (c.isMine || isAdmin) menu.push({ label: D.delete, danger: true, onClick: () => { if (window.confirm(D.confirmDelete)) void deleteComment({ commentId: id }); } });

  return (
    <div className={`comment${c.authorIsAdmin ? " by-admin" : ""}`}>
      <Avatar name={c.authorName} admin={c.authorIsAdmin} />
      <div className="comment-main">
        <div className="post-who">
          <b>{c.authorName}</b>
          {c.authorIsAdmin && <span className="badge-admin">{D.adminBadge}</span>}
          {isAdmin && c.authorPlan && <span className="badge-plan" title={D.adminOnlyHint}>{C.planLabels[c.authorPlan]}</span>}
          <span className="post-time">{timeAgo(c.createdAt, C.locale.dateLocale)}{c.editedAt && ` · ${D.edited}`}</span>
          {isAdmin && c.reportCount > 0 && <span className="flag warn">{D.reportsLabel} {c.reportCount}</span>}
          <MoreMenu items={menu} />
        </div>
        {editing
          ? <EditBox initial={c.body} onCancel={() => setEditing(false)} onSave={async (text) => { await editComment({ commentId: id, body: text }); setEditing(false); }} />
          : <p className="post-body">{c.body}</p>}
        <div className="comment-foot">
          <LikeButton liked={c.likedByMe} count={c.likeCount} label={D.like} onToggle={() => void toggleLike({ targetType: "comment", targetId: c.id })} />
          {note && <span className="post-note" role="status">{note}</span>}
        </div>
      </div>
    </div>
  );
}

export default function PostDetail({ postId, me }: { postId: string; me: Me }) {
  const C = useContent();
  const D = C.community;
  const lang = langOf(C);
  const post = useQuery(api.community.post, { postId, lang, now: BOOT_NOW });
  const comments = useQuery(api.community.comments, { postId, lang, now: BOOT_NOW });
  const createComment = useMutation(api.community.createComment);
  const markPostRead = useMutation(api.community.markPostRead);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exists = post !== undefined && post !== null;

  useEffect(() => { if (exists) void markPostRead({ postId }); }, [exists, postId, markPostRead, comments?.length]);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await createComment({ postId: postId as Id<"posts">, body: text });
      setText("");
    } catch (err) {
      setError(errorText(err, C));
    } finally {
      setBusy(false);
    }
  };

  if (post === undefined) return <p className="learn-loading" role="status">{D.loading}</p>;
  if (post === null) {
    return (
      <div className="learn-gate card">
        <h1>{D.notFound}</h1>
        <Link href={communityPath(C)} className="btn btn-primary">{D.back}</Link>
      </div>
    );
  }
  const needName = !me.isAdmin && me.displayName === null;

  return (
    <div className="community">
      <Link href={communityPath(C)} className="back-btn">{D.back}</Link>
      <PostCard post={post} isAdmin={me.isAdmin} detail />
      <h2 className="dash-h2">{D.commentsTitle} ({post.commentCount})</h2>
      <div className="comments">
        {comments?.length === 0 && <p className="board-empty">{D.noComments}</p>}
        {comments?.map((c) => <CommentRow key={c.id} c={c} isAdmin={me.isAdmin} />)}
      </div>
      {needName ? (
        <div className="card composer"><DisplayNameForm current={null} /></div>
      ) : (
        <div className="comment-form">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={D.commentPh} rows={2} maxLength={2000} aria-label={D.commentPh} />
          <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()} onClick={() => void send()}>{D.send}</button>
          {error && <p className="learn-error" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
