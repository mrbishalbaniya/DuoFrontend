/**
 * Navbar icon sets (Material Symbols glyph names). Applied to the mobile
 * bottom nav and the desktop sidebar. Keep ids in sync with DuoMobile
 * lib/core/theme/nav_icon_sets.dart.
 */
export type NavIconKey = "home" | "match" | "discover" | "chat" | "map" | "profile" | "settings";

export type IconSetId = "classic" | "romance" | "cupid" | "cosmic" | "royal" | "nature" | "playful";

export type IconSet = {
  id: IconSetId;
  premium: boolean;
  icons: Record<NavIconKey, string>;
};

export const ICON_SETS: IconSet[] = [
  {
    id: "classic",
    premium: false,
    icons: { home: "home", match: "favorite", discover: "group", chat: "chat_bubble", map: "map", profile: "person", settings: "settings" },
  },
  {
    id: "romance",
    premium: true,
    icons: { home: "cottage", match: "favorite", discover: "diversity_1", chat: "forum", map: "explore", profile: "face", settings: "tune" },
  },
  {
    id: "cupid",
    premium: true,
    icons: { home: "house", match: "volunteer_activism", discover: "heart_plus", chat: "sms", map: "location_on", profile: "account_circle", settings: "settings_heart" },
  },
  {
    id: "cosmic",
    premium: true,
    icons: { home: "rocket_launch", match: "auto_awesome", discover: "travel_explore", chat: "chat", map: "public", profile: "sentiment_satisfied", settings: "settings_suggest" },
  },
  {
    id: "royal",
    premium: true,
    icons: { home: "castle", match: "diamond", discover: "groups", chat: "mail", map: "near_me", profile: "badge", settings: "manage_accounts" },
  },
  {
    id: "nature",
    premium: true,
    icons: { home: "yard", match: "local_florist", discover: "forest", chat: "spa", map: "landscape", profile: "emoji_nature", settings: "eco" },
  },
  {
    id: "playful",
    premium: true,
    icons: { home: "toys", match: "cookie", discover: "celebration", chat: "mood", map: "flag", profile: "pets", settings: "extension" },
  },
];

export const DEFAULT_ICON_SET: IconSetId = "classic";
export const ICON_SET_STORAGE_KEY = "duo_icon_set";

export function isIconSetId(value: unknown): value is IconSetId {
  return typeof value === "string" && ICON_SETS.some((s) => s.id === value);
}

export function isPremiumIconSet(id: IconSetId): boolean {
  return ICON_SETS.find((s) => s.id === id)?.premium ?? false;
}

export function navIcons(id: IconSetId): Record<NavIconKey, string> {
  return (ICON_SETS.find((s) => s.id === id) ?? ICON_SETS[0]).icons;
}
