"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type {
  LivenessStep,
  LivenessStepResponse,
  VerificationStartResponse,
  VerificationStatusResponse,
} from "@/types";

type FlowStep =
  | "instructions"
  | "liveness"
  | "selfie"
  | "processing"
  | "result";

const LIVENESS_LABELS: Record<LivenessStep, { title: string; hint: string; icon: string }> = {
  smile: {
    title: "Smile",
    hint: "Give a natural smile at the camera.",
    icon: "sentiment_satisfied",
  },
  blink: {
    title: "Blink",
    hint: "Blink your eyes clearly once or twice.",
    icon: "visibility",
  },
  head_left: {
    title: "Turn Left",
    hint: "Turn your head toward your left shoulder.",
    icon: "arrow_back",
  },
  head_right: {
    title: "Turn Right",
    hint: "Turn your head toward your right shoulder.",
    icon: "arrow_forward",
  },
};

function captureFrame(video: HTMLVideoElement): Promise<File | null> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
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

export function VerificationFlow() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [flowStep, setFlowStep] = useState<FlowStep>("instructions");
  const [session, setSession] = useState<VerificationStartResponse | null>(null);
  const [livenessIndex, setLivenessIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<LivenessStep[]>([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stepFeedback, setStepFeedback] = useState<LivenessStepResponse | null>(null);
  const [result, setResult] = useState<VerificationStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentLivenessStep = session?.liveness_steps[livenessIndex] ?? null;
  const livenessInfo = currentLivenessStep ? LIVENESS_LABELS[currentLivenessStep] : null;

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

  const handleCaptureLiveness = async () => {
    if (!session || !currentLivenessStep || !videoRef.current) return;
    setSubmitting(true);
    setStepFeedback(null);
    setError(null);
    try {
      const file = await captureFrame(videoRef.current);
      if (!file) throw new Error("Could not capture image.");

      const response = await api.submitLivenessStep(
        session.session_token,
        currentLivenessStep,
        file
      );
      setStepFeedback(response);
      setCompletedSteps(response.liveness_steps_completed);

      if (response.passed) {
        const nextIndex = livenessIndex + 1;
        if (nextIndex >= session.liveness_steps.length) {
          setFlowStep("selfie");
        } else {
          setTimeout(() => {
            setLivenessIndex(nextIndex);
            setStepFeedback(null);
          }, 800);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Liveness check failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCaptureSelfie = async () => {
    if (!session || !videoRef.current) return;
    setSubmitting(true);
    setError(null);
    try {
      const file = await captureFrame(videoRef.current);
      if (!file) throw new Error("Could not capture selfie.");

      stopCamera();
      setFlowStep("processing");

      const response = await api.uploadVerificationSelfie(session.session_token, file);
      setResult(response);
      setFlowStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setFlowStep("selfie");
      void startCamera();
    } finally {
      setSubmitting(false);
    }
  };

  const progress =
    session && flowStep === "liveness"
      ? Math.round((completedSteps.length / session.liveness_steps.length) * 100)
      : flowStep === "selfie"
        ? 85
        : flowStep === "processing"
          ? 95
          : flowStep === "result"
            ? 100
            : 0;

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col px-4 py-3 sm:px-5 sm:py-4">
      <div className="mb-3 shrink-0 sm:mb-4">
        <div className="mb-2 flex items-center justify-between text-sm text-on-surface-variant">
          <span>Profile verification</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full gradient-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {flowStep === "instructions" && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mb-4 rounded-2xl border border-primary/10 bg-secondary/50 p-5 sm:p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-white">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h1 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">
              Verify your profile
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Confirm you are the person in your profile photos. You will complete a short liveness
              check and take a selfie.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                "Use good lighting and face the front camera",
                "Complete smile, blink, and head-turn steps",
                "Take a clear front-facing selfie at the end",
                "Only one person should be visible",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-on-surface">
                  <span className="material-symbols-outlined mt-0.5 text-accent">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={submitting}
            className="mt-4 w-full shrink-0 rounded-xl py-4 font-bold text-white shadow-lg shadow-primary/20 gradient-brand disabled:opacity-60 sm:mt-6"
          >
            {submitting ? "Starting…" : "Start Verification"}
          </button>
        </div>
      )}

      {(flowStep === "liveness" || flowStep === "selfie") && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="shrink-0 text-center">
            {flowStep === "liveness" && livenessInfo ? (
              <>
                <span className="material-symbols-outlined mb-1 text-3xl text-primary sm:text-4xl">
                  {livenessInfo.icon}
                </span>
                <h2 className="font-[var(--font-headline)] text-lg font-bold text-on-surface sm:text-xl">
                  {livenessInfo.title}
                </h2>
                <p className="mt-0.5 text-sm text-on-surface-variant">{livenessInfo.hint}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Step {livenessIndex + 1} of {session?.liveness_steps.length ?? 4}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-[var(--font-headline)] text-lg font-bold text-on-surface sm:text-xl">
                  Take your selfie
                </h2>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  Look straight at the camera with good lighting.
                </p>
              </>
            )}
          </div>

          <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-2xl border border-primary/15 bg-black sm:min-h-[240px]">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
            {!cameraReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
                Starting camera…
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-white">
                {cameraError}
              </div>
            )}
            <div className="pointer-events-none absolute inset-6 rounded-[40%] border-2 border-white/40 sm:inset-8" />
          </div>

          {stepFeedback && !stepFeedback.passed && (
            <p className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              {stepFeedback.detail || "Try again — adjust your pose and lighting."}
            </p>
          )}

          {error && (
            <p className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              void (flowStep === "selfie" ? handleCaptureSelfie() : handleCaptureLiveness())
            }
            disabled={submitting || !cameraReady}
            className="w-full shrink-0 rounded-xl py-3.5 font-bold text-white shadow-lg shadow-primary/20 gradient-brand disabled:opacity-60 sm:py-4"
          >
            {submitting
              ? "Processing…"
              : flowStep === "selfie"
                ? "Capture Selfie & Verify"
                : "Capture"}
          </button>
        </div>
      )}

      {flowStep === "processing" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <h2 className="font-[var(--font-headline)] text-xl font-bold text-on-surface">
            Verifying your identity
          </h2>
          <p className="mt-2 max-w-xs text-sm text-on-surface-variant">
            Comparing your selfie with profile photos and running security checks…
          </p>
        </div>
      )}

      {flowStep === "result" && result && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div
            className={`mb-6 rounded-2xl border p-6 text-center ${
              result.status === "VERIFIED"
                ? "border-accent/30 bg-accent/10"
                : result.status === "UNDER_REVIEW"
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <span
              className={`material-symbols-outlined mb-3 text-5xl ${
                result.status === "VERIFIED"
                  ? "text-accent"
                  : result.status === "UNDER_REVIEW"
                    ? "text-amber-600"
                    : "text-red-600"
              }`}
              style={result.verified_badge ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {result.status === "VERIFIED"
                ? "verified"
                : result.status === "UNDER_REVIEW"
                  ? "hourglass_top"
                  : "cancel"}
            </span>
            <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">
              {result.status === "VERIFIED"
                ? "Verified Profile"
                : result.status === "UNDER_REVIEW"
                  ? "Under Review"
                  : "Verification Failed"}
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              {result.status === "VERIFIED"
                ? "Your profile now shows a verified badge."
                : result.status === "UNDER_REVIEW"
                  ? "Our team will review your submission shortly."
                  : "Please try again with better lighting and a clear front-facing photo."}
            </p>
          </div>

          <div className="mb-6 space-y-3 rounded-2xl border border-primary/10 bg-background p-5 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Face match</span>
              <span className="font-semibold text-on-surface">
                {(result.similarity_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Liveness</span>
              <span className="font-semibold text-on-surface">
                {(result.liveness_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Fraud risk</span>
              <span className="font-semibold text-on-surface">
                {(result.fraud_probability * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {result.rejection_reasons && result.rejection_reasons.length > 0 && (
            <ul className="mb-6 space-y-2 text-sm text-on-surface-variant">
              {result.rejection_reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="material-symbols-outlined text-base text-red-500">info</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex shrink-0 flex-col gap-3 sm:mt-6">
            {result.status !== "VERIFIED" && (
              <button
                type="button"
                onClick={() => {
                  setFlowStep("instructions");
                  setSession(null);
                  setResult(null);
                  setError(null);
                }}
                className="w-full rounded-xl border border-primary/20 py-3.5 font-bold text-primary"
              >
                Try Again
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="w-full rounded-xl py-3.5 font-bold text-white gradient-brand"
            >
              Back to Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
