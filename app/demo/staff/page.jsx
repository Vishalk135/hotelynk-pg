import Link from "next/link";
import { CalendarDays, UserCog } from "lucide-react";
import AddStaffButton from "./add-staff-button";
import RolesManager from "./roles-manager";
import StaffRowActions from "./staff-row-actions";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { todayStr, weekOf, WEEKDAY_SHORT, shiftTimeRange } from "@/lib/dates";

function statusOf(entry) {
  if (!entry) return { label: "Not scheduled", cls: "bg-dusk/5 text-dusk/40" };
  if (entry.kind === "WORK") return { label: "On duty", cls: "bg-moss/10 text-moss-dark" };
  if (entry.kind === "LEAVE") return { label: "On leave", cls: "bg-coral/10 text-coral-dark" };
  return { label: "Off", cls: "bg-dusk/8 text-dusk/50" };
}

export default async function StaffPage() {
  const user = await getCurrentUser();
  const canEdit = user.role === "OWNER";
  const today = todayStr();
  const week = weekOf(today);

  const [roles, staff, weekEntries] = await Promise.all([
    query(
      `SELECT r.id, r.name, (SELECT COUNT(*)::int FROM staff_members s WHERE s.role_id = r.id) AS "staffCount"
         FROM staff_roles r WHERE r.property_id = $1 ORDER BY r.name`,
      [user.propertyId]
    ),
    query(
      `SELECT s.id, s.name, s.role_id AS "roleId", r.name AS role
         FROM staff_members s JOIN staff_roles r ON r.id = s.role_id
        WHERE s.property_id = $1 ORDER BY s.name`,
      [user.propertyId]
    ),
    query(
      `SELECT e.staff_id AS "staffId", e.work_date AS date,
              t.name AS "shiftName", t.code, t.kind, t.color,
              t.start_time AS "startTime", t.end_time AS "endTime"
         FROM schedule_entries e JOIN shift_types t ON t.id = e.shift_type_id
        WHERE e.property_id = $1 AND e.work_date BETWEEN $2 AND $3`,
      [user.propertyId, week[0], week[6]]
    ),
  ]);

  const entryOf = new Map(weekEntries.map((e) => [`${e.staffId}|${e.date}`, e]));

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-dusk/60">CREW</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-dusk sm:text-3xl">
            Staff scheduling
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/demo/staff/schedule"
            className="inline-flex items-center gap-2 rounded-full bg-dusk px-5 py-2.5 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-dusk/85"
          >
            <CalendarDays className="h-4 w-4" />
            Monthly schedule
          </Link>
          {canEdit && <RolesManager roles={roles} />}
          {canEdit && <AddStaffButton roles={roles} />}
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-dusk/10 bg-white/70 shadow-soft">
        <div className="border-b border-dusk/10 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-dusk">Today's roster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-wide text-dusk/40">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Shift</th>
                <th className="px-4 py-3 font-medium">Status</th>
                {canEdit && <th className="px-4 py-3 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-dusk/5">
              {staff.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center font-body text-sm text-dusk/50">
                    No staff yet.{canEdit ? ' Use "Add staff member" to create the first one.' : ""}
                  </td>
                </tr>
              )}
              {staff.map((s) => {
                const e = entryOf.get(`${s.id}|${today}`);
                const st = statusOf(e);
                return (
                  <tr key={s.id} className="font-body text-sm text-dusk">
                    <td className="px-6 py-4 font-medium">{s.name}</td>
                    <td className="px-4 py-4 text-dusk/70">{s.role}</td>
                    <td className="px-4 py-4 font-mono text-xs text-dusk/60">
                      {e ? (e.kind === "WORK" ? `${e.shiftName} · ${shiftTimeRange(e)}` : e.shiftName) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-2">
                        <StaffRowActions staff={s} roles={roles} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-dusk/10 bg-white/70 shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-dusk/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-4.5 w-4.5 text-dusk/50" />
            <h2 className="font-display text-lg font-bold text-dusk">This week</h2>
          </div>
          <Link href="/demo/staff/schedule" className="font-body text-xs font-medium text-coral-dark hover:underline">
            Open full month →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="font-mono text-[11px] uppercase tracking-wide text-dusk/40">
                <th className="px-6 py-3 font-medium">Name</th>
                {week.map((d, i) => (
                  <th key={d} className={`px-2 py-3 text-center font-medium ${d === today ? "text-coral-dark" : ""}`}>
                    {WEEKDAY_SHORT[i]}
                    <span className="block text-[10px] font-normal opacity-70">{d.slice(8)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dusk/5">
              {staff.map((s) => (
                <tr key={s.id} className="font-body text-sm text-dusk">
                  <td className="px-6 py-3 font-medium">{s.name}</td>
                  {week.map((d) => {
                    const e = entryOf.get(`${s.id}|${d}`);
                    return (
                      <td key={d} className="px-1.5 py-3 text-center">
                        {e ? (
                          <span
                            title={e.shiftName}
                            className="inline-block min-w-[28px] rounded-md px-1.5 py-1 font-mono text-[10px] font-semibold"
                            style={{ backgroundColor: e.color + "22", color: e.color }}
                          >
                            {e.code}
                          </span>
                        ) : (
                          <span className="text-dusk/25">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
