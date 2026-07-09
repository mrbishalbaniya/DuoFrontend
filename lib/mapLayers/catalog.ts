import type { MapLayerCategory, MapLayerCategoryId, MapLayerDefinition } from "./types";

export const MAP_LAYER_CATEGORIES: MapLayerCategory[] = [
  { id: "base", label: "Map Style", icon: "map", selectionMode: "single" },
  { id: "globe-fx", label: "Globe Effects", icon: "blur_on", selectionMode: "multi" },
  { id: "weather", label: "Weather", icon: "partly_cloudy_day", selectionMode: "multi" },
  { id: "geographic", label: "Geographic", icon: "terrain", selectionMode: "multi" },
  { id: "duo", label: "Duo", icon: "favorite", selectionMode: "multi" },
  { id: "developer", label: "Developer", icon: "code", selectionMode: "multi" },
];

/** Shown in the primary layers sheet (map controls). */
export const MAP_LAYERS_MAIN_CATEGORIES: MapLayerCategoryId[] = ["base"];

/** Shown in the map settings sheet (tune icon). */
export const MAP_LAYERS_SETTINGS_CATEGORIES: MapLayerCategoryId[] = [
  "globe-fx",
  "duo",
  "weather",
  "geographic",
  "developer",
];

function L(
  categoryId: MapLayerDefinition["categoryId"],
  id: string,
  label: string,
  icon: string,
  opts: Partial<MapLayerDefinition> = {}
): MapLayerDefinition {
  return {
    id,
    categoryId,
    label,
    icon,
    defaultOn: opts.defaultOn,
    description: opts.description,
    keywords: opts.keywords,
  };
}

/** Only layers wired to the map engine, markers, starfield, or debug HUD. */
export const MAP_LAYER_CATALOG: MapLayerDefinition[] = [
  // Map style (single pick)
  L("base", "base-standard-street", "Standard Street", "map", { defaultOn: true }),
  L("base", "base-satellite", "Satellite", "satellite_alt"),
  L("base", "base-night", "Night View", "bedtime"),

  L("globe-fx", "globe-atmosphere", "Atmosphere", "blur_on", { defaultOn: true }),
  L("globe-fx", "globe-earth-glow", "Earth Glow", "flare", { defaultOn: true }),

  L("weather", "weather-live", "Live Weather", "partly_cloudy_day", {
    defaultOn: true,
    description: "Animated weather across the globe",
  }),

  L("geographic", "geo-country-borders", "Country Borders", "flag"),
  L("geographic", "geo-state-borders", "State Borders", "map"),
  L("geographic", "geo-coastlines", "Coastlines", "waves"),

  L("duo", "duo-profiles", "3D Matches & Avatars", "favorite", { defaultOn: true }),
  L("duo", "duo-user-location", "Your Location", "my_location", { defaultOn: true }),
  L("duo", "duo-activity-heatmap", "Live Activity Heatmap", "local_fire_department", {
    defaultOn: true,
    description: "Glowing social activity zones",
  }),
  L("duo", "duo-activity-trending", "Trending Zones", "whatshot"),
  L("duo", "duo-activity-nearby", "Nearby Activity", "near_me"),
  L("duo", "duo-activity-events", "Events", "celebration"),
  L("duo", "duo-activity-friends", "Friends Activity", "group"),

  L("developer", "dev-tile-grid", "Tile Grid", "grid_3x3"),
  L("developer", "dev-fps", "FPS Counter", "speed"),
  L("developer", "dev-camera-info", "Camera Info", "videocam"),
];

export const DEFAULT_BASE_MAP_ID = "base-standard-street";

const CATALOG_IDS = new Set(MAP_LAYER_CATALOG.map((layer) => layer.id));

export function isCatalogLayerId(id: string): boolean {
  return CATALOG_IDS.has(id);
}

export function buildDefaultEnabledMap(): Record<string, boolean> {
  const enabled: Record<string, boolean> = {};
  for (const layer of MAP_LAYER_CATALOG) {
    if (layer.defaultOn) enabled[layer.id] = true;
  }
  enabled[DEFAULT_BASE_MAP_ID] = true;
  return enabled;
}

export function sanitizeEnabledMap(
  enabled: Record<string, boolean> | undefined
): Record<string, boolean> {
  const next = buildDefaultEnabledMap();
  if (!enabled) return next;
  for (const layer of MAP_LAYER_CATALOG) {
    if (enabled[layer.id] !== undefined) next[layer.id] = enabled[layer.id];
  }
  // Ensure exactly one map style is selected
  const styleIds = MAP_LAYER_CATALOG.filter((l) => l.categoryId === "base").map((l) => l.id);
  const activeStyle = styleIds.find((id) => next[id]);
  for (const id of styleIds) next[id] = id === (activeStyle ?? DEFAULT_BASE_MAP_ID);
  return next;
}

export function getLayerById(id: string): MapLayerDefinition | undefined {
  return MAP_LAYER_CATALOG.find((l) => l.id === id);
}

export function getCategoryById(id: MapLayerDefinition["categoryId"]): MapLayerCategory | undefined {
  return MAP_LAYER_CATEGORIES.find((c) => c.id === id);
}

export function getLayersForCategory(categoryId: MapLayerCategoryId): MapLayerDefinition[] {
  return MAP_LAYER_CATALOG.filter((layer) => layer.categoryId === categoryId);
}
