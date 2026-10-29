// Placeholder shapes shown while a page's data is loading. Pure markup (no hooks),
// so these can be used from server and client components alike.
import { Loader2 } from "lucide-react";

export function Bar({ className = "" }) {
  return <div className={`animate-pulse rounded-lg bg-dusk/10 ${className}`} />;
}

export function HeaderSkeleton({ withButton = true }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Bar className="h-3 w-16" />
        <Bar className="mt-3 h-8 w-64 max-w-full" />
      </div>
      {withButton && <Bar className="h-10 w-40 rounded-full" />}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-dusk/10 bg-white/70 p-5">
          <Bar className="h-3 w-24" />
          <Bar className="mt-4 h-8 w-20" />
          <Bar className="mt-3 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-dusk/10 bg-white/70 p-6 shadow-soft">
      <Bar className="h-5 w-48" />
      <Bar className="mt-4 h-64 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-dusk/10 bg-white/70 shadow-soft">
      <div className="border-b border-dusk/10 px-6 py-4">
        <Bar className="h-5 w-40" />
      </div>
      <div className="divide-y divide-dusk/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Bar className="h-4 w-40" />
            <Bar className="h-4 w-24" />
            <Bar className="hidden h-4 w-32 sm:block" />
            <Bar className="ml-auto h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, cols = "sm:grid-cols-2 lg:grid-cols-3" }) {
  return (
    <div className={`mt-6 grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-dusk/10 bg-white/70 p-5">
          <Bar className="h-5 w-3/4" />
          <Bar className="mt-3 h-3 w-1/2" />
          <Bar className="mt-6 h-8 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ScheduleGridSkeleton({ rows = 6 }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-dusk/10 bg-white p-4 shadow-soft">
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3">
            <Bar className="h-9 w-36 shrink-0" />
            <div className="flex flex-1 gap-1 overflow-hidden">
              {Array.from({ length: 31 }).map((_, c) => (
                <Bar key={c} className="h-8 w-8 shrink-0" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shown while a pop-up form's code is being downloaded the first time it's opened.
export function ModalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dusk-deep/40 backdrop-blur-sm">
      <div className="flex items-center gap-3 rounded-2xl bg-cream px-6 py-4 shadow-lift">
        <Loader2 className="h-5 w-5 animate-spin text-dusk/60" />
        <span className="font-body text-sm text-dusk/70">Loading…</span>
      </div>
    </div>
  );
}
