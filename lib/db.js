import { Pool, types } from "pg";

// Server-only. Never import this file from a "use client" component.

// Postgres returns bigint (e.g. SUM(), COUNT()) as a string by default.
// Our numbers are small (rupees), so parse them as JS numbers.
types.setTypeParser(20, (v) => parseInt(v, 10));

// DATE columns (e.g. schedule work_date) come back as plain "YYYY-MM-DD" strings instead of
// JS Date objects. Date objects carry a time zone, which can shift a calendar date by one day.
types.setTypeParser(1082, (v) => v);

// Reuse one pool across hot reloads in `next dev` (otherwise every reload
// would open a fresh set of connections and you'd hit Postgres' limit).
const globalForPg = globalThis;

export function getPool() {
  if (globalForPg.__hotelynkPool) return globalForPg.__hotelynkPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.local.example to .env.local and fill it in (see README)."
    );
  }

  const pool = new Pool({
    connectionString,
    // Each serverless instance (Vercel) keeps its own small pool, so use few connections there
    // and rely on the database's pooler (e.g. Neon's "-pooler" URL). Locally 10 is fine.
    max: Number(process.env.DATABASE_POOL_MAX) || (process.env.VERCEL ? 3 : 10),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    // Set DATABASE_SSL=true for hosted databases (Neon, Supabase, Railway, RDS...).
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });
  globalForPg.__hotelynkPool = pool;
  return pool;
}

/** Run a query and return all rows. Always use $1, $2... placeholders — never string-concatenate user input. */
export async function query(text, params = []) {
  const res = await getPool().query(text, params);
  return res.rows;
}

/** Run a query and return the first row, or null. */
export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] ?? null;
}

/** Run several statements atomically. Rolls back automatically if `fn` throws. */
export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** An error whose message is safe to show to the end user (HTTP 400). */
export class UserError extends Error {}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v) {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Postgres error codes we handle explicitly. */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FK_VIOLATION = "23503";
