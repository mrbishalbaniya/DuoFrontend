"use client";

import { useMemo } from "react";

import { useActivityHeatmapStore } from "@/lib/activityHeatmap/store";
import type { ActivityBadge } from "@/lib/activityHeatmap/types";

const BADGE_META: Record<ActivityBadge, { icon: string; label: string }> = {
  trending: { icon: "local_fire_department", label: "Trending" },
  event: { icon: "celebration", label: "Event" },
  popular: { icon: "favorite", label: "Popular" },
  recommended: { icon: "star", label: "Recommended" },
};

const LEVEL_LABEL: Record<string, string> = {
  low: "Low activity",
  moderate: "Moderate activity",
  high: "High activity",
  trending: "Trending zone",
  viral: "Viral zone",
};

export function ZonePopup() {
  const zone = useActivityHeatmapStore((s) => s.selectedZone);
  const anchor = useActivityHeatmapStore((s) => s.popupAnchor);
  const setSelected = useActivityHeatmapStore((s) => s.setSelected);

  const style = useMemo(() => {
    if (!anchor || typeof window === "undefined") {
      return { left: "50%", top: "38%", transform: "translateX(-50%)" };
    }
    return {
      left: Math.min(window.innerWidth - 300, Math.max(16, anchor.x - 150)),
      top: Math.max(72, anchor.y - 20),
    };
  }, [anchor]);

  if (!zone) return null;

  return (
    <div className="zone-popup-anchor pointer-events-none absolute inset-0 z-[34]">
      <div className="zone-popup pointer-events-auto" style={style} role="dialog" aria-label={zone.name}>
        <button
          type="button"
          className="zone-popup__close"
          aria-label="Close"
          onClick={() => setSelected(null, null)}
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="zone-popup__header" data-level={zone.level}>
          <span className="zone-popup__glow" aria-hidden />
          <div>
            <p className="zone-popup__eyebrow">{LEVEL_LABEL[zone.level] ?? "Activity zone"}</p>
            <h3 className="zone-popup__title">{zone.name}</h3>
          </div>
        </div>

        <div className="zone-popup__stats">
          <div>
            <span className="zone-popup__stat-value">{zone.active_users}</span>
            <span className="zone-popup__stat-label">Active users</span>
          </div>
          <div>
            <span className="zone-popup__stat-value">{Math.round(zone.score)}</span>
            <span className="zone-popup__stat-label">Activity score</span>
          </div>
          {zone.friends_active > 0 ? (
            <div>
              <span className="zone-popup__stat-value">{zone.friends_active}</span>
              <span className="zone-popup__stat-label">Friends nearby</span>
            </div>
          ) : null}
        </div>

        {zone.badges.length > 0 ? (
          <div className="zone-popup__badges">
            {zone.badges.map((badge) => {
              const meta = BADGE_META[badge];
              return (
                <span key={badge} className="zone-popup__badge" data-badge={badge}>
                  <span className="material-symbols-outlined text-sm">{meta.icon}</span>
                  {meta.label}
                </span>
              );
            })}
          </div>
        ) : null}

        {zone.events.length > 0 ? (
          <div className="zone-popup__events">
            <p className="zone-popup__section-title">Nearby events</p>
            <ul>
              {zone.events.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="zone-popup__meta">
          <span>{zone.messages} messages</span>
          <span>{zone.matches} matches</span>
          <span>{zone.likes} likes</span>
        </div>
      </div>
    </div>
  );
}
