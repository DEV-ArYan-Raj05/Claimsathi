import { cn } from "../lib/cn";

/** Loading placeholder — screens show these, never a blank area (PRD §4.3). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-ink/10", className)} />;
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-24 bg-secondary/60" />
      ))}
    </div>
  );
}
