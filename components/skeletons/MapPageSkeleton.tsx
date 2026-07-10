import { Skeleton } from "@/components/ui/skeleton";

function MapFriendsListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-2xl p-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

export function MapPageSkeleton() {
  return (
    <div
      className="map-page flex h-dvh max-h-dvh overflow-hidden bg-surface"
      aria-busy="true"
      aria-label="Loading map"
    >
      <div className="hidden w-[4.25rem] shrink-0 border-r border-outline-variant/30 bg-surface md:flex" />

      <main className="map-page__main relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="map-friends-sidebar hidden shrink-0 flex-col border-r border-outline-variant/20 bg-surface md:flex">
            <div className="border-b border-border p-4">
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <MapFriendsListSkeleton />
          </aside>

          <div className="relative min-h-0 min-w-0 flex-1 bg-background">
            <div className="absolute inset-x-0 top-0 z-[25] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
              <Skeleton className="h-14 w-full rounded-2xl sm:h-16" />
            </div>
            <div className="flex h-full items-center justify-center p-4 sm:p-6">
              <Skeleton className="h-full w-full max-w-none rounded-none" />
            </div>
            <div className="map-page__empty absolute inset-x-0 px-3 md:hidden">
              <Skeleton className="mx-auto h-24 w-full max-w-md rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
