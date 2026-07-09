/** Globe-only LOD thresholds — higher zoom = closer street-level view on the same globe projection. */
export type AvatarLODLevel = "impostor" | "low" | "medium" | "high";

export const GLOBE_AVATAR_MIN_ZOOM = 1.2;
export const GLOBE_AVATAR_MAX_ZOOM = 18;

export function isGlobeAvatarZoom(zoom: number): boolean {
  return zoom >= GLOBE_AVATAR_MIN_ZOOM && zoom <= GLOBE_AVATAR_MAX_ZOOM;
}

export function resolveAvatarLOD(zoom: number): AvatarLODLevel {
  if (zoom < 3.2) return "impostor";
  if (zoom < 6) return "low";
  if (zoom < 10) return "medium";
  return "high";
}

export function avatarScaleForZoom(zoom: number): number {
  const t = Math.min(1, Math.max(0, (zoom - 2) / 10));
  return 0.55 + t * 1.35;
}

/**
 * Visual height in meters for ~2-unit avatar rigs.
 * Snap Map–style: stay readable at city zoom, grow when zoomed out, shrink gently when very close.
 * Continuous curve — no mid-zoom dip.
 */
export function avatarWorldScaleMeters(zoom: number): number {
  const z = Math.min(18, Math.max(1, zoom));

  // Target roughly constant on-screen size with Snap-style exaggeration.
  // At z=14 (city) ≈ 140m tall; at z=10 ≈ 320m; at z=6 ≈ 1.2km; at z=16 ≈ 90m.
  if (z < 4) {
    return 22_000 * Math.pow(0.42, z - 1.5);
  }
  if (z < 8) {
    // 4 → ~4500, 8 → ~420
    return 4500 * Math.pow(0.55, z - 4);
  }
  if (z < 12) {
    // 8 → ~420, 12 → ~180
    return 420 * Math.pow(0.78, z - 8);
  }
  // 12 → ~180, 14 → ~130, 16 → ~95, 18 → ~70
  return 180 * Math.pow(0.85, z - 12);
}

export function avatarAltitudeMeters(zoom: number): number {
  if (zoom >= 13) return 1;
  if (zoom >= 10) return 8;
  return 30 + Math.min(120, zoom * 10);
}
