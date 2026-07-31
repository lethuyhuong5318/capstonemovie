export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-elevated ${className}`} />;
}

export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <SkeletonBlock className="aspect-[2/3] w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}
