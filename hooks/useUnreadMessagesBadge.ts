"use client";

import {
  formatUnreadBadge,
  useUnreadMessagesStore,
} from "@/store/unreadMessagesStore";

/** Read-only unread badge for nav (mobile + desktop). */
export function useUnreadMessagesBadge() {
  const totalUnread = useUnreadMessagesStore((s) => s.totalUnread);

  return {
    totalUnread,
    badgeLabel: formatUnreadBadge(totalUnread),
  };
}
