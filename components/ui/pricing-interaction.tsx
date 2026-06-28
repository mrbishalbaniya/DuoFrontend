"use client";

import NumberFlow from "@number-flow/react";
import React from "react";
import { EsewaLogo } from "@/components/payment/EsewaLogo";

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
  paying?: boolean;
  onSubscribe: (planId: string) => void;
};

export function PricingInteraction({
  plans,
  likesCount = 0,
  paying = false,
  onSubscribe,
}: PricingInteractionProps) {
  const popularIndex = plans.findIndex((plan) => plan.badge === "Popular");
  const defaultIndex = popularIndex >= 0 ? popularIndex : 0;
  const [active, setActive] = React.useState(defaultIndex);

  React.useEffect(() => {
    setActive(defaultIndex);
  }, [defaultIndex, plans.length]);

  const selected = plans[active] ?? plans[0];
  if (!selected) return null;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="w-full text-left">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
          <span className="material-symbols-outlined text-sm">workspace_premium</span>
          Duo Premium
        </div>
        <h2 className="font-[var(--font-headline)] text-xl font-bold text-on-surface">
          See who liked you
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {likesCount > 0
            ? `${likesCount} ${likesCount === 1 ? "person has" : "people have"} liked you. Unlock blurred profiles and match instantly.`
            : "Upgrade to unlock blurred profiles when someone likes you."}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-on-surface-variant">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">check_circle</span>
            Reveal names and photos on Liked you
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">check_circle</span>
            <span>
              {selected.durationDays}-day access · NPR{" "}
              <NumberFlow value={selected.price} className="inline font-medium text-on-surface" />
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
                      NPR {plan.price.toLocaleString("en-NP")}
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
          disabled={paying}
          onClick={() => onSubscribe(selected.planId)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#60bb46] p-3 text-base font-bold text-white shadow-[0_8px_24px_rgba(96,187,70,0.25)] transition active:scale-95 disabled:opacity-60"
        >
          <EsewaLogo />
          {paying ? "Redirecting…" : "Pay with eSewa"}
        </button>
        <p className="mt-2 text-center text-[11px] text-on-surface-variant/70">
          Secure payment in NPR via eSewa ePay
        </p>
      </div>
    </div>
  );
}
