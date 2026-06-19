"use client";

interface DashboardTopBarProps {
  onOpenMenu: () => void;
  onOpenFilters: () => void;
  disabled?: boolean;
  profilesLeft?: number;
}

export function DashboardTopBar({
  onOpenMenu,
  onOpenFilters,
  disabled = false,
  profilesLeft,
}: DashboardTopBarProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Open menu"
          disabled={disabled}
          onClick={onOpenMenu}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-[0_4px_16px] shadow-primary/10 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="font-[var(--font-headline)] text-lg font-black text-gradient-brand">Duo</p>
          <p className="text-xs font-medium text-on-surface-variant">
            Discover
            {typeof profilesLeft === "number" ? ` · ${profilesLeft} left` : ""}
          </p>
        </div>

        <button
          type="button"
          aria-label="Open discovery filters"
          disabled={disabled}
          onClick={onOpenFilters}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-[0_4px_16px] shadow-primary/10 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[24px]">tune</span>
        </button>
      </div>
    </div>
  );
}
