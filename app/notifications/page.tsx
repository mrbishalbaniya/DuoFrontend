"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/ui/loader";

const NotificationsPage = dynamic(
  () => import("@/components/notifications/NotificationsPage").then((m) => m.NotificationsPage),
  {
    loading: () => (
      <div className="flex h-[100dvh] items-center justify-center bg-surface">
        <Loader pageName="Notifications" />
      </div>
    ),
  }
);

export default function NotificationsRoutePage() {
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
        <Loader pageName="Notifications" />
      </div>
    );
  }

  return <NotificationsPage />;
}
