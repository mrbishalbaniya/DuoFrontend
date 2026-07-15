"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { isAppPathRequiringOnboarded } from "@/lib/onboardingGate";

/**
 * Keeps incomplete registrations on /register until step 11 sets is_onboarded.
 * Completed users who open /register are sent into the app.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { user, loading, fetchUser } = useAuth();

  useEffect(() => {
    const needsUser =
      isAppPathRequiringOnboarded(pathname) ||
      pathname === "/register" ||
      pathname.startsWith("/register/") ||
      pathname === "/onboarding" ||
      pathname.startsWith("/onboarding/");

    if (!needsUser) return;
    void fetchUser();
  }, [fetchUser, pathname]);

  useEffect(() => {
    if (loading) return;

    const onboarded = Boolean(user?.profile?.is_onboarded);
    const onRegister =
      pathname === "/register" ||
      pathname.startsWith("/register/") ||
      pathname === "/registration";
    const onApp = isAppPathRequiringOnboarded(pathname);

    if (onApp && user && !onboarded) {
      router.replace("/register");
      return;
    }

    if (onRegister && user && onboarded) {
      router.replace("/match");
    }
  }, [loading, pathname, router, user]);

  return <>{children}</>;
}
