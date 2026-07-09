"use client";

import { create } from "zustand";

import type { ActivityZone, DisplayZone } from "./types";

type ActivityHeatmapState = {
  zones: ActivityZone[];
  displayZones: DisplayZone[];
  selectedZone: ActivityZone | null;
  popupAnchor: { x: number; y: number } | null;
  screenPoints: { id: string; x: number; y: number; radius: number }[];
  setZones: (zones: ActivityZone[]) => void;
  setDisplayZones: (zones: DisplayZone[]) => void;
  setScreenPoints: (points: { id: string; x: number; y: number; radius: number }[]) => void;
  setSelected: (zone: ActivityZone | null, anchor: { x: number; y: number } | null) => void;
};

export const useActivityHeatmapStore = create<ActivityHeatmapState>((set) => ({
  zones: [],
  displayZones: [],
  selectedZone: null,
  popupAnchor: null,
  screenPoints: [],
  setZones: (zones) => set({ zones }),
  setDisplayZones: (displayZones) => set({ displayZones }),
  setScreenPoints: (screenPoints) => set({ screenPoints }),
  setSelected: (selectedZone, popupAnchor) => set({ selectedZone, popupAnchor }),
}));
