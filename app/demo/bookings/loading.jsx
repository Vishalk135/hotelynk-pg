import { HeaderSkeleton, CardGridSkeleton } from "../skeletons";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading bookings">
      <HeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}
