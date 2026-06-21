import BottomNav from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

export function DiscoverMatchesSkeleton() {
  return (
    <>
      <main
        className="mobile-bottom-nav-offset min-h-screen bg-surface pb-28 pt-20"
        aria-busy="true"
        aria-label="Loading matched profiles"
      >
        <div className="mx-auto max-w-2xl px-5 sm:px-6">
          <Skeleton className="mb-2 h-9 w-40" />
          <Skeleton className="mb-8 h-4 w-56" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-background p-4"
              >
                <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full max-w-[200px]" />
                </div>
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
