import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ONBOARDED_COOKIE } from "@/lib/onboardingGate";

const PROTECTED_PREFIXES = [
  "/match",
  "/chat",
  "/discover",
  "/map",
  "/profile",
  "/settings",
  "/insights",
  "/wallet",
  "/verify",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("duo_access")?.value);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isOnboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "1";
  if (!isOnboarded) {
    const registerUrl = new URL("/register", request.url);
    return NextResponse.redirect(registerUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/match/:path*",
    "/chat/:path*",
    "/discover/:path*",
    "/map/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/insights/:path*",
    "/wallet/:path*",
    "/verify/:path*",
  ],
};
