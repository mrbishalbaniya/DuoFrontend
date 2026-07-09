import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from "maplibre-gl";

import { ActivityHeatmapRenderer } from "./ActivityHeatmapRenderer";
import type { ActivityLayerFlags } from "./types";
import { ZoneInterpolator } from "./ZoneInterpolator";
import { activityOpacityForZoom, isActivityHeatmapZoom } from "./zoomLOD";
import type { ActivityZone } from "./types";

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
      const zoom = mapRef.getZoom();
      if (!isActivityHeatmapZoom(zoom) || !options.getFlags().live) {
        options.onScreenPoints?.([]);
        return;
      }

      const displayZones = interpolator.sync(options.getZones());
      const opacity = activityOpacityForZoom(zoom);

      renderer.syncZones(displayZones);
      renderer.render(args.defaultProjectionData.mainMatrix, mapRef, displayZones, zoom, opacity);
      options.onScreenPoints?.(renderer.getScreenPoints());
      mapRef.triggerRepaint();
    },
  };
}
