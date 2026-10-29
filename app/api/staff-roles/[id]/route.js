import { NextResponse } from "next/server";
import { query, queryOne, isUuid, PG_UNIQUE_VIOLATION } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";

export async function PATCH(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Role not found.", 404);

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) return bad("Enter a valid role name (max 60 characters).");

  try {
    const rows = await query(`UPDATE staff_roles SET name = $3 WHERE id = $1 AND property_id = $2 RETURNING id`, [
      params.id,
      user.propertyId,
      name,
    ]);
    if (rows.length === 0) return bad("Role not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.code === PG_UNIQUE_VIOLATION) return bad("You already have a role with that name.");
    console.error("Rename role failed:", err);
    return bad("Could not rename role.", 500);
  }
}

// A role that is still assigned to staff can't be deleted (the database enforces this too).
export async function DELETE(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Role not found.", 404);

  const role = await queryOne(
    `SELECT r.id, r.name, (SELECT COUNT(*)::int FROM staff_members s WHERE s.role_id = r.id) AS "inUse"
       FROM staff_roles r WHERE r.id = $1 AND r.property_id = $2`,
    [params.id, user.propertyId]
  );
  if (!role) return bad("Role not found.", 404);
  if (role.inUse > 0) {
    return bad(
      `${role.inUse} staff member${role.inUse === 1 ? " is" : "s are"} still "${role.name}". Change their role first, then delete it.`,
      409
    );
  }

  await query(`DELETE FROM staff_roles WHERE id = $1 AND property_id = $2`, [params.id, user.propertyId]);
  return NextResponse.json({ ok: true });
}
