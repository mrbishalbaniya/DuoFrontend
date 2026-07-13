import { getBackendOrigin } from "@/lib/backendUrl";
import type { CallSignalMessage } from "./types";

function getWebSocketOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return getBackendOrigin();
}

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

/** Connect and wait until the socket is OPEN (or fail). */
export function connectCallSocket(
  conversationId: string,
  ticket: string,
  handlers: CallSocketHandlers
): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(getCallWebSocketUrl(conversationId, ticket));
    let settled = false;

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.close();
      reject(new Error("Call WebSocket connection timed out."));
    }, 12000);

    socket.onopen = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      handlers.onOpen?.();
      resolve(socket);
    };
    socket.onclose = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        reject(new Error("Call WebSocket closed before open."));
      }
      handlers.onClose?.();
    };
    socket.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(new Error("Call WebSocket connection failed."));
    };
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
  });
}

export function connectInboxSocket(ticket: string, handlers: CallSocketHandlers): WebSocket {
  const socket = new WebSocket(getInboxWebSocketUrl(ticket));
  socket.onopen = () => handlers.onOpen?.();
  socket.onclose = () => handlers.onClose?.();
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(String(event.data)) as CallSignalMessage;
      handlers.onMessage(data);
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
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify({ type, call_id: callId, ...extra }));
  return true;
}
