"use client";

/* กล่องเขียนโพสต์: ข้อความ + หัวข้อ (ทั่วไป / ถามเรื่องบทเรียน) + แนบรูปสูงสุด 3 รูป
 * แอดมินเท่านั้น: แนบไฟล์ (≤5 ไฟล์ ≤50 MB) + สร้างโพล */
import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useContent } from "@/components/ContentContext";
import DisplayNameForm from "@/components/community/DisplayNameForm";
import { errorText, shrinkImage } from "@/components/community/helpers";

export type Me = { isAdmin: boolean; displayName: string | null; lessons: { id: string; title: string; moduleTag: string }[] };

const MAX_IMAGES = 3;
const MAX_DOCS = 5;
const MAX_DOC_BYTES = 50 * 1024 * 1024;

export default function Composer({ me, askLessonId }: { me: Me; askLessonId?: string }) {
  const C = useContent();
  const D = C.community;
  const makeUrl = useMutation(api.community.generateUploadUrl);
  const createPost = useMutation(api.community.createPost);
  const [body, setBody] = useState("");
  const [tag, setTag] = useState<"general" | "lesson">(askLessonId ? "lesson" : "general");
  const [lessonId, setLessonId] = useState(askLessonId ?? "");
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [docs, setDocs] = useState<File[]>([]);
  const [pollOn, setPollOn] = useState(false);
  const [pollOpts, setPollOpts] = useState<string[]>(["", ""]);
  const [pollMulti, setPollMulti] = useState(false);
  const [pollClose, setPollClose] = useState("");
  const filesRef = useRef(files);

  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  // ผู้ใช้ทั่วไปต้องมีชื่อที่แสดงก่อนถึงจะโพสต์ได้ (แอดมินข้ามได้)
  if (!me.isAdmin && me.displayName === null) return <div className="card composer"><DisplayNameForm current={null} /></div>;

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const room = MAX_IMAGES - files.length;
    const picked: { file: File; url: string }[] = [];
    for (const raw of [...list].slice(0, room)) {
      const file = await shrinkImage(raw);
      picked.push({ file, url: URL.createObjectURL(file) });
    }
    setFiles((f) => [...f, ...picked]);
  };

  const removeFile = (i: number) => setFiles((f) => { URL.revokeObjectURL(f[i].url); return f.filter((_, j) => j !== i); });

  const submit = async () => {
    if (!body.trim()) { setError(D.errEmpty); return; }
    if (tag === "lesson" && !lessonId) { setError(D.lessonPick); return; }
    setBusy(true);
    setError(null);
    try {
      const ids: Id<"_storage">[] = [];
      for (const f of files) {
        const uploadUrl = await makeUrl({});
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": f.file.type }, body: f.file });
        if (!res.ok) throw new Error("upload");
        ids.push(((await res.json()) as { storageId: Id<"_storage"> }).storageId);
      }
      const docIds: { storageId: Id<"_storage">; name: string }[] = [];
      for (const d of docs) {
        const uploadUrl = await makeUrl({});
        const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": d.type || "application/octet-stream" }, body: d });
        if (!res.ok) throw new Error("upload");
        docIds.push({ storageId: ((await res.json()) as { storageId: Id<"_storage"> }).storageId, name: d.name });
      }
      const options = pollOpts.map((o) => o.trim()).filter(Boolean);
      await createPost({
        body, tag, lessonId: tag === "lesson" ? lessonId : undefined, imageIds: ids,
        files: docIds.length ? docIds : undefined,
        poll: pollOn && options.length >= 2
          ? { options, multi: pollMulti, closesAt: pollClose ? new Date(`${pollClose}T23:59:59+07:00`).getTime() : null }
          : undefined,
      });
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]);
      setDocs([]);
      setPollOn(false); setPollOpts(["", ""]); setPollMulti(false); setPollClose("");
      setBody("");
      if (!askLessonId) { setTag("general"); setLessonId(""); }
    } catch (err) {
      setError(errorText(err, C));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card composer">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={D.composerPh} rows={3} maxLength={3000} aria-label={D.composerPh} />
      {files.length > 0 && (
        <div className="thumbs">
          {files.map((f, i) => (
            <div className="thumb" key={f.url}>
              <img src={f.url} alt="" />
              <button type="button" onClick={() => removeFile(i)} aria-label={D.removeImage}>×</button>
            </div>
          ))}
        </div>
      )}
      {me.isAdmin && docs.length > 0 && (
        <ul className="composer-files">
          {docs.map((d, i) => (
            <li key={`${d.name}-${i}`}>📄 {d.name} <button type="button" className="link-btn" onClick={() => setDocs((x) => x.filter((_, j) => j !== i))}>{D.removeFile}</button></li>
          ))}
        </ul>
      )}
      {me.isAdmin && pollOn && (
        <div className="composer-poll">
          <b>{D.pollTitle}</b>
          {pollOpts.map((o, i) => (
            <input key={i} value={o} maxLength={120} placeholder={`${D.pollOption} ${i + 1}`}
              onChange={(e) => setPollOpts((x) => x.map((y, j) => (j === i ? e.target.value : y)))} />
          ))}
          {pollOpts.length < 10 && <button type="button" className="link-btn" onClick={() => setPollOpts((x) => [...x, ""])}>{D.pollAddOption}</button>}
          <label><input type="checkbox" checked={pollMulti} onChange={(e) => setPollMulti(e.target.checked)} /> {D.pollMulti}</label>
          <label>{D.pollCloses} <input type="date" value={pollClose} onChange={(e) => setPollClose(e.target.value)} /></label>
        </div>
      )}
      <div className="composer-bar">
        <div className="composer-opts">
          {me.isAdmin && (
            <>
              <label className="file-btn">
                <input type="file" multiple hidden disabled={docs.length >= MAX_DOCS}
                  onChange={(e) => {
                    const picked = [...(e.target.files ?? [])].filter((f) => f.size <= MAX_DOC_BYTES);
                    if (picked.length < (e.target.files?.length ?? 0)) setError(D.errFile);
                    setDocs((x) => [...x, ...picked].slice(0, MAX_DOCS));
                    e.target.value = "";
                  }} />
                <span className={`btn btn-ghost btn-sm${docs.length >= MAX_DOCS ? " disabled" : ""}`}>📎 {D.addFile}</span>
              </label>
              <button type="button" className={`btn btn-ghost btn-sm${pollOn ? " on" : ""}`} onClick={() => setPollOn((p) => !p)}>📊 {D.addPoll}</button>
            </>
          )}
          <label className="file-btn">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={files.length >= MAX_IMAGES}
              onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            <span className={`btn btn-ghost btn-sm${files.length >= MAX_IMAGES ? " disabled" : ""}`}>🖼 {D.addImage}</span>
          </label>
          <select value={tag} onChange={(e) => setTag(e.target.value as "general" | "lesson")} aria-label={D.tagLabel}>
            <option value="general">{D.tagGeneral}</option>
            <option value="lesson">{D.tagLesson}</option>
          </select>
          {tag === "lesson" && (
            <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} aria-label={D.lessonPick}>
              <option value="">{D.lessonPick}</option>
              {me.lessons.map((l) => <option key={l.id} value={l.id}>{l.moduleTag} · {l.title}</option>)}
            </select>
          )}
        </div>
        <button className="btn btn-primary btn-sm" disabled={busy || !body.trim()} onClick={() => void submit()}>{busy ? D.posting : D.post}</button>
      </div>
      <p className="composer-hint">{D.imagesHint}</p>
      {error && <p className="learn-error" role="alert">{error}</p>}
      {!me.isAdmin && me.displayName && (
        editingName
          ? <DisplayNameForm current={me.displayName} onDone={() => setEditingName(false)} />
          : <p className="composer-hint">{D.nameLine} <b>{me.displayName}</b> · <button type="button" className="link-btn" onClick={() => setEditingName(true)}>{D.nameEdit}</button></p>
      )}
    </div>
  );
}
