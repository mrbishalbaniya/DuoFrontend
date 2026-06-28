import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backendUrl";
import { setAuthCookies } from "@/lib/server/apiProxy";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { handoff?: string };
  if (!body.handoff) {
    return NextResponse.json({ detail: "Missing handoff code." }, { status: 400 });
  }

  const backendRes = await fetch(`${getBackendApiUrl()}/auth/handoff/exchange/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handoff: body.handoff }),
  });

  const data = (await backendRes.json()) as {
    access?: string;
    refresh?: string;
    onboarded?: boolean;
    detail?: string;
  };

  if (!backendRes.ok || !data.access || !data.refresh) {
    return NextResponse.json(
      { detail: data.detail ?? "Handoff exchange failed." },
      { status: backendRes.status || 502 }
    );
  }

  const response = NextResponse.json({ onboarded: data.onboarded });
  await setAuthCookies(response, data.access, data.refresh);
  return response;
}
