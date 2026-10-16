"use client";

/* แท็บ "บทเรียน": โมดูล (เรียง/แก้/ซ่อน/ลบ) → บท (เรียง/แก้/ย้าย/ซ่อน/ลบ, วิดีโอ, ไฟล์แนบ, ป้ายใหม่) → แบบทดสอบ */
import { useEffect, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useContent } from "@/components/ContentContext";
import { adminError, fmtDate, uploadFile } from "@/components/admin/shared";
import { formatSize } from "@/components/learn/LessonView";

type Tree = FunctionReturnType<typeof api.adminCourse.tree>;
type Mod = Tree["modules"][number];
type Les = Mod["lessons"][number];
type QuizItem = Mod["quiz"][number];

const NEW_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

const isRecent = (ts: number | null, now: number) => ts !== null && now - ts < NEW_DAYS * DAY;

function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

/** ปุ่มที่รอผลจากเซิร์ฟเวอร์ + แสดง error ของตัวเอง */
function useRun() {
  const C = useContent();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async (fn: () => Promise<unknown>, okMsg = "") => {
    setBusy(true);
    setMsg("");
    try { await fn(); setMsg(okMsg); return true; } catch (e) { setMsg(adminError(e, C)); return false; } finally { setBusy(false); }
  };
  return { busy, msg, run, setMsg };
}

function Arrows({ onUp, onDown, disabled }: { onUp: () => void; onDown: () => void; disabled?: boolean }) {
  const A = useContent().admin;
  return (
    <span className="adm-arrows">
      <button type="button" onClick={onUp} disabled={disabled} aria-label={A.up} title={A.up}>▲</button>
      <button type="button" onClick={onDown} disabled={disabled} aria-label={A.down} title={A.down}>▼</button>
    </span>
  );
}

export default function CourseTab() {
  const C = useContent();
  const A = C.admin;
  const tree = useQuery(api.adminCourse.tree);
  const importCourse = useMutation(api.adminCourse.importCourse);
  const addModule = useMutation(api.adminCourse.addModule);
  const reorder = useMutation(api.adminCourse.reorderModules);
  const { busy, msg, run } = useRun();
  const [open, setOpen] = useState<string | null>(null);

  if (tree === undefined) return <p className="learn-loading">{A.loading}</p>;
  if (!tree.fromDb) {
    return (
      <section className="card adm-card">
        <h2>{A.importTitle}</h2>
        <p>{A.importText}</p>
        <button className="btn btn-primary" disabled={busy} onClick={() => void run(() => importCourse({}))}>{A.importBtn}</button>
        {msg && <p className="adm-msg">{msg}</p>}
      </section>
    );
  }

  const ids = tree.modules.map((m) => m.id as Id<"courseModules">);
  let visibleIndex = 0;
  return (
    <div className="adm-course">
      <p className="adm-hint">{A.courseHint}</p>
      {tree.modules.map((m, i) => {
        const tag = m.hidden ? A.hiddenBadge : `${A.moduleTag} ${visibleIndex++}`;
        return (
          <ModuleCard key={m.key} mod={m} tag={tag} modules={tree.modules} bunnyReady={tree.bunnyListReady}
            open={open === m.key} onToggle={() => setOpen(open === m.key ? null : m.key)}
            arrows={<Arrows disabled={busy} onUp={() => void run(() => reorder({ ids: move(ids, i, -1) }))} onDown={() => void run(() => reorder({ ids: move(ids, i, 1) }))} />} />
        );
      })}
      <button className="btn btn-ghost" disabled={busy} onClick={() => void run(() => addModule({ title: A.newModuleTitle }))}>{A.addModule}</button>
      {msg && <p className="adm-msg">{msg}</p>}
    </div>
  );
}

