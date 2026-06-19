"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  loading?: boolean;
  disableNext?: boolean;
  showBack?: boolean;
}

export function StepNavigation({
  onBack,
  onNext,
  nextLabel = "Continue",
  backLabel = "Back",
  loading = false,
  disableNext = false,
  showBack = true,
}: StepNavigationProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:gap-4">
      {showBack && onBack ? (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className={cn(
            "h-14 flex-1 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          )}
          onClick={onBack}
          disabled={loading}
        >
          {backLabel}
        </Button>
      ) : null}
      <Button
        type="button"
        size="lg"
        className="h-14 flex-[2] rounded-full gradient-brand text-white shadow-lg shadow-primary/20 hover:opacity-95"
        onClick={onNext}
        disabled={loading || disableNext}
      >
        {loading ? "Please wait..." : nextLabel}
      </Button>
    </div>
  );
}

interface StepCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function StepCard({ title, subtitle, children }: StepCardProps) {
  return (
    <section className="glass-card rounded-[2rem] border border-primary/10 p-6 shadow-[0_20px_50px] shadow-primary/10 sm:p-8">
      <div className="mb-6 space-y-2">
        <h2 className="font-[var(--font-headline)] text-2xl font-extrabold text-on-surface">
          {title}
        </h2>
        {subtitle ? <p className="text-sm leading-relaxed text-on-surface-variant">{subtitle}</p> : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="ml-1 text-sm text-error">{message}</p>;
}
