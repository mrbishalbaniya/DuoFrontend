/* global firebase */
/* eslint-disable no-undef */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

let messagingInit = null;

function loadMessaging() {
  if (!messagingInit) {
    messagingInit = fetch("/api/backend/notifications/config/")
      .then((response) => response.json())
      .then((config) => {
        if (!config.enabled || !config.firebase) {
          return null;
        }

        importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
        importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

        if (!firebase.apps.length) {
          firebase.initializeApp(config.firebase);
        }

        const messaging = firebase.messaging();
        messaging.onBackgroundMessage((payload) => {
          const title = payload.notification?.title || "Duo";
          const options = {
            body: payload.notification?.body || "",
            icon: "/globe.svg",
            data: payload.data || {},
          };
          self.registration.showNotification(title, options);
        });

        return messaging;
      })
      .catch(() => null);
  }

  return messagingInit;
}

loadMessaging();

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const conversationId = data.conversation_id;
  const targetUrl = conversationId ? `/message?conversation=${conversationId}` : "/message";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
