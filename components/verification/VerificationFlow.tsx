"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { CrossDeviceVerification } from "@/components/verification/CrossDeviceVerification";
import { FaceVerificationOverlay } from "@/components/verification/FaceVerificationOverlay";
import { cn } from "@/lib/utils";
import Loader from "@/components/ui/loader";
import {
  autoCaptureStatusMessage,
  getAutoCaptureHoldMs,
  isAutoCaptureReady,
  type ActionBaseline,
} from "@/lib/verification/autoCapture";
import type { FaceOverlayState } from "@/lib/verification/face-overlay/useFaceOverlay";
import { useAuth } from "@/contexts/AuthContext";
import type {
  LivenessStep,
  LivenessStepResponse,
  VerificationStartResponse,
  VerificationStatusResponse,
} from "@/types";

type FlowStep =
  | "instructions"
  | "cross_device"
  | "liveness"
  | "selfie"
  | "processing"
  | "result";

interface VerificationFlowProps {
  mode?: "default" | "device";
  initialSessionToken?: string;
}

const LIVENESS_LABELS: Record<LivenessStep, { title: string; hint: string; icon: string }> = {
  smile: {
    title: "Smile",
    hint: "Start neutral, then give a big smile.",
    icon: "sentiment_satisfied",
  },
  blink: {
    title: "Blink",
    hint: "Look at the camera, then close your eyes briefly.",
    icon: "visibility",
  },
  head_left: {
    title: "Turn Left",
    hint: "Look straight, then turn your head to the left.",
    icon: "arrow_back",
  },
  head_right: {
    title: "Turn Right",
    hint: "Look straight, then turn your head to the right.",
    icon: "arrow_forward",
  },
};

const AUTO_CAPTURE_COOLDOWN_MS = 900;
const AUTO_CAPTURE_RETRY_COOLDOWN_MS = 350;
/** How long "not ready" must persist before it interrupts an in-progress hold. */
const HOLD_GRACE_MS = 350;

