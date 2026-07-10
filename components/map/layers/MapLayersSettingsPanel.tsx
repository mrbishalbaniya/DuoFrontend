"use client";

import { useEffect, useState } from "react";
import {
  MAP_LAYERS_SETTINGS_CATEGORIES,
  getLayersForCategory,
} from "@/lib/mapLayers/catalog";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import LocationPrivacySettings from "@/components/map/LocationPrivacySettings";

import { MapLayersSheet } from "./MapLayersPanel";

/** Mobile/tablet floating sheet. Desktop uses MapSettingsSidebar on the map page. */
export default function MapLayersSettingsPanel() {
  const [isDesktop, setIsDesktop] = useState(false);
  const settingsPanelOpen = useMapLayersStore((s) => s.settingsPanelOpen);
  const setSettingsPanelOpen = useMapLayersStore((s) => s.setSettingsPanelOpen);
  const searchQuery = useMapLayersStore((s) => s.settingsSearchQuery);
  const setSearchQuery = useMapLayersStore((s) => s.setSettingsSearchQuery);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (isDesktop) return null;

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
      subtitle={`Privacy · ${optionCount} map options`}
      categoryIds={MAP_LAYERS_SETTINGS_CATEGORIES}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showFavorites
      prepend={
        <div className="px-3 pt-2">
          <LocationPrivacySettings />
        </div>
      }
    />
  );
}
