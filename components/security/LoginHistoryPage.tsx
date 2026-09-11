"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { LoginHistoryEntry } from "@/types";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "./SecurityPageShell";

const PAGE_SIZE = 20;

type SuccessFilter = "all" | "success" | "failed";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function HistoryRow({ entry }: { entry: LoginHistoryEntry }) {
  const location = [entry.city, entry.country].filter(Boolean).join(", ");
  return (
    <div className="flex items-start gap-3 px-4 py-4 md:px-5">
      <div
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
          (entry.success ? "bg-accent/15 text-accent" : "bg-red-500/10 text-red-400")
        }
      >
        <span className="material-symbols-outlined text-[20px]">
          {entry.success ? "login" : "block"}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-on-surface">
            {entry.success ? "Successful sign-in" : "Failed sign-in attempt"}
          </p>
          {entry.is_current ? (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Current
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-on-surface-variant">
          {[entry.device_name, entry.browser].filter(Boolean).join(" · ") || "Unknown device"}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          {formatDateTime(entry.created_at)}
          {location ? ` · ${location}` : ""}
          {entry.ip_address ? ` · ${entry.ip_address}` : ""}
        </p>
        {!entry.success && entry.failure_reason ? (
          <p className="mt-1 text-xs text-red-400">{entry.failure_reason}</p>
        ) : null}
      </div>
    </div>
  );
}

export function LoginHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<LoginHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SuccessFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .getLoginHistory({
          search: search.trim() || undefined,
          success: filter === "all" ? undefined : filter === "success",
          page,
          pageSize: PAGE_SIZE,
        })
        .then((data) => {
          setEntries(data.results);
          setTotal(data.total);
        })
        .catch(() => setError("Could not load login history."))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [user, search, filter, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <SecurityPageShell title="Login history">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">
              search
            </span>
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by device, location, or IP"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high py-2.5 pl-10 pr-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-surface-container-high p-1">
            {(["all", "success", "failed"] as SuccessFilter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setPage(1);
                  setFilter(option);
                }}
                className={
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors " +
                  (filter === option
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:text-on-surface")
                }
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <SecuritySpinner pageName="Login history" />
        ) : error ? (
          <SecurityNotice tone="error">{error}</SecurityNotice>
        ) : entries.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-on-surface-variant">No login activity found.</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
              {entries.map((entry, idx) => (
                <div key={entry.id}>
                  {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                  <HistoryRow entry={entry} />
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between px-1 text-sm">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="font-semibold text-primary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-on-surface-variant">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="font-semibold text-primary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </SecurityPageShell>
  );
}
