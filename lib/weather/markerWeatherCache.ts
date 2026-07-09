import { ambienceFromCurrent, moodFromMain, type WeatherMood } from "./conditions";
import { fetchCurrentWeather } from "./api";

type CacheEntry = { mood: WeatherMood; expires: number };

const cache = new Map<string, CacheEntry>();
const TTL_MS = 8 * 60_000;
const inflight = new Map<string, Promise<WeatherMood>>();

function key(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

export async function getMarkerWeather(lat: number, lon: number): Promise<WeatherMood> {
  const k = key(lat, lon);
  const hit = cache.get(k);
  if (hit && hit.expires > Date.now()) return hit.mood;

  const pending = inflight.get(k);
  if (pending) return pending;

  const promise = fetchCurrentWeather(lat, lon)
    .then((raw) => {
      const ambience = ambienceFromCurrent(raw as Parameters<typeof ambienceFromCurrent>[0]);
      const mood = ambience.mood ?? moodFromMain((raw as { weather?: Array<{ main?: string }> }).weather?.[0]?.main);
      cache.set(k, { mood, expires: Date.now() + TTL_MS });
      inflight.delete(k);
      return mood;
    })
    .catch(() => {
      inflight.delete(k);
      return "clear" as WeatherMood;
    });

  inflight.set(k, promise);
  return promise;
}

export function prefetchMarkerWeather(coords: Array<{ lat: number; lon: number }>) {
  for (const c of coords) {
    void getMarkerWeather(c.lat, c.lon);
  }
}
