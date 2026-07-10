/** Shared helpers to keep MapLibre custom layers from burning CPU/GPU. */

export function isDocumentVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

/**
 * Schedule the next map frame at most ~targetFps when the tab is visible.
 * Returns true if a repaint was requested.
 */
export function requestMapRepaint(
  map: { triggerRepaint: () => void } | null | undefined,
  lastPaintMs: { current: number },
  targetFps = 30
): boolean {
  if (!map || !isDocumentVisible()) return false;
  const minInterval = 1000 / targetFps;
  const now = performance.now();
  if (now - lastPaintMs.current < minInterval) return false;
  lastPaintMs.current = now;
  map.triggerRepaint();
  return true;
}

/** Round zoom so atmosphere only updates when the view meaningfully changes. */
export function zoomBucket(zoom: number, step = 0.35): number {
  return Math.round(zoom / step) * step;
}
