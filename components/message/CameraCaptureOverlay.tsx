"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Full-screen camera for taking a chat photo. Uses the browser Fullscreen
 * API when available, with controls floating over the live preview.
 */
export function CameraCaptureOverlay({
  videoRef,
  starting,
  busy,
  onClose,
  onCapture,
  onSwitchCamera,
  onOpenGallery,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  starting: boolean;
  busy: boolean;
  onClose: () => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
  onOpenGallery: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState(false);
  const [canFlip, setCanFlip] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Enter real fullscreen on open; leave it on close.
  useEffect(() => {
    const node = rootRef.current;
    if (node?.requestFullscreen && !document.fullscreenElement) {
      void node.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    }
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    void navigator.mediaDevices
      ?.enumerateDevices?.()
      .then((d) => setCanFlip(d.filter((x) => x.kind === "videoinput").length > 1))
      .catch(() => {});
  }, [starting]);

  const capture = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);
    onCapture();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
      if ((e.key === " " || e.key === "Enter") && !starting && !busy) {
        e.preventDefault();
        capture();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  const glassBtn =
    "flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md ring-1 ring-white/15 transition hover:bg-black/55 active:scale-90 disabled:opacity-40";

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] overflow-hidden bg-black" role="dialog" aria-label="Camera">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {showGrid ? (
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/15" />
          ))}
        </div>
      ) : null}

      {starting ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-white/80">
          <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
          <p className="text-sm">Starting camera…</p>
        </div>
      ) : null}

      <div
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${
          flash ? "opacity-80" : "opacity-0"
        }`}
      />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onClose} aria-label="Close camera" title="Close" className={glassBtn}>
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            aria-label={showGrid ? "Hide grid" : "Show grid"}
            title={showGrid ? "Hide grid" : "Show grid"}
            className={`${glassBtn} ${showGrid ? "!bg-white !text-black" : ""}`}
          >
            <span className="material-symbols-outlined text-[20px]">grid_on</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
            className={glassBtn}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-16">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/70">Photo</p>
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <button
            type="button"
            onClick={onOpenGallery}
            aria-label="Choose from gallery"
            title="Gallery"
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/35 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-black/55 active:scale-90"
          >
            <span className="material-symbols-outlined">photo_library</span>
          </button>

          <button
            type="button"
            onClick={capture}
            disabled={starting || busy}
            aria-label="Take photo"
            title="Take photo (Space)"
            className="group relative flex h-20 w-20 items-center justify-center rounded-full ring-4 ring-white transition active:scale-90 disabled:opacity-50"
          >
            <span className="h-[64px] w-[64px] rounded-full bg-white transition group-hover:scale-95 group-active:scale-90" />
            {busy ? (
              <span className="material-symbols-outlined absolute animate-spin text-[28px] text-black">
                progress_activity
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onSwitchCamera}
            disabled={starting || !canFlip}
            aria-label="Switch camera"
            title={canFlip ? "Switch camera" : "Only one camera found"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-black/55 active:rotate-180 disabled:opacity-40"
          >
            <span className="material-symbols-outlined">cameraswitch</span>
          </button>
        </div>
      </div>
    </div>
  );
}
