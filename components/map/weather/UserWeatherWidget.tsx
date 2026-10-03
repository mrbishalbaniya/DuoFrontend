"use client";

import { useEffect, useState } from "react";
import { isSnapWeatherLive } from "@/lib/mapLayers/weatherEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { fetchWeatherSummary } from "@/lib/weather/api";
import type { WeatherSummary } from "@/lib/weather/types";
import WeatherPopup from "./WeatherPopup";

function iconUrl(icon?: string) {
  if (!icon) return null;
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

type Props = {
  coordinates: [number, number] | null | undefined;
};

export default function UserWeatherWidget({ coordinates }: Props) {
  const weatherLive = useMapLayersStore((s) => isSnapWeatherLive(s.enabled));
  const [data, setData] = useState<WeatherSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const [lat, lng] = coordinates ?? [];

  useEffect(() => {
    if (!weatherLive || lat == null || lng == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWeatherSummary(lat, lng)
      .then((summary) => {
        if (!cancelled) setData(summary);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load weather");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weatherLive, lat, lng]);

  if (!weatherLive || lat == null || lng == null) return null;

  const current = data?.onecall?.current;
  const mood = current?.condition?.toLowerCase() ?? "clear";

  return (
    <div className="user-weather-anchor">
      {expanded ? (
        <div className="pointer-events-auto">
          <WeatherPopup
            lat={lat}
            lng={lng}
            loading={loading}
            error={error}
            data={data}
            visible={expanded}
            mood={mood}
            onClose={() => setExpanded(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="user-weather-badge ios-glass pointer-events-auto"
          aria-label="Your local weather"
        >
          {loading ? (
            <span className="user-weather-badge__spinner" />
          ) : current ? (
            <>
              {iconUrl(current.icon) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconUrl(current.icon)!} alt="" className="user-weather-badge__icon" />
              ) : null}
              <span className="user-weather-badge__temp">{Math.round(current.temp ?? 0)}°C</span>
            </>
          ) : (
            <span className="material-symbols-outlined text-lg">cloud</span>
          )}
        </button>
      )}
    </div>
  );
}
