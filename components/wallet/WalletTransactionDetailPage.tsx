"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { formatCoinDelta } from "@/lib/coins";
import type { WalletTransaction } from "@/types";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "@/components/security/SecurityPageShell";

const TYPE_LABELS: Record<WalletTransaction["type"], string> = {
  top_up: "Purchase",
  purchase: "Purchase",
  adjustment: "Adjustment",
};

const ACTIVITY_LABELS: Record<WalletTransaction["type"], string> = {
  top_up: "Purchase of coin",
  purchase: "Spent on Duo Premium",
  adjustment: "Wallet adjustment",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  esewa: "eSewa",
  wallet: "Wallet balance",
  "": "—",
};

const STATUS_LABELS: Record<WalletTransaction["status"], string> = {
  complete: "Completed",
  pending: "Pending",
  failed: "Failed",
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
        .catch(() => setError("Could not load this transaction."))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [user, transactionId]);

  const isCredit = txn ? Number(txn.amount) >= 0 : true;

  return (
    <SecurityPageShell title="Transaction" backHref="/wallet/transactions">
      {loading ? (
        <SecuritySpinner pageName="Transaction" />
      ) : error || !txn ? (
        <SecurityNotice tone="error">{error || "Transaction not found."}</SecurityNotice>
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
              {STATUS_LABELS[txn.status]}
            </span>
            {txn.description ? (
              <p className="mt-3 text-sm text-on-surface-variant">{txn.description}</p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 divide-y divide-outline-variant/20">
            <DetailRow label="Total coin" value={`${Math.abs(Number(txn.amount)).toLocaleString("en-NP")} coins`} />
            <DetailRow
              label="Total amount"
              value={
                txn.payment_method === "esewa"
                  ? `NPR ${Number(txn.total_amount).toLocaleString("en-NP")}`
                  : `${Number(txn.total_amount).toLocaleString("en-NP")} coins`
              }
            />
            <DetailRow label="Status" value={STATUS_LABELS[txn.status]} />
            <DetailRow label="Transaction type" value={TYPE_LABELS[txn.type]} />
            <DetailRow label="Activity type" value={ACTIVITY_LABELS[txn.type]} />
            <DetailRow
              label="Payment method"
              value={PAYMENT_METHOD_LABELS[txn.payment_method] ?? txn.payment_method}
            />
            <DetailRow label="Created" value={formatDateTime(txn.created_at)} />
            <DetailRow label="Updated" value={formatDateTime(txn.updated_at)} />
            <DetailRow label="Transaction ID" value={`#${txn.id}`} />
          </div>
        </div>
      )}
    </SecurityPageShell>
  );
}
