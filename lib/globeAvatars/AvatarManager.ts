import type { MapProfile } from "@/components/map/types";
import { isValidCoord, toLngLat } from "@/components/map/utils";

import type { GlobeAvatarInstance, PresenceStatus } from "./types";
import { defaultPresenceForUser } from "./presence";

const CLUSTER_ZOOM_THRESHOLD = 4.2;
const CLUSTER_METERS = 120_000;

function metersToLatOffset(meters: number): number {
  return meters / 111_320;
}

function metersToLngOffset(meters: number, lat: number): number {
  return meters / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function spreadOffsets(
  profiles: MapProfile[],
  zoom: number
): Map<string, { offsetLng: number; offsetLat: number }> {
  const offsets = new Map<string, { offsetLng: number; offsetLat: number }>();
  const buckets = new Map<string, MapProfile[]>();

  for (const profile of profiles) {
    if (!isValidCoord(profile.coordinates)) continue;
    const { latitude, longitude } = toLngLat(profile.coordinates);
    const key = `${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
    const list = buckets.get(key) ?? [];
    list.push(profile);
    buckets.set(key, list);
  }

  for (const group of buckets.values()) {
    const n = group.length;
    group.forEach((profile, index) => {
      const id = String(profile.user_id ?? profile.id ?? profile.full_name);
      if (n === 1) {
        offsets.set(id, { offsetLng: 0, offsetLat: 0 });
        return;
      }
      if (!isValidCoord(profile.coordinates)) return;
      const angle = (index / n) * Math.PI * 2;
      const spreadMeters = zoom < CLUSTER_ZOOM_THRESHOLD ? 1800 : 120 + index * 35;
      const lat = toLngLat(profile.coordinates).latitude;
      offsets.set(id, {
        offsetLng: metersToLngOffset(Math.cos(angle) * spreadMeters, lat),
        offsetLat: metersToLatOffset(Math.sin(angle) * spreadMeters),
      });
    });
  }

  return offsets;
}

export class AvatarManager {
  private instances: GlobeAvatarInstance[] = [];

  sync(
    profiles: MapProfile[],
    zoom: number,
    selectedId: string | null,
    presenceMap: Record<string, PresenceStatus>
  ): GlobeAvatarInstance[] {
    const offsets = spreadOffsets(profiles, zoom);
    this.instances = profiles
      .filter((profile) => isValidCoord(profile.coordinates))
      .map((profile) => {
      const id = String(profile.user_id ?? profile.id ?? profile.full_name);
      const { longitude, latitude } = toLngLat(profile.coordinates!);
      const offset = offsets.get(id) ?? { offsetLng: 0, offsetLat: 0 };
      const userKey = String(profile.user_id ?? profile.id ?? "");
      return {
        id,
        profile,
        lng: longitude + offset.offsetLng,
        lat: latitude + offset.offsetLat,
        offsetLng: offset.offsetLng,
        offsetLat: offset.offsetLat,
        presence: presenceMap[userKey] ?? defaultPresenceForUser(profile.user_id ?? profile.id),
        animation: selectedId === id ? "selected" : "idle",
        selected: selectedId === id,
      };
    });

    if (zoom < CLUSTER_ZOOM_THRESHOLD && this.instances.length > 8) {
      return this.clusterInstances(this.instances);
    }

    return this.instances;
  }

  private clusterInstances(instances: GlobeAvatarInstance[]): GlobeAvatarInstance[] {
    const used = new Set<string>();
    const result: GlobeAvatarInstance[] = [];

    for (const inst of instances) {
      if (used.has(inst.id)) continue;
      const cluster: GlobeAvatarInstance[] = [inst];
      used.add(inst.id);

      for (const other of instances) {
        if (used.has(other.id)) continue;
        const dLat = (inst.lat - other.lat) * 111_320;
        const dLng =
          (inst.lng - other.lng) *
          111_320 *
          Math.cos(((inst.lat + other.lat) * 0.5 * Math.PI) / 180);
        if (Math.hypot(dLat, dLng) < CLUSTER_METERS) {
          cluster.push(other);
          used.add(other.id);
        }
      }

      if (cluster.length === 1) {
        result.push(inst);
        continue;
      }

      const rep = cluster[0]!;
      result.push({
        ...rep,
        clusterId: `cluster-${rep.id}`,
        profile: {
          ...rep.profile,
          full_name: `${cluster.length} nearby`,
        },
      });
    }

    return result;
  }

  getInstances(): GlobeAvatarInstance[] {
    return this.instances;
  }

  pickAtScreen(
    screenX: number,
    screenY: number,
    points: { id: string; x: number; y: number; radius: number }[],
    maxDistance = 42
  ): string | null {
    let best: { id: string; dist: number } | null = null;
    for (const p of points) {
      const dist = Math.hypot(p.x - screenX, p.y - screenY);
      const threshold = Math.max(maxDistance, p.radius);
      if (dist <= threshold && (!best || dist < best.dist)) {
        best = { id: p.id, dist };
      }
    }
    return best?.id ?? null;
  }
}
