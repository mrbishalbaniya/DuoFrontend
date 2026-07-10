"use client";

import {
  MAP_LAYERS_SETTINGS_CATEGORIES,
  getLayersForCategory,
} from "@/lib/mapLayers/catalog";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { MapLayersContent } from "@/components/map/layers/MapLayersPanel";
import LocationPrivacySettings from "@/components/map/LocationPrivacySettings";

interface MapSettingsSidebarProps {
  open?: boolean;
}

export default function MapSettingsSidebar({ open = true }: MapSettingsSidebarProps) {
  const setSettingsPanelOpen = useMapLayersStore((s) => s.setSettingsPanelOpen);
  const searchQuery = useMapLayersStore((s) => s.settingsSearchQuery);
  const setSearchQuery = useMapLayersStore((s) => s.setSettingsSearchQuery);

  const optionCount = MAP_LAYERS_SETTINGS_CATEGORIES.reduce(
    (n, id) => n + getLayersForCategory(id).length,
    0
  );

  if (!open) return null;

  return (
    <aside
      id="map-layers-settings-panel"
      className="map-settings-sidebar hidden h-full shrink-0 flex-col border-l border-outline-variant/20 bg-surface md:flex"
      aria-label="Map settings"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-4 lg:px-5 lg:pt-5">
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold tracking-tight text-on-surface lg:text-[22px]">
            Settings
          </h1>
          <p className="mt-0.5 text-[12px] text-on-surface-variant lg:text-[13px]">
            Privacy · {optionCount} map options
          </p>
        </div>
        <button
          type="button"
          aria-label="Close settings"
          onClick={() => setSettingsPanelOpen(false)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface active:scale-95"
        >
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </div>

      <div className="map-settings-sidebar__body flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-4 lg:px-4">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <LocationPrivacySettings />
          <MapLayersContent
            categoryIds={MAP_LAYERS_SETTINGS_CATEGORIES}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showFavorites
            showSearch
            titleForSearch="map settings"
          />
        </div>
      </div>
    </aside>
  );
}
