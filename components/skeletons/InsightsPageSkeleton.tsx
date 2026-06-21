import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export function InsightsPageSkeleton() {
  return (
    <>
      <Navbar />
      <main
        className="mx-auto max-w-4xl px-6 pb-32 pt-24"
        aria-busy="true"
        aria-label="Loading insights"
      >
        <div className="mb-8 flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-32 shrink-0 rounded-full" />
          ))}
        </div>

        <section className="mb-12 rounded-[2rem] border border-primary/10 bg-background p-8 md:p-10">
          <Skeleton className="mb-3 h-4 w-40" />
          <div className="flex flex-col items-center gap-12 md:flex-row">
            <Skeleton className="h-64 w-64 shrink-0 rounded-full" />
            <div className="w-full flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full border-4 border-background" />
                  <Skeleton className="h-16 w-16 rounded-full border-4 border-background" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-44" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="rounded-[2rem] border border-primary/10 bg-background p-8 md:col-span-7">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="mb-8 h-6 w-48" />
            <div className="space-y-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <div className="mb-2 flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 md:col-span-5">
            <Skeleton className="h-56 rounded-[2rem]" />
            <Skeleton className="h-40 rounded-[2rem]" />
          </div>

          <Skeleton className="h-48 rounded-[2rem] md:col-span-12" />
        </div>

        <Skeleton className="mt-12 h-28 rounded-[2rem]" />
      </main>
      <BottomNav />
    </>
  );
}
