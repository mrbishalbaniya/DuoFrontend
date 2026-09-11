import { getBackendOrigin, getChatServiceOrigin } from "@/lib/backendUrl";
import { getChatBackendConfig, type ChatBackendConfig } from "@/lib/chatConfig";

function getWebSocketOrigin(config: ChatBackendConfig): string {
  if (config.backend === "django") {
    return getBackendOrigin();
  }
  const configured = process.env.NEXT_PUBLIC_CHAT_WS_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (config.service_url) return config.service_url.replace(/\/api\/?$/, "");
  return getChatServiceOrigin();
}

// Whichever backend issued `ticket` (via api.getWsTicket(), itself routed
// through the same live config — see app/api/chat-backend) must be the one
// the socket connects to, so this reads the same config rather than
// assuming chat-service.
export async function getChatWebSocketUrl(
  conversationId: number | string,
  ticket: string
): Promise<string> {
  const config = await getChatBackendConfig();
  const url = new URL(`/ws/chat/${conversationId}/`, getWebSocketOrigin(config));
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
