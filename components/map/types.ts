import type { Profile } from "@/types";

export type MapProfile = Profile & {
  coordinates: [number, number] | null;
  browseOrder?: number;
  matchId?: number;
  distanceMeters: number | null;
  /** False when this friend has hidden their location from you. */
  locationShared: boolean;
};
