import { HeaderSkeleton, StatsSkeleton, ChartSkeleton } from "./skeletons";

// Shown instantly when you click a sidebar link, until the page's data arrives.
// Applies to every /demo page that doesn't have its own loading.jsx (e.g. the Overview).
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <HeaderSkeleton withButton={false} />
      <StatsSkeleton />
      <div className="mt-6">
        <ChartSkeleton />
      </div>
    </div>
  );
}
