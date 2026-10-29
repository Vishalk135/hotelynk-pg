import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const VALID_CATEGORIES = ["Mains", "Snacks", "Drinks"];

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || !user.propertyId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { name, price, stock, category } = body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Item name is required." }, { status: 400 });
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json({ error: "Enter a valid price." }, { status: 400 });
  }
  const stockNum = Number(stock);
  if (!Number.isFinite(stockNum) || stockNum < 0) {
    return NextResponse.json({ error: "Enter a valid stock quantity." }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  const stockInt = Math.round(stockNum);
  const rows = await query(
    `INSERT INTO menu_items (property_id, name, price, stock, max_stock, category)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      user.propertyId,
      name.trim(),
      Math.round(priceNum),
      stockInt,
      // max_stock anchors the stock-level bar in the POS UI — starting stock
      // doubled gives reasonable headroom until the owner restocks for real.
      Math.max(stockInt * 2, 10),
      category,
    ]
  );

  return NextResponse.json({ ok: true, itemId: rows[0].id });
}
