function getWebSocketOrigin(): string {
  if (typeof window === "undefined") return "ws://localhost:8000";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname + ":8000";
  return `${proto}//${host}`;
}

export function getActivityWebSocketUrl(): string {
  return `${getWebSocketOrigin()}/ws/activity/`;
}

export function closeActivitySocket(socket: WebSocket | null) {
  if (!socket) return;
  if (socket.readyState === WebSocket.CONNECTING) {
    socket.onopen = () => socket.close();
    return;
  }
  if (socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
}
