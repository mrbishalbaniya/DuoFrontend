"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SettingsPageSkeleton } from "@/components/skeletons/SettingsPageSkeleton";

const SettingsPage = dynamic(
  () => import("@/components/settings/SettingsPage").then((m) => m.SettingsPage),
  {
    loading: () => <SettingsPageSkeleton />,
  }
);

export default function SettingsRoutePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <SettingsPageSkeleton />;
  }

  return <SettingsPage />;
}
