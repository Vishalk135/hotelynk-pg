import { NextResponse } from "next/server";
import { query, queryOne, isUuid } from "@/lib/db";
import { requireOwner, bad } from "@/lib/api-auth";

// Change a room's name and/or nightly rate. Saved in the `rooms` table. Owner only.
export async function PATCH(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Room not found.", 404);

  const body = await req.json().catch(() => null);
  const name = body?.name === undefined ? null : String(body.name).trim();
  const price = body?.price === undefined ? null : Number(body.price);

  if (name !== null && (!name || name.length > 100)) return bad("Enter a room name (max 100 characters).");
  if (price !== null && (!Number.isFinite(price) || price <= 0 || price > 10000000)) return bad("Enter a valid rate.");
  if (name === null && price === null) return bad("Nothing to update.");

  const rows = await query(
    `UPDATE rooms
        SET name = COALESCE($3, name), price = COALESCE($4, price)
      WHERE id = $1 AND property_id = $2
      RETURNING id`,
    [params.id, user.propertyId, name, price === null ? null : Math.round(price)]
  );
  if (rows.length === 0) return bad("Room not found.", 404);
  return NextResponse.json({ ok: true });
}

// Delete a room. A room's bookings are deleted with it, so unless you pass ?withBookings=1
// a room that still has bookings is refused (409) - this protects your booking history.
export async function DELETE(req, { params }) {
  const { user, error } = await requireOwner();
  if (error) return error;
  if (!isUuid(params.id)) return bad("Room not found.", 404);

  const withBookings = new URL(req.url).searchParams.get("withBookings") === "1";

  const room = await queryOne(
    `SELECT r.id, (SELECT COUNT(*)::int FROM bookings b WHERE b.room_id = r.id) AS "bookingCount"
       FROM rooms r WHERE r.id = $1 AND r.property_id = $2`,
    [params.id, user.propertyId]
  );
  if (!room) return bad("Room not found.", 404);

  if (room.bookingCount > 0 && !withBookings) {
    return bad(
      `This room has ${room.bookingCount} booking${room.bookingCount === 1 ? "" : "s"}. Deleting the room would delete ${
        room.bookingCount === 1 ? "it" : "them"
      } too.`,
      409
    );
  }

  await query(`DELETE FROM rooms WHERE id = $1 AND property_id = $2`, [params.id, user.propertyId]);
  return NextResponse.json({ ok: true });
}
