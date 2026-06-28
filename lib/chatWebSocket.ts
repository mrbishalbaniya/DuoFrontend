const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:8001";

export function getChatWebSocketUrl(
  conversationId: number | string,
  token?: string | null
): string {
  const url = new URL(`/ws/chat/${conversationId}/`, API_ORIGIN);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  if (token) {
    url.searchParams.set("token", token);
  }
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
