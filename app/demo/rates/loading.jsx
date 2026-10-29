import { HeaderSkeleton, StatsSkeleton, TableSkeleton } from "../skeletons";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading rates">
      <HeaderSkeleton withButton={false} />
      <StatsSkeleton />
      <TableSkeleton rows={4} />
    </div>
  );
}
