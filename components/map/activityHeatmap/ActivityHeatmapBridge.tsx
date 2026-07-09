"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapMouseEvent } from "maplibre-gl";

import { useMap } from "@/components/ui/mapcn-map";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { fetchActivityZones } from "@/lib/activityHeatmap/api";
import { activityLayerFlags, isActivityHeatmapActive } from "@/lib/activityHeatmap/activityEngine";
import {
  ACTIVITY_HEATMAP_LAYER_ID,
  createActivityHeatmapLayer,
} from "@/lib/activityHeatmap/createActivityHeatmapLayer";
import { isActivityHeatmapZoom } from "@/lib/activityHeatmap/zoomLOD";
import { useActivityHeatmapStore } from "@/lib/activityHeatmap/store";
import { useActivityWebSocket } from "@/lib/activityHeatmap/useActivityWebSocket";
import type { ActivityZone } from "@/lib/activityHeatmap/types";

import { ZonePopup } from "./ZonePopup";

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

type ActivityHeatmapBridgeProps = {
  userCoordinates?: [number, number] | null;
};

export default function ActivityHeatmapBridge({ userCoordinates }: ActivityHeatmapBridgeProps) {
  const { map, isLoaded } = useMap();
  const enabled = useMapLayersStore((s) => s.enabled);
  const flags = useMemo(() => activityLayerFlags(enabled), [enabled]);
  const active = isActivityHeatmapActive(enabled);

  const zonesRef = useRef<ActivityZone[]>([]);
  const flagsRef = useRef(flags);
  const setZones = useActivityHeatmapStore((s) => s.setZones);
  const setScreenPoints = useActivityHeatmapStore((s) => s.setScreenPoints);
  const setSelected = useActivityHeatmapStore((s) => s.setSelected);

  flagsRef.current = flags;

  const [viewport, setViewport] = useState<{
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
    zoom: number;
  } | null>(null);

  const userCoords = useMemo(() => {
    if (!userCoordinates) return null;
    const [lat, lng] = userCoordinates;
    return [lat, lng] as [number, number];
  }, [userCoordinates]);

  const applyZones = (zones: ActivityZone[]) => {
    zonesRef.current = zones;
    setZones(zones);
  };

  useActivityWebSocket(active, viewport, flags, userCoords, applyZones);

  useEffect(() => {
    if (!map || !isLoaded || !active) return;

    const updateViewport = debounce(() => {
      const bounds = map.getBounds();
      setViewport({
        latMin: bounds.getSouth(),
        latMax: bounds.getNorth(),
        lonMin: bounds.getWest(),
        lonMax: bounds.getEast(),
        zoom: map.getZoom(),
      });
    }, 280);

    updateViewport();
    map.on("moveend", updateViewport);
    map.on("zoomend", updateViewport);

    return () => {
      map.off("moveend", updateViewport);
      map.off("zoomend", updateViewport);
    };
  }, [map, isLoaded, active]);

  useEffect(() => {
    if (!active || !viewport) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetchActivityZones(
          {
            latMin: viewport.latMin,
            latMax: viewport.latMax,
            lonMin: viewport.lonMin,
            lonMax: viewport.lonMax,
            zoom: viewport.zoom,
          },
          flagsRef.current,
          userCoords
        );
        if (!cancelled) applyZones(res.zones);
      } catch {
        /* WS or retry will recover */
      }
    };

    void poll();
    const interval = setInterval(() => void poll(), 90_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [active, viewport, userCoords, setZones]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const mapInstance = map;
    let disposed = false;

    const layer = createActivityHeatmapLayer({
      getZones: () => zonesRef.current,
      getFlags: () => flagsRef.current,
      onScreenPoints: (points) => setScreenPoints(points),
    });

    const attach = () => {
      if (disposed || !active) return;
      try {
        if (!mapInstance.isStyleLoaded() || mapInstance.getLayer(ACTIVITY_HEATMAP_LAYER_ID)) return;
        mapInstance.addLayer(layer);
        mapInstance.triggerRepaint();
      } catch (error) {
        console.warn("Activity heatmap layer failed to attach", error);
      }
    };

    const detach = () => {
      try {
        if (typeof mapInstance.getLayer === "function" && mapInstance.getLayer(ACTIVITY_HEATMAP_LAYER_ID)) {
          mapInstance.removeLayer(ACTIVITY_HEATMAP_LAYER_ID);
        }
      } catch {
        /* destroyed */
      }
    };

    const onStyleLoad = () => {
      if (!disposed && active) mapInstance.once("idle", attach);
    };
    const onMoveEnd = () => {
      if (!disposed && active) mapInstance.triggerRepaint();
    };

    if (active) {
      if (mapInstance.isStyleLoaded()) attach();
      mapInstance.on("style.load", onStyleLoad);
      mapInstance.on("moveend", onMoveEnd);
    } else {
      detach();
      zonesRef.current = [];
      setZones([]);
      setScreenPoints([]);
    }

    const onClick = (event: MapMouseEvent) => {
      if (!isActivityHeatmapZoom(mapInstance.getZoom()) || !flagsRef.current.live) return;
      const points = useActivityHeatmapStore.getState().screenPoints;
      let best: { id: string; dist: number } | null = null;
      for (const p of points) {
        const dist = Math.hypot(p.x - event.point.x, p.y - event.point.y);
        if (dist <= p.radius && (!best || dist < best.dist)) {
          best = { id: p.id, dist };
        }
      }
      if (!best) return;
      const zone = zonesRef.current.find((z) => z.id === best!.id);
      if (!zone) return;
      setSelected(zone, { x: event.point.x, y: event.point.y });
    };

    mapInstance.on("click", onClick);

    return () => {
      disposed = true;
      setScreenPoints([]);
      if (typeof mapInstance?.off !== "function") return;
      try {
        mapInstance.off("style.load", onStyleLoad);
        mapInstance.off("moveend", onMoveEnd);
        mapInstance.off("click", onClick);
        detach();
      } catch {
        /* map destroyed */
      }
    };
  }, [map, isLoaded, active, setScreenPoints, setZones, setSelected]);

  return <ZonePopup />;
}
