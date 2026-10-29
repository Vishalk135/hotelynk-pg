import { HeaderSkeleton, TableSkeleton } from "../skeletons";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading staff">
      <HeaderSkeleton />
      <TableSkeleton rows={6} />
      <TableSkeleton rows={4} />
    </div>
  );
}
