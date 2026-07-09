"use client";

import { create } from "zustand";

import type { AvatarConfig } from "@/lib/avatarStudio/types";
import { fetchAvatarBatch } from "@/lib/avatarStudio/api";

type AvatarConfigCache = {
  byUserId: Record<string, AvatarConfig>;
  revision: number;
  loading: boolean;
  hydrate: (userIds: Array<number | string>) => Promise<void>;
  setLocal: (userId: string | number, config: AvatarConfig) => void;
  bumpRevision: () => void;
};

export const useAvatarConfigStore = create<AvatarConfigCache>((set, get) => ({
  byUserId: {},
  revision: 0,
  loading: false,
  hydrate: async (userIds) => {
    const unique = [...new Set(userIds.map(String).filter(Boolean))];
    const missing = unique.filter((id) => !get().byUserId[id]);
    if (missing.length === 0) return;
    set({ loading: true });
    try {
      const configs = await fetchAvatarBatch(missing);
      set((state) => ({
        byUserId: { ...state.byUserId, ...configs },
        revision: state.revision + 1,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },
  setLocal: (userId, config) =>
    set((state) => ({
      byUserId: { ...state.byUserId, [String(userId)]: config },
      revision: state.revision + 1,
    })),
  bumpRevision: () => set((state) => ({ revision: state.revision + 1 })),
}));
