import type { ActivityZone, DisplayZone } from "./types";

const LERP = 0.12;

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return (h % 360) * (Math.PI / 180);
}

export class ZoneInterpolator {
  private state = new Map<string, DisplayZone>();

  sync(targets: ActivityZone[]): DisplayZone[] {
    const next = new Map<string, DisplayZone>();
    const targetIds = new Set(targets.map((z) => z.id));

    for (const zone of targets) {
      const prev = this.state.get(zone.id);
      const displayScore = prev ? prev.displayScore + (zone.score - prev.displayScore) * LERP : zone.score;
      const displayRadius = prev
        ? prev.displayRadius + (zone.radius_km - prev.displayRadius) * LERP
        : zone.radius_km;

      next.set(zone.id, {
        ...zone,
        displayScore,
        displayRadius,
        phase: prev?.phase ?? hashPhase(zone.id),
      });
    }

    // Fade out removed zones
    for (const [id, prev] of this.state) {
      if (targetIds.has(id)) continue;
      const displayScore = prev.displayScore * (1 - LERP);
      const displayRadius = prev.displayRadius * (1 - LERP * 0.5);
      if (displayScore > 1.5) {
        next.set(id, { ...prev, displayScore, displayRadius });
      }
    }

    this.state = next;
    return [...next.values()].sort((a, b) => b.displayScore - a.displayScore);
  }

  tick(): DisplayZone[] {
    return [...this.state.values()];
  }
}
