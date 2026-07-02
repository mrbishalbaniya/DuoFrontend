"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { closeChatSocket, getChatWebSocketUrl } from "@/lib/chatWebSocket";

export type ChatWsPayload = Record<string, unknown>;

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15000;

export function useChatWebSocket(
  conversationId: number | null,
  userId: number | undefined,
  onMessage: (data: ChatWsPayload) => void
) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!conversationId || !userId) {
      setConnected(false);
      return;
    }

    let cancelled = false;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(
        RECONNECT_MAX_MS,
        RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current
      );
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (cancelled) return;
      clearReconnectTimer();

      try {
        const ticket = await api.getWsTicket(conversationId);
        if (cancelled) return;

        closeChatSocket(socketRef.current, "reconnect");
        const socket = new WebSocket(getChatWebSocketUrl(conversationId, ticket));
        socketRef.current = socket;

        socket.onopen = () => {
          if (cancelled) {
            closeChatSocket(socket, "unmounted");
            return;
          }
          reconnectAttemptRef.current = 0;
          setConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(String(event.data)) as ChatWsPayload;
            onMessageRef.current(data);
          } catch {
            /* ignore malformed payloads */
          }
        };

        socket.onclose = () => {
          if (socketRef.current === socket) {
            socketRef.current = null;
          }
          setConnected(false);
          if (!cancelled) scheduleReconnect();
        };

        socket.onerror = () => {
          setConnected(false);
        };
      } catch (error) {
        console.error("WebSocket connection failed:", error);
        setConnected(false);
        if (!cancelled) scheduleReconnect();
      }
    };

    reconnectAttemptRef.current = 0;
    void connect();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      closeChatSocket(socketRef.current, "conversation changed");
      socketRef.current = null;
      setConnected(false);
    };
  }, [conversationId, userId]);

  const send = useCallback((payload: ChatWsPayload) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(payload));
    return true;
  }, []);

  return { connected, send };
}
