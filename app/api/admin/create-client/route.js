import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withTransaction, PG_UNIQUE_VIOLATION } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { propertyName, ownerName, ownerEmail, ownerPassword } = body ?? {};

  if (!propertyName || !ownerName || !ownerEmail || !ownerPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (ownerPassword.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const email = String(ownerEmail).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  try {
    // One transaction: either the property AND its owner login are created, or neither is.
    const result = await withTransaction(async (db) => {
      const prop = await db.query(
        `INSERT INTO properties (name, owner_email) VALUES ($1, $2) RETURNING id`,
        [String(propertyName).trim(), email]
      );
      const propertyId = prop.rows[0].id;

      const user = await db.query(
        `INSERT INTO users (property_id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, 'OWNER') RETURNING id`,
        [propertyId, email, passwordHash, String(ownerName).trim()]
      );
      return { propertyId, uid: user.rows[0].id };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Create client failed:", err);
    const message =
      err?.code === PG_UNIQUE_VIOLATION
        ? "That email is already in use by another account."
        : "Failed to create client.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
