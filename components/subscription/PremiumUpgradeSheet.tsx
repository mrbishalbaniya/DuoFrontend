"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PricingInteraction, type PricingPlanOption } from "@/components/ui/pricing-interaction";
import type { SubscriptionPlan } from "@/types";
import { useIsClient } from "@/lib/useIsClient";
import { useSheetAnchor } from "@/lib/useSheetAnchor";

interface PremiumUpgradeSheetProps {
  open: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  count: number;
  variant?: "likes" | "visitors" | "rewind" | "unlimited_likes";
  walletBalance?: number;
  topUpPresets?: number[];
  purchasing?: boolean;
  toppingUp?: boolean;
  onPurchase: (planId: string) => void;
  onTopUp: (amount: number) => void;
}

export function PremiumUpgradeSheet({
  open,
  onClose,
  plans,
  count,
  variant = "likes",
  walletBalance = 0,
  topUpPresets = [500, 1000, 2000, 5000],
  purchasing = false,
  toppingUp = false,
  onPurchase,
  onTopUp,
}: PremiumUpgradeSheetProps) {
  const mounted = useIsClient();
  const rootRef = useRef<HTMLDivElement>(null);
  // Same horizontal alignment as the filters sheet: centred over the swipe card.
  useSheetAnchor(open, rootRef);

  // Same widths as the filters sheet (--dfs-width in discovery-filters.css, which
  // follows the swipe card). Set inline so it can't be lost to a stale stylesheet.
  const [viewport, setViewport] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
  useEffect(() => {
    const update = () => setViewport(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const remWidth = viewport >= 1280 ? 30 : viewport >= 1024 ? 36 : viewport >= 768 ? 32 : 28;
  const desktop = viewport >= 768;
  const sheetStyle = {
    width: desktop ? `min(${remWidth}rem, calc(100vw - 48px))` : "100%",
    maxWidth: `${remWidth}rem`,
    maxHeight: "min(720px, 90dvh)",
    translate: desktop ? "var(--dfs-shift, 0px) 0" : undefined,
  } as const;

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
      ref={rootRef}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-end transition-opacity duration-300 md:justify-center md:p-6 ${
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
        className={`relative z-[101] flex flex-col overflow-hidden rounded-t-[20px] border-t border-white/10 bg-background shadow-[0_-12px_48px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out md:rounded-[20px] md:border md:shadow-[0_30px_90px_rgba(0,0,0,0.45)] ${
          open ? "translate-y-0" : "translate-y-full md:translate-y-4"
        }`}
        style={sheetStyle}
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
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-2"
        >
          {pricingPlans.length > 0 ? (
            <div className="mx-auto flex w-full justify-center">
              <PricingInteraction
                key={open ? "premium-open" : "premium-closed"}
                plans={pricingPlans}
                likesCount={variant === "likes" ? count : 0}
                visitorsCount={variant === "visitors" ? count : 0}
                variant={variant}
                walletBalance={walletBalance}
                topUpPresets={topUpPresets}
                purchasing={purchasing}
                toppingUp={toppingUp}
                onPurchase={onPurchase}
                onTopUp={onTopUp}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
