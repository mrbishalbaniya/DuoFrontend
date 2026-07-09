import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from "maplibre-gl";

import type { AvatarConfig } from "@/lib/avatarStudio/types";

import { AvatarManager } from "./AvatarManager";
import { AvatarRenderer } from "./AvatarRenderer";
import { isGlobeAvatarZoom } from "./AvatarLOD";
import { resolveWeatherAccessory } from "./weatherReactions";
import type { GlobeAvatarInstance, PresenceStatus } from "./types";
import type { MapProfile } from "@/components/map/types";

export const GLOBE_AVATAR_LAYER_ID = "duo-globe-avatars";

export type GlobeAvatarLayerOptions = {
  getProfiles: () => MapProfile[];
  getSelectedId: () => string | null;
  getPresence: () => Record<string, PresenceStatus>;
  getAvatarConfigs?: () => Record<string, AvatarConfig>;
  getConfigRevision?: () => number;
  onScreenPoints?: (points: { id: string; x: number; y: number; radius: number }[]) => void;
};

export function createGlobeAvatarLayer(options: GlobeAvatarLayerOptions): CustomLayerInterface {
  const manager = new AvatarManager();
  const renderer = new AvatarRenderer();
  let mapRef: MapLibreMap | null = null;
  let instances: GlobeAvatarInstance[] = [];

  return {
    id: GLOBE_AVATAR_LAYER_ID,
    type: "custom",
    renderingMode: "3d",

    onAdd(map, gl) {
      mapRef = map;
      renderer.init(map.getCanvas(), gl);
      renderer.setRepaintHandler(() => mapRef?.triggerRepaint());
    },

    onRemove() {
      renderer.setRepaintHandler(null);
      renderer.dispose();
      mapRef = null;
    },

    render(gl, args: CustomRenderMethodInput) {
      if (!mapRef) return;
      const zoom = mapRef.getZoom();
      if (!isGlobeAvatarZoom(zoom)) {
        options.onScreenPoints?.([]);
        return;
      }

      const profiles = options.getProfiles();
      const selectedId = options.getSelectedId();
      const presence = options.getPresence();
      instances = manager.sync(profiles, zoom, selectedId, presence);
      const weather = resolveWeatherAccessory();

      renderer.syncInstances(
        instances,
        zoom,
        weather,
        options.getAvatarConfigs?.() ?? {},
        options.getConfigRevision?.() ?? 0
      );
      renderer.render(args.defaultProjectionData.mainMatrix, mapRef, instances, zoom);
      options.onScreenPoints?.(renderer.getScreenPoints());
      mapRef.triggerRepaint();
    },
  };
}
