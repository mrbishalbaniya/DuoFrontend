import type { Map as MapLibreMap } from "maplibre-gl";

/** Master Snap Map live weather toggle. */
export function isSnapWeatherLive(enabled: Record<string, boolean>): boolean {
  return enabled["weather-live"] === true;
}

export function snapAtmosphereFlags(enabled: Record<string, boolean>) {
  const live = isSnapWeatherLive(enabled);
  return {
    live,
    temperature: live && enabled["weather-temperature"] !== false,
    clouds: live && enabled["weather-clouds"] !== false,
    sunny: live && enabled["weather-sunny"] !== false,
    fog: live && enabled["weather-fog"] === true,
    storms: live && enabled["weather-storms"] === true,
  };
}

export function snapParticleFlags(enabled: Record<string, boolean>) {
  const live = isSnapWeatherLive(enabled);
  return {
    live,
    rain: live && enabled["weather-rain"] !== false,
    snow: live && enabled["weather-snow"] === true,
    wind: live && enabled["weather-wind"] === true,
    storms: live && enabled["weather-storms"] === true,
  };
}

export function isSnapWeatherLayerActive(enabled: Record<string, boolean>): boolean {
  return isSnapWeatherLive(enabled);
}

/** Legacy no-op — GIS raster tiles removed in Snap Map mode. */
export function applyWeatherRasterLayers(_map: MapLibreMap, _enabled: Record<string, boolean>) {
  /* intentionally empty */
}

export function removeWeatherGridLayer(_map: MapLibreMap) {
  /* intentionally empty */
}
