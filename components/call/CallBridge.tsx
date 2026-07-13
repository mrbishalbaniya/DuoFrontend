"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CallOverlay } from "@/components/call/CallOverlay";
import { useCallManager } from "@/lib/call/useCallManager";

const CallContext = createContext<ReturnType<typeof useCallManager> | null>(null);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallBridge");
  return ctx;
}

export function CallBridge({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const call = useCallManager(user?.id);
  const micOn = useRef(true);
  const videoOn = useRef(true);
  const value = useMemo(() => call, [call]);

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay
        phase={call.state.phase}
        remoteName={call.state.remoteName}
        callType={call.state.session?.call_type ?? "voice"}
        connectionState={call.state.connectionState}
        peer={call.peer}
        onAccept={() => void call.acceptIncoming()}
        onReject={() => void call.rejectIncoming()}
        onHangup={() => void call.hangup()}
        onToggleMic={() => {
          micOn.current = !micOn.current;
          call.peer.setMicrophoneEnabled(micOn.current);
        }}
        onToggleVideo={() => {
          videoOn.current = !videoOn.current;
          call.peer.setVideoEnabled(videoOn.current);
        }}
        onSwitchCamera={() => void call.peer.switchCamera()}
      />
    </CallContext.Provider>
  );
}
