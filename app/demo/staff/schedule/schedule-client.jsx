"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet, Layers, Clock, ArrowLeft, Loader2 } from "lucide-react";
import Modal from "../modal";
import { ModalLoading } from "../../skeletons";
import { useRefresh } from "../../use-refresh";
import { callApi, dangerGhostBtn, ghostBtn, inputCls, labelCls, primaryBtn } from "../ui";
import { datesOfMonth, weekdayIndex, WEEKDAY_SHORT, longDateLabel, fmtTime } from "@/lib/dates";

// These two pop-ups are only needed when clicked, so their code is downloaded on first use
// instead of being part of the page's initial JavaScript.
const ShiftTypesManager = dynamic(() => import("./shift-types-manager"), { ssr: false, loading: () => <ModalLoading /> });
const BulkAssignModal = dynamic(() => import("./bulk-assign-modal"), { ssr: false, loading: () => <ModalLoading /> });

const timeRange = (t) => (t.startTime && t.endTime ? `${fmtTime(t.startTime)} – ${fmtTime(t.endTime)}` : "");

export default function ScheduleClient({ month, monthTitle, prevMonth, nextMonth, today, canEdit, staff, shiftTypes, entries }) {
  const [cell, setCell] = useState(null); // { staff, date }
  const [showBulk, setShowBulk] = useState(false);
  const [showShifts, setShowShifts] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  const dates = useMemo(() => datesOfMonth(month), [month]);
  const shiftById = useMemo(() => new Map(shiftTypes.map((t) => [t.id, t])), [shiftTypes]);
  const entryOf = useMemo(() => new Map(entries.map((e) => [`${e.staffId}|${e.date}`, e])), [entries]);

  const workDays = (staffId) =>
    dates.filter((d) => shiftById.get(entryOf.get(`${staffId}|${d}`)?.shiftTypeId)?.kind === "WORK").length;

  const exportUrl = (format, staffId) =>
    `/api/schedule/export?month=${month}&format=${format}${staffId ? `&staffId=${staffId}` : ""}`;

  return (
    <div>
      <Link href="/demo/staff" className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-dusk/60 hover:text-dusk">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to staff
      </Link>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-dusk/60">CREW</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-dusk sm:text-3xl">Monthly schedule</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button onClick={() => setShowBulk(true)} className={ghostBtn}>
                <Layers className="h-4 w-4" /> Bulk assign
              </button>
              <button onClick={() => setShowShifts(true)} className={ghostBtn}>
                <Clock className="h-4 w-4" /> Manage shifts
              </button>
            </>
          )}
          <div className="relative">
            <button onClick={() => setShowDownload((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-dusk px-5 py-2.5 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-dusk/85">
              <Download className="h-4 w-4" /> Download
            </button>
            {showDownload && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDownload(false)} />
                <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-dusk/10 bg-white shadow-lift">
                  <p className="px-4 pt-3 font-mono text-[10px] uppercase tracking-wide text-dusk/40">
                    {monthTitle} · everyone
                  </p>
                  <a href={exportUrl("pdf")} onClick={() => setShowDownload(false)} className="flex items-center gap-2 px-4 py-2.5 font-body text-sm text-dusk hover:bg-dusk/5">
                    <FileText className="h-4 w-4 text-coral-dark" /> PDF (one page per person)
                  </a>
                  <a href={exportUrl("csv")} onClick={() => setShowDownload(false)} className="flex items-center gap-2 px-4 py-2.5 font-body text-sm text-dusk hover:bg-dusk/5">
                    <FileSpreadsheet className="h-4 w-4 text-moss-dark" /> CSV (Excel)
                  </a>
                  <p className="border-t border-dusk/10 px-4 py-2 font-body text-[11px] text-dusk/45">
                    For one person, use the PDF icon on their row.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="mt-6 flex items-center gap-2">
        <Link href={`/demo/staff/schedule?month=${prevMonth}`} aria-label="Previous month" className="rounded-full border border-dusk/15 bg-white/60 p-2 text-dusk hover:border-dusk/30">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h2 className="min-w-[10rem] text-center font-display text-lg font-bold text-dusk">{monthTitle}</h2>
        <Link href={`/demo/staff/schedule?month=${nextMonth}`} aria-label="Next month" className="rounded-full border border-dusk/15 bg-white/60 p-2 text-dusk hover:border-dusk/30">
          <ChevronRight className="h-4 w-4" />
        </Link>
        {month !== today.slice(0, 7) && (
          <Link href="/demo/staff/schedule" className="ml-2 font-body text-xs font-medium text-coral-dark hover:underline">
            Jump to this month
          </Link>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {shiftTypes.map((t) => (
          <span key={t.id} className="inline-flex items-center gap-2 rounded-full border border-dusk/10 bg-white/70 px-3 py-1.5 font-body text-xs text-dusk">
            <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold" style={{ backgroundColor: t.color + "22", color: t.color }}>
              {t.code}
            </span>
            {t.name}
            {t.kind === "WORK" && <span className="text-dusk/40">{timeRange(t)}</span>}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-dusk/10 bg-white shadow-soft">
        {staff.length === 0 ? (
          <p className="px-6 py-10 text-center font-body text-sm text-dusk/50">
            Add staff members first, then plan their month here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="border-collapse text-left">
              <thead>
                <tr className="font-mono text-[10px] uppercase text-dusk/45">
                  <th className="sticky left-0 z-10 min-w-[170px] border-b border-r border-dusk/10 bg-white px-4 py-2 font-medium">Staff</th>
                  {dates.map((d) => {
                    const wd = weekdayIndex(d);
                    return (
                      <th key={d} className={`min-w-[38px] border-b border-dusk/10 px-0.5 py-1.5 text-center font-medium ${wd >= 5 ? "bg-dusk/[0.04]" : ""} ${d === today ? "text-coral-dark" : ""}`}>
                        <span className="block text-[12px] font-semibold">{d.slice(8)}</span>
                        <span className="block">{WEEKDAY_SHORT[wd].slice(0, 2)}</span>
                      </th>
                    );
                  })}
                  <th className="border-b border-l border-dusk/10 px-3 py-2 text-center font-medium">Days</th>
                  <th className="border-b border-dusk/10 px-3 py-2 text-center font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="font-body text-sm text-dusk">
                    <td className="sticky left-0 z-10 border-b border-r border-dusk/10 bg-white px-4 py-2">
                      <span className="block font-medium leading-tight">{s.name}</span>
                      <span className="block text-xs text-dusk/50">{s.role}</span>
                    </td>
                    {dates.map((d) => {
                      const e = entryOf.get(`${s.id}|${d}`);
                      const t = e ? shiftById.get(e.shiftTypeId) : null;
                      const wd = weekdayIndex(d);
                      return (
                        <td key={d} className={`border-b border-dusk/5 p-0.5 text-center ${wd >= 5 ? "bg-dusk/[0.04]" : ""} ${d === today ? "outline outline-1 -outline-offset-1 outline-coral/50" : ""}`}>
                          <button
                            onClick={() => setCell({ staff: s, date: d })}
                            title={t ? `${t.name}${t.kind === "WORK" ? " · " + timeRange(t) : ""}${e.duties ? "\n" + e.duties : ""}` : "Not scheduled"}
                            className="relative block h-8 w-full min-w-[34px] rounded-md font-mono text-[10px] font-semibold transition hover:ring-2 hover:ring-dusk/20"
                            style={t ? { backgroundColor: t.color + "22", color: t.color } : { color: "rgba(11,14,20,0.2)" }}
                          >
                            {t ? t.code : "·"}
                            {e?.duties && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-dusk/40" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="border-b border-l border-dusk/10 px-3 text-center font-mono text-xs text-dusk/70">{workDays(s.id)}</td>
                    <td className="border-b border-dusk/10 px-3 text-center">
                      <a href={exportUrl("pdf", s.id)} aria-label={`Download ${s.name}'s schedule as PDF`} title="Download this person's PDF" className="inline-flex rounded-lg p-1.5 text-dusk/50 hover:bg-dusk/5 hover:text-coral-dark">
                        <FileText className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 font-body text-xs text-dusk/45">
        {canEdit ? "Click any day to set the shift and duties." : "Click any day to see the shift and duties."} A dot in the corner of a day means duties are written for it.
      </p>

      {cell && (
        <DayEditor
          key={`${cell.staff.id}|${cell.date}`}
          cell={cell}
          entry={entryOf.get(`${cell.staff.id}|${cell.date}`)}
          shiftTypes={shiftTypes}
          canEdit={canEdit}
          onClose={() => setCell(null)}
          onSaved={() => setCell(null)}
        />
      )}
      {showBulk && (
        <BulkAssignModal
          month={month}
          staff={staff}
          shiftTypes={shiftTypes}
          onClose={() => setShowBulk(false)}
          onDone={() => setShowBulk(false)}
        />
      )}
      {showShifts && <ShiftTypesManager shiftTypes={shiftTypes} onClose={() => setShowShifts(false)} />}
    </div>
  );
}

// Edit one day for one person: pick a shift, write the duties. Read-only for non-owners.
function DayEditor({ cell, entry, shiftTypes, canEdit, onClose, onSaved }) {
  const [shiftTypeId, setShiftTypeId] = useState(entry?.shiftTypeId ?? null);
  const [duties, setDuties] = useState(entry?.duties ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useRefresh(onSaved); // closes this pop-up once the grid has refreshed

  const current = shiftTypes.find((t) => t.id === (canEdit ? shiftTypeId : entry?.shiftTypeId));

  async function save() {
    if (!shiftTypeId) return setError("Choose a shift.");
    setBusy(true);
    setError("");
    try {
      await callApi("/api/schedule", "PUT", { staffId: cell.staff.id, date: cell.date, shiftTypeId, duties });
      refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function clearDay() {
    setBusy(true);
    setError("");
    try {
      await callApi("/api/schedule", "DELETE", { staffId: cell.staff.id, date: cell.date });
      refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={cell.staff.name} onClose={onClose} size="md">
      <p className="mt-1 font-body text-sm text-dusk/60">
        {cell.staff.role} · {longDateLabel(cell.date)}
      </p>

      {canEdit ? (
        <div className="mt-5 space-y-4">
          <div>
            <label className={labelCls}>Shift</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {shiftTypes.map((t) => {
                const selected = t.id === shiftTypeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setShiftTypeId(t.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition ${selected ? "border-dusk bg-white shadow-soft" : "border-dusk/10 bg-white/60 hover:border-dusk/30"}`}
                  >
                    <span className="flex items-center gap-2 font-body text-sm font-medium text-dusk">
                      <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold" style={{ backgroundColor: t.color + "22", color: t.color }}>
                        {t.code}
                      </span>
                      {t.name}
                    </span>
                    {t.kind === "WORK" && <span className="mt-0.5 block font-mono text-[10px] text-dusk/45">{timeRange(t)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={labelCls}>Duties for the day (optional)</label>
            <textarea
              value={duties}
              onChange={(e) => setDuties(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="e.g. Clean checkout rooms 2 and 5, restock linen, help with breakfast service"
              className={`${inputCls} resize-none`}
            />
          </div>
          {error && <p className="font-body text-sm text-coral">{error}</p>}
          <div className="flex gap-3">
            {entry && (
              <button onClick={clearDay} disabled={busy} className={dangerGhostBtn}>
                Clear day
              </button>
            )}
            <button onClick={save} disabled={busy} className={`${primaryBtn} flex-1`}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {current ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border border-dusk/10 bg-white px-3 py-1.5 font-body text-sm text-dusk">
                <span className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold" style={{ backgroundColor: current.color + "22", color: current.color }}>
                  {current.code}
                </span>
                {current.name}
                {current.kind === "WORK" && <span className="text-dusk/50">{timeRange(current)}</span>}
              </span>
              <p className="whitespace-pre-wrap rounded-xl border border-dusk/10 bg-white px-4 py-3 font-body text-sm text-dusk">
                {entry?.duties || "No specific duties written for this day."}
              </p>
            </>
          ) : (
            <p className="font-body text-sm text-dusk/60">Not scheduled for this day.</p>
          )}
        </div>
      )}
    </Modal>
  );
}
