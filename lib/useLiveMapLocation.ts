"use client";

import { useEffect, useRef, useState } from "react";
import { getDevicePosition, watchDevicePosition } from "@/lib/geolocation";
import api from "@/lib/api";
import { resolveProfileCoordinates } from "@/lib/locationCoords";

const UPLOAD_INTERVAL_MS = 30_000;

/**
 * Tracks device GPS on the map, uploads live location when sharing is enabled,
 * and falls back to profile city coordinates.
 */
export function useLiveMapLocation(options: {
  profileLocation?: string;
  userId?: number | string;
  ghostMode?: boolean;
  enabled?: boolean;
}): [number, number] | null {
  const { profileLocation, userId, ghostMode = false, enabled = true } = options;
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const lastUploadRef = useRef(0);
  const lastCoordsRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const fallback = resolveProfileCoordinates(profileLocation, userId);

    const uploadIfNeeded = (next: [number, number]) => {
      if (ghostMode) return;
      const now = Date.now();
      const prev = lastCoordsRef.current;
      const moved =
        !prev ||
        Math.abs(prev[0] - next[0]) > 0.00015 ||
        Math.abs(prev[1] - next[1]) > 0.00015;
      if (!moved && now - lastUploadRef.current < UPLOAD_INTERVAL_MS) return;
      lastUploadRef.current = now;
      lastCoordsRef.current = next;
      void api.updateLiveLocation(next[0], next[1]).catch(() => {
        // Silent — map still works with local GPS.
      });
    };

    getDevicePosition()
      .then((fix) => {
        if (cancelled) return;
        setCoords(fix.coordinates);
        uploadIfNeeded(fix.coordinates);
      })
      .catch(() => {
        if (!cancelled) setCoords(fallback);
      });

    const stopWatch = watchDevicePosition(
      (fix) => {
        if (cancelled) return;
        setCoords(fix.coordinates);
        uploadIfNeeded(fix.coordinates);
      },
      () => {
        if (!cancelled && !lastCoordsRef.current) setCoords(fallback);
      }
    );

    return () => {
      cancelled = true;
      stopWatch?.();
    };
  }, [enabled, ghostMode, profileLocation, userId]);

  return coords;
}
