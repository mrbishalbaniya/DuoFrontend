/**
 * Shared-location messages are plain text containing a standard Google Maps
 * link, so they open in Google Maps on any device (web, Android, iOS) and
 * degrade to a clickable link in clients that don't render the card.
 */

export type SharedLocation = { lat: number; lng: number; url: string; address?: string };

export const LOCATION_MESSAGE_PREFIX = "Shared location";

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * "Shared location: <address>\n<google maps url>" -- the address line is
 * optional so plain-text clients still show something readable.
 */
export function buildLocationMessage(lat: number, lng: number, address?: string | null) {
  const clean = (address || "").replace(/\s+/g, " ").trim().slice(0, 160);
  const url = googleMapsUrl(lat, lng);
  return clean ? `${LOCATION_MESSAGE_PREFIX}: ${clean}\n${url}` : `${LOCATION_MESSAGE_PREFIX}: ${url}`;
}

type ReverseResponse = {
  label?: string;
  place?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: Record<string, string | undefined>;
};

/** "Kathmandu Metropolitan City" -> "Kathmandu", "Lalitpur Sub-Metropolitan City" -> "Lalitpur". */
function shortCity(name: string) {
  return name
    .replace(/\s+(Sub-?Metropolitan City|Metropolitan City|Rural Municipality|Municipality|City)$/i, "")
    .trim();
}

/** Short human address (street, area, city) via the app's reverse-geocode route. */
export async function fetchAddress(lat: number, lng: number, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as ReverseResponse;
    const a = data.address ?? {};
    // Short form: "Street, Area, City" -- no house number, postcode or country.
    const street = a.road || a.pedestrian || a.footway || "";
    const area = a.neighbourhood || a.suburb || a.quarter || data.place || "";
    const city = shortCity(a.city || a.town || a.village || data.city || a.county || "");
    const parts = [street, area, city].map((p) => p.trim()).filter(Boolean);
    const unique = parts.filter((p, i) => parts.indexOf(p) === i);
    if (unique.length) return unique.join(", ");
    return data.label?.split(",").slice(0, 3).join(",").trim() || null;
  } catch {
    return null;
  }
}

const COORD = String.raw`(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)`;
const PATTERNS = [
  new RegExp(String.raw`google\.[a-z.]+/maps/search/\?api=1&query=${COORD}`, "i"),
  new RegExp(String.raw`google\.[a-z.]+/maps\?q=${COORD}`, "i"),
  new RegExp(String.raw`google\.[a-z.]+/maps/@${COORD}`, "i"),
  new RegExp(String.raw`maps\.google\.[a-z.]+/\?q=${COORD}`, "i"),
];

/** Returns the location if the whole message is a shared location link. */
export function parseLocationMessage(content?: string | null): SharedLocation | null {
  const text = (content || "").trim();
  if (!text || text.length > 300) return null;
  const urlMatch = text.match(/https?:\/\/\S+/);
  if (!urlMatch) return null;
  // Only treat it as a location card when the message is essentially just the link.
  const hasPrefix = text.startsWith(`${LOCATION_MESSAGE_PREFIX}:`);
  const rest = text.replace(urlMatch[0], "").replace(`${LOCATION_MESSAGE_PREFIX}:`, "").trim();
  // Without our prefix, only a bare link counts; with it, the rest is the address.
  if (rest.length > 0 && !hasPrefix) return null;
  const address = rest || undefined;
  for (const re of PATTERNS) {
    const m = urlMatch[0].match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng, url: urlMatch[0], address };
    }
  }
  return null;
}

export class LocationError extends Error {}

export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new LocationError("Location isn't supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new LocationError("Location access is blocked. Allow it in the browser's site settings."));
        } else if (err.code === err.TIMEOUT) {
          reject(new LocationError("Finding your location took too long. Try again."));
        } else {
          reject(new LocationError("Couldn't find your location."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });
}