function captureFrame(video: HTMLVideoElement): Promise<File | null> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], `frame-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

export function VerificationFlow({
  mode = "default",
  initialSessionToken,
}: VerificationFlowProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [flowStep, setFlowStep] = useState<FlowStep>(
    mode === "device" ? "liveness" : "instructions"
  );
  const [session, setSession] = useState<VerificationStartResponse | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(mode === "device");
  const [livenessIndex, setLivenessIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<LivenessStep[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepFeedback, setStepFeedback] = useState<LivenessStepResponse | null>(null);
  const [stepActionReady, setStepActionReady] = useState(false);
  const [autoStatus, setAutoStatus] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overlayStateRef = useRef<FaceOverlayState | null>(null);
  const actionBaselineRef = useRef<ActionBaseline | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const notReadySinceRef = useRef<number | null>(null);
  const lastCaptureRef = useRef(0);
  const captureLivenessRef = useRef<() => Promise<void>>(async () => {});
  const captureSelfieRef = useRef<() => Promise<void>>(async () => {});

  const currentLivenessStep = session?.liveness_steps[livenessIndex] ?? null;
  const livenessInfo = currentLivenessStep ? LIVENESS_LABELS[currentLivenessStep] : null;

  useEffect(() => {
    setStepActionReady(false);
    setStepFeedback(null);
    setAutoStatus(null);
    actionBaselineRef.current = null;
    holdStartRef.current = null;
    notReadySinceRef.current = null;
  }, [livenessIndex, currentLivenessStep]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported in this browser.");
      return false;
    }
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      return true;
    } catch {
      setCameraError("Camera permission is required for verification.");
      stopCamera();
      return false;
    }
  }, [stopCamera]);

  useEffect(() => {
    if (mode !== "device" || !initialSessionToken) return;

    const sessionToken = initialSessionToken;
    let cancelled = false;

    async function loadDeviceSession() {
      setDeviceLoading(true);
      setError(null);
      try {
        const detail = await api.getVerificationSession(sessionToken, { handoff: mode === "device" });
        if (cancelled) return;

        if (detail.status !== "PENDING") {
          setResult(detail);
          setFlowStep("result");
          return;
        }

        const startPayload: VerificationStartResponse = {
          session_id: sessionToken,
          session_token: sessionToken,
          expires_at: detail.expires_at,
          instructions: [],
          liveness_steps: detail.liveness_steps,
          handoff_url: detail.handoff_url,
        };
        setSession(startPayload);

        const completed = detail.session?.liveness_steps_completed ?? [];
        setCompletedSteps(completed);
        const nextIndex = completed.length;
        if (nextIndex >= detail.liveness_steps.length) {
          setFlowStep("selfie");
        } else {
          setLivenessIndex(nextIndex);
          setFlowStep("liveness");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load verification session.");
          setFlowStep("instructions");
        }
      } finally {
        if (!cancelled) setDeviceLoading(false);
      }
    }

    void loadDeviceSession();
    return () => {
      cancelled = true;
    };
  }, [mode, initialSessionToken]);

  useEffect(() => {
    if (flowStep !== "liveness" && flowStep !== "selfie") {
      stopCamera();
      return;
    }
    void startCamera();
    return () => stopCamera();
  }, [flowStep, livenessIndex, startCamera, stopCamera]);

  const handleStart = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.startVerification();
      setSession(data);
      setLivenessIndex(0);
      setCompletedSteps([]);
      setFlowStep("liveness");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartOtherDevice = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const data = session ?? (await api.startVerification());
      setSession(data);
      setFlowStep("cross_device");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoteComplete = useCallback(
    (remoteResult: VerificationStatusResponse) => {
      stopCamera();
      setResult(remoteResult);
      setFlowStep("result");
    },
    [stopCamera]
  );

  const handleCaptureLiveness = useCallback(async () => {
    if (!session || !currentLivenessStep || !videoRef.current) return;
    setSubmitting(true);
    setError(null);
    try {
      const file = await captureFrame(videoRef.current);
      if (!file) throw new Error("Could not capture image.");

      const response = await api.submitLivenessStep(
        session.session_token,
        currentLivenessStep,
        file,
        { handoff: mode === "device" }
      );
      setStepFeedback(response);
      setCompletedSteps(response.liveness_steps_completed);
      if (response.baseline_captured) {
        setStepActionReady(true);
        const m = overlayStateRef.current?.metrics;
        if (m) {
          actionBaselineRef.current = {
            eyeEar: m.eyeEar,
            mouthOpen: m.mouthOpen,
            yaw: m.yaw,
            expressionHappy: m.expressionHappy,
          };
        }
      }

      if (response.passed) {
        holdStartRef.current = null;
        notReadySinceRef.current = null;
        lastCaptureRef.current = Date.now();
        const nextIndex = livenessIndex + 1;
        if (nextIndex >= session.liveness_steps.length) {
          setFlowStep("selfie");
        } else {
          setTimeout(() => {
            setLivenessIndex(nextIndex);
            setStepFeedback(null);
          }, 500);
        }
      } else if (response.baseline_captured) {
        setError(null);
        lastCaptureRef.current = 0;
      } else if (!response.baseline_captured) {
        setError(null);
        lastCaptureRef.current = Date.now() - (AUTO_CAPTURE_COOLDOWN_MS - AUTO_CAPTURE_RETRY_COOLDOWN_MS);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Liveness check failed.");
    } finally {
      setSubmitting(false);
    }
  }, [session, currentLivenessStep, mode, livenessIndex]);

  const handleCaptureSelfie = useCallback(async () => {
    if (!session || !videoRef.current) return;
    setSubmitting(true);
    setError(null);
    try {
      const file = await captureFrame(videoRef.current);
      if (!file) throw new Error("Could not capture selfie.");

      stopCamera();
      setFlowStep("processing");

      const response = await api.uploadVerificationSelfie(session.session_token, file, {
        handoff: mode === "device",
      });
      setResult(response);
      setFlowStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setFlowStep("selfie");
      void startCamera();
    } finally {
      setSubmitting(false);
    }
  }, [session, mode, stopCamera, startCamera]);

  captureLivenessRef.current = handleCaptureLiveness;
  captureSelfieRef.current = handleCaptureSelfie;

  const tryAutoCapture = useCallback(
    (state: FaceOverlayState) => {
      if (submitting || !cameraReady) return;
      if (flowStep !== "liveness" && flowStep !== "selfie") return;

      const now = Date.now();
      if (now - lastCaptureRef.current < AUTO_CAPTURE_COOLDOWN_MS) return;

      const input = {
        flowStep: flowStep as "liveness" | "selfie",
        step: currentLivenessStep,
        awaitingAction: stepActionReady,
        metrics: state.metrics,
        manyFaces: state.manyFaces,
        modelLoading: state.modelLoading,
        actionBaseline: actionBaselineRef.current,
      };

      setAutoStatus(autoCaptureStatusMessage(input));

      if (!isAutoCaptureReady(input)) {
        // Tolerate brief flicker (a blink, a momentary lighting/webcam noise
        // frame) instead of nuking the whole hold timer on a single bad
        // frame — only reset once "not ready" has persisted for a bit.
        if (notReadySinceRef.current === null) {
          notReadySinceRef.current = now;
        } else if (now - notReadySinceRef.current >= HOLD_GRACE_MS) {
          holdStartRef.current = null;
        }
        return;
      }
      notReadySinceRef.current = null;

      const requiredMs = getAutoCaptureHoldMs(input);
      if (holdStartRef.current === null) {
        holdStartRef.current = now;
        return;
      }
      if (now - holdStartRef.current < requiredMs) return;

      holdStartRef.current = null;
      lastCaptureRef.current = now;
      void (flowStep === "selfie"
        ? captureSelfieRef.current()
        : captureLivenessRef.current());
    },
    [
      submitting,
      cameraReady,
      flowStep,
      currentLivenessStep,
      stepActionReady,
    ]
  );

  const handleOverlayState = useCallback(
    (state: FaceOverlayState) => {
      overlayStateRef.current = state;
      tryAutoCapture(state);
    },
    [tryAutoCapture]
  );

  // Four clear stages instead of a percentage bar plus a separate step counter.
  const stages = ["Start", "Face check", "Selfie", "Result"] as const;
  const stageIndex =
    flowStep === "liveness" || flowStep === "cross_device"
      ? 1
      : flowStep === "selfie"
        ? 2
        : flowStep === "processing" || flowStep === "result"
          ? 3
          : 0;

  const scrollableStep =
    flowStep === "instructions" || flowStep === "cross_device" || flowStep === "result";

  const noticeClass = "shrink-0 rounded-xl px-4 py-2.5 text-sm";

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden px-4 py-3 sm:px-5 sm:py-4 lg:max-w-3xl">
      <ol className="mb-3 grid shrink-0 grid-cols-4 gap-2" aria-label="Verification progress">
        {stages.map((label, index) => {
          const done = index < stageIndex || (index === 3 && flowStep === "result");
          const active = index === stageIndex && !done;
          return (
            <li key={label} className="space-y-1.5">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors duration-500",
                  done ? "gradient-brand" : active ? "bg-primary/50" : "bg-secondary"
                )}
              />
              <p
                className={cn(
                  "text-center text-[11px] font-medium",
                  active || done ? "text-on-surface" : "text-on-surface-variant/70"
                )}
                aria-current={active ? "step" : undefined}
              >
                {label}
              </p>
            </li>
          );
        })}
      </ol>

      <div
        className={
          scrollableStep
            ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain hide-scrollbar"
            : "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain hide-scrollbar"
        }
        data-lenis-prevent
      >
      {flowStep === "instructions" && (
        <div className="flex flex-col pb-2">
          {submitting ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
              <Loader pageName="Verification" />
              <p className="mt-3 text-sm text-on-surface-variant">Getting things ready…</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center pt-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg shadow-primary/25">
                  <span className="material-symbols-outlined text-3xl">verified_user</span>
                </div>
                <h2 className="mt-4 font-[var(--font-headline)] text-2xl font-bold text-on-surface">
                  Get your verified badge
                </h2>
                <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">
                  A quick face check shows people you&apos;re the person in your photos.
                </p>
              </div>

              <ul className="mt-6 divide-y divide-outline-variant/15 overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                {[
                  { icon: "light_mode", text: "Find good light and face the camera" },
                  { icon: "gesture", text: "Follow 3 quick moves, like a smile or a head turn" },
                  { icon: "person", text: "Keep only your face in the frame" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3 px-4 py-3 text-sm text-on-surface">
                    <span className="material-symbols-outlined text-xl text-primary">{item.icon}</span>
                    {item.text}
                  </li>
                ))}
              </ul>
              <p className="mt-2 px-1 text-xs text-on-surface-variant">
                Takes under a minute. Photos are captured automatically.
              </p>

              {error && (
                <p className={cn(noticeClass, "mt-4 border border-red-500/30 bg-red-500/10 text-red-300")}>
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={submitting}
                className="mt-6 w-full shrink-0 rounded-full py-3.5 font-bold text-white shadow-lg shadow-primary/20 gradient-brand disabled:opacity-60"
              >
                Start verification
              </button>
              <button
                type="button"
                onClick={() => void handleStartOtherDevice()}
                disabled={submitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">smartphone</span>
                No camera here? Use your phone
              </button>
            </>
          )}
        </div>
      )}

      {flowStep === "cross_device" && session && (
        <CrossDeviceVerification
          session={session}
          userEmail={user?.email}
          onComplete={handleRemoteComplete}
          onUseThisDevice={() => {
            setLivenessIndex(0);
            setCompletedSteps([]);
            setFlowStep("liveness");
          }}
        />
      )}

      {deviceLoading && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <Loader pageName="Verification" />
          <p className="mt-3 text-sm text-on-surface-variant">Loading your session…</p>
        </div>
      )}

      {!deviceLoading && (flowStep === "liveness" || flowStep === "selfie") && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="shrink-0 text-center">
            {flowStep === "liveness" && livenessInfo ? (
              <>
                {session ? (
                  <div className="mb-2 flex justify-center gap-1.5">
                    {session.liveness_steps.map((step, index) => {
                      const done = completedSteps.includes(step);
                      const current = index === livenessIndex;
                      return (
                        <span
                          key={step}
                          title={LIVENESS_LABELS[step].title}
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors",
                            done
                              ? "border-transparent gradient-brand text-white"
                              : current
                                ? "border-primary text-primary"
                                : "border-outline-variant/40 text-on-surface-variant/60"
                          )}
                        >
                          <span className="material-symbols-outlined text-base">
                            {done ? "check" : LIVENESS_LABELS[step].icon}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ) : null}
                <h2 className="font-[var(--font-headline)] text-lg font-bold text-on-surface sm:text-xl">
                  {livenessInfo.title}
                </h2>
                <p className="text-sm text-on-surface-variant">{livenessInfo.hint}</p>
              </>
            ) : (
              <>
                <h2 className="font-[var(--font-headline)] text-lg font-bold text-on-surface sm:text-xl">
                  Final selfie
                </h2>
                <p className="text-sm text-on-surface-variant">Look straight at the camera and hold still.</p>
              </>
            )}
          </div>

          <div className="relative mx-auto aspect-[3/4] h-[58vh] w-auto max-w-full overflow-hidden rounded-3xl border border-primary/15 bg-black shadow-xl shadow-black/30 sm:h-[68vh] lg:h-[74vh]">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
            <FaceVerificationOverlay
              videoRef={videoRef}
              active={cameraReady && !cameraError}
              flowProgress={
                session
                  ? flowStep === "selfie"
                    ? 0.85
                    : completedSteps.length / session.liveness_steps.length
                  : 0
              }
              onStateChange={handleOverlayState}
              // Step feedback shows on the video (not as a second note under the card).
              statusMessage={
                stepFeedback && !stepFeedback.passed
                  ? stepFeedback.detail ||
                    (stepFeedback.baseline_captured ? "Got it. Now do the move." : "Try again with better light.")
                  : autoStatus
              }
            />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-sm text-white">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Starting camera…
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-6 text-center text-sm text-white">
                <span className="material-symbols-outlined text-3xl text-red-300">videocam_off</span>
                {cameraError}
              </div>
            )}
          </div>

          {error && (
            <p className={cn(noticeClass, "text-center border border-red-500/30 bg-red-500/10 text-red-300")}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              void (flowStep === "selfie" ? handleCaptureSelfie() : handleCaptureLiveness())
            }
            disabled={submitting || !cameraReady}
            className="mx-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-secondary hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">photo_camera</span>
            {submitting ? "Checking…" : "Not capturing? Tap to capture"}
          </button>
        </div>
      )}

      {flowStep === "processing" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <Loader pageName="Verification" />
          <h2 className="mt-4 font-[var(--font-headline)] text-xl font-bold text-on-surface">
            Checking your selfie
          </h2>
          <p className="mt-1.5 max-w-xs text-sm text-on-surface-variant">This only takes a few seconds.</p>
        </div>
      )}

      {flowStep === "result" && result && (
        <div className="flex flex-col pb-2">
          {(() => {
            const tone =
              result.status === "VERIFIED"
                ? { rgb: "16, 185, 129", icon: "verified", text: "#10b981" }
                : result.status === "UNDER_REVIEW"
                  ? { rgb: "245, 158, 11", icon: "hourglass_top", text: "#f59e0b" }
                  : { rgb: "239, 68, 68", icon: "close", text: "#ef4444" };
            const title =
              result.status === "VERIFIED"
                ? "You're verified"
                : result.status === "UNDER_REVIEW"
                  ? "Under review"
                  : "Couldn't verify you";
            const message =
              mode === "device" && result.status === "VERIFIED"
                ? "All done. You can close this tab and go back to your other device."
                : result.status === "VERIFIED"
                  ? "Your profile now shows the verified badge."
                  : result.status === "UNDER_REVIEW"
                    ? "Our team will check it shortly. We'll let you know."
                    : "Try again in good light, facing the camera.";
            const reasons = result.rejection_reasons ?? [];
            return (
              <div
                className="mt-4 rounded-3xl border p-6 text-center sm:p-8"
                style={{
                  backgroundColor: `rgba(${tone.rgb}, 0.08)`,
                  borderColor: `rgba(${tone.rgb}, 0.3)`,
                }}
                role={result.status === "VERIFIED" ? "status" : "alert"}
              >
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: `rgba(${tone.rgb}, 0.16)`, color: tone.text }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "2.25rem", fontVariationSettings: "'FILL' 1, 'wght' 600" }}>
                    {tone.icon}
                  </span>
                </div>
                <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">{title}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">{message}</p>

                {result.status !== "VERIFIED" && reasons.length > 0 ? (
                  <ul
                    className="mx-auto mt-5 max-w-md space-y-2 rounded-xl p-3 text-left text-sm text-on-surface"
                    style={{ backgroundColor: `rgba(${tone.rgb}, 0.10)` }}
                  >
                    {reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-2">
                        <span className="material-symbols-outlined mt-0.5 text-base" style={{ color: tone.text }}>
                          error
                        </span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })()}

          <div className="mt-6 flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push(mode === "device" ? "/verify" : "/profile")}
              className="w-full rounded-full py-3.5 font-bold text-white gradient-brand"
            >
              {mode === "device" ? "Done" : "Back to profile"}
            </button>
            {result.status !== "VERIFIED" && (
              <button
                type="button"
                onClick={() => {
                  setFlowStep("instructions");
                  setSession(null);
                  setResult(null);
                  setError(null);
                }}
                className="w-full rounded-full py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
