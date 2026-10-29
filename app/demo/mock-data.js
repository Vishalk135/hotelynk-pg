// This file intentionally still holds MOCK data — unlike bookings, POS
// stock, and staff (which now read from the real database via PostgreSQL),
// true channel-manager sync with Airbnb/Booking.com/MakeMyTrip requires
// becoming an approved API partner with each platform. That's a business
// process (applications, sometimes volume minimums), not something any
// codebase can just "connect." This preview shows what that screen will
// look like once those integrations are in place.

export const channels = [
  { name: "Airbnb", status: "Connected", lastSync: "2 minutes ago", listings: 8, color: "#7C5CFF" },
  {
    name: "Booking.com",
    status: "Connected",
    lastSync: "2 minutes ago",
    listings: 8,
    color: "#22D3EE",
  },
  {
    name: "MakeMyTrip",
    status: "Connected",
    lastSync: "6 minutes ago",
    listings: 6,
    color: "#FF9F43",
  },
];

export const rateTable = [
  { room: "Standard Room", base: 3200, airbnb: 3200, booking: 3200, mmt: 3350 },
  { room: "Garden Villa", base: 5400, airbnb: 5400, booking: 5400, mmt: 5600 },
  { room: "Sea View Villa", base: 8200, airbnb: 8200, booking: 8200, mmt: 8500 },
];
