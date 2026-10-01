/**
 * Appearance catalog.
 *
 * Palettes recolor primary/brand tokens and are written to
 * <html data-palette="…">. Surface styles swap the dark or light
 * background/text tokens and are written to <html data-surface="…">.
 * Keep ids in sync with app/globals.css and the init script in app/layout.tsx.
 */
export type PaletteId =
  | "rose"
  | "ocean"
  | "lagoon"
  | "aurum"
  | "amethyst"
  | "emerald"
  | "sunset"
  | "midnight"
  | "noir"
  | "crimson"
  | "sakura"
  | "mocha"
  | "neon"
  | "royal"
  | "valentine"
  | "blush"
  | "passion"
  | "cupid"
  | "honeymoon"
  | "twilight";

export type Palette = {
  id: PaletteId;
  premium: boolean;
  /** Swatch colors for the picker preview: [primary, secondary, accent]. */
  swatch: [string, string, string];
  /** Dark surface color used in the preview card. */
  surface: string;
};

export const PALETTES: Palette[] = [
  { id: "rose", premium: false, swatch: ["#e84a7a", "#ff4d6d", "#d4a574"], surface: "#17181a" },
  { id: "ocean", premium: false, swatch: ["#3b82f6", "#60a5fa", "#22d3ee"], surface: "#17181a" },
  { id: "lagoon", premium: false, swatch: ["#14b8a6", "#2dd4bf", "#38bdf8"], surface: "#17181a" },
  { id: "aurum", premium: true, swatch: ["#d4a24c", "#f6d365", "#b8862f"], surface: "#1a1712" },
  { id: "amethyst", premium: true, swatch: ["#8b5cf6", "#c084fc", "#f0abfc"], surface: "#18151f" },
  { id: "emerald", premium: true, swatch: ["#10b981", "#34d399", "#a3e635"], surface: "#121a17" },
  { id: "sunset", premium: true, swatch: ["#f97316", "#fb7185", "#facc15"], surface: "#1c1613" },
  { id: "midnight", premium: true, swatch: ["#6366f1", "#818cf8", "#38bdf8"], surface: "#13151f" },
  { id: "crimson", premium: true, swatch: ["#e11d48", "#fb7185", "#f59e0b"], surface: "#1c1215" },
  { id: "sakura", premium: true, swatch: ["#f472b6", "#f9a8d4", "#c4b5fd"], surface: "#1c151a" },
  { id: "mocha", premium: true, swatch: ["#c08457", "#e0b48a", "#8b5e3c"], surface: "#1a1612" },
  { id: "neon", premium: true, swatch: ["#22d3ee", "#e879f9", "#a3e635"], surface: "#0f1418" },
  { id: "royal", premium: true, swatch: ["#3b5bdb", "#748ffc", "#f2c14e"], surface: "#12141f" },
  // Love collection
  { id: "valentine", premium: true, swatch: ["#e0244f", "#ff6b8b", "#ffb3c1"], surface: "#1f0a10" },
  { id: "blush", premium: true, swatch: ["#ff8fab", "#ffc8d6", "#f2c98a"], surface: "#22121a" },
  { id: "passion", premium: true, swatch: ["#b0174a", "#d8456f", "#e8b86d"], surface: "#1c070d" },
  { id: "cupid", premium: true, swatch: ["#ff5c9a", "#b388ff", "#ffd1e8"], surface: "#1a0d22" },
  { id: "honeymoon", premium: true, swatch: ["#e7a48c", "#f3c9b4", "#c79a6b"], surface: "#21140f" },
  { id: "twilight", premium: true, swatch: ["#d946ef", "#fb7185", "#fbbf24"], surface: "#1c0a22" },
  { id: "noir", premium: true, swatch: ["#f5f5f5", "#a3a3a3", "#525252"], surface: "#0a0a0a" },
];

export const DEFAULT_PALETTE: PaletteId = "rose";
export const PALETTE_STORAGE_KEY = "duo_palette";

export function isPaletteId(value: unknown): value is PaletteId {
  return typeof value === "string" && PALETTES.some((p) => p.id === value);
}

export function isPremiumPalette(id: PaletteId): boolean {
  return PALETTES.find((p) => p.id === id)?.premium ?? false;
}

/* ------------------------------------------------------------------ */
/* Surface styles: premium variants of dark and light mode             */
/* ------------------------------------------------------------------ */

export type DarkStyleId = "default" | "amoled" | "dim" | "graphite" | "nord" | "velvet";
export type LightStyleId = "default" | "cream" | "frost" | "sand" | "mist" | "paper";

export type SurfaceStyle<T extends string> = {
  id: T;
  premium: boolean;
  /** Preview colors: [background, card, text]. */
  preview: [string, string, string];
};

export const DARK_STYLES: SurfaceStyle<DarkStyleId>[] = [
  { id: "default", premium: false, preview: ["#0f0f10", "#1b1d20", "#ffffff"] },
  { id: "amoled", premium: true, preview: ["#000000", "#0a0a0a", "#ffffff"] },
  { id: "dim", premium: true, preview: ["#15202b", "#192734", "#f7f9f9"] },
  { id: "graphite", premium: true, preview: ["#1c1c1e", "#2c2c2e", "#ffffff"] },
  { id: "nord", premium: true, preview: ["#2e3440", "#3b4252", "#eceff4"] },
  { id: "velvet", premium: true, preview: ["#15101f", "#241c33", "#f5f0ff"] },
];

export const LIGHT_STYLES: SurfaceStyle<LightStyleId>[] = [
  { id: "default", premium: false, preview: ["#f7f7f8", "#ffffff", "#111827"] },
  { id: "cream", premium: true, preview: ["#f8f3e9", "#fffdf8", "#2b2419"] },
  { id: "frost", premium: true, preview: ["#eef3f8", "#ffffff", "#0f1b2a"] },
  { id: "sand", premium: true, preview: ["#efe7da", "#faf6ef", "#33291c"] },
  { id: "mist", premium: true, preview: ["#f3f1f8", "#ffffff", "#1d1830"] },
  { id: "paper", premium: true, preview: ["#ffffff", "#f4f4f5", "#000000"] },
];

export const DARK_STYLE_STORAGE_KEY = "duo_dark_style";
export const LIGHT_STYLE_STORAGE_KEY = "duo_light_style";

export function isDarkStyleId(value: unknown): value is DarkStyleId {
  return typeof value === "string" && DARK_STYLES.some((s) => s.id === value);
}

export function isLightStyleId(value: unknown): value is LightStyleId {
  return typeof value === "string" && LIGHT_STYLES.some((s) => s.id === value);
}
