"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

export default function GoogleAuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface px-6">
          <p className="text-sm font-medium text-on-surface-variant">Signing you in with Google…</p>
        </div>
      }
    >
      <GoogleAuthCompleteContent />
    </Suspense>
  );
}

function GoogleAuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access =
      params.get("access") || readCookie("duo_oauth_access");
    const refresh =
      params.get("refresh") || readCookie("duo_oauth_refresh");
    const onboarded =
      (params.get("onboarded") || readCookie("duo_oauth_onboarded")) === "1";

    clearCookie("duo_oauth_access");
    clearCookie("duo_oauth_refresh");
    clearCookie("duo_oauth_onboarded");

    if (!access || !refresh) {
      router.replace("/login?error=google_auth");
      return;
    }

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    if (!onboarded) {
      sessionStorage.setItem("duo_register_via_google", "1");
      router.replace("/register");
      return;
    }

    router.replace("/match");
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <p className="text-sm font-medium text-on-surface-variant">Signing you in with Google…</p>
    </div>
  );
}
