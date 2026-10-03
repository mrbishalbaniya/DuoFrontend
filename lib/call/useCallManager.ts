"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  connectCallSocket,
  connectInboxSocket,
  sendCallSignal,
} from "@/lib/call/callWebSocket";
import { startTone } from "@/lib/call/ringtone";
import type {
  CallPhase,
  CallSession,
  CallSignalMessage,
  CallType,
  IceServer,
} from "@/lib/call/types";
import { getCallMedia, WebRtcPeer } from "@/lib/call/webrtc";

type CallApiPayload = {
  id: string;
  conversation_id: string;
  call_type: string;
  status: string;
  caller_id: number;
  callee_id: number;
  ice_servers?: Array<Record<string, string>>;
};

const RING_TIMEOUT_MS = 45_000;
const CONNECT_TIMEOUT_MS = 30_000;
const DISCONNECT_GRACE_MS = 10_000;
const ENDED_SCREEN_MS = 2200;

const TERMINAL_EVENTS = new Set([
  "call_ended",
  "call_rejected",
  "call_cancelled",
  "call_missed",
  "call_busy",
]);

function mapIceServers(raw?: Array<Record<string, string>>): IceServer[] {
  return (raw ?? [])
    .filter((server) => server.urls)
    .map((server) => ({
      urls: server.urls,
      username: server.username,
      credential: server.credential,
    }));
}

