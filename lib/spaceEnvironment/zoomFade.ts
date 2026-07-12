import { STAR_COUNTS } from "./constants";

/** Zoom-driven opacity curves for cinematic globe ↔ map transitions. */
export type SpaceFadeState = {
  stars: number;
  milkyWay: number;
  nebula: number;
  dust: number;
  haze: number;
  atmosphereBoost: number;
};

export function computeSpaceFade(zoom: number): SpaceFadeState {
  const stars =
    zoom >= 8 ? 0 : zoom >= 6 ? Math.max(0, 1 - (zoom - 6) / 2) : zoom >= 4 ? 0.35 + 0.65 * (1 - (zoom - 4) / 2) : 1;

  const milkyWay =
    zoom >= 7 ? 0 : zoom >= 4.5 ? Math.max(0, 1 - (zoom - 4.5) / 2.5) : 1;

  const nebula =
    zoom >= 6.5 ? 0 : zoom >= 3.5 ? Math.max(0, 1 - (zoom - 3.5) / 3) : 1;

  const atmos = atmosphereBoostForZoom(zoom);
  const dust = stars * 0.85;
  const haze = Math.min(1, stars * 0.4 + atmos * 0.25);

  return { stars, milkyWay, nebula, dust, haze, atmosphereBoost: atmos };
}

function atmosphereBoostForZoom(zoom: number): number {
  if (zoom <= 2) return 0.15;
  if (zoom >= 8) return 1;
  if (zoom <= 4) return 0.15 + ((zoom - 2) / 2) * 0.35;
  return 0.5 + ((zoom - 4) / 4) * 0.5;
}

export function starLodCounts(zoom: number): {
  distant: number;
  medium: number;
  bright: number;
  dust: number;
} {
  const fade = computeSpaceFade(zoom);
  if (fade.stars <= 0.01) {
    return { distant: 0, medium: 0, bright: 0, dust: 0 };
  }

  const t = fade.stars;
  if (zoom >= 6) {
    return {
      distant: Math.min(STAR_COUNTS.distant, Math.floor(STAR_COUNTS.distant * t * 0.2)),
      medium: Math.min(STAR_COUNTS.medium, Math.floor(STAR_COUNTS.medium * t * 0.15)),
      bright: Math.min(STAR_COUNTS.bright, Math.floor(STAR_COUNTS.bright * t * 0.1)),
      dust: 0,
    };
  }
  if (zoom >= 4) {
    return {
      distant: Math.min(STAR_COUNTS.distant, Math.floor(STAR_COUNTS.distant * t * 0.55)),
      medium: Math.min(STAR_COUNTS.medium, Math.floor(STAR_COUNTS.medium * t * 0.7)),
      bright: Math.min(STAR_COUNTS.bright, Math.floor(STAR_COUNTS.bright * t * 0.5)),
      dust: Math.min(STAR_COUNTS.dust, Math.floor(STAR_COUNTS.dust * t * 0.4)),
    };
  }
  return {
    distant: Math.min(STAR_COUNTS.distant, Math.floor(STAR_COUNTS.distant * t)),
    medium: Math.min(STAR_COUNTS.medium, Math.floor(STAR_COUNTS.medium * t)),
    bright: Math.min(STAR_COUNTS.bright, Math.floor(STAR_COUNTS.bright * t)),
    dust: Math.min(STAR_COUNTS.dust, Math.floor(STAR_COUNTS.dust * t)),
  };
}
