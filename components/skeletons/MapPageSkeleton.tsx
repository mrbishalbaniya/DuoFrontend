import { Skeleton } from "@/components/ui/skeleton";
import { AppShellSkeleton } from "./AppShellSkeleton";

function FriendRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}

/**
 * /map: friends sidebar (desktop), dark map stage with a faint grid, floating
 * controls on the right and the mobile glass header.
 */
export function MapPageSkeleton() {
  return (
    <AppShellSkeleton label="Loading map">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="map-friends-sidebar hidden shrink-0 flex-col border-r border-outline-variant/20 bg-surface md:flex">
          <div className="space-y-2 px-4 pb-3 pt-5">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-3.5 w-36" />
          </div>
          <div className="mx-3 overflow-hidden rounded-2xl bg-surface-container-high/40">
            {Array.from({ length: 7 }).map((_, i) => (
              <FriendRowSkeleton key={i} />
            ))}
          </div>
        </aside>

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#0b0d12]">
          {/* map texture */}
          <div
            className="skeleton-shimmer absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <Skeleton className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40" />

          {/* mobile header */}
          <div className="absolute inset-x-0 top-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
            <Skeleton className="h-14 w-full rounded-2xl bg-white/10" />
          </div>

          {/* floating controls */}
          <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-11 rounded-full bg-white/10" />
            ))}
          </div>
          <Skeleton className="absolute bottom-6 right-4 h-11 w-11 rounded-full bg-white/10" />
        </div>
      </div>
    </AppShellSkeleton>
  );
}
