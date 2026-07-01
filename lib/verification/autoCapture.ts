import type { LivenessStep } from "@/types";
import type { FaceQualityMetrics } from "@/lib/verification/face-overlay/metrics";

export interface ActionBaseline {
  eyeEar: number;
  mouthOpen: number;
  yaw: number;
  expressionHappy: number;
}

export interface AutoCaptureInput {
  flowStep: "liveness" | "selfie";
  step: LivenessStep | null;
  awaitingAction: boolean;
  metrics: FaceQualityMetrics;
  manyFaces: boolean;
  modelLoading: boolean;
  actionBaseline: ActionBaseline | null;
}

const NEUTRAL_HOLD_MS = 700;
const SELFIE_HOLD_MS = 1200;
const ACTION_HOLD_MS = 300;
const BLINK_HOLD_MS = 120;

/** Aligned with backend liveness_detection.py (slightly earlier for responsiveness). */
const SMILE_DELTA_MIN = 0.07;
const SMILE_RATIO_MIN = 1.2;
const SMILE_HAPPY_MIN = 0.55;

const BLINK_DROP_MIN = 0.03;
const BLINK_RATIO_MAX = 0.82;

export function getAutoCaptureHoldMs(input: AutoCaptureInput): number {
  if (input.flowStep === "selfie") return SELFIE_HOLD_MS;
  if (!input.awaitingAction) return NEUTRAL_HOLD_MS;
  if (input.step === "blink") return BLINK_HOLD_MS;
  return ACTION_HOLD_MS;
}

function neutralBaselineReady(
  step: LivenessStep,
  metrics: FaceQualityMetrics
): boolean {
  if (!metrics.faceDetected || !metrics.faceCentered || !metrics.faceSizeOk) {
    return false;
  }

  if (step === "blink") {
    return metrics.eyesOpen;
  }

  if (step === "smile") {
    return metrics.eyesOpen && metrics.angleOk;
  }

  return metrics.verificationReady && metrics.eyesOpen && metrics.angleOk;
}

function blinkActionReady(metrics: FaceQualityMetrics, baseline: ActionBaseline): boolean {
  const drop = baseline.eyeEar - metrics.eyeEar;
  const ratio = metrics.eyeEar / (baseline.eyeEar + 1e-6);
  return drop >= BLINK_DROP_MIN || ratio <= BLINK_RATIO_MAX;
}

function smileActionReady(metrics: FaceQualityMetrics, baseline: ActionBaseline): boolean {
  const delta = metrics.mouthOpen - baseline.mouthOpen;
  const ratio = metrics.mouthOpen / (baseline.mouthOpen + 1e-6);

  if (metrics.expressionHappy >= SMILE_HAPPY_MIN && delta >= 0.04) return true;
  return delta >= SMILE_DELTA_MIN && ratio >= SMILE_RATIO_MIN;
}

/** Returns true when the current frame satisfies auto-capture for this phase. */
export function isAutoCaptureReady(input: AutoCaptureInput): boolean {
  const { metrics, manyFaces, modelLoading, flowStep, step, awaitingAction, actionBaseline } =
    input;

  if (modelLoading || manyFaces || !metrics.faceDetected) return false;

  if (flowStep === "selfie") {
    return metrics.verificationReady && metrics.eyesOpen;
  }

  if (!step) return false;

  if (!awaitingAction) {
    return neutralBaselineReady(step, metrics);
  }

  if (!actionBaseline) return false;

  switch (step) {
    case "blink":
      return blinkActionReady(metrics, actionBaseline);
    case "smile":
      return smileActionReady(metrics, actionBaseline);
    case "head_left":
      return metrics.yaw <= -11;
    case "head_right":
      return metrics.yaw >= 11;
    default:
      return false;
  }
}

export function autoCaptureStatusMessage(input: AutoCaptureInput): string {
  if (input.manyFaces) return "Only one face should be visible";
  if (input.modelLoading) return "Initializing face scan…";

  if (input.flowStep === "selfie") {
    return input.metrics.verificationReady
      ? "Hold still — capturing selfie…"
      : input.metrics.guidance;
  }

  if (!input.awaitingAction) {
    return input.metrics.faceDetected &&
      neutralBaselineReady(input.step!, input.metrics)
      ? "Hold still — saving neutral pose…"
      : input.metrics.guidance;
  }

  switch (input.step) {
    case "blink":
      return "Close your eyes — capturing automatically…";
    case "smile":
      return "Smile naturally — capturing automatically…";
    case "head_left":
      return "Turn your head left — capturing automatically…";
    case "head_right":
      return "Turn your head right — capturing automatically…";
    default:
      return input.metrics.guidance;
  }
}
