"use client";

import { create } from "zustand";
import api from "@/lib/api";

type UnreadMessagesState = {
  totalUnread: number;
  loading: boolean;
  lastFetchedAt: number | null;
  refresh: (options?: { force?: boolean }) => Promise<void>;
  setTotalUnread: (count: number) => void;
  clear: () => void;
};

const MIN_REFRESH_MS = 8_000;

export const useUnreadMessagesStore = create<UnreadMessagesState>((set, get) => ({
  totalUnread: 0,
  loading: false,
  lastFetchedAt: null,

  setTotalUnread: (count) => {
    set({ totalUnread: Math.max(0, Math.floor(count)) });
  },

  clear: () => {
    set({ totalUnread: 0, lastFetchedAt: null, loading: false });
  },

  refresh: async (options) => {
    const { force = false } = options ?? {};
    const { loading, lastFetchedAt } = get();
    if (loading) return;
    if (
      !force &&
      lastFetchedAt != null &&
      Date.now() - lastFetchedAt < MIN_REFRESH_MS
    ) {
      return;
    }

    set({ loading: true });
    try {
      const conversations = await api.getConversations();
      const total = conversations.reduce(
        (sum, c) => sum + (c.unread_count || 0),
        0
      );
      set({ totalUnread: total, lastFetchedAt: Date.now() });
    } catch {
      /* keep previous count */
    } finally {
      set({ loading: false });
    }
  },
}));

export function formatUnreadBadge(count: number): string {
  if (count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}
