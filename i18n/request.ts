import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isAppLocale } from "./locales";

// Messages are split into one JSON file per feature area under
// messages/<locale>/*.json (common, discover, chat, map, profile, register,
// security, settings, home, ...) instead of one giant file. Each file owns
// its own top-level namespace key(s) (e.g. common.json defines "nav",
// "login", "wallet", ...) so multiple people/agents can add a new feature's
// translations without editing — and risking merge conflicts on — a single
// shared file. They're all flattened into one messages object here.
const MESSAGE_MODULES = [
  "common",
  "discover",
  "chat",
  "map",
  "profile",
  "register",
  "security",
  "settingsExtra",
  "home",
] as const;

// "Without i18n routing" setup — the app's existing ~190-route structure
// under app/ stays untouched (no /en or /ne URL prefixes, no middleware
// rewrite). The active locale is just a cookie, set from the user's saved
// `profile.app_language` on login and from the language switcher in
// Settings. See lib/i18n/setLocale.ts for where that cookie gets written.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const loaded = await Promise.all(
    MESSAGE_MODULES.map(async (name) => {
      try {
        return (await import(`../messages/${locale}/${name}.json`)).default;
      } catch {
        // A feature file that doesn't exist yet for this locale — skip
        // rather than fail the whole app.
        return {};
      }
    })
  );

  const messages = Object.assign({}, ...loaded);

  return { locale, messages };
});
