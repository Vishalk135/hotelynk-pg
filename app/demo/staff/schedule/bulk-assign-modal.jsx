"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRefresh } from "../../use-refresh";
import Modal from "../modal";
import { callApi, inputCls, labelCls, primaryBtn } from "../ui";
import { monthBounds, WEEKDAY_SHORT } from "@/lib/dates";

// Fill (or clear) many days at once: choose people, a date range and the weekdays.
export default function BulkAssignModal({ month, staff, shiftTypes, onClose, onDone }) {
  const { first, last } = monthBounds(month);
  const [staffIds, setStaffIds] = useState([]);
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(last);
  const [weekdays, setWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [shiftTypeId, setShiftTypeId] = useState(shiftTypes[0]?.id ?? "");
  const [duties, setDuties] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useRefresh(onDone); // onDone runs after the grid has refreshed

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const clearing = shiftTypeId === "";

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await callApi("/api/schedule/bulk", "POST", {
        staffIds,
        from,
        to,
        weekdays,
        shiftTypeId: clearing ? null : shiftTypeId,
        duties,
      });
      refresh(); // stays on its spinner until the new schedule is on screen
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Bulk assign" onClose={onClose} size="md">
      <p className="mt-2 font-body text-sm text-dusk/60">
        Fill many days in one go, for example "Sunita works Morning every Monday to Friday this month". Existing days in
        the range are overwritten.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Staff</label>
            <button
              type="button"
              onClick={() => setStaffIds(staffIds.length === staff.length ? [] : staff.map((s) => s.id))}
              className="font-body text-xs font-medium text-coral-dark hover:underline"
            >
              {staffIds.length === staff.length ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="mt-2 grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto rounded-xl border border-dusk/10 bg-white p-2 sm:grid-cols-2">
            {staff.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 font-body text-sm text-dusk hover:bg-dusk/5">
                <input type="checkbox" checked={staffIds.includes(s.id)} onChange={() => toggle(staffIds, setStaffIds, s.id)} />
                <span className="truncate">{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>From</label>
            <input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input type="date" required value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>On these weekdays</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {WEEKDAY_SHORT.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggle(weekdays, setWeekdays, i)}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs transition ${weekdays.includes(i) ? "border-dusk bg-dusk text-cream" : "border-dusk/15 bg-white/60 text-dusk/60"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Shift</label>
          <select value={shiftTypeId} onChange={(e) => setShiftTypeId(e.target.value)} className={inputCls}>
            {shiftTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.kind === "WORK" ? ` (${t.startTime}–${t.endTime})` : ""}
              </option>
            ))}
            <option value="">— Clear these days (remove from schedule) —</option>
          </select>
        </div>

        {!clearing && (
          <div>
            <label className={labelCls}>Duties (optional, applied to every day)</label>
            <textarea value={duties} onChange={(e) => setDuties(e.target.value)} maxLength={1000} rows={2} className={`${inputCls} resize-none`} />
          </div>
        )}

        {error && <p className="font-body text-sm text-coral">{error}</p>}
        <button type="submit" disabled={busy || staffIds.length === 0 || weekdays.length === 0} className={primaryBtn}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {clearing ? "Clear days" : "Apply to schedule"}
        </button>
      </form>
    </Modal>
  );
}
