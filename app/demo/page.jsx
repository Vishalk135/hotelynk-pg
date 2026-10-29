import {
  BedDouble,
  IndianRupee,
  RefreshCw,
  Users,
  CalendarCheck2,
  PackageSearch,
  UserCog,
} from "lucide-react";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { todayStr, addDays, startOfDayIST, formatIST, formatDateIST } from "@/lib/dates";
import OverviewChart from "./overview-chart-lazy";

const ACTIVITY_ICON = { booking: CalendarCheck2, stock: PackageSearch, staff: UserCog };
const ACTIVITY_TINT = {
  booking: "text-coral bg-coral/10",
  stock: "text-mustard-dark bg-mustard/15",
  staff: "text-cream bg-cream/10",
};

export default async function OverviewPage() {
  const user = await getCurrentUser();
  const propertyId = user.propertyId;

  // Days are India days, even though the server (e.g. Vercel) runs in UTC.
  const weekAgo = startOfDayIST(addDays(todayStr(), -6));

  const [rooms, staff, menu, weekOrders, bookings] = await Promise.all([
    query(`SELECT id, name, status FROM rooms WHERE property_id = $1`, [propertyId]),
    // One row per staff member; "kind" is today's shift kind from the schedule (null = not scheduled).
    query(
      `SELECT st.kind
         FROM staff_members s
         LEFT JOIN schedule_entries e ON e.staff_id = s.id AND e.work_date = $2
         LEFT JOIN shift_types st ON st.id = e.shift_type_id
        WHERE s.property_id = $1`,
      [propertyId, todayStr()]
    ),
    query(
      `SELECT id, name, stock, max_stock AS "maxStock" FROM menu_items WHERE property_id = $1`,
      [propertyId]
    ),
    query(
      `SELECT total, created_at AS "createdAt" FROM orders WHERE property_id = $1 AND created_at >= $2`,
      [propertyId, weekAgo]
    ),
    query(
      `SELECT b.id, b.room_id AS "roomId", b.guest_name AS "guestName", b.created_at AS "createdAt"
       FROM bookings b JOIN rooms r ON r.id = b.room_id
       WHERE r.property_id = $1
       ORDER BY b.created_at DESC
       LIMIT 3`,
      [propertyId]
    ),
  ]);

  // Room names for the recent-bookings activity feed.
  const roomsById = Object.fromEntries(rooms.map((r) => [r.id, r.name]));

  const occupied = rooms.filter(
    (r) => r.status === "CHECKED_IN" || r.status === "DEPARTING"
  ).length;
  const onDuty = staff.filter((s) => s.kind === "WORK").length;
  const weekTotal = weekOrders.reduce((s, o) => s + o.total, 0);

  const revenueTrend = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = new Date(weekAgo.getTime() + i * 86400000);
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const dayOrders = weekOrders.filter((o) => {
      const created = new Date(o.createdAt);
      return created >= dayStart && created < dayEnd;
    });
    return {
      day: formatDateIST(dayStart, { weekday: "short" }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
    };
  });

  const lowStock = menu.filter((m) => m.stock / m.maxStock <= 0.25);

  const activity = [
    ...bookings.map((b) => ({
      text: `${roomsById[b.roomId] ?? "A room"} booked for ${b.guestName}`,
      time: formatIST(b.createdAt, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      kind: "booking",
    })),
    ...lowStock
      .slice(0, 2)
      .map((m) => ({
        text: `${m.name} stock is low (${m.stock} left)`,
        time: "now",
        kind: "stock",
      })),
  ].slice(0, 5);

  const isOwner = user.role === "OWNER" || user.role === "SUPER_ADMIN";

  const STATS = [
    {
      label: "Occupancy today",
      value: `${occupied}/${rooms.length}`,
      sub: "rooms occupied",
      icon: BedDouble,
      tint: "text-coral",
      bg: "bg-coral/10",
    },
    isOwner
      ? {
          label: "Revenue this week",
          value: `₹${weekTotal.toLocaleString("en-IN")}`,
          sub: `${weekOrders.length} orders`,
          icon: IndianRupee,
          tint: "text-mustard-dark",
          bg: "bg-mustard/15",
        }
      : {
          label: "Orders this week",
          value: `${weekOrders.length}`,
          sub: "from the shack POS",
          icon: IndianRupee,
          tint: "text-mustard-dark",
          bg: "bg-mustard/15",
        },
    {
      label: "Menu items",
      value: `${menu.length}`,
      sub: lowStock.length ? `${lowStock.length} running low` : "stock healthy",
      icon: RefreshCw,
      tint: "text-azure-dark",
      bg: "bg-azure/10",
    },
    {
      label: "Staff on duty",
      value: `${onDuty}/${staff.length}`,
      sub: "today's roster",
      icon: Users,
      tint: "text-coral",
      bg: "bg-coral/10",
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-dusk/45">
            {formatDateIST(new Date(), {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-dusk sm:text-3xl">
            Good afternoon
          </h1>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-dusk/10 bg-white/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-dusk/60">
          <span className="h-1.5 w-1.5 rounded-full bg-moss" />
          Live data
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-2xl border border-dusk/10 bg-white/70 p-5 shadow-soft"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg} ${s.tint}`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <p className="mt-4 font-display text-2xl font-bold text-dusk">{s.value}</p>
              <p className="mt-0.5 font-body text-xs text-dusk/60">{s.label}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-dusk/40">
                {s.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {isOwner ? (
          <OverviewChart data={revenueTrend} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dusk/10 bg-white/70 p-6 text-center shadow-soft">
            <p className="font-display text-base font-bold text-dusk">Revenue details</p>
            <p className="mt-1 font-body text-sm text-dusk/50">
              Visible to the property owner only.
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-dusk/10 bg-white/70 p-6 shadow-soft">
          <h2 className="font-display text-lg font-bold text-dusk">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="mt-4 font-body text-sm text-dusk/40">
              Nothing yet — activity will show up here.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {activity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.kind];
                const tint = ACTIVITY_TINT[a.kind];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${tint}`}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="font-body text-sm leading-snug text-dusk">{a.text}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-dusk/40">
                        {a.time}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
