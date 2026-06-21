import { Skeleton } from "@/components/ui/skeleton";
export function DiscoverPageSkeleton() {
  return (
    <main
      className="flex h-full min-h-0 flex-col overflow-hidden px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-2 md:pb-4"
      aria-busy="true"
      aria-label="Loading discover profiles"
    >
        <div className="flex shrink-0 items-center justify-between px-1 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <div className="relative mx-auto mt-2 min-h-0 w-full max-w-md flex-1">
          <Skeleton className="h-full w-full rounded-2xl" />
        </div>

        <div className="mx-auto flex w-full max-w-md shrink-0 items-center justify-center gap-8 pb-1 pt-2">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
    </main>
  );
}
