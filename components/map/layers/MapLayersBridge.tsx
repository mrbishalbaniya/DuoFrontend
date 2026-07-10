"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@/components/ui/mapcn-map";
import {
  applyMapLayersState,
  invalidateBasemapCache,
} from "@/lib/mapLayers/layerEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";

/** Syncs Zustand layer state to the unified MapLibre globe/map instance. */
export default function MapLayersBridge() {
  const { map, isLoaded } = useMap();
  const enabled = useMapLayersStore((s) => s.enabled);
  const baseMapId = useMapLayersStore((s) => s.baseMapId);
  const toggleSettingsPanel = useMapLayersStore((s) => s.toggleSettingsPanel);
  const applyingRef = useRef(false);
  /** Skip the style.load we ourselves triggered via setStyle. */
  const ownStyleChangeRef = useRef(false);
  const prevBaseMapRef = useRef<string | null>(null);
  const didInitialApplyRef = useRef(false);

  useEffect(() => {
    if (!map || !isLoaded) return;

    let cancelled = false;

    const apply = async (forceBasemap = false) => {
      if (applyingRef.current || cancelled) return;
      applyingRef.current = true;
      try {
        if (forceBasemap) invalidateBasemapCache();
        const state = useMapLayersStore.getState();
        ownStyleChangeRef.current = true;
        await applyMapLayersState(map, {
          enabled: state.enabled,
          baseMapId: state.baseMapId,
        });
        map.triggerRepaint();
      } finally {
        ownStyleChangeRef.current = false;
        applyingRef.current = false;
      }
    };

    const baseChanged = prevBaseMapRef.current !== baseMapId;
    prevBaseMapRef.current = baseMapId;
    const force = !didInitialApplyRef.current || baseChanged;
    didInitialApplyRef.current = true;
    void apply(force);

    // Zoom no longer swaps basemaps — only re-apply overlays/sky cheaply.
    const onZoomEnd = () => {
      void apply(false);
    };
    map.on("zoomend", onZoomEnd);

    return () => {
      cancelled = true;
      map.off("zoomend", onZoomEnd);
    };
  }, [map, isLoaded, enabled, baseMapId]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const reapplyOverlaysOnly = () => {
      if (ownStyleChangeRef.current) return;
      // External style.load (e.g. mapcn) — restore overlays without nuking basemap
      // unless the selected style is actually missing.
      const state = useMapLayersStore.getState();
      ownStyleChangeRef.current = true;
      void applyMapLayersState(map, {
        enabled: state.enabled,
        baseMapId: state.baseMapId,
      })
        .then(() => map.triggerRepaint())
        .finally(() => {
          ownStyleChangeRef.current = false;
        });
    };

    map.on("style.load", reapplyOverlaysOnly);

    // Theme class changes only affect CSS sky vars — never force a full setStyle.
    const themeObserver = new MutationObserver(() => {
      if (ownStyleChangeRef.current) return;
      const state = useMapLayersStore.getState();
      void applyMapLayersState(map, {
        enabled: state.enabled,
        baseMapId: state.baseMapId,
      }).then(() => map.triggerRepaint());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      map.off("style.load", reapplyOverlaysOnly);
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
      toggleSettingsPanel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSettingsPanel]);

  return null;
}
