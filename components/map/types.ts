import type { Profile } from "@/types";

export type MapProfile = Profile & {
  coordinates: [number, number];
  browseOrder?: number;
  matchId?: number;
  distanceMeters: number;
};
