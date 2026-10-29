import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { todayStr, isMonthStr, monthBounds, shiftMonth, monthLabel } from "@/lib/dates";
import ScheduleClient from "./schedule-client";

export default async function SchedulePage({ searchParams }) {
  const user = await getCurrentUser();
  const today = todayStr();
  const month = isMonthStr(searchParams?.month) ? searchParams.month : today.slice(0, 7);
  const { first, last } = monthBounds(month);

  const [staff, shiftTypes, entries] = await Promise.all([
    query(
      `SELECT s.id, s.name, r.name AS role
         FROM staff_members s JOIN staff_roles r ON r.id = s.role_id
        WHERE s.property_id = $1 ORDER BY s.name`,
      [user.propertyId]
    ),
    query(
      `SELECT id, name, code, kind, to_char(start_time, 'HH24:MI') AS "startTime",
              to_char(end_time, 'HH24:MI') AS "endTime", color
         FROM shift_types WHERE property_id = $1
        ORDER BY CASE kind WHEN 'WORK' THEN 0 WHEN 'OFF' THEN 1 ELSE 2 END, start_time, name`,
      [user.propertyId]
    ),
    query(
      `SELECT staff_id AS "staffId", work_date AS date, shift_type_id AS "shiftTypeId", duties
         FROM schedule_entries WHERE property_id = $1 AND work_date BETWEEN $2 AND $3`,
      [user.propertyId, first, last]
    ),
  ]);

  return (
    <ScheduleClient
      month={month}
      monthTitle={monthLabel(month)}
      prevMonth={shiftMonth(month, -1)}
      nextMonth={shiftMonth(month, 1)}
      today={today}
      canEdit={user.role === "OWNER"}
      staff={staff}
      shiftTypes={shiftTypes}
      entries={entries}
    />
  );
}
