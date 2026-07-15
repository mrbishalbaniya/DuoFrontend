/** City centers in Nepal for map pins and nearest-city detection. */
export const NEPAL_CITY_COORDS: Record<string, [number, number]> = {
  kathmandu: [27.7172, 85.324],
  lalitpur: [27.6588, 85.3247],
  pokhara: [28.2096, 83.9856],
  bhaktapur: [27.671, 85.4298],
  chitwan: [27.5291, 84.3542],
  biratnagar: [26.4525, 87.2718],
  dharan: [26.8147, 87.2848],
  butwal: [27.7, 83.4483],
};

export const NEPAL_CITY_NAMES = Object.keys(NEPAL_CITY_COORDS).map(
  (city) => city.charAt(0).toUpperCase() + city.slice(1)
);

const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function parseGpsFromPrefValues(
  prefValues?: string | null
): [number, number] | null {
  if (!prefValues?.trim()) return null;
  try {
    const parsed = JSON.parse(prefValues) as {
      gps?: { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
    };
    const lat = Number(parsed.gps?.lat ?? parsed.gps?.latitude);
    const lng = Number(parsed.gps?.lng ?? parsed.gps?.longitude);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      return [lat, lng];
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
}

export function findCityCenter(location: string): [number, number] {
  const normalized = location.toLowerCase();
  for (const [city, coords] of Object.entries(NEPAL_CITY_COORDS)) {
    if (normalized.includes(city)) return coords;
  }
  return DEFAULT_CENTER;
}

export function nearestNepalCity(lat: number, lng: number): string {
  let bestCity = "Kathmandu";
  let bestDistance = Infinity;

  for (const [city, [cityLat, cityLng]] of Object.entries(NEPAL_CITY_COORDS)) {
    const distance = haversineKm(lat, lng, cityLat, cityLng);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCity = city;
    }
  }

  return bestCity.charAt(0).toUpperCase() + bestCity.slice(1);
}

/** Prefer live map coords, then saved GPS, then city center with slight spread. */
export function resolveProfileCoordinates(
  location: string | undefined,
  userId: number | string | undefined,
  prefValues?: string | null,
  mapLatitude?: number | null,
  mapLongitude?: number | null
): [number, number] {
  if (
    typeof mapLatitude === "number" &&
    typeof mapLongitude === "number" &&
    Number.isFinite(mapLatitude) &&
    Number.isFinite(mapLongitude) &&
    Math.abs(mapLatitude) <= 90 &&
    Math.abs(mapLongitude) <= 180
  ) {
    return [mapLatitude, mapLongitude];
  }

  const gps = parseGpsFromPrefValues(prefValues);
  if (gps) return gps;

  const base = findCityCenter(location?.trim() || "Kathmandu, Nepal");
  const seed = hashSeed(String(userId ?? location ?? "0"));
  const angle = (seed % 360) * (Math.PI / 180);
  const radius = 0.008 + (seed % 100) / 10000;
  return [
    base[0] + Math.cos(angle) * radius,
    base[1] + Math.sin(angle) * radius,
  ];
}

export const NEPAL_MAP_DEFAULT_CENTER: [number, number] = DEFAULT_CENTER;
