"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Conversation, Match } from "@/types";
import { queryKeys } from "./keys";

export function useConversationsQuery(options?: {
  archived?: boolean;
  unread?: boolean;
  enabled?: boolean;
}) {
  const archived = options?.archived ?? false;
  const unread = options?.unread ?? false;
  return useQuery({
    queryKey: queryKeys.conversations(archived, unread),
    queryFn: () => api.getConversations({ archived, unread }),
    enabled: options?.enabled ?? true,
    staleTime: 20_000,
  });
}

export function useMatchesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: () => api.getMatches(),
    enabled,
    staleTime: 60_000,
  });
}

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.getMe(),
    enabled,
    staleTime: 120_000,
  });
}

export function totalUnreadFromConversations(conversations: Conversation[]): number {
  return conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
}

export type { Match };
