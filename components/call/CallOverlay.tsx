"use client";

import type { CallPhase } from "@/lib/call/types";
import type { WebRtcPeer } from "@/lib/call/webrtc";

type Props = {
  phase: CallPhase;
  remoteName: string;
  callType: "voice" | "video";
  connectionState: string;
  peer: WebRtcPeer;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
};

export function CallOverlay({
  phase,
  remoteName,
  callType,
  connectionState,
  peer,
  onAccept,
  onReject,
  onHangup,
  onToggleMic,
  onToggleVideo,
  onSwitchCamera,
}: Props) {
  if (phase === "idle" || phase === "ended") return null;

  const isVideo = callType === "video";
  const localStream = peer.getLocalStream();
  const remoteStream = peer.getRemoteStream();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white">
      <div className="relative flex-1">
        {isVideo && remoteStream ? (
          <video
            autoPlay
            playsInline
            ref={(node) => {
              if (node) node.srcObject = remoteStream;
            }}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-semibold">
            {remoteName}
          </div>
        )}
        {isVideo && localStream ? (
          <video
            autoPlay
            muted
            playsInline
            ref={(node) => {
              if (node) node.srcObject = localStream;
            }}
            className="absolute bottom-24 right-4 h-32 w-24 rounded-xl object-cover shadow-lg"
          />
        ) : null}
      </div>

      <div className="px-6 pb-8 pt-4 text-center">
        <p className="text-lg font-medium">{remoteName}</p>
        <p className="text-sm text-white/70">
          {phase} · {connectionState}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {phase === "incoming" ? (
            <>
              <button type="button" onClick={onReject} className="rounded-full bg-red-600 px-6 py-3">
                Decline
              </button>
              <button type="button" onClick={onAccept} className="rounded-full bg-green-600 px-6 py-3">
                Accept
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onToggleMic} className="rounded-full bg-white/15 px-4 py-3">
                Mic
              </button>
              {isVideo ? (
                <>
                  <button type="button" onClick={onToggleVideo} className="rounded-full bg-white/15 px-4 py-3">
                    Video
                  </button>
                  <button type="button" onClick={onSwitchCamera} className="rounded-full bg-white/15 px-4 py-3">
                    Flip
                  </button>
                </>
              ) : null}
              <button type="button" onClick={onHangup} className="rounded-full bg-red-600 px-6 py-3">
                End
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
