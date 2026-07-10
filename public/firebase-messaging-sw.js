/**
 * Duo FCM service worker — rich notifications for likes, matches, and messages.
 * Handles data-only FCM payloads directly (no Firebase scripts required in SW).
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const DEFAULT_ICON = "/icons/duo-notification-192.png";
const DEFAULT_BADGE = "/icons/duo-badge-96.png";

function pickString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") {
    return { notification: {}, data: {} };
  }

  // FCM web push may nest fields under `data` as strings.
  const data = { ...(raw.data || {}) };
  const notification = { ...(raw.notification || {}) };

  // Some payloads put title/body only in data.
  return { notification, data };
}

function buildNotification(payload) {
  const { notification: n, data } = normalizePayload(payload);
  const type = pickString(data.type);
  const otherName = pickString(data.other_name, "someone special");
  const score = pickString(data.compatibility_score);

  let title = pickString(n.title, data.title, "Duo");
  let body = pickString(n.body, data.body, "You have a new update");

  if (!pickString(n.title, data.title)) {
    if (type === "new_match") title = "It's a Match!";
    else if (type === "profile_like") title = "Someone liked you";
    else if (type === "chat_message") title = "New message";
  }

  if (!pickString(n.body, data.body)) {
    if (type === "new_match") {
      body = score
        ? `You and ${otherName} have expressed interest in each other. ${score}% compatible — start chatting.`
        : `You and ${otherName} have expressed interest in each other. Start chatting on Duo.`;
    } else if (type === "profile_like") {
      body = "Open Duo to see who liked you.";
    } else if (type === "chat_message") {
      body = "Open Duo to read your message.";
    }
  }

  const icon = pickString(data.icon, n.icon, DEFAULT_ICON);
  const badge = pickString(data.badge, n.badge, DEFAULT_BADGE);
  const image = pickString(data.image, n.image);
  const tag = pickString(data.tag, n.tag, type || "duo");
  const url = pickString(
    data.url,
    data.link,
    type === "new_match" ? "/chat" : "/message"
  );

  const options = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: type === "new_match",
    data: {
      ...data,
      url,
      type,
    },
    // Soft double-pulse — feels like the celebration heart, not a party emoji blast
    vibrate: type === "new_match" ? [100, 50, 100, 50, 160] : [80, 40, 80],
  };

  if (image) options.image = image;

  if (type === "chat_message") {
    options.actions = [{ action: "open", title: "Reply" }];
  } else if (type === "new_match") {
    options.actions = [{ action: "open", title: "Start Chatting" }];
  } else if (type === "profile_like") {
    options.actions = [{ action: "open", title: "See who" }];
  }

  return { title, options };
}

function targetPathFromNotification(notification) {
  const data = notification?.data || {};
  if (data.url) return data.url;
  if (data.conversation_id) {
    return `/chat?conversation=${data.conversation_id}`;
  }
  if (data.type === "profile_like") return "/discover?tab=likes-you";
  if (data.type === "new_match") return "/chat";
  return "/chat";
}

async function focusOrOpen(targetUrl) {
  const absolute = new URL(targetUrl, self.location.origin).href;
  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  for (const client of clientsList) {
    if ("focus" in client) {
      try {
        if ("navigate" in client) {
          await client.navigate(absolute);
        }
      } catch {
        // ignore navigate failures
      }
      return client.focus();
    }
  }

  if (self.clients.openWindow) {
    return self.clients.openWindow(absolute);
  }
  return undefined;
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let raw = null;
      try {
        raw = event.data ? event.data.json() : null;
      } catch {
        try {
          const text = event.data ? event.data.text() : "";
          raw = text ? { data: { body: text } } : null;
        } catch {
          raw = null;
        }
      }

      if (!raw) {
        await self.registration.showNotification("Duo", {
          body: "You have a new update",
          icon: DEFAULT_ICON,
          badge: DEFAULT_BADGE,
          data: { url: "/message" },
        });
        return;
      }

      const { title, options } = buildNotification(raw);
      await self.registration.showNotification(title, options);
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = targetPathFromNotification(event.notification);
  event.waitUntil(focusOrOpen(targetUrl));
});
