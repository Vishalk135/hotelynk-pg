import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { todayStr, addDays, startOfDayIST } from "@/lib/dates";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || !user.propertyId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const propertyId = user.propertyId;

  const { question } = await req.json().catch(() => ({ question: "" }));
  const q = (question || "").toLowerCase();

  if (q.includes("occup") || q.includes("vacant") || q.includes("free room")) {
    const rooms = await query(`SELECT name, status FROM rooms WHERE property_id = $1`, [
      propertyId,
    ]);
    const occupied = rooms.filter((r) => r.status === "CHECKED_IN" || r.status === "DEPARTING");
    const vacant = rooms.filter((r) => r.status === "VACANT");
    return NextResponse.json({
      reply: `${occupied.length} of ${rooms.length} rooms are occupied right now. Vacant: ${
        vacant.length ? vacant.map((r) => r.name).join(", ") : "none"
      }.`,
    });
  }

  if (q.includes("arriv")) {
    const rows = await query(
      `SELECT name FROM rooms WHERE property_id = $1 AND status = 'ARRIVING' ORDER BY name`,
      [propertyId]
    );
    const names = rows.map((r) => r.name);
    return NextResponse.json({
      reply: names.length
        ? `Arriving: ${names.join(", ")}.`
        : "No one is marked as arriving right now.",
    });
  }
  if (q.includes("depart")) {
    const rows = await query(
      `SELECT name FROM rooms WHERE property_id = $1 AND status = 'DEPARTING' ORDER BY name`,
      [propertyId]
    );
    const names = rows.map((r) => r.name);
    return NextResponse.json({
      reply: names.length
        ? `Departing: ${names.join(", ")}.`
        : "No one is marked as departing right now.",
    });
  }

  if (q.includes("revenue") || q.includes("sales") || q.includes("earn")) {
    if (user.role !== "OWNER" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({
        reply: "Revenue details are only visible to the property owner.",
      });
    }
    const weekAgo = startOfDayIST(addDays(todayStr(), -6));
    const todayStart = startOfDayIST(todayStr());

    // The database does the adding-up for us.
    const [row] = await query(
      `SELECT COALESCE(SUM(total), 0)                                   AS "weekTotal",
              COALESCE(SUM(total) FILTER (WHERE created_at >= $3), 0)   AS "todayTotal",
              COUNT(*)            FILTER (WHERE created_at >= $3)       AS "todayCount"
       FROM orders
       WHERE property_id = $1 AND created_at >= $2`,
      [propertyId, weekAgo, todayStart]
    );

    return NextResponse.json({
      reply: `This week's revenue is ₹${Number(row.weekTotal).toLocaleString("en-IN")}. Today so far: ₹${Number(
        row.todayTotal
      ).toLocaleString("en-IN")} across ${row.todayCount} orders.`,
    });
  }

  if (q.includes("stock") || q.includes("inventory") || q.includes("low")) {
    const rows = await query(
      `SELECT name, stock FROM menu_items
       WHERE property_id = $1 AND stock::float / max_stock <= 0.25
       ORDER BY stock`,
      [propertyId]
    );
    return NextResponse.json({
      reply: rows.length
        ? `Running low: ${rows.map((m) => `${m.name} (${m.stock} left)`).join(", ")}.`
        : "Nothing is critically low right now.",
    });
  }

  if (q.includes("staff") || q.includes("duty") || q.includes("roster") || q.includes("working")) {
    // "On duty" = has a working shift on today's schedule.
    const staff = await query(
      `SELECT s.name, st.name AS "shiftName", st.kind
         FROM staff_members s
         LEFT JOIN schedule_entries e ON e.staff_id = s.id AND e.work_date = $2
         LEFT JOIN shift_types st ON st.id = e.shift_type_id
        WHERE s.property_id = $1
        ORDER BY s.name`,
      [propertyId, todayStr()]
    );
    const onDuty = staff.filter((s) => s.kind === "WORK");
    return NextResponse.json({
      reply: `${onDuty.length} of ${staff.length} staff are on duty today: ${
        onDuty.map((s) => `${s.name} (${s.shiftName})`).join(", ") || "none"
      }.`,
    });
  }

  if (q.includes("rate") || q.includes("price") || q.includes("tariff") || q.includes("cost per night")) {
    const [row] = await query(
      `SELECT COUNT(*)::int AS n, MIN(price) AS lo, MAX(price) AS hi, ROUND(AVG(price))::int AS avg
         FROM rooms WHERE property_id = $1`,
      [propertyId]
    );
    return NextResponse.json({
      reply: row.n
        ? `You have ${row.n} rooms. Nightly rates run from ₹${Number(row.lo).toLocaleString("en-IN")} to ₹${Number(
            row.hi
          ).toLocaleString("en-IN")}, averaging ₹${Number(row.avg).toLocaleString("en-IN")}. See the Room rates page for the full list.`
        : "You haven't added any rooms yet, so there are no rates to show.",
    });
  }

  if (q.trim() === "" || q.includes("hello") || q.includes("hi")) {
    return NextResponse.json({
      reply:
        "Hi! Ask me about today's occupancy, revenue, stock levels, or staff on duty — I'm reading this straight from your database.",
    });
  }

  return NextResponse.json({
    reply:
      "I can help with occupancy, arrivals/departures, revenue, stock levels, room rates, or staff on duty — try asking about one of those.",
  });
}
