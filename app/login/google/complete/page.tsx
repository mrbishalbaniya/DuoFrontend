"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

async function verifySession(): Promise<{ ok: boolean; onboarded: boolean }> {
  try {
    const res = await fetch("/api/backend/auth/me/", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, onboarded: false };
    }
    const data = (await res.json()) as { profile?: { is_onboarded?: boolean } };
    return { ok: true, onboarded: Boolean(data.profile?.is_onboarded) };
  } catch {
    return { ok: false, onboarded: false };
  }
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
  const { fetchUser } = useAuth();

  useEffect(() => {
    const handoff = searchParams.get("handoff");

    async function finishAuth() {
      if (handoff) {
        try {
          const res = await fetch("/api/auth/handoff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handoff }),
            credentials: "include",
          });
          const data = (await res.json()) as { onboarded?: boolean };
          if (!res.ok) {
            router.replace("/login?error=google_auth");
            return;
          }
          await fetchUser();
          const session = await verifySession();
          if (!session.ok) {
            router.replace("/login?error=google_auth");
            return;
          }
          if (!session.onboarded && !data.onboarded) {
            sessionStorage.setItem("duo_register_via_google", "1");
            window.location.href = "/register?google=1";
            return;
          }
          window.location.href = "/match";
          return;
        } catch {
          router.replace("/login?error=google_auth");
          return;
        }
      }

      await fetchUser();
      const session = await verifySession();
      if (!session.ok) {
        router.replace("/login?error=google_auth");
        return;
      }

      if (!session.onboarded) {
        sessionStorage.setItem("duo_register_via_google", "1");
        window.location.href = "/register?google=1";
        return;
      }

      window.location.href = "/match";
    }

    void finishAuth();
  }, [fetchUser, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <p className="text-sm font-medium text-on-surface-variant">Signing you in with Google…</p>
    </div>
  );
}
