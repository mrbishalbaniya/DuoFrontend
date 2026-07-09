"use client";

import { useCallback, useEffect, useState } from "react";
import type { MapMouseEvent } from "maplibre-gl";
import { useMap } from "@/components/ui/mapcn-map";
import { isSnapWeatherLive } from "@/lib/mapLayers/weatherEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { fetchWeatherSummary } from "@/lib/weather/api";
import type { WeatherPopupState, WeatherSummary } from "@/lib/weather/types";
import WeatherPopup from "./WeatherPopup";

export default function WeatherClickBridge() {
  const { map, isLoaded } = useMap();
  const weatherLive = useMapLayersStore((s) => isSnapWeatherLive(s.enabled));
  const [popup, setPopup] = useState<WeatherPopupState | null>(null);
  const [visible, setVisible] = useState(false);

  const openAt = useCallback(async (lat: number, lng: number) => {
    setPopup({ lat, lng, loading: true, error: null, data: null });
    setVisible(false);
    requestAnimationFrame(() => setVisible(true));
    try {
      const data: WeatherSummary = await fetchWeatherSummary(lat, lng);
      setPopup({ lat, lng, loading: false, error: null, data });
    } catch (error) {
      setPopup({
        lat,
        lng,
        loading: false,
        error: error instanceof Error ? error.message : "Could not load weather",
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    if (!map || !isLoaded || !weatherLive) return;
    const handler = (e: MapMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (target?.closest(".map-marker, .map-marker-user__dot, .marker-weather")) return;
      void openAt(e.lngLat.lat, e.lngLat.lng);
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, isLoaded, weatherLive, openAt]);

  if (!popup || !weatherLive) return null;

  const mood = popup.data?.onecall?.current?.condition?.toLowerCase() ?? "clear";

  return (
    <div className="weather-popup-anchor pointer-events-none">
      <WeatherPopup
        lat={popup.lat}
        lng={popup.lng}
        loading={popup.loading}
        error={popup.error}
        data={popup.data}
        visible={visible}
        mood={mood}
        onClose={() => {
          setVisible(false);
          window.setTimeout(() => setPopup(null), 220);
        }}
      />
    </div>
  );
}
