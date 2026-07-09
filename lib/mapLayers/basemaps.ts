import type { StyleSpecification } from "maplibre-gl";

const CARTO = {
  voyager: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

const ESRI_SAT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

function rasterBasemap(
  id: string,
  tiles: string[],
  attribution: string,
  extraLayers: StyleSpecification["layers"] = []
): StyleSpecification {
  return {
    version: 8,
    name: id,
    sources: {
      basemap: {
        type: "raster",
        tiles,
        tileSize: 256,
        attribution,
        maxzoom: 19,
      },
    },
    layers: [
      { id: "basemap", type: "raster", source: "basemap", minzoom: 0, maxzoom: 22 },
      ...extraLayers,
    ],
  };
}

const LABELS_OVERLAY: StyleSpecification["layers"] = [
  {
    id: "labels",
    type: "raster",
    source: "labels",
    minzoom: 0,
    maxzoom: 22,
    paint: { "raster-opacity": 0.95 },
  },
];

export function getBasemapStyle(baseMapId: string): string | StyleSpecification {
  switch (baseMapId) {
    case "base-satellite":
      return rasterBasemap("satellite", [ESRI_SAT], "Esri, Maxar, Earthstar");
    case "base-satellite-labels":
    case "base-hybrid":
      return {
        version: 8,
        sources: {
          basemap: { type: "raster", tiles: [ESRI_SAT], tileSize: 256, maxzoom: 19 },
          labels: {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            maxzoom: 19,
          },
        },
        layers: [
          { id: "basemap", type: "raster", source: "basemap" },
          ...LABELS_OVERLAY,
        ],
      };
    case "base-terrain":
    case "base-topographic":
      return rasterBasemap(
        "topo",
        ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
        "OpenTopoMap"
      );
    case "base-night":
    case "base-dark":
    case "base-blueprint":
    case "globe-night-view":
      return CARTO.dark;
    case "base-light":
    case "base-minimal":
      return CARTO.light;
    case "base-monochrome":
      return CARTO.light;
    case "base-outdoors":
    case "base-navigation":
    case "base-standard-street":
    case "globe-realistic-earth":
      return CARTO.voyager;
    default:
      return CARTO.voyager;
  }
}

/**
 * At planetary zoom, dark basemaps paint the whole Earth black.
 * Prefer a colorful globe style, then restore the chosen style when zoomed in.
 */
export function resolveBasemapForView(
  baseMapId: string,
  zoom: number
): string | StyleSpecification {
  if (zoom < 5.5 && (baseMapId === "base-night" || baseMapId === "base-dark")) {
    return getBasemapStyle("base-satellite");
  }
  return getBasemapStyle(baseMapId);
}

export function resolveBasemapForGlobeMode(
  baseMapId: string,
  _globeModeId?: string
): string | StyleSpecification {
  return getBasemapStyle(baseMapId);
}

export const TERRAIN_SOURCE_ID = "duo-terrain-dem";
export const OVERLAY_PREFIX = "duo-overlay-";
export const OVERLAY_SOURCE_PREFIX = "duo-src-";

/** Served from /public/geojson — avoids GitHub raw 429 rate limits. */
export const NATURAL_EARTH = {
  countries: "/geojson/ne_110m_admin_0_countries.geojson",
  states: "/geojson/ne_110m_admin_1_states_provinces_lines.geojson",
  coast: "/geojson/ne_110m_coastline.geojson",
  ocean: "/geojson/ne_110m_ocean.geojson",
};
