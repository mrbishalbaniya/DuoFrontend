import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPage, SectionTitle } from "@/components/marketing/MarketingPage";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Duo is free to use. See coin packs and optional premium passes, paid securely with eSewa.",
};

// Refresh live plan prices every 5 minutes.
export const revalidate = 300;

type Plan = {
  plan_id: string;
  name: string;
  description?: string;
  duration_days: number;
  amount: number;
  badge?: string | null;
  currency?: string;
};

const FEATURES = [
  { key: "who_liked_you", title: "Who liked you", icon: "favorite", body: "See everyone who already liked you." },
  { key: "visited_you", title: "Who visited you", icon: "visibility", body: "See who checked out your profile." },
  { key: "unlimited_likes", title: "Unlimited likes", icon: "all_inclusive", body: "Like as many people as you want." },
  { key: "rewind", title: "Rewind", icon: "undo", body: "Undo a swipe you didn't mean." },
] as const;

const COIN_PACKS = [100, 250, 500, 1000, 2000, 5000];

async function loadPlans(feature: string): Promise<Plan[]> {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/subscriptions/plan/?feature=${feature}`, { next: { revalidate } });
    if (!res.ok) return [];
    const data = (await res.json()) as Plan[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function formatNpr(amount: number) {
  return `NPR ${Math.round(amount).toLocaleString("en-NP")}`;
}

export default async function PricingPage() {
  const plansByFeature = await Promise.all(FEATURES.map((f) => loadPlans(f.key)));

  return (
    <MarketingPage
      eyebrow="Pricing"
      title="Free to start. Pay only for extras."
      intro="Creating a profile, matching and chatting are always free. Premium passes are optional and paid securely with eSewa or wallet coins."
    >
      <section className="mx-auto max-w-3xl rounded-3xl border border-primary/15 bg-secondary/30 p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">Free</h2>
          <span className="font-[var(--font-headline)] text-2xl font-extrabold text-on-surface">NPR 0</span>
        </div>
        <ul className="mt-5 grid gap-2.5 text-sm text-on-surface-variant sm:grid-cols-2">
          {[
            "Profile with up to 3 photos",
            "Selfie verification badge",
            "Daily likes and matches",
            "Unlimited chat with matches",
            "Match preferences and filters",
            "Block and report",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="material-symbols-outlined text-lg text-primary">check_circle</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16">
        <SectionTitle>Premium passes</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature, index) => {
            const plans = plansByFeature[index];
            return (
              <section key={feature.key} className="rounded-2xl border border-primary/10 bg-secondary/30 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <span className="material-symbols-outlined">{feature.icon}</span>
                  </span>
                  <div>
                    <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{feature.title}</h3>
                    <p className="text-sm text-on-surface-variant">{feature.body}</p>
                  </div>
                </div>
                {plans.length ? (
                  <ul className="mt-5 divide-y divide-outline-variant/15 overflow-hidden rounded-xl border border-outline-variant/15">
                    {plans.map((plan) => (
                      <li key={plan.plan_id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-sm font-medium text-on-surface">
                          {plan.name}
                          {plan.badge ? (
                            <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                              {plan.badge}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-sm font-bold text-on-surface">{formatNpr(plan.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-5 text-sm text-on-surface-variant">
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                      Sign in
                    </Link>{" "}
                    to see current prices.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <div className="mt-16">
        <SectionTitle>Duo coins</SectionTitle>
        <p className="mx-auto -mt-3 mb-6 max-w-lg text-center text-sm text-on-surface-variant">
          1 coin = NPR 1. Recharge with eSewa and spend coins on any premium pass. Gift cards can be redeemed too.
        </p>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3">
          {COIN_PACKS.map((coins) => (
            <div key={coins} className="rounded-2xl border border-primary/10 bg-secondary/30 p-4 text-center">
              <p className="font-[var(--font-headline)] text-xl font-bold text-on-surface">
                <span aria-hidden>🪙 </span>
                {coins.toLocaleString("en-NP")}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">{formatNpr(coins)}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingPage>
  );
}
