"use client";

import MapLibreGL from "maplibre-gl";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/mapcn-map";
import { useTheme } from "@/contexts/ThemeContext";
import { formatDistanceCompact } from "@/lib/distance";
import { profilePhotoUrl } from "@/components/map/MatchMapCard";
import { MapFloatingControls } from "./MapFloatingControls";
import SpaceStarfieldBridge from "./SpaceStarfieldBridge";
import SpaceAtmosphereBridge from "./SpaceAtmosphereBridge";
import MapLayersBridge from "./layers/MapLayersBridge";
import MapLayersSettingsPanel from "./layers/MapLayersSettingsPanel";
import MapDebugHud from "./layers/MapDebugHud";
import WeatherBridge from "./weather/WeatherBridge";
import WeatherClickBridge from "./weather/WeatherClickBridge";
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
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
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
          padding: {
            top: window.innerWidth < 768 ? 100 : 120,
            bottom: window.innerWidth < 768 ? 220 : 160,
            left: window.innerWidth < 768 ? 40 : 80,
            right: window.innerWidth < 768 ? 40 : 80,
          },
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
  const focusPoint = useMemo(() => {
    if (!focusProfileId) return null;
    const profile = profiles.find((p) => profileKey(p) === String(focusProfileId));
    if (!profile || !isValidCoord(profile.coordinates)) return null;
    const { longitude, latitude } = toLngLat(profile.coordinates);
    return { longitude, latitude, key: `${longitude.toFixed(5)},${latitude.toFixed(5)}` };
  }, [profiles, focusProfileId]);

  useEffect(() => {
    if (!map || !isLoaded || !focusPoint) return;

    map.flyTo({
      center: [focusPoint.longitude, focusPoint.latitude],
      zoom: Math.max(map.getZoom(), MARKER_FOCUS_ZOOM),
      pitch: Math.max(map.getPitch(), 52),
      duration: FLY_DURATION_MS,
      easing: FLY_EASE,
      essential: true,
    });
    // focusPoint.key is the stable identity for these coordinates
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-fly on profiles rememoize
  }, [focusProfileId, focusPoint?.key, map, isLoaded]);

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

const ProfileMarker = memo(function ProfileMarker({
  profile,
  isFocused,
  onProfileFocus,
}: {
  profile: MapProfile;
  isFocused?: boolean;
  onProfileFocus?: (profileId: string) => void;
}) {
  const { map } = useMap();
  const key = profileKey(profile);
  if (!isValidCoord(profile.coordinates) || profile.distanceMeters == null) return null;
  const { longitude, latitude } = toLngLat(profile.coordinates);

  const handleClick = () => {
    map?.flyTo({
      center: [longitude, latitude],
      zoom: Math.max(map.getZoom(), MARKER_FOCUS_ZOOM),
      pitch: Math.max(map.getPitch(), 52),
      duration: FLY_DURATION_MS,
      easing: FLY_EASE,
      essential: true,
    });
    onProfileFocus?.(key);
  };

  return (
    <MapMarker longitude={longitude} latitude={latitude} onClick={handleClick}>
      <MarkerContent className="map-marker">
        <div
          className={`map-marker__avatar ${isFocused ? "map-marker__avatar--focused" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profilePhotoUrl(profile)} alt="" loading="lazy" decoding="async" />
          <span className="map-marker__badge">
            {formatDistanceCompact(profile.distanceMeters)}
          </span>
        </div>
        <div className="map-marker__pin" />
      </MarkerContent>
    </MapMarker>
  );
});

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
  // Keep light/dark mapcn styles identical so app theme toggles don't
  // override the Map Style picker (Street / Satellite / Dark Mode).
  const managedMapStyles = useMemo(
    () => ({
      light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      dark: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    }),
    []
  );
  const showProfiles = useMapLayersStore((s) =>
    isDuoLayerVisible(s.enabled, "duo-profiles", true)
  );
  const showUserLocation = useMapLayersStore((s) =>
    isDuoLayerVisible(s.enabled, "duo-user-location", true)
  );
  const showActivityHeatmap = useMapLayersStore((s) =>
    isDuoLayerVisible(s.enabled, "duo-activity-heatmap", true)
  );

  const mappableProfiles = useMemo(() => {
    void profilesOrderKey;
    return profiles.filter((p) => isValidCoord(p.coordinates));
  }, [profiles, profilesOrderKey]);

  const initialViewport = useMemo(() => {
    if (userCoordinates && isValidCoord(userCoordinates)) {
      const [lat, lng] = userCoordinates;
      return {
        center: [lng, lat] as [number, number],
        // Start at globe scale, then MapInitialViewport performs the existing
        // 20 km fit as a smooth camera transition after the canvas is ready.
        zoom: 2.2,
      };
    }
    return {
      center: DEFAULT_CENTER,
      zoom: 2.2,
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
        canvasContextAttributes={{
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        theme={theme}
        styles={managedMapStyles}
        className="h-full min-h-[300px] w-full"
      >
        <GlobeExperience />
        <MapLayersBridge />
        <SpaceStarfieldBridge />
        <SpaceAtmosphereBridge />
        <WeatherBridge />
        <WeatherClickBridge />
        {showActivityHeatmap ? (
          <ActivityHeatmapBridge userCoordinates={userCoordinates} />
        ) : null}
        <MapDebugHud />
        <MapControlBridge userCoordinates={userCoordinates} />
        {showUserLocation && userCoordinates && isValidCoord(userCoordinates) ? (
          <UserLocationMarker coordinates={userCoordinates} />
        ) : null}
        {showProfiles
          ? mappableProfiles.map((profile) => (
              <ProfileMarker
                key={profileKey(profile)}
                profile={profile}
                isFocused={focusProfileId === profileKey(profile)}
                onProfileFocus={onProfileFocus}
              />
            ))
          : null}
        <MapResizeHandler />
        <MapInitialViewport userCoordinates={userCoordinates} />
        <FocusOnProfile profiles={mappableProfiles} focusProfileId={focusProfileId} />
      </Map>
    </div>
  );
}

export { isValidCoord, profileKey, toLngLat } from "./utils";
