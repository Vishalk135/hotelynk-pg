import { NextResponse } from "next/server";
import { query, queryOne, isUuid } from "@/lib/db";
import { requireMember, bad } from "@/lib/api-auth";
import { isMonthStr, datesOfMonth, weekdayIndex, WEEKDAY_SHORT, fmtTime, monthLabel } from "@/lib/dates";
import { buildSchedulePdf } from "@/lib/schedule-pdf";

export const dynamic = "force-dynamic";

// Download a month's schedule.
//   /api/schedule/export?month=2026-11&format=pdf               -> everyone (one page per person)
//   /api/schedule/export?month=2026-11&format=csv&staffId=<id>  -> just one person
// Any signed-in member of the property can download (staff can see their own duties).

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "staff";

// Stops spreadsheet programs from running a cell as a formula (e.g. one starting with "=").
const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req) {
  const { user, error } = await requireMember();
  if (error) return error;

  const sp = new URL(req.url).searchParams;
  const month = sp.get("month");
  const format = (sp.get("format") || "csv").toLowerCase();
  const staffId = sp.get("staffId");

  if (!isMonthStr(month)) return bad("Invalid month.");
  if (!["csv", "pdf"].includes(format)) return bad("Invalid format.");
  if (staffId && !isUuid(staffId)) return bad("Staff member not found.", 404);

  const dates = datesOfMonth(month);

  const staff = await query(
    `SELECT s.id, s.name, r.name AS role
       FROM staff_members s JOIN staff_roles r ON r.id = s.role_id
      WHERE s.property_id = $1 AND ($2::uuid IS NULL OR s.id = $2)
      ORDER BY s.name`,
    [user.propertyId, staffId || null]
  );
  if (staffId && staff.length === 0) return bad("Staff member not found.", 404);

  const entries = await query(
    `SELECT e.staff_id AS "staffId", e.work_date AS date, e.duties,
            t.name AS "shiftName", t.kind, t.start_time AS "startTime", t.end_time AS "endTime"
       FROM schedule_entries e JOIN shift_types t ON t.id = e.shift_type_id
      WHERE e.property_id = $1 AND e.work_date BETWEEN $2 AND $3`,
    [user.propertyId, dates[0], dates[dates.length - 1]]
  );
  const byKey = new Map(entries.map((e) => [`${e.staffId}|${e.date}`, e]));

  // One row per staff member per day of the month
  const rowsFor = (s) =>
    dates.map((date) => {
      const e = byKey.get(`${s.id}|${date}`);
      const wd = weekdayIndex(date);
      return {
        date,
        label: `${date.slice(8)} ${new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}`,
        weekday: WEEKDAY_SHORT[wd],
        isWeekend: wd >= 5,
        kind: e?.kind ?? null,
        shiftName: e?.shiftName ?? "",
        start: e?.startTime ? fmtTime(e.startTime) : "",
        end: e?.endTime ? fmtTime(e.endTime) : "",
        time: e?.startTime ? `${fmtTime(e.startTime)} - ${fmtTime(e.endTime)}` : "",
        duties: e?.duties ?? "",
      };
    });

  const fileBase = `schedule-${month}-${staffId ? slug(staff[0].name) : "all-staff"}`;

  if (format === "pdf") {
    const prop = await queryOne(`SELECT name FROM properties WHERE id = $1`, [user.propertyId]);
    const bytes = await buildSchedulePdf({
      propertyName: prop?.name ?? "Hotelynk",
      monthLabel: monthLabel(month),
      staffList: staff.map((s) => ({ name: s.name, role: s.role, days: rowsFor(s) })),
    });
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const header = ["Staff", "Role", "Date", "Day", "Shift", "Start", "End", "Duties"];
  const lines = [header.map(csvCell).join(",")];
  for (const s of staff) {
    for (const r of rowsFor(s)) {
      lines.push(
        [s.name, s.role, r.date, r.weekday, r.shiftName || "Not scheduled", r.start, r.end, r.duties].map(csvCell).join(",")
      );
    }
  }
  // BOM so Excel opens the file as UTF-8
  return new NextResponse("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileBase}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
