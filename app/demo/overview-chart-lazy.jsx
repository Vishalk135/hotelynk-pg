"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./skeletons";

// recharts is large. Load it separately so the overview numbers appear first,
// with a placeholder where the chart will be.
const OverviewChart = dynamic(() => import("./overview-chart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export default OverviewChart;
