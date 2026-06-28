import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import { Skeleton } from "@/components/ui/skeleton";

export function DiscoverMatchesSkeleton() {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <ChatSidebarNav />
      <main
        className="ios-page flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-4 md:pb-10"
        aria-busy="true"
        aria-label="Loading discover"
      >
        <header className="ios-sticky-header top-0 md:top-0">          <div className="mx-auto w-full max-w-lg px-4 md:max-w-7xl md:px-6 lg:px-8">
            <div className="md:hidden">
              <div className="ios-nav-bar">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-11 w-11 rounded-full" />
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:justify-between md:pb-4 md:pt-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
            <Skeleton className="mb-3 mt-1 h-9 w-36 md:hidden" />
            <Skeleton className="mb-3 h-9 w-full rounded-[9px] md:max-w-2xl lg:max-w-3xl" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-lg flex-1 px-4 pt-2 pb-4 md:max-w-7xl md:px-6 md:pt-4 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col overflow-hidden rounded-[1.25rem] bg-surface-container-high ring-1 ring-outline-variant/20 md:rounded-2xl"
              >
                <Skeleton className="aspect-[3/4] w-full rounded-none" />
                <div className="p-2.5 md:p-3">
                  <Skeleton className="h-9 w-full rounded-full md:h-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}