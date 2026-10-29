import { HeaderSkeleton, CardGridSkeleton } from "../skeletons";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading POS">
      <HeaderSkeleton />
      <CardGridSkeleton count={9} cols="grid-cols-2 sm:grid-cols-3" />
    </div>
  );
}
