import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import PosClient from "./pos-client";

export default async function PosPage() {
  const user = await getCurrentUser();
  const menu = await query(
    `SELECT id, name, price, stock, max_stock AS "maxStock", category
     FROM menu_items WHERE property_id = $1 ORDER BY name`,
    [user.propertyId]
  );
  return <PosClient initialMenu={menu} />;
}
