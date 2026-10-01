"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/ui/loader";

const PartnerPreferencesPage = dynamic(
  () =>
    import("@/components/preferences/MatchPreferencesPage").then((m) => m.PartnerPreferencesPage),
  {
    loading: () => (
      <div className="flex h-[100dvh] items-center justify-center bg-surface">
        <Loader pageName="Preferences" />
      </div>
    ),
  }
);

export default function PreferencesRoutePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-surface">
        <Loader pageName="Preferences" />
      </div>
    );
  }

  return <PartnerPreferencesPage />;
}
