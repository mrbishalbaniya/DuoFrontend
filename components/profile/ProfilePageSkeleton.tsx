import { Skeleton } from "@/components/ui/skeleton";

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-6">
      <Skeleton className="h-28 w-28 shrink-0 rounded-full border-4 border-background sm:h-32 sm:w-32 md:h-40 md:w-40" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3 pb-1 md:pb-3">
        <Skeleton className="h-9 w-56 max-w-full sm:h-10 md:h-11" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="mb-2 hidden h-12 w-36 shrink-0 rounded-full md:block" />
    </div>
  );
}

function ProfileSectionSkeleton({ fieldCount = 4 }: { fieldCount?: number }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_4px_20px] shadow-primary/6 sm:rounded-[2rem] sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={index} className="rounded-xl bg-secondary/40 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-4 w-full max-w-[180px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSidebarSkeleton() {
  return (
    <>
      <div className="rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_8px_30px] shadow-primary/8 sm:rounded-[2rem] sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="mb-6 h-2.5 w-full rounded-full" />
        <div className="space-y-3.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-xl md:hidden" />
    </>
  );
}

export function ProfileSectionsSkeleton() {
  return (
    <>
      <div className="rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_4px_20px] shadow-primary/6 sm:rounded-[2rem] sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      </div>
      <ProfileSectionSkeleton fieldCount={4} />
      <ProfileSectionSkeleton fieldCount={6} />
      <ProfileSectionSkeleton fieldCount={4} />
      <ProfileSectionSkeleton fieldCount={2} />
    </>
  );
}
