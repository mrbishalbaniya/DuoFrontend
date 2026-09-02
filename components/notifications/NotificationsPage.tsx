"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import api, { type NotificationPreferences } from "@/lib/api";
import {
  getPushStatus,
  registerPushNotifications,
  unregisterPushNotifications,
} from "@/lib/push/fcm";
import { setNotificationSoundPreference } from "@/lib/push/notification-sound";
import { cn } from "@/lib/utils";

const NOTIFICATION_PREF_ROWS = [
  ["sound_enabled", "Notification sound", "Play a sound when notifications arrive"],
  ["chat_enabled", "Messages", "Chat and reactions"],
  ["calls_enabled", "Calls", "Incoming and missed call alerts"],
  ["match_enabled", "Matches", "New mutual matches"],
  ["likes_enabled", "Likes", "Likes and profile views"],
  ["verification_enabled", "Verification", "Photo and identity updates"],
  ["payment_enabled", "Payments", "Wallet and subscription alerts"],
  ["announcements_enabled", "Announcements", "System and admin updates"],
  ["marketing_enabled", "Marketing", "Tips, offers, and Duo news"],
  ["vibration_enabled", "Vibration", "Vibrate when supported on this device"],
] as const satisfies ReadonlyArray<
  readonly [keyof NotificationPreferences, string, string]
>;

export function NotificationsPage() {
  const { user } = useAuth();
  const lenis = useLenis();

  const [pushLoading, setPushLoading] = useState(true);
  const [pushSaving, setPushSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getPushStatus()
      .then((status) => {
        if (cancelled) return;
        setPushSupported(status.supported);
        setPushConfigured(status.configured);
        setPushEnabled(status.enabled);
        setPushLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPushConfigured(false);
        setPushLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void api
      .getNotificationPreferences()
      .then((prefs) => {
        if (!cancelled) {
          setNotifPrefs(prefs);
          setNotificationSoundPreference(prefs.sound_enabled);
        }
      })
      .catch(() => {
        if (!cancelled) setNotifPrefs(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  const updatePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!notifPrefs) return;
    setPrefsSaving(true);
    try {
      const updated = await api.updateNotificationPreferences({ [key]: value });
      setNotifPrefs(updated);
      if (key === "sound_enabled") {
        setNotificationSoundPreference(value);
      }
    } catch {
      // Keep existing prefs on failure.
    } finally {
      setPrefsSaving(false);
    }
  };

  const handlePushToggle = async () => {
    setPushError(null);
    setPushMessage(null);
    setPushSaving(true);
    try {
      if (pushEnabled) {
        await unregisterPushNotifications();
        setPushEnabled(false);
        setPushMessage("Push notifications turned off.");
      } else {
        await registerPushNotifications();
        setPushEnabled(true);
        setPushMessage("Push notifications enabled.");
      }
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Could not update notifications.");
    } finally {
      setPushSaving(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12"
          data-lenis-prevent
        >
          <div className="mx-auto w-full max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
              <Link
                href="/settings"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container-high/60 transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface">arrow_back</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-on-surface md:text-3xl">
                  Notification Preferences
                </h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Manage how and when you receive notifications
                </p>
              </div>
            </div>

            {/* Push Notifications Section */}
            <div className="mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
              <div className="px-4 py-5 md:px-6 md:py-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[26px]">notifications</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-on-surface">Push notifications</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Get beautiful alerts for likes, new matches, and messages on this device.
                    </p>
                    {pushLoading ? (
                      <p className="mt-3 text-sm text-on-surface-variant">Checking support…</p>
                    ) : !pushSupported ? (
                      <p className="mt-3 text-sm text-on-surface-variant">
                        This browser does not support push notifications.
                      </p>
                    ) : !pushConfigured ? (
                      <p className="mt-3 text-sm text-on-surface-variant">
                        Push is not configured yet. Ask an admin to enable Firebase in integration settings.
                      </p>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handlePushToggle()}
                          disabled={pushSaving}
                          className={cn(
                            "rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
                            pushEnabled
                              ? "border border-outline-variant/30 text-on-surface hover:bg-surface-container-high/60"
                              : "text-white gradient-brand"
                          )}
                        >
                          {pushSaving
                            ? "Updating…"
                            : pushEnabled
                              ? "Turn off notifications"
                              : "Enable notifications"}
                        </button>
                        <span className="text-sm font-medium text-on-surface-variant">
                          {pushEnabled ? "✓ Enabled" : "Disabled"}
                        </span>
                      </div>
                    )}
                    {pushError ? <p className="mt-3 text-sm text-red-500">{pushError}</p> : null}
                    {pushMessage ? <p className="mt-3 text-sm text-accent">{pushMessage}</p> : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Categories */}
            {notifPrefs ? (
              <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                <div className="border-b border-outline-variant/20 px-4 py-4 md:px-6 md:py-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                    Notification Categories
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Choose which types of notifications you want to receive
                  </p>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {NOTIFICATION_PREF_ROWS.map(([key, label, description]) => (
                    <label
                      key={key}
                      className={cn(
                        "flex items-center justify-between gap-4 px-4 py-4 transition-colors md:px-6 md:py-5",
                        prefsSaving || !notifPrefs.push_enabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-surface-container-high/40"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-0.5">
                          <input
                            type="checkbox"
                            className="h-5 w-5 accent-primary cursor-pointer"
                            checked={Boolean(notifPrefs[key])}
                            disabled={prefsSaving || !notifPrefs.push_enabled}
                            onChange={(e) => void updatePref(key, e.target.checked)}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-base font-semibold text-on-surface">{label}</span>
                          <span className="block text-sm text-on-surface-variant mt-0.5">{description}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 px-4 py-8 text-center">
                <div className="flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                </div>
                <p className="mt-4 text-sm text-on-surface-variant">Loading preferences…</p>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-4 md:px-5 md:py-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <div className="text-sm text-on-surface-variant">
                  <p>
                    Notification preferences only apply when push notifications are enabled.
                    You can customize categories based on your interests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
