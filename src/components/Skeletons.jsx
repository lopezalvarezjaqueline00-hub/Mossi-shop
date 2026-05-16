export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)]">
      <div className="h-64 animate-pulse bg-[color:var(--surface-muted)]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[color:var(--surface-muted)]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-[color:var(--surface-muted)]" />
        <div className="h-8 w-full animate-pulse rounded bg-[color:var(--surface-muted)]" />
      </div>
    </div>
  )
}

export function MetricSkeleton() {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-[color:var(--surface-muted)]" />
      <div className="mt-5 h-8 w-32 animate-pulse rounded bg-[color:var(--surface-muted)]" />
      <div className="mt-4 h-3 w-20 animate-pulse rounded bg-[color:var(--surface-muted)]" />
    </div>
  )
}
