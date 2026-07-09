"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  getCategoryById,
  getLayerById,
  getLayersForCategory,
  MAP_LAYERS_MAIN_CATEGORIES,
} from "@/lib/mapLayers/catalog";
import type { MapLayerCategoryId, MapLayerDefinition } from "@/lib/mapLayers/types";
import { useMapLayersStore } from "@/lib/mapLayers/store";
import { MapMaterialIcon } from "./MapMaterialIcon";

function matchesSearch(layer: MapLayerDefinition, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (layer.label.toLowerCase().includes(q)) return true;
  if (layer.id.toLowerCase().includes(q)) return true;
  return layer.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
}

function LayerRow({ layer, showFavorite = true }: { layer: MapLayerDefinition; showFavorite?: boolean }) {
  const enabled = useMapLayersStore((s) => s.enabled[layer.id] === true);
  const toggleLayer = useMapLayersStore((s) => s.toggleLayer);
  const toggleFavorite = useMapLayersStore((s) => s.toggleFavorite);
  const isFavorite = useMapLayersStore((s) => s.favorites.includes(layer.id));
  const category = getCategoryById(layer.categoryId);
  const isSingle = category?.selectionMode === "single" && layer.categoryId === "base";

  return (
    <div className={`map-layers-row ${enabled ? "map-layers-row--active" : ""}`}>
      <div className="map-layers-row__icon">
        <MapMaterialIcon name={layer.icon} className="text-lg" />
      </div>
      <div className="map-layers-row__body">
        <div className="map-layers-row__title">
          <span>{layer.label}</span>
        </div>
        {layer.description ? <p className="map-layers-row__desc">{layer.description}</p> : null}
      </div>
      {showFavorite ? (
        <button
          type="button"
          className={`map-layers-fav ${isFavorite ? "map-layers-fav--active" : ""}`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => toggleFavorite(layer.id)}
        >
          <MapMaterialIcon name="star" className="text-base" filled={isFavorite} />
        </button>
      ) : null}
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
  const category = getCategoryById(categoryId as MapLayerCategoryId);
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

type MapLayersSheetProps = {
  open: boolean;
  onClose: () => void;
  panelId: string;
  title: string;
  subtitle: string;
  categoryIds: MapLayerCategoryId[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFavorites?: boolean;
  showSearch?: boolean;
};

export function MapLayersSheet({
  open,
  onClose,
  panelId,
  title,
  subtitle,
  categoryIds,
  searchQuery,
  onSearchChange,
  showFavorites = true,
  showSearch = true,
}: MapLayersSheetProps) {
  const favorites = useMapLayersStore((s) => s.favorites);

  const favoriteLayers = useMemo(
    () =>
      favorites
        .map((id) => getLayerById(id))
        .filter((l): l is MapLayerDefinition => Boolean(l))
        .filter((l) => categoryIds.includes(l.categoryId))
        .filter((l) => matchesSearch(l, searchQuery)),
    [favorites, searchQuery, categoryIds]
  );

  const filteredByCategory = useMemo(() => {
    const map = new Map<string, MapLayerDefinition[]>();
    for (const categoryId of categoryIds) {
      const layers = getLayersForCategory(categoryId).filter((l) => matchesSearch(l, searchQuery));
      if (layers.length) map.set(categoryId, layers);
    }
    return map;
  }, [searchQuery, categoryIds]);

  const totalResults = useMemo(() => {
    let n = 0;
    filteredByCategory.forEach((layers) => {
      n += layers.length;
    });
    return n;
  }, [filteredByCategory]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={`Close ${title.toLowerCase()}`}
            className="map-layers-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            id={panelId}
            role="dialog"
            aria-label={title}
            className="map-layers-panel ios-glass pointer-events-auto"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="map-layers-panel__header">
              <div>
                <h2 className="map-layers-panel__title">{title}</h2>
                <p className="map-layers-panel__subtitle">{subtitle}</p>
              </div>
              <button
                type="button"
                className="map-layers-panel__close"
                aria-label="Close"
                onClick={onClose}
              >
                <MapMaterialIcon name="close" className="text-xl" />
              </button>
            </header>

            {showSearch ? (
              <div className="map-layers-search">
                <MapMaterialIcon name="search" className="text-lg text-on-surface-variant" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search…"
                  aria-label={`Search ${title.toLowerCase()}`}
                  className="map-layers-search__input"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="map-layers-search__clear"
                    onClick={() => onSearchChange("")}
                  >
                    <MapMaterialIcon name="close" className="text-base" />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="map-layers-panel__scroll ios-sheet-scroll">
              {showFavorites && favoriteLayers.length > 0 ? (
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

              {categoryIds.map((categoryId) => {
                const layers = filteredByCategory.get(categoryId);
                if (!layers?.length) return null;
                return (
                  <CategorySection
                    key={categoryId}
                    categoryId={categoryId}
                    layers={layers}
                    defaultOpen={Boolean(searchQuery.trim())}
                  />
                );
              })}

              {totalResults === 0 ? (
                <div className="map-layers-empty">
                  <MapMaterialIcon name="layers_clear" className="text-4xl text-primary/40" />
                  <p>No options match your search.</p>
                </div>
              ) : null}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default function MapLayersPanel() {
  const panelOpen = useMapLayersStore((s) => s.panelOpen);
  const setPanelOpen = useMapLayersStore((s) => s.setPanelOpen);
  const searchQuery = useMapLayersStore((s) => s.searchQuery);
  const setSearchQuery = useMapLayersStore((s) => s.setSearchQuery);

  return (
    <MapLayersSheet
      open={panelOpen}
      onClose={() => setPanelOpen(false)}
      panelId="map-layers-panel"
      title="Map Style"
      subtitle="Choose a look"
      categoryIds={MAP_LAYERS_MAIN_CATEGORIES}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showFavorites={false}
      showSearch={false}
    />
  );
}
