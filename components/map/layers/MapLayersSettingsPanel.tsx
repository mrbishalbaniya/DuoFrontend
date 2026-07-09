"use client";

import {
  MAP_LAYERS_SETTINGS_CATEGORIES,
  getLayersForCategory,
} from "@/lib/mapLayers/catalog";
import { useMapLayersStore } from "@/lib/mapLayers/store";

import { MapLayersSheet } from "./MapLayersPanel";

export default function MapLayersSettingsPanel() {
  const settingsPanelOpen = useMapLayersStore((s) => s.settingsPanelOpen);
  const setSettingsPanelOpen = useMapLayersStore((s) => s.setSettingsPanelOpen);
  const searchQuery = useMapLayersStore((s) => s.settingsSearchQuery);
  const setSearchQuery = useMapLayersStore((s) => s.setSettingsSearchQuery);

  const optionCount = MAP_LAYERS_SETTINGS_CATEGORIES.reduce(
    (n, id) => n + getLayersForCategory(id).length,
    0
  );

  return (
    <MapLayersSheet
      open={settingsPanelOpen}
      onClose={() => setSettingsPanelOpen(false)}
      panelId="map-layers-settings-panel"
      title="Map Settings"
      subtitle={`${optionCount} options · Duo, effects, weather & more`}
      categoryIds={MAP_LAYERS_SETTINGS_CATEGORIES}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showFavorites
    />
  );
}
