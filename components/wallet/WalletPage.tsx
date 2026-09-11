"use client";

import NumberFlow from "@number-flow/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import BottomNav from "@/components/BottomNav";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import { EsewaLogo } from "@/components/payment/EsewaLogo";
import Loader from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { formatCoinDelta, formatCoins, formatNprPrice } from "@/lib/coins";
import { submitEsewaPayment } from "@/lib/esewa";
import type { CoinPack, WalletSummary, WalletTransaction } from "@/types";

function RedeemGiftCardConfirmDialog({
  open,
  code,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  code: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("wallet");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="redeem-giftcard-title"
        aria-describedby="redeem-giftcard-desc"
        className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-background p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="redeem-giftcard-title"
          className="font-[var(--font-headline)] text-lg font-bold text-on-surface"
        >
          {t("redeemConfirmTitle")}
        </h3>
        <p id="redeem-giftcard-desc" className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {t.rich("redeemConfirmDescription", {
            b: (chunks) => (
              <span className="font-semibold uppercase tracking-widest text-on-surface">{chunks}</span>
            ),
            code,
          })}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-full bg-surface-variant px-5 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-variant/70 disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-full gradient-brand px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            {loading ? t("redeeming") : t("confirmRedeem")}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTxnDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function LatestTransactionRow({ txn }: { txn: WalletTransaction }) {
  const t = useTranslations("wallet");
  const num = Number(txn.amount);
  const isCredit = num >= 0;

  return (
    <Link
      href="/wallet/transactions"
      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-container-high/40 md:px-5"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-on-surface">
          {txn.description ||
            (txn.type === "top_up"
              ? t("coinPackPurchase")
              : txn.type === "gift_redeem"
                ? t("giftCardRedeemed")
                : t("purchase"))}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{formatTxnDate(txn.created_at)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <p
          className={`text-sm font-semibold tabular-nums ${
            isCredit ? "text-[#60bb46]" : "text-on-surface"
          }`}
        >
          {formatCoinDelta(txn.amount)}
        </p>
        <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
      </div>
    </Link>
  );
}

const DEFAULT_COIN_PACKS: CoinPack[] = [
  { id: "coins_50", coins: 50, price_npr: 50, label: "50 Coins" },
  { id: "coins_100", coins: 100, price_npr: 100, label: "100 Coins" },
  { id: "coins_250", coins: 250, price_npr: 250, label: "250 Coins" },
  { id: "coins_500", coins: 500, price_npr: 500, label: "500 Coins" },
  { id: "coins_1000", coins: 1000, price_npr: 1000, label: "1,000 Coins" },
  { id: "coins_2000", coins: 2000, price_npr: 2000, label: "2,000 Coins" },
  { id: "coins_3000", coins: 3000, price_npr: 3000, label: "3,000 Coins" },
  { id: "coins_5000", coins: 5000, price_npr: 5000, label: "5,000 Coins" },
];

export function WalletPage() {
  const t = useTranslations("wallet");
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);
  const [confirmingRedeem, setConfirmingRedeem] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      const walletData = await api.getWallet();
      setWallet(walletData);
    } catch {
      setNotice(t("couldNotLoad"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setNotice(t("coinsAddedSuccess"));
      void fetchUser();
      void loadWallet();
      router.replace("/wallet");
    } else if (walletResult === "failed") {
      setNotice(t("purchaseFailed"));
      router.replace("/wallet");
    }
  }, [searchParams, fetchUser, loadWallet, router, t]);

  const handleTopUp = async (amount: number) => {
    setToppingUp(true);
    setNotice(null);
    try {
      const payment = await api.initiateWalletTopUp(amount);
      submitEsewaPayment(payment.payment_url, payment.form);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : t("startPaymentError"));
      setToppingUp(false);
    }
  };

  const formatGiftCodeInput = (raw: string) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
    return cleaned.match(/.{1,4}/g)?.join("-") ?? cleaned;
  };

  const handleGiftCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!giftCode.trim() || redeeming) return;
    setGiftError(null);
    setGiftSuccess(null);
    setConfirmingRedeem(true);
  };

  const confirmRedeemGiftCard = async () => {
    const code = giftCode.trim();
    if (!code) return;

    setRedeeming(true);
    setGiftError(null);
    setGiftSuccess(null);
    try {
      const result = await api.redeemGiftCard(code);
      setGiftSuccess(t("redeemSuccess", { amount: result.amount.toLocaleString("en-NP") }));
      setGiftCode("");
      await loadWallet();
      void fetchUser();
    } catch (err) {
      setGiftError(err instanceof Error ? err.message : t("redeemError"));
    } finally {
      setRedeeming(false);
      setConfirmingRedeem(false);
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
    <div className="flex h-[100dvh] overflow-hidden bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <header className="flex shrink-0 items-center gap-3 border-b border-primary/10 px-4 py-3 md:px-6">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary"
            aria-label={t("back")}
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <h1 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{t("title")}</h1>
        </header>
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12"
          data-lenis-prevent
        >
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>

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
                  <p className="text-sm font-medium text-on-surface-variant">{t("yourCoins")}</p>
                  <p className="mt-2 flex items-baseline gap-2 text-4xl font-bold tabular-nums text-on-surface">
                    <span className="text-3xl" aria-hidden>🪙</span>
                    <NumberFlow value={balance} />
                  </p>
                  {user?.profile.is_premium && user.profile.subscription_expires_at ? (
                    <p className="mt-3 text-sm text-primary">
                      {t("premiumActiveUntil", {
                        date: new Intl.DateTimeFormat(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(user.profile.subscription_expires_at)),
                      })}
                    </p>
                  ) : null}
                </div>

                <section className="space-y-3">
                  <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("buyCoins")}
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
                            <span className="text-base" aria-hidden>🪙</span>
                            {pack.coins.toLocaleString("en-NP")}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                            <EsewaLogo className="size-3" />
                            {formatNprPrice(pack.price_npr)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("redeemGiftCard")}
                  </h2>
                  <form
                    onSubmit={handleGiftCodeSubmit}
                    className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        inputMode="text"
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={t("redeemPlaceholder")}
                        value={giftCode}
                        onChange={(event) => {
                          setGiftCode(formatGiftCodeInput(event.target.value));
                          setGiftError(null);
                          setGiftSuccess(null);
                        }}
                        disabled={redeeming}
                        className="flex-1 rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-on-surface placeholder:text-on-surface-variant/50 placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                      />
                      <button
                        type="submit"
                        disabled={redeeming || !giftCode.trim()}
                        className="shrink-0 rounded-xl gradient-brand px-5 py-3 text-sm font-semibold text-white transition disabled:pointer-events-none disabled:opacity-50"
                      >
                        {redeeming ? t("redeeming") : t("redeemButton")}
                      </button>
                    </div>
                    {giftError ? <p className="mt-2 text-sm text-error">{giftError}</p> : null}
                    {giftSuccess ? (
                      <p className="mt-2 text-sm text-[#60bb46]">{giftSuccess}</p>
                    ) : null}
                  </form>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("recentActivity")}
                    </h2>
                    <Link
                      href="/wallet/transactions"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {t("viewAll")}
                    </Link>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                    {wallet?.transactions.length ? (
                      <LatestTransactionRow txn={wallet.transactions[0]} />
                    ) : (
                      <Link
                        href="/wallet/transactions"
                        className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface-container-high/40 md:px-5"
                      >
                        <span className="text-sm text-on-surface-variant">{t("noTransactions")}</span>
                        <span className="material-symbols-outlined text-on-surface-variant">
                          chevron_right
                        </span>
                      </Link>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
      <RedeemGiftCardConfirmDialog
        open={confirmingRedeem}
        code={giftCode}
        loading={redeeming}
        onCancel={() => setConfirmingRedeem(false)}
        onConfirm={() => void confirmRedeemGiftCard()}
      />
    </div>
  );
}
