import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  authCookieOptions,
  getBackendApiUrl,
  getChatServiceApiUrl,
} from "@/lib/backendUrl";

const ACCESS_MAX_AGE = 60 * 60;

// chat-service verifies the same JWT the monolith issues, so refreshing a
// token still goes through Django's /auth/refresh/ — there's no separate
// login/refresh flow for chat-service itself.
async function refreshAccessToken(refresh: string): Promise<string | null> {
  const res = await fetch(`${getBackendApiUrl()}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access: string };
  return data.access ?? null;
}

/**
 * Mirrors apiProxy.ts's proxyToBackend, targeting chat-service instead of
 * Django. `baseUrlOverride` lets the caller use the admin-configured
 * chat_service_public_url (see lib/chatConfig.ts) instead of the env default.
 */
export async function proxyToChatService(
  request: NextRequest,
  pathSegments: string[],
  baseUrlOverride?: string
): Promise<NextResponse> {
  const cookieStore = await cookies();
  let access = cookieStore.get(AUTH_COOKIE_ACCESS)?.value;
  const refresh = cookieStore.get(AUTH_COOKIE_REFRESH)?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!access && bearerToken) {
    access = bearerToken;
  }

  const path = pathSegments.filter((segment) => segment.length > 0).join("/");
  const base = (baseUrlOverride || getChatServiceApiUrl()).replace(/\/$/, "");
  const chatUrl = path ? `${base}/${path}/` : `${base}/`;
  const url = new URL(chatUrl);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (access) headers.set("authorization", `Bearer ${access}`);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let chatRes = await fetch(url.toString(), init);

  if (chatRes.status === 401 && refresh) {
    const newAccess = await refreshAccessToken(refresh);
    if (newAccess) {
      access = newAccess;
      headers.set("authorization", `Bearer ${newAccess}`);
      chatRes = await fetch(url.toString(), { ...init, headers });
    }
  }

  const responseBody = await chatRes.arrayBuffer();
  const response = new NextResponse(responseBody, {
    status: chatRes.status,
    headers: {
      "content-type": chatRes.headers.get("content-type") ?? "application/json",
    },
  });

  if (access && chatRes.ok && chatRes.status !== 401) {
    response.cookies.set(AUTH_COOKIE_ACCESS, access, authCookieOptions(ACCESS_MAX_AGE));
  }

  if (chatRes.status === 401) {
    response.cookies.delete(AUTH_COOKIE_ACCESS);
    response.cookies.delete(AUTH_COOKIE_REFRESH);
  }

  return response;
}
