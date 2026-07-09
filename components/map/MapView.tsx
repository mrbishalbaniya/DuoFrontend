"use client";

import MapLibreGL from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/mapcn-map";
import { useTheme } from "@/contexts/ThemeContext";
import { MapFloatingControls } from "./MapFloatingControls";
import SpaceStarfieldBridge from "./SpaceStarfieldBridge";
import SpaceAtmosphereBridge from "./SpaceAtmosphereBridge";
import MapLayersBridge from "./layers/MapLayersBridge";
import MapLayersSettingsPanel from "./layers/MapLayersSettingsPanel";
import MapDebugHud from "./layers/MapDebugHud";
import WeatherBridge from "./weather/WeatherBridge";
import GlobeAvatarBridge from "./globeAvatars/GlobeAvatarBridge";
import ActivityHeatmapBridge from "./activityHeatmap/ActivityHeatmapBridge";
import { isDuoLayerVisible } from "@/lib/mapLayers/layerEngine";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import type { MapProfile } from "./types";
import {
  DEFAULT_CENTER,
  isValidCoord,
  lngLatBoundsForRadiusKm,
  MAP_INITIAL_RADIUS_KM,
  profileKey,
  toLngLat,
  zoomForRadiusKm,
} from "./utils";

interface MapViewProps {
  profiles: MapProfile[];
  userCoordinates?: [number, number] | null;
  profilesOrderKey?: string;
  focusProfileId?: string | null;
  onProfileFocus?: (profileId: string) => void;
}

const MARKER_FOCUS_ZOOM = 13.5;
const FLY_DURATION_MS = 1200;
const AUTO_ROTATE_IDLE_MS = 14000;
const AUTO_ROTATE_MAX_ZOOM = 3.8;

const FLY_EASE = (t: number) => 1 - (1 - t) ** 3;
const GLOBE_PROJECTION: MapLibreGL.ProjectionSpecification = { type: "globe" };

function MapResizeHandler() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const refresh = () => {
      try {
        if (map.getContainer()?.isConnected) map.resize();
      } catch {
        /* map destroyed */
      }
    };

    const t = window.setTimeout(refresh, 150);
    window.addEventListener("resize", refresh);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", refresh);
    };
  }, [map]);

  return null;
}

/** Keeps globe projection and cinematic interactions on one map instance. */
function GlobeExperience() {
  const { map, isLoaded } = useMap();
  const idleSinceRef = useRef(0);
  const rotatingRef = useRef(false);

  useEffect(() => {
    idleSinceRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const applyGlobeProjection = () => {
      map.setProjection(GLOBE_PROJECTION);
    };

    applyGlobeProjection();
    map.on("styledata", applyGlobeProjection);

    const themeObserver = new MutationObserver(applyGlobeProjection);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const onMoveStart = () => {
      idleSinceRef.current = Date.now();
      rotatingRef.current = false;
    };

    const onDblClick = (event: MapLibreGL.MapMouseEvent) => {
      idleSinceRef.current = Date.now();
      const targetZoom = Math.min(18, map.getZoom() + 2.2);
      map.flyTo({
        center: event.lngLat,
        zoom: targetZoom,
        duration: FLY_DURATION_MS,
        easing: FLY_EASE,
        essential: true,
      });
    };

    map.on("movestart", onMoveStart);
    map.on("dragstart", onMoveStart);
    map.on("zoomstart", onMoveStart);
    map.on("dblclick", onDblClick);

    const autoRotateTimer = window.setInterval(() => {
      if (!map.getContainer()?.isConnected) return;
      if (map.getZoom() > AUTO_ROTATE_MAX_ZOOM) return;
      if (map.isMoving() || rotatingRef.current) return;
      if (Date.now() - idleSinceRef.current < AUTO_ROTATE_IDLE_MS) return;

      rotatingRef.current = true;
      map.easeTo({
        bearing: map.getBearing() + 18,
        duration: 12000,
        easing: (t) => t * (2 - t),
        essential: true,
      });
      map.once("moveend", () => {
        rotatingRef.current = false;
        idleSinceRef.current = Date.now();
      });
    }, 2000);

    return () => {
      themeObserver.disconnect();
      map.off("styledata", applyGlobeProjection);
      map.off("movestart", onMoveStart);
      map.off("dragstart", onMoveStart);
      map.off("zoomstart", onMoveStart);
      map.off("dblclick", onDblClick);
      window.clearInterval(autoRotateTimer);
    };
  }, [map, isLoaded]);

  return null;
}

