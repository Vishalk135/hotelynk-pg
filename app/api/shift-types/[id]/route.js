import { NextResponse } from "next/server";
import { query, queryOne, isUuid, PG_UNIQUE_VIOLATION } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";
import { validateShiftType } from "@/lib/shift-validation";

export async function PATCH(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Shift not found.", 404);

  const { value, error: msg } = validateShiftType(await req.json().catch(() => null));
  if (msg) return bad(msg);

  try {
    const rows = await query(
      `UPDATE shift_types
          SET name = $3, code = $4, kind = $5, start_time = $6, end_time = $7, color = $8
        WHERE id = $1 AND property_id = $2 RETURNING id`,
      [params.id, user.propertyId, value.name, value.code, value.kind, value.startTime, value.endTime, value.color]
    );
    if (rows.length === 0) return bad("Shift not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.code === PG_UNIQUE_VIOLATION) return bad("You already have a shift with that name.");
    console.error("Update shift type failed:", err);
    return bad("Could not update shift.", 500);
  }
}

// A shift that is used in the schedule can't be deleted (the database enforces this too).
export async function DELETE(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Shift not found.", 404);

  const shift = await queryOne(
    `SELECT t.id, t.name, (SELECT COUNT(*)::int FROM schedule_entries e WHERE e.shift_type_id = t.id) AS "inUse"
       FROM shift_types t WHERE t.id = $1 AND t.property_id = $2`,
    [params.id, user.propertyId]
  );
  if (!shift) return bad("Shift not found.", 404);
  if (shift.inUse > 0) {
    return bad(
      `"${shift.name}" is used on ${shift.inUse} day${shift.inUse === 1 ? "" : "s"} in the schedule. Reassign or clear those days first.`,
      409
    );
  }

  await query(`DELETE FROM shift_types WHERE id = $1 AND property_id = $2`, [params.id, user.propertyId]);
  return NextResponse.json({ ok: true });
}
