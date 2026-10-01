import { Skeleton } from "@/components/ui/skeleton";
import { AppShellSkeleton } from "./AppShellSkeleton";

/** Profile card: 3:4 photo with name/time overlay and an action pill below. */
function DiscoverCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[1.25rem] bg-surface-container-high/60 ring-1 ring-outline-variant/25 md:rounded-2xl">
      <div className="relative aspect-[3/4] w-full">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3 md:p-4">
          <Skeleton className="h-4 w-3/5 bg-on-surface/15" />
          <Skeleton className="h-3 w-2/5 bg-on-surface/10" />
        </div>
      </div>
      <div className="p-2.5 md:p-3">
        <Skeleton className="h-9 w-full rounded-full md:h-10" />
      </div>
    </div>
  );
}

/** /discover: title + refresh, four-tab segmented control, card grid. */
export function DiscoverMatchesSkeleton() {
  return (
    <AppShellSkeleton label="Loading discover">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto w-full max-w-lg px-4 md:max-w-7xl md:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-4 pt-4 md:pt-6">
            <Skeleton className="h-9 w-40 rounded-lg md:h-11 md:w-48" />
            <Skeleton className="hidden h-10 w-28 rounded-full md:block" />
            <Skeleton className="h-9 w-9 rounded-full md:hidden" />
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface-container-high/50 p-1 md:max-w-2xl lg:max-w-3xl">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={`h-8 rounded-lg md:h-9 ${i === 0 ? "bg-on-surface/15" : "bg-transparent"}`} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <DiscoverCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </AppShellSkeleton>
  );
}
