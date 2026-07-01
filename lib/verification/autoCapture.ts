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

const NEUTRAL_HOLD_MS = 1200;
const SELFIE_HOLD_MS = 1500;
const ACTION_HOLD_MS = 700;
const BLINK_HOLD_MS = 350;

export function getAutoCaptureHoldMs(input: AutoCaptureInput): number {
  if (input.flowStep === "selfie") return SELFIE_HOLD_MS;
  if (!input.awaitingAction) return NEUTRAL_HOLD_MS;
  if (input.step === "blink") return BLINK_HOLD_MS;
  return ACTION_HOLD_MS;
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
    return metrics.verificationReady && metrics.eyesOpen && metrics.angleOk;
  }

  switch (step) {
    case "blink":
      return metrics.eyeEar < 0.14;
    case "smile": {
      if (!actionBaseline) return false;
      if (metrics.expressionHappy >= 0.55) return true;
      const delta = metrics.mouthOpen - actionBaseline.mouthOpen;
      const ratio = metrics.mouthOpen / (actionBaseline.mouthOpen + 1e-6);
      return delta >= 0.025 || ratio >= 1.28;
    }
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
    return input.metrics.verificationReady
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
