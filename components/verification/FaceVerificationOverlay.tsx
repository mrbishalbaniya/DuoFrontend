"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { FaceOverlayState } from "@/lib/verification/face-overlay/useFaceOverlay";
import { useFaceOverlay } from "@/lib/verification/face-overlay/useFaceOverlay";

export interface FaceVerificationOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active: boolean;
  flowProgress?: number;
  className?: string;
  onStateChange?: (state: FaceOverlayState) => void;
  statusMessage?: string | null;
}

const STATUS_PILL: Record<FaceOverlayState["authStatus"], string> = {
  searching: "bg-black/55 text-cyan-200 border-cyan-400/30",
  aligning: "bg-black/55 text-amber-200 border-amber-400/40",
  ready: "bg-emerald-500/25 text-emerald-100 border-emerald-400/50",
  many_faces: "bg-red-500/20 text-red-100 border-red-400/40",
};

const STATUS_DOT: Record<FaceOverlayState["authStatus"], string> = {
  searching: "bg-cyan-400 animate-pulse",
  aligning: "bg-amber-400 animate-pulse",
  ready: "bg-emerald-400",
  many_faces: "bg-red-400 animate-pulse",
};

export function FaceVerificationOverlay({
  videoRef,
  active,
  flowProgress = 0,
  className,
  onStateChange,
  statusMessage,
}: FaceVerificationOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const overlayState = useFaceOverlay({
    videoRef,
    canvasRef,
    active,
    mirrored: true,
    flowProgress,
  });

  useEffect(() => {
    if (!active || !onStateChange) return;
    onStateChange(overlayState);
  }, [active, onStateChange, overlayState]);

  const { metrics, authStatus, modelLoading, modelError } = overlayState;

  const message =
    statusMessage ??
    (modelError
      ? "Face detection unavailable"
      : modelLoading
        ? "Initializing face scan…"
        : metrics.guidance);

  const pillStatus =
    statusMessage?.includes("capturing") || statusMessage?.includes("Hold still")
      ? "ready"
      : authStatus;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

      {active && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
          <div
            className={cn(
              "flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-center text-sm font-medium backdrop-blur-sm",
              STATUS_PILL[pillStatus]
            )}
          >
            <span
              className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[pillStatus])}
              aria-hidden
            />
            <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
