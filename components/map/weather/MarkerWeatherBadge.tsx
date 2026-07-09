"use client";

import { useEffect, useState } from "react";
import { moodIcon, type WeatherMood } from "@/lib/weather/conditions";
import { getMarkerWeather } from "@/lib/weather/markerWeatherCache";

type Props = {
  lat: number;
  lon: number;
  active: boolean;
};

export default function MarkerWeatherBadge({ lat, lon, active }: Props) {
  const [mood, setMood] = useState<WeatherMood>("clear");

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void getMarkerWeather(lat, lon).then((m) => {
      if (!cancelled) setMood(m);
    });
    const id = window.setInterval(() => {
      void getMarkerWeather(lat, lon).then((m) => {
        if (!cancelled) setMood(m);
      });
    }, 5 * 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [lat, lon, active]);

  if (!active) return null;

  return (
    <div className={`marker-weather marker-weather--${mood}`} aria-hidden>
      <span className="material-symbols-outlined marker-weather__icon">{moodIcon(mood)}</span>
      {mood === "rain" || mood === "drizzle" ? (
        <span className="marker-weather__drops" />
      ) : null}
      {mood === "snow" ? <span className="marker-weather__flakes" /> : null}
      {mood === "thunderstorm" ? <span className="marker-weather__flash" /> : null}
    </div>
  );
}
