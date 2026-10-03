import { Skeleton } from "@/components/ui/skeleton";

/** Same widths as the real card (DiscoverExperience MATCH_CARD_WIDTH). */
const CARD_WIDTH = "w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-[30rem]";

/**
 * /match content, mirroring DiscoverExperience + DashboardActionBar:
 * filter button (top right, desktop), one swipe card with photo progress bars,
 * "1/3" counter, name + distance and the expand chevron, then the pass /
 * rewind / like buttons as outlined circles in their real colours.
 */
export function DiscoverPageSkeleton() {
  return (
    <main
      className="mobile-bottom-nav-offset flex h-full min-h-0 flex-col overflow-hidden px-4 pt-2 md:px-6 md:pb-8 lg:px-8"
      role="status"
      aria-busy="true"
      aria-label="Loading profiles"
    >
      {/* mobile header */}
      <div className="flex shrink-0 items-center justify-between pb-2 md:hidden">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* filter button (desktop) */}
      <div className={`mx-auto hidden shrink-0 justify-end pb-2 pt-1 md:flex ${CARD_WIDTH}`}>
        <div className="h-11 w-11 rounded-full border border-primary/20 bg-background p-2.5">
          <Skeleton className="h-full w-full rounded-full bg-primary/20" />
        </div>
      </div>

      {/* card */}
      <div className={`relative mx-auto mt-1 min-h-0 flex-1 md:mt-2 ${CARD_WIDTH}`}>
        <div className="skeleton-shimmer absolute inset-0 overflow-hidden rounded-3xl border border-outline-variant/20 bg-surface-container-high">
          {/* soft "photo" glow */}
          <div className="absolute left-1/2 top-[38%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-surface/[0.06] blur-2xl" />
          <div className="absolute left-1/2 top-[34%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-on-surface/[0.07]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 via-black/15 to-transparent" />

          {/* progress bars + counter */}
          <div className="absolute inset-x-4 top-3 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i === 0 ? "bg-on-surface/35" : "bg-on-surface/12"}`} />
            ))}
          </div>
          <span className="absolute right-4 top-7 h-6 w-11 rounded-full bg-black/25" />

          {/* name, distance, chevron */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 md:p-8">
            <div className="flex-1 space-y-3">
              <span className="block h-8 w-3/5 max-w-[16rem] rounded-lg bg-white/25 md:h-9" />
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-white/20" />
                <span className="h-4 w-24 rounded-md bg-white/20" />
              </span>
            </div>
            <span className="h-10 w-10 shrink-0 rounded-full border border-white/25 bg-white/10" />
          </div>
        </div>
      </div>

      {/* action bar */}
      <div className="mx-auto mt-3 flex w-full max-w-md shrink-0 items-center justify-center gap-4 sm:gap-5 md:mt-4 md:max-w-lg md:gap-6 lg:max-w-xl xl:max-w-[30rem]">
        <ActionCircle size="lg" ring="border-error/30" dot="bg-error/35" />
        <ActionCircle size="sm" ring="border-amber-400/40" dot="bg-amber-400/35" thin />
        <ActionCircle size="lg" ring="border-emerald-400/40" dot="bg-emerald-500/35" />
      </div>
    </main>
  );
}

function ActionCircle({ size, ring, dot, thin = false }: { size: "lg" | "sm"; ring: string; dot: string; thin?: boolean }) {
  const dims = size === "lg" ? "h-14 w-14 md:h-16 md:w-16" : "h-11 w-11 md:h-12 md:w-12";
  const inner = size === "lg" ? "h-6 w-6 md:h-7 md:w-7" : "h-5 w-5";
  return (
    <div className={`flex items-center justify-center rounded-full bg-background ${thin ? "border" : "border-2"} ${ring} ${dims}`}>
      <span className={`skeleton-shimmer rounded-full ${dot} ${inner}`} />
    </div>
  );
}
