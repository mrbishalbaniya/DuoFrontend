export function isSnapWeatherLive(enabled: Record<string, boolean>): boolean {
  return enabled["weather-live"] === true;
}

export function snapAtmosphereFlags(enabled: Record<string, boolean>) {
  const live = isSnapWeatherLive(enabled);
  return {
    live,
    temperature: live,
    clouds: live,
    sunny: live,
    fog: live,
    storms: live,
  };
}

export function snapParticleFlags(enabled: Record<string, boolean>) {
  const live = isSnapWeatherLive(enabled);
  return {
    live,
    rain: live,
    snow: live,
    wind: live,
    storms: live,
  };
}

export function isSnapWeatherLayerActive(enabled: Record<string, boolean>): boolean {
  return isSnapWeatherLive(enabled);
}

/** Legacy no-op — GIS raster tiles removed in Snap Map mode. */
export function applyWeatherRasterLayers(
  _map: import("maplibre-gl").Map,
  _enabled: Record<string, boolean>
) {
  /* intentionally empty */
}

export function removeWeatherGridLayer(_map: import("maplibre-gl").Map) {
  /* intentionally empty */
}
