import { HeaderSkeleton, TableSkeleton } from "../skeletons";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading team">
      <HeaderSkeleton />
      <TableSkeleton rows={4} />
    </div>
  );
}
