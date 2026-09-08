/**
 * Face verification overlay — FACEIO-inspired scan guide (visual only).
 */
export const FACE_OVERLAY_CONFIG = {
  primary: "#00E5FF",
  primaryGlow: "rgba(0, 229, 255, 0.75)",
  success: "#00E676",
  warning: "#FFB300",
  danger: "#FF5252",

  /** FACEIO-style oval scan frame (no wireframe mesh). */
  showFaceioGuide: true,
  showLandmarks: true,
  showVignette: true,

  guideCenterY: 0.44,
  guideRadiusX: 0.32,
  guideRadiusY: 0.38,
  guideLineWidth: 2.5,
  guideGlow: 12,
  landmarkLineWidth: 0.9,
  landmarkColor: "rgba(0, 229, 255, 0.42)",
  scanLineSpeedMs: 2200,

  lerpFactor: 0.25,
  landmarkSmoothing: 0.22,
  landmarkSmoothingZ: 0.15,

  bboxPadding: 0.06,
  // Client-side readiness gates are a UI trigger only — the backend runs its
  // own independent quality/blur/fraud checks on whatever gets uploaded, so
  // these can stay forgiving without weakening real verification accuracy.
  // Kept lenient enough for a dim room / an average laptop webcam so
  // auto-capture doesn't stall indefinitely on marginal conditions.
  centerTolerance: 0.16,
  minFaceScale: 0.16,
  maxFaceScale: 0.58,
  minBrightness: 40,
  maxBrightness: 225,
  minSharpness: 8,
  minEyeOpenEar: 0.18,
  maxYawDegrees: 20,
  maxPitchDegrees: 18,
  maxRollDegrees: 14,
} as const;

export type FaceOverlayConfig = typeof FACE_OVERLAY_CONFIG;

export const VERIFICATION_PROGRESS_STAGES = [
  "Detecting Face",
  "Checking Face Quality",
  "Detecting Landmarks",
  "Checking Lighting",
  "Checking Blur",
  "Liveness Detection",
  "Comparing Face",
  "Verified",
] as const;

export type VerificationProgressStage = (typeof VERIFICATION_PROGRESS_STAGES)[number];
