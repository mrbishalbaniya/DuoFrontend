import { nearestNepalCity } from "@/lib/locationCoords";

export type DetectedLocation = {
  label: string;
  city: string;
  coordinates: [number, number];
};

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeolocationError";
  }
}

export function getDevicePosition(): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new GeolocationError("Location is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new GeolocationError("Location permission denied. Enable it in browser settings."));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new GeolocationError("Location request timed out. Try again."));
          return;
        }
        reject(new GeolocationError("Could not detect your location."));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

async function reverseGeocodeLabel(lat: number, lng: number): Promise<string | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
        country?: string;
      };
    };

    const address = data.address;
    if (!address) return null;

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.state;

    if (!city) return null;

    const country = address.country || "Nepal";
    return `${city}, ${country}`;
  } catch {
    return null;
  }
}

export async function detectUserLocation(): Promise<DetectedLocation> {
  const [lat, lng] = await getDevicePosition();
  const reverseLabel = await reverseGeocodeLabel(lat, lng);
  const nearestCity = nearestNepalCity(lat, lng);
  const label = reverseLabel ?? `${nearestCity}, Nepal`;

  return {
    label,
    city: nearestCity,
    coordinates: [lat, lng],
  };
}

export function isDefaultLocation(location?: string | null): boolean {
  const value = location?.trim().toLowerCase() ?? "";
  return !value || value === "kathmandu, nepal" || value === "kathmandu";
}
