"use client";

import { useEffect, useState } from "react";
import { getDevicePosition } from "@/lib/geolocation";
import { resolveProfileCoordinates } from "@/lib/locationCoords";

/**
 * Browser geolocation when available; falls back to profile city coordinates.
 */
export function useUserCoordinates(
  profileLocation?: string,
  userId?: number | string
): [number, number] | null {
  const [coords, setCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fallback = resolveProfileCoordinates(profileLocation, userId);

    getDevicePosition()
      .then((fix) => {
        if (!cancelled) setCoords(fix.coordinates);
      })
      .catch(() => {
        if (!cancelled) setCoords(fallback);
      });

    return () => {
      cancelled = true;
    };
  }, [profileLocation, userId]);

  return coords;
}
