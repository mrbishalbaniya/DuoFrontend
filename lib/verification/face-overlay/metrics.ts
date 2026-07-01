import type { FaceLandmarkPoint } from "./landmarks";
import { FACE_OVERLAY_CONFIG, VERIFICATION_PROGRESS_STAGES } from "./config";

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceQualityMetrics {
  faceDetected: boolean;
  faceCentered: boolean;
  lightingOk: boolean;
  sharpnessOk: boolean;
  eyesOpen: boolean;
  angleOk: boolean;
  faceSizeOk: boolean;
  distanceOk: boolean;
  occlusionOk: boolean;
  blurOk: boolean;
  aligned: boolean;
  verificationReady: boolean;
  brightness: number;
  sharpness: number;
  eyeEar: number;
  mouthOpen: number;
  expressionHappy: number;
  faceScale: number;
  yaw: number;
  pitch: number;
  roll: number;
  guidance: string;
  bbox: FaceBoundingBox | null;
}

/** face-api.js 68-point landmark indices */
const LEFT_EYE = [36, 37, 38, 39, 40, 41];
const RIGHT_EYE = [42, 43, 44, 45, 46, 47];
const MOUTH_LEFT = 48;
const MOUTH_RIGHT = 54;
const UPPER_LIP = 51;
const LOWER_LIP = 57;
const NOSE_TIP = 30;
const CHIN = 8;
const FOREHEAD = 27;
const LEFT_CHEEK = 1;
const RIGHT_CHEEK = 15;

function mouthOpenRatio(landmarks: FaceLandmarkPoint[]): number {
  const ml = landmarks[MOUTH_LEFT];
  const mr = landmarks[MOUTH_RIGHT];
  const upper = landmarks[UPPER_LIP];
  const lower = landmarks[LOWER_LIP];
  if (!ml || !mr || !upper || !lower) return 0;
  const width = Math.hypot(ml.x - mr.x, ml.y - mr.y);
  const height = Math.hypot(upper.x - lower.x, upper.y - lower.y);
  return width > 0 ? height / width : 0;
}

function eyeAspectRatio(landmarks: FaceLandmarkPoint[], indices: number[]): number {
  const pts = indices.map((i) => landmarks[i]).filter(Boolean);
  if (pts.length < 6) return 0;
  const dist = (a: FaceLandmarkPoint, b: FaceLandmarkPoint) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  const v1 = dist(pts[1], pts[5]);
  const v2 = dist(pts[2], pts[4]);
  const h = dist(pts[0], pts[3]);
  return h > 0 ? (v1 + v2) / (2 * h) : 0;
}

export function computeBoundingBox(landmarks: FaceLandmarkPoint[]): FaceBoundingBox {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const lm of landmarks) {
    minX = Math.min(minX, lm.x);
    minY = Math.min(minY, lm.y);
    maxX = Math.max(maxX, lm.x);
    maxY = Math.max(maxY, lm.y);
  }
  const padX = (maxX - minX) * FACE_OVERLAY_CONFIG.bboxPadding;
  const padY = (maxY - minY) * FACE_OVERLAY_CONFIG.bboxPadding;
  return {
    x: Math.max(0, minX - padX),
    y: Math.max(0, minY - padY),
    width: Math.min(1, maxX - minX + padX * 2),
    height: Math.min(1, maxY - minY + padY * 2),
  };
}

export function computeHeadPose(landmarks: FaceLandmarkPoint[]): {
  yaw: number;
  pitch: number;
  roll: number;
} {
  const nose = landmarks[NOSE_TIP];
  const chin = landmarks[CHIN];
  const forehead = landmarks[FOREHEAD];
  const leftEye = landmarks[LEFT_EYE[0]];
  const rightEye = landmarks[RIGHT_EYE[0]];
  const leftCheek = landmarks[LEFT_CHEEK];
  const rightCheek = landmarks[RIGHT_CHEEK];
  if (!nose || !chin || !forehead || !leftEye || !rightEye || !leftCheek || !rightCheek) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const faceMidX = (leftCheek.x + rightCheek.x) / 2;
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x) + 1e-6;
  const yaw = ((nose.x - faceMidX) / faceWidth) * 90;

  const faceMidY = (forehead.y + chin.y) / 2;
  const faceHeight = Math.abs(chin.y - forehead.y) + 1e-6;
  const pitch = ((nose.y - faceMidY) / faceHeight) * 90;

  const roll =
    (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;

  return { yaw, pitch, roll };
}

