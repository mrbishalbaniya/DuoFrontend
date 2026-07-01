import type { FaceQualityMetrics } from "./metrics";

/** FACEIO-style auth states for guide color + messaging. */
export type FaceAuthStatus = "searching" | "aligning" | "ready" | "many_faces";

export function getFaceAuthStatus(
  metrics: FaceQualityMetrics,
  manyFaces: boolean
): FaceAuthStatus {
  if (manyFaces) return "many_faces";
  if (!metrics.faceDetected) return "searching";
  if (metrics.verificationReady) return "ready";
  return "aligning";
}

export function authStatusMessage(status: FaceAuthStatus, guidance: string): string {
  if (status === "many_faces") {
    return "Only one face should be visible";
  }
  if (status === "searching") {
    return "Position your face inside the oval";
  }
  if (status === "ready") {
    return "Face verified — tap capture when ready";
  }
  return guidance;
}

export function authStatusColor(status: FaceAuthStatus): string {
  switch (status) {
    case "ready":
      return "#00E676";
    case "aligning":
      return "#FFB300";
    case "many_faces":
      return "#FF5252";
    default:
      return "#00E5FF";
  }
}
