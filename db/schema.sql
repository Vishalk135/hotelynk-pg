-- Hotelynk — PostgreSQL schema (v2)
-- Requires PostgreSQL 13+ (gen_random_uuid() is built in).
--
-- v2 adds: staff_roles (master list of roles), shift_types (master list of shifts)
-- and schedule_entries (the monthly duty roster). staff_members now points to a role
-- by role_id, and "on duty today" is derived from the schedule.

CREATE TYPE user_role     AS ENUM ('SUPER_ADMIN', 'OWNER', 'STAFF');
CREATE TYPE room_status   AS ENUM ('VACANT', 'CHECKED_IN', 'ARRIVING', 'DEPARTING', 'HOUSEKEEPING');
CREATE TYPE menu_category AS ENUM ('Mains', 'Snacks', 'Drinks');
CREATE TYPE shift_kind    AS ENUM ('WORK', 'OFF', 'LEAVE');

-- Which migrations (db/migrations/*.sql) this database already has.
CREATE TABLE schema_migrations (
  name        TEXT PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1. Tenants (one row per client business)
CREATE TABLE properties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(150) NOT NULL,
  owner_email  VARCHAR(255) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Login accounts
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID REFERENCES properties(id) ON DELETE CASCADE,  -- NULL only for SUPER_ADMIN
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  TEXT         NOT NULL,
  name           VARCHAR(150) NOT NULL,
  role           user_role    NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_super_admin_no_property
    CHECK ((role = 'SUPER_ADMIN' AND property_id IS NULL)
        OR (role <> 'SUPER_ADMIN' AND property_id IS NOT NULL))
);

-- 3. Rooms / villas
CREATE TABLE rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  price        INTEGER      NOT NULL CHECK (price > 0),
  status       room_status  NOT NULL DEFAULT 'VACANT',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 4. Bookings (property is reached through the room)
CREATE TABLE bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guest_name  VARCHAR(150) NOT NULL,
  check_in    TIMESTAMPTZ  NOT NULL,
  check_out   TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_dates CHECK (check_out > check_in)
);

-- 5. POS menu
CREATE TABLE menu_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name         VARCHAR(150)  NOT NULL,
  price        INTEGER       NOT NULL CHECK (price > 0),
  stock        INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  max_stock    INTEGER       NOT NULL CHECK (max_stock > 0),
  category     menu_category NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 6. POS orders (header)
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  total        INTEGER     NOT NULL CHECK (total >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. POS order lines
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id)     ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  name          VARCHAR(150) NOT NULL,                              -- snapshot at time of sale
  quantity      INTEGER      NOT NULL CHECK (quantity > 0),
  price_each    INTEGER      NOT NULL CHECK (price_each > 0)        -- snapshot at time of sale
);

-- 8. MASTER: staff roles (Front Desk, Chef, Housekeeping...). Each property keeps its own list.
CREATE TABLE staff_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name         VARCHAR(60) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_roles_id_property UNIQUE (id, property_id)    -- target for composite FK below
);
CREATE UNIQUE INDEX uq_staff_roles_name ON staff_roles (property_id, lower(name));

-- 9. Staff roster (HR record — separate from login accounts in "users")
CREATE TABLE staff_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  role_id      UUID NOT NULL,
  name         VARCHAR(150) NOT NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_id_property UNIQUE (id, property_id),         -- target for composite FK below
  -- Composite FK: the role must belong to the SAME property as the staff member.
  CONSTRAINT fk_staff_role FOREIGN KEY (role_id, property_id)
    REFERENCES staff_roles (id, property_id) ON DELETE RESTRICT
);

-- 10. MASTER: shift types (Morning, Evening, Week off, Leave...). Each property keeps its own list.
CREATE TABLE shift_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name         VARCHAR(40) NOT NULL,
  code         VARCHAR(5)  NOT NULL,                                -- short label shown in the grid: M, E, WO
  kind         shift_kind  NOT NULL DEFAULT 'WORK',                 -- WORK = on duty, OFF = week off, LEAVE = on leave
  start_time   TIME,
  end_time     TIME,                                                -- may be earlier than start_time (night shift)
  color        VARCHAR(7)  NOT NULL DEFAULT '#64748B',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_shift_types_id_property UNIQUE (id, property_id),
  CONSTRAINT chk_shift_times CHECK (
    (kind = 'WORK' AND start_time IS NOT NULL AND end_time IS NOT NULL)
    OR (kind <> 'WORK' AND start_time IS NULL AND end_time IS NULL)),
  CONSTRAINT chk_shift_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);
CREATE UNIQUE INDEX uq_shift_types_name ON shift_types (property_id, lower(name));

-- 11. Monthly duty roster: one row per staff member per day
CREATE TABLE schedule_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL,
  staff_id       UUID NOT NULL,
  shift_type_id  UUID NOT NULL,
  work_date      DATE NOT NULL,
  duties         TEXT,                                              -- what they have to do that day
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_schedule_staff_day UNIQUE (staff_id, work_date),
  -- Composite FKs: staff member and shift type must belong to the same property as the entry.
  CONSTRAINT fk_schedule_staff FOREIGN KEY (staff_id, property_id)
    REFERENCES staff_members (id, property_id) ON DELETE CASCADE,
  CONSTRAINT fk_schedule_shift FOREIGN KEY (shift_type_id, property_id)
    REFERENCES shift_types (id, property_id) ON DELETE RESTRICT
);

-- Default roles and shifts for a property. Runs automatically for every new property (trigger below).
CREATE FUNCTION add_default_staff_setup(p_property_id UUID) RETURNS void AS $$
BEGIN
  INSERT INTO staff_roles (property_id, name) VALUES
    (p_property_id, 'Manager'), (p_property_id, 'Front Desk'), (p_property_id, 'Housekeeping'),
    (p_property_id, 'Chef'),    (p_property_id, 'Server'),     (p_property_id, 'Maintenance')
  ON CONFLICT DO NOTHING;

  INSERT INTO shift_types (property_id, name, code, kind, start_time, end_time, color) VALUES
    (p_property_id, 'Morning',  'M',  'WORK',  '08:00', '16:00', '#F59E0B'),
    (p_property_id, 'General',  'G',  'WORK',  '09:00', '18:00', '#0891B2'),
    (p_property_id, 'Evening',  'E',  'WORK',  '14:00', '22:00', '#7C5CFF'),
    (p_property_id, 'Night',    'N',  'WORK',  '22:00', '06:00', '#1D4ED8'),
    (p_property_id, 'Week off', 'WO', 'OFF',   NULL,    NULL,    '#64748B'),
    (p_property_id, 'Leave',    'L',  'LEAVE', NULL,    NULL,    '#E11D48')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION trg_properties_add_defaults() RETURNS trigger AS $$
BEGIN
  PERFORM add_default_staff_setup(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_add_defaults AFTER INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION trg_properties_add_defaults();

-- Indexes on foreign keys (Postgres does NOT create these automatically)
CREATE INDEX idx_users_property          ON users(property_id);
CREATE INDEX idx_rooms_property          ON rooms(property_id);
CREATE INDEX idx_rooms_property_status   ON rooms(property_id, status);
CREATE INDEX idx_bookings_room           ON bookings(room_id);
CREATE INDEX idx_bookings_dates          ON bookings(check_in, check_out);
CREATE INDEX idx_menu_items_property     ON menu_items(property_id);
CREATE INDEX idx_orders_property_created ON orders(property_id, created_at DESC);
CREATE INDEX idx_order_items_order       ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item   ON order_items(menu_item_id);
CREATE INDEX idx_staff_property          ON staff_members(property_id);
CREATE INDEX idx_staff_role              ON staff_members(role_id);
CREATE INDEX idx_shift_types_property    ON shift_types(property_id);
CREATE INDEX idx_schedule_property_date  ON schedule_entries(property_id, work_date);
CREATE INDEX idx_schedule_shift          ON schedule_entries(shift_type_id);
