# Hotelynk — multi-tenant hospitality SaaS (Next.js + PostgreSQL)

Bookings, POS and staffing for Goa's guesthouses, villas and shacks. Many client
businesses ("properties") share one deployment and each only sees its own data.

Stack: Next.js 14 (App Router) · **plain JavaScript** · Tailwind · **PostgreSQL** (`pg`) ·
bcrypt password hashes · signed JWT session cookie (`jose`).

## Quick start

You need **Node.js 20.6+** and **PostgreSQL 13+** (or Docker).

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.local.example .env.local        # Windows (cmd): copy .env.local.example .env.local

# 3. Generate a login-cookie secret and paste it into JWT_SECRET= in .env.local
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 4. Start PostgreSQL (pick ONE option below), then create tables + demo data
npm run db:setup

# 5. Run the app
npm run dev          # http://localhost:3000
```

### Start PostgreSQL — pick one

**A. Docker (easiest, works on any OS)**
```bash
docker compose up -d
```
The default `DATABASE_URL` in `.env.local.example` already matches this.

**B. Windows**
```powershell
winget install PostgreSQL.PostgreSQL.16
# set a password for the "postgres" user during install, then:
psql -U postgres -c "CREATE USER hotelynk WITH PASSWORD 'hotelynk';"
psql -U postgres -c "CREATE DATABASE hotelynk OWNER hotelynk;"
```
(or use the installer from postgresql.org; pgAdmin can run those two SQL lines too)

**C. macOS**
```bash
brew install postgresql@16
brew services start postgresql@16
createuser hotelynk && createdb -O hotelynk hotelynk
psql -d postgres -c "ALTER USER hotelynk WITH PASSWORD 'hotelynk';"
```

**D. Ubuntu / Debian**
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE USER hotelynk WITH PASSWORD 'hotelynk';"
sudo -u postgres psql -c "CREATE DATABASE hotelynk OWNER hotelynk;"
```

Options B–D use `DATABASE_URL="postgresql://hotelynk:hotelynk@localhost:5432/hotelynk"`
(already the default). Use a stronger password outside local development.

## Logins created by the seed

| Role | Email | Password |
|---|---|---|
| Platform admin (`/admin`) | `admin@hotelynk.in` | `hotelynkadmin123` |
| Demo owner (`/demo`) | `owner@hotelynk.in` | `hotelynk123` |

**Change both passwords before this is anything but a local test.**

