"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  connectCallSocket,
  connectInboxSocket,
  sendCallSignal,
} from "@/lib/call/callWebSocket";
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
  const inboxSocketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<CallSession | null>(null);
  const phaseRef = useRef<CallPhase>("idle");
  const offerSentRef = useRef(false);

  useEffect(() => {
    sessionRef.current = state.session;
  }, [state.session]);

  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);

  const cleanup = useCallback(async () => {
    callSocketRef.current?.close();
    callSocketRef.current = null;
    offerSentRef.current = false;
    await peerRef.current.close();
  }, []);

  const createAndSendOffer = useCallback(async (session: CallSession) => {
    if (offerSentRef.current) return;
    offerSentRef.current = true;
    const offer = await peerRef.current.createOffer();
    const sent = sendCallSignal(callSocketRef.current, "call_offer", session.id, {
      sdp: offer.sdp,
      sdp_type: offer.type,
    });
    if (!sent) {
      offerSentRef.current = false;
      throw new Error("Call signaling socket is not connected.");
    }
  }, []);

  const handleSignal = useCallback(
    async (message: CallSignalMessage) => {
      const session = sessionRef.current;
      if (!session) return;
      const callId = message.call_id ?? session.id;

      switch (message.type) {
        case "call_accepted": {
          setState((s) => ({ ...s, phase: "connecting" }));
          if (session.caller_id === currentUserId && !offerSentRef.current) {
            try {
              await createAndSendOffer(session);
            } catch (error) {
              setState((s) => ({ ...s, phase: "ended", error: String(error) }));
            }
          }
          break;
        }
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
            sdpMid: (payload.sdpMid ?? payload.sdp_mid) as string | undefined,
            sdpMLineIndex: (payload.sdpMLineIndex ?? payload.sdp_mline_index) as
              | number
              | undefined,
          });
          break;
        }
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
    [cleanup, createAndSendOffer, currentUserId]
  );

  const signalHandlerRef = useRef(handleSignal);
  useEffect(() => {
    signalHandlerRef.current = handleSignal;
  }, [handleSignal]);

  const connectCallSocketFor = useCallback(async (conversationId: string) => {
    const ticket = await api.getCallWsTicket(conversationId);
    callSocketRef.current?.close();
    callSocketRef.current = await connectCallSocket(conversationId, ticket, {
      onMessage: (message) => {
        void signalHandlerRef.current(message);
      },
    });
  }, []);

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
      offerSentRef.current = false;
      setState({ phase: "outgoing", session: null, remoteName, connectionState: "new", error: null });
      try {
        const session = toCallSession(await api.initiateCall(conversationId, callType));
        sessionRef.current = session;
        setState((s) => ({ ...s, session, phase: "outgoing" }));
        await connectCallSocketFor(conversationId);

        let iceServers = session.ice_servers ?? [];
        if (iceServers.length === 0) {
          const ice = await api.getIceServers();
          iceServers = ice.ice_servers.map((server) => ({
            urls: server.urls ?? "",
            username: server.username,
            credential: server.credential,
          }));
        }

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
        // Offer is created after callee accepts (call_accepted).
      } catch (error) {
        setState((s) => ({ ...s, phase: "ended", error: String(error) }));
      }
    },
    [connectCallSocketFor]
  );

  const acceptIncoming = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    setState((s) => ({ ...s, phase: "connecting" }));
    try {
      const updated = toCallSession(await api.acceptCall(session.id));
      sessionRef.current = updated;
      setState((s) => ({ ...s, session: updated }));
      await connectCallSocketFor(updated.conversation_id);

      let iceServers = updated.ice_servers ?? session.ice_servers ?? [];
      if (iceServers.length === 0) {
        const ice = await api.getIceServers();
        iceServers = ice.ice_servers.map((server) => ({
          urls: server.urls ?? "",
          username: server.username,
          credential: server.credential,
        }));
      }

      await peerRef.current.start(updated.call_type === "video", iceServers);
      peerRef.current.onIceCandidate = (candidate) => {
        sendCallSignal(callSocketRef.current, "ice_candidate", updated.id, {
          candidate: candidate.candidate,
          sdp_mid: candidate.sdpMid,
          sdp_mline_index: candidate.sdpMLineIndex,
        });
      };
      peerRef.current.onConnectionState = (cs) =>
        setState((s) => ({ ...s, connectionState: cs }));
      setState((s) => ({ ...s, phase: "connecting" }));
    } catch (error) {
      setState((s) => ({ ...s, phase: "ended", error: String(error) }));
    }
  }, [connectCallSocketFor]);

  const rejectIncoming = useCallback(async () => {
    if (sessionRef.current) await api.rejectCall(sessionRef.current.id);
    await cleanup();
    setState({ ...initialState, phase: "ended" });
  }, [cleanup]);

  const hangup = useCallback(async () => {
    const session = sessionRef.current;
    if (session) {
      if (phaseRef.current === "outgoing") await api.cancelCall(session.id);
      else await api.hangupCall(session.id);
    }
    await cleanup();
    setState({ ...initialState, phase: "ended" });
  }, [cleanup]);

  const handleIncomingPayload = useCallback(
    (payload: Record<string, unknown>) => {
      if (phaseRef.current !== "idle") return;
      const next: CallSession = {
        id: String(payload.call_id ?? ""),
        conversation_id: String(payload.conversation_id ?? ""),
        call_type: (payload.call_type as CallType) ?? "voice",
        status: "ringing",
        caller_id: Number(payload.caller_id ?? 0),
        callee_id: currentUserId ?? 0,
      };
      sessionRef.current = next;
      setState({
        phase: "incoming",
        session: next,
        remoteName: String(payload.caller_name ?? "Someone"),
        connectionState: "new",
        error: null,
      });
    },
    [currentUserId]
  );

  useEffect(() => {
    if (!currentUserId) {
      inboxSocketRef.current?.close();
      inboxSocketRef.current = null;
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const ticket = await api.getInboxWsTicket();
        if (cancelled) return;
        inboxSocketRef.current?.close();
        inboxSocketRef.current = connectInboxSocket(ticket, {
          onMessage: (message) => {
            if (message.type === "call_incoming") {
              handleIncomingPayload(message as unknown as Record<string, unknown>);
              return;
            }
            if (
              message.type === "call_accepted" ||
              message.type === "call_ended" ||
              message.type === "call_rejected" ||
              message.type === "call_cancelled" ||
              message.type === "call_missed" ||
              message.type === "call_busy"
            ) {
              void signalHandlerRef.current(message);
            }
          },
        });
      } catch {
        // Inbox ringing is best-effort; REST/FCM still apply.
      }
    })();

    return () => {
      cancelled = true;
      inboxSocketRef.current?.close();
      inboxSocketRef.current = null;
    };
  }, [currentUserId, handleIncomingPayload]);

  useEffect(() => {
    return () => {
      void cleanup();
      inboxSocketRef.current?.close();
      inboxSocketRef.current = null;
    };
  }, [cleanup]);

  return {
    state,
    peer: peerRef.current,
    startOutgoing,
    acceptIncoming,
    rejectIncoming,
    hangup,
    handleIncomingPayload,
    reset: () => setState(initialState),
  };
}