function ModuleCard({ mod, tag, modules, bunnyReady, open, onToggle, arrows }: {
  mod: Mod; tag: string; modules: Mod[]; bunnyReady: boolean; open: boolean; onToggle: () => void; arrows: React.ReactNode;
}) {
  const C = useContent();
  const A = C.admin;
  const saveModule = useMutation(api.adminCourse.saveModule);
  const deleteModule = useMutation(api.adminCourse.deleteModule);
  const addLesson = useMutation(api.adminCourse.addLesson);
  const reorderLessons = useMutation(api.adminCourse.reorderLessons);
  const [title, setTitle] = useState(mod.title);
  const [practice, setPractice] = useState(mod.practice);
  const [hidden, setHidden] = useState(mod.hidden);
  const [editLesson, setEditLesson] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const { busy, msg, run } = useRun();
  const id = mod.id as Id<"courseModules">;
  const lessonIds = mod.lessons.map((l) => l.id as Id<"courseLessons">);
  const dirty = title !== mod.title || practice !== mod.practice || hidden !== mod.hidden;

  return (
    <section className={`card adm-mod${mod.hidden ? " is-hidden" : ""}`}>
      <div className="adm-mod-head">
        {arrows}
        <button type="button" className="adm-mod-title" onClick={onToggle} aria-expanded={open}>
          <span className="lo-tag">{tag}</span> <b>{mod.title}</b>
          <span className="adm-sub">{mod.lessons.length} {A.lessonsCount} · {mod.quiz.length} {A.quizCount}</span>
        </button>
      </div>
      {open && (
        <div className="adm-mod-body">
          <div className="adm-form">
            <label>{A.moduleTitle}<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></label>
            <label>{A.practice}<textarea value={practice} onChange={(e) => setPractice(e.target.value)} rows={2} maxLength={5000} /></label>
            <label className="adm-check"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> {A.hidden}</label>
            <div className="adm-row">
              <button className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={() => void run(() => saveModule({ id, title, practice, hidden }), A.saved)}>{busy ? A.saving : A.save}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setQuizOpen((o) => !o)}>{A.editQuiz} ({mod.quiz.length})</button>
              {mod.lessons.length === 0 && (
                <button className="btn btn-ghost btn-sm adm-danger" disabled={busy} onClick={() => { if (confirm(A.confirmDelete)) void run(() => deleteModule({ id })); }}>{A.deleteModule}</button>
              )}
              {msg && <span className="adm-msg">{msg}</span>}
            </div>
          </div>

          {quizOpen && <QuizEditor moduleId={id} quiz={mod.quiz} onClose={() => setQuizOpen(false)} />}

          <ol className="adm-lessons">
            {mod.lessons.map((l, i) => (
              <li key={l.key}>
                <div className="adm-lesson-row">
                  <Arrows disabled={busy}
                    onUp={() => void run(() => reorderLessons({ moduleId: id, ids: move(lessonIds, i, -1) }))}
                    onDown={() => void run(() => reorderLessons({ moduleId: id, ids: move(lessonIds, i, 1) }))} />
                  <button type="button" className="adm-lesson-title" onClick={() => setEditLesson(editLesson === l.key ? null : l.key)} aria-expanded={editLesson === l.key}>
                    <span>{l.title}</span>
                    <span className="adm-badges">
                      {l.hidden && <i className="b-hidden">{A.hiddenBadge}</i>}
                      {l.indicatorOnly && <i>{A.indicatorBadge}</i>}
                      <i className={l.videoId ? "b-ok" : "b-muted"}>{l.videoId ? A.hasVideoBadge : A.noVideo}</i>
                      {l.files.length > 0 && <i>📄 {l.files.length}</i>}
                      {isRecent(l.newSince, now) && <i className="b-new">{C.learn.newBadge}</i>}
                    </span>
                  </button>
                </div>
                {editLesson === l.key && (
                  <LessonEditor lesson={l} moduleId={id} modules={modules} bunnyReady={bunnyReady} onClose={() => setEditLesson(null)} />
                )}
              </li>
            ))}
          </ol>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(async () => {
            await addLesson({ moduleId: id, title: A.newLessonTitle });
          })}>{A.addLesson}</button>
        </div>
      )}
    </section>
  );
}


