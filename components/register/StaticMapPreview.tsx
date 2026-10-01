"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "@/contexts/ThemeContext";

// CARTO vector styles: free and keyless (only CARTO's raster tiles need a key).
// Same styles as the main map page; hosts are allowed by the CSP in next.config.mjs.
const STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
} as const;

interface StaticMapPreviewProps {
  lat: number;
  lng: number;
  /** Detected address shown in a label above the pin. */
  label?: string;
  zoom?: number;
  className?: string;
}

/** Non-interactive map preview centred on a point, themed for light / dark mode. */
export function StaticMapPreview({ lat, lng, label, zoom = 14.5, className }: StaticMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  const { resolvedTheme } = useTheme();
  const theme: keyof typeof STYLES = resolvedTheme === "light" ? "light" : "dark";
  const initialTheme = useRef(theme);

  // Create the map once (MapLibre is loaded lazily so it only downloads when shown).
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;
    void import("maplibre-gl").then(({ default: maplibregl }) => {
      if (cancelled || !containerRef.current) return;
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLES[initialTheme.current],
        center: [lng, lat],
        zoom,
        interactive: false,
        attributionControl: false,
      });
      map.on("load", () => {
        if (!cancelled) setReady(true);
      });
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the detected position.
  useEffect(() => {
    mapRef.current?.jumpTo({ center: [lng, lat], zoom });
  }, [lat, lng, zoom]);

  // Follow light / dark mode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || initialTheme.current === theme) return;
    initialTheme.current = theme;
    map.setStyle(STYLES[theme]);
  }, [theme]);

  const dark = theme === "dark";

  return (
    <div className={`relative overflow-hidden bg-surface-container-high ${className ?? ""}`}>
      {/* Inline position: maplibre-gl.css sets .maplibregl-map { position: relative },
          which would override the absolute class and collapse the map to zero height. */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} aria-hidden />
      {!ready ? <div className="absolute inset-0 animate-pulse bg-on-surface/5" aria-hidden /> : null}

      {/* Pin with the detected address */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
        {label ? (
          <div
            className="mb-1 truncate rounded-full px-3 py-1 text-xs font-semibold shadow-lg"
            style={{
              maxWidth: "16rem",
              backgroundColor: dark ? "rgba(23,24,26,0.92)" : "rgba(255,255,255,0.96)",
              color: dark ? "#ffffff" : "#111827",
              border: `1px solid ${dark ? "rgba(255,255,255,0.14)" : "rgba(17,24,39,0.12)"}`,
            }}
          >
            {label}
          </div>
        ) : null}
        <span
          className="material-symbols-outlined leading-none text-primary"
          style={{
            fontSize: "2.6rem",
            fontVariationSettings: "'FILL' 1",
            filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))",
          }}
          aria-hidden
        >
          location_on
        </span>
      </div>
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/25"
        aria-hidden
      />

      {/* Compact attribution: OpenStreetMap's licence and CARTO's terms require
          credit, so it stays available behind an info button instead of a watermark. */}
      <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
        {showCredit ? (
          <span
            className="rounded px-1.5 py-0.5 leading-tight"
            style={{
              fontSize: "10px",
              backgroundColor: dark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
              color: dark ? "#d1d5db" : "#374151",
            }}
          >
            © OpenStreetMap © CARTO
          </span>
        ) : null}
        <button
          type="button"
          aria-label={showCredit ? "Hide map credits" : "Show map credits"}
          aria-expanded={showCredit}
          onClick={() => setShowCredit((v) => !v)}
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{
            backgroundColor: dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.85)",
            color: dark ? "#d1d5db" : "#374151",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }} aria-hidden>
            info
          </span>
        </button>
      </div>
    </div>
  );
}
