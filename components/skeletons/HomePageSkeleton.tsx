import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <>
      <Navbar />
      <main
        className="mobile-bottom-nav-offset overflow-x-hidden"
        aria-busy="true"
        aria-label="Loading home page"
      >
        <section className="relative overflow-hidden pt-14 sm:pt-16">
          <div className="relative z-10 px-4 pb-8 pt-8 sm:px-8 md:px-12 md:pb-10 md:pt-16">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-16 w-full max-w-2xl sm:h-24" />
              <Skeleton className="h-16 w-full max-w-xl sm:h-24" />
              <Skeleton className="h-16 w-full max-w-lg sm:h-24" />
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.04] px-4 py-14 sm:px-6 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 space-y-3 text-center">
              <Skeleton className="mx-auto h-4 w-32" />
              <Skeleton className="mx-auto h-10 w-72 max-w-full" />
              <Skeleton className="mx-auto h-4 w-96 max-w-full" />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-8">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-primary/10 bg-background p-8 sm:rounded-[2rem]"
                >
                  <Skeleton className="mb-8 h-16 w-16 rounded-2xl" />
                  <Skeleton className="mb-4 h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-5/6" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-24">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 md:flex-row">
            <div className="w-full flex-1 space-y-8">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-5 w-full max-w-sm" />
              <div className="grid max-w-sm grid-cols-2 gap-4">
                <Skeleton className="h-24 rounded-[1.25rem]" />
                <Skeleton className="h-24 rounded-[1.25rem]" />
              </div>
            </div>
            <Skeleton className="aspect-[4/3] w-full max-w-lg flex-1 rounded-[2rem] sm:aspect-video" />
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 md:py-24">
          <Skeleton className="mx-auto h-64 w-full max-w-5xl rounded-3xl" />
        </section>
      </main>
      <BottomNav />
    </>
  );
}
