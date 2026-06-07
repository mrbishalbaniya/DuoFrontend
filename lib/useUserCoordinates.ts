"use client";

import { useEffect, useState } from "react";
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

    if (typeof window === "undefined" || !navigator.geolocation) {
      setCoords(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCoords([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        if (!cancelled) setCoords(fallback);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 }
    );

    return () => {
      cancelled = true;
    };
  }, [profileLocation, userId]);

  return coords;
}
