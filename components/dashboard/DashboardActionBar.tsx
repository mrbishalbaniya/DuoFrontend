"use client";

interface DashboardActionBarProps {
  disabled?: boolean;
  onSkip: () => void;
  onLike: () => void;
  onInfo: () => void;
}

export function DashboardActionBar({
  disabled = false,
  onSkip,
  onLike,
  onInfo,
}: DashboardActionBarProps) {
  return (
    <div className="mx-auto mt-3 flex w-full max-w-md items-center justify-center gap-4 sm:gap-5">
      <button
        type="button"
        aria-label="Skip profile"
        disabled={disabled}
        onClick={onSkip}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-error/30 bg-background text-error shadow-[0_8px_24px] shadow-error/10 transition-all hover:bg-error/10 active:scale-95 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[28px]">close</span>
      </button>

      <button
        type="button"
        aria-label="View profile details"
        disabled={disabled}
        onClick={onInfo}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-background text-primary shadow-[0_4px_16px] shadow-primary/10 transition-all hover:bg-secondary active:scale-95 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[22px]">info</span>
      </button>

      <button
        type="button"
        aria-label="Like profile"
        disabled={disabled}
        onClick={onLike}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-background text-emerald-500 shadow-[0_8px_24px] shadow-emerald-500/10 transition-all hover:bg-emerald-500/10 active:scale-95 disabled:opacity-50"
      >
        <span
          className="material-symbols-outlined text-[28px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          favorite
        </span>
      </button>
    </div>
  );
}
