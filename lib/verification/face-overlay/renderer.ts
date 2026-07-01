import type { FaceLandmarkPoint } from "./landmarks";
import { FACE_OVERLAY_CONFIG } from "./config";
import type { FaceAuthStatus } from "./faceAuthStatus";
import { authStatusColor } from "./faceAuthStatus";
import type { FaceBoundingBox, FaceQualityMetrics } from "./metrics";
import { lerpBox } from "./metrics";
import { drawLandmarkMesh } from "./landmarkMesh";

export interface OverlayRenderState {
  landmarks: FaceLandmarkPoint[] | null;
  metrics: FaceQualityMetrics;
  smoothBox: FaceBoundingBox | null;
  progress: number;
  authStatus: FaceAuthStatus;
}

function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill("evenodd");
  ctx.restore();
}

function drawScanLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  timeMs: number,
  color: string
) {
  const t = (timeMs % FACE_OVERLAY_CONFIG.scanLineSpeedMs) / FACE_OVERLAY_CONFIG.scanLineSpeedMs;
  const scanY = cy - ry + t * ry * 2;
  const norm = Math.abs((scanY - cy) / ry);
  if (norm > 1) return;

  const halfChord = rx * Math.sqrt(Math.max(0, 1 - norm * norm));
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(cx - halfChord, scanY);
  ctx.lineTo(cx + halfChord, scanY);
  ctx.stroke();
  ctx.restore();
}

/** FACEIO-style oval scan guide with animated scan line. */
function drawFaceioGuide(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  authStatus: FaceAuthStatus,
  timeMs: number
) {
  const cx = width * 0.5;
  const cy = height * FACE_OVERLAY_CONFIG.guideCenterY;
  const rx = width * FACE_OVERLAY_CONFIG.guideRadiusX;
  const ry = height * FACE_OVERLAY_CONFIG.guideRadiusY;
  const color = authStatusColor(authStatus);
  const ready = authStatus === "ready";

  if (FACE_OVERLAY_CONFIG.showVignette) {
    drawVignette(ctx, width, height, cx, cy, rx, ry);
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = ready ? FACE_OVERLAY_CONFIG.guideLineWidth + 0.5 : FACE_OVERLAY_CONFIG.guideLineWidth;
  ctx.lineCap = "round";
  ctx.setLineDash(ready ? [] : [10, 7]);
  ctx.shadowColor = color;
  ctx.shadowBlur = ready ? FACE_OVERLAY_CONFIG.guideGlow + 4 : FACE_OVERLAY_CONFIG.guideGlow;

  const pulse = ready ? 1 : 0.85 + Math.sin(timeMs / 400) * 0.15;
  ctx.globalAlpha = pulse;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  if (!ready && authStatus !== "many_faces") {
    drawScanLine(ctx, cx, cy, rx, ry, timeMs, `${color}99`);
  }

  if (ready) {
    ctx.save();
    ctx.strokeStyle = `${color}44`;
    ctx.lineWidth = 6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function renderFaceOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: OverlayRenderState,
  timeMs: number
) {
  ctx.clearRect(0, 0, width, height);

  if (FACE_OVERLAY_CONFIG.showLandmarks && state.landmarks) {
    drawLandmarkMesh(ctx, state.landmarks, width, height);
  }

  if (FACE_OVERLAY_CONFIG.showFaceioGuide) {
    drawFaceioGuide(ctx, width, height, state.authStatus, timeMs);
  }
}

export function updateSmoothBox(
  prev: FaceBoundingBox | null,
  target: FaceBoundingBox | null
): FaceBoundingBox | null {
  if (!target) return null;
  if (!prev) return target;
  return lerpBox(prev, target, FACE_OVERLAY_CONFIG.lerpFactor);
}

export function sampleCanvasQuality(
  source: HTMLCanvasElement,
  box: FaceBoundingBox | null
): { brightness: number; sharpness: number } | null {
  if (!box || source.width === 0 || source.height === 0) return null;

  const sw = 120;
  const sh = 120;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sw;
  sampleCanvas.height = sh;
  const sctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sctx) return null;

  const sx = box.x * source.width;
  const sy = box.y * source.height;
  const swatchW = box.width * source.width;
  const swatchH = box.height * source.height;

  sctx.drawImage(source, sx, sy, swatchW, swatchH, 0, 0, sw, sh);
  const data = sctx.getImageData(0, 0, sw, sh).data;

  let sum = 0;
  let laplacian = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const brightness = sum / (data.length / 4);

  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const idx = (y * sw + x) * 4;
      const c = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const idxR = (y * sw + x + 1) * 4;
      const idxD = ((y + 1) * sw + x) * 4;
      const r = 0.299 * data[idxR] + 0.587 * data[idxR + 1] + 0.114 * data[idxR + 2];
      const d = 0.299 * data[idxD] + 0.587 * data[idxD + 1] + 0.114 * data[idxD + 2];
      laplacian += Math.abs(4 * c - r - d - c - c);
    }
  }
  const sharpness = laplacian / (sw * sh);

  return { brightness, sharpness };
}
