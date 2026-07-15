"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PRODUCT_ONBOARDING_SLIDES } from "@/lib/onboarding/content";

type OnboardingExperienceProps = {
  onComplete: () => void;
};

export function OnboardingExperience({ onComplete }: OnboardingExperienceProps) {
  const [index, setIndex] = useState(0);
  const slides = PRODUCT_ONBOARDING_SLIDES;
  const slide = slides[index];
  const isLast = index >= slides.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((prev) => Math.min(prev + 1, slides.length - 1));
  }, [isLast, onComplete, slides.length]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 80%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 50%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 pb-2 pt-8 sm:px-10">
        <span className="font-[var(--font-headline)] text-2xl font-black tracking-tight text-gradient-brand">
          Duo
        </span>
        {!isLast ? (
          <button
            type="button"
            onClick={skip}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Skip
          </button>
        ) : (
          <span className="w-12" aria-hidden />
        )}
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8 sm:px-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card rounded-[2rem] border border-white/5 p-8 shadow-[0_40px_60px_-15px] shadow-primary/10"
            >
              <div
                className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border ${slide.accentBgClass}`}
              >
                <span
                  className={`material-symbols-outlined text-[2rem] ${slide.accentClass}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {slide.icon}
                </span>
              </div>

              <p
                className={`mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] ${slide.accentClass}`}
              >
                {slide.title}
              </p>
              <h1 className="font-[var(--font-headline)] text-3xl font-bold leading-tight text-on-surface">
                {slide.headline}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{slide.body}</p>

              {slide.statLabel && slide.statValue ? (
                <div className="mt-8 flex items-end justify-between border-t border-white/5 pt-5">
                  <span className="text-xs font-medium text-on-surface-variant">
                    {slide.statLabel}
                  </span>
                  <span className="font-[var(--font-headline)] text-lg font-bold text-on-surface">
                    {slide.statValue}
                  </span>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Onboarding steps">
            {slides.map((item, i) => {
              const active = i === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    active ? "w-7 gradient-brand" : "w-2 bg-outline/40"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-10 sm:px-10">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          <button
            type="button"
            onClick={goNext}
            className="gradient-brand w-full rounded-full py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform active:scale-[0.98]"
          >
            {isLast ? "Start matching" : "Continue"}
          </button>
          {isLast ? (
            <p className="text-center text-xs text-on-surface-variant">
              Your profile is ready — discover people who fit.
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
