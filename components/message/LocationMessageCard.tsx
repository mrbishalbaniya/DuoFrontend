"use client";

import { memo } from "react";
import type { SharedLocation } from "@/lib/chatLocation";
import { useTheme } from "@/contexts/ThemeContext";

const ZOOM = 15;
const TILE = 256;
const CARD_W = 260;
const CARD_H = 150;

function tilePosition(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

/** Theme-matched OpenStreetMap preview, pin centered. */
function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  const { resolvedTheme } = useTheme();
  // OpenStreetMap tiles need no API key. Dark mode inverts them with a
  // filter (same trick many map apps use) so the preview matches the theme.
  const dark = resolvedTheme === "dark";
  const tileFilter = dark
    ? "invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.85) saturate(0.6)"
    : "saturate(0.85)";
  const { x, y } = tilePosition(lat, lng, ZOOM);
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const px = (x - tx) * TILE;
  const py = (y - ty) * TILE;
  // 3x3 tiles around the point; shift so the point lands in the card center.
  const offsetX = CARD_W / 2 - (TILE + px);
  const offsetY = CARD_H / 2 - (TILE + py);
  const max = 2 ** ZOOM;
  const tiles: { key: string; src: string; left: number; top: number }[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tileX = (((tx + dx) % max) + max) % max;
      const tileY = ty + dy;
      if (tileY < 0 || tileY >= max) continue;
      tiles.push({
        key: `${dx}:${dy}`,
        src: `https://tile.openstreetmap.org/${ZOOM}/${tileX}/${tileY}.png`,
        left: (dx + 1) * TILE + offsetX,
        top: (dy + 1) * TILE + offsetY,
      });
    }
  }

  return (
    <div className={`relative overflow-hidden ${dark ? "bg-[#1b1b1d]" : "bg-[#e8e4de]"}`} style={{ width: "100%", height: CARD_H }}>
      {tiles.map((t) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={t.key}
          src={t.src}
          alt=""
          width={TILE}
          height={TILE}
          loading="lazy"
          draggable={false}
          className="absolute max-w-none select-none"
          style={{ left: `calc(50% - ${CARD_W / 2}px + ${t.left}px)`, top: t.top, filter: tileFilter }}
        />
      ))}
      <span className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        <span
          className="material-symbols-outlined text-[36px]"
          style={{ fontVariationSettings: "'FILL' 1", color: "#f43f5e" }}
        >
          location_on
        </span>
      </span>
      <span
        className={`absolute bottom-1 right-1.5 rounded px-1 text-[9px] ${
          dark ? "bg-black/60 text-neutral-300" : "bg-white/80 text-neutral-600"
        }`}
      >
        © OpenStreetMap
      </span>
    </div>
  );
}

export const LocationMessageCard = memo(function LocationMessageCard({
  location,
  mine,
  addressLoading = false,
}: {
  location: SharedLocation;
  mine: boolean;
  addressLoading?: boolean;
}) {
  const coords = `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  return (
    <a
      href={location.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-full overflow-hidden rounded-2xl border border-outline-variant/40 bg-secondary text-on-surface shadow-sm transition hover:opacity-95"
      style={{ width: CARD_W }}
      title="Open in Google Maps"
      onClick={(e) => e.stopPropagation()}
    >
      <MapPreview lat={location.lat} lng={location.lng} />
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <span className="material-symbols-outlined text-[18px]">{mine ? "my_location" : "location_on"}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{mine ? "Your location" : "Shared location"}</p>
          {addressLoading ? (
            <p className="mt-0.5 h-3 w-36 animate-pulse rounded bg-on-surface/10" aria-label="Finding address" />
          ) : location.address ? (
            <p className="line-clamp-2 text-[11px] leading-snug text-on-surface-variant" title={coords}>
              {location.address}
            </p>
          ) : (
            <p className="truncate text-[11px] text-on-surface-variant">{coords}</p>
          )}
        </div>
        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-primary">
          Open
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </span>
      </div>
    </a>
  );
});
