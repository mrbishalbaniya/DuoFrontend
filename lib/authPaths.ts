/** Routes where failed auth should not hard-reload to /login (avoids refresh loops). */
const AUTH_PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/registration",
  "/onboarding",
];

export function isAuthPublicPath(pathname: string): boolean {
  return AUTH_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldRedirectToLogin(): boolean {
  if (typeof window === "undefined") return false;
  return !isAuthPublicPath(window.location.pathname);
}
