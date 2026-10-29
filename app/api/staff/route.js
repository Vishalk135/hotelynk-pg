import { NextResponse } from "next/server";
import { query, isUuid, PG_FK_VIOLATION } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";

// Create a staff member. The role is picked from the property's staff_roles master list.
export async function POST(req) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const roleId = body?.roleId;

  if (!name) return bad("Name is required.");
  if (name.length > 150) return bad("Name is too long.");
  if (!isUuid(roleId)) return bad("Please choose a role.");

  try {
    const rows = await query(
      `INSERT INTO staff_members (property_id, role_id, name) VALUES ($1, $2, $3) RETURNING id`,
      [user.propertyId, roleId, name]
    );
    return NextResponse.json({ ok: true, staffId: rows[0].id });
  } catch (err) {
    // The composite foreign key rejects a role that belongs to another property.
    if (err?.code === PG_FK_VIOLATION) return bad("That role does not exist.");
    console.error("Create staff failed:", err);
    return bad("Could not add staff member.", 500);
  }
}
