"use client";

import MapLibreGL from "maplibre-gl";
import { useEffect, useMemo } from "react";
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/mapcn-map";
import { formatDistanceCompact } from "@/lib/distance";
import { profilePhotoUrl } from "@/components/map/MatchMapCard";
import type { MapProfile } from "./types";

interface MapViewProps {
  profiles: MapProfile[];
  userCoordinates?: [number, number] | null;
  profilesOrderKey?: string;
  focusProfileId?: string | null;
  onProfileFocus?: (profileId: string) => void;
}

const MARKER_FOCUS_ZOOM = 15;
const FLY_DURATION_MS = 850;
const DEFAULT_CENTER: [number, number] = [85.324, 27.7172];

function isValidCoord(c: unknown): c is [number, number] {
  return (
    Array.isArray(c) &&
    c.length === 2 &&
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1]) &&
    !(c[0] === 0 && c[1] === 0)
  );
}

function profileKey(profile: MapProfile): string {
  return String(profile.user_id ?? profile.id ?? profile.full_name);
}

/** Project stores [latitude, longitude]; MapLibre expects [longitude, latitude]. */
function toLngLat([lat, lng]: [number, number]): { longitude: number; latitude: number } {
  return { longitude: lng, latitude: lat };
}

function MapResizeHandler() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const refresh = () => {
      try {
        if (map.getContainer()?.isConnected) {
          map.resize();
        }
      } catch {
        /* map already destroyed */
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

function MapFitBounds({
  profiles,
  userCoordinates,
}: {
  profiles: MapProfile[];
  userCoordinates?: [number, number] | null;
}) {
  const { map, isLoaded } = useMap();

  const profilePointsKey = useMemo(
    () =>
      [
        userCoordinates ? `you:${userCoordinates.join(",")}` : "",
        ...profiles
          .filter((p) => isValidCoord(p.coordinates))
          .map(
            (p) =>
              `${p.browseOrder ?? ""}:${profileKey(p)}:${p.coordinates[0]},${p.coordinates[1]}`
          ),
      ].join("|"),
    [profiles, userCoordinates]
  );

  useEffect(() => {
    if (!map || !isLoaded) return;

    let cancelled = false;

    const frame = requestAnimationFrame(() => {
      if (cancelled) return;

      try {
        const container = map.getContainer();
        if (!container?.isConnected) return;

        const points = profiles
          .map((p) => p.coordinates)
          .filter(isValidCoord)
          .map(([lat, lng]) => [lng, lat] as [number, number]);

        if (userCoordinates && isValidCoord(userCoordinates)) {
          points.push([userCoordinates[1], userCoordinates[0]]);
        }

        if (points.length === 0) return;

        if (points.length === 1) {
          map.setCenter(points[0]);
          map.setZoom(13);
          return;
        }

        const bounds = points.reduce(
          (acc, point) => acc.extend(point),
          new MapLibreGL.LngLatBounds(points[0], points[0])
        );

        map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 0 });
      } catch {
        /* map not ready or already removed */
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [profilePointsKey, map, isLoaded, profiles, userCoordinates]);

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

    try {
      map.flyTo({
        center: [longitude, latitude],
        zoom: MARKER_FOCUS_ZOOM,
        duration: FLY_DURATION_MS,
      });
    } catch {
      /* map not ready */
    }
  }, [focusProfileId, map, isLoaded, profiles]);

  return null;
}

function ProfileMarker({
  profile,
  onProfileFocus,
}: {
  profile: MapProfile;
  onProfileFocus?: (profileId: string) => void;
}) {
  const { map } = useMap();
  const key = profileKey(profile);
  const { longitude, latitude } = toLngLat(profile.coordinates);

  const handleClick = () => {
    map?.flyTo({
      center: [longitude, latitude],
      zoom: MARKER_FOCUS_ZOOM,
      duration: FLY_DURATION_MS,
    });
    onProfileFocus?.(key);
  };

  return (
    <MapMarker longitude={longitude} latitude={latitude} onClick={handleClick}>
      <MarkerContent className="flex cursor-pointer flex-col items-center">
        <div className="relative">
          <div className="h-11 w-11 overflow-hidden rounded-full border-[2.5px] border-white bg-surface-dim shadow-[0_4px_14px_rgba(0,0,0,0.35)] sm:h-12 sm:w-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profilePhotoUrl(profile)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1c1c1e]/90 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur-sm">
            {formatDistanceCompact(profile.distanceMeters)}
          </div>
        </div>
        <div className="mt-2 h-2 w-2 rounded-full border border-white/80 bg-primary shadow-sm" />
      </MarkerContent>
    </MapMarker>
  );
}

function UserLocationMarker({ coordinates }: { coordinates: [number, number] }) {
  const { longitude, latitude } = toLngLat(coordinates);

  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <MarkerContent className="relative flex h-16 w-16 items-center justify-center">
        <div className="ios-location-pulse absolute h-14 w-14 rounded-full bg-[#0a84ff]/25" />
        <div className="absolute h-10 w-10 rounded-full bg-[#0a84ff]/15" />
        <div className="relative h-4 w-4 rounded-full border-[2.5px] border-white bg-[#0a84ff] shadow-[0_2px_8px_rgba(10,132,255,0.45)]" />
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
  const mappableProfiles = useMemo(
    () => profiles.filter((p) => isValidCoord(p.coordinates)),
    [profiles, profilesOrderKey]
  );

  return (
    <div className="relative h-full min-h-[300px] w-full">
      <Map
        center={DEFAULT_CENTER}
        zoom={11}
        theme="dark"
        className="h-full min-h-[300px] w-full"
      >
        <MapControls
          showZoom
          showLocate
          position="top-right"
          className="ios-map-controls right-3 top-[calc(5.75rem+env(safe-area-inset-top))] md:top-3"
        />
        {userCoordinates && isValidCoord(userCoordinates) ? (
          <UserLocationMarker coordinates={userCoordinates} />
        ) : null}
        {mappableProfiles.map((profile) => (
          <ProfileMarker
            key={profileKey(profile)}
            profile={profile}
            onProfileFocus={onProfileFocus}
          />
        ))}
        <MapResizeHandler />
        <MapFitBounds profiles={mappableProfiles} userCoordinates={userCoordinates} />
        <FocusOnProfile profiles={mappableProfiles} focusProfileId={focusProfileId} />
      </Map>
    </div>
  );
}
