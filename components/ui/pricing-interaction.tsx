"use client";

import NumberFlow from "@number-flow/react";
import React from "react";
import { EsewaLogo } from "@/components/payment/EsewaLogo";
import { formatCoins, formatNprPrice } from "@/lib/coins";

export type PricingPlanOption = {
  planId: string;
  name: string;
  durationDays: number;
  price: number;
  badge?: string | null;
};

type PricingInteractionProps = {
  plans: PricingPlanOption[];
  likesCount?: number;
  visitorsCount?: number;
  variant?: "likes" | "visitors";
  walletBalance?: number;
  topUpPresets?: number[];
  purchasing?: boolean;
  toppingUp?: boolean;
  onPurchase: (planId: string) => void;
  onTopUp: (amount: number) => void;
};

export function PricingInteraction({
  plans,
  likesCount = 0,
  visitorsCount = 0,
  variant = "likes",
  walletBalance = 0,
  topUpPresets = [500, 1000, 2000, 5000],
  purchasing = false,
  toppingUp = false,
  onPurchase,
  onTopUp,
}: PricingInteractionProps) {
  const popularIndex = plans.findIndex((plan) => plan.badge === "Popular");
  const defaultIndex = popularIndex >= 0 ? popularIndex : 0;
  const [active, setActive] = React.useState(defaultIndex);

  React.useEffect(() => {
    setActive(defaultIndex);
  }, [defaultIndex, plans.length]);

  const selected = plans[active] ?? plans[0];
  if (!selected) return null;

  const isVisitors = variant === "visitors";
  const headline = isVisitors ? "See who viewed you" : "See who liked you";
  const count = isVisitors ? visitorsCount : likesCount;
  const subtitle =
    count > 0
      ? isVisitors
        ? `${count} ${count === 1 ? "person has" : "people have"} viewed your profile. Unlock blurred profiles and connect.`
        : `${count} ${count === 1 ? "person has" : "people have"} liked you. Unlock blurred profiles and match instantly.`
      : isVisitors
        ? "Upgrade to see who has been checking out your profile."
        : "Upgrade to unlock blurred profiles when someone likes you.";

  const shortfall = Math.max(0, selected.price - walletBalance);
  const canAfford = shortfall === 0;
  const busy = purchasing || toppingUp;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="w-full text-left">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
          <span className="material-symbols-outlined text-sm">toll</span>
          Duo Coins
        </div>
        <h2 className="font-[var(--font-headline)] text-xl font-bold text-on-surface">
          {headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {subtitle}
        </p>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-surface-variant/30 px-4 py-3">
          <span className="text-sm text-on-surface-variant">Your coins</span>
          <span className="flex items-center gap-1.5 text-lg font-bold tabular-nums text-on-surface">
            <span className="material-symbols-outlined text-base text-primary">toll</span>
            <NumberFlow value={walletBalance} />
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm text-on-surface-variant">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">check_circle</span>
            {isVisitors ? "Reveal names and photos on Visited you" : "Reveal names and photos on Liked you"}
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">check_circle</span>
            {isVisitors ? "See who liked you too" : "See who viewed your profile"}
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">check_circle</span>
            <span>
              {selected.durationDays}-day access ·{" "}
              <NumberFlow value={selected.price} className="inline font-medium text-on-surface" /> coins
            </span>
          </li>
        </ul>
      </div>

      <div className="w-full rounded-[28px] border border-white/10 bg-surface-variant/30 p-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="flex w-full flex-col gap-3">
          {plans.map((plan, index) => {
            const isActive = active === index;

            return (
              <button
                key={plan.planId}
                type="button"
                onClick={() => setActive(index)}
                className={`flex min-h-[88px] w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-colors duration-200 ${
                  isActive
                    ? "border-primary bg-primary/[0.08]"
                    : "border-white/10 bg-background/40 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-on-surface md:text-lg">{plan.name}</p>
                    {plan.badge ? (
                      <span className="shrink-0 rounded-lg bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary md:text-[11px]">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    <span className="font-medium tabular-nums text-on-surface">
                      {plan.price.toLocaleString("en-NP")} coins
                    </span>
                    <span className="text-on-surface-variant/80"> / {plan.durationDays} days</span>
                  </p>
                </div>

                <div
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 p-1 transition-colors duration-300 ${
                    isActive ? "border-primary" : "border-white/25"
                  }`}
                >
                  <div
                    className={`size-3 rounded-full bg-primary transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={busy || !canAfford}
          onClick={() => onPurchase(selected.planId)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary p-3 text-base font-bold text-on-primary shadow-[0_8px_24px_rgba(var(--primary-rgb,96,187,70),0.25)] transition active:scale-95 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-xl">shopping_bag</span>
          {purchasing
            ? "Purchasing…"
            : canAfford
              ? `Buy pass · ${formatCoins(selected.price)}`
              : `Need ${shortfall.toLocaleString("en-NP")} more coins`}
        </button>

        {!canAfford ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-3 text-center text-sm text-on-surface-variant">
              Buy coins with eSewa to unlock this pass.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {topUpPresets.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  disabled={busy}
                  onClick={() => onTopUp(amount)}
                  className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-background/50 px-3 py-2.5 text-sm font-semibold text-on-surface transition hover:border-[#60bb46]/40 hover:bg-[#60bb46]/10 disabled:opacity-60"
                >
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">toll</span>
                    {amount.toLocaleString("en-NP")}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-normal text-on-surface-variant">
                    <EsewaLogo className="size-3" />
                    {formatNprPrice(amount)}
                  </span>
                </button>
              ))}
            </div>
            {toppingUp ? (
              <p className="mt-2 text-center text-xs text-on-surface-variant">Redirecting to eSewa…</p>
            ) : (
              <p className="mt-2 text-center text-[11px] text-on-surface-variant/70">
                1 NPR via eSewa = 1 Duo Coin
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-center text-[11px] text-on-surface-variant/70">
            Purchases are deducted from your coin balance
          </p>
        )}
      </div>
    </div>
  );
}
