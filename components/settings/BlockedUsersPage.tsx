"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/message/UserAvatar";
import api from "@/lib/api";
import type { BlockedUser } from "@/types";
import {
  SecurityNotice,
  SecurityPageShell,
  SecuritySpinner,
} from "@/components/security/SecurityPageShell";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso)
  );
}

export function BlockedUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getBlockedUsers()
      .then((data) => setBlocked(data.blocked_users))
      .catch(() => setError("Could not load your blocked users."))
      .finally(() => setLoading(false));
  }, [user]);

  const handleUnblock = async (userId: number) => {
    setBusyId(userId);
    setConfirmId(null);
    try {
      await api.unblockUser(userId);
      setBlocked((prev) => prev?.filter((b) => b.id !== userId) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unblock this user.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SecurityPageShell title="Blocked users" backHref="/settings">
      {loading ? (
        <SecuritySpinner />
      ) : error ? (
        <SecurityNotice tone="error">{error}</SecurityNotice>
      ) : blocked && blocked.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
          {blocked.map((b, idx) => (
            <div key={b.id}>
              {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
              <div className="flex items-center gap-3 px-4 py-4 md:px-5">
                <UserAvatar src={b.photo_url} name={b.full_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-on-surface">{b.full_name}</p>
                  <p className="text-sm text-on-surface-variant">
                    @{b.username} · Blocked {formatDate(b.blocked_at)}
                  </p>
                </div>
                {confirmId === b.id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-full border border-outline-variant/30 px-3 py-1.5 text-xs font-semibold text-on-surface"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => void handleUnblock(b.id)}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {busyId === b.id ? "..." : "Confirm"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(b.id)}
                    className="shrink-0 rounded-full border border-outline-variant/30 px-3.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high/60"
                  >
                    Unblock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl">block</span>
          </div>
          <p className="font-semibold text-on-surface">No blocked users</p>
          <p className="max-w-xs text-sm text-on-surface-variant">
            When you block someone from a chat, they'll show up here so you can manage them.
          </p>
        </div>
      )}
    </SecurityPageShell>
  );
}
