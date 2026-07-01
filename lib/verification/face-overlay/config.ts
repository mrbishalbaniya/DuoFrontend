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
  centerTolerance: 0.12,
  minFaceScale: 0.18,
  maxFaceScale: 0.55,
  minBrightness: 55,
  maxBrightness: 210,
  minSharpness: 12,
  minEyeOpenEar: 0.18,
  maxYawDegrees: 18,
  maxPitchDegrees: 15,
  maxRollDegrees: 12,
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
