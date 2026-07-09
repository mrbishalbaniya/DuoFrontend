import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";

import api from "@/lib/api";

export type PushConfig = {
  enabled: boolean;
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    messagingSenderId: string;
    appId: string;
  };
  vapidKey?: string;
};

const PUSH_PREF_KEY = "duo_push_enabled";
const SW_PATH = "/firebase-messaging-sw.js";

let messagingInstance: Messaging | null = null;
let cachedConfig: PushConfig | null = null;
let cachedToken: string | null = null;

export function getPushPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PUSH_PREF_KEY) === "1";
}

export function setPushPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PUSH_PREF_KEY, enabled ? "1" : "0");
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
  return isSupported();
}

async function fetchPushConfig(): Promise<PushConfig> {
  if (cachedConfig) return cachedConfig;
  cachedConfig = await api.getNotificationConfig();
  return cachedConfig;
}

async function ensureFirebaseApp(config: PushConfig): Promise<FirebaseApp | null> {
  if (!config.enabled || !config.firebase) return null;
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp(config.firebase);
}

async function ensureMessaging(config: PushConfig): Promise<Messaging | null> {
  if (!(await isPushSupported())) return null;
  const app = await ensureFirebaseApp(config);
  if (!app) return null;
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_PATH);
}

export async function getRegisteredPushToken(): Promise<string | null> {
  return cachedToken;
}

export async function registerPushNotifications(): Promise<string | null> {
  const supported = await isPushSupported();
  if (!supported) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const config = await fetchPushConfig();
  if (!config.enabled || !config.vapidKey || !config.firebase) {
    throw new Error("Push notifications are not configured on the server yet.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was denied.");
  }

  const registration = await ensureServiceWorker();
  const messaging = await ensureMessaging(config);
  if (!messaging || !registration) {
    throw new Error("Could not initialize Firebase messaging.");
  }

  const token = await getToken(messaging, {
    vapidKey: config.vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Could not obtain an FCM device token.");
  }

  await api.registerDeviceToken(token, "web");
  cachedToken = token;
  setPushPreference(true);

  onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "Duo";
    const body = payload.notification?.body ?? "";
    if (document.visibilityState === "visible" && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/globe.svg",
        data: payload.data,
      });
    }
  });

  return token;
}

export async function unregisterPushNotifications(): Promise<void> {
  const config = await fetchPushConfig();
  const messaging = await ensureMessaging(config);
  const token = cachedToken;

  if (token) {
    await api.unregisterDeviceToken(token);
  }

  if (messaging && token) {
    try {
      await deleteToken(messaging);
    } catch {
      // Token may already be invalid locally.
    }
  }

  cachedToken = null;
  setPushPreference(false);
}

export async function syncPushTokenIfEnabled(): Promise<void> {
  if (!getPushPreference()) return;
  if (Notification.permission !== "granted") return;

  try {
    await registerPushNotifications();
  } catch {
    // Silent sync on login — user can retry from Settings.
  }
}

export async function getPushStatus(): Promise<{
  supported: boolean;
  configured: boolean;
  permission: NotificationPermission | "unsupported";
  enabled: boolean;
}> {
  const supported = await isPushSupported();
  if (!supported) {
    return {
      supported: false,
      configured: false,
      permission: "unsupported",
      enabled: false,
    };
  }

  const config = await fetchPushConfig();
  return {
    supported: true,
    configured: Boolean(config.enabled && config.firebase && config.vapidKey),
    permission: Notification.permission,
    enabled: getPushPreference() && Notification.permission === "granted",
  };
}
