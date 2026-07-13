import { getBackendOrigin } from "@/lib/backendUrl";

function getWebSocketOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return getBackendOrigin();
}
import type { CallSignalMessage } from "./types";

export function getCallWebSocketUrl(conversationId: string, ticket: string): string {
  const url = new URL(`/ws/call/${conversationId}/`, getWebSocketOrigin());
  url.protocol = url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

export function getInboxWebSocketUrl(ticket: string): string {
  const url = new URL("/ws/inbox/", getWebSocketOrigin());
  url.protocol = url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

export type CallSocketHandlers = {
  onMessage: (message: CallSignalMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export function connectCallSocket(
  conversationId: string,
  ticket: string,
  handlers: CallSocketHandlers
): WebSocket {
  const socket = new WebSocket(getCallWebSocketUrl(conversationId, ticket));
  socket.onopen = () => handlers.onOpen?.();
  socket.onclose = () => handlers.onClose?.();
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(String(event.data)) as CallSignalMessage;
      if (data.type === "call_signal") {
        handlers.onMessage({ ...data, type: data.event ?? "call_signal" });
      } else {
        handlers.onMessage(data);
      }
    } catch {
      // ignore malformed payloads
    }
  };
  return socket;
}

export function sendCallSignal(
  socket: WebSocket | null,
  type: string,
  callId: string,
  extra: Record<string, unknown> = {}
) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type, call_id: callId, ...extra }));
}
