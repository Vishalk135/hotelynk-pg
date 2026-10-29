import { NextResponse } from "next/server";
import { query, PG_UNIQUE_VIOLATION } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";

export async function POST(req) {
  const { user, error } = await requireOwner();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return bad("Role name is required.");
  if (name.length > 60) return bad("Role name is too long (max 60 characters).");

  try {
    const rows = await query(`INSERT INTO staff_roles (property_id, name) VALUES ($1, $2) RETURNING id`, [
      user.propertyId,
      name,
    ]);
    return NextResponse.json({ ok: true, roleId: rows[0].id });
  } catch (err) {
    if (err?.code === PG_UNIQUE_VIOLATION) return bad("You already have a role with that name.");
    console.error("Create role failed:", err);
    return bad("Could not add role.", 500);
  }
}