function computeGuidance(
  metrics: Omit<FaceQualityMetrics, "guidance" | "aligned" | "verificationReady">
): string {
  if (!metrics.faceDetected) return "Center your face in the oval";
  if (!metrics.faceSizeOk && metrics.faceScale < FACE_OVERLAY_CONFIG.minFaceScale) {
    return "Move closer";
  }
  if (!metrics.faceSizeOk && metrics.faceScale > FACE_OVERLAY_CONFIG.maxFaceScale) {
    return "Move farther";
  }
  if (!metrics.faceCentered) {
    const bbox = metrics.bbox;
    if (bbox) {
      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;
      if (cx < 0.5 - FACE_OVERLAY_CONFIG.centerTolerance) return "Move right";
      if (cx > 0.5 + FACE_OVERLAY_CONFIG.centerTolerance) return "Move left";
      if (cy < 0.5 - FACE_OVERLAY_CONFIG.centerTolerance) return "Look down";
      if (cy > 0.5 + FACE_OVERLAY_CONFIG.centerTolerance) return "Look up";
    }
    return "Center your face in the oval";
  }
  if (!metrics.angleOk) {
    if (metrics.yaw > FACE_OVERLAY_CONFIG.maxYawDegrees) return "Turn right";
    if (metrics.yaw < -FACE_OVERLAY_CONFIG.maxYawDegrees) return "Turn left";
    if (metrics.pitch > FACE_OVERLAY_CONFIG.maxPitchDegrees) return "Look down";
    if (metrics.pitch < -FACE_OVERLAY_CONFIG.maxPitchDegrees) return "Look up";
    if (Math.abs(metrics.roll) > FACE_OVERLAY_CONFIG.maxRollDegrees) return "Hold still";
  }
  if (!metrics.lightingOk) return "Improve lighting";
  if (!metrics.sharpnessOk) return "Hold still — image blurry";
  if (!metrics.eyesOpen) return "Keep eyes open";
  if (
    metrics.faceCentered &&
    metrics.faceSizeOk &&
    metrics.angleOk &&
    metrics.lightingOk &&
    metrics.sharpnessOk &&
    metrics.eyesOpen
  ) {
    return "Face aligned";
  }
  return "Face detected";
}

