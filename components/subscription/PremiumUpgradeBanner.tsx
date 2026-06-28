"use client";

import { formatNpr } from "@/lib/esewa";
import { EsewaLogo } from "@/components/payment/EsewaLogo";
import type { SubscriptionPlan } from "@/types";
interface PremiumUpgradeBannerProps {
  plan: SubscriptionPlan | null;
  count: number;
  paying: boolean;
  onSubscribe: () => void;
}

export function PremiumUpgradeBanner({
  plan,
  count,
  paying,
  onSubscribe,
}: PremiumUpgradeBannerProps) {
  const priceLabel = plan ? formatNpr(plan.amount) : "Rs. 499";

  return (
    <div className="col-span-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-surface-variant/80 to-background p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            <span className="material-symbols-outlined text-sm">workspace_premium</span>
            Duo Premium
          </div>
          <h2 className="font-[var(--font-headline)] text-xl font-bold text-on-surface md:text-2xl">
            See who liked you
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
            {count > 0
              ? `${count} ${count === 1 ? "person has" : "people have"} liked you. Unlock blurred profiles and match instantly.`
              : "Upgrade to unlock blurred profiles when someone likes you."}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">check_circle</span>
              Reveal names and photos on Liked you
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-primary">check_circle</span>
              {plan ? `${plan.duration_days}-day access` : "30-day access"} · {priceLabel}
            </li>
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:min-w-[220px]">
          <p className="text-center text-2xl font-bold tabular-nums text-on-surface md:text-right">
            {priceLabel}
            <span className="ml-1 text-sm font-medium text-on-surface-variant">/ month</span>
          </p>
          <button
            type="button"
            onClick={onSubscribe}
            disabled={paying}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#60bb46] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(96,187,70,0.25)] transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
          >
            <EsewaLogo />
            {paying ? "Redirecting…" : "Pay with eSewa"}
          </button>
          <p className="text-center text-[11px] text-on-surface-variant/70 md:text-right">
            Secure payment in NPR via eSewa ePay
          </p>
        </div>
      </div>
    </div>
  );
}
