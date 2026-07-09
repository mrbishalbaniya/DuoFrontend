import type { ActivityLayerFlags } from "./types";

export const ACTIVITY_HEATMAP_LAYER_ID = "duo-activity-heatmap";

export const ACTIVITY_LAYER_IDS = {
  heatmap: "duo-activity-heatmap",
  trending: "duo-activity-trending",
  nearby: "duo-activity-nearby",
  events: "duo-activity-events",
  friends: "duo-activity-friends",
} as const;

export function isActivityHeatmapActive(enabled: Record<string, boolean>): boolean {
  return enabled[ACTIVITY_LAYER_IDS.heatmap] !== false;
}

export function activityLayerFlags(enabled: Record<string, boolean>): ActivityLayerFlags {
  const live = isActivityHeatmapActive(enabled);
  return {
    live,
    trending: live && enabled[ACTIVITY_LAYER_IDS.trending] === true,
    nearby: live && enabled[ACTIVITY_LAYER_IDS.nearby] === true,
    events: live && enabled[ACTIVITY_LAYER_IDS.events] === true,
    friends: live && enabled[ACTIVITY_LAYER_IDS.friends] === true,
  };
}

export function filterZonesClient<T extends { level: string; badges: string[]; friends_active: number }>(
  zones: T[],
  flags: ActivityLayerFlags
): T[] {
  let result = zones;
  if (flags.trending) {
    result = result.filter((z) => z.level === "trending" || z.level === "viral");
  }
  if (flags.events) {
    result = result.filter((z) => z.badges.includes("event"));
  }
  if (flags.friends) {
    result = result.filter((z) => z.friends_active > 0);
  }
  return result;
}
