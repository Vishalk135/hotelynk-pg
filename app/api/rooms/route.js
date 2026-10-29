import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || !user.propertyId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, price } = body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Room name is required." }, { status: 400 });
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }

  const rows = await query(
    `INSERT INTO rooms (property_id, name, price, status) VALUES ($1, $2, $3, 'VACANT') RETURNING id`,
    [user.propertyId, name.trim(), Math.round(priceNum)]
  );

  return NextResponse.json({ ok: true, roomId: rows[0].id });
}
