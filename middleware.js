import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/jwt";

// Verifies the signed session token (signature + expiry) before any
// /demo or /admin page renders. The pages themselves also call
// getCurrentUser(), which additionally checks the user still exists in
// the database and loads their role/property.
export async function middleware(req) {
  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/demo/:path*", "/admin/:path*"],
};
