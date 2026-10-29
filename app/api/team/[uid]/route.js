import { NextResponse } from "next/server";
import { query, queryOne, isUuid } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (user.role !== "OWNER" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const targetUid = params.uid;
  if (!isUuid(targetUid)) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const target = await queryOne(`SELECT role, property_id FROM users WHERE id = $1`, [targetUid]);
  if (!target) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  // Safety guards: never let this route remove an OWNER account (avoids
  // accidentally locking a client out of their own dashboard), and owners
  // can only remove staff within their own property.
  if (target.role === "OWNER" || target.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Owner accounts can't be removed here." }, { status: 400 });
  }
  if (user.role === "OWNER" && target.property_id !== user.propertyId) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  await query(`DELETE FROM users WHERE id = $1`, [targetUid]);
  return NextResponse.json({ ok: true });
}
