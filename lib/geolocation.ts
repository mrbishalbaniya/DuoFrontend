import { nearestNepalCity } from "@/lib/locationCoords";
import { NEPAL_PROVINCES } from "@/lib/register/constants";

export type DetectedLocation = {
  label: string;
  /** Neighbourhood / locality (e.g. Sinamangal). */
  place: string;
  city: string;
  district: string;
  province: string;
  country: string;
  coordinates: [number, number];
  accuracyMeters: number | null;
};

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeolocationError";
  }
}

type DeviceFix = {
  coordinates: [number, number];
  accuracyMeters: number | null;
};

/** Prefer a fresh high-accuracy fix; briefly watch for a better reading when possible. */
export function getDevicePosition(): Promise<DeviceFix> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new GeolocationError("Location is not supported on this device."));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    };

    let settled = false;
    let best: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (finishTimer != null) {
        clearTimeout(finishTimer);
        finishTimer = null;
      }
    };

    const finish = (position: GeolocationPosition) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        coordinates: [position.coords.latitude, position.coords.longitude],
        accuracyMeters:
          typeof position.coords.accuracy === "number" && Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : null,
      });
    };

    const fail = (error: GeolocationPositionError) => {
      if (settled) return;
      if (best) {
        finish(best);
        return;
      }
      settled = true;
      cleanup();
      if (error.code === error.PERMISSION_DENIED) {
        reject(new GeolocationError("Location permission denied. Enable it in browser settings."));
        return;
      }
      if (error.code === error.TIMEOUT) {
        reject(new GeolocationError("Location request timed out. Try again outdoors or near a window."));
        return;
      }
      reject(new GeolocationError("Could not detect your location."));
    };

    const consider = (position: GeolocationPosition) => {
      if (!best || position.coords.accuracy < best.coords.accuracy) {
        best = position;
      }
      // Good enough for city/neighborhood fill
      if (position.coords.accuracy > 0 && position.coords.accuracy <= 40) {
        finish(position);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        consider(position);
        if (settled) return;

        watchId = navigator.geolocation.watchPosition(consider, fail, options);
        finishTimer = setTimeout(() => {
          if (best) {
            finish(best);
            return;
          }
          settled = true;
          cleanup();
          reject(
            new GeolocationError(
              "Location request timed out. Try again outdoors or near a window."
            )
          );
        }, 8000);
      },
      fail,
      options
    );
  });
}

type ReverseGeocodeResult = {
  label: string;
  place: string;
  city: string;
  district: string;
  state: string;
  country: string;
};

function mapNepalProvince(state: string): string {
  const value = state.toLowerCase();
  const aliases: Array<{ match: RegExp; province: (typeof NEPAL_PROVINCES)[number] }> = [
    { match: /koshi|province\s*(no\.?\s*)?1|प्रदेश\s*१/, province: "Koshi" },
    { match: /madhesh|madesh|province\s*(no\.?\s*)?2|प्रदेश\s*२/, province: "Madhesh" },
    { match: /bagmati|province\s*(no\.?\s*)?3|प्रदेश\s*३/, province: "Bagmati" },
    { match: /gandaki|province\s*(no\.?\s*)?4|प्रदेश\s*४/, province: "Gandaki" },
    { match: /lumbini|province\s*(no\.?\s*)?5|प्रदेश\s*५/, province: "Lumbini" },
    { match: /karnali|province\s*(no\.?\s*)?6|प्रदेश\s*६/, province: "Karnali" },
    { match: /sudur|far.?west|province\s*(no\.?\s*)?7|प्रदेश\s*७/, province: "Sudurpashchim" },
  ];

  for (const alias of aliases) {
    if (alias.match.test(value)) return alias.province;
  }

  for (const province of NEPAL_PROVINCES) {
    if (value.includes(province.toLowerCase())) return province;
  }

  return "";
}

