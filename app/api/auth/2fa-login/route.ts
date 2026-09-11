import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backendUrl";
import { setAuthCookies } from "@/lib/server/apiProxy";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendRes = await fetch(`${getBackendApiUrl()}/security/2fa/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json().catch(() => ({}));
  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json(data);
  await setAuthCookies(response, data.access, data.refresh);
  return response;
}
