"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { formatCoinDelta } from "@/lib/coins";
import type { WalletTransaction, WalletTransactionPaymentMethod } from "@/types";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "@/components/security/SecurityPageShell";
import { SelectField } from "@/components/ui/select-field";

type PaymentMethodFilter = "all" | WalletTransactionPaymentMethod;

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethodFilter; label: string }[] = [
  { value: "all", label: "All methods" },
  { value: "esewa", label: "eSewa" },
  { value: "wallet", label: "Wallet balance" },
  { value: "gift", label: "Gift card" },
];

function formatTxnDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function statusBadgeClass(status: WalletTransaction["status"]): string {
  if (status === "complete") return "bg-accent/15 text-accent";
  if (status === "pending") return "bg-amber-500/15 text-amber-500";
  return "bg-red-500/15 text-red-400";
}

const STATUS_LABELS: Record<WalletTransaction["status"], string> = {
  complete: "Completed",
  pending: "Pending",
  failed: "Failed",
};

function TransactionListRow({ txn }: { txn: WalletTransaction }) {
  const num = Number(txn.amount);
  const isCredit = num >= 0;

  return (
    <Link
      href={`/wallet/transactions/${txn.id}`}
      className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface-container-high/40 md:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-on-surface">
          {txn.description ||
            (txn.type === "top_up"
              ? "Coin pack purchase"
              : txn.type === "gift_redeem"
                ? "Gift card redeemed"
                : "Purchase")}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{formatTxnDate(txn.created_at)}</p>
        <span
          className={`mt-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(
            txn.status
          )}`}
        >
          {STATUS_LABELS[txn.status]}
        </span>
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

export function WalletTransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodFilter>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const loadFirstPage = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    api
      .getWalletTransactions({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
      })
      .then((data) => {
        setTransactions(data.results);
        setHasMore(data.has_more);
        setNextBefore(data.next_before);
      })
      .catch(() => setError("Could not load transactions."))
      .finally(() => setLoading(false));
  }, [user, dateFrom, dateTo, paymentMethod]);

  useEffect(() => {
    const timer = setTimeout(loadFirstPage, 0);
    return () => clearTimeout(timer);
  }, [loadFirstPage]);

  const loadMore = () => {
    if (!nextBefore || loadingMore) return;
    setLoadingMore(true);
    api
      .getWalletTransactions({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
        before: nextBefore,
      })
      .then((data) => {
        setTransactions((prev) => [...prev, ...data.results]);
        setHasMore(data.has_more);
        setNextBefore(data.next_before);
      })
      .catch(() => setError("Could not load more transactions."))
      .finally(() => setLoadingMore(false));
  };

  return (
    <SecurityPageShell title="Transactions" backHref="/wallet">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 gap-2">
            <label className="flex-1 text-xs font-semibold text-on-surface-variant">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="flex-1 text-xs font-semibold text-on-surface-variant">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
          <div className="sm:w-44">
            <SelectField
              label="Payment method"
              options={PAYMENT_METHOD_OPTIONS}
              value={paymentMethod}
              hidePlaceholderOption
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodFilter)}
            />
          </div>
        </div>

        {(dateFrom || dateTo || paymentMethod !== "all") ? (
          <button
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setPaymentMethod("all");
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear filters
          </button>
        ) : null}

        {loading ? (
          <SecuritySpinner pageName="Transactions" />
        ) : error ? (
          <SecurityNotice tone="error">{error}</SecurityNotice>
        ) : transactions.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-on-surface-variant">
            No transactions found.
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
              {transactions.map((txn, idx) => (
                <div key={txn.id}>
                  {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                  <TransactionListRow txn={txn} />
                </div>
              ))}
            </div>

            {hasMore ? (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={loadMore}
                  className="rounded-full border border-outline-variant/30 bg-surface-container-high px-5 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </SecurityPageShell>
  );
}