## npm scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / run |
| `npm run db:init` | Create all tables from `db/schema.sql` (skips if they exist) |
| `npm run db:seed` | Insert the admin + demo property (safe to re-run) |
| `npm run db:migrate` | Upgrade an **older** database to the current schema (skips what's already applied) |
| `npm run admin:create -- email "password" "Name"` | Create or reset a platform admin login (add `:prod` for the live database) |
| `npm run db:init:prod` / `db:migrate:prod` | Same as above, but against the database in `.env.production.local` |
| `npm run db:setup` | `db:init` + `db:seed` |
| `npm run db:reset` | **Deletes everything** and recreates the empty tables |

To inspect data: `psql "postgresql://hotelynk:hotelynk@localhost:5432/hotelynk"` then e.g. `\dt` or `SELECT * FROM rooms;`

## Upgrading an existing database

Created your database with the first version of this project? Don't reset it. Run once:

```bash
npm install          # picks up the new pdf-lib package
npm run db:migrate
```

Migration `001` keeps your data: each free-text staff role becomes a row in the new roles list, and each
person's old weekly on/off pattern becomes real schedule entries for this month and next. Fresh installs
(`npm run db:setup`) don't need it.

## Staff, roles and the monthly schedule

**Staff page** (`/demo/staff`)
- Add, edit and delete staff members (owner only). Deleting someone also deletes their schedule.
- **Manage roles**: your own master list (Front Desk, Chef, Housekeeping...). Staff pick a role from it. A role still
  in use can't be deleted, and names are unique per property (case-insensitive).
- "Today's roster" and the dashboard's "Staff on duty" are worked out from today's schedule.

**Monthly schedule** (`/demo/staff/schedule`)
- One row per person, one column per day. Click a day to choose the shift and write that day's duties.
- **Bulk assign**: e.g. "Sunita, Morning, every Mon-Fri this month", or clear a range.
- **Manage shifts**: your master list of shifts (Morning, Evening, Night, Week off, Leave...) with times and colours.
  Six defaults are created for every new property.
- **Download** a PDF (one page per person, so each person gets their own sheet) or a CSV for Excel. The PDF icon on a
  row downloads just that person. Any signed-in user of the property can view and download; only the owner can edit.
- PDF note: the standard PDF fonts only cover Western characters, so names or duties written in Devanagari, Konkani
  script etc. print as "?" in the PDF. The CSV keeps every character.

## How multi-tenancy works

Every client is a row in `properties`. Every login (`users`) belongs to one property via
`property_id`, except the `SUPER_ADMIN` (you), whose `property_id` is `NULL`. Every query in
the app filters by the signed-in user's `property_id`, so Client A can never see Client B's
rooms, bookings, orders or staff. There is no public signup — you create each client's login
from `/admin`.

## How login works

1. `POST /api/auth/login` looks up the user by email and checks the password against the bcrypt
   hash in `users.password_hash`.
2. On success the server sets an HttpOnly cookie containing a JWT signed with `JWT_SECRET`
   (valid 5 days).
3. `middleware.js` verifies that signature on every `/demo` and `/admin` request, and
   `getCurrentUser()` (in `lib/session.js`) loads the user's role and property from PostgreSQL.
   Deleting a user from the database logs them out immediately.

## Where things live

- `db/schema.sql` — the PostgreSQL schema (11 tables) · `db/migrations/` — upgrade scripts for older databases
- `lib/db.js` — connection pool, `query()`, `queryOne()`, `withTransaction()`
- `lib/jwt.js`, `lib/session.js` — session token + "who is signed in"
- `lib/dates.js` — calendar helpers (dates as `YYYY-MM-DD`, India time) · `lib/schedule-pdf.js` — schedule PDF builder
- `app/api/**` — server routes (login, bookings, orders, rooms, menu, staff, team, assistant…)
- `app/demo/staff/**` — staff roster, roles, monthly schedule
- `app/demo/**` — client dashboard · `app/admin/**` — platform-admin panel
- `scripts/init-db.js`, `scripts/seed.js` — database setup

## Deploying live on Vercel (with a hosted PostgreSQL)

Vercel runs your Next.js app; it does not run Postgres, so you add a hosted database. The easiest is **Neon**,
which you can add from inside Vercel (Marketplace). Total time: about 20 minutes.

1. **Put the code on GitHub.** Create a private repo and push the project folder
   (`.env.local` is git-ignored, so your secrets are not uploaded).
2. **Create the project on Vercel.** vercel.com -> Add New -> Project -> import the repo. Framework is detected
   as Next.js. Don't deploy yet if it asks for environment variables first; continue to step 3.
3. **Add the database.** In the Vercel project: Storage (or Marketplace) -> Neon Postgres -> Add. Pick the region
   **Singapore** (the closest Neon region to India) and connect it to the project. Vercel then adds `DATABASE_URL`
   (pooled) and `DATABASE_URL_UNPOOLED` to your environment variables automatically.
4. **Add the other environment variables** (Project -> Settings -> Environment Variables):
   - `JWT_SECRET` - a NEW long random value (not the one you use locally):
     `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
   - `DATABASE_SSL` = `true`
   - `RESEND_API_KEY` - your Resend key
5. **Deploy** (Deployments -> Redeploy, or push a commit). `vercel.json` already runs the app in Vercel's Singapore
   region (`sin1`), next to the database, so each page's queries are fast.
6. **Create the tables in the live database - once, from your laptop.** Make a file `.env.production.local` in the
   project folder (it is git-ignored):

   ```
   DATABASE_URL="<paste the DATABASE_URL_UNPOOLED value from Vercel>"
   DATABASE_SSL=true
   ```

   Then run:

   ```bash
   npm run db:init:prod
   npm run admin:create:prod -- you@yourdomain.com "A-strong-password" "Your Name"
   ```

   Do **not** run `db:seed` on the live database: it creates demo logins with well-known passwords.
7. Open your Vercel URL, sign in with the admin you just created, go to `/admin`, and create your first client.

Later schema changes: add a file in `db/migrations`, then `npm run db:migrate:prod`.
Custom domain: Project -> Settings -> Domains.

**Good to know:** servers on Vercel run in UTC, so the code uses India time (IST) for "today", revenue days and
displayed times. Plan limits and prices change - check the Vercel and Neon pricing pages before you rely on a free tier
for paying clients.

## If a page feels slow

- In `npm run dev`, the **first** click on each page is slow because Next.js compiles it on demand. Test real speed
  with `npm run build` then `npm start`.
- Every page has a loading screen (`loading.jsx`) that appears instantly on click; heavy parts (the revenue chart, the
  assistant, some pop-ups) load only when needed; and saving something keeps its button on a spinner until the page
  has refreshed.

## Contact form email

The "Get in touch" form sends mail through [Resend](https://resend.com). Put your API key in
`RESEND_API_KEY`. It sends from Resend's shared test address until you verify your own domain.

## Still mock / not built yet

- **Channel sync** (Airbnb / Booking.com / MakeMyTrip) is a visual mockup — real integration needs
  each platform's partner approval.
- The **AI assistant** is keyword matching over your real data, not an LLM.
- Password reset / change-password screens, editing or deleting rooms and menu items, login
  rate-limiting, and payments (Razorpay is the usual India-first choice) are not built yet.
- Schedule extras not built yet: "copy last month", shift-swap requests, and staff logging in to see only
  their own schedule (today any signed-in user of the property can see everyone's).
