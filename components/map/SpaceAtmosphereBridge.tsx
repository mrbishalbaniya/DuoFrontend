"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@/components/ui/mapcn-map";
import { applyDynamicGlobeAtmosphere } from "@/lib/mapLayers/layerEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { zoomBucket } from "@/lib/mapPerf";

/** Atmosphere + lighting — updates on meaningful zoom/style changes, not every pan frame. */
export default function SpaceAtmosphereBridge() {
  const { map, isLoaded } = useMap();
  const atmosphereOn = useMapLayersStore((s) => s.enabled["globe-atmosphere"] !== false);
  const glowOn = useMapLayersStore((s) => s.enabled["globe-earth-glow"] !== false);
  const lastZoomBucketRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const apply = (force = false) => {
      if (!map.isStyleLoaded()) return;
      const bucket = zoomBucket(map.getZoom());
      if (!force && lastZoomBucketRef.current === bucket) return;
      lastZoomBucketRef.current = bucket;
      try {
        applyDynamicGlobeAtmosphere(map, useMapLayersStore.getState().enabled);
      } catch {
        /* style still transitioning */
      }
    };

    const onStyleLoad = () => apply(true);
    const onStyleData = () => {
      if (map.isStyleLoaded()) apply(true);
    };
    const onZoomEnd = () => apply();
    const onMoveEnd = () => apply();

    map.on("style.load", onStyleLoad);
    map.on("styledata", onStyleData);
    map.on("zoomend", onZoomEnd);
    map.on("moveend", onMoveEnd);

    if (map.isStyleLoaded()) {
      apply(true);
    }

    const themeObserver = new MutationObserver(() => apply(true));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      map.off("style.load", onStyleLoad);
      map.off("styledata", onStyleData);
      map.off("zoomend", onZoomEnd);
      map.off("moveend", onMoveEnd);
      themeObserver.disconnect();
    };
  }, [map, isLoaded, atmosphereOn, glowOn]);

  return null;
}
