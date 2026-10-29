import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, isUuid, PG_UNIQUE_VIOLATION, PG_FK_VIOLATION } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, email, password, propertyId: bodyPropertyId } = body ?? {};

  // Owners can only add staff to their own property. Super-admins must
  // specify which property (they aren't tied to one themselves).
  let propertyId = null;
  if (user.role === "OWNER") {
    propertyId = user.propertyId;
  } else if (user.role === "SUPER_ADMIN") {
    propertyId = isUuid(bodyPropertyId) ? bodyPropertyId : null;
  } else {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (!propertyId) {
    return NextResponse.json({ error: "No property specified." }, { status: 400 });
  }
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const rows = await query(
      `INSERT INTO users (property_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, 'STAFF') RETURNING id`,
      [propertyId, String(email).trim().toLowerCase(), passwordHash, String(name).trim()]
    );
    return NextResponse.json({ ok: true, uid: rows[0].id });
  } catch (err) {
    const message =
      err?.code === PG_UNIQUE_VIOLATION
        ? "That email is already in use by another account."
        : err?.code === PG_FK_VIOLATION
          ? "That property does not exist."
          : "Failed to create staff account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
