import type { MapLayerCategory, MapLayerCategoryId, MapLayerDefinition } from "./types";

export const MAP_LAYER_CATEGORIES: MapLayerCategory[] = [
  { id: "base", label: "Base Map", icon: "map", selectionMode: "single" },
  { id: "globe", label: "Globe Appearance", icon: "public", selectionMode: "single" },
  { id: "geographic", label: "Geographic", icon: "terrain", selectionMode: "multi" },
  { id: "weather", label: "Snap Weather", icon: "partly_cloudy_day", selectionMode: "multi" },
  { id: "duo", label: "Duo", icon: "favorite", selectionMode: "multi" },
  { id: "developer", label: "Developer", icon: "code", selectionMode: "multi" },
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
  // Base maps (each resolves to a distinct style)
  L("base", "base-standard-street", "Standard Street Map", "map", { defaultOn: true }),
  L("base", "base-satellite", "Satellite", "satellite_alt"),
  L("base", "base-satellite-labels", "Satellite + Labels", "layers"),
  L("base", "base-topographic", "Topographic", "filter_hdr"),
  L("base", "base-dark", "Dark Mode", "dark_mode"),
  L("base", "base-light", "Light Mode", "light_mode"),

  // Globe appearance
  L("globe", "globe-realistic-earth", "Realistic Earth", "public", { defaultOn: true }),
  L("globe", "globe-nasa-blue-marble", "NASA Blue Marble", "photo_camera"),
  L("globe", "globe-day-view", "Day View", "wb_sunny"),
  L("globe", "globe-night-view", "Night View (City Lights)", "bedtime"),
  L("globe", "globe-terrain-elevation", "Terrain Elevation", "elevation"),
  L("globe", "globe-atmosphere", "Atmosphere", "blur_on", { defaultOn: true }),
  L("globe", "globe-earth-glow", "Earth Glow", "flare", { defaultOn: true }),

  // Geographic overlays
  L("geographic", "geo-country-borders", "Country Borders", "flag"),
  L("geographic", "geo-state-borders", "State/Province Borders", "map"),
  L("geographic", "geo-coastlines", "Coastlines", "waves"),
  L("geographic", "geo-oceans", "Oceans", "water"),

  // Snap Map–style live weather (animated ambience, not GIS tiles)
  L("weather", "weather-live", "Live Weather", "partly_cloudy_day", {
    defaultOn: true,
    description: "Animated atmospheric weather across the globe and map",
  }),
  L("weather", "weather-rain", "Rain", "rainy", { defaultOn: true }),
  L("weather", "weather-snow", "Snow", "ac_unit"),
  L("weather", "weather-sunny", "Sunshine", "wb_sunny", { defaultOn: true }),
  L("weather", "weather-clouds", "Cloud Drift", "cloud", { defaultOn: true }),
  L("weather", "weather-wind", "Wind Flow", "air"),
  L("weather", "weather-fog", "Fog & Mist", "foggy"),
  L("weather", "weather-storms", "Storms", "thunderstorm"),
  L("weather", "weather-temperature", "Temperature Feel", "thermostat", { defaultOn: true }),
  L("weather", "weather-day-night", "Day & Night", "brightness_3"),

  // Duo map markers
  L("duo", "duo-profiles", "Matches & Profiles", "favorite", { defaultOn: true }),
  L("duo", "duo-user-location", "Your Location", "my_location", { defaultOn: true }),

  // Developer tools
  L("developer", "dev-tile-grid", "Tile Grid", "grid_3x3"),
  L("developer", "dev-fps", "FPS Counter", "speed"),
  L("developer", "dev-camera-info", "Camera Information", "videocam"),
];

export const DEFAULT_BASE_MAP_ID = "base-standard-street";
export const DEFAULT_GLOBE_MODE_ID = "globe-realistic-earth";

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
  enabled[DEFAULT_GLOBE_MODE_ID] = true;
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
  next[DEFAULT_BASE_MAP_ID] = true;
  next[DEFAULT_GLOBE_MODE_ID] = true;
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
