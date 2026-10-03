"use client";

import { createContext, useContext, type ReactNode } from "react";
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

  return (
    <CallContext.Provider value={call}>
      {children}
      <CallOverlay
        state={call.state}
        onAccept={() => void call.acceptIncoming()}
        onReject={() => void call.rejectIncoming()}
        onDismiss={call.dismissIncoming}
        onHangup={() => void call.hangup()}
        onToggleMic={call.toggleMic}
        onToggleVideo={call.toggleVideo}
        onSwitchCamera={() => void call.switchCamera()}
      />
    </CallContext.Provider>
  );
}