function MapInitialViewport({
  userCoordinates,
}: {
  userCoordinates?: [number, number] | null;
}) {
  const { map, isLoaded } = useMap();
  const hasFitRef = useRef(false);

  const locationKey = useMemo(
    () =>
      userCoordinates && isValidCoord(userCoordinates)
        ? userCoordinates.join(",")
        : "",
    [userCoordinates]
  );

  useEffect(() => {
    if (!map || !isLoaded || hasFitRef.current) return;
    if (!userCoordinates || !isValidCoord(userCoordinates)) return;

    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;

      try {
        if (!map.getContainer()?.isConnected) return;

        const [lat, lng] = userCoordinates;
        const { sw, ne } = lngLatBoundsForRadiusKm(lat, lng, MAP_INITIAL_RADIUS_KM);
        hasFitRef.current = true;

        map.fitBounds(new MapLibreGL.LngLatBounds(sw, ne), {
          padding: { top: 120, bottom: 160, left: 80, right: 80 },
          duration: FLY_DURATION_MS,
          easing: FLY_EASE,
          essential: true,
        });
      } catch {
        /* map not ready */
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [locationKey, map, isLoaded, userCoordinates]);

  return null;
}

function FocusOnProfile({
  profiles,
  focusProfileId,
}: {
  profiles: MapProfile[];
  focusProfileId?: string | null;
}) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded || !focusProfileId) return;

    const profile = profiles.find((p) => profileKey(p) === String(focusProfileId));
    if (!profile || !isValidCoord(profile.coordinates)) return;

    const { longitude, latitude } = toLngLat(profile.coordinates);

    map.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), MARKER_FOCUS_ZOOM),
      pitch: Math.max(map.getPitch(), 52),
      duration: FLY_DURATION_MS,
      easing: FLY_EASE,
      essential: true,
    });
  }, [focusProfileId, map, isLoaded, profiles]);

  return null;
}

function MapControlBridge({
  userCoordinates,
}: {
  userCoordinates?: [number, number] | null;
}) {
  const { map, isLoaded } = useMap();

  const zoomIn = useCallback(() => {
    if (!map) return;
    map.zoomTo(Math.min(18, map.getZoom() + 1.15), { duration: 450 });
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;
    map.zoomTo(Math.max(0.5, map.getZoom() - 1.15), { duration: 450 });
  }, [map]);

  const locate = useCallback(() => {
    if (!map || !userCoordinates || !isValidCoord(userCoordinates)) return;
    map.flyTo({
      center: [userCoordinates[1], userCoordinates[0]],
      zoom: MARKER_FOCUS_ZOOM,
      duration: FLY_DURATION_MS,
      easing: FLY_EASE,
      essential: true,
    });
  }, [map, userCoordinates]);

  const recenterNorth = useCallback(() => {
    if (!map) return;
    map.easeTo({
      bearing: 0,
      duration: FLY_DURATION_MS,
      easing: FLY_EASE,
      essential: true,
    });
  }, [map]);

  if (!isLoaded || !map) return null;

  return (
    <MapFloatingControls
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onRecenterNorth={recenterNorth}
      onLocate={locate}
    />
  );
}

function UserLocationMarker({ coordinates }: { coordinates: [number, number] }) {
  const { longitude, latitude } = toLngLat(coordinates);

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent className="map-marker map-marker--user">
        <div className="map-marker-user__pulse map-marker-user__pulse--outer" />
        <div className="map-marker-user__pulse map-marker-user__pulse--inner" />
        <div className="map-marker-user__dot" />
      </MarkerContent>
    </MapMarker>
  );
}

export default function MapView({
  profiles,
  userCoordinates,
  profilesOrderKey,
  focusProfileId,
  onProfileFocus,
}: MapViewProps) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const layerEnabled = useMapLayersStore((s) => s.enabled);
  const showProfiles = isDuoLayerVisible(layerEnabled, "duo-profiles", true);
  const showUserLocation = isDuoLayerVisible(layerEnabled, "duo-user-location", true);
  const showActivityHeatmap = isDuoLayerVisible(layerEnabled, "duo-activity-heatmap", true);

  const mappableProfiles = useMemo(() => {
    void profilesOrderKey;
    return profiles.filter((p) => isValidCoord(p.coordinates));
  }, [profiles, profilesOrderKey]);

  const initialViewport = useMemo(() => {
    if (userCoordinates && isValidCoord(userCoordinates)) {
      const [lat, lng] = userCoordinates;
      return {
        center: [lng, lat] as [number, number],
        zoom: zoomForRadiusKm(lat, MAP_INITIAL_RADIUS_KM),
      };
    }
    return {
      center: DEFAULT_CENTER,
      zoom: zoomForRadiusKm(DEFAULT_CENTER[1], MAP_INITIAL_RADIUS_KM),
    };
  }, [userCoordinates]);

  return (
    <div className="map-surface relative h-full min-h-[300px] w-full">
      <MapLayersSettingsPanel />
      <Map
        center={initialViewport.center}
        zoom={initialViewport.zoom}
        maxPitch={85}
        projection={GLOBE_PROJECTION}
        theme={theme}
        className="h-full min-h-[300px] w-full"
      >
        <GlobeExperience />
        <MapLayersBridge />
        <SpaceStarfieldBridge />
        <SpaceAtmosphereBridge />
        <WeatherBridge />
        {showActivityHeatmap ? (
          <ActivityHeatmapBridge userCoordinates={userCoordinates} />
        ) : null}
        <MapDebugHud />
        <MapControlBridge userCoordinates={userCoordinates} />
        {showUserLocation && userCoordinates && isValidCoord(userCoordinates) ? (
          <UserLocationMarker coordinates={userCoordinates} />
        ) : null}
        {showProfiles ? (
          <GlobeAvatarBridge
            profiles={mappableProfiles}
            focusProfileId={focusProfileId}
            onProfileFocus={onProfileFocus}
          />
        ) : null}
        <MapResizeHandler />
        <MapInitialViewport userCoordinates={userCoordinates} />
        <FocusOnProfile profiles={mappableProfiles} focusProfileId={focusProfileId} />
      </Map>
    </div>
  );
}

export { isValidCoord, profileKey, toLngLat } from "./utils";
