import type { SkySpecification } from "maplibre-gl";

function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function readCssNumber(name: string, fallback: number): number {
  const raw = readCssVar(name, String(fallback));
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Globe atmosphere — deep space behind the globe, soft horizon near Earth. */
export function readMapSkySpec(): SkySpecification {
  return {
    "sky-color": readCssVar("--map-space-deep", readCssVar("--map-sky-color", "#02040a")),
    "horizon-color": readCssVar("--map-horizon-color", "#071018"),
    "fog-color": readCssVar("--map-fog-color", "#000000"),
    "sky-horizon-blend": readCssNumber("--map-sky-horizon-blend", 0.08),
    "horizon-fog-blend": readCssNumber("--map-horizon-fog-blend", 0.02),
    "fog-ground-blend": readCssNumber("--map-fog-ground-blend", 0),
    "atmosphere-blend": readCssNumber("--map-atmosphere-blend", 0.35),
  };
}

export type MapSpaceTheme = {
  deep: [number, number, number];
  nebula: [number, number, number];
  milkyWay: [number, number, number];
  starWarm: [number, number, number];
  starCool: [number, number, number];
};

function cssColorToRgb(css: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.color = css;
  document.documentElement.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return fallback;
  return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255];
}

/** Space starfield palette from CSS variables */
export function readMapSpaceTheme(): MapSpaceTheme {
  return {
    deep: cssColorToRgb(readCssVar("--map-space-deep", "#000000"), [0, 0, 0]),
    nebula: cssColorToRgb(readCssVar("--map-space-nebula", "#000000"), [0, 0, 0]),
    milkyWay: cssColorToRgb(readCssVar("--map-space-milky-way", "#000000"), [0, 0, 0]),
    starWarm: cssColorToRgb(readCssVar("--map-star-warm", "#f4e4cf"), [0.96, 0.89, 0.81]),
    starCool: cssColorToRgb(readCssVar("--map-star-cool", "#c4d4ff"), [0.77, 0.83, 1]),
  };
}
