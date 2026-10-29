-- Migration 001: staff roles master, shift types master, monthly schedule.
-- For databases created with the ORIGINAL (v1) schema. Fresh installs do not need this file.
-- Applied once by:  npm run db:migrate   (safe to run repeatedly; already-applied files are skipped)
--
-- What it does to existing data:
--   * every distinct free-text staff role becomes a row in staff_roles; staff_members.role_id points to it
--   * the old weekly on/off pattern (staff_shifts) becomes real schedule entries for the
--     current month and the next one (working day = "General", off day = "Week off")
--   * the old staff_members.role / status / shift columns and the staff_shifts table are removed

CREATE TYPE shift_kind AS ENUM ('WORK', 'OFF', 'LEAVE');

CREATE TABLE staff_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name         VARCHAR(60) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_staff_roles_id_property UNIQUE (id, property_id)
);
CREATE UNIQUE INDEX uq_staff_roles_name ON staff_roles (property_id, lower(name));

CREATE TABLE shift_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name         VARCHAR(40) NOT NULL,
  code         VARCHAR(5)  NOT NULL,
  kind         shift_kind  NOT NULL DEFAULT 'WORK',
  start_time   TIME,
  end_time     TIME,
  color        VARCHAR(7)  NOT NULL DEFAULT '#64748B',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_shift_types_id_property UNIQUE (id, property_id),
  CONSTRAINT chk_shift_times CHECK (
    (kind = 'WORK' AND start_time IS NOT NULL AND end_time IS NOT NULL)
    OR (kind <> 'WORK' AND start_time IS NULL AND end_time IS NULL)),
  CONSTRAINT chk_shift_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);
CREATE UNIQUE INDEX uq_shift_types_name ON shift_types (property_id, lower(name));

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

-- Give every EXISTING property the default roles + shifts
SELECT add_default_staff_setup(id) FROM properties;

-- Turn old free-text roles into master rows (case-insensitive: "Front desk" matches "Front Desk")
INSERT INTO staff_roles (property_id, name)
SELECT DISTINCT ON (property_id, lower(trim(role))) property_id, trim(role)
FROM staff_members
WHERE trim(role) <> ''
ON CONFLICT DO NOTHING;

ALTER TABLE staff_members ADD COLUMN role_id UUID;
UPDATE staff_members s
   SET role_id = r.id
  FROM staff_roles r
 WHERE r.property_id = s.property_id AND lower(r.name) = lower(trim(s.role));
-- Anyone with an empty role gets "Server" so the NOT NULL below cannot fail
UPDATE staff_members s
   SET role_id = r.id
  FROM staff_roles r
 WHERE s.role_id IS NULL AND r.property_id = s.property_id AND r.name = 'Server';

ALTER TABLE staff_members ALTER COLUMN role_id SET NOT NULL;
ALTER TABLE staff_members ADD CONSTRAINT uq_staff_id_property UNIQUE (id, property_id);
ALTER TABLE staff_members ADD CONSTRAINT fk_staff_role FOREIGN KEY (role_id, property_id)
  REFERENCES staff_roles (id, property_id) ON DELETE RESTRICT;

CREATE TABLE schedule_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id    UUID NOT NULL,
  staff_id       UUID NOT NULL,
  shift_type_id  UUID NOT NULL,
  work_date      DATE NOT NULL,
  duties         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_schedule_staff_day UNIQUE (staff_id, work_date),
  CONSTRAINT fk_schedule_staff FOREIGN KEY (staff_id, property_id)
    REFERENCES staff_members (id, property_id) ON DELETE CASCADE,
  CONSTRAINT fk_schedule_shift FOREIGN KEY (shift_type_id, property_id)
    REFERENCES shift_types (id, property_id) ON DELETE RESTRICT
);

-- Weekly pattern -> real entries for this month and next (day_of_week: 0 = Mon ... 6 = Sun)
INSERT INTO schedule_entries (property_id, staff_id, shift_type_id, work_date)
SELECT s.property_id, s.id, CASE WHEN sh.is_working THEN gen.id ELSE wo.id END, d::date
FROM staff_members s
CROSS JOIN generate_series(
  date_trunc('month', current_date)::date,
  (date_trunc('month', current_date) + interval '2 months' - interval '1 day')::date,
  interval '1 day') AS d
JOIN staff_shifts sh ON sh.staff_id = s.id AND sh.day_of_week = (extract(isodow FROM d)::int - 1)
JOIN shift_types gen ON gen.property_id = s.property_id AND gen.name = 'General'
JOIN shift_types wo  ON wo.property_id  = s.property_id AND wo.name  = 'Week off';

ALTER TABLE staff_members DROP COLUMN role, DROP COLUMN status, DROP COLUMN shift;
DROP TABLE staff_shifts;
DROP TYPE staff_status;

CREATE INDEX idx_staff_role              ON staff_members(role_id);
CREATE INDEX idx_shift_types_property    ON shift_types(property_id);
CREATE INDEX idx_schedule_property_date  ON schedule_entries(property_id, work_date);
CREATE INDEX idx_schedule_shift          ON schedule_entries(shift_type_id);
