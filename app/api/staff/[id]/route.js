import { NextResponse } from "next/server";
import { query, queryOne, isUuid, PG_FK_VIOLATION } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";

// Edit a staff member's name and/or role.
export async function PATCH(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Staff member not found.", 404);

  const body = await req.json().catch(() => null);
  const name = body?.name === undefined ? null : String(body.name).trim();
  const roleId = body?.roleId === undefined ? null : body.roleId;

  if (name !== null && (!name || name.length > 150)) return bad("Enter a valid name.");
  if (roleId !== null && !isUuid(roleId)) return bad("Please choose a role.");
  if (name === null && roleId === null) return bad("Nothing to update.");

  try {
    const rows = await query(
      `UPDATE staff_members
          SET name = COALESCE($3, name), role_id = COALESCE($4, role_id)
        WHERE id = $1 AND property_id = $2
        RETURNING id`,
      [params.id, user.propertyId, name, roleId]
    );
    if (rows.length === 0) return bad("Staff member not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err?.code === PG_FK_VIOLATION) return bad("That role does not exist.");
    console.error("Update staff failed:", err);
    return bad("Could not update staff member.", 500);
  }
}

// Delete a staff member. Their schedule entries are deleted with them (ON DELETE CASCADE).
export async function DELETE(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Staff member not found.", 404);

  const row = await queryOne(`DELETE FROM staff_members WHERE id = $1 AND property_id = $2 RETURNING id`, [
    params.id,
    user.propertyId,
  ]);
  if (!row) return bad("Staff member not found.", 404);
  return NextResponse.json({ ok: true });
}
