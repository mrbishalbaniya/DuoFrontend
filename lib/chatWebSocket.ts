import { getBackendOrigin } from "@/lib/backendUrl";

function getWebSocketOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return getBackendOrigin();
}

export function getChatWebSocketUrl(
  conversationId: number | string,
  ticket: string
): string {
  const url = new URL(`/ws/chat/${conversationId}/`, getWebSocketOrigin());
  url.protocol = url.protocol === "https:" || url.protocol === "wss:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

export function closeChatSocket(socket: WebSocket | null, reason = "cleanup") {
  if (!socket) return;

  if (socket.readyState === WebSocket.CONNECTING) {
    socket.addEventListener(
      "open",
      () => {
        socket.close(1000, reason);
      },
      { once: true }
    );
    return;
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.close(1000, reason);
  }
}
