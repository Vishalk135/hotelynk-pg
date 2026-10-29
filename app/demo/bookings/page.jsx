import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { formatDateIST } from "@/lib/dates";
import BookingsClient from "./bookings-client";

const fmt = (d) => formatDateIST(d, { day: "numeric", month: "short" });

export default async function BookingsPage() {
  const user = await getCurrentUser();
  const propertyId = user.propertyId;

  // For each room, the LATERAL subquery picks its most recently created booking (if any).
  const rows = await query(
    `SELECT r.id, r.name, r.price, r.status,
            b.guest_name AS "guestName", b.check_in AS "checkIn", b.check_out AS "checkOut"
     FROM rooms r
     LEFT JOIN LATERAL (
       SELECT guest_name, check_in, check_out
       FROM bookings
       WHERE room_id = r.id
       ORDER BY created_at DESC
       LIMIT 1
     ) b ON true
     WHERE r.property_id = $1
     ORDER BY r.name`,
    [propertyId]
  );

  const formatted = rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    status: r.status,
    guest: r.guestName,
    nights: r.checkIn && r.checkOut ? `${fmt(r.checkIn)} – ${fmt(r.checkOut)}` : null,
  }));

  return <BookingsClient initialRooms={formatted} />;
}
