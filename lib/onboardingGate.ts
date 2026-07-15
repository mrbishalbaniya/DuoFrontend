/** App routes that require a completed registration (step 11 / is_onboarded). */
export const APP_REQUIRES_ONBOARDED_PREFIXES = [
  "/match",
  "/chat",
  "/discover",
  "/map",
  "/profile",
  "/settings",
  "/insights",
  "/wallet",
  "/verify",
  "/dashboard",
] as const;

export function isAppPathRequiringOnboarded(pathname: string): boolean {
  return APP_REQUIRES_ONBOARDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export const ONBOARDED_COOKIE = "duo_onboarded";

export function syncOnboardedCookie(isOnboarded: boolean): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  if (isOnboarded) {
    document.cookie = `${ONBOARDED_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${ONBOARDED_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  }
}

export function clearOnboardedCookie(): void {
  syncOnboardedCookie(false);
}
