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

    const attach = () => {
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
      }
    };

    attach();
    map.on("style.load", attach);

    return () => {
      map.off("style.load", attach);
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
