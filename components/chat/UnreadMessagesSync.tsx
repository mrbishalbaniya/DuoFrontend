"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessagesStore } from "@/store/unreadMessagesStore";

const POLL_MS = 45_000;

/**
 * Single app-wide sync for unread chat totals (nav badges).
 * Mount once under AuthProvider.
 */
export function UnreadMessagesSync() {
  const { user, loading: authLoading } = useAuth();
  const refresh = useUnreadMessagesStore((s) => s.refresh);
  const clear = useUnreadMessagesStore((s) => s.clear);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      clear();
      return;
    }

    void refresh({ force: true });

    const onFocus = () => void refresh({ force: true });
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh({ force: true });
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = window.setInterval(() => void refresh(), POLL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [user, authLoading, refresh, clear]);

  return null;
}
