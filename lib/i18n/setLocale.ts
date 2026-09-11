"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, isAppLocale, type AppLocale } from "@/i18n/locales";

/** Sets the active UI locale cookie. Called from the language switcher in
 * Settings, and from the client on login/app-load to sync the cookie with
 * the user's saved `profile.app_language` if they differ (e.g. signed in
 * on a new device/browser). */
export async function setLocaleCookie(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
