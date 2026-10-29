// Creates all tables from db/schema.sql.
//   npm run db:init     -> create tables (does nothing if they already exist)
//   npm run db:reset    -> DROP everything in the public schema, then recreate (DELETES ALL DATA)

const fs = require("fs");
const path = require("path");
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

  try {
    const reset = process.argv.includes("--reset");

    const exists = await pool.query(`SELECT to_regclass('public.properties') AS t`);
    if (exists.rows[0].t && !reset) {
      console.log("Tables already exist — nothing to do. (Use `npm run db:reset` to wipe and recreate.)");
      return;
    }

    if (reset) {
      console.log("Dropping existing schema...");
      await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    }

    const sql = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
    await pool.query(sql);

    // A fresh schema already contains everything in db/migrations, so mark them as applied.
    const dir = path.join(process.cwd(), "db", "migrations");
    if (fs.existsSync(dir)) {
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".sql"))) {
        await pool.query(`INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING`, [f]);
      }
    }
    console.log("Database schema created.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
