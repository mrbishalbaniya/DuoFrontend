"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { syncPushTokenIfEnabled } from "@/lib/push/fcm";
import {
  playNotificationSound,
  setNotificationSoundPreference,
  unlockNotificationSound,
} from "@/lib/push/notification-sound";
import api from "@/lib/api";

export function PushNotificationBridge() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    void syncPushTokenIfEnabled();

    // Sync server sound preference + unlock audio after login gesture path.
    void api
      .getNotificationPreferences()
      .then((prefs) => {
        setNotificationSoundPreference(prefs.sound_enabled);
      })
      .catch(() => {
        // Prefer existing local default if prefs unavailable.
      });

    unlockNotificationSound();

    const onPointer = () => unlockNotificationSound();
    window.addEventListener("pointerdown", onPointer, { once: true });

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "duo-play-notification-sound") {
        playNotificationSound({ soundFlag: data.soundFlag ?? "1" });
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("pointerdown", onPointer);
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, [user, loading]);

  return null;
}
