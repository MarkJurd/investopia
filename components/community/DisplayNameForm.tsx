"use client";

/* ตั้ง/แก้ชื่อที่แสดงในคอมมูนิตี้ (ชื่อเล่น — ไม่ใช้ชื่อจริง/รูปจาก Google) */
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useContent } from "@/components/ContentContext";
import { errorText } from "@/components/community/helpers";

export default function DisplayNameForm({ current, onDone }: { current: string | null; onDone?: () => void }) {
  const C = useContent();
  const D = C.community;
  const setName = useMutation(api.community.setDisplayName);
  const [value, setValue] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await setName({ name: value });
      onDone?.();
    } catch (err) {
      setError(errorText(err, C));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="name-form" onSubmit={(e) => void save(e)}>
      {!current && <><b>{D.nameTitle}</b><p>{D.nameText}</p></>}
      <div className="name-row">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={D.namePh} maxLength={40} aria-label={D.namePh} aria-invalid={!!error} />
        <button className="btn btn-primary btn-sm" disabled={busy || value.trim().length < 2}>{D.nameSave}</button>
        {current && <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>{D.cancel}</button>}
      </div>
      {error && <p className="learn-error" role="alert">{error}</p>}
    </form>
  );
}
