const DEV_BACKEND = "http://localhost:8000/api";

export function getBackendApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_URL is required in production.");
  }
  return DEV_BACKEND;
}

export function getBackendOrigin(): string {
  return getBackendApiUrl().replace(/\/api\/?$/, "");
}

/** Client-side API base — proxied through Next.js to keep auth cookies first-party. */
export function getClientApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api/backend";
  }
  return getBackendApiUrl();
}

// chat-service (DuoBackend/chat-service, or the standalone d:\8sem\chat-service
// checkout) — standalone Go microservice that owns chat on this branch.
const DEV_CHAT_BACKEND = "http://localhost:8090/api";

export function getChatServiceApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CHAT_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_CHAT_API_URL is required in production.");
  }
  return DEV_CHAT_BACKEND;
}

/** Origin only (no /api suffix) — used to build ws:// URLs against chat-service. */
export function getChatServiceOrigin(): string {
  return getChatServiceApiUrl().replace(/\/api\/?$/, "");
}

/** Client-side chat API base — proxied through Next.js to keep auth cookies first-party. */
export function getClientChatApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api/chat-backend";
  }
  return getChatServiceApiUrl();
}

export const AUTH_COOKIE_ACCESS = "duo_access";
export const AUTH_COOKIE_REFRESH = "duo_refresh";

export function authCookieOptions(maxAge: number) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
