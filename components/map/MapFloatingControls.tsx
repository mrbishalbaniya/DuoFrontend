"use client";

import { useState } from "react";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { MapMaterialIcon } from "./layers/MapMaterialIcon";

interface MapFloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenterNorth: () => void;
  onLocate: () => void;
}

export function MapFloatingControls({
  onZoomIn,
  onZoomOut,
  onRecenterNorth,
  onLocate,
}: MapFloatingControlsProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const panelOpen = useMapLayersStore((s) => s.panelOpen);
  const togglePanel = useMapLayersStore((s) => s.togglePanel);

  return (
    <div className="map-controls-stack pointer-events-auto">
      <div className={`map-controls-group ${toolsOpen ? "map-controls-group--open" : ""}`}>
        <div className="map-controls-group__collapsible" aria-hidden={!toolsOpen}>
          <button
            type="button"
            onClick={togglePanel}
            aria-label="Map layers"
            aria-expanded={panelOpen}
            aria-controls="map-layers-panel"
            className={`map-controls-btn ${panelOpen ? "map-controls-btn--active" : ""}`}
          >
            <MapMaterialIcon name="layers" className="text-xl text-primary" />
          </button>
          <div className="map-control-divider" />
          <button
            type="button"
            onClick={onZoomIn}
            aria-label="Zoom in"
            className="map-controls-btn"
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          <div className="map-control-divider" />
          <button
            type="button"
            onClick={onZoomOut}
            aria-label="Zoom out"
            className="map-controls-btn"
          >
            <span className="material-symbols-outlined text-xl">remove</span>
          </button>
          <div className="map-control-divider" />
          <button
            type="button"
            onClick={onRecenterNorth}
            aria-label="Recenter to north"
            title="Recenter to north"
            className="map-controls-btn"
          >
            <span className="material-symbols-outlined text-xl">explore</span>
          </button>
          <div className="map-control-divider" />
        </div>
        <button
          type="button"
          onClick={() => setToolsOpen((open) => !open)}
          aria-expanded={toolsOpen}
          aria-label={toolsOpen ? "Hide map tools" : "Show map tools"}
          className={`map-controls-btn map-controls-toggle ${toolsOpen ? "map-controls-toggle--open" : ""}`}
        >
          <span className="material-symbols-outlined text-xl">
            {toolsOpen ? "expand_more" : "layers"}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onLocate}
        aria-label="Center on my location"
        className="map-controls-locate"
      >
        <span className="material-symbols-outlined text-xl">my_location</span>
      </button>
    </div>
  );
}
