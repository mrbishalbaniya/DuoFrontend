"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { PricingInteraction, type PricingPlanOption } from "@/components/ui/pricing-interaction";
import type { SubscriptionPlan } from "@/types";
import { useIsClient } from "@/lib/useIsClient";

interface PremiumUpgradeSheetProps {
  open: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  count: number;
  paying: boolean;
  onSubscribe: (planId: string) => void;
}

export function PremiumUpgradeSheet({
  open,
  onClose,
  plans,
  count,
  paying,
  onSubscribe,
}: PremiumUpgradeSheetProps) {
  const mounted = useIsClient();

  const pricingPlans = useMemo<PricingPlanOption[]>(
    () =>
      plans.map((plan) => ({
        planId: plan.plan_id,
        name: plan.name,
        durationDays: plan.duration_days,
        price: plan.amount,
        badge: plan.badge,
      })),
    [plans]
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close premium offer"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-upgrade-title"
        className={`relative z-[101] mx-auto flex max-h-[min(92dvh,820px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border-t border-white/10 bg-background shadow-[0_-12px_48px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center bg-background pb-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="h-1.5 w-12 rounded-full bg-white/20 transition-colors hover:bg-white/30"
            aria-label="Close premium offer"
          />
        </div>

        <div
          id="premium-upgrade-title"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2"
        >
          {pricingPlans.length > 0 ? (
            <div className="mx-auto flex w-full justify-center">
              <PricingInteraction
                key={open ? "premium-open" : "premium-closed"}
                plans={pricingPlans}
                likesCount={count}
                paying={paying}
                onSubscribe={onSubscribe}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
