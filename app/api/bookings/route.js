import { NextResponse } from "next/server";
import { withTransaction, isUuid, UserError } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { todayStr, APP_TIMEZONE } from "@/lib/dates";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || !user.propertyId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { roomId, guestName, checkIn, checkOut } = body ?? {};

  if (!roomId || !guestName || !checkIn || !checkOut) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!isUuid(roomId)) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return NextResponse.json({ error: "Invalid dates." }, { status: 400 });
  }
  if (checkOutDate <= checkInDate) {
    return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
  }

  // Compare calendar days in India time (the server itself may be running in UTC).
  const isArrivingToday = checkInDate.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE }) === todayStr();

  try {
    const bookingId = await withTransaction(async (db) => {
      // Critical: the property_id filter stops a user from booking a room
      // that belongs to a different client entirely.
      const room = await db.query(
        `SELECT id FROM rooms WHERE id = $1 AND property_id = $2 FOR UPDATE`,
        [roomId, user.propertyId]
      );
      if (room.rowCount === 0) throw new UserError("Room not found.");

      const booking = await db.query(
        `INSERT INTO bookings (room_id, guest_name, check_in, check_out)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [roomId, String(guestName).trim(), checkInDate, checkOutDate]
      );
      await db.query(`UPDATE rooms SET status = $1 WHERE id = $2`, [
        isArrivingToday ? "ARRIVING" : "CHECKED_IN",
        roomId,
      ]);
      return booking.rows[0].id;
    });

    return NextResponse.json({ ok: true, bookingId });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 404 });
    console.error("Booking failed:", err);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}
