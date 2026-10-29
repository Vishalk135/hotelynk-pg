"use client";

import { useState } from "react";
import { useRefresh } from "../../use-refresh";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import Modal from "../modal";
import { callApi, inputCls, labelCls, primaryBtn } from "../ui";
import { fmtTime } from "@/lib/dates";

const KIND_LABEL = { WORK: "Working shift", OFF: "Week off", LEAVE: "Leave" };
const EMPTY = { name: "", code: "", kind: "WORK", startTime: "09:00", endTime: "18:00", color: "#0891B2" };

// The master list of shifts (Morning, Evening, Week off, Leave...). Add, edit, delete.
export default function ShiftTypesManager({ shiftTypes, onClose }) {
  const [form, setForm] = useState(null); // null = list view, otherwise { id?, ...fields }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh, refreshing } = useRefresh(() => setForm(null)); // back to the list once saved
  const working = busy || refreshing;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { id, ...body } = form;
      await callApi(id ? `/api/shift-types/${id}` : "/api/shift-types", id ? "PATCH" : "POST", body);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    setError("");
    try {
      await callApi(`/api/shift-types/${id}`, "DELETE");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={form ? (form.id ? "Edit shift" : "New shift") : "Shifts"} onClose={onClose} size="md">
      {!form ? (
        <>
          <p className="mt-2 font-body text-sm text-dusk/60">The shifts you can assign in the schedule.</p>
          <ul className="mt-4 divide-y divide-dusk/10 rounded-2xl border border-dusk/10 bg-white/70">
            {shiftTypes.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold" style={{ backgroundColor: t.color + "22", color: t.color }}>
                  {t.code}
                </span>
                <span className="flex-1 font-body text-sm text-dusk">
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-2 text-xs text-dusk/45">
                    {t.kind === "WORK" ? `${fmtTime(t.startTime)} – ${fmtTime(t.endTime)}` : KIND_LABEL[t.kind]}
                  </span>
                </span>
                <button
                  onClick={() => {
                    setError("");
                    setForm({ id: t.id, name: t.name, code: t.code, kind: t.kind, startTime: t.startTime || "09:00", endTime: t.endTime || "18:00", color: t.color });
                  }}
                  aria-label={`Edit ${t.name}`}
                  className="rounded-lg p-1.5 text-dusk/50 hover:bg-dusk/5 hover:text-dusk"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(t.id)} disabled={working} aria-label={`Delete ${t.name}`} className="rounded-lg p-1.5 text-dusk/50 hover:bg-coral/10 hover:text-coral">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          {error && <p className="mt-3 font-body text-sm text-coral">{error}</p>}
          <button
            onClick={() => {
              setError("");
              setForm({ ...EMPTY });
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-dusk/15 bg-white/60 px-5 py-2.5 font-body text-sm font-medium text-dusk hover:border-dusk/30"
          >
            <Plus className="h-4 w-4" /> Add shift
          </button>
        </>
      ) : (
        <form onSubmit={save} className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Name</label>
              <input required maxLength={40} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Split shift" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Code</label>
              <input required maxLength={5} value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="S" className={`${inputCls} uppercase`} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={form.kind} onChange={(e) => set("kind", e.target.value)} className={inputCls}>
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          {form.kind === "WORK" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Starts</label>
                <input type="time" required value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ends</label>
                <input type="time" required value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className={inputCls} />
              </div>
              <p className="col-span-2 -mt-1 font-body text-xs text-dusk/45">For a night shift, an end time earlier than the start time is fine (e.g. 10 PM to 6 AM).</p>
            </div>
          )}
          <div>
            <label className={labelCls}>Colour</label>
            <input type="color" value={form.color} onChange={(e) => set("color", e.target.value.toUpperCase())} className="mt-1 h-10 w-20 cursor-pointer rounded-lg border border-dusk/15 bg-white p-1" />
          </div>
          {error && <p className="font-body text-sm text-coral">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setForm(null)} className="rounded-full border border-dusk/15 bg-white/60 px-5 py-3 font-body text-sm font-medium text-dusk">
              Back
            </button>
            <button type="submit" disabled={working} className={`${primaryBtn} flex-1`}>
              {working && <Loader2 className="h-4 w-4 animate-spin" />}
              Save shift
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
