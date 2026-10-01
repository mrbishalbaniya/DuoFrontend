import { Skeleton } from "@/components/ui/skeleton";
import { AppShellSkeleton } from "./AppShellSkeleton";

function SettingsRowSkeleton({ last = false }: { last?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-4 md:px-5 ${last ? "" : "border-b border-outline-variant/20"}`}>
      <Skeleton className="h-10 w-10 shrink-0 rounded-full md:h-11 md:w-11" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-52 max-w-full" />
      </div>
      <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
    </div>
  );
}

function SettingsSectionSkeleton({ rows }: { rows: number }) {
  return (
    <section className="space-y-3">
      <Skeleton className="ml-1 h-3 w-24" />
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
        {Array.from({ length: rows }).map((_, i) => (
          <SettingsRowSkeleton key={i} last={i === rows - 1} />
        ))}
      </div>
    </section>
  );
}

/** /settings: two columns of grouped rows (wallet, verification, account, ...). */
export function SettingsPageSkeleton() {
  return (
    <AppShellSkeleton label="Loading settings">
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10">
          <div className="space-y-6">
            <SettingsSectionSkeleton rows={1} />
            <SettingsSectionSkeleton rows={1} />
            <SettingsSectionSkeleton rows={3} />
          </div>
          <div className="space-y-6">
            <SettingsSectionSkeleton rows={3} />
            <SettingsSectionSkeleton rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </AppShellSkeleton>
  );
}
