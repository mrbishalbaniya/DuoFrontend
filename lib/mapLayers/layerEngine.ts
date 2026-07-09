import type { FillLayerSpecification, LineLayerSpecification, Map as MapLibreMap } from "maplibre-gl";
import { readMapSkySpec } from "@/lib/mapTheme";
import { computeSpaceFade } from "@/lib/spaceEnvironment/zoomFade";
import { applyWeatherRasterLayers } from "./weatherEngine";
import {
  NATURAL_EARTH,
  OVERLAY_PREFIX,
  OVERLAY_SOURCE_PREFIX,
  resolveBasemapForGlobeMode,
  TERRAIN_SOURCE_ID,
} from "./basemaps";

type OverlaySpec = {
  id: string;
  source: { type: "geojson"; data: string };
  layer: {
    type: "line" | "fill";
    paint: Record<string, unknown>;
  };
};

const OVERLAYS: Record<string, OverlaySpec> = {
  "geo-country-borders": {
    id: "country-borders",
    source: { type: "geojson", data: NATURAL_EARTH.countries },
    layer: {
      type: "line",
      paint: {
        "line-color": "rgba(232, 74, 122, 0.55)",
        "line-width": 1.2,
        "line-opacity": 0.85,
      },
    },
  },
  "geo-state-borders": {
    id: "state-borders",
    source: { type: "geojson", data: NATURAL_EARTH.states },
    layer: {
      type: "line",
      paint: {
        "line-color": "rgba(212, 165, 116, 0.45)",
        "line-width": 0.8,
        "line-opacity": 0.7,
        "line-dasharray": [2, 2],
      },
    },
  },
  "geo-coastlines": {
    id: "coastlines",
    source: { type: "geojson", data: NATURAL_EARTH.coast },
    layer: {
      type: "line",
      paint: {
        "line-color": "rgba(140, 185, 235, 0.6)",
        "line-width": 1,
        "line-opacity": 0.75,
      },
    },
  },
  "geo-oceans": {
    id: "oceans",
    source: { type: "geojson", data: NATURAL_EARTH.ocean },
    layer: {
      type: "fill",
      paint: {
        "fill-color": "rgba(36, 92, 223, 0.08)",
        "fill-opacity": 0.6,
      },
    },
  },
};

function sourceId(key: string) {
  return `${OVERLAY_SOURCE_PREFIX}${key}`;
}

function layerId(key: string) {
  return `${OVERLAY_PREFIX}${key}`;
}

function removeOverlay(map: MapLibreMap, overlayKey: string) {
  const spec = OVERLAYS[overlayKey];
  if (!spec) return;
  const lid = layerId(spec.id);
  const sid = sourceId(spec.id);
  if (map.getLayer(lid)) map.removeLayer(lid);
  if (map.getSource(sid)) map.removeSource(sid);
}

function addOverlay(map: MapLibreMap, layerKey: string) {
  const spec = OVERLAYS[layerKey];
  if (!spec) return;
  const sid = sourceId(spec.id);
  const lid = layerId(spec.id);
  if (map.getSource(sid)) return;

  map.addSource(sid, spec.source);
  if (spec.layer.type === "line") {
    map.addLayer({
      id: lid,
      type: "line",
      source: sid,
      paint: spec.layer.paint as LineLayerSpecification["paint"],
      layout: { visibility: "visible" },
    });
  } else {
    map.addLayer({
      id: lid,
      type: "fill",
      source: sid,
      paint: spec.layer.paint as FillLayerSpecification["paint"],
      layout: { visibility: "visible" },
    });
  }
}

function setTerrain(map: MapLibreMap, enabled: boolean) {
  if (!isMapStyleReady(map)) return;
  if (enabled) {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        maxzoom: 15,
        encoding: "terrarium",
      });
    }
    map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.15 });
  } else {
    map.setTerrain(null);
  }
}

function isMapStyleReady(map: MapLibreMap): boolean {
  try {
    return Boolean(map.isStyleLoaded());
  } catch {
    return false;
  }
}