function toCallSession(raw: CallApiPayload): CallSession {
  return {
    id: raw.id,
    conversation_id: raw.conversation_id,
    call_type: raw.call_type === "video" ? "video" : "voice",
    status: raw.status,
    caller_id: raw.caller_id,
    callee_id: raw.callee_id,
    ice_servers: mapIceServers(raw.ice_servers),
  };
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export type CallState = {
  phase: CallPhase;
  session: CallSession | null;
  remoteName: string;
  remotePhoto: string;
  connectionState: string;
  /** Text shown on the ended screen, or a failure reason. */
  endMessage: string | null;
  micOn: boolean;
  videoOn: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectedAt: number | null;
  /** True while this is (or was) an unanswered incoming ring. */
  wasIncoming: boolean;
  /** Incoming card hidden by the user; the call keeps ringing silently. */
  dismissed: boolean;
};

const initialState: CallState = {
  phase: "idle",
  session: null,
  remoteName: "",
  remotePhoto: "",
  connectionState: "new",
  endMessage: null,
  micOn: true,
  videoOn: true,
  localStream: null,
  remoteStream: null,
  connectedAt: null,
  wasIncoming: false,
  dismissed: false,
};

const END_MESSAGES: Record<string, string> = {
  call_ended: "Call ended",
  call_rejected: "Call declined",
  call_cancelled: "Call cancelled",
  call_missed: "No answer",
  call_busy: "User is busy",
};

export function useCallManager(currentUserId?: number) {
  const [state, setState] = useState<CallState>(initialState);
  const peerRef = useRef(new WebRtcPeer());
  const callSocketRef = useRef<WebSocket | null>(null);
  const inboxSocketRef = useRef<WebSocket | null>(null);
  const sessionRef = useRef<CallSession | null>(null);
  const phaseRef = useRef<CallPhase>("idle");
  const acceptedRef = useRef(false);
  const offerSentRef = useRef(false);
  const pendingOfferRef = useRef<{ sdp: string; type: RTCSdpType } | null>(null);
  const seenSignalsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);
  const disconnectTimerRef = useRef<number | null>(null);
  const stopToneRef = useRef<(() => void) | null>(null);
  const endingRef = useRef(false);

  const setPhase = useCallback((phase: CallPhase, extra: Partial<CallState> = {}) => {
    phaseRef.current = phase;
    setState((s) => ({ ...s, ...extra, phase }));
  }, []);

  const stopTone = useCallback(() => {
    stopToneRef.current?.();
    stopToneRef.current = null;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
    disconnectTimerRef.current = null;
  }, []);

  const cleanupMedia = useCallback(() => {
    stopTone();
    clearTimers();
    const socket = callSocketRef.current;
    callSocketRef.current = null;
    if (socket) {
      socket.onclose = null;
      socket.close();
    }
    acceptedRef.current = false;
    offerSentRef.current = false;
    pendingOfferRef.current = null;
    seenSignalsRef.current = new Set();
    peerRef.current.close();
  }, [clearTimers, stopTone]);

  /** Tear everything down, show a short ended screen, then go idle. */
  const finish = useCallback(
    (message: string | null) => {
      if (endingRef.current) return;
      endingRef.current = true;
      cleanupMedia();
      sessionRef.current = null;
      phaseRef.current = "ended";
      setState((s) => ({
        ...initialState,
        phase: "ended",
        remoteName: s.remoteName,
        remotePhoto: s.remotePhoto,
        endMessage: message,
        session: s.session,
        wasIncoming: s.wasIncoming,
        dismissed: s.dismissed,
      }));
      window.setTimeout(() => {
        endingRef.current = false;
        if (phaseRef.current === "ended") {
          phaseRef.current = "idle";
          setState(initialState);
        }
      }, ENDED_SCREEN_MS);
    },
    [cleanupMedia]
  );

  /** Tell the server we're leaving, choosing cancel/reject/hangup by phase. */
  const notifyServerEnd = useCallback(async (session: CallSession | null, phase: CallPhase) => {
    if (!session) return;
    try {
      if (phase === "incoming") await api.rejectCall(session.id);
      else if (phase === "outgoing" && !acceptedRef.current) await api.cancelCall(session.id);
      else await api.hangupCall(session.id);
    } catch {
      // The server may already consider the call over.
    }
  }, []);

  const endLocally = useCallback(
    async (message: string | null) => {
      const session = sessionRef.current;
      const phase = phaseRef.current;
      finish(message);
      await notifyServerEnd(session, phase);
    },
    [finish, notifyServerEnd]
  );

  const addTimer = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const wirePeer = useCallback(
    (session: CallSession) => {
      const peer = peerRef.current;
      peer.onIceCandidate = (candidate) => {
        sendCallSignal(callSocketRef.current, "ice_candidate", session.id, {
          candidate: candidate.candidate,
          sdp_mid: candidate.sdpMid,
          sdp_mline_index: candidate.sdpMLineIndex,
        });
      };
      peer.onRemoteStream = (stream) => setState((s) => ({ ...s, remoteStream: stream }));
      peer.onConnectionState = (cs) => {
        setState((s) => ({ ...s, connectionState: cs }));
        if (cs === "connected") {
          if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
          clearTimers();
          stopTone();
          if (phaseRef.current !== "active") {
            setPhase("active", { connectedAt: Date.now() });
          }
        } else if (cs === "disconnected") {
          if (!disconnectTimerRef.current) {
            disconnectTimerRef.current = window.setTimeout(() => {
              void endLocally("Connection lost");
            }, DISCONNECT_GRACE_MS);
          }
        } else if (cs === "failed") {
          void endLocally("Connection failed");
        }
      };
    },
    [clearTimers, endLocally, setPhase, stopTone]
  );

  const trySendOffer = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || session.caller_id !== currentUserId) return;
    if (!acceptedRef.current || offerSentRef.current) return;
    const socket = callSocketRef.current;
    if (!peerRef.current.isStarted || !socket || socket.readyState !== WebSocket.OPEN) return;
    offerSentRef.current = true;
    try {
      const offer = await peerRef.current.createOffer();
      sendCallSignal(socket, "call_offer", session.id, { sdp: offer.sdp, sdp_type: offer.type });
    } catch (error) {
      offerSentRef.current = false;
      void endLocally(errorMessage(error, "Could not start the call"));
    }
  }, [currentUserId, endLocally]);

  const answerOffer = useCallback(
    async (sdp: string, type: RTCSdpType) => {
      const session = sessionRef.current;
      if (!session) return;
      if (!peerRef.current.isStarted) {
        pendingOfferRef.current = { sdp, type };
        return;
      }
      try {
        const answer = await peerRef.current.applyOffer(sdp, type);
        sendCallSignal(callSocketRef.current, "call_answer", session.id, {
          sdp: answer.sdp,
          sdp_type: answer.type,
        });
      } catch (error) {
        void endLocally(errorMessage(error, "Could not connect the call"));
      }
    },
    [endLocally]
  );

  const handleSignal = useCallback(
    async (message: CallSignalMessage) => {
      const session = sessionRef.current;
      if (!session) return;
      if (message.call_id && message.call_id !== session.id) return;

      // The server relays each signal via both the call room and the inbox.
      const payload = (message.payload ?? message) as Record<string, unknown>;
      const key = `${message.type}|${String(payload.sdp ?? payload.candidate ?? "")}`;
      if (message.type !== "call_accepted" && !TERMINAL_EVENTS.has(message.type)) {
        if (seenSignalsRef.current.has(key)) return;
        seenSignalsRef.current.add(key);
      }

      switch (message.type) {
        case "call_accepted": {
          if (session.caller_id !== currentUserId) break;
          if (acceptedRef.current) break;
          acceptedRef.current = true;
          stopTone();
          clearTimers();
          addTimer(() => {
            if (phaseRef.current !== "active") void endLocally("Could not connect the call");
          }, CONNECT_TIMEOUT_MS);
          if (phaseRef.current === "outgoing") setPhase("connecting");
          await trySendOffer();
          break;
        }
        case "call_offer": {
          const sdp = String(payload.sdp ?? "");
          if (sdp) await answerOffer(sdp, (payload.type as RTCSdpType) || "offer");
          break;
        }
        case "call_answer": {
          const sdp = String(payload.sdp ?? "");
          if (!sdp) break;
          try {
            await peerRef.current.applyAnswer(sdp, (payload.type as RTCSdpType) || "answer");
          } catch (error) {
            void endLocally(errorMessage(error, "Could not connect the call"));
          }
          break;
        }
        case "ice_candidate": {
          await peerRef.current.addIceCandidate({
            candidate: String(payload.candidate ?? ""),
            sdpMid: (payload.sdpMid ?? payload.sdp_mid ?? null) as string | null,
            sdpMLineIndex: (payload.sdpMLineIndex ?? payload.sdp_mline_index ?? null) as
              | number
              | null,
          });
          break;
        }
        default:
          if (TERMINAL_EVENTS.has(message.type)) {
            finish(END_MESSAGES[message.type] ?? "Call ended");
          }
          break;
      }
    },
    [addTimer, answerOffer, clearTimers, currentUserId, endLocally, finish, setPhase, stopTone, trySendOffer]
  );

  const signalHandlerRef = useRef(handleSignal);
  useEffect(() => {
    signalHandlerRef.current = handleSignal;
  }, [handleSignal]);

  const connectCallSocketFor = useCallback(async (conversationId: string) => {
    const ticket = await api.getCallWsTicket(conversationId);
    callSocketRef.current?.close();
    const socket = await connectCallSocket(conversationId, ticket, {
      onMessage: (message) => {
        void signalHandlerRef.current(message);
      },
    });
    socket.onclose = () => {
      if (callSocketRef.current === socket && phaseRef.current !== "active") {
        void endLocally("Call connection was lost");
      }
    };
    callSocketRef.current = socket;
  }, [endLocally]);

  const resolveIceServers = useCallback(async (session: CallSession) => {
    if (session.ice_servers && session.ice_servers.length) return session.ice_servers;
    try {
      const ice = await api.getIceServers();
      return mapIceServers(ice.ice_servers);
    } catch {
      return [];
    }
  }, []);

  const startOutgoing = useCallback(
    async ({
      conversationId,
      callType,
      remoteName,
      remotePhoto = "",
    }: {
      conversationId: string;
      callType: CallType;
      remoteName: string;
      remotePhoto?: string;
    }) => {
      if (phaseRef.current !== "idle" && phaseRef.current !== "ended") return;
      cleanupMedia();
      endingRef.current = false;
      sessionRef.current = null;
      phaseRef.current = "outgoing";
      setState({
        ...initialState,
        phase: "outgoing",
        remoteName,
        remotePhoto,
        session: {
          id: "",
          conversation_id: conversationId,
          call_type: callType,
          status: "initiating",
          caller_id: currentUserId ?? 0,
          callee_id: 0,
        },
      });

      let stream: MediaStream;
      try {
        stream = await getCallMedia(callType === "video");
      } catch (error) {
        finish(errorMessage(error, "Could not access the microphone"));
        return;
      }
      if (phaseRef.current !== "outgoing") {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      setState((s) => ({
        ...s,
        localStream: stream,
        videoOn: stream.getVideoTracks().length > 0,
      }));

      try {
        const session = toCallSession(await api.initiateCall(conversationId, callType));
        if (phaseRef.current !== "outgoing") {
          stream.getTracks().forEach((t) => t.stop());
          await api.cancelCall(session.id).catch(() => {});
          return;
        }
        sessionRef.current = session;
        setState((s) => ({ ...s, session }));
        stopToneRef.current = startTone("outgoing");

        peerRef.current.start(stream, await resolveIceServers(session));
        wirePeer(session);
        await connectCallSocketFor(session.conversation_id || conversationId);
        addTimer(() => {
          if (!acceptedRef.current && phaseRef.current === "outgoing") void endLocally("No answer");
        }, RING_TIMEOUT_MS);
        await trySendOffer();
      } catch (error) {
        stream.getTracks().forEach((t) => t.stop());
        const session = sessionRef.current;
        finish(errorMessage(error, "Could not start the call"));
        if (session) await api.cancelCall(session.id).catch(() => {});
      }
    },
    [addTimer, cleanupMedia, connectCallSocketFor, currentUserId, endLocally, finish, resolveIceServers, trySendOffer, wirePeer]
  );

  const acceptIncoming = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || phaseRef.current !== "incoming") return;
    stopTone();
    setPhase("connecting", { wasIncoming: false, dismissed: false });

    let stream: MediaStream;
    try {
      stream = await getCallMedia(session.call_type === "video");
    } catch (error) {
      finish(errorMessage(error, "Could not access the microphone"));
      await api.rejectCall(session.id).catch(() => {});
      return;
    }
    setState((s) => ({
      ...s,
      localStream: stream,
      videoOn: stream.getVideoTracks().length > 0,
    }));

    try {
      // Be ready for the caller's offer before telling the server we accepted.
      peerRef.current.start(stream, await resolveIceServers(session));
      wirePeer(session);
      await connectCallSocketFor(session.conversation_id);

      const updated = toCallSession(await api.acceptCall(session.id));
      sessionRef.current = { ...session, ...updated, ice_servers: session.ice_servers };
      setState((s) => ({ ...s, session: sessionRef.current }));
      addTimer(() => {
        if (phaseRef.current !== "active") void endLocally("Could not connect the call");
      }, CONNECT_TIMEOUT_MS);

      const pending = pendingOfferRef.current;
      pendingOfferRef.current = null;
      if (pending) await answerOffer(pending.sdp, pending.type);
    } catch (error) {
      finish(errorMessage(error, "Could not join the call"));
      await api.rejectCall(session.id).catch(() => {});
    }
  }, [addTimer, answerOffer, connectCallSocketFor, endLocally, finish, resolveIceServers, setPhase, stopTone, wirePeer]);

  const rejectIncoming = useCallback(async () => {
    await endLocally("Call declined");
  }, [endLocally]);

  const dismissIncoming = useCallback(() => {
    if (phaseRef.current !== "incoming") return;
    stopTone();
    setState((s) => ({ ...s, dismissed: true }));
  }, [stopTone]);

  const hangup = useCallback(async () => {
    await endLocally("Call ended");
  }, [endLocally]);

  const toggleMic = useCallback(() => {
    setState((s) => {
      const next = !s.micOn;
      peerRef.current.setMicrophoneEnabled(next);
      return { ...s, micOn: next };
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setState((s) => {
      const next = !s.videoOn;
      peerRef.current.setVideoEnabled(next);
      return { ...s, videoOn: next };
    });
  }, []);

  const switchCamera = useCallback(async () => {
    try {
      if (await peerRef.current.switchCamera()) {
        const local = peerRef.current.getLocalStream();
        setState((s) => ({ ...s, localStream: local ? new MediaStream(local.getTracks()) : null }));
      }
    } catch {
      // Keep the current camera.
    }
  }, []);

  const handleIncomingPayload = useCallback(
    (payload: Record<string, unknown>) => {
      const callId = String(payload.call_id ?? "");
      if (!callId) return;
      if (Number(payload.caller_id) === currentUserId) return;
      if (sessionRef.current?.id === callId) return;
      if (phaseRef.current !== "idle" && phaseRef.current !== "ended") {
        void api.markCallBusy(callId).catch(() => {});
        return;
      }
      cleanupMedia();
      endingRef.current = false;
      const next: CallSession = {
        id: callId,
        conversation_id: String(payload.conversation_id ?? ""),
        call_type: payload.call_type === "video" ? "video" : "voice",
        status: "ringing",
        caller_id: Number(payload.caller_id ?? 0),
        callee_id: currentUserId ?? 0,
      };
      sessionRef.current = next;
      phaseRef.current = "incoming";
      setState({
        ...initialState,
        phase: "incoming",
        session: next,
        remoteName: String(payload.caller_name ?? "Someone"),
        remotePhoto: String(payload.caller_photo ?? ""),
        wasIncoming: true,
      });
      stopToneRef.current = startTone("incoming");
      addTimer(() => {
        if (phaseRef.current === "incoming") finish("Missed call");
      }, RING_TIMEOUT_MS);
    },
    [addTimer, cleanupMedia, currentUserId, finish]
  );

  // Inbox socket: incoming rings and lifecycle events, with auto-reconnect.
  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;
    let retry = 0;
    let retryTimer: number | null = null;

    const open = async () => {
      try {
        const ticket = await api.getInboxWsTicket();
        if (cancelled) return;
        const socket = connectInboxSocket(ticket, {
          onOpen: () => {
            retry = 0;
          },
          onClose: () => {
            if (cancelled || inboxSocketRef.current !== socket) return;
            inboxSocketRef.current = null;
            schedule();
          },
          onMessage: (message) => {
            if (message.type === "call_incoming") {
              handleIncomingPayload(message as unknown as Record<string, unknown>);
            } else if (message.type === "call_accepted" || TERMINAL_EVENTS.has(message.type)) {
              void signalHandlerRef.current(message);
            }
          },
        });
        inboxSocketRef.current = socket;
      } catch {
        schedule();
      }
    };

    const schedule = () => {
      if (cancelled) return;
      const delay = Math.min(30_000, 1000 * 2 ** retry++);
      retryTimer = window.setTimeout(() => void open(), delay);
    };

    void open();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      const socket = inboxSocketRef.current;
      inboxSocketRef.current = null;
      socket?.close();
    };
  }, [currentUserId, handleIncomingPayload]);

  // Leaving the page ends the call on the server so nobody stays "busy".
  useEffect(() => {
    const onUnload = () => {
      const session = sessionRef.current;
      if (!session?.id) return;
      const phase = phaseRef.current;
      const action =
        phase === "incoming"
          ? "reject"
          : phase === "outgoing" && !acceptedRef.current
            ? "cancel"
            : "hangup";
      api.endCallOnUnload(session.id, action);
    };
    window.addEventListener("pagehide", onUnload);
    return () => window.removeEventListener("pagehide", onUnload);
  }, []);

  useEffect(() => {
    const peer = peerRef.current;
    return () => {
      stopToneRef.current?.();
      timersRef.current.forEach((t) => window.clearTimeout(t));
      callSocketRef.current?.close();
      peer.close();
    };
  }, []);

  return {
    state,
    peer: peerRef.current,
    startOutgoing,
    acceptIncoming,
    rejectIncoming,
    hangup,
    dismissIncoming,
    toggleMic,
    toggleVideo,
    switchCamera,
    handleIncomingPayload,
  };
}
