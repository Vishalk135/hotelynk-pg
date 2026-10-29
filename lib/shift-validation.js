const KINDS = ["WORK", "OFF", "LEAVE"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

/** Validates a shift-type request body. Returns { value } or { error }. */
export function validateShiftType(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const kind = body?.kind;
  const color = body?.color || "#64748B";

  if (!name || name.length > 40) return { error: "Enter a shift name (max 40 characters)." };
  if (!code || code.length > 5) return { error: "Enter a short code of 1 to 5 characters, e.g. M or WO." };
  if (!KINDS.includes(kind)) return { error: "Choose a shift type." };
  if (!COLOR_RE.test(color)) return { error: "Invalid colour." };

  let startTime = null;
  let endTime = null;
  if (kind === "WORK") {
    // Accept "08:00" or "08:00:00"
    startTime = String(body?.startTime ?? "").slice(0, 5);
    endTime = String(body?.endTime ?? "").slice(0, 5);
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) return { error: "Enter a start and end time." };
    if (startTime === endTime) return { error: "Start and end time can't be the same." };
  }
  return { value: { name, code, kind, startTime, endTime, color } };
}
