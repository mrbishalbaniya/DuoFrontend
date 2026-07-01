/** Normalized face landmark (0–1 relative to analysis frame). */
export interface FaceLandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}
