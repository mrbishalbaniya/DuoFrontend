import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_REFRESH, getBackendApiUrl } from "@/lib/backendUrl";
import { setAuthCookies } from "@/lib/server/apiProxy";

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const refresh = cookieStore.get(AUTH_COOKIE_REFRESH)?.value;
  if (!refresh) {
    return NextResponse.json({ detail: "No refresh token." }, { status: 401 });
  }

  const backendRes = await fetch(`${getBackendApiUrl()}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await backendRes.json().catch(() => ({}));
  if (!backendRes.ok) {
    const response = NextResponse.json(data, { status: backendRes.status });
    response.cookies.delete("duo_access");
    response.cookies.delete("duo_refresh");
    return response;
  }

  const response = NextResponse.json(data);
  const nextRefresh = typeof data.refresh === "string" ? data.refresh : refresh;
  await setAuthCookies(response, data.access, nextRefresh);
  return response;
}
