import { getWeatherAmbience } from "@/lib/weather/ambienceStore";

import type { WeatherAccessory } from "./types";

export function resolveWeatherAccessory(): WeatherAccessory {
  const ambience = getWeatherAmbience();
  if (ambience.snowIntensity > 0.35) return "winter";
  if (ambience.rainIntensity > 0.35) return "umbrella";
  if (ambience.sunnyIntensity > 0.55 && ambience.rainIntensity < 0.1) return "sunglasses";
  return "none";
}
