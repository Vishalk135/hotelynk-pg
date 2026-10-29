import { cache } from "react";
import { cookies } from "next/headers";
import { queryOne, isUuid } from "./db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./jwt";

export { SESSION_COOKIE_NAME };

/**
 * @typedef {"SUPER_ADMIN" | "OWNER" | "STAFF"} Role
 *
 * @typedef {Object} CurrentUser
 * @property {string} uid         users.id
 * @property {string|null} email
 * @property {string} name
 * @property {Role} role
 * @property {string|null} propertyId  null only for SUPER_ADMIN
 * @property {string|null} propertyName  the property's name (null for SUPER_ADMIN)
 */

/**
 * Reads and verifies the session cookie, then loads the matching user from
 * PostgreSQL. Returns null if not signed in, the cookie is invalid/expired,
 * or the account has since been deleted — callers should redirect to /login.
 */
/**
 * Reads and verifies the session cookie, then loads the matching user (and the name of their
 * property) from PostgreSQL in ONE query. Returns null if not signed in, the cookie is
 * invalid/expired, or the account has since been deleted - callers should redirect to /login.
 *
 * Wrapped in React's cache(): the layout and the page both call this during the same request,
 * but the database is only asked once.
 *
 * @returns {Promise<CurrentUser | null>}
 */
export const getCurrentUser = cache(async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const userId = await verifySessionToken(token);
  if (!userId || !isUuid(userId)) return null;

  try {
    const row = await queryOne(
      `SELECT u.id, u.email, u.name, u.role, u.property_id AS "propertyId", p.name AS "propertyName"
         FROM users u
         LEFT JOIN properties p ON p.id = u.property_id
        WHERE u.id = $1`,
      [userId]
    );
    if (!row) return null;
    return {
      uid: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      propertyId: row.propertyId,
      propertyName: row.propertyName,
    };
  } catch {
    return null;
  }
});
