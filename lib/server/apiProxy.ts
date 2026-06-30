import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  authCookieOptions,
  getBackendApiUrl,
} from "@/lib/backendUrl";

const ACCESS_MAX_AGE = 60 * 60;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

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

export async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const cookieStore = await cookies();
  let access = cookieStore.get(AUTH_COOKIE_ACCESS)?.value;
  const refresh = cookieStore.get(AUTH_COOKIE_REFRESH)?.value;
  const path = pathSegments.filter((segment) => segment.length > 0).join("/");
  const base = getBackendApiUrl().replace(/\/$/, "");
  // Django APPEND_SLASH: POST without trailing slash → 301 → fetch retries as GET → 405.
  const backendUrl = path ? `${base}/${path}/` : `${base}/`;
  const url = new URL(backendUrl);

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

  let backendRes = await fetch(url.toString(), init);

  if (backendRes.status === 401 && refresh) {
    const newAccess = await refreshAccessToken(refresh);
    if (newAccess) {
      access = newAccess;
      headers.set("authorization", `Bearer ${newAccess}`);
      backendRes = await fetch(url.toString(), { ...init, headers });
    }
  }

  const responseBody = await backendRes.arrayBuffer();
  const response = new NextResponse(responseBody, {
    status: backendRes.status,
    headers: {
      "content-type": backendRes.headers.get("content-type") ?? "application/json",
    },
  });

  if (access && backendRes.ok && backendRes.status !== 401) {
    response.cookies.set(AUTH_COOKIE_ACCESS, access, authCookieOptions(ACCESS_MAX_AGE));
  }

  if (backendRes.status === 401) {
    response.cookies.delete(AUTH_COOKIE_ACCESS);
    response.cookies.delete(AUTH_COOKIE_REFRESH);
  }

  return response;
}

export async function setAuthCookies(
  response: NextResponse,
  access: string,
  refresh: string
): Promise<NextResponse> {
  response.cookies.set(AUTH_COOKIE_ACCESS, access, authCookieOptions(ACCESS_MAX_AGE));
  response.cookies.set(AUTH_COOKIE_REFRESH, refresh, authCookieOptions(REFRESH_MAX_AGE));
  return response;
}

export async function clearAuthCookies(response: NextResponse): Promise<NextResponse> {
  response.cookies.delete(AUTH_COOKIE_ACCESS);
  response.cookies.delete(AUTH_COOKIE_REFRESH);
  return response;
}

export { ACCESS_MAX_AGE, REFRESH_MAX_AGE };
