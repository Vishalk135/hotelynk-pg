"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function OverviewChart({ data }) {
  return (
    <div className="rounded-2xl border border-dusk/10 bg-white/70 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-dusk">Revenue, last 7 days</h2>
        <span className="font-mono text-xs text-dusk/40">in ₹</span>
      </div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,35,41,0.08)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "rgba(20,35,41,0.5)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(20,35,41,0.4)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}k`}
              width={36}
            />

            <Tooltip
              contentStyle={{
                background: "#0B0E14",
                border: "none",
                borderRadius: 12,
                fontSize: 12,
                color: "#F5F6FA",
              }}
              formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#7C5CFF"
              strokeWidth={2.5}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
