import type { FaceLandmarkPoint } from "./landmarks";
import { FACE_OVERLAY_CONFIG } from "./config";

function chain(indices: number[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < indices.length - 1; i++) {
    pairs.push([indices[i], indices[i + 1]]);
  }
  return pairs;
}

/** Subset of face-api.js 68-point mesh (jaw, brows, eyes, nose, lips). */
const MESH_EDGES: [number, number][] = [
  ...chain(Array.from({ length: 17 }, (_, i) => i)),
  ...chain([17, 18, 19, 20, 21]),
  ...chain([22, 23, 24, 25, 26]),
  ...chain([27, 28, 29, 30]),
  ...chain([31, 32, 33, 34, 35]),
  ...chain([36, 37, 38, 39, 40, 41, 36]),
  ...chain([42, 43, 44, 45, 46, 47, 42]),
  ...chain([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 48]),
];

export function drawLandmarkMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarkPoint[],
  width: number,
  height: number
) {
  if (landmarks.length < 68) return;

  ctx.save();
  ctx.strokeStyle = FACE_OVERLAY_CONFIG.landmarkColor;
  ctx.lineWidth = FACE_OVERLAY_CONFIG.landmarkLineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(0, 229, 255, 0.5)";
  ctx.shadowBlur = 4;

  ctx.beginPath();
  for (const [start, end] of MESH_EDGES) {
    const a = landmarks[start];
    const b = landmarks[end];
    if (!a || !b) continue;
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
  }
  ctx.stroke();
  ctx.restore();
}
