"use client";

import { useEffect } from "react";
import { useMap } from "@/components/ui/mapcn-map";
import {
  createSpaceEnvironmentLayer,
  SPACE_ENVIRONMENT_LAYER_ID,
} from "@/lib/spaceEnvironment/createSpaceEnvironmentLayer";

/** Cinematic deep-space environment — always on for the 3D globe. */
export default function SpaceStarfieldBridge() {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;

    let cancelled = false;
    let retryFrame = 0;

    const attach = () => {
      if (cancelled || !map.isStyleLoaded()) return;
      if (map.getLayer(SPACE_ENVIRONMENT_LAYER_ID)) return;
      try {
        const layer = createSpaceEnvironmentLayer();
        const style = map.getStyle();
        const beforeId = style?.layers?.[0]?.id;
        if (beforeId) {
          map.addLayer(layer, beforeId);
        } else {
          map.addLayer(layer);
        }
      } catch (error) {
        console.warn("Space environment layer failed to attach", error);
        // Style swaps briefly report loaded before all source/layer work has
        // settled. Retry once on the next animation frame instead of leaving
        // the globe without its environment for the rest of the session.
        cancelAnimationFrame(retryFrame);
        retryFrame = requestAnimationFrame(attach);
      }
    };

    const attachWhenReady = () => {
      cancelAnimationFrame(retryFrame);
      retryFrame = requestAnimationFrame(attach);
    };

    attachWhenReady();
    map.on("style.load", attachWhenReady);
    map.on("idle", attachWhenReady);

    return () => {
      cancelled = true;
      cancelAnimationFrame(retryFrame);
      map.off("style.load", attachWhenReady);
      map.off("idle", attachWhenReady);
      try {
        if (map.getLayer(SPACE_ENVIRONMENT_LAYER_ID)) {
          map.removeLayer(SPACE_ENVIRONMENT_LAYER_ID);
        }
      } catch {
        /* map destroyed */
      }
    };
  }, [map, isLoaded]);

  return null;
}
