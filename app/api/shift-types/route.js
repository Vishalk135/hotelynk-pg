import { NextResponse } from "next/server";
import { query, PG_UNIQUE_VIOLATION } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";
import { validateShiftType } from "@/lib/shift-validation";

export async function POST(req) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const { value, error: msg } = validateShiftType(await req.json().catch(() => null));
  if (msg) return bad(msg);

  try {
    const rows = await query(
      `INSERT INTO shift_types (property_id, name, code, kind, start_time, end_time, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [user.propertyId, value.name, value.code, value.kind, value.startTime, value.endTime, value.color]
    );
    return NextResponse.json({ ok: true, shiftTypeId: rows[0].id });
  } catch (err) {
    if (err?.code === PG_UNIQUE_VIOLATION) return bad("You already have a shift with that name.");
    console.error("Create shift type failed:", err);
    return bad("Could not add shift.", 500);
  }
}
