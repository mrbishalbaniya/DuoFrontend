"use client";

interface DashboardTopBarProps {
  onOpenMenu: () => void;
  onOpenFilters: () => void;
  disabled?: boolean;
  /** Number of active discovery filters, shown as a badge on the filters button. */
  activeFilterCount?: number;
}

export function DashboardTopBar({
  onOpenMenu,
  onOpenFilters,
  disabled = false,
  activeFilterCount = 0,
}: DashboardTopBarProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Open menu"
          data-tour="menu"
          disabled={disabled}
          onClick={onOpenMenu}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-[0_4px_16px] shadow-primary/10 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="font-[var(--font-headline)] text-lg font-black text-gradient-brand">Duo</p>
        </div>

        <button
          type="button"
          data-tour="filters"
          aria-label={
            activeFilterCount > 0
              ? `Open discovery filters, ${activeFilterCount} active`
              : "Open discovery filters"
          }
          disabled={disabled}
          onClick={onOpenFilters}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-[0_4px_16px] shadow-primary/10 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[24px]">tune</span>
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white gradient-brand">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
