"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingExperience } from "@/components/onboarding/OnboardingExperience";
import { useAuth } from "@/contexts/AuthContext";
import { SHOW_PRODUCT_ONBOARDING_KEY } from "@/lib/onboarding/content";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, fetchUser } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await fetchUser();
      } finally {
        setReady(true);
      }
    })();
  }, [fetchUser]);

  useEffect(() => {
    if (!ready || loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.profile?.is_onboarded) {
      router.replace("/register");
    }
  }, [loading, ready, router, user]);

  const finish = useCallback(() => {
    try {
      sessionStorage.removeItem(SHOW_PRODUCT_ONBOARDING_KEY);
    } catch {
      // ignore storage errors
    }
    router.replace("/match");
  }, [router]);

  if (!ready || loading || !user?.profile?.is_onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm font-medium text-on-surface-variant">Preparing your welcome…</p>
      </div>
    );
  }

  return <OnboardingExperience onComplete={finish} />;
}
