// Calendar-date helpers. Dates are handled as "YYYY-MM-DD" strings and months as "YYYY-MM"
// so there are no time-zone surprises. Safe to import from server and client code.

export const APP_TIMEZONE = "Asia/Kolkata";
export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Servers (Vercel) run in UTC, but your guests, staff and revenue days are India time.
 * These helpers always work in IST (UTC+5:30, no daylight saving) whatever the server clock says.
 */

/** The very start of a calendar day in India, as a real moment in time. */
export function startOfDayIST(dateStr) {
  return new Date(dateStr + "T00:00:00+05:30");
}

/** Date + time shown in India time, e.g. formatIST(d, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) */
export function formatIST(date, options) {
  return new Date(date).toLocaleString("en-IN", { timeZone: APP_TIMEZONE, ...options });
}

/** Date only, shown in India time. */
export function formatDateIST(date, options) {
  return new Date(date).toLocaleDateString("en-IN", { timeZone: APP_TIMEZONE, ...options });
}

/** Today's date in India ("YYYY-MM-DD"), whatever time zone the server runs in. */
export function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

export function isDateStr(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function isMonthStr(v) {
  return typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

/** "2026-11" -> { first: "2026-11-01", last: "2026-11-30", days: 30 } */
export function monthBounds(month) {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { first: `${month}-01`, last: `${month}-${String(days).padStart(2, "0")}`, days };
}

/** All dates of a month as "YYYY-MM-DD" strings. */
export function datesOfMonth(month) {
  const { days } = monthBounds(month);
  return Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

/** 0 = Monday ... 6 = Sunday */
export function weekdayIndex(dateStr) {
  return (new Date(dateStr + "T00:00:00Z").getUTCDay() + 6) % 7;
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The 7 dates (Mon..Sun) of the week containing `dateStr`. */
export function weekOf(dateStr) {
  const monday = addDays(dateStr, -weekdayIndex(dateStr));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function longDateLabel(dateStr) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "14:00:00" -> "2:00 PM" */
export function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Shift label such as "Morning · 8:00 AM – 4:00 PM" (or just the name for off/leave). */
export function shiftTimeRange(shift) {
  return shift.startTime && shift.endTime ? `${fmtTime(shift.startTime)} – ${fmtTime(shift.endTime)}` : "";
}
