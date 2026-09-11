import { getBackendApiUrl, getClientApiBase } from "@/lib/backendUrl";

export type ChatBackendConfig = {
  backend: "django" | "microservice";
  service_url: string;
};

const DEFAULT_CONFIG: ChatBackendConfig = { backend: "django", service_url: "" };
const TTL_MS = 30_000;

let cached: { value: ChatBackendConfig; expiresAt: number } | null = null;

async function fetchConfig(): Promise<ChatBackendConfig> {
  // Server-side (the chat-backend proxy route): hit Django directly, since
  // going through our own proxy here would be self-referential.
  // Client-side (browser, e.g. before opening the chat websocket): go
  // through the same-origin proxy like every other backend call.
  const base = typeof window === "undefined" ? getBackendApiUrl() : getClientApiBase();

  const res = await fetch(`${base}/chat/config/`, { cache: "no-store" });
  if (!res.ok) return DEFAULT_CONFIG;

  const data = (await res.json()) as Partial<ChatBackendConfig>;
  if (data.backend !== "microservice" && data.backend !== "django") return DEFAULT_CONFIG;
  return { backend: data.backend, service_url: data.service_url ?? "" };
}

/**
 * Which backend serves chat right now — set from Django admin
 * (site_config.SiteSettings.chat_backend), see DuoBackend/chat/views.py's
 * ChatConfigView. Cached briefly so every chat API call/reconnect doesn't
 * re-fetch it.
 */
export async function getChatBackendConfig(): Promise<ChatBackendConfig> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  try {
    const value = await fetchConfig();
    cached = { value, expiresAt: now + TTL_MS };
    return value;
  } catch {
    return cached?.value ?? DEFAULT_CONFIG;
  }
}

export function clearChatBackendConfigCache(): void {
  cached = null;
}
