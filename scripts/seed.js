// Seeds PostgreSQL with:
//   1. A SUPER_ADMIN account (you) - can access /admin to onboard clients.
//   2. One demo client property with an OWNER login, so you have
//      something to test the dashboard with immediately.
//
// Run with: npm run db:seed   (after npm run db:init)

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.local.example to .env.local first.");
  }
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  console.log("Seeding PostgreSQL...");

  try {
    await client.query("BEGIN");

    // --- 1. Super-admin (platform owner - you) ---
    await client.query(
      `INSERT INTO users (email, password_hash, name, role, property_id)
       VALUES ($1, $2, 'Hotelynk Admin', 'SUPER_ADMIN', NULL)
       ON CONFLICT (email) DO NOTHING`,
      ["admin@hotelynk.in", await bcrypt.hash("hotelynkadmin123", 12)]
    );

    // --- 2. Demo client property (skipped if the demo owner already exists) ---
    const existingOwner = await client.query(`SELECT 1 FROM users WHERE email = 'owner@hotelynk.in'`);
    if (existingOwner.rowCount) {
      console.log("Demo client already exists - skipping demo data.");
      await client.query("COMMIT");
      return;
    }

    const prop = await client.query(
      `INSERT INTO properties (name, owner_email) VALUES ('ABC Villas', 'owner@hotelynk.in') RETURNING id`
    );
    const propertyId = prop.rows[0].id;

    await client.query(
      `INSERT INTO users (property_id, email, password_hash, name, role)
       VALUES ($1, 'owner@hotelynk.in', $2, 'Vishal Kumbhar', 'OWNER')`,
      [propertyId, await bcrypt.hash("hotelynk123", 12)]
    );

    // --- Rooms ---
    const roomData = [
      { name: "Villa 1 · Pool", price: 6500, status: "VACANT" },
      { name: "Villa 2 · Sea View", price: 8200, status: "CHECKED_IN" },
      { name: "Villa 3 · Garden", price: 5400, status: "CHECKED_IN" },
      { name: "Villa 4 · Garden", price: 5400, status: "ARRIVING" },
      { name: "Room 5 · Standard", price: 3200, status: "HOUSEKEEPING" },
      { name: "Room 6 · Standard", price: 3200, status: "DEPARTING" },
      { name: "Villa 7 · Sea View", price: 8200, status: "CHECKED_IN" },
      { name: "Room 8 · Standard", price: 3200, status: "VACANT" },
    ];
    const roomIds = [];
    for (const r of roomData) {
      const res = await client.query(
        `INSERT INTO rooms (property_id, name, price, status) VALUES ($1, $2, $3, $4) RETURNING id`,
        [propertyId, r.name, r.price, r.status]
      );
      roomIds.push(res.rows[0].id);
    }

    const now = new Date();
    const inDays = (n) => new Date(now.getTime() + n * 86400000);
    await client.query(
      `INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES ($1, 'Marta Silva', $2, $3)`,
      [roomIds[1], inDays(-2), inDays(3)]
    );
    await client.query(
      `INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES ($1, 'Tom & Ella Whitfield', $2, $3)`,
      [roomIds[3], now, inDays(5)]
    );

    // --- Menu ---
    const menuData = [
      { name: "Prawn Curry Rice", price: 380, stock: 14, maxStock: 30, category: "Mains" },
      { name: "Fish Thali", price: 450, stock: 9, maxStock: 25, category: "Mains" },
      { name: "Chicken Xacuti", price: 420, stock: 18, maxStock: 25, category: "Mains" },
      { name: "Bhaji Pav", price: 120, stock: 22, maxStock: 40, category: "Snacks" },
      { name: "Calamari Fry", price: 340, stock: 3, maxStock: 20, category: "Snacks" },
      { name: "Kingfisher (large)", price: 220, stock: 40, maxStock: 60, category: "Drinks" },
      { name: "Feni Sour", price: 280, stock: 16, maxStock: 30, category: "Drinks" },
      { name: "Watermelon Juice", price: 150, stock: 25, maxStock: 30, category: "Drinks" },
    ];
    const menu = [];
    for (const m of menuData) {
      const res = await client.query(
        `INSERT INTO menu_items (property_id, name, price, stock, max_stock, category)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [propertyId, m.name, m.price, m.stock, m.maxStock, m.category]
      );
      menu.push({ id: res.rows[0].id, price: m.price, name: m.name });
    }

    // --- A week of order history, so the revenue chart has real data ---
    const ordersPerDay = [3, 2, 4, 3, 5, 7, 6];
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const count = ordersPerDay[6 - dayOffset];
      for (let i = 0; i < count; i++) {
        const picked = [...menu].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
        const lines = picked.map((m) => ({ ...m, quantity: 1 + Math.floor(Math.random() * 3) }));
        const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);
        const createdAt = new Date(now.getTime() - dayOffset * 86400000 - Math.random() * 6 * 3600000);

        const order = await client.query(
          `INSERT INTO orders (property_id, total, created_at) VALUES ($1, $2, $3) RETURNING id`,
          [propertyId, total, createdAt]
        );
        for (const l of lines) {
          await client.query(
            `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price_each)
             VALUES ($1, $2, $3, $4, $5)`,
            [order.rows[0].id, l.id, l.name, l.quantity, l.price]
          );
        }
      }
    }

    // --- Staff. Roles and shift types were created automatically for the new property
    //     (database trigger), so we just look them up by name. ---
    const roleIds = Object.fromEntries(
      (await client.query(`SELECT id, name FROM staff_roles WHERE property_id = $1`, [propertyId])).rows.map((r) => [r.name, r.id])
    );
    const shiftIds = Object.fromEntries(
      (await client.query(`SELECT id, name FROM shift_types WHERE property_id = $1`, [propertyId])).rows.map((r) => [r.name, r.id])
    );

    // pattern: which weekdays (Mon..Sun) they work; shift: which shift on those days
    const staffData = [
      { name: "Vishal Kumbhar", role: "Manager", shift: "General", pattern: [1, 1, 1, 1, 1, 0, 0], duties: "Daily review of bookings and cash, guest escalations, staff briefing" },
      { name: "Sunita Naik", role: "Housekeeping", shift: "Morning", pattern: [1, 1, 0, 1, 1, 1, 0], duties: "Clean checkout rooms, make up arrivals, restock linen and toiletries" },
      { name: "Vishal Gaonkar", role: "Front Desk", shift: "Evening", pattern: [0, 1, 1, 1, 1, 1, 1], duties: "Check-ins and check-outs, guest queries, update room status" },
      { name: "Meena Fernandes", role: "Chef", shift: "General", pattern: [1, 1, 1, 0, 0, 1, 1], duties: "Lunch and dinner service, daily stock count, menu specials" },
      { name: "Ajay Kunkolienkar", role: "Server", shift: "Evening", pattern: [1, 1, 1, 1, 0, 0, 1], duties: "Restaurant floor and shack orders, table setup, closing cash-up" },
      { name: "Divya Prabhu", role: "Housekeeping", shift: "Morning", pattern: [1, 0, 1, 1, 0, 1, 1], duties: "Villa turnover, pool-side cleaning, laundry handover" },
    ];

    // Dates are plain "YYYY-MM-DD" strings (no time-zone surprises). "Today" is India time.
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const addDays = (d, n) => {
      const x = new Date(d + "T00:00:00Z");
      x.setUTCDate(x.getUTCDate() + n);
      return x.toISOString().slice(0, 10);
    };
    const weekday = (d) => (new Date(d + "T00:00:00Z").getUTCDay() + 6) % 7; // 0 = Mon
    // Schedule from the 1st of last month to the end of next month
    const [y, m] = todayStr.split("-").map(Number);
    const startDate = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    const endDate = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10);
    const leaveFrom = addDays(todayStr, -1);
    const leaveTo = addDays(todayStr, 3);

    for (const st of staffData) {
      const res = await client.query(
        `INSERT INTO staff_members (property_id, role_id, name) VALUES ($1, $2, $3) RETURNING id`,
        [propertyId, roleIds[st.role], st.name]
      );
      const staffId = res.rows[0].id;

      for (let d = startDate; d <= endDate; d = addDays(d, 1)) {
        const onLeave = st.name === "Ajay Kunkolienkar" && d >= leaveFrom && d <= leaveTo;
        const working = st.pattern[weekday(d)] === 1;
        const shiftName = onLeave ? "Leave" : working ? st.shift : "Week off";
        await client.query(
          `INSERT INTO schedule_entries (property_id, staff_id, shift_type_id, work_date, duties)
           VALUES ($1, $2, $3, $4, $5)`,
          [propertyId, staffId, shiftIds[shiftName], d, working && !onLeave ? st.duties : null]
        );
      }
    }

    await client.query("COMMIT");
    console.log("\nSeed complete.\n");
    console.log("Super-admin login (use this to access /admin):");
    console.log("  admin@hotelynk.in / hotelynkadmin123\n");
    console.log("Demo client login (use this to see the property dashboard):");
    console.log("  owner@hotelynk.in / hotelynk123\n");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
