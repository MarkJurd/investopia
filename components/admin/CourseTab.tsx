"use client";

/* แท็บ "บทเรียน": ซ้าย = ทั้งคอร์ส (ลากเรียงบท/โมดูลได้อิสระ ข้ามโมดูลได้) · ขวา = แก้รายละเอียดบท/โมดูลที่เลือก (วิดีโอ, ไฟล์แนบ, แบบทดสอบ ฯลฯ) */
import { useEffect, useRef, useState } from "react";
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

function moveTo<T>(arr: T[], from: number, to: number): T[] {
  const out = [...arr];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}

function DragHandle() {
  const A = useContent().admin;
  return <span className="adm-drag-handle" aria-hidden="true" title={A.dragHandle}>⠿</span>;
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
  const { busy, msg, run } = useRun();

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

  return <CourseList tree={tree} />;
}

type Sel = { kind: "module" | "lesson"; id: string } | null;
type Drag = { kind: "module" | "lesson"; key: string } | null;

/** ทั้งคอร์สกางอยู่ทางซ้าย (ลากบท/โมดูลได้อิสระ ข้ามโมดูลได้) · คลิกแล้วแก้รายละเอียดในแผงขวา */
function CourseList({ tree }: { tree: Tree }) {
  const C = useContent();
  const A = C.admin;
  const addModule = useMutation(api.adminCourse.addModule);
  const addLesson = useMutation(api.adminCourse.addLesson);
  const reorderModules = useMutation(api.adminCourse.reorderModules);
  const reorderLessons = useMutation(api.adminCourse.reorderLessons);
  const { busy, msg, run } = useRun();
  const [sel, setSel] = useState<Sel>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [over, setOver] = useState<string | null>(null);
  // ลำดับใหม่ที่รอเซิร์ฟเวอร์บันทึก — แสดงไปก่อนเพื่อไม่ให้กระตุก
  const [pendingMods, setPendingMods] = useState<string[] | null>(null);
  const [pendingLes, setPendingLes] = useState<Record<string, string[]>>({});
  const [now] = useState(() => Date.now());
  const panelRef = useRef<HTMLElement>(null);

  const lessonByKey = new Map(tree.modules.flatMap((m) => m.lessons.map((l) => [l.key, l] as const)));
  const modByKey = new Map(tree.modules.map((m) => [m.key, m]));
  const modules = pendingMods ? pendingMods.flatMap((k) => modByKey.get(k) ?? []) : tree.modules;
  const lessonsOf = (m: Mod): Les[] => {
    const p = pendingLes[m.key];
    if (p) return p.flatMap((k) => lessonByKey.get(k) ?? []);
    // บทที่เพิ่งลากออกไปโมดูลอื่น (ยังรอบันทึก) ไม่ต้องแสดงซ้ำที่นี่
    const away = new Set(Object.entries(pendingLes).filter(([k]) => k !== m.key).flatMap(([, ks]) => ks));
    return m.lessons.filter((l) => !away.has(l.key));
  };

  const selMod = sel?.kind === "module" ? tree.modules.find((m) => m.id === sel.id) : undefined;
  const selLessonMod = sel?.kind === "lesson" ? tree.modules.find((m) => m.lessons.some((l) => l.id === sel.id)) : undefined;
  const selLesson = selLessonMod?.lessons.find((l) => l.id === sel?.id);

  // มือถือ: แผงแก้ไขอยู่ใต้รายการ → เลื่อนลงไปให้เห็น
  useEffect(() => {
    if (sel && window.matchMedia("(max-width: 900px)").matches) panelRef.current?.scrollIntoView({ block: "start" });
  }, [sel]);

  const saveLessons = (m: Mod, keys: string[]) => {
    setPendingLes((p) => ({ ...p, [m.key]: keys }));
    void run(() => reorderLessons({ moduleId: m.id as Id<"courseModules">, ids: keys.map((k) => lessonByKey.get(k)?.id as Id<"courseLessons">) }))
      .finally(() => setPendingLes((p) => { const next = { ...p }; delete next[m.key]; return next; }));
  };
  const saveModules = (keys: string[]) => {
    setPendingMods(keys);
    void run(() => reorderModules({ ids: keys.map((k) => modByKey.get(k)?.id as Id<"courseModules">) })).finally(() => setPendingMods(null));
  };
  /** วางบทที่ลากไว้ในโมดูล m ก่อนแถวที่ index (null = ท้ายโมดูล) */
  const placeLesson = (m: Mod, index: number | null) => {
    if (drag?.kind !== "lesson") return;
    const keys = lessonsOf(m).map((l) => l.key);
    const rest = keys.filter((k) => k !== drag.key);
    rest.splice(index ?? rest.length, 0, drag.key);
    if (rest.join() !== keys.join()) saveLessons(m, rest);
  };
  const endDrag = () => { setDrag(null); setOver(null); };
  const add = (m: Mod, gate: boolean) => void run(async () => {
    const id = await addLesson({ moduleId: m.id as Id<"courseModules">, title: gate ? A.newExerciseTitle : A.newLessonTitle, gate });
    setSel({ kind: "lesson", id });
  });

  let visibleIndex = 0;
  return (
    <div className="adm-course2">
      <div className="adm-tree">
        <p className="adm-hint">{A.courseHint}</p>
        {modules.map((m, mi) => {
          const tag = m.hidden ? A.hiddenBadge : `${A.moduleTag} ${++visibleIndex}`;
          const lessons = lessonsOf(m);
          const modOver = over === m.key && drag !== null;
          return (
            <section key={m.key}
              className={`adm-mod2${m.hidden ? " is-hidden" : ""}${modOver && drag?.kind === "module" ? " drop-above" : ""}${modOver && drag?.kind === "lesson" ? " drop-in" : ""}`}
              onDragOver={(e) => { if (!drag) return; e.preventDefault(); if (over !== m.key) setOver(m.key); }}
              onDrop={(e) => {
                e.preventDefault();
                if (drag?.kind === "lesson") placeLesson(m, null);
                if (drag?.kind === "module" && drag.key !== m.key) {
                  const keys = modules.map((x) => x.key);
                  saveModules(moveTo(keys, keys.indexOf(drag.key), mi));
                }
                endDrag();
              }}>
              <div className={`adm-mod2-head${sel?.kind === "module" && sel.id === m.id ? " on" : ""}`}
                draggable onDragStart={(e) => { setDrag({ kind: "module", key: m.key }); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", m.key); }}
                onDragEnd={endDrag}>
                <DragHandle />
                <button type="button" className="adm-mod2-title" onClick={() => setSel({ kind: "module", id: m.id as string })}>
                  <span className="lo-tag">{tag}</span> <b>{m.title}</b>
                  {m.quiz.length > 0 && <span className="adm-sub">· {m.quiz.length} {A.quizCount}</span>}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => add(m, false)}>{A.addLesson}</button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => add(m, true)}>{A.addExercise}</button>
              </div>
              <ol className="adm-rows">
                {lessons.map((l, i) => {
                  const dragFrom = drag?.kind === "lesson" ? lessons.findIndex((x) => x.key === drag.key) : -1;
                  const isOver = over === l.key && drag?.kind === "lesson" && drag.key !== l.key;
                  return (
                    <li key={l.key}
                      className={`${drag?.kind === "lesson" && drag.key === l.key ? "is-dragging" : ""}${isOver ? (dragFrom !== -1 && dragFrom < i ? " drop-below" : " drop-above") : ""}`}
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); setDrag({ kind: "lesson", key: l.key }); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", l.key); }}
                      onDragEnd={endDrag}
                      onDragOver={(e) => { if (drag?.kind !== "lesson") return; e.preventDefault(); e.stopPropagation(); if (over !== l.key) setOver(l.key); }}
                      onDrop={(e) => { if (drag?.kind !== "lesson") return; e.preventDefault(); e.stopPropagation(); placeLesson(m, i); endDrag(); }}>
                      <button type="button" className={`adm-row2${sel?.kind === "lesson" && sel.id === l.id ? " on" : ""}${l.hidden ? " is-hidden" : ""}`}
                        onClick={() => setSel({ kind: "lesson", id: l.id as string })}>
                        <DragHandle />
                        <span className="adm-ico" title={l.gate ? A.gateBadge : l.videoId ? A.hasVideoBadge : A.noVideo}>{l.gate ? "📝" : l.videoId ? "🎬" : "⚪"}</span>
                        <span className="adm-row2-title">{l.title}</span>
                        <span className="adm-badges">
                          {l.hidden && <i className="b-hidden">{A.hiddenBadge}</i>}
                          {l.gate && <i>{A.gateBadge}</i>}
                          {l.quiz.length > 0 && <i>❓ {l.quiz.length} {A.lessonQuizCount}</i>}
                          {l.free && <i className="b-ok">{A.freeBadge}</i>}
                          {l.indicatorOnly && <i>{A.indicatorBadge}</i>}
                          {l.files.length + l.links.length > 0 && <i>📎 {l.files.length + l.links.length}</i>}
                          {isRecent(l.newSince, now) && <i className="b-new">{C.learn.newBadge}</i>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {lessons.length === 0 && <p className="adm-empty">{A.emptyModule}</p>}
            </section>
          );
        })}
        <button className="btn btn-ghost" disabled={busy} onClick={() => void run(async () => {
          const id = await addModule({ title: A.newModuleTitle });
          setSel({ kind: "module", id });
        })}>{A.addModule}</button>
        {msg && <p className="adm-msg">{msg}</p>}
      </div>

      <aside className="adm-panel card" ref={panelRef}>
        {selLesson && selLessonMod ? (
          <>
            <h3 className="adm-h3">{A.lessonSettings}</h3>
            <LessonEditor key={selLesson.key} lesson={selLesson} moduleId={selLessonMod.id as Id<"courseModules">} modules={tree.modules}
              bunnyReady={tree.bunnyListReady} onClose={() => setSel(null)}
              onMove={(dir) => {
                const keys = lessonsOf(selLessonMod).map((l) => l.key);
                const next = move(keys, keys.indexOf(selLesson.key), dir);
                if (next !== keys) saveLessons(selLessonMod, next);
              }} />
          </>
        ) : selMod ? (
          <>
            <h3 className="adm-h3">{A.moduleSettings}</h3>
            <ModulePanel key={selMod.key} mod={selMod} onClose={() => setSel(null)} />
          </>
        ) : (
          <p className="adm-sub">{A.pickHint}</p>
        )}
      </aside>
    </div>
  );
}

function ModulePanel({ mod, onClose }: { mod: Mod; onClose: () => void }) {
  const A = useContent().admin;
  const saveModule = useMutation(api.adminCourse.saveModule);
  const deleteModule = useMutation(api.adminCourse.deleteModule);
  const saveQuiz = useMutation(api.adminCourse.saveQuiz);
  const [title, setTitle] = useState(mod.title);
  const [practice, setPractice] = useState(mod.practice);
  const [hidden, setHidden] = useState(mod.hidden);
  const { busy, msg, run } = useRun();
  const id = mod.id as Id<"courseModules">;
  const dirty = title !== mod.title || practice !== mod.practice || hidden !== mod.hidden;

  return (
    <div className="adm-editor">
      <div className="adm-form">
        <label>{A.moduleTitle}<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></label>
        <label>{A.practice}<textarea value={practice} onChange={(e) => setPractice(e.target.value)} rows={2} maxLength={5000} /></label>
        <label className="adm-check"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> {A.hidden}</label>
        <div className="adm-row">
          <button className="btn btn-primary btn-sm" disabled={busy || !dirty} onClick={() => void run(() => saveModule({ id, title, practice, hidden }), A.saved)}>{busy ? A.saving : A.save}</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{A.close}</button>
          {msg && <span className="adm-msg">{msg}</span>}
        </div>
      </div>
      <QuizEditor name={mod.key} quiz={mod.quiz} save={(quiz) => saveQuiz({ moduleId: id, quiz })} title={A.quizTitle} hint={A.quizHint} />
      <div className="adm-extra">
        <button className="btn btn-ghost btn-sm adm-danger" disabled={busy} onClick={() => {
          const n = mod.lessons.length;
          const text = n === 0 ? A.confirmDelete : A.confirmDeleteModule.replace("{title}", mod.title).replace("{n}", String(n));
          if (confirm(text)) void run(() => deleteModule({ id, deleteLessons: n > 0 }));
        }}>{A.deleteModule}</button>
      </div>
    </div>
  );
}

function LessonEditor({ lesson, moduleId, modules, bunnyReady, onClose, onMove }: {
  lesson: Les; moduleId: Id<"courseModules">; modules: Mod[]; bunnyReady: boolean; onClose: () => void; onMove: (dir: -1 | 1) => void;
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
  const addLink = useMutation(api.adminCourse.addLessonLink);
  const delLink = useMutation(api.adminCourse.deleteLessonLink);
  const saveLessonQuiz = useMutation(api.adminCourse.saveLessonQuiz);
  const [link, setLink] = useState({ title: "", url: "" });
  const id = lesson.id as Id<"courseLessons">;

  const [f, setF] = useState({
    title: lesson.title, notes: lesson.notes, videoId: lesson.videoId, minutes: lesson.minutes,
    hidden: lesson.hidden, indicatorOnly: lesson.indicatorOnly, free: lesson.free, gate: lesson.gate,
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
        <label className="adm-check"><input type="checkbox" checked={f.free} onChange={(e) => set("free", e.target.checked)} /> {A.freeLesson}</label>
        <label className="adm-check"><input type="checkbox" checked={f.gate} onChange={(e) => set("gate", e.target.checked)} /> {A.gateLesson}</label>
        <div className="adm-row">
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(() => saveLesson({ id, ...f }), A.saved)}>{busy ? A.saving : A.save}</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>{A.close}</button>
          {msg && <span className="adm-msg">{msg}</span>}
        </div>
      </div>

      <QuizEditor name={lesson.key} quiz={lesson.quiz} save={(quiz) => saveLessonQuiz({ id, quiz })} title={A.lessonQuizTitle} hint={A.lessonQuizHint} />

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

        <h4>{A.links}</h4>
        {lesson.links.length === 0 && <p className="adm-sub">{A.noLinks}</p>}
        <ul>
          {lesson.links.map((k, i) => (
            <li key={i}>
              <a href={k.url} target="_blank" rel="noopener noreferrer">🔗 {k.title}</a>
              <button className="btn btn-ghost btn-sm adm-danger" onClick={() => { if (confirm(A.confirmDelete)) void run(() => delLink({ lessonId: id, index: i })); }}>{A.delete}</button>
            </li>
          ))}
        </ul>
        <form className="adm-row" onSubmit={(e) => { e.preventDefault(); void run(async () => { await addLink({ lessonId: id, ...link }); setLink({ title: "", url: "" }); }); }}>
          <input value={link.title} onChange={(e) => setLink((o) => ({ ...o, title: e.target.value }))} placeholder={A.linkTitle} maxLength={150} />
          <input type="url" required value={link.url} onChange={(e) => setLink((o) => ({ ...o, url: e.target.value }))} placeholder={A.linkUrl} />
          <button className="btn btn-ghost btn-sm" disabled={busy}>{A.addLink}</button>
        </form>
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
          <Arrows disabled={busy} onUp={() => onMove(-1)} onDown={() => onMove(1)} />
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

function QuizEditor({ name, quiz, save, title, hint }: { name: string; quiz: QuizItem[]; save: (quiz: QuizItem[]) => Promise<unknown>; title: string; hint: string }) {
  const A = useContent().admin;
  const [items, setItems] = useState<QuizItem[]>(() => quiz.map((q) => ({ ...q, choices: [...q.choices] })));
  const { busy, msg, run } = useRun();
  const upd = (i: number, patch: Partial<QuizItem>) => setItems((arr) => arr.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <div className="adm-quiz">
      <h4>{title}</h4>
      <p className="adm-sub">{hint}</p>
      {items.map((q, i) => (
        <fieldset key={i} className="adm-q">
          <legend>{i + 1}.</legend>
          <label>{A.question}<textarea value={q.q} onChange={(e) => upd(i, { q: e.target.value })} rows={2} /></label>
          {q.choices.map((c, ci) => (
            <div key={ci} className="adm-choice">
              <input type="radio" name={`ans-${name}-${i}`} checked={q.answer === ci} onChange={() => upd(i, { answer: ci })} aria-label={`${A.choice} ${ci + 1}`} />
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
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void run(() => save(items), A.saved)}>{busy ? A.saving : A.save}</button>
        {msg && <span className="adm-msg">{msg}</span>}
      </div>
    </div>
  );
}
