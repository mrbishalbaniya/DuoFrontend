"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { syncPushTokenIfEnabled } from "@/lib/push/fcm";

export function PushNotificationBridge() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    void syncPushTokenIfEnabled();
  }, [user, loading]);

  return null;
}
