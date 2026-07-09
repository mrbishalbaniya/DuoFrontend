export const ACTIVITY_MIN_ZOOM = 1.0;
export const ACTIVITY_MAX_ZOOM = 15.5;

export function isActivityHeatmapZoom(zoom: number): boolean {
  return zoom >= ACTIVITY_MIN_ZOOM && zoom <= ACTIVITY_MAX_ZOOM;
}

export function activityOpacityForZoom(zoom: number): number {
  if (zoom < 2.5) return 0.92;
  if (zoom < 5) return 0.85;
  if (zoom < 9) return 0.72;
  if (zoom < 12) return 0.55;
  return 0.38;
}

export function radiusMetersForZone(radiusKm: number, zoom: number): number {
  const zoomBoost = zoom < 4 ? 2.4 : zoom < 7 ? 1.5 : zoom < 10 ? 1.0 : 0.65;
  return radiusKm * 1000 * zoomBoost;
}

export function altitudeMetersForZoom(zoom: number): number {
  return 120 + Math.min(400, zoom * 28);
}
