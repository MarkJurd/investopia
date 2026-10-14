"use client";

/* กระดิ่งแจ้งเตือน: จำนวนที่ยังไม่อ่าน + รายการล่าสุด + "อ่านทั้งหมด" — อัปเดตเรียลไทม์ */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useContent } from "@/components/ContentContext";
import { BOOT_NOW, communityPath, langOf, timeAgo } from "@/components/community/helpers";

type Kind = "like_post" | "like_comment" | "comment" | "new_post";

export default function NotificationBell() {
  const C = useContent();
  const D = C.community;
  const lang = langOf(C);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useQuery(api.community.unreadCount, { now: BOOT_NOW }) ?? 0;
  const list = useQuery(api.community.notifications, open ? { lang, now: BOOT_NOW } : "skip");
  const markRead = useMutation(api.community.markRead);
  const markAll = useMutation(api.community.markAllRead);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const text = (type: Kind, byAdmin: boolean, actor: string) => {
    if (type === "new_post") return `${actor} · ${D.notifNewPost}`;
    if (type === "comment" && byAdmin) return D.notifAdminReply;
    const verb = type === "like_post" ? D.notifLikePost : type === "like_comment" ? D.notifLikeComment : D.notifComment;
    return `${actor} ${verb}`;
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`${D.notifTitle}${count > 0 ? ` (${count} ${D.notifUnread})` : ""}`}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {count > 0 && <span className="bell-badge">{count > 99 ? "99+" : count}</span>}
      </button>
      {open && (
        <div className="bell-pop" role="dialog" aria-label={D.notifTitle}>
          <div className="bell-head">
            <b>{D.notifTitle}</b>
            {count > 0 && <button className="btn btn-ghost btn-sm" onClick={() => void markAll()}>{D.notifMarkAll}</button>}
          </div>
          <div className="bell-list">
            {list === undefined && <p className="bell-empty">{D.loading}</p>}
            {list && list.length === 0 && <p className="bell-empty">{D.notifEmpty}</p>}
            {list?.map((n) => (
              <button key={n.id} className={`bell-item${n.read ? "" : " unread"}${n.byAdmin && n.type === "comment" ? " admin" : ""}`}
                onClick={() => { setOpen(false); if (!n.read) void markRead({ notificationId: n.id as Id<"notifications"> }); router.push(communityPath(C, n.postId)); }}>
                <span className="bi-top"><b>{text(n.type, n.byAdmin, n.actorName)}</b><i>{timeAgo(n.createdAt, C.locale.dateLocale)}</i></span>
                {n.preview && <span className="bi-prev">{n.preview}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
