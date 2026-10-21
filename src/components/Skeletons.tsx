export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="nh-skeleton h-5 w-20 rounded-full" />
        <div className="nh-skeleton h-3 w-16 rounded" />
      </div>
      <div className="nh-skeleton mb-2.5 h-5 w-[90%] rounded" />
      <div className="nh-skeleton mb-1.5 h-3.5 w-full rounded" />
      <div className="nh-skeleton mb-4 h-3.5 w-[75%] rounded" />
      <div className="flex items-center justify-between">
        <div className="nh-skeleton h-3 w-14 rounded" />
        <div className="nh-skeleton h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
