"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildDefaultEnabledMap,
  DEFAULT_BASE_MAP_ID,
  DEFAULT_GLOBE_MODE_ID,
  getCategoryById,
  getLayerById,
  isCatalogLayerId,
  MAP_LAYER_CATALOG,
  sanitizeEnabledMap,
} from "./catalog";

export const GLOBE_MULTI_TOGGLE_IDS = new Set([
  "globe-atmosphere",
  "globe-earth-glow",
  "globe-terrain-elevation",
]);

type MapLayersState = {
  panelOpen: boolean;
  searchQuery: string;
  enabled: Record<string, boolean>;
  baseMapId: string;
  globeModeId: string;
  favorites: string[];
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  setSearchQuery: (query: string) => void;
  isEnabled: (layerId: string) => boolean;
  toggleLayer: (layerId: string) => void;
  setBaseMap: (layerId: string) => void;
  setGlobeMode: (layerId: string) => void;
  toggleFavorite: (layerId: string) => void;
};

function applySingleSelect(
  enabled: Record<string, boolean>,
  categoryId: string,
  selectedId: string
): Record<string, boolean> {
  const next = { ...enabled };
  const preserved =
    categoryId === "globe"
      ? Object.fromEntries(
          [...GLOBE_MULTI_TOGGLE_IDS].map((id) => [id, next[id]] as const)
        )
      : {};

  for (const layer of MAP_LAYER_CATALOG) {
    if (layer.categoryId === categoryId) {
      if (categoryId === "globe" && GLOBE_MULTI_TOGGLE_IDS.has(layer.id)) continue;
      next[layer.id] = layer.id === selectedId;
    }
  }
  next[selectedId] = true;
  if (categoryId === "globe") {
    for (const [id, value] of Object.entries(preserved)) {
      if (value !== undefined) next[id] = value;
    }
  }
  return next;
}

export const useMapLayersStore = create<MapLayersState>()(
  persist(
    (set, get) => ({
      panelOpen: false,
      searchQuery: "",
      enabled: buildDefaultEnabledMap(),
      baseMapId: DEFAULT_BASE_MAP_ID,
      globeModeId: DEFAULT_GLOBE_MODE_ID,
      favorites: ["duo-profiles", "base-satellite"],

      setPanelOpen: (open) => set({ panelOpen: open }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      isEnabled: (layerId) => Boolean(get().enabled[layerId]),

      toggleLayer: (layerId) => {
        const layer = getLayerById(layerId);
        if (!layer) return;

        const category = getCategoryById(layer.categoryId);
        if (!category) return;

        if (category.selectionMode === "single" && !GLOBE_MULTI_TOGGLE_IDS.has(layerId)) {
          if (layer.categoryId === "base") {
            set((s) => ({
              baseMapId: layerId,
              enabled: applySingleSelect(s.enabled, "base", layerId),
            }));
            return;
          }
          if (layer.categoryId === "globe") {
            set((s) => ({
              globeModeId: layerId,
              enabled: applySingleSelect(s.enabled, "globe", layerId),
            }));
            return;
          }
        }

        set((s) => ({
          enabled: { ...s.enabled, [layerId]: !s.enabled[layerId] },
        }));
      },

      setBaseMap: (layerId) => {
        set((s) => ({
          baseMapId: layerId,
          enabled: applySingleSelect(s.enabled, "base", layerId),
        }));
      },

      setGlobeMode: (layerId) => {
        set((s) => ({
          globeModeId: layerId,
          enabled: applySingleSelect(s.enabled, "globe", layerId),
        }));
      },

      toggleFavorite: (layerId) =>
        set((s) => {
          if (!isCatalogLayerId(layerId)) return s;
          const exists = s.favorites.includes(layerId);
          return {
            favorites: exists
              ? s.favorites.filter((id) => id !== layerId)
              : [...s.favorites, layerId],
          };
        }),
    }),
    {
      name: "duo-map-layers",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        baseMapId: state.baseMapId,
        globeModeId: state.globeModeId,
        favorites: state.favorites,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<MapLayersState> | undefined;
        const favorites = (p?.favorites ?? current.favorites).filter(isCatalogLayerId);
        const baseLayer = getLayerById(p?.baseMapId ?? "");
        const globeLayer = getLayerById(p?.globeModeId ?? "");
        return {
          ...current,
          ...p,
          enabled: sanitizeEnabledMap(p?.enabled),
          favorites,
          baseMapId:
            baseLayer?.categoryId === "base" ? baseLayer.id : DEFAULT_BASE_MAP_ID,
          globeModeId:
            globeLayer?.categoryId === "globe" && !GLOBE_MULTI_TOGGLE_IDS.has(globeLayer.id)
              ? globeLayer.id
              : DEFAULT_GLOBE_MODE_ID,
        };
      },
    }
  )
);
