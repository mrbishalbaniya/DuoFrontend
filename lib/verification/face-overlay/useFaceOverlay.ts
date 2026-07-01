"use client";

import { useEffect, useRef, useState } from "react";
import type { FaceQualityMetrics } from "./metrics";
import {
  analyzeFaceQuality,
  computeOverlayProgress,
  progressStageForValue,
} from "./metrics";
import { renderFaceOverlay, sampleCanvasQuality, updateSmoothBox } from "./renderer";
import { smoothLandmarks } from "./smoothing";
import type { FaceBoundingBox } from "./metrics";
import type { FaceLandmarkPoint } from "./landmarks";
import { drawVideoForAnalysis } from "./videoTransform";
import { getFaceAuthStatus, type FaceAuthStatus } from "./faceAuthStatus";
import { detectFacesOnCanvas } from "@/lib/verification/face-api/detect";
import { getFaceApi } from "@/lib/verification/face-api/loadModels";

export interface FaceOverlayState {
  metrics: FaceQualityMetrics;
  authStatus: FaceAuthStatus;
  manyFaces: boolean;
  progress: number;
  progressStage: string;
  modelLoading: boolean;
  modelError: string | null;
}

const INITIAL_METRICS: FaceQualityMetrics = {
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

export interface UseFaceOverlayOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  active: boolean;
  mirrored?: boolean;
  flowProgress?: number;
}

export function useFaceOverlay({
  videoRef,
  canvasRef,
  active,
  mirrored = true,
  flowProgress = 0,
}: UseFaceOverlayOptions): FaceOverlayState {
  const [state, setState] = useState<FaceOverlayState>({
    metrics: INITIAL_METRICS,
    authStatus: "searching",
    manyFaces: false,
    progress: 0,
    progressStage: "Detecting Face",
    modelLoading: true,
    modelError: null,
  });

  const modelsReadyRef = useRef(false);
  const detectingRef = useRef(false);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothLandmarksRef = useRef<FaceLandmarkPoint[] | null>(null);
  const smoothBoxRef = useRef<FaceBoundingBox | null>(null);
  const prevCenterRef = useRef<{ x: number; y: number } | null>(null);
  const expressionHappyRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastHudUpdateRef = useRef(0);
  const flowProgressRef = useRef(flowProgress);
  const modelErrorRef = useRef<string | null>(null);
  const renderStateRef = useRef({
    landmarks: null as FaceLandmarkPoint[] | null,
    metrics: INITIAL_METRICS,
    manyFaces: false,
    authStatus: "searching" as FaceAuthStatus,
    progress: 0,
  });

  useEffect(() => {
    flowProgressRef.current = flowProgress;
  }, [flowProgress]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function initFaceApi() {
      setState((s) => ({ ...s, modelLoading: true, modelError: null }));
      try {
        await getFaceApi();
        if (cancelled) return;
        modelsReadyRef.current = true;
        modelErrorRef.current = null;
        setState((s) => ({ ...s, modelLoading: false, modelError: null }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not load face detection";
        modelErrorRef.current = message;
        if (!cancelled) {
          setState((s) => ({ ...s, modelLoading: false, modelError: message }));
        }
      }
    }

    void initFaceApi();

    return () => {
      cancelled = true;
      modelsReadyRef.current = false;
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (!analysisCanvasRef.current) {
      analysisCanvasRef.current = document.createElement("canvas");
    }

    let sampleCounter = 0;

    const runDetection = async (analysisCanvas: HTMLCanvasElement) => {
      if (!modelsReadyRef.current || detectingRef.current) return;
      detectingRef.current = true;
      try {
        const faces = await detectFacesOnCanvas(analysisCanvas);
        const manyFaces = faces.length > 1;
        const primary = faces[0];
        const raw = primary?.landmarks ?? null;
        expressionHappyRef.current = primary?.expressionHappy ?? 0;
        const landmarks = smoothLandmarks(smoothLandmarksRef.current, raw);
        smoothLandmarksRef.current = landmarks;

        sampleCounter += 1;
        const shouldSample = sampleCounter % 4 === 0;
        const prelim = analyzeFaceQuality(
          landmarks,
          null,
          prevCenterRef.current,
          expressionHappyRef.current
        );
        const sample =
          shouldSample && prelim.bbox
            ? sampleCanvasQuality(analysisCanvas, prelim.bbox)
            : null;

        const metrics = analyzeFaceQuality(
          landmarks,
          sample,
          prevCenterRef.current,
          expressionHappyRef.current
        );
        if (metrics.bbox) {
          prevCenterRef.current = {
            x: metrics.bbox.x + metrics.bbox.width / 2,
            y: metrics.bbox.y + metrics.bbox.height / 2,
          };
        }
        smoothBoxRef.current = updateSmoothBox(smoothBoxRef.current, metrics.bbox);
        const progress = computeOverlayProgress(metrics, flowProgressRef.current);
        const authStatus = getFaceAuthStatus(metrics, manyFaces);

        renderStateRef.current = {
          landmarks,
          metrics,
          manyFaces,
          authStatus,
          progress,
        };
      } catch {
        smoothLandmarksRef.current = null;
        renderStateRef.current = {
          landmarks: null,
          metrics: INITIAL_METRICS,
          manyFaces: false,
          authStatus: "searching",
          progress: 0,
        };
      } finally {
        detectingRef.current = false;
      }
    };

    const tick = (timeMs: number) => {
      rafRef.current = requestAnimationFrame(tick);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const analysisCanvas = analysisCanvasRef.current;
      if (!video || !canvas || !analysisCanvas || video.readyState < 2) return;

      const videoRect = video.getBoundingClientRect();
      const displayW = videoRect.width;
      const displayH = videoRect.height;
      if (displayW < 1 || displayH < 1) return;

      const dpr = window.devicePixelRatio || 1;
      const analysisW = Math.round(displayW * dpr);
      const analysisH = Math.round(displayH * dpr);

      if (analysisCanvas.width !== analysisW || analysisCanvas.height !== analysisH) {
        analysisCanvas.width = analysisW;
        analysisCanvas.height = analysisH;
      }

      if (canvas.width !== Math.round(displayW * dpr) || canvas.height !== Math.round(displayH * dpr)) {
        canvas.width = Math.round(displayW * dpr);
        canvas.height = Math.round(displayH * dpr);
      }

      const ctx = canvas.getContext("2d");
      const analysisCtx = analysisCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !analysisCtx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const frameReady = drawVideoForAnalysis(
        analysisCtx,
        video,
        analysisW,
        analysisH,
        mirrored
      );

      if (frameReady && modelsReadyRef.current) {
        void runDetection(analysisCanvas);
      }

      const { landmarks, metrics, manyFaces, authStatus, progress } = renderStateRef.current;

      renderFaceOverlay(
        ctx,
        displayW,
        displayH,
        {
          landmarks,
          metrics,
          smoothBox: smoothBoxRef.current,
          progress,
          authStatus,
        },
        timeMs
      );

      if (timeMs - lastHudUpdateRef.current > 100) {
        lastHudUpdateRef.current = timeMs;
        setState({
          metrics,
          authStatus,
          manyFaces,
          progress,
          progressStage: progressStageForValue(progress),
          modelLoading: !modelsReadyRef.current && !modelErrorRef.current,
          modelError: modelErrorRef.current,
        });
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      smoothBoxRef.current = null;
      smoothLandmarksRef.current = null;
      prevCenterRef.current = null;
      expressionHappyRef.current = 0;
    };
  }, [active, mirrored, videoRef, canvasRef]);

  return state;
}
