// Edge-safe (uses only `jose`) so it can be imported from middleware.ts
// as well as from server code.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "hotelynk_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 5; // 5 days

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short (need 32+ characters). See .env.local.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_S}s`)
    .sign(secretKey());
}

/** Returns the user id inside a valid, unexpired token, or null. */
export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
