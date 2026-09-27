"use client";

interface DashboardActionBarProps {
  disabled?: boolean;
  onSkip: () => void;
  onLike: () => void;
  /** Undo the last swipe (premium). Hidden when not provided. */
  onRewind?: () => void;
  /** Nothing swiped yet this session. */
  rewindDisabled?: boolean;
  /** Show a lock badge: the viewer has no Rewind pass. */
  rewindLocked?: boolean;
  rewinding?: boolean;
}

/**
 * Skip · Rewind · Like. Profile details open from the arrow on the card
 * itself, so there is no separate info button here.
 */
export function DashboardActionBar({
  disabled = false,
  onSkip,
  onLike,
  onRewind,
  rewindDisabled = false,
  rewindLocked = false,
  rewinding = false,
}: DashboardActionBarProps) {
  return (
    <div className="mx-auto mt-3 flex w-full max-w-md items-center justify-center gap-4 sm:gap-5 md:mt-4 md:max-w-lg md:gap-6 lg:max-w-xl xl:max-w-[30rem]">
      <button
        type="button"
        aria-label="Skip profile"
        disabled={disabled}
        onClick={onSkip}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-error/30 bg-background text-error shadow-[0_8px_24px] shadow-error/10 outline-none transition-all hover:bg-error/10 focus-visible:border-error active:scale-95 disabled:opacity-50 md:h-16 md:w-16"
      >
        <span className="material-symbols-outlined text-[28px] md:text-[32px]">close</span>
      </button>

      {onRewind ? (
        <button
          type="button"
          aria-label={rewindLocked ? "Rewind last swipe (premium)" : "Rewind last swipe"}
          title={rewindLocked ? "Rewind · Premium" : "Rewind"}
          disabled={disabled || rewindDisabled || rewinding}
          onClick={onRewind}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/40 bg-background text-amber-400 outline-none transition-all hover:bg-amber-400/10 focus-visible:border-amber-400 active:scale-95 disabled:opacity-40 md:h-12 md:w-12"
        >
          <span
            className={`material-symbols-outlined text-[22px] md:text-[24px] ${rewinding ? "animate-spin" : ""}`}
          >
            {rewinding ? "progress_activity" : "replay"}
          </span>
          {rewindLocked ? (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-black shadow">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                lock
              </span>
            </span>
          ) : null}
        </button>
      ) : null}

      <button
        type="button"
        aria-label="Like profile"
        disabled={disabled}
        onClick={onLike}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-background text-emerald-500 shadow-[0_8px_24px] shadow-emerald-500/10 outline-none transition-all hover:bg-emerald-500/10 focus-visible:border-emerald-400 active:scale-95 disabled:opacity-50 md:h-16 md:w-16"
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
