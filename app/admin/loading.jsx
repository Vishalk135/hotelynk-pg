// Admin screens have a dark background, so the placeholder blocks are light-on-dark.
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-cream/10" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-cream/5" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-cream/5" />
        ))}
      </div>
    </div>
  );
}
