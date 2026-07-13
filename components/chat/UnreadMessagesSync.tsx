"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useConversationsQuery, totalUnreadFromConversations } from "@/lib/query/hooks";
import { useUnreadMessagesStore } from "@/store/unreadMessagesStore";

const POLL_MS = 90_000;

/**
 * Single app-wide sync for unread chat totals (nav badges).
 * Uses React Query cache + Zustand for backward-compatible badge reads.
 */
export function UnreadMessagesSync() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const setTotalUnread = useUnreadMessagesStore((s) => s.setTotalUnread);
  const clear = useUnreadMessagesStore((s) => s.clear);
  const onChatRoute = pathname === "/chat" || pathname.startsWith("/chat/");

  const { data: conversations, refetch } = useConversationsQuery({
    enabled: !authLoading && Boolean(user),
  });

  useEffect(() => {
    if (!conversations) return;
    setTotalUnread(totalUnreadFromConversations(conversations));
  }, [conversations, setTotalUnread]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      clear();
      return;
    }

    const onFocus = () => {
      if (!document.hidden) void refetch();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refetch();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(() => {
      if (document.hidden || onChatRoute) return;
      void refetch();
    }, POLL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [user, authLoading, clear, refetch, onChatRoute]);

  return null;
}
