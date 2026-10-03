"use client";

import { useEffect, useRef, useState } from "react";
import type { CallState } from "@/lib/call/useCallManager";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { IncomingCall } from "@/components/ui/card-16";

type Props = {
  state: CallState;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
  onHangup: () => void;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
};

function useBoundStream<T extends HTMLMediaElement>(stream: MediaStream | null) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (node.srcObject !== stream) node.srcObject = stream;
    if (stream) void node.play().catch(() => {});
  }, [stream]);
  return ref;
}

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function useElapsed(since: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [since]);
  return since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
}

/** Live mic level (0..1) so the avatar can pulse while someone talks. */
function useAudioLevel(stream: MediaStream | null, enabled: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!enabled || !stream || !stream.getAudioTracks().length) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    let ctx: AudioContext;
    try {
      ctx = new Ctx();
    } catch {
      return;
    }
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 80) return;
      last = t;
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (const v of data) sum += v;
      setLevel(Math.min(1, sum / data.length / 60));
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      void ctx.close().catch(() => {});
    };
  }, [stream, enabled]);
  return enabled && stream ? level : 0;
}

function ControlButton({
  icon,
  label,
  onClick,
  variant = "glass",
  size = "md",
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?: "glass" | "on" | "danger" | "success";
  size?: "md" | "lg";
}) {
  const styles = {
    glass: "bg-white/10 text-white hover:bg-white/20 ring-1 ring-white/10",
    on: "bg-white text-neutral-900 hover:bg-white/90",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30",
  }[variant];
  const dims = size === "lg" ? "h-16 w-16 text-[30px]" : "h-14 w-14 text-[26px]";
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`flex items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 ${dims} ${styles}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "inherit", fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </button>
      <span className="text-[11px] font-medium text-white/75">{label}</span>
    </div>
  );
}

function Avatar({
  photo,
  name,
  ringing,
  level,
  size = "lg",
}: {
  photo: string;
  name: string;
  ringing: boolean;
  level: number;
  size?: "lg" | "sm";
}) {
  const dims = size === "lg" ? "h-36 w-36 sm:h-40 sm:w-40 text-6xl" : "h-20 w-20 text-3xl";
  return (
    <div className="relative flex items-center justify-center">
      {ringing ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-white/15 [animation-duration:2s]" />
          <span className="absolute -inset-4 animate-ping rounded-full bg-white/10 [animation-delay:0.6s] [animation-duration:2s]" />
        </>
      ) : null}
      <span
        className="absolute rounded-full bg-emerald-400/25 transition-transform duration-100"
        style={{ inset: "-10px", transform: `scale(${1 + level * 0.25})`, opacity: level > 0.05 ? 1 : 0 }}
      />
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          className={`relative rounded-full object-cover shadow-2xl ring-4 ring-white/15 ${dims}`}
        />
      ) : (
        <div
          className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 font-semibold text-white shadow-2xl ring-4 ring-white/15 ${dims}`}
        >
          {(name || "?").charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function CallOverlay({
  state,
  onAccept,
  onReject,
  onDismiss,
  onHangup,
  onToggleMic,
  onToggleVideo,
  onSwitchCamera,
}: Props) {
  const { phase, remoteName, remotePhoto, localStream, remoteStream, micOn, videoOn } = state;
  const isVideo = state.session?.call_type === "video";
  const elapsed = useElapsed(phase === "active" ? state.connectedAt : null);
  const remoteVideoRef = useBoundStream<HTMLVideoElement>(remoteStream);
  const remoteAudioRef = useBoundStream<HTMLAudioElement>(remoteStream);
  const localVideoRef = useBoundStream<HTMLVideoElement>(localStream);
  // Blurred copy behind a letterboxed remote video (fills the side bars).
  const remoteBackdropRef = useBoundStream<HTMLVideoElement>(remoteStream);
  // Remote frame shape vs. window shape: a portrait phone camera shown with
  // object-cover in a landscape desktop window was zoomed in and cropped.
  const [remotePortrait, setRemotePortrait] = useState<boolean | null>(null);
  const [viewportPortrait, setViewportPortrait] = useState(false);
  useEffect(() => {
    const update = () => setViewportPortrait(window.innerHeight > window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const onRemoteResize = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) setRemotePortrait(v.videoHeight > v.videoWidth);
  };
  const letterboxRemote = remotePortrait !== null && remotePortrait !== viewportPortrait;
  const remoteLevel = useAudioLevel(remoteStream, phase === "active");
  const [canFlip, setCanFlip] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isVideo || !navigator.mediaDevices?.enumerateDevices) return;
    void navigator.mediaDevices
      .enumerateDevices()
      .then((d) => setCanFlip(d.filter((x) => x.kind === "videoinput").length > 1))
      .catch(() => {});
  }, [isVideo, localStream]);

  useEffect(() => {
    if (phase === "idle") setSwapped(false);
  }, [phase]);

  const remoteHasVideo = Boolean(remoteStream?.getVideoTracks().some((t) => t.readyState === "live"));
  const showRemoteVideo = isVideo && phase === "active" && remoteHasVideo;
  const hasLocalVideo = isVideo && Boolean(localStream?.getVideoTracks().length) && phase !== "ended";
  // Before the other side joins, show my own camera full screen like a mirror.
  const localFull = hasLocalVideo && (!showRemoteVideo || swapped);

  // Auto-hide controls during an active video call; tap to bring them back.
  const pokeControls = () => {
    setControlsVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (showRemoteVideo) {
      hideTimer.current = window.setTimeout(() => setControlsVisible(false), 4000);
    }
  };
  useEffect(() => {
    pokeControls();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRemoteVideo]);

  if (phase === "idle") return null;

  // Incoming rings use a small corner card instead of taking over the screen.
  if (phase === "incoming" || (phase === "ended" && state.wasIncoming)) {
    const incomingPhoto = remotePhoto ? resolveMediaUrl(remotePhoto) ?? remotePhoto : undefined;
    return (
      <IncomingCall
        isOpen={phase === "incoming" && !state.dismissed}
        callerName={remoteName || "Someone"}
        callerInfo={isVideo ? "Video" : "Voice"}
        statusText="is calling you..."
        avatarUrl={incomingPhoto}
        isVideo={isVideo}
        onAccept={onAccept}
        onDecline={onReject}
        onClose={onDismiss}
      />
    );
  }

  const photo = remotePhoto ? resolveMediaUrl(remotePhoto) ?? remotePhoto : "";
  const ringing = phase === "outgoing";
  const reconnecting = phase === "active" && state.connectionState === "disconnected";

  const status =
    phase === "outgoing"
        ? "Ringing…"
        : phase === "connecting"
          ? "Connecting…"
          : phase === "active"
            ? reconnecting
              ? "Reconnecting…"
              : formatDuration(elapsed)
            : state.endMessage ?? "Call ended";

  const showControls = controlsVisible || !showRemoteVideo || phase !== "active";

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-neutral-950 text-white"
      role="dialog"
      aria-label={`${isVideo ? "Video" : "Voice"} call with ${remoteName}`}
      onMouseMove={pokeControls}
      onClick={pokeControls}
    >
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Backdrop: blurred photo so voice calls feel personal, not blank. */}
      <div className="absolute inset-0">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full scale-125 object-cover opacity-50 blur-3xl" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-rose-900/60 via-neutral-900 to-fuchsia-950/60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />
      </div>

      {/* Full-screen video layer. */}
      {isVideo ? (
        <>
          {/* Always mounted so useBoundStream has a node when the stream arrives. */}
          <video
            ref={remoteBackdropRef}
            autoPlay
            playsInline
            muted
            aria-hidden
            className={
              showRemoteVideo && !swapped && letterboxRemote
                ? "pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
                : "hidden"
            }
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={onRemoteResize}
            onResize={onRemoteResize}
            onClick={(e) => {
              if (swapped) {
                e.stopPropagation();
                setSwapped(false);
              }
            }}
            className={
              showRemoteVideo
                ? swapped
                  ? "absolute right-4 top-20 z-20 h-44 w-32 cursor-pointer rounded-2xl bg-black object-cover shadow-2xl ring-1 ring-white/20 sm:h-56 sm:w-40"
                  : `absolute inset-0 h-full w-full ${
                      letterboxRemote ? "bg-transparent object-contain" : "bg-black object-cover"
                    }`
                : "hidden"
            }
          />
          {hasLocalVideo ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              onClick={(e) => {
                if (!localFull && showRemoteVideo) {
                  e.stopPropagation();
                  setSwapped(true);
                }
              }}
              className={`bg-black object-cover [transform:scaleX(-1)] transition-opacity ${
                videoOn ? "opacity-100" : "opacity-0"
              } ${
                localFull
                  ? "absolute inset-0 h-full w-full"
                  : "absolute right-4 top-20 z-20 h-44 w-32 cursor-pointer rounded-2xl shadow-2xl ring-1 ring-white/20 sm:h-56 sm:w-40"
              }`}
            />
          ) : null}
          {hasLocalVideo && !videoOn && !localFull ? (
            <div className="absolute right-4 top-20 z-20 flex h-44 w-32 flex-col items-center justify-center gap-1 rounded-2xl bg-neutral-800/90 ring-1 ring-white/20 sm:h-56 sm:w-40">
              <span className="material-symbols-outlined text-[30px] text-white/60">videocam_off</span>
              <span className="text-[11px] text-white/60">Camera off</span>
            </div>
          ) : null}
          {localFull && (!showRemoteVideo || swapped) ? <div className="absolute inset-0 bg-black/35" /> : null}
        </>
      ) : null}

      {/* Top bar. */}
      <div
        className={`absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-5 pb-8 pt-5 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs text-white/70">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          {isVideo ? "Video call" : "Voice call"}
        </div>
        {showRemoteVideo ? (
          <div className="text-right">
            <p className="text-sm font-semibold">{remoteName}</p>
            <p className="text-xs tabular-nums text-white/75">{status}</p>
          </div>
        ) : null}
      </div>

      {/* Centered identity when there's no remote video. */}
      {!showRemoteVideo ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-7 px-6 pb-40 text-center">
          <Avatar
            photo={photo}
            name={remoteName}
            ringing={ringing}
            level={phase === "active" ? remoteLevel : 0}
          />
          <div>
            <h2 className="text-3xl font-semibold tracking-tight drop-shadow">{remoteName || "Unknown"}</h2>
            <p
              className={`mt-2 text-base tabular-nums drop-shadow ${
                phase === "ended" ? "text-rose-300" : reconnecting ? "text-amber-300" : "text-white/80"
              }`}
            >
              {status}
            </p>
            {phase === "active" && !micOn ? (
              <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur">
                <span className="material-symbols-outlined text-[14px]">mic_off</span>
                You&apos;re muted
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Bottom controls. */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pb-10 pt-16 transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "ended" ? (
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <span className="material-symbols-outlined text-[30px] text-white/70">call_end</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-fit items-start gap-4 rounded-[2rem] bg-white/5 px-5 py-4 ring-1 ring-white/10 backdrop-blur-xl sm:gap-6">
            <ControlButton
              icon={micOn ? "mic" : "mic_off"}
              label={micOn ? "Mute" : "Unmute"}
              variant={micOn ? "glass" : "on"}
              onClick={onToggleMic}
            />
            {isVideo ? (
              <ControlButton
                icon={videoOn ? "videocam" : "videocam_off"}
                label={videoOn ? "Stop video" : "Start video"}
                variant={videoOn ? "glass" : "on"}
                onClick={onToggleVideo}
              />
            ) : null}
            {isVideo && canFlip ? (
              <ControlButton icon="cameraswitch" label="Flip" onClick={onSwitchCamera} />
            ) : null}
            <ControlButton icon="call_end" label="End" variant="danger" onClick={onHangup} />
          </div>
        )}
      </div>
    </div>
  );
}
