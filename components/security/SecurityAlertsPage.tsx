"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { SecurityEvent } from "@/types";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "./SecurityPageShell";

function severityStyle(severity: SecurityEvent["severity"]): { icon: string; className: string } {
  switch (severity) {
    case "critical":
      return { icon: "gpp_bad", className: "bg-red-500/10 text-red-400" };
    case "warning":
      return { icon: "warning", className: "bg-amber-500/10 text-amber-500" };
    default:
      return { icon: "info", className: "bg-primary/10 text-primary" };
  }
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function AlertRow({
  event,
  onMarkRead,
  onDelete,
  busy,
}: {
  event: SecurityEvent;
  onMarkRead: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const style = severityStyle(event.severity);
  return (
    <div
      className={
        "flex items-start gap-3 px-4 py-4 md:px-5 " + (!event.is_read ? "bg-primary/[0.03]" : "")
      }
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.className}`}>
        <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {!event.is_read ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
          <p className="font-semibold text-on-surface">{event.title}</p>
        </div>
        {event.message ? <p className="mt-0.5 text-sm text-on-surface-variant">{event.message}</p> : null}
        <p className="mt-0.5 text-xs text-on-surface-variant">
          {formatDateTime(event.created_at)}
          {event.ip_address ? ` · ${event.ip_address}` : ""}
        </p>
        <div className="mt-2 flex gap-3">
          {!event.is_read ? (
            <button
              type="button"
              disabled={busy}
              onClick={onMarkRead}
              className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              Mark as read
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="text-xs font-semibold text-on-surface-variant hover:text-red-400 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function SecurityAlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<SecurityEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const refresh = () => {
    setLoading(true);
    api
      .getSecurityEvents()
      .then((data) => setEvents(data.events))
      .catch(() => setError("Could not load security alerts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkRead = async (id: number) => {
    setBusyId(id);
    try {
      await api.markSecurityEventRead(id);
      setEvents((prev) => prev?.map((e) => (e.id === id ? { ...e, is_read: true } : e)) ?? null);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    try {
      await api.deleteSecurityEvent(id);
      setEvents((prev) => prev?.filter((e) => e.id !== id) ?? null);
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await api.markAllSecurityEventsRead();
      setEvents((prev) => prev?.map((e) => ({ ...e, is_read: true })) ?? null);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = events?.filter((e) => !e.is_read).length ?? 0;

  return (
    <SecurityPageShell title="Security alerts">
      {loading ? (
        <SecuritySpinner pageName="Security alerts" />
      ) : error ? (
        <SecurityNotice tone="error">{error}</SecurityNotice>
      ) : events ? (
        <div className="space-y-4">
          {unreadCount > 0 ? (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={markingAll}
                onClick={() => void handleMarkAll()}
                className="text-sm font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {markingAll ? "Marking..." : "Mark all as read"}
              </button>
            </div>
          ) : null}

          {events.length === 0 ? (
            <p className="px-1 py-8 text-center text-sm text-on-surface-variant">
              No security alerts yet. We'll notify you here about important account activity.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
              {events.map((event, idx) => (
                <div key={event.id}>
                  {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                  <AlertRow
                    event={event}
                    busy={busyId === event.id}
                    onMarkRead={() => void handleMarkRead(event.id)}
                    onDelete={() => void handleDelete(event.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </SecurityPageShell>
  );
}
