import { Skeleton } from "@/components/ui/skeleton";

export function DiscoverPageSkeleton() {
  return (
    <main
      className="mobile-bottom-nav-offset flex h-full min-h-0 flex-col overflow-hidden px-4 pb-4 pt-2 md:px-6 md:pb-8 lg:px-8"
      aria-busy="true"
      aria-label="Loading discover profiles"
    >
        <div className="flex shrink-0 items-center justify-between px-1 py-3 md:hidden">
          <Skeleton className="h-11 w-11 rounded-full" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>

        <div className="mx-auto hidden w-full max-w-md shrink-0 justify-end pb-2 pt-1 md:flex md:max-w-lg lg:max-w-xl xl:max-w-[30rem]">
          <Skeleton className="h-8 w-[4.75rem] rounded-full" />
        </div>

        <div className="relative mx-auto mt-1 min-h-0 w-full max-w-md flex-1 md:mt-2 md:max-w-lg lg:max-w-xl xl:max-w-[30rem]">
          <Skeleton className="h-full w-full rounded-2xl md:rounded-[1.25rem]" />
        </div>

        <div className="mx-auto flex w-full max-w-md shrink-0 items-center justify-center gap-8 pb-1 pt-2 md:max-w-lg md:gap-10 md:pb-4 md:pt-4 lg:max-w-xl xl:max-w-[30rem]">
          <Skeleton className="h-14 w-14 rounded-full md:h-16 md:w-16" />
          <Skeleton className="h-11 w-11 rounded-full md:h-12 md:w-12" />
          <Skeleton className="h-14 w-14 rounded-full md:h-16 md:w-16" />
        </div>
    </main>
  );
}
