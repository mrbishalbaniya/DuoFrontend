import { getClientApiBase } from "@/lib/backendUrl";
import type { WeatherGridPoint, WeatherSummary } from "./types";

const base = () => getClientApiBase();

async function weatherGet<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : "Weather request failed";
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function weatherTileUrl(layer: string, z: number, x: number, y: number): string {
  return `${base()}/weather/tiles/${layer}/${z}/${x}/${y}.png`;
}

export function fetchWeatherSummary(lat: number, lon: number): Promise<WeatherSummary> {
  return weatherGet(`/weather/summary/?lat=${lat}&lon=${lon}`);
}

export function fetchWeatherGrid(
  bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number },
  step = 3
): Promise<WeatherGridPoint[]> {
  const q = new URLSearchParams({
    lat_min: String(bbox.latMin),
    lat_max: String(bbox.latMax),
    lon_min: String(bbox.lonMin),
    lon_max: String(bbox.lonMax),
    step: String(step),
  });
  return weatherGet(`/weather/grid/?${q}`);
}

export function fetchCurrentWeather(lat: number, lon: number) {
  return weatherGet(`/weather/current/?lat=${lat}&lon=${lon}`);
}

export function fetchForecastWeather(lat: number, lon: number) {
  return weatherGet(`/weather/forecast/?lat=${lat}&lon=${lon}`);
}

export function fetchOneCallWeather(lat: number, lon: number) {
  return weatherGet(`/weather/onecall/?lat=${lat}&lon=${lon}`);
}

export function fetchAirPollution(lat: number, lon: number) {
  return weatherGet(`/weather/air-pollution/?lat=${lat}&lon=${lon}`);
}