export function analyzeFaceQuality(
  landmarks: FaceLandmarkPoint[] | null,
  sample: { brightness: number; sharpness: number } | null,
  previousCenter: { x: number; y: number } | null,
  expressionHappy = 0
): FaceQualityMetrics {
  if (!landmarks || landmarks.length < 68) {
    return {
      faceDetected: false,
      faceCentered: false,
      lightingOk: false,
      sharpnessOk: false,
      eyesOpen: false,
      angleOk: false,
      faceSizeOk: false,
      distanceOk: false,
      occlusionOk: true,
      blurOk: false,
      aligned: false,
      verificationReady: false,
      brightness: 0,
      sharpness: 0,
      eyeEar: 0,
      mouthOpen: 0,
      expressionHappy: 0,
      faceScale: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      guidance: "Center your face in the oval",
      bbox: null,
    };
  }

  const bbox = computeBoundingBox(landmarks);
  const faceScale = Math.sqrt(bbox.width * bbox.height);
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  const faceCentered =
    Math.abs(cx - 0.5) < FACE_OVERLAY_CONFIG.centerTolerance &&
    Math.abs(cy - 0.5) < FACE_OVERLAY_CONFIG.centerTolerance;

  const { yaw, pitch, roll } = computeHeadPose(landmarks);
  const angleOk =
    Math.abs(yaw) <= FACE_OVERLAY_CONFIG.maxYawDegrees &&
    Math.abs(pitch) <= FACE_OVERLAY_CONFIG.maxPitchDegrees &&
    Math.abs(roll) <= FACE_OVERLAY_CONFIG.maxRollDegrees;

  const leftEar = eyeAspectRatio(landmarks, LEFT_EYE);
  const rightEar = eyeAspectRatio(landmarks, RIGHT_EYE);
  const eyeEar = (leftEar + rightEar) / 2;
  const eyesOpen = eyeEar >= FACE_OVERLAY_CONFIG.minEyeOpenEar;
  const mouthOpen = mouthOpenRatio(landmarks);

  const faceSizeOk =
    faceScale >= FACE_OVERLAY_CONFIG.minFaceScale &&
    faceScale <= FACE_OVERLAY_CONFIG.maxFaceScale;

  const brightness = sample?.brightness ?? 128;
  const sharpness = sample?.sharpness ?? 20;
  const lightingOk =
    brightness >= FACE_OVERLAY_CONFIG.minBrightness &&
    brightness <= FACE_OVERLAY_CONFIG.maxBrightness;
  const sharpnessOk = sharpness >= FACE_OVERLAY_CONFIG.minSharpness;
  const blurOk = sharpnessOk;

  const occlusionOk = Boolean(landmarks[NOSE_TIP] && landmarks[CHIN] && landmarks[UPPER_LIP]);

  const aligned =
    faceCentered && faceSizeOk && angleOk && lightingOk && sharpnessOk && eyesOpen;

  const verificationReady = aligned && occlusionOk;

  const base = {
    faceDetected: true,
    faceCentered,
    lightingOk,
    sharpnessOk,
    eyesOpen,
    angleOk,
    faceSizeOk,
    distanceOk: faceSizeOk,
    occlusionOk: Boolean(occlusionOk),
    blurOk,
    aligned,
    verificationReady,
    brightness,
    sharpness,
    eyeEar,
    mouthOpen,
    expressionHappy,
    faceScale,
    yaw,
    pitch,
    roll,
    bbox,
  };

  let guidance = computeGuidance(base);
  if (previousCenter) {
    const jitter = Math.hypot(cx - previousCenter.x, cy - previousCenter.y);
    if (jitter > 0.04 && aligned) guidance = "Hold still";
  }
  if (verificationReady) guidance = "Verification ready";

  return { ...base, guidance };
}

export function lerpBox(current: FaceBoundingBox, target: FaceBoundingBox, t: number): FaceBoundingBox {
  return {
    x: current.x + (target.x - current.x) * t,
    y: current.y + (target.y - current.y) * t,
    width: current.width + (target.width - current.width) * t,
    height: current.height + (target.height - current.height) * t,
  };
}

export function computeOverlayProgress(
  metrics: FaceQualityMetrics,
  flowProgress: number
): number {
  if (!metrics.faceDetected) return 0.05;
  let p = 0.15;
  if (metrics.faceCentered) p += 0.1;
  if (metrics.lightingOk) p += 0.1;
  if (metrics.sharpnessOk) p += 0.1;
  if (metrics.angleOk) p += 0.1;
  if (metrics.eyesOpen) p += 0.05;
  if (metrics.aligned) p += 0.1;
  p += flowProgress * 0.4;
  return Math.min(0.98, p);
}

export function progressStageForValue(progress: number): string {
  const idx = Math.min(
    VERIFICATION_PROGRESS_STAGES.length - 1,
    Math.floor(progress * VERIFICATION_PROGRESS_STAGES.length)
  );
  return VERIFICATION_PROGRESS_STAGES[idx] ?? VERIFICATION_PROGRESS_STAGES[0];
}
