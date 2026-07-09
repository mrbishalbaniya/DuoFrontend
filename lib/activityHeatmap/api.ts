import { getClientApiBase } from "@/lib/backendUrl";

import type { ActivityLayerFlags, ActivityZoneResponse } from "./types";

const base = () => getClientApiBase();

async function activityGet<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = typeof body.detail === "string" ? body.detail : "Activity request failed";
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export type ActivityFetchBbox = {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  zoom: number;
};

export function fetchActivityZones(
  bbox: ActivityFetchBbox,
  flags: ActivityLayerFlags,
  userCoords?: [number, number] | null
): Promise<ActivityZoneResponse> {
  const q = new URLSearchParams({
    lat_min: String(bbox.latMin),
    lat_max: String(bbox.latMax),
    lon_min: String(bbox.lonMin),
    lon_max: String(bbox.lonMax),
    zoom: String(bbox.zoom),
  });
  if (flags.trending) q.set("trending", "1");
  if (flags.events) q.set("events", "1");
  if (flags.friends) q.set("friends", "1");
  if (flags.nearby && userCoords) {
    q.set("nearby", "1");
    q.set("user_lat", String(userCoords[0]));
    q.set("user_lng", String(userCoords[1]));
    q.set("nearby_km", "140");
  }
  return activityGet(`/activity/zones/?${q}`);
}
