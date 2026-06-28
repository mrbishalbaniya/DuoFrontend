import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

function getRedirectUri(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ||
    `${request.nextUrl.origin}/api/auth/google/callback`
  );
}

async function completeGoogleAuth(
  request: NextRequest,
  payload: Record<string, string>
) {
  const backendRes = await fetch(`${API_BASE}/auth/google/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!backendRes.ok) {
    return NextResponse.redirect(new URL("/login?error=google_auth", request.url));
  }

  const data = (await backendRes.json()) as {
    access: string;
    refresh: string;
    user?: { profile?: { is_onboarded?: boolean } };
  };

  const response = NextResponse.redirect(new URL("/login/google/complete", request.url));
  const cookieOptions = {
    maxAge: 120,
    path: "/",
    sameSite: "lax" as const,
    httpOnly: false,
  };

  response.cookies.set("duo_oauth_access", data.access, cookieOptions);
  response.cookies.set("duo_oauth_refresh", data.refresh, cookieOptions);
  response.cookies.set(
    "duo_oauth_onboarded",
    data.user?.profile?.is_onboarded ? "1" : "0",
    cookieOptions
  );

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const error = request.nextUrl.searchParams.get("error");
    const code = request.nextUrl.searchParams.get("code");

    if (error || !code) {
      return NextResponse.redirect(new URL("/login?error=google_auth", request.url));
    }

    return completeGoogleAuth(request, {
      code,
      redirect_uri: getRedirectUri(request),
    });
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_auth", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const credential = formData.get("credential");

    if (!credential || typeof credential !== "string") {
      return NextResponse.redirect(new URL("/login?error=google_auth", request.url));
    }

    return completeGoogleAuth(request, { id_token: credential });
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_auth", request.url));
  }
}
