"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  getCategoryById,
  getLayerById,
  getLayersForCategory,
  MAP_LAYER_CATEGORIES,
  MAP_LAYER_CATALOG,
} from "@/lib/mapLayers/catalog";
import type { MapLayerDefinition } from "@/lib/mapLayers/types";
import { useMapLayersStore, GLOBE_MULTI_TOGGLE_IDS } from "@/lib/mapLayers/store";
import { MapMaterialIcon } from "./MapMaterialIcon";

function matchesSearch(layer: MapLayerDefinition, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (layer.label.toLowerCase().includes(q)) return true;
  if (layer.id.toLowerCase().includes(q)) return true;
  return layer.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
}

function LayerRow({ layer }: { layer: MapLayerDefinition }) {
  const enabled = useMapLayersStore((s) => s.enabled[layer.id] === true);
  const toggleLayer = useMapLayersStore((s) => s.toggleLayer);
  const toggleFavorite = useMapLayersStore((s) => s.toggleFavorite);
  const isFavorite = useMapLayersStore((s) => s.favorites.includes(layer.id));
  const category = getCategoryById(layer.categoryId);
  const isSingle =
    category?.selectionMode === "single" &&
    (layer.categoryId === "base" ||
      (layer.categoryId === "globe" && !GLOBE_MULTI_TOGGLE_IDS.has(layer.id)));

  return (
    <div
      className={`map-layers-row ${enabled ? "map-layers-row--active" : ""}`}
    >
      <div className="map-layers-row__icon">
        <MapMaterialIcon name={layer.icon} className="text-lg" />
      </div>
      <div className="map-layers-row__body">
        <div className="map-layers-row__title">
          <span>{layer.label}</span>
        </div>
        {layer.description ? (
          <p className="map-layers-row__desc">{layer.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        className={`map-layers-fav ${isFavorite ? "map-layers-fav--active" : ""}`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        onClick={() => toggleFavorite(layer.id)}
      >
        <MapMaterialIcon name="star" className="text-base" filled={isFavorite} />
      </button>
      {isSingle ? (
        <button
          type="button"
          role="radio"
          aria-checked={enabled}
          className={`map-layers-radio ${enabled ? "map-layers-radio--on" : ""}`}
          onClick={() => toggleLayer(layer.id)}
        >
          <span className="map-layers-radio__dot" />
        </button>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          className={`map-layers-switch ${enabled ? "map-layers-switch--on" : ""}`}
          onClick={() => toggleLayer(layer.id)}
        >
          <span className="map-layers-switch__thumb" />
        </button>
      )}
    </div>
  );
}

function CategorySection({
  categoryId,
  layers,
  defaultOpen,
}: {
  categoryId: string;
  layers: MapLayerDefinition[];
  defaultOpen?: boolean;
}) {
  const category = getCategoryById(categoryId as MapLayerDefinition["categoryId"]);
  const enabled = useMapLayersStore((s) => s.enabled);
  const [open, setOpen] = useState(defaultOpen ?? false);
  if (!category || layers.length === 0) return null;

  const activeCount = layers.filter((l) => enabled[l.id]).length;

  return (
    <section className="map-layers-category">
      <button
        type="button"
        className="map-layers-category__header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <MapMaterialIcon name={category.icon} className="text-xl text-primary" />
        <span className="map-layers-category__label">{category.label}</span>
        <span className="map-layers-category__count">{activeCount}</span>
        <MapMaterialIcon
          name="expand_more"
          className={`map-layers-category__chevron ${open ? "map-layers-category__chevron--open" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="map-layers-category__body"
          >
            {layers.map((layer) => (
              <LayerRow key={layer.id} layer={layer} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default function MapLayersPanel() {
  const panelOpen = useMapLayersStore((s) => s.panelOpen);
  const setPanelOpen = useMapLayersStore((s) => s.setPanelOpen);
  const searchQuery = useMapLayersStore((s) => s.searchQuery);
  const setSearchQuery = useMapLayersStore((s) => s.setSearchQuery);
  const favorites = useMapLayersStore((s) => s.favorites);

  const favoriteLayers = useMemo(
    () =>
      favorites
        .map((id) => getLayerById(id))
        .filter((l): l is MapLayerDefinition => Boolean(l))
        .filter((l) => matchesSearch(l, searchQuery)),
    [favorites, searchQuery]
  );

  const filteredByCategory = useMemo(() => {
    const map = new Map<string, MapLayerDefinition[]>();
    for (const category of MAP_LAYER_CATEGORIES) {
      const layers = getLayersForCategory(category.id).filter((l) => matchesSearch(l, searchQuery));
      if (layers.length) map.set(category.id, layers);
    }
    return map;
  }, [searchQuery]);

  const totalResults = useMemo(() => {
    if (!searchQuery.trim()) return MAP_LAYER_CATALOG.length;
    let n = 0;
    filteredByCategory.forEach((layers) => {
      n += layers.length;
    });
    return n;
  }, [filteredByCategory, searchQuery]);

  return (
    <AnimatePresence>
      {panelOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close layers panel"
            className="map-layers-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setPanelOpen(false)}
          />
          <motion.aside
            id="map-layers-panel"
            role="dialog"
            aria-label="Map layers"
            className="map-layers-panel ios-glass pointer-events-auto"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="map-layers-panel__header">
              <div>
                <h2 className="map-layers-panel__title">Map Layers</h2>
                <p className="map-layers-panel__subtitle">
                  {totalResults} layers · synced across globe &amp; map
                </p>
              </div>
              <button
                type="button"
                className="map-layers-panel__close"
                aria-label="Close"
                onClick={() => setPanelOpen(false)}
              >
                <MapMaterialIcon name="close" className="text-xl" />
              </button>
            </header>

            <div className="map-layers-search">
              <MapMaterialIcon name="search" className="text-lg text-on-surface-variant" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search layers…"
                aria-label="Search map layers"
                className="map-layers-search__input"
              />
              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="map-layers-search__clear"
                  onClick={() => setSearchQuery("")}
                >
                  <MapMaterialIcon name="close" className="text-base" />
                </button>
              ) : null}
            </div>

            <div className="map-layers-panel__scroll ios-sheet-scroll">
              {favoriteLayers.length > 0 ? (
                <div className="map-layers-favorites">
                  <h3 className="map-layers-section-title">
                    <MapMaterialIcon name="star" className="text-base text-primary" filled />
                    Favorites
                  </h3>
                  <div className="ios-inset-group">
                    {favoriteLayers.map((layer) => (
                      <LayerRow key={`fav-${layer.id}`} layer={layer} />
                    ))}
                  </div>
                </div>
              ) : null}

              {MAP_LAYER_CATEGORIES.map((category, index) => {
                const layers = filteredByCategory.get(category.id);
                if (!layers?.length) return null;
                return (
                  <CategorySection
                    key={category.id}
                    categoryId={category.id}
                    layers={layers}
                    defaultOpen={index < 2 || Boolean(searchQuery.trim())}
                  />
                );
              })}

              {totalResults === 0 ? (
                <div className="map-layers-empty">
                  <MapMaterialIcon name="layers_clear" className="text-4xl text-primary/40" />
                  <p>No layers match your search.</p>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
