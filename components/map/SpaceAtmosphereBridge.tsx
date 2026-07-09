"use client";

import { useEffect } from "react";
import { useMap } from "@/components/ui/mapcn-map";
import { applyDynamicGlobeAtmosphere } from "@/lib/mapLayers/layerEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";

/** Keeps atmosphere + sun lighting in sync with zoom and camera on every frame. */
export default function SpaceAtmosphereBridge() {
  const { map, isLoaded } = useMap();
  const enabled = useMapLayersStore((s) => s.enabled);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      try {
        applyDynamicGlobeAtmosphere(map, useMapLayersStore.getState().enabled);
      } catch {
        /* style still transitioning */
      }
    };

    const onStyleData = () => {
      if (map.isStyleLoaded()) apply();
    };

    map.on("style.load", apply);
    map.on("styledata", onStyleData);
    map.on("zoom", apply);
    map.on("move", apply);

    if (map.isStyleLoaded()) {
      apply();
    }

    const themeObserver = new MutationObserver(apply);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      map.off("style.load", apply);
      map.off("styledata", onStyleData);
      map.off("zoom", apply);
      map.off("move", apply);
      themeObserver.disconnect();
    };
  }, [map, isLoaded, enabled]);

  return null;
}
