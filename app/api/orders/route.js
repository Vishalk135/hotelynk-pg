import { NextResponse } from "next/server";
import { withTransaction, isUuid, UserError } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || !user.propertyId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const propertyId = user.propertyId;

  const body = await req.json().catch(() => null);
  const lines = body?.lines ?? [];

  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Validate and merge duplicate lines for the same item.
  const wanted = new Map();
  for (const l of lines) {
    const qty = Number(l?.quantity);
    if (!isUuid(l?.menuItemId) || !Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
    }
    wanted.set(l.menuItemId, (wanted.get(l.menuItemId) ?? 0) + qty);
  }

  try {
    const orderId = await withTransaction(async (db) => {
      // Lock the rows we're about to change, so two simultaneous checkouts
      // can't both sell the last portion (this replaces the Firestore transaction).
      // Filtering by property_id prevents ordering another client's menu items.
      const found = await db.query(
        `SELECT id, name, price, stock FROM menu_items
         WHERE id = ANY($1::uuid[]) AND property_id = $2
         FOR UPDATE`,
        [Array.from(wanted.keys()), propertyId]
      );
      if (found.rowCount !== wanted.size) throw new UserError("Menu item not found.");

      let total = 0;
      const orderLines = [];
      for (const item of found.rows) {
        const qty = wanted.get(item.id);
        if (item.stock < qty) throw new UserError(`Not enough stock for ${item.name}.`);
        total += item.price * qty;
        orderLines.push({ id: item.id, name: item.name, qty, price: item.price });
      }

      const order = await db.query(
        `INSERT INTO orders (property_id, total) VALUES ($1, $2) RETURNING id`,
        [propertyId, total]
      );
      const newOrderId = order.rows[0].id;

      for (const l of orderLines) {
        await db.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price_each)
           VALUES ($1, $2, $3, $4, $5)`,
          [newOrderId, l.id, l.name, l.qty, l.price]
        );
        await db.query(`UPDATE menu_items SET stock = stock - $1 WHERE id = $2`, [l.qty, l.id]);
      }
      return newOrderId;
    });

    return NextResponse.json({ ok: true, orderId });
  } catch (err) {
    if (err instanceof UserError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("Checkout failed:", err);
    return NextResponse.json({ error: "Checkout failed." }, { status: 500 });
  }
}
