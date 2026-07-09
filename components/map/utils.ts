/** App stores coordinates as [latitude, longitude]. */

export type LatLngTuple = [number, number];

export function isValidCoord(c: unknown): c is LatLngTuple {
  return (
    Array.isArray(c) &&
    c.length === 2 &&
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1]) &&
    !(c[0] === 0 && c[1] === 0)
  );
}

export function profileKey(profile: {
  user_id?: number | string;
  id?: number | string;
  full_name?: string;
}): string {
  return String(profile.user_id ?? profile.id ?? profile.full_name);
}

/** MapLibre uses { longitude, latitude } with [lng, lat] center tuples. */
export function toLngLat([lat, lng]: LatLngTuple): {
  longitude: number;
  latitude: number;
} {
  return { longitude: lng, latitude: lat };
}

/** Default map center [longitude, latitude] — Kathmandu. */
export const DEFAULT_CENTER: [number, number] = [85.324, 27.7172];

/** First-open map framing: radius around the user in km. */
export const MAP_INITIAL_RADIUS_KM = 20;

const METERS_PER_PIXEL_AT_ZOOM_0 = 156543.03392;

/** Web Mercator zoom that fits ~`radiusKm` across a typical viewport width. */
export function zoomForRadiusKm(
  latitude: number,
  radiusKm: number,
  viewportWidthPx = 900
): number {
  const diameterM = radiusKm * 2 * 1000;
  const metersPerPixel = diameterM / viewportWidthPx;
  const latRad = (latitude * Math.PI) / 180;
  const raw = Math.log2((METERS_PER_PIXEL_AT_ZOOM_0 * Math.cos(latRad)) / metersPerPixel);
  return Math.min(14.5, Math.max(9, raw));
}

/** Bounding box corners [sw, ne] for a square ~`radiusKm` around a lat/lng point. */
export function lngLatBoundsForRadiusKm(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { sw: [number, number]; ne: [number, number] } {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180));
  return {
    sw: [centerLng - lngDelta, centerLat - latDelta],
    ne: [centerLng + lngDelta, centerLat + latDelta],
  };
}
