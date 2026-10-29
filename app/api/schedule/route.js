import { NextResponse } from "next/server";
import { query, queryOne, isUuid, PG_FK_VIOLATION } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";
import { isDateStr } from "@/lib/dates";

// Create or change ONE day of one staff member's schedule.
export async function PUT(req) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const { staffId, date, shiftTypeId } = body ?? {};
  const duties = typeof body?.duties === "string" ? body.duties.trim().slice(0, 1000) : "";

  if (!isUuid(staffId) || !isUuid(shiftTypeId) || !isDateStr(date)) return bad("Invalid request.");

  try {
    // property_id is part of both composite foreign keys, so the database itself refuses
    // a staff member or shift that belongs to another property.
    const rows = await query(
      `INSERT INTO schedule_entries (property_id, staff_id, shift_type_id, work_date, duties)
       VALUES ($1, $2, $3, $4, NULLIF($5, ''))
       ON CONFLICT (staff_id, work_date)
       DO UPDATE SET shift_type_id = EXCLUDED.shift_type_id, duties = EXCLUDED.duties, updated_at = now()
       -- Only touch a row that belongs to THIS property. Without this, a user from another
       -- property who knew a staff id could overwrite that person's existing day.
       WHERE schedule_entries.property_id = EXCLUDED.property_id
       RETURNING id`,
      [user.propertyId, staffId, shiftTypeId, date, duties]
    );
    if (rows.length === 0) return bad("Staff member or shift not found.", 404);
    return NextResponse.json({ ok: true, entryId: rows[0].id });
  } catch (err) {
    if (err?.code === PG_FK_VIOLATION) return bad("Staff member or shift not found.", 404);
    console.error("Save schedule entry failed:", err);
    return bad("Could not save the schedule.", 500);
  }
}

// Remove ONE day (the person then shows as "not scheduled" for that date).
export async function DELETE(req) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const { staffId, date } = body ?? {};
  if (!isUuid(staffId) || !isDateStr(date)) return bad("Invalid request.");

  const row = await queryOne(
    `DELETE FROM schedule_entries WHERE staff_id = $1 AND work_date = $2 AND property_id = $3 RETURNING id`,
    [staffId, date, user.propertyId]
  );
  return NextResponse.json({ ok: true, removed: !!row });
}
