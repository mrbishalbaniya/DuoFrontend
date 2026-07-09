"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@/components/ui/mapcn-map";
import { applyMapLayersState } from "@/lib/mapLayers/layerEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";

/** Syncs Zustand layer state to the unified MapLibre globe/map instance. */
export default function MapLayersBridge() {
  const { map, isLoaded } = useMap();
  const enabled = useMapLayersStore((s) => s.enabled);
  const baseMapId = useMapLayersStore((s) => s.baseMapId);
  const globeModeId = useMapLayersStore((s) => s.globeModeId);
  const togglePanel = useMapLayersStore((s) => s.togglePanel);
  const applyingRef = useRef(false);

  useEffect(() => {
    if (!map || !isLoaded) return;

    let cancelled = false;

    const apply = async () => {
      if (applyingRef.current || cancelled) return;
      applyingRef.current = true;
      try {
        const state = useMapLayersStore.getState();
        await applyMapLayersState(map, {
          enabled: state.enabled,
          baseMapId: state.baseMapId,
          globeModeId: state.globeModeId,
        });
        map.triggerRepaint();
      } finally {
        applyingRef.current = false;
      }
    };

    void apply();
    return () => {
      cancelled = true;
    };
  }, [map, isLoaded, enabled, baseMapId, globeModeId]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const reapply = () => {
      const state = useMapLayersStore.getState();
      void applyMapLayersState(map, {
        enabled: state.enabled,
        baseMapId: state.baseMapId,
        globeModeId: state.globeModeId,
      }).then(() => map.triggerRepaint());
    };

    map.on("style.load", reapply);

    const themeObserver = new MutationObserver(reapply);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      map.off("style.load", reapply);
      themeObserver.disconnect();
    };
  }, [map, isLoaded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "l" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      togglePanel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePanel]);

  return null;
}
