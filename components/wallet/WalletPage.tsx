"use client";

import NumberFlow from "@number-flow/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import { EsewaLogo } from "@/components/payment/EsewaLogo";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { submitEsewaPayment } from "@/lib/esewa";
import type { SubscriptionPlan, WalletSummary, WalletTransaction } from "@/types";

function formatTxnDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatTxnAmount(amount: string): string {
  const num = Number(amount);
  const abs = Math.abs(num).toLocaleString("en-NP");
  return num >= 0 ? `+NPR ${abs}` : `-NPR ${abs}`;
}

function TransactionRow({ txn }: { txn: WalletTransaction }) {
  const num = Number(txn.amount);
  const isCredit = num >= 0;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5">
      <div className="min-w-0">
        <p className="truncate font-medium text-on-surface">
          {txn.description || (txn.type === "top_up" ? "Wallet top-up" : "Purchase")}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{formatTxnDate(txn.created_at)}</p>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isCredit ? "text-[#60bb46]" : "text-on-surface"
        }`}
      >
        {formatTxnAmount(txn.amount)}
      </p>
    </div>
  );
}

export function WalletPage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    try {
      const [walletData, plansData] = await Promise.all([
        api.getWallet(),
        api.getSubscriptionPlans().catch(() => []),
      ]);
      setWallet(walletData);
      setPlans(plansData);
    } catch {
      setNotice("Could not load wallet.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      void loadWallet();
    }
  }, [user, authLoading, router, loadWallet]);

  useEffect(() => {
    const walletResult = searchParams.get("wallet");
    if (walletResult === "success") {
      setNotice("Wallet topped up successfully.");
      void fetchUser();
      void loadWallet();
      router.replace("/wallet");
    } else if (walletResult === "failed") {
      setNotice("Top-up was not completed.");
      router.replace("/wallet");
    }
  }, [searchParams, fetchUser, loadWallet, router]);

  const handleTopUp = async (amount: number) => {
    setToppingUp(true);
    setNotice(null);
    try {
      const payment = await api.initiateWalletTopUp(amount);
      submitEsewaPayment(payment.payment_url, payment.form);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not start eSewa top-up.");
      setToppingUp(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    setPurchasing(true);
    setNotice(null);
    try {
      const result = await api.purchaseWithWallet(planId);
      setWallet((prev) => (prev ? { ...prev, balance: result.balance } : prev));
      setNotice(`${result.plan.name} activated.`);
      void fetchUser();
      void loadWallet();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not purchase pass.");
    } finally {
      setPurchasing(false);
    }
  };

  const balance = wallet?.balance ?? user?.profile.wallet_balance ?? 0;
  const presets = wallet?.top_up_presets ?? [500, 1000, 2000, 5000];
  const busy = toppingUp || purchasing;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface">
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12">
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Duo Wallet
              </p>
              <h1 className="ios-large-title pb-0 pt-1 md:text-[2.5rem]">Wallet</h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Top up with eSewa and use your balance for Duo Premium passes.
              </p>
            </div>

            {notice ? (
              <div className="rounded-xl border border-white/10 bg-surface-variant/50 px-4 py-3 text-sm text-on-surface">
                {notice}
              </div>
            ) : null}

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-surface-variant/40 p-6">
                  <p className="text-sm font-medium text-on-surface-variant">Available balance</p>
                  <p className="mt-2 text-4xl font-bold tabular-nums text-on-surface">
                    NPR <NumberFlow value={balance} />
                  </p>
                  {user?.profile.is_premium && user.profile.subscription_expires_at ? (
                    <p className="mt-3 text-sm text-primary">
                      Premium active until{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(user.profile.subscription_expires_at))}
                    </p>
                  ) : null}
                </div>

                <section className="space-y-3">
                  <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Top up
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 p-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {presets.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          disabled={busy}
                          onClick={() => void handleTopUp(amount)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-background/50 px-3 py-3 text-sm font-semibold text-on-surface transition hover:border-[#60bb46]/40 hover:bg-[#60bb46]/10 disabled:opacity-60"
                        >
                          <EsewaLogo className="size-4" />
                          {amount.toLocaleString("en-NP")}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-center text-[11px] text-on-surface-variant/70">
                      {toppingUp ? "Redirecting to eSewa…" : "Secure top-up in NPR via eSewa ePay"}
                    </p>
                  </div>
                </section>

                {plans.length > 0 ? (
                  <section className="space-y-3">
                    <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Premium passes
                    </h2>
                    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 divide-y divide-outline-variant/20">
                      {plans.map((plan) => {
                        const canAfford = balance >= plan.amount;
                        return (
                          <div
                            key={plan.plan_id}
                            className="flex items-center justify-between gap-3 px-4 py-4 md:px-5"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-on-surface">{plan.name}</p>
                              <p className="text-sm text-on-surface-variant">
                                {plan.duration_days} days · NPR {plan.amount.toLocaleString("en-NP")}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={busy || !canAfford}
                              onClick={() => void handlePurchase(plan.plan_id)}
                              className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
                            >
                              {purchasing ? "…" : "Buy"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {!user?.profile.is_premium ? (
                      <p className="px-1 text-xs text-on-surface-variant">
                        Unlocks Liked you and Visited you on{" "}
                        <Link href="/discover" className="text-primary underline-offset-2 hover:underline">
                          Discover
                        </Link>
                        .
                      </p>
                    ) : null}
                  </section>
                ) : null}

                {wallet?.transactions.length ? (
                  <section className="space-y-3">
                    <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Recent activity
                    </h2>
                    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 divide-y divide-outline-variant/20">
                      {wallet.transactions.map((txn, index) => (
                        <TransactionRow key={`${txn.created_at}-${index}`} txn={txn} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
