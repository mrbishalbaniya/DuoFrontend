"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { formatCoinDelta } from "@/lib/coins";
import type { WalletTransaction } from "@/types";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "@/components/security/SecurityPageShell";

const TYPE_KEYS: Record<WalletTransaction["type"], string> = {
  top_up: "topUp",
  purchase: "purchase",
  adjustment: "adjustment",
  gift_redeem: "giftRedeem",
};

const PAYMENT_METHOD_KEYS: Record<string, string> = {
  esewa: "esewa",
  wallet: "wallet",
  gift: "gift",
  "": "unknown",
};

function statusBadgeClass(status: WalletTransaction["status"]): string {
  if (status === "complete") return "bg-accent/15 text-accent";
  if (status === "pending") return "bg-amber-500/15 text-amber-500";
  return "bg-red-500/15 text-red-400";
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{value}</span>
    </div>
  );
}

export function WalletTransactionDetailPage({ transactionId }: { transactionId: number }) {
  const t = useTranslations("settingsExtra.walletExtra");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [txn, setTxn] = useState<WalletTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .getWalletTransaction(transactionId)
        .then(setTxn)
        .catch(() => setError(t("detail.loadError")))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [user, transactionId]);

  const isCredit = txn ? Number(txn.amount) >= 0 : true;

  return (
    <SecurityPageShell title={t("detail.title")} backHref="/wallet/transactions">
      {loading ? (
        <SecuritySpinner pageName={t("detail.title")} />
      ) : error || !txn ? (
        <SecurityNotice tone="error">{error || t("detail.notFound")}</SecurityNotice>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-surface-variant/40 p-6 text-center">
            <p
              className={`text-3xl font-bold tabular-nums ${
                isCredit ? "text-[#60bb46]" : "text-on-surface"
              }`}
            >
              {formatCoinDelta(txn.amount)}
            </p>
            <span
              className={`mt-3 inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(
                txn.status
              )}`}
            >
              {t(`status.${txn.status}`)}
            </span>
            {txn.description ? (
              <p className="mt-3 text-sm text-on-surface-variant">{txn.description}</p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 divide-y divide-outline-variant/20">
            <DetailRow
              label={t("detail.totalCoin")}
              value={t("detail.coinsValue", { count: Math.abs(Number(txn.amount)).toLocaleString("en-NP") })}
            />
            <DetailRow
              label={t("detail.totalAmount")}
              value={
                txn.payment_method === "esewa"
                  ? t("detail.nprValue", { amount: Number(txn.total_amount).toLocaleString("en-NP") })
                  : t("detail.coinsValue", { count: Number(txn.total_amount).toLocaleString("en-NP") })
              }
            />
            <DetailRow label={t("detail.status")} value={t(`status.${txn.status}`)} />
            <DetailRow label={t("detail.transactionType")} value={t(`types.${TYPE_KEYS[txn.type]}`)} />
            <DetailRow label={t("detail.activityType")} value={t(`activity.${TYPE_KEYS[txn.type]}`)} />
            <DetailRow
              label={t("detail.paymentMethod")}
              value={t(`paymentMethods.${PAYMENT_METHOD_KEYS[txn.payment_method] ?? "unknown"}`)}
            />
            <DetailRow label={t("detail.created")} value={formatDateTime(txn.created_at)} />
            <DetailRow label={t("detail.updated")} value={formatDateTime(txn.updated_at)} />
            <DetailRow label={t("detail.transactionIdLabel")} value={t("detail.transactionIdValue", { id: txn.id })} />
          </div>
        </div>
      )}
    </SecurityPageShell>
  );
}
