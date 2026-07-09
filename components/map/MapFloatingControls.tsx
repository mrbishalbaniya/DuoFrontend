"use client";

import { useState } from "react";
import { getLayersForCategory } from "@/lib/mapLayers/catalog";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { MapMaterialIcon } from "./layers/MapMaterialIcon";

interface MapFloatingControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenterNorth: () => void;
  onLocate: () => void;
}

const MAP_STYLES = getLayersForCategory("base");

export function MapFloatingControls({
  onZoomIn,
  onZoomOut,
  onRecenterNorth,
  onLocate,
}: MapFloatingControlsProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const baseMapId = useMapLayersStore((s) => s.baseMapId);
  const setBaseMap = useMapLayersStore((s) => s.setBaseMap);
  const settingsPanelOpen = useMapLayersStore((s) => s.settingsPanelOpen);
  const toggleSettingsPanel = useMapLayersStore((s) => s.toggleSettingsPanel);
  const setPanelOpen = useMapLayersStore((s) => s.setPanelOpen);

  const activeStyle = MAP_STYLES.find((s) => s.id === baseMapId) ?? MAP_STYLES[0];

  return (
    <div className="map-controls-stack pointer-events-auto">
      <div className={`map-controls-group ${styleOpen ? "map-controls-group--open map-controls-group--styles" : ""}`}>
        <div className="map-controls-group__collapsible" aria-hidden={!styleOpen}>
          {MAP_STYLES.map((style, index) => (
            <div key={style.id}>
              {index > 0 ? <div className="map-control-divider" /> : null}
              <button
                type="button"
                role="radio"
                aria-checked={baseMapId === style.id}
                aria-label={style.label}
                title={style.label}
                onClick={() => {
                  setBaseMap(style.id);
                  setStyleOpen(false);
                }}
                className={`map-controls-btn ${baseMapId === style.id ? "map-controls-btn--active" : ""}`}
              >
                <MapMaterialIcon name={style.icon} className="text-xl text-primary" />
              </button>
            </div>
          ))}
          <div className="map-control-divider" />
        </div>
        <button
          type="button"
          onClick={() => {
            setStyleOpen((open) => !open);
            setToolsOpen(false);
            setPanelOpen(false);
          }}
          aria-expanded={styleOpen}
          aria-label="Map style"
          title={activeStyle?.label ?? "Map style"}
          className={`map-controls-btn map-controls-toggle ${styleOpen ? "map-controls-toggle--open" : ""}`}
        >
          <MapMaterialIcon
            name={styleOpen ? "expand_more" : (activeStyle?.icon ?? "map")}
            className="text-xl"
          />
        </button>
      </div>

      <div className={`map-controls-group ${toolsOpen ? "map-controls-group--open" : ""}`}>
        <div className="map-controls-group__collapsible" aria-hidden={!toolsOpen}>
          <button
            type="button"
            onClick={() => {
              toggleSettingsPanel();
              setStyleOpen(false);
            }}
            aria-label="Map settings"
            aria-expanded={settingsPanelOpen}
            aria-controls="map-layers-settings-panel"
            className={`map-controls-btn ${settingsPanelOpen ? "map-controls-btn--active" : ""}`}
          >
            <MapMaterialIcon name="tune" className="text-xl text-primary" />
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
          onClick={() => {
            setToolsOpen((open) => !open);
            setStyleOpen(false);
          }}
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
