"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/ui/loader";

const SettingsPage = dynamic(
  () => import("@/components/settings/SettingsPage").then((m) => m.SettingsPage),
  {
    loading: () => (
      <div className="flex h-[100dvh] items-center justify-center bg-surface">
        <Loader pageName="Settings" />
      </div>
    ),
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
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-surface">
        <Loader pageName="Settings" />
      </div>
    );
  }

  return <SettingsPage />;
}
