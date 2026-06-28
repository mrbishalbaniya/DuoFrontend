"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsRoutePage() {
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return <SettingsPage />;
}
