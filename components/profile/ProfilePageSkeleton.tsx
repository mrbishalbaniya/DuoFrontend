import { Skeleton } from "@/components/ui/skeleton";
import { AppShellSkeleton } from "@/components/skeletons/AppShellSkeleton";

/**
 * Loading skeletons for /profile. They mirror the real layout: header (photo,
 * name, location), sidebar (completeness by section, verify + link cards) and
 * the sections in page order, each with its own Edit button.
 */

const cardClass =
  "rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_4px_20px] shadow-primary/6 sm:rounded-[2rem] sm:p-8";

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-6" aria-hidden>
      <Skeleton className="h-28 w-28 shrink-0 rounded-full border-4 border-background sm:h-32 sm:w-32 md:h-40 md:w-40" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3 pb-1 md:pb-3">
        <Skeleton className="h-8 w-56 max-w-full sm:h-9 md:h-10" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
    </div>
  );
}

/** Section card header: icon tile, title and the Edit pill. */
function SectionHeaderSkeleton({ titleWidth = "w-36" }: { titleWidth?: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
      <Skeleton className={`h-6 ${titleWidth}`} />
      <div className="flex-1" />
      <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
    </div>
  );
}

function FieldsSectionSkeleton({ fieldCount, titleWidth }: { fieldCount: number; titleWidth?: string }) {
  return (
    <div className={cardClass}>
      <SectionHeaderSkeleton titleWidth={titleWidth} />
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

/** Link card like "Verify your profile" / "Discovery preferences". */
function LinkCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-background p-5">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-52 max-w-full" />
      </div>
      <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
    </div>
  );
}

export function ProfileSidebarSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {/* Profile completeness: title + %, bar, one row per section */}
      <div className="rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_8px_30px] shadow-primary/8 sm:rounded-[2rem] sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="mb-6 h-2.5 w-full rounded-full" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44 max-w-full" />
              </div>
              <Skeleton className="h-3.5 w-7 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Verify, Discovery preferences, Account information */}
      <LinkCardSkeleton />
      <LinkCardSkeleton />
      <LinkCardSkeleton />
    </div>
  );
}

export function ProfileSectionsSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8" aria-hidden>
      {/* Photos */}
      <div className={cardClass}>
        <SectionHeaderSkeleton titleWidth="w-24" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Personal, Religion & Background, Education & Career */}
      <FieldsSectionSkeleton fieldCount={6} titleWidth="w-28" />
      <FieldsSectionSkeleton fieldCount={6} titleWidth="w-52" />
      <FieldsSectionSkeleton fieldCount={6} titleWidth="w-48" />

      {/* Lifestyle & Interests: chips */}
      <div className={cardClass}>
        <SectionHeaderSkeleton titleWidth="w-52" />
        <div className="flex flex-wrap gap-2">
          {["w-20", "w-24", "w-16", "w-28", "w-20", "w-24", "w-16", "w-20"].map((width, index) => (
            <Skeleton key={index} className={`h-7 ${width} rounded-full`} />
          ))}
        </div>
      </div>

      {/* About Me */}
      <FieldsSectionSkeleton fieldCount={3} titleWidth="w-28" />
    </div>
  );
}

/** Whole /profile page while the route itself loads (mirrors app/profile/page.tsx). */
export function ProfilePageSkeleton() {
  return (
    <AppShellSkeleton label="Loading profile">
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="relative h-20 bg-gradient-to-br from-primary/30 via-secondary/50 to-accent/25 sm:h-24 md:h-28" />
        <div className="relative z-10 mx-auto -mt-10 max-w-7xl px-5 sm:-mt-12 sm:px-6 md:-mt-16">
          <ProfileHeaderSkeleton />
        </div>
        <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-6 px-5 sm:px-6 md:mt-8 md:gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <ProfileSidebarSkeleton />
          </div>
          <div className="space-y-8 md:space-y-12 lg:col-span-8">
            <ProfileSectionsSkeleton />
          </div>
        </div>
      </div>
    </AppShellSkeleton>
  );
}
