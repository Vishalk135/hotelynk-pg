import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";

/** For routes any signed-in member of a property may use (read-only things). */
export async function requireMember() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  if (!user.propertyId) return { error: NextResponse.json({ error: "No property for this account." }, { status: 403 }) };
  return { user };
}

/** For routes that change staff, roles, shifts or the schedule: property owner only. */
export async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  if (user.role !== "OWNER" || !user.propertyId) {
    return { error: NextResponse.json({ error: "Only the property owner can do this." }, { status: 403 }) };
  }
  return { user };
}

export const bad = (message, status = 400) => NextResponse.json({ error: message }, { status });
