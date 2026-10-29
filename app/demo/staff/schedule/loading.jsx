import { HeaderSkeleton, ScheduleGridSkeleton } from "../../skeletons";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading schedule">
      <HeaderSkeleton />
      <ScheduleGridSkeleton />
    </div>
  );
}
