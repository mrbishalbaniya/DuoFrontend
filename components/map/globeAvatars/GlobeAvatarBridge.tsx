"use client";

import { useEffect, useRef } from "react";
import type { MapMouseEvent } from "maplibre-gl";

import { useMap } from "@/components/ui/mapcn-map";
import type { MapProfile } from "@/components/map/types";
import { profileKey } from "@/components/map/utils";
import { useAvatarConfigStore } from "@/lib/avatarStudio/configStore";
import { createGlobeAvatarLayer, GLOBE_AVATAR_LAYER_ID } from "@/lib/globeAvatars/createGlobeAvatarLayer";
import { AvatarManager } from "@/lib/globeAvatars/AvatarManager";
import { isGlobeAvatarZoom } from "@/lib/globeAvatars/AvatarLOD";
import { useGlobeAvatarStore } from "@/lib/globeAvatars/store";

const FLY_DURATION_MS = 1200;
const FLY_EASE = (t: number) => 1 - (1 - t) ** 3;
const MARKER_FOCUS_ZOOM = 13.5;

type GlobeAvatarBridgeProps = {
  profiles: MapProfile[];
  focusProfileId?: string | null;
  onProfileFocus?: (profileId: string) => void;
};

export default function GlobeAvatarBridge({
  profiles,
  focusProfileId,
  onProfileFocus,
}: GlobeAvatarBridgeProps) {
  const { map, isLoaded } = useMap();
  const managerRef = useRef(new AvatarManager());
  const profilesRef = useRef(profiles);
  const focusRef = useRef(focusProfileId);
  const onFocusRef = useRef(onProfileFocus);
  const setSelected = useGlobeAvatarStore((s) => s.setSelected);
  const setScreenPoints = useGlobeAvatarStore((s) => s.setScreenPoints);
  const hydrateConfigs = useAvatarConfigStore((s) => s.hydrate);
  const configRevision = useAvatarConfigStore((s) => s.revision);

  useEffect(() => {
    profilesRef.current = profiles;
    focusRef.current = focusProfileId ?? null;
    onFocusRef.current = onProfileFocus;
  }, [profiles, focusProfileId, onProfileFocus]);

  useEffect(() => {
    const ids = profiles.map((p) => profileKey(p)).filter(Boolean);
    void hydrateConfigs(ids);
  }, [profiles, hydrateConfigs]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    map.triggerRepaint();
  }, [map, isLoaded, configRevision]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const mapInstance = map;
    let disposed = false;

    const layer = createGlobeAvatarLayer({
      getProfiles: () => profilesRef.current,
      getSelectedId: () => focusRef.current ?? null,
      getPresence: () => useGlobeAvatarStore.getState().presence,
      getAvatarConfigs: () => useAvatarConfigStore.getState().byUserId,
      getConfigRevision: () => useAvatarConfigStore.getState().revision,
      onScreenPoints: (points) => setScreenPoints(points),
    });

    const attach = () => {
      if (disposed) return;
      try {
        if (!mapInstance.isStyleLoaded() || mapInstance.getLayer(GLOBE_AVATAR_LAYER_ID)) return;
        mapInstance.addLayer(layer);
        mapInstance.triggerRepaint();
      } catch (error) {
        console.warn("Globe avatar layer failed to attach", error);
      }
    };

    const onStyleLoad = () => {
      if (disposed) return;
      mapInstance.once("idle", attach);
    };
    const onMoveEnd = () => {
      if (!disposed) mapInstance.triggerRepaint();
    };

    if (mapInstance.isStyleLoaded()) attach();
    mapInstance.on("style.load", onStyleLoad);
    mapInstance.on("moveend", onMoveEnd);
    mapInstance.on("move", onMoveEnd);

    const onClick = (event: MapMouseEvent) => {
      if (disposed || !isGlobeAvatarZoom(mapInstance.getZoom())) return;
      const points = useGlobeAvatarStore.getState().screenPoints;
      const pickedId = managerRef.current.pickAtScreen(event.point.x, event.point.y, points);
      if (!pickedId) return;

      const profile = profilesRef.current.find((p) => profileKey(p) === pickedId);
      if (!profile || !profile.coordinates) return;

      const [lat, lng] = profile.coordinates;
      const { longitude, latitude } = { longitude: lng, latitude: lat };

      mapInstance.flyTo({
        center: [longitude, latitude],
        zoom: Math.max(mapInstance.getZoom(), MARKER_FOCUS_ZOOM),
        pitch: Math.max(mapInstance.getPitch(), 52),
        duration: FLY_DURATION_MS,
        easing: FLY_EASE,
        essential: true,
      });

      setSelected(pickedId, profile, { x: event.point.x, y: event.point.y });
      onFocusRef.current?.(pickedId);
    };

    mapInstance.on("click", onClick);

    return () => {
      disposed = true;
      setScreenPoints([]);

      if (typeof mapInstance?.off !== "function") return;

      try {
        mapInstance.off("style.load", onStyleLoad);
        mapInstance.off("moveend", onMoveEnd);
        mapInstance.off("move", onMoveEnd);
        mapInstance.off("click", onClick);
        mapInstance.off("idle", attach);
        if (typeof mapInstance.getLayer === "function" && mapInstance.getLayer(GLOBE_AVATAR_LAYER_ID)) {
          mapInstance.removeLayer(GLOBE_AVATAR_LAYER_ID);
        }
      } catch {
        /* map already destroyed */
      }
    };
  }, [map, isLoaded, setScreenPoints, setSelected, profiles.length]);

  useEffect(() => {
    if (!focusProfileId) {
      setSelected(null, null, null);
      return;
    }
    const profile = profiles.find((p) => profileKey(p) === focusProfileId);
    if (profile) {
      setSelected(focusProfileId, profile, null);
    }
  }, [focusProfileId, profiles, setSelected]);

  return null;
}
