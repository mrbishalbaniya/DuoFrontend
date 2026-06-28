import { getBackendOrigin } from "@/lib/backendUrl";

export function getChatWebSocketUrl(
  conversationId: number | string,
  ticket: string
): string {
  const url = new URL(`/ws/chat/${conversationId}/`, getBackendOrigin());
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
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