async function reverseGeocodeViaProxy(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const url = new URL("/api/geocode/reverse", window.location.origin);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as ReverseGeocodeResult & { place?: string };
    if (!data.label && !data.city && !data.place) return null;
    return {
      label: data.label || "",
      place: data.place || "",
      city: data.city || "",
      district: data.district || "",
      state: data.state || "",
      country: data.country || "",
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeViaBigDataCloud(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("localityLanguage", "en");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      locality?: string;
      city?: string;
      principalSubdivision?: string;
      countryName?: string;
      localityInfo?: {
        administrative?: Array<{ name?: string; adminLevel?: number; description?: string }>;
        informative?: Array<{ name?: string; description?: string }>;
      };
    };

    const admins = data.localityInfo?.administrative ?? [];
    const district =
      admins.find((item) => item.adminLevel === 5 || item.adminLevel === 6)?.name ||
      admins.find((item) => item.adminLevel === 4)?.name ||
      "";

    const cityName = (data.city || "").trim();
    const localityName = (data.locality || "").trim();
    const place =
      localityName && localityName.toLowerCase() !== cityName.toLowerCase() ? localityName : "";
    const city = cityName || localityName || district || "";
    const state = data.principalSubdivision || "";
    const country = data.countryName || "";
    const label = [place, city, district, state, country].filter(Boolean).join(", ");

    if (!label) return null;
    return {
      label,
      place,
      city,
      district: district || "",
      state,
      country,
    };
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const [bigData, nominatim] = await Promise.all([
    reverseGeocodeViaBigDataCloud(lat, lng),
    reverseGeocodeViaProxy(lat, lng),
  ]);

  // Prefer a result that includes a neighbourhood / place name.
  if (nominatim?.place?.trim()) return nominatim;
  if (bigData?.place?.trim()) return bigData;

  // Otherwise prefer English BigDataCloud, then Nominatim.
  return bigData ?? nominatim;
}

const NEPALI_TO_ENGLISH: Record<string, string> = {
  नेपाल: "Nepal",
  "बागमती प्रदेश": "Bagmati",
  बागमती: "Bagmati",
  "काठमाडौं जिल्ला": "Kathmandu",
  काठमाडौँ: "Kathmandu",
  काठमाडौं: "Kathmandu",
  "काठमाडौं महानगरपालिका": "Kathmandu",
  ललितपुर: "Lalitpur",
  "ललितपुर जिल्ला": "Lalitpur",
  भक्तपुर: "Bhaktapur",
  पोखरा: "Pokhara",
  गण्डकी: "Gandaki",
  "गण्डकी प्रदेश": "Gandaki",
  लुम्बिनी: "Lumbini",
  "लुम्बिनी प्रदेश": "Lumbini",
  कोशी: "Koshi",
  "कोशी प्रदेश": "Koshi",
  मधेश: "Madhesh",
  "मधेश प्रदेश": "Madhesh",
  कर्णाली: "Karnali",
  "कर्णाली प्रदेश": "Karnali",
  सुदूरपश्चिम: "Sudurpashchim",
  "सुदूरपश्चिम प्रदेश": "Sudurpashchim",
};

function toEnglishPlaceName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (NEPALI_TO_ENGLISH[trimmed]) return NEPALI_TO_ENGLISH[trimmed];

  // Strip common Nepali suffixes then map again
  const withoutSuffix = trimmed
    .replace(/\s*(महानगरपालिका|उपमहानगरपालिका|नगरपालिका|गाउँपालिका|जिल्ला|प्रदेश)\s*$/u, "")
    .trim();
  if (withoutSuffix && NEPALI_TO_ENGLISH[withoutSuffix]) {
    return NEPALI_TO_ENGLISH[withoutSuffix];
  }

  // If still mostly Devanagari, drop to empty so fallbacks can replace
  if (/[\u0900-\u097F]/.test(trimmed) && !/[A-Za-z]/.test(trimmed)) {
    return "";
  }

  return trimmed.replace(/\s+Province$/i, "").trim();
}

function localizeResult(result: ReverseGeocodeResult): ReverseGeocodeResult {
  const place = toEnglishPlaceName(result.place);
  const city = toEnglishPlaceName(result.city);
  const district = toEnglishPlaceName(result.district);
  const state = toEnglishPlaceName(result.state);
  const country = toEnglishPlaceName(result.country) || result.country;
  const labelParts = [
    place || result.place,
    city || result.city,
    district || result.district,
    state || result.state,
    country,
  ]
    .map((part) => toEnglishPlaceName(part) || part)
    .filter(Boolean);

  const label =
    /[\u0900-\u097F]/.test(result.label) && labelParts.length
      ? [...new Set(labelParts)].join(", ")
      : toEnglishPlaceName(result.label) || result.label;

  return {
    label,
    place: place || result.place,
    city: city || result.city,
    district: district || result.district,
    state: state || result.state,
    country: country || result.country,
  };
}

