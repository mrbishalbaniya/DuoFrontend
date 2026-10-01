"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DEFAULT_PALETTE, isPremiumPalette } from "@/lib/palettes";
import { DEFAULT_ICON_SET, isPremiumIconSet } from "@/lib/iconSets";

/**
 * Falls back to the free appearance options when a signed-in user without an
 * active premium subscription still has premium choices saved (e.g. it expired).
 */
export function PremiumPaletteGuard() {
  const { user, loading } = useAuth();
  const { palette, setPalette, darkStyle, setDarkStyle, lightStyle, setLightStyle, iconSet, setIconSet } = useTheme();
  const isPremium = Boolean(user?.profile?.is_premium);

  useEffect(() => {
    if (loading || !user || isPremium) return;
    if (isPremiumPalette(palette)) setPalette(DEFAULT_PALETTE);
    if (darkStyle !== "default") setDarkStyle("default");
    if (lightStyle !== "default") setLightStyle("default");
    if (isPremiumIconSet(iconSet)) setIconSet(DEFAULT_ICON_SET);
  }, [loading, user, isPremium, palette, setPalette, darkStyle, setDarkStyle, lightStyle, setLightStyle, iconSet, setIconSet]);

  return null;
}
