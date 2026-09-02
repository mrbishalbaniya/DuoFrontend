"use client";

import NumberFlow from "@number-flow/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import { EsewaLogo } from "@/components/payment/EsewaLogo";
import Loader from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { formatCoinDelta, formatCoins, formatNprPrice } from "@/lib/coins";
import { submitEsewaPayment } from "@/lib/esewa";
import type { CoinPack, WalletSummary, WalletTransaction } from "@/types";

function formatTxnDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function TransactionRow({ txn }: { txn: WalletTransaction }) {
  const num = Number(txn.amount);
  const isCredit = num >= 0;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5">
      <div className="min-w-0">
        <p className="truncate font-medium text-on-surface">
          {txn.description || (txn.type === "top_up" ? "Coin pack purchase" : "Purchase")}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{formatTxnDate(txn.created_at)}</p>
      </div>
      <p
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          isCredit ? "text-[#60bb46]" : "text-on-surface"
        }`}
      >
        {formatCoinDelta(txn.amount)}
      </p>
    </div>
  );
}

const DEFAULT_COIN_PACKS: CoinPack[] = [
  { id: "coins_500", coins: 500, price_npr: 500, label: "500 Coins" },
  { id: "coins_1000", coins: 1000, price_npr: 1000, label: "1,000 Coins" },
  { id: "coins_2000", coins: 2000, price_npr: 2000, label: "2,000 Coins" },
  { id: "coins_5000", coins: 5000, price_npr: 5000, label: "5,000 Coins" },
];

export function WalletPage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    try {
      const walletData = await api.getWallet();
      setWallet(walletData);
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
      setNotice("Coins added successfully.");
      void fetchUser();
      void loadWallet();
      router.replace("/wallet");
    } else if (walletResult === "failed") {
      setNotice("Coin purchase was not completed.");
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
      setNotice(err instanceof Error ? err.message : "Could not start eSewa payment.");
      setToppingUp(false);
    }
  };

  const balance = wallet?.coins ?? wallet?.balance ?? user?.profile.wallet_balance ?? 0;
  const coinPacks =
    wallet?.coin_packs?.length
      ? wallet.coin_packs
      : DEFAULT_COIN_PACKS.map((pack) => ({
          ...pack,
          coins: pack.coins,
          price_npr: pack.price_npr,
        }));

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface">
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12">
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Duo Coins
              </p>
              <h1 className="ios-large-title pb-0 pt-1 md:text-[2.5rem]">Wallet</h1>
              <p className="mt-2 text-sm text-on-surface-variant">
                Buy coins with eSewa and spend them on Duo Premium from Discover.
              </p>
            </div>

            {notice ? (
              <div className="rounded-xl border border-white/10 bg-surface-variant/50 px-4 py-3 text-sm text-on-surface">
                {notice}
              </div>
            ) : null}

            {loading ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <Loader pageName="Wallet" />
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-surface-variant/40 p-6">
                  <p className="text-sm font-medium text-on-surface-variant">Your coins</p>
                  <p className="mt-2 flex items-baseline gap-2 text-4xl font-bold tabular-nums text-on-surface">
                    <span className="material-symbols-outlined text-3xl text-primary">toll</span>
                    <NumberFlow value={balance} />
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
                    Buy coins
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 p-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {coinPacks.map((pack) => (
                        <button
                          key={pack.id}
                          type="button"
                          disabled={toppingUp}
                          onClick={() => void handleTopUp(pack.coins)}
                          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-background/50 px-3 py-3 text-sm transition hover:border-[#60bb46]/40 hover:bg-[#60bb46]/10 disabled:opacity-60"
                        >
                          <span className="flex items-center gap-1 font-semibold text-on-surface">
                            <span className="material-symbols-outlined text-base text-primary">toll</span>
                            {pack.coins.toLocaleString("en-NP")}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                            <EsewaLogo className="size-3" />
                            {formatNprPrice(pack.price_npr)}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-center text-[11px] text-on-surface-variant/70">
                      {toppingUp
                        ? "Redirecting to eSewa…"
                        : "1 NPR via eSewa = 1 Duo Coin · Secure payment with eSewa ePay"}
                    </p>
                  </div>
                </section>

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