function LessonEditor({ lesson, moduleId, modules, bunnyReady, onClose }: {
  lesson: Les; moduleId: Id<"courseModules">; modules: Mod[]; bunnyReady: boolean; onClose: () => void;
}) {
  const C = useContent();
  const A = C.admin;
  const saveLesson = useMutation(api.adminCourse.saveLesson);
  const deleteLesson = useMutation(api.adminCourse.deleteLesson);
  const moveLesson = useMutation(api.adminCourse.moveLesson);
  const announce = useMutation(api.adminCourse.announceLesson);
  const clearNew = useMutation(api.adminCourse.clearNew);
  const genUrl = useMutation(api.adminCourse.generateUploadUrl);
  const addFile = useMutation(api.adminCourse.addLessonFile);
  const delFile = useMutation(api.adminCourse.deleteLessonFile);
  const id = lesson.id as Id<"courseLessons">;

  const [f, setF] = useState({
    title: lesson.title, notes: lesson.notes, videoId: lesson.videoId, minutes: lesson.minutes,
    hidden: lesson.hidden, indicatorOnly: lesson.indicatorOnly,
  });
  const [notify, setNotify] = useState(true);
  const [picker, setPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { busy, msg, run, setMsg } = useRun();
  const [now] = useState(() => Date.now());
  const set = <K extends keyof typeof f>(k: K, val: (typeof f)[K]) => setF((o) => ({ ...o, [k]: val }));
  const isNew = isRecent(lesson.newSince, now);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    setMsg("");
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024) { setMsg(A.errors.FILE_TOO_BIG); continue; }
        const storageId = await uploadFile(await genUrl({}), file);
        await addFile({ lessonId: id, storageId: storageId as Id<"_storage">, name: file.name });
      }
    } catch (e) {
      setMsg(adminError(e, C));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="adm-editor">
      <div className="adm-form">
        <label>{A.lessonTitle}<input value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={200} /></label>
        <label>{A.notes}<textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} rows={4} maxLength={5000} /></label>
        <div className="adm-grid2">
          <label>{A.videoId}
            <input value={f.videoId} onChange={(e) => set("videoId", e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" spellCheck={false} />
            <small>{A.videoIdHint}</small>
          </label>
          <label>{A.minutes}<input type="number" min={0} max={600} value={f.minutes} onChange={(e) => set("minutes", Number(e.target.value))} /></label>
        </div>
        <div className="adm-row">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicker((p) => !p)}>{A.pickVideo}</button>
          {!bunnyReady && <small className="adm-sub">{A.errors.BUNNY_NOT_CONFIGURED}</small>}
        </div>
        {picker && <VideoPicker onPick={(guid) => { set("videoId", guid); setPicker(false); }} />}
        <label className="adm-check"><input type="checkbox" checked={f.hidden} onChange={(e) => set("hidden", e.target.checked)} /> {A.hidden}</label>
        <label className="adm-check"><input type="checkbox" checked={f.indicatorOnly} onChange={(e) => set("indicatorOnly", e.target.checked)} /> {A.indicatorOnly}</label>
        <div className="adm-row">
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(() => saveLesson({ id, ...f }), A.saved)}>{busy ? A.saving : A.save}</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{A.close}</button>
          {msg && <span className="adm-msg">{msg}</span>}
        </div>
      </div>

      <div className="adm-files">
        <h4>{A.files}</h4>
        {lesson.files.length === 0 && <p className="adm-sub">{A.noFiles}</p>}
        <ul>
          {lesson.files.map((file) => (
            <li key={file.id ?? file.name}>
              {file.url ? <a href={file.url} target="_blank" rel="noopener noreferrer">📄 {file.name}</a> : <span>📄 {file.name}</span>}
              <span className="adm-sub">{formatSize(file.size)}</span>
              {file.id && <button className="btn btn-ghost btn-sm adm-danger" onClick={() => { if (confirm(A.confirmDelete)) void run(() => delFile({ id: file.id as Id<"lessonFiles"> })); }}>{A.delete}</button>}
            </li>
          ))}
        </ul>
        <label className={`btn btn-ghost btn-sm adm-upload${uploading ? " disabled" : ""}`}>
          {uploading ? A.uploading : A.upload}
          <input type="file" multiple hidden disabled={uploading} onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
        </label>
      </div>

      <div className="adm-extra">
        <div className="adm-row">
          <b>{A.newBadge}:</b>
          {isNew ? (
            <>
              <span className="adm-sub">{A.announced} · {fmtDate(lesson.newSince as number, C)}</span>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(() => clearNew({ id }))}>{A.clearNew}</button>
            </>
          ) : (
            <>
              <label className="adm-check"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> {A.announceNotify}</label>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void run(() => announce({ id, notify }), A.announced)}>{A.announce}</button>
            </>
          )}
        </div>
        <div className="adm-row">
          <label className="adm-inline">{A.moveTo}
            <select value={moduleId} onChange={(e) => void run(() => moveLesson({ id, moduleId: e.target.value as Id<"courseModules"> }))}>
              {modules.map((m) => <option key={m.key} value={m.id ?? ""}>{m.title}</option>)}
            </select>
          </label>
        </div>
        <p className="adm-sub">{A.keyLabel}: <code>{lesson.key}</code></p>
        <button className="btn btn-ghost btn-sm adm-danger" disabled={busy} onClick={() => { if (confirm(A.confirmDelete)) void run(() => deleteLesson({ id })); }}>{A.deleteLesson}</button>
      </div>
    </div>
  );
}

