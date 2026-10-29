// Adds sample data (rooms, bookings, menu, a week of orders, staff + a monthly schedule)
// to the property of an EXISTING owner login. Use it after creating a client in /admin.
//
//   node --env-file=.env.production.local scripts/add-demo-data.js owner@hotelynk.in
//   node --env-file=.env.local scripts/add-demo-data.js owner@hotelynk.in            (local database)
//
// Safe by default: if the property already has rooms it stops, so you can't double up by accident.
// Add --force to add the sample data anyway.

const { randomUUID } = require("crypto");
const { Pool } = require("pg");

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const email = (args.find((a) => !a.startsWith("--")) || "").trim().toLowerCase();

  if (!email) throw new Error("Usage: node --env-file=.env.production.local scripts/add-demo-data.js owner@example.com");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (is your .env file in this folder?).");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  const db = await pool.connect();

  try {
    const u = await db.query(`SELECT id, role, property_id FROM users WHERE email = $1`, [email]);
    if (u.rowCount === 0) throw new Error(`No account found for ${email}.`);
    if (u.rows[0].role !== "OWNER" || !u.rows[0].property_id) {
      throw new Error(`${email} is not a property owner. Use the owner email you created in /admin.`);
    }
    const propertyId = u.rows[0].property_id;

    const existing = await db.query(`SELECT COUNT(*)::int AS n FROM rooms WHERE property_id = $1`, [propertyId]);
    if (existing.rows[0].n > 0 && !force) {
      console.log(`This property already has ${existing.rows[0].n} room(s), so nothing was added.`);
      console.log("Run again with --force if you really want to add the sample data on top.");
      return;
    }

    await db.query("BEGIN");

    // Make sure the default roles + shifts exist (they do for new properties; harmless if already there).
    await db.query(`SELECT add_default_staff_setup($1)`, [propertyId]);

    // ---------- Rooms ----------
    const roomData = [
      ["Villa 1 · Pool", 6500, "VACANT"],
      ["Villa 2 · Sea View", 8200, "CHECKED_IN"],
      ["Villa 3 · Garden", 5400, "CHECKED_IN"],
      ["Villa 4 · Garden", 5400, "ARRIVING"],
      ["Room 5 · Standard", 3200, "HOUSEKEEPING"],
      ["Room 6 · Standard", 3200, "DEPARTING"],
      ["Villa 7 · Sea View", 8200, "CHECKED_IN"],
      ["Room 8 · Standard", 3200, "VACANT"],
    ];
    const rooms = await db.query(
      `INSERT INTO rooms (property_id, name, price, status)
       SELECT $1, n, p, s FROM unnest($2::text[], $3::int[], $4::room_status[]) AS t(n, p, s)
       RETURNING id, name`,
      [propertyId, roomData.map((r) => r[0]), roomData.map((r) => r[1]), roomData.map((r) => r[2])]
    );
    const roomId = Object.fromEntries(rooms.rows.map((r) => [r.name, r.id]));

    // ---------- Bookings ----------
    const now = new Date();
    const inDays = (n) => new Date(now.getTime() + n * 86400000);
    await db.query(
      `INSERT INTO bookings (room_id, guest_name, check_in, check_out)
       SELECT r, g, i, o FROM unnest($1::uuid[], $2::text[], $3::timestamptz[], $4::timestamptz[]) AS t(r, g, i, o)`,
      [
        [roomId["Villa 2 · Sea View"], roomId["Villa 4 · Garden"], roomId["Villa 3 · Garden"], roomId["Villa 7 · Sea View"]],
        ["Marta Silva", "Tom & Ella Whitfield", "Rohan Desai", "Priya & Karan Shah"],
        [inDays(-2), now, inDays(-1), inDays(-3)],
        [inDays(3), inDays(5), inDays(2), inDays(1)],
      ]
    );

    // ---------- Menu ----------
    const menuData = [
      ["Prawn Curry Rice", 380, 14, 30, "Mains"],
      ["Fish Thali", 450, 9, 25, "Mains"],
      ["Chicken Xacuti", 420, 18, 25, "Mains"],
      ["Bhaji Pav", 120, 22, 40, "Snacks"],
      ["Calamari Fry", 340, 3, 20, "Snacks"],
      ["Kingfisher (large)", 220, 40, 60, "Drinks"],
      ["Feni Sour", 280, 16, 30, "Drinks"],
      ["Watermelon Juice", 150, 25, 30, "Drinks"],
    ];
    const menuRes = await db.query(
      `INSERT INTO menu_items (property_id, name, price, stock, max_stock, category)
       SELECT $1, n, p, s, m, c FROM unnest($2::text[], $3::int[], $4::int[], $5::int[], $6::menu_category[]) AS t(n, p, s, m, c)
       RETURNING id, name, price`,
      [propertyId, menuData.map((m) => m[0]), menuData.map((m) => m[1]), menuData.map((m) => m[2]), menuData.map((m) => m[3]), menuData.map((m) => m[4])]
    );
    const menu = menuRes.rows;

    // ---------- A week of orders (so the revenue chart has data) ----------
    const ordersPerDay = [3, 2, 4, 3, 5, 7, 6];
    const orders = [];
    const lines = [];
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      for (let i = 0; i < ordersPerDay[6 - dayOffset]; i++) {
        const picked = [...menu].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
        const id = randomUUID();
        let total = 0;
        for (const m of picked) {
          const qty = 1 + Math.floor(Math.random() * 3);
          total += m.price * qty;
          lines.push({ order: id, item: m.id, name: m.name, qty, price: m.price });
        }
        orders.push({ id, total, at: new Date(now.getTime() - dayOffset * 86400000 - Math.random() * 6 * 3600000) });
      }
    }
    await db.query(
      `INSERT INTO orders (id, property_id, total, created_at)
       SELECT i, $1, t, c FROM unnest($2::uuid[], $3::int[], $4::timestamptz[]) AS x(i, t, c)`,
      [propertyId, orders.map((o) => o.id), orders.map((o) => o.total), orders.map((o) => o.at)]
    );
    await db.query(
      `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price_each)
       SELECT o, m, n, q, p FROM unnest($1::uuid[], $2::uuid[], $3::text[], $4::int[], $5::int[]) AS x(o, m, n, q, p)`,
      [lines.map((l) => l.order), lines.map((l) => l.item), lines.map((l) => l.name), lines.map((l) => l.qty), lines.map((l) => l.price)]
    );

    // ---------- Staff + monthly schedule ----------
    const roleIds = Object.fromEntries(
      (await db.query(`SELECT id, name FROM staff_roles WHERE property_id = $1`, [propertyId])).rows.map((r) => [r.name, r.id])
    );
    const shiftIds = Object.fromEntries(
      (await db.query(`SELECT id, name FROM shift_types WHERE property_id = $1`, [propertyId])).rows.map((r) => [r.name, r.id])
    );
    const staffData = [
      { name: "Vishal Kumbhar", role: "Manager", shift: "General", pattern: [1, 1, 1, 1, 1, 0, 0], duties: "Daily review of bookings and cash, guest escalations, staff briefing" },
      { name: "Sunita Naik", role: "Housekeeping", shift: "Morning", pattern: [1, 1, 0, 1, 1, 1, 0], duties: "Clean checkout rooms, make up arrivals, restock linen and toiletries" },
      { name: "Vishal Gaonkar", role: "Front Desk", shift: "Evening", pattern: [0, 1, 1, 1, 1, 1, 1], duties: "Check-ins and check-outs, guest queries, update room status" },
      { name: "Meena Fernandes", role: "Chef", shift: "General", pattern: [1, 1, 1, 0, 0, 1, 1], duties: "Lunch and dinner service, daily stock count, menu specials" },
      { name: "Ajay Kunkolienkar", role: "Server", shift: "Evening", pattern: [1, 1, 1, 1, 0, 0, 1], duties: "Restaurant floor and shack orders, table setup, closing cash-up" },
      { name: "Divya Prabhu", role: "Housekeeping", shift: "Morning", pattern: [1, 0, 1, 1, 0, 1, 1], duties: "Villa turnover, pool-side cleaning, laundry handover" },
    ].map((s) => ({ ...s, id: randomUUID() }));

    await db.query(
      `INSERT INTO staff_members (id, property_id, role_id, name)
       SELECT i, $1, r, n FROM unnest($2::uuid[], $3::uuid[], $4::text[]) AS x(i, r, n)`,
      [propertyId, staffData.map((s) => s.id), staffData.map((s) => roleIds[s.role]), staffData.map((s) => s.name)]
    );

    // India "today"; schedule from the 1st of last month to the end of next month
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const addDays = (d, n) => {
      const x = new Date(d + "T00:00:00Z");
      x.setUTCDate(x.getUTCDate() + n);
      return x.toISOString().slice(0, 10);
    };
    const weekday = (d) => (new Date(d + "T00:00:00Z").getUTCDay() + 6) % 7; // 0 = Mon
    const [y, m] = todayStr.split("-").map(Number);
    const startDate = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    const endDate = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10);
    const leaveFrom = addDays(todayStr, -1);
    const leaveTo = addDays(todayStr, 3);

    const e = { staff: [], shift: [], date: [], duties: [] };
    for (const st of staffData) {
      for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
        const onLeave = st.name === "Ajay Kunkolienkar" && d >= leaveFrom && d <= leaveTo;
        const working = st.pattern[weekday(d)] === 1;
        e.staff.push(st.id);
        e.shift.push(shiftIds[onLeave ? "Leave" : working ? st.shift : "Week off"]);
        e.date.push(d);
        e.duties.push(working && !onLeave ? st.duties : null);
      }
    }
    await db.query(
      `INSERT INTO schedule_entries (property_id, staff_id, shift_type_id, work_date, duties)
       SELECT $1, s, t, d::date, u FROM unnest($2::uuid[], $3::uuid[], $4::text[], $5::text[]) AS x(s, t, d, u)`,
      [propertyId, e.staff, e.shift, e.date, e.duties]
    );

    await db.query("COMMIT");
    console.log(`Done. Added to ${email}'s property: ${roomData.length} rooms, 4 bookings, ${menuData.length} menu items,`);
    console.log(`${orders.length} orders (last 7 days), ${staffData.length} staff members and their monthly schedule.`);
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    db.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
