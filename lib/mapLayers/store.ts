"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  buildDefaultEnabledMap,
  DEFAULT_BASE_MAP_ID,
  getCategoryById,
  getLayerById,
  isCatalogLayerId,
  MAP_LAYER_CATALOG,
  sanitizeEnabledMap,
} from "./catalog";

type MapLayersState = {
  panelOpen: boolean;
  settingsPanelOpen: boolean;
  searchQuery: string;
  settingsSearchQuery: string;
  enabled: Record<string, boolean>;
  baseMapId: string;
  favorites: string[];
  setPanelOpen: (open: boolean) => void;
  setSettingsPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  toggleSettingsPanel: () => void;
  setSearchQuery: (query: string) => void;
  setSettingsSearchQuery: (query: string) => void;
  isEnabled: (layerId: string) => boolean;
  toggleLayer: (layerId: string) => void;
  setBaseMap: (layerId: string) => void;
  toggleFavorite: (layerId: string) => void;
};

function applySingleSelect(
  enabled: Record<string, boolean>,
  categoryId: string,
  selectedId: string
): Record<string, boolean> {
  const next = { ...enabled };

  for (const layer of MAP_LAYER_CATALOG) {
    if (layer.categoryId === categoryId) {
      next[layer.id] = layer.id === selectedId;
    }
  }
  next[selectedId] = true;
  return next;
}

function migrateLegacyStyleId(id: string | undefined): string {
  if (!id) return DEFAULT_BASE_MAP_ID;
  if (id === "globe-night-view" || id === "base-dark") return "base-night";
  if (id === "globe-realistic-earth") return DEFAULT_BASE_MAP_ID;
  const layer = getLayerById(id);
  return layer?.categoryId === "base" ? id : DEFAULT_BASE_MAP_ID;
}

export const useMapLayersStore = create<MapLayersState>()(
  persist(
    (set, get) => ({
      panelOpen: false,
      settingsPanelOpen: false,
      searchQuery: "",
      settingsSearchQuery: "",
      enabled: buildDefaultEnabledMap(),
      baseMapId: DEFAULT_BASE_MAP_ID,
      favorites: ["duo-profiles", "base-satellite"],

      setPanelOpen: (open) =>
        set(open ? { panelOpen: true, settingsPanelOpen: false } : { panelOpen: false }),
      setSettingsPanelOpen: (open) =>
        set(open ? { settingsPanelOpen: true, panelOpen: false } : { settingsPanelOpen: false }),
      togglePanel: () =>
        set((s) => ({
          panelOpen: !s.panelOpen,
          settingsPanelOpen: false,
        })),
      toggleSettingsPanel: () =>
        set((s) => ({
          settingsPanelOpen: !s.settingsPanelOpen,
          panelOpen: false,
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSettingsSearchQuery: (query) => set({ settingsSearchQuery: query }),

      isEnabled: (layerId) => Boolean(get().enabled[layerId]),

      toggleLayer: (layerId) => {
        const layer = getLayerById(layerId);
        if (!layer) return;

        const category = getCategoryById(layer.categoryId);
        if (!category) return;

        if (category.selectionMode === "single" && layer.categoryId === "base") {
          set((s) => ({
            baseMapId: layerId,
            enabled: applySingleSelect(s.enabled, "base", layerId),
          }));
          return;
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
        favorites: state.favorites,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<MapLayersState> & { globeModeId?: string } | undefined;
        const favorites = (p?.favorites ?? current.favorites).filter(isCatalogLayerId);
        const fromLegacyNight =
          p?.globeModeId === "globe-night-view" ? "base-night" : undefined;
        const baseMapId = migrateLegacyStyleId(fromLegacyNight ?? p?.baseMapId);
        return {
          ...current,
          ...p,
          enabled: sanitizeEnabledMap({
            ...p?.enabled,
            [baseMapId]: true,
          }),
          favorites,
          baseMapId,
        };
      },
    }
  )
);
