export const SPACE_ENVIRONMENT_LAYER_ID = "duo-space-environment";

/** Celestial shell altitudes (meters above globe) — parallax via layered depth. */
export const ALTITUDE = {
  skyDome: 52_000_000,
  distantStars: 58_000_000,
  mediumStars: 44_000_000,
  brightStars: 32_000_000,
  dust: 38_000_000,
  shootingStars: 50_000_000,
} as const;

export const STAR_COUNTS = {
  distant: 7_200,
  medium: 4_800,
  bright: 2_000,
  dust: 720,
} as const;

export const SKY_TEXTURE_SIZE = { width: 2048, height: 1024 } as const;
