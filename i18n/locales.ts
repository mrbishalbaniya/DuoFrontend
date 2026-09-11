/** Supported app locales — keep in sync with the backend's
 * Profile.LANGUAGE_CHOICES (accounts/models.py) and the language switcher
 * in components/settings/LanguageRegionPage.tsx. */
export const LOCALES = ["en", "ne"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
