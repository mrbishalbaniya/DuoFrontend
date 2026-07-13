"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
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
        onToggleMic={() => call.peer.setMicrophoneEnabled(true)}
        onToggleVideo={() => call.peer.setVideoEnabled(true)}
        onSwitchCamera={() => void call.peer.switchCamera()}
      />
    </CallContext.Provider>
  );
}