function compactLabel(parts: Array<string | undefined | null>): string {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique.join(", ");
}

/** Strip verbose admin suffixes for UI / profile location strings. */
export function tidyPlaceName(value: string): string {
  return value
    .trim()
    .replace(
      /\s+(Metropolitan City|Sub[-\s]?Metropolitan City|Municipality|Rural Municipality|Nagarpalika|Gaunpalika|District)\s*$/i,
      ""
    )
    .replace(/\s+Province$/i, "")
    .replace(/-\d+\s*$/i, "")
    .trim();
}

/** Short UI line: place + city, e.g. "Sinamangal, Kathmandu". */
export function formatShortLocationLabel(input: {
  place?: string;
  city?: string;
  district?: string;
  province?: string;
  country?: string;
}): string {
  const place = tidyPlaceName(input.place || "");
  const city = tidyPlaceName(input.city || "");
  const district = tidyPlaceName(input.district || "");

  if (place && city && place.toLowerCase() !== city.toLowerCase()) {
    return compactLabel([place, city]);
  }
  if (place) return place;
  if (city && district && city.toLowerCase() !== district.toLowerCase()) {
    return compactLabel([city, district]);
  }
  return city || district || tidyPlaceName(input.province || "") || tidyPlaceName(input.country || "");
}

/** Pull neighbourhood-style name from a long display address when APIs omit it. */
function extractPlaceFromDisplayName(display: string, city: string): string {
  const cityKey = tidyPlaceName(city).toLowerCase();
  const parts = display.split(",").map((part) => tidyPlaceName(part));

  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();
    if (cityKey && (lower === cityKey || lower.includes(cityKey))) continue;
    if (/\b(marg|road|street|lane|path|chowk|highway|tole)\b/i.test(part)) continue;
    if (/\b(province|nepal|district|metropolitan|municipality)\b/i.test(part)) continue;
    if (/^\d{4,}$/.test(part)) continue;
    if (/bagmati|gandaki|lumbini|koshi|madhesh|karnali|sudur/i.test(part)) continue;
    return part;
  }
  return "";
}

function countryLooksLikeNepal(country?: string): boolean {
  const value = (country || "").trim().toLowerCase();
  return !value || value.includes("nepal") || value.includes("नेपाल");
}

export async function detectUserLocation(): Promise<DetectedLocation> {
  const fix = await getDevicePosition();
  const [lat, lng] = fix.coordinates;
  const reverseRaw = await reverseGeocode(lat, lng);
  const reverse = reverseRaw ? localizeResult(reverseRaw) : null;
  const fallbackCity = nearestNepalCity(lat, lng);

  const city = tidyPlaceName(
    toEnglishPlaceName(reverse?.city || "") || reverse?.city?.trim() || fallbackCity
  );
  const place = tidyPlaceName(
    toEnglishPlaceName(reverse?.place || "") ||
      reverse?.place?.trim() ||
      extractPlaceFromDisplayName(reverse?.label || "", city)
  );
  const district = tidyPlaceName(
    toEnglishPlaceName(reverse?.district || "") || reverse?.district?.trim() || city
  );
  const province = tidyPlaceName(
    mapNepalProvince(reverse?.state || "") ||
      toEnglishPlaceName(reverse?.state || "") ||
      reverse?.state?.trim() ||
      (countryLooksLikeNepal(reverse?.country) ? "Bagmati" : "")
  );
  const country = tidyPlaceName(
    toEnglishPlaceName(reverse?.country || "") || reverse?.country?.trim() || "Nepal"
  );
  const label =
    formatShortLocationLabel({ place, city, district, province, country }) ||
    `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  return {
    label,
    place,
    city,
    district,
    province,
    country,
    coordinates: [lat, lng],
    accuracyMeters: fix.accuracyMeters,
  };
}

export function isDefaultLocation(location?: string | null): boolean {
  const value = location?.trim().toLowerCase() ?? "";
  return !value || value === "kathmandu, nepal" || value === "kathmandu";
}
