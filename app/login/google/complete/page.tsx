"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    const handoff = searchParams.get("handoff");

    async function finishAuth() {
      if (handoff) {
        try {
          const res = await fetch("/api/auth/handoff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ handoff }),
          });
          const data = (await res.json()) as { onboarded?: boolean };
          if (!res.ok) {
            router.replace("/login?error=google_auth");
            return;
          }
          if (!data.onboarded) {
            sessionStorage.setItem("duo_register_via_google", "1");
            router.replace("/register");
            return;
          }
          router.replace("/match");
          return;
        } catch {
          router.replace("/login?error=google_auth");
          return;
        }
      }

      const onboarded = searchParams.get("onboarded") === "1";
      if (!onboarded) {
        sessionStorage.setItem("duo_register_via_google", "1");
        router.replace("/register");
        return;
      }
      router.replace("/match");
    }

    void finishAuth();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <p className="text-sm font-medium text-on-surface-variant">Signing you in with Google…</p>
    </div>
  );
}
