import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
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
      className="flex h-dvh flex-col overflow-hidden bg-[#1c1c1e]"
      aria-busy="true"
      aria-label="Loading map"
    >
      <div className="hidden md:block">
        <Navbar />
      </div>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden md:pt-16">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="hidden w-[min(100%,360px)] shrink-0 flex-col border-r border-white/10 bg-[#1c1c1e] md:flex">
            <div className="border-b border-white/10 p-4">
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <MapFriendsListSkeleton />
          </aside>

          <div className="relative min-h-0 min-w-0 flex-1 bg-[#0f0f10]">
            <div className="absolute inset-x-0 top-0 z-[25] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
            <div className="flex h-full items-center justify-center p-6">
              <Skeleton className="h-full w-full max-w-none rounded-none md:rounded-none" />
            </div>
            <div className="absolute inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] px-3 md:hidden">
              <Skeleton className="mx-auto h-24 w-full max-w-md rounded-2xl" />
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
