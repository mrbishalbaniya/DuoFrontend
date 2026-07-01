import type { FaceLandmarkPoint } from "./landmarks";
import { FACE_OVERLAY_CONFIG } from "./config";

/** Exponential smoothing per landmark to reduce jitter. */
export function smoothLandmarks(
  previous: FaceLandmarkPoint[] | null,
  current: FaceLandmarkPoint[] | null
): FaceLandmarkPoint[] | null {
  if (!current?.length) return null;
  if (!previous || previous.length !== current.length) {
    return current.map((lm) => ({ ...lm }));
  }

  return current.map((lm, i) => {
    const prev = previous[i];
    const xyAlpha = FACE_OVERLAY_CONFIG.landmarkSmoothing;
    const zAlpha = FACE_OVERLAY_CONFIG.landmarkSmoothingZ;
    return {
      x: prev.x + (lm.x - prev.x) * xyAlpha,
      y: prev.y + (lm.y - prev.y) * xyAlpha,
      z: (prev.z ?? 0) + ((lm.z ?? 0) - (prev.z ?? 0)) * zAlpha,
      visibility: lm.visibility ?? prev.visibility,
    };
  });
}
