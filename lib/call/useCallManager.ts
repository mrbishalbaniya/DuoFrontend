"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { connectCallSocket, sendCallSignal } from "@/lib/call/callWebSocket";
import type { CallPhase, CallSession, CallSignalMessage, CallType } from "@/lib/call/types";
import { WebRtcPeer } from "@/lib/call/webrtc";

type CallApiPayload = {
  id: string;
  conversation_id: string;
  call_type: string;
  status: string;
  caller_id: number;
  callee_id: number;
  ice_servers?: Array<Record<string, string>>;
};

function toCallSession(raw: CallApiPayload): CallSession {
  return {
    id: raw.id,
    conversation_id: raw.conversation_id,
    call_type: raw.call_type === "video" ? "video" : "voice",
    status: raw.status,
    caller_id: raw.caller_id,
    callee_id: raw.callee_id,
    ice_servers: raw.ice_servers?.map((server) => ({
      urls: server.urls ?? "",
      username: server.username,
      credential: server.credential,
    })),
  };
}

type CallState = {
  phase: CallPhase;
  session: CallSession | null;
  remoteName: string;
  connectionState: string;
  error: string | null;
};

const initialState: CallState = {
  phase: "idle",
  session: null,
  remoteName: "",
  connectionState: "new",
  error: null,
};

export function useCallManager(currentUserId?: number) {
  const [state, setState] = useState<CallState>(initialState);
  const peerRef = useRef(new WebRtcPeer());
  const callSocketRef = useRef<WebSocket | null>(null);

  const cleanup = useCallback(async () => {
    callSocketRef.current?.close();
    callSocketRef.current = null;
    await peerRef.current.close();
  }, []);

  const handleSignal = useCallback(
    async (message: CallSignalMessage) => {
      const session = state.session;
      if (!session) return;
      const callId = message.call_id ?? session.id;

      switch (message.type) {
        case "call_offer": {
          const payload = (message.payload ?? message) as Record<string, unknown>;
          const sdp = String(payload.sdp ?? "");
          const sdpType = (payload.type as RTCSdpType) ?? "offer";
          if (sdp) {
            const answer = await peerRef.current.applyOffer(sdp, sdpType);
            sendCallSignal(callSocketRef.current, "call_answer", callId, {
              sdp: answer.sdp,
              sdp_type: answer.type,
            });
            setState((s) => ({ ...s, phase: "active" }));
          }
          break;
        }
        case "call_answer": {
          const payload = (message.payload ?? message) as Record<string, unknown>;
          const sdp = String(payload.sdp ?? "");
          const sdpType = (payload.type as RTCSdpType) ?? "answer";
          if (sdp) await peerRef.current.applyAnswer(sdp, sdpType);
          setState((s) => ({ ...s, phase: "active" }));
          break;
        }
        case "ice_candidate": {
          const payload = (message.payload ?? message) as Record<string, unknown>;
          await peerRef.current.addIceCandidate({
            candidate: String(payload.candidate ?? ""),
            sdpMid: payload.sdpMid as string | undefined,
            sdpMLineIndex: payload.sdpMLineIndex as number | undefined,
          });
          break;
        }
        case "call_accepted":
          setState((s) => ({ ...s, phase: "active" }));
          break;
        case "call_ended":
        case "call_rejected":
        case "call_cancelled":
        case "call_missed":
        case "call_busy":
          await cleanup();
          setState({ ...initialState, phase: "ended" });
          break;
        default:
          break;
      }
    },
    [cleanup, state.session]
  );

  const connectCallSocketFor = useCallback(
    async (conversationId: string, onSignal: (message: CallSignalMessage) => void) => {
      const ticket = await api.getCallWsTicket(conversationId);
      callSocketRef.current?.close();
      callSocketRef.current = connectCallSocket(conversationId, ticket, {
        onMessage: onSignal,
      });
    },
    []
  );

  const startOutgoing = useCallback(
    async ({
      conversationId,
      callType,
      remoteName,
    }: {
      conversationId: string;
      callType: CallType;
      remoteName: string;
    }) => {
      setState({ phase: "outgoing", session: null, remoteName, connectionState: "new", error: null });
      try {
        const session = toCallSession(await api.initiateCall(conversationId, callType));
        setState((s) => ({ ...s, session, phase: "connecting" }));
        await connectCallSocketFor(conversationId, handleSignal);
        const iceServers = session.ice_servers ?? [];
        await peerRef.current.start(callType === "video", iceServers);
        peerRef.current.onIceCandidate = (candidate) => {
          sendCallSignal(callSocketRef.current, "ice_candidate", session.id, {
            candidate: candidate.candidate,
            sdp_mid: candidate.sdpMid,
            sdp_mline_index: candidate.sdpMLineIndex,
          });
        };
        peerRef.current.onConnectionState = (cs) =>
          setState((s) => ({ ...s, connectionState: cs }));
        const offer = await peerRef.current.createOffer();
        sendCallSignal(callSocketRef.current, "call_offer", session.id, {
          sdp: offer.sdp,
          sdp_type: offer.type,
        });
      } catch (error) {
        setState((s) => ({ ...s, phase: "ended", error: String(error) }));
      }
    },
    [connectCallSocketFor, handleSignal]
  );

  const acceptIncoming = useCallback(async () => {
    const session = state.session;
    if (!session) return;
    setState((s) => ({ ...s, phase: "connecting" }));
    try {
      const updated = toCallSession(await api.acceptCall(session.id));
      await connectCallSocketFor(updated.conversation_id, handleSignal);
      const iceServers = updated.ice_servers ?? session.ice_servers ?? [];
      await peerRef.current.start(updated.call_type === "video", iceServers);
      peerRef.current.onIceCandidate = (candidate) => {
        sendCallSignal(callSocketRef.current, "ice_candidate", updated.id, {
          candidate: candidate.candidate,
          sdp_mid: candidate.sdpMid,
          sdp_mline_index: candidate.sdpMLineIndex,
        });
      };
    } catch (error) {
      setState((s) => ({ ...s, phase: "ended", error: String(error) }));
    }
  }, [connectCallSocketFor, handleSignal, state.session]);

  const rejectIncoming = useCallback(async () => {
    if (state.session) await api.rejectCall(state.session.id);
    await cleanup();
    setState({ ...initialState, phase: "ended" });
  }, [cleanup, state.session]);

  const hangup = useCallback(async () => {
    if (state.session) {
      if (state.phase === "outgoing") await api.cancelCall(state.session.id);
      else await api.hangupCall(state.session.id);
    }
    await cleanup();
    setState({ ...initialState, phase: "ended" });
  }, [cleanup, state.phase, state.session]);

  const handleIncomingPayload = useCallback((payload: Record<string, unknown>) => {
    if (state.phase !== "idle") return;
    setState({
      phase: "incoming",
      session: {
        id: String(payload.call_id ?? ""),
        conversation_id: String(payload.conversation_id ?? ""),
        call_type: (payload.call_type as CallType) ?? "voice",
        status: "ringing",
        caller_id: Number(payload.caller_id ?? 0),
        callee_id: currentUserId ?? 0,
      },
      remoteName: String(payload.caller_name ?? "Someone"),
      connectionState: "new",
      error: null,
    });
  }, [currentUserId, state.phase]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  return {
    state,
    peer: peerRef.current,
    startOutgoing,
    acceptIncoming,
    rejectIncoming,
    hangup,
    reset: () => setState(initialState),
  };
}
