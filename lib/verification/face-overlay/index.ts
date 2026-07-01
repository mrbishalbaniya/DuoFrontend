/**
 * Real-time face verification overlay (client-side face-api.js).
 *
 * @module lib/verification/face-overlay
 *
 * Usage:
 * ```tsx
 * <FaceVerificationOverlay videoRef={videoRef} active={cameraReady} flowStep="liveness" />
 * ```
 *
 * Customize colors and toggles in `config.ts`.
 * Backend Django verification is unchanged — overlay is visual guidance only.
 */

export { FACE_OVERLAY_CONFIG, VERIFICATION_PROGRESS_STAGES } from "./config";
export type { FaceOverlayConfig, VerificationProgressStage } from "./config";
export { getFaceAuthStatus, authStatusMessage, authStatusColor } from "./faceAuthStatus";
export type { FaceAuthStatus } from "./faceAuthStatus";
export { analyzeFaceQuality, computeOverlayProgress } from "./metrics";
export type { FaceQualityMetrics } from "./metrics";
export { useFaceOverlay } from "./useFaceOverlay";
