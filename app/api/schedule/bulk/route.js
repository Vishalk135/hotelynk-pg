import { NextResponse } from "next/server";
import { withTransaction, isUuid, UserError } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";
import { isDateStr, addDays, weekdayIndex } from "@/lib/dates";

const MAX_DAYS = 93; // about three months per request

// Fill (or clear) many days at once: chosen staff x date range x chosen weekdays.
//   shiftTypeId = a shift id  -> assign that shift (overwrites existing days)
//   shiftTypeId = null        -> clear those days
export async function POST(req) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const { staffIds, from, to, weekdays, shiftTypeId } = body ?? {};
  const duties = typeof body?.duties === "string" ? body.duties.trim().slice(0, 1000) : "";

  if (!Array.isArray(staffIds) || staffIds.length === 0 || !staffIds.every(isUuid)) return bad("Choose at least one staff member.");
  if (!isDateStr(from) || !isDateStr(to) || to < from) return bad("Choose a valid date range.");
  if (!Array.isArray(weekdays) || weekdays.length === 0 || !weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
    return bad("Choose at least one weekday.");
  }
  if (shiftTypeId !== null && !isUuid(shiftTypeId)) return bad("Choose a shift.");

  const rangeDays = Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000) + 1;
  if (rangeDays > MAX_DAYS) return bad(`Please pick a range of at most ${MAX_DAYS} days.`);

  const dates = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (weekdays.includes(weekdayIndex(d))) dates.push(d);
  }
  if (dates.length === 0) return bad("No days match that range and weekday selection.");

  try {
    const count = await withTransaction(async (db) => {
      // Make sure every chosen staff member really belongs to this property.
      const own = await db.query(`SELECT id FROM staff_members WHERE id = ANY($1::uuid[]) AND property_id = $2`, [
        staffIds,
        user.propertyId,
      ]);
      if (own.rowCount !== new Set(staffIds).size) throw new UserError("Staff member not found.");

      if (shiftTypeId === null) {
        const res = await db.query(
          `DELETE FROM schedule_entries WHERE property_id = $1 AND staff_id = ANY($2::uuid[]) AND work_date = ANY($3::date[])`,
          [user.propertyId, staffIds, dates]
        );
        return res.rowCount;
      }

      const shift = await db.query(`SELECT id FROM shift_types WHERE id = $1 AND property_id = $2`, [
        shiftTypeId,
        user.propertyId,
      ]);
      if (shift.rowCount === 0) throw new UserError("Shift not found.");

      const res = await db.query(
        `INSERT INTO schedule_entries (property_id, staff_id, shift_type_id, work_date, duties)
         SELECT $1, s, $3, d, NULLIF($5, '')
           FROM unnest($2::uuid[]) AS s CROSS JOIN unnest($4::date[]) AS d
         ON CONFLICT (staff_id, work_date)
         DO UPDATE SET shift_type_id = EXCLUDED.shift_type_id, duties = EXCLUDED.duties, updated_at = now()
         WHERE schedule_entries.property_id = EXCLUDED.property_id`,
        [user.propertyId, Array.from(new Set(staffIds)), shiftTypeId, dates, duties]
      );
      return res.rowCount;
    });

    return NextResponse.json({ ok: true, days: count });
  } catch (err) {
    if (err instanceof UserError) return bad(err.message, 404);
    console.error("Bulk schedule failed:", err);
    return bad("Could not update the schedule.", 500);
  }
}
