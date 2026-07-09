export type LayerSelectionMode = "single" | "multi";

export type MapLayerCategoryId =
  | "base"
  | "globe-fx"
  | "geographic"
  | "weather"
  | "duo"
  | "developer";

export interface MapLayerCategory {
  id: MapLayerCategoryId;
  label: string;
  icon: string;
  selectionMode: LayerSelectionMode;
}

export interface MapLayerDefinition {
  id: string;
  categoryId: MapLayerCategoryId;
  label: string;
  icon: string;
  description?: string;
  defaultOn?: boolean;
  keywords?: string[];
}

export interface MapLayersPersistedState {
  enabled: Record<string, boolean>;
  baseMapId: string;
  favorites: string[];
}
