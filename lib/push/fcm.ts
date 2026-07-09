import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
  type MessagePayload,
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
const DEFAULT_ICON = "/icons/duo-notification-192.png";
const DEFAULT_BADGE = "/icons/duo-badge-96.png";

let messagingInstance: Messaging | null = null;
let cachedConfig: PushConfig | null = null;
let cachedToken: string | null = null;
let foregroundListenerBound = false;

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

async function fetchPushConfig(forceRefresh = false): Promise<PushConfig> {
  if (!forceRefresh && cachedConfig) return cachedConfig;
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
  if (existing) {
    // Force update so notification UX fixes ship without a hard refresh.
    void existing.update();
    return existing;
  }
  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

function pickString(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function notificationFromPayload(payload: MessagePayload): {
  title: string;
  options: NotificationOptions;
} {
  const data = (payload.data || {}) as Record<string, string>;
  const n = payload.notification;
  const type = pickString(data.type);

  let title = pickString(n?.title, data.title, "Duo");
  let body = pickString(n?.body, data.body, "You have a new update");
  const otherName = pickString(data.other_name, "someone special");
  const score = pickString(data.compatibility_score);

  if (!n?.title && !data.title) {
    if (type === "new_match") title = "It's a Match!";
    else if (type === "profile_like") title = "Someone liked you";
    else if (type === "chat_message") title = "New message";
  }

  if (!n?.body && !data.body && type === "new_match") {
    body = score
      ? `You and ${otherName} have expressed interest in each other. ${score}% compatible — start chatting.`
      : `You and ${otherName} have expressed interest in each other. Start chatting on Duo.`;
  }

  const icon = pickString(data.icon, n?.icon, DEFAULT_ICON);
  const badge = pickString(data.badge, DEFAULT_BADGE);
  const image = pickString(data.image, n?.image);
  const tag = pickString(data.tag, type || "duo-foreground");
  const url = pickString(data.url, type === "new_match" ? "/chat" : "/message");

  const options: NotificationOptions & {
    image?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
  } = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: type === "new_match",
    data: { ...data, url, type },
  };
  if (image) options.image = image;
  return { title, options };
}

function bindForegroundListener(messaging: Messaging): void {
  if (foregroundListenerBound) return;
  foregroundListenerBound = true;

  onMessage(messaging, (payload) => {
    if (Notification.permission !== "granted") return;

    const { title, options } = notificationFromPayload(payload);

    // Prefer the active SW registration so clicks route through our handler.
    void navigator.serviceWorker.getRegistration(SW_PATH).then((reg) => {
      if (reg?.showNotification) {
        void reg.showNotification(title, options);
        return;
      }
      new Notification(title, options);
    });
  });
}

export async function getRegisteredPushToken(): Promise<string | null> {
  return cachedToken;
}

export async function registerPushNotifications(): Promise<string | null> {
  const supported = await isPushSupported();
  if (!supported) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const config = await fetchPushConfig(true);
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

  // Wait until the SW is active before requesting a token.
  if (registration.installing || registration.waiting) {
    await new Promise<void>((resolve) => {
      const worker = registration.installing || registration.waiting;
      if (!worker) {
        resolve();
        return;
      }
      worker.addEventListener("statechange", () => {
        if (worker.state === "activated" || worker.state === "redundant") {
          resolve();
        }
      });
    });
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
  bindForegroundListener(messaging);

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

  const config = await fetchPushConfig(true);
  return {
    supported: true,
    configured: Boolean(config.enabled && config.firebase && config.vapidKey),
    permission: Notification.permission,
    enabled: getPushPreference() && Notification.permission === "granted",
  };
}