function applySky(map: MapLibreMap, enabled: Record<string, boolean>) {
  if (!isMapStyleReady(map)) return;
  if (enabled["globe-atmosphere"] === false && enabled["globe-earth-glow"] === false) {
    map.setSky({ "sky-color": "transparent", "horizon-color": "transparent" });
    return;
  }
  const sky = readMapSkySpec();
  const fade = computeSpaceFade(map.getZoom());
  const zoom = map.getZoom();
  const spaceView = zoom < 5;

  let atmosphereBlend =
    (typeof sky["atmosphere-blend"] === "number" ? sky["atmosphere-blend"] : 0.82) *
    (spaceView ? 0.22 : 0.4 + fade.atmosphereBoost * 0.6);
  if (enabled["globe-earth-glow"] === false) {
    atmosphereBlend = Math.min(0.28, atmosphereBlend);
  }
  if (enabled["globe-atmosphere"] === false) {
    atmosphereBlend = 0;
  }
  if (enabled["weather-day-night"] === true) {
    atmosphereBlend = Math.min(1, atmosphereBlend + 0.15);
  }
  map.setSky({
    ...sky,
    "sky-color": "#000000",
    "horizon-color": "#000000",
    "fog-color": "#000000",
    "atmosphere-blend": atmosphereBlend,
    "sky-horizon-blend": spaceView ? 0 : 0.12 + fade.atmosphereBoost * 0.2,
    "horizon-fog-blend": spaceView ? 0 : 0.03 + fade.atmosphereBoost * 0.05,
  });
}

export function applyGlobeLighting(map: MapLibreMap) {
  if (!isMapStyleReady(map)) return;
  const fade = computeSpaceFade(map.getZoom());
  const bearing = map.getBearing();
  const pitch = map.getPitch();
  const sunAz = ((bearing + 200) % 360) - 180;
  const sunPolar = 52 + pitch * 0.22;
  map.setLight({
    anchor: "viewport",
    color: "#fff8f0",
    intensity: 0.28 + fade.atmosphereBoost * 0.42,
    position: [1.2, sunAz, sunPolar],
  });
}

export function applyDynamicGlobeAtmosphere(
  map: MapLibreMap,
  enabled: Record<string, boolean>
) {
  applySky(map, enabled);
  applyGlobeLighting(map);
}

let lastBasemapKey = "";

export async function applyMapLayersState(
  map: MapLibreMap,
  state: {
    enabled: Record<string, boolean>;
    baseMapId: string;
    globeModeId: string;
  }
): Promise<void> {
  const styleKey = `${state.baseMapId}:${state.globeModeId}`;
  if (styleKey !== lastBasemapKey) {
    lastBasemapKey = styleKey;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const bearing = map.getBearing();
    const pitch = map.getPitch();

    const nextStyle = resolveBasemapForGlobeMode(state.baseMapId, state.globeModeId);
    await new Promise<void>((resolve) => {
      const onLoad = () => {
        map.off("style.load", onLoad);
        map.jumpTo({ center, zoom, bearing, pitch });
        resolve();
      };
      map.once("style.load", onLoad);
      map.setStyle(nextStyle, { diff: false });
    });
  }

  applyDynamicGlobeAtmosphere(map, state.enabled);

  if (isMapStyleReady(map)) {
    try {
      applyWeatherRasterLayers(map, state.enabled);
    } catch {
      /* style transitioning */
    }
  }

  const terrainOn =
    state.enabled["globe-terrain-elevation"] === true ||
    state.enabled["base-topographic"] === true;
  setTerrain(map, terrainOn);

  for (const key of Object.keys(OVERLAYS)) {
    if (state.enabled[key]) addOverlay(map, key);
    else removeOverlay(map, key);
  }

  map.showTileBoundaries = Boolean(state.enabled["dev-tile-grid"]);
}

export function isDuoLayerVisible(
  enabled: Record<string, boolean>,
  layerId: string,
  fallback = true
): boolean {
  return enabled[layerId] !== undefined ? enabled[layerId] : fallback;
}
