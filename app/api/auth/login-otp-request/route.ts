import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backendUrl";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { email: string };

  const backendRes = await fetch(`${getBackendApiUrl()}/auth/login/otp/request/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendRes.status });
}
