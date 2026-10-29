// Creates (or resets the password of) a platform SUPER_ADMIN login.
// Use this on a LIVE database instead of the demo seed, so no well-known password exists.
//
//   npm run admin:create -- you@example.com "A-strong-password" "Your Name"          (local database)
//   npm run admin:create:prod -- you@example.com "A-strong-password" "Your Name"     (live database)

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

async function main() {
  const [emailArg, password, nameArg] = process.argv.slice(2);
  const email = (emailArg || "").trim().toLowerCase();
  const name = (nameArg || "Platform Admin").trim();

  if (!email || !email.includes("@") || !password) {
    throw new Error('Usage: npm run admin:create -- you@example.com "A-strong-password" "Your Name"');
  }
  if (password.length < 10) throw new Error("Please use a password of at least 10 characters.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const hash = await bcrypt.hash(password, 12);
    // Only ever creates a new admin or updates an existing SUPER_ADMIN - never touches an owner or staff login.
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, property_id)
       VALUES ($1, $2, $3, 'SUPER_ADMIN', NULL)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name
         WHERE users.role = 'SUPER_ADMIN'
       RETURNING id`,
      [email, hash, name]
    );
    if (res.rowCount === 0) throw new Error(`${email} already exists as a non-admin account. Use a different email.`);
    console.log(`Admin ready: ${email}  (sign in, then open /admin)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
