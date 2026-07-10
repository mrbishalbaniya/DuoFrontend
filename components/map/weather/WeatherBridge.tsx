"use client";

import { useEffect } from "react";
import { useMap } from "@/components/ui/mapcn-map";
import {
  isSnapWeatherLayerActive,
  snapAtmosphereFlags,
  snapParticleFlags,
} from "@/lib/mapLayers/weatherEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import {
  ambienceFromCurrent,
  ambienceFromGridPoint,
  blendAmbiences,
  type WeatherAmbience,
} from "@/lib/weather/conditions";
import {
  resetWeatherAmbience,
  setWeatherAmbienceTarget,
} from "@/lib/weather/ambienceStore";
import { fetchCurrentWeather, fetchWeatherGrid } from "@/lib/weather/api";
import {
  createSnapAtmosphereLayer,
  SNAP_ATMOSPHERE_LAYER_ID,
} from "@/lib/weather/createSnapAtmosphereLayer";
import {
  createWeatherParticleLayer,
  WEATHER_PARTICLE_LAYER_ID,
} from "@/lib/weather/createWeatherParticleLayer";

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function WeatherBridge() {
  const { map, isLoaded } = useMap();
  const weatherLive = useMapLayersStore((s) => s.enabled["weather-live"] === true);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const attachLayers = () => {
      if (!map.isStyleLoaded()) return;
      const live = isSnapWeatherLayerActive(useMapLayersStore.getState().enabled);

      if (!live) {
        if (map.getLayer(SNAP_ATMOSPHERE_LAYER_ID)) map.removeLayer(SNAP_ATMOSPHERE_LAYER_ID);
        if (map.getLayer(WEATHER_PARTICLE_LAYER_ID)) map.removeLayer(WEATHER_PARTICLE_LAYER_ID);
        resetWeatherAmbience();
        return;
      }

      if (!map.getLayer(SNAP_ATMOSPHERE_LAYER_ID)) {
        try {
          map.addLayer(
            createSnapAtmosphereLayer(() =>
              snapAtmosphereFlags(useMapLayersStore.getState().enabled)
            )
          );
        } catch (error) {
          console.warn("Snap atmosphere layer failed", error);
        }
      }
      if (!map.getLayer(WEATHER_PARTICLE_LAYER_ID)) {
        try {
          map.addLayer(
            createWeatherParticleLayer(() =>
              snapParticleFlags(useMapLayersStore.getState().enabled)
            )
          );
        } catch (error) {
          console.warn("Weather particle layer failed", error);
        }
      }
    };

    attachLayers();
    map.on("style.load", attachLayers);
    return () => {
      map.off("style.load", attachLayers);
      try {
        if (map.getLayer(SNAP_ATMOSPHERE_LAYER_ID)) map.removeLayer(SNAP_ATMOSPHERE_LAYER_ID);
        if (map.getLayer(WEATHER_PARTICLE_LAYER_ID)) map.removeLayer(WEATHER_PARTICLE_LAYER_ID);
      } catch {
        /* destroyed */
      }
    };
  }, [map, isLoaded, weatherLive]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!weatherLive) {
      resetWeatherAmbience();
      return;
    }

    let cancelled = false;

    const syncAmbience = async () => {
      if (!isSnapWeatherLayerActive(useMapLayersStore.getState().enabled)) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      const center = map.getCenter();
      const zoom = map.getZoom();
      const b = map.getBounds();

      try {
        // At globe zoom, center weather is enough — skip expensive grid fetch.
        const current = await fetchCurrentWeather(center.lat, center.lng);
        if (cancelled) return;

        const centerAmbience = ambienceFromCurrent(
          current as Parameters<typeof ambienceFromCurrent>[0]
        );

        let blended: WeatherAmbience = centerAmbience;
        if (zoom >= 6) {
          const grid = await fetchWeatherGrid({
            latMin: b.getSouth(),
            latMax: b.getNorth(),
            lonMin: b.getWest(),
            lonMax: b.getEast(),
          }).catch(() => []);
          if (cancelled) return;
          const gridAmbiences = grid.map((p) => ambienceFromGridPoint(p));
          const regional = blendAmbiences(gridAmbiences);
          blended = {
            ...centerAmbience,
            temp: centerAmbience.temp * 0.65 + regional.temp * 0.35,
            clouds: centerAmbience.clouds * 0.55 + regional.clouds * 0.45,
            rainIntensity: Math.max(centerAmbience.rainIntensity, regional.rainIntensity * 0.8),
            snowIntensity: Math.max(centerAmbience.snowIntensity, regional.snowIntensity * 0.8),
            fogIntensity: Math.max(centerAmbience.fogIntensity, regional.fogIntensity * 0.75),
            stormIntensity: Math.max(centerAmbience.stormIntensity, regional.stormIntensity),
            windSpeed: centerAmbience.windSpeed * 0.6 + regional.windSpeed * 0.4,
            windDeg: centerAmbience.windDeg,
          };
        }

        setWeatherAmbienceTarget(blended);
        map.triggerRepaint();
      } catch {
        /* keep last ambience */
      }
    };

    const debouncedSync = debounce(syncAmbience, 600);
    void syncAmbience();
    const interval = window.setInterval(syncAmbience, 120_000);
    map.on("moveend", debouncedSync);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      map.off("moveend", debouncedSync);
    };
  }, [map, isLoaded, weatherLive]);

  return null;
}
