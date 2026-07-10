import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from "maplibre-gl";

import { ActivityHeatmapRenderer } from "./ActivityHeatmapRenderer";
import type { ActivityLayerFlags } from "./types";
import { ZoneInterpolator } from "./ZoneInterpolator";
import { activityOpacityForZoom, isActivityHeatmapZoom } from "./zoomLOD";
import type { ActivityZone } from "./types";
import { isDocumentVisible, requestMapRepaint } from "@/lib/mapPerf";

export const ACTIVITY_HEATMAP_LAYER_ID = "duo-activity-heatmap";

export type ActivityHeatmapLayerOptions = {
  getZones: () => ActivityZone[];
  getFlags: () => ActivityLayerFlags;
  onScreenPoints?: (points: { id: string; x: number; y: number; radius: number }[]) => void;
};

export function createActivityHeatmapLayer(
  options: ActivityHeatmapLayerOptions
): CustomLayerInterface {
  const renderer = new ActivityHeatmapRenderer();
  const interpolator = new ZoneInterpolator();
  let mapRef: MapLibreMap | null = null;
  let lastPaintMs = { current: 0 };
  let lastScreenPushMs = 0;

  return {
    id: ACTIVITY_HEATMAP_LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      mapRef = map;
      renderer.init(map.getCanvas(), gl);
    },

    onRemove() {
      renderer.dispose();
      mapRef = null;
    },

    render(_gl, args: CustomRenderMethodInput) {
      if (!mapRef) return;
      if (!isDocumentVisible()) return;
      const zoom = mapRef.getZoom();
      if (!isActivityHeatmapZoom(zoom) || !options.getFlags().live) {
        options.onScreenPoints?.([]);
        return;
      }

      const displayZones = interpolator.sync(options.getZones());
      const opacity = activityOpacityForZoom(zoom);

      renderer.syncZones(displayZones);
      renderer.render(args.defaultProjectionData.mainMatrix, mapRef, displayZones, zoom, opacity);

      const now = performance.now();
      if (now - lastScreenPushMs > 120) {
        lastScreenPushMs = now;
        options.onScreenPoints?.(renderer.getScreenPoints());
      }

      // Keep animating while zones are still lerping; otherwise ~20fps is enough.
      const needsSmooth = displayZones.some(
        (z) => Math.abs(z.displayScore - z.score) > 0.4 || Math.abs(z.displayRadius - z.radius_km) > 0.05
      );
      requestMapRepaint(mapRef, lastPaintMs, needsSmooth ? 30 : 18);
    },
  };
}
