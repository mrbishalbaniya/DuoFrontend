import { create } from "zustand";

import type { MapProfile } from "@/components/map/types";

import type { PresenceStatus } from "./types";

type GlobeAvatarStore = {
  selectedProfileId: string | null;
  selectedProfile: MapProfile | null;
  popupAnchor: { x: number; y: number } | null;
  presence: Record<string, PresenceStatus>;
  screenPoints: { id: string; x: number; y: number; radius: number }[];
  setSelected: (
    profileId: string | null,
    profile?: MapProfile | null,
    anchor?: { x: number; y: number } | null
  ) => void;
  setPresence: (userId: string, status: PresenceStatus) => void;
  setScreenPoints: (points: { id: string; x: number; y: number; radius: number }[]) => void;
};

export const useGlobeAvatarStore = create<GlobeAvatarStore>((set) => ({
  selectedProfileId: null,
  selectedProfile: null,
  popupAnchor: null,
  presence: {},
  screenPoints: [],
  setSelected: (profileId, profile = null, anchor = null) =>
    set({
      selectedProfileId: profileId,
      selectedProfile: profile,
      popupAnchor: anchor,
    }),
  setPresence: (userId, status) =>
    set((state) => ({
      presence: { ...state.presence, [userId]: status },
    })),
  setScreenPoints: (points) => set({ screenPoints: points }),
}));
