export type WeatherMood =
  | "clear"
  | "clouds"
  | "rain"
  | "drizzle"
  | "snow"
  | "thunderstorm"
  | "fog"
  | "mist"
  | "haze";

export type WeatherAmbience = {
  temp: number;
  clouds: number;
  humidity: number;
  windSpeed: number;
  windDeg: number;
  visibility: number;
  rainIntensity: number;
  snowIntensity: number;
  fogIntensity: number;
  stormIntensity: number;
  sunnyIntensity: number;
  wetness: number;
  mood: WeatherMood;
};

export const DEFAULT_AMBIENCE: WeatherAmbience = {
  temp: 18,
  clouds: 25,
  humidity: 55,
  windSpeed: 2,
  windDeg: 0,
  visibility: 10_000,
  rainIntensity: 0,
  snowIntensity: 0,
  fogIntensity: 0,
  stormIntensity: 0,
  sunnyIntensity: 0.6,
  wetness: 0,
  mood: "clear",
};

export function moodFromMain(main?: string): WeatherMood {
  const m = (main ?? "").toLowerCase();
  if (m.includes("thunder")) return "thunderstorm";
  if (m.includes("snow")) return "snow";
  if (m.includes("rain")) return "rain";
  if (m.includes("drizzle")) return "drizzle";
  if (m.includes("fog")) return "fog";
  if (m.includes("mist")) return "mist";
  if (m.includes("haze") || m.includes("smoke") || m.includes("dust")) return "haze";
  if (m.includes("cloud")) return "clouds";
  return "clear";
}

export function moodIcon(mood: WeatherMood): string {
  switch (mood) {
    case "thunderstorm":
      return "thunderstorm";
    case "snow":
      return "ac_unit";
    case "rain":
    case "drizzle":
      return "rainy";
    case "fog":
    case "mist":
    case "haze":
      return "foggy";
    case "clouds":
      return "cloud";
    default:
      return "wb_sunny";
  }
}

type RawWeather = {
  main?: { temp?: number; humidity?: number };
  weather?: Array<{ main?: string }>;
  wind?: { speed?: number; deg?: number };
  clouds?: { all?: number };
  visibility?: number;
  rain?: Record<string, number>;
  snow?: Record<string, number>;
};

export function ambienceFromCurrent(raw: RawWeather): WeatherAmbience {
  const main = raw.weather?.[0]?.main ?? "Clear";
  const mood = moodFromMain(main);
  const rainMm = Object.values(raw.rain ?? {}).reduce((a, b) => a + b, 0);
  const snowMm = Object.values(raw.snow ?? {}).reduce((a, b) => a + b, 0);
  const clouds = raw.clouds?.all ?? 0;
  const temp = raw.main?.temp ?? 18;
  const humidity = raw.main?.humidity ?? 55;
  const visibility = raw.visibility ?? 10_000;
  const windSpeed = raw.wind?.speed ?? 0;
  const windDeg = raw.wind?.deg ?? 0;

  const rainIntensity = Math.min(
    1,
    (mood === "rain" || mood === "drizzle" || mood === "thunderstorm" ? 0.45 : 0) +
      rainMm * 0.12
  );
  const snowIntensity = Math.min(1, (mood === "snow" ? 0.5 : 0) + snowMm * 0.15);
  const stormIntensity = mood === "thunderstorm" ? Math.min(1, 0.55 + rainMm * 0.1) : 0;
  const fogIntensity = Math.min(
    1,
    (mood === "fog" || mood === "mist" || mood === "haze" ? 0.65 : 0) +
      (visibility < 3000 ? 0.35 : visibility < 6000 ? 0.15 : 0)
  );
  const sunnyIntensity = Math.min(
    1,
    Math.max(0, (mood === "clear" ? 0.85 : mood === "clouds" ? 0.35 : 0.1) * (1 - clouds / 120))
  );

  return {
    temp,
    clouds,
    humidity,
    windSpeed,
    windDeg,
    visibility,
    rainIntensity,
    snowIntensity,
    fogIntensity,
    stormIntensity,
    sunnyIntensity,
    wetness: Math.min(1, rainIntensity * 0.85 + stormIntensity * 0.4),
    mood,
  };
}

export function ambienceFromGridPoint(p: {
  temp?: number;
  humidity?: number;
  clouds?: number;
  visibility?: number;
  wind_speed?: number;
  wind_deg?: number;
  condition?: string;
}): WeatherAmbience {
  return ambienceFromCurrent({
    main: { temp: p.temp, humidity: p.humidity },
    weather: [{ main: p.condition ?? "Clear" }],
    wind: { speed: p.wind_speed, deg: p.wind_deg },
    clouds: { all: p.clouds },
    visibility: p.visibility,
  });
}

export function lerpAmbience(a: WeatherAmbience, b: WeatherAmbience, t: number): WeatherAmbience {
  const mix = (x: number, y: number) => x + (y - x) * t;
  return {
    temp: mix(a.temp, b.temp),
    clouds: mix(a.clouds, b.clouds),
    humidity: mix(a.humidity, b.humidity),
    windSpeed: mix(a.windSpeed, b.windSpeed),
    windDeg: mixAngle(a.windDeg, b.windDeg, t),
    visibility: mix(a.visibility, b.visibility),
    rainIntensity: mix(a.rainIntensity, b.rainIntensity),
    snowIntensity: mix(a.snowIntensity, b.snowIntensity),
    fogIntensity: mix(a.fogIntensity, b.fogIntensity),
    stormIntensity: mix(a.stormIntensity, b.stormIntensity),
    sunnyIntensity: mix(a.sunnyIntensity, b.sunnyIntensity),
    wetness: mix(a.wetness, b.wetness),
    mood: t < 0.5 ? a.mood : b.mood,
  };
}

function mixAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

export function blendAmbiences(points: WeatherAmbience[]): WeatherAmbience {
  if (points.length === 0) return DEFAULT_AMBIENCE;
  if (points.length === 1) return points[0];

  const sum = { ...DEFAULT_AMBIENCE };
  for (const p of points) {
    sum.temp += p.temp;
    sum.clouds += p.clouds;
    sum.humidity += p.humidity;
    sum.windSpeed += p.windSpeed;
    sum.windDeg += p.windDeg;
    sum.visibility += p.visibility;
    sum.rainIntensity += p.rainIntensity;
    sum.snowIntensity += p.snowIntensity;
    sum.fogIntensity += p.fogIntensity;
    sum.stormIntensity += p.stormIntensity;
    sum.sunnyIntensity += p.sunnyIntensity;
    sum.wetness += p.wetness;
  }
  const n = points.length;
  return {
    temp: sum.temp / n,
    clouds: sum.clouds / n,
    humidity: sum.humidity / n,
    windSpeed: sum.windSpeed / n,
    windDeg: sum.windDeg / n,
    visibility: sum.visibility / n,
    rainIntensity: sum.rainIntensity / n,
    snowIntensity: sum.snowIntensity / n,
    fogIntensity: sum.fogIntensity / n,
    stormIntensity: sum.stormIntensity / n,
    sunnyIntensity: sum.sunnyIntensity / n,
    wetness: sum.wetness / n,
    mood: points[Math.floor(n / 2)].mood,
  };
}