function VideoPicker({ onPick }: { onPick: (guid: string) => void }) {
  const C = useContent();
  const A = C.admin;
  const list = useAction(api.adminCourse.bunnyVideos);
  const [videos, setVideos] = useState<FunctionReturnType<typeof api.adminCourse.bunnyVideos> | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    list({})
      .then((v) => { if (alive) setVideos(v); })
      .catch((e: unknown) => { if (alive) setErr(adminError(e, C)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [list, C]);

  const shown = (videos ?? []).filter((v) => v.title.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="adm-picker">
      {loading && <p className="adm-sub">{A.loadingVideos}</p>}
      {err && <p className="adm-msg">{err}</p>}
      {videos && (
        <>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={A.searchVideos} />
          <ul>
            {shown.map((v) => (
              <li key={v.guid}>
                <button type="button" onClick={() => onPick(v.guid)}>
                  <b>{v.title}</b>
                  <span className="adm-sub">{Math.floor(v.seconds / 60)}:{String(v.seconds % 60).padStart(2, "0")}{!v.ready && ` · ${A.videoNotReady}`}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function QuizEditor({ moduleId, quiz, onClose }: { moduleId: Id<"courseModules">; quiz: QuizItem[]; onClose: () => void }) {
  const A = useContent().admin;
  const saveQuiz = useMutation(api.adminCourse.saveQuiz);
  const [items, setItems] = useState<QuizItem[]>(() => quiz.map((q) => ({ ...q, choices: [...q.choices] })));
  const { busy, msg, run } = useRun();
  const upd = (i: number, patch: Partial<QuizItem>) => setItems((arr) => arr.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <div className="adm-quiz">
      <h4>{A.quizTitle}</h4>
      <p className="adm-sub">{A.quizHint}</p>
      {items.map((q, i) => (
        <fieldset key={i} className="adm-q">
          <legend>{i + 1}.</legend>
          <label>{A.question}<textarea value={q.q} onChange={(e) => upd(i, { q: e.target.value })} rows={2} /></label>
          {q.choices.map((c, ci) => (
            <div key={ci} className="adm-choice">
              <input type="radio" name={`ans-${moduleId}-${i}`} checked={q.answer === ci} onChange={() => upd(i, { answer: ci })} aria-label={`${A.choice} ${ci + 1}`} />
              <input value={c} onChange={(e) => upd(i, { choices: q.choices.map((x, xi) => (xi === ci ? e.target.value : x)) })} placeholder={`${A.choice} ${ci + 1}`} />
              {q.choices.length > 2 && (
                <button type="button" className="adm-x" aria-label={A.delete} onClick={() => upd(i, {
                  choices: q.choices.filter((_, xi) => xi !== ci),
                  answer: q.answer === ci ? 0 : q.answer > ci ? q.answer - 1 : q.answer,
                })}>×</button>
              )}
            </div>
          ))}
          {q.choices.length < 8 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => upd(i, { choices: [...q.choices, ""] })}>{A.addChoice}</button>}
          <label>{A.explain}<textarea value={q.explain} onChange={(e) => upd(i, { explain: e.target.value })} rows={2} /></label>
          <button type="button" className="btn btn-ghost btn-sm adm-danger" onClick={() => setItems((arr) => arr.filter((_, j) => j !== i))}>{A.removeQuestion}</button>
        </fieldset>
      ))}
      <div className="adm-row">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setItems((arr) => [...arr, { q: "", choices: ["", ""], answer: 0, explain: "" }])}>{A.addQuestion}</button>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(() => saveQuiz({ moduleId, quiz: items }), A.saved)}>{busy ? A.saving : A.save}</button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>{A.close}</button>
        {msg && <span className="adm-msg">{msg}</span>}
      </div>
    </div>
  );
}
