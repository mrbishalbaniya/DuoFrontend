import type { PresenceStatus } from "./types";

const STATUS_CYCLE: PresenceStatus[] = ["online", "away", "busy", "offline"];

export function defaultPresenceForUser(userId: string | number | undefined): PresenceStatus {
  if (!userId) return "offline";
  const n = Number(userId);
  if (Number.isNaN(n)) return "online";
  return STATUS_CYCLE[n % 3] ?? "online";
}

export function presenceColor(status: PresenceStatus): string {
  switch (status) {
    case "online":
      return "#22c55e";
    case "away":
      return "#a78bfa";
    case "busy":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

export function presenceLabel(status: PresenceStatus): string {
  switch (status) {
    case "online":
      return "Online";
    case "away":
      return "Away";
    case "busy":
      return "Busy";
    default:
      return "Offline";
  }
}
