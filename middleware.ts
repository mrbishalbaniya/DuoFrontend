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

// Login/register forms are for signed-out users. Signed-in users are sent on.
const AUTH_PAGES = ["/login", "/register"];

/** True when the access cookie holds a JWT that hasn't expired yet. */
function hasLiveSession(request: NextRequest): boolean {
  const token = request.cookies.get("duo_access")?.value;
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    if (!payload) return true; // Not a JWT: trust the cookie's presence.
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp !== "number" || json.exp * 1000 > Date.now();
  } catch {
    return true;
  }
}

/** Only allow same-site relative paths from ?next= to avoid open redirects. */
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (AUTH_PAGES.some((page) => value === page || value.startsWith(`${page}/`))) return null;
  return value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (AUTH_PAGES.includes(pathname)) {
    if (!hasLiveSession(request)) return NextResponse.next();
    const isOnboarded = request.cookies.get(ONBOARDED_COOKIE)?.value === "1";
    // Signed in but still onboarding: registration is where they finish.
    if (!isOnboarded) {
      return pathname === "/register"
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/register", request.url));
    }
    const next = safeNext(request.nextUrl.searchParams.get("next")) ?? "/match";
    return NextResponse.redirect(new URL(next, request.url));
  }
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
    "/login",
    "/register",
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
