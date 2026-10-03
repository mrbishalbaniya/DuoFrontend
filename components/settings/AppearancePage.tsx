"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { SecurityPageShell } from "@/components/security/SecurityPageShell";
import {
  DARK_STYLES,
  LIGHT_STYLES,
  PALETTES,
  type DarkStyleId,
  type LightStyleId,
  type Palette,
  type SurfaceStyle,
} from "@/lib/palettes";
import { ICON_SETS, type IconSet } from "@/lib/iconSets";
import { cn } from "@/lib/utils";

function ThemeOption({
  mode,
  label,
  icon,
  active,
  onSelect,
}: {
  mode: ThemeMode;
  label: string;
  icon: string;
  active: boolean;
  onSelect: (mode: ThemeMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      aria-pressed={active}
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition-all md:px-4 md:py-4",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-outline-variant/25 text-on-surface-variant hover:border-primary/20 hover:bg-surface-container-high/50"
      )}
    >
      <span
        className="material-symbols-outlined text-[24px]"
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function PaletteCard({
  palette,
  name,
  description,
  active,
  locked,
  badge,
  lockedLabel,
  activeLabel,
  onSelect,
}: {
  palette: Palette;
  name: string;
  description: string;
  active: boolean;
  locked: boolean;
  badge: string;
  lockedLabel: string;
  activeLabel: string;
  onSelect: () => void;
}) {
  const [c1, c2, c3] = palette.swatch;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={locked ? lockedLabel : name}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
        active
          ? "border-primary ring-2 ring-primary/40"
          : "border-outline-variant/25 hover:-translate-y-0.5 hover:border-primary/30",
        locked && "opacity-90"
      )}
    >
      {/* Mini app preview in the palette's own colors */}
      <div className="relative h-24 w-full p-3" style={{ backgroundColor: palette.surface }}>
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: `radial-gradient(120% 90% at 100% 0%, ${c1}55 0%, transparent 60%)` }}
        />
        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-5 w-5 rounded-full" style={{ background: `linear-gradient(135deg, ${c1}, ${c3})` }} />
            <span className="h-1.5 w-12 rounded-full bg-white/25" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${c1}, ${c2}, ${c3})` }} />
            <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: c2 }} />
          </div>
        </div>
        {locked ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
            <span className="material-symbols-outlined text-[22px] text-white">lock</span>
          </span>
        ) : null}
        {active ? (
          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[14px]" aria-label={activeLabel}>
              check
            </span>
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 bg-secondary/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-on-surface">{name}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              palette.premium ? "bg-premium/15 text-premium" : "bg-surface-container-high text-on-surface-variant"
            )}
          >
            {badge}
          </span>
        </div>
        <span className="text-xs text-on-surface-variant">{description}</span>
      </div>
    </button>
  );
}

function StyleCard({
  style,
  name,
  description,
  active,
  locked,
  badge,
  lockedLabel,
  onSelect,
}: {
  style: SurfaceStyle<string>;
  name: string;
  description: string;
  active: boolean;
  locked: boolean;
  badge: string;
  lockedLabel: string;
  onSelect: () => void;
}) {
  const [bg, card, text] = style.preview;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={locked ? lockedLabel : name}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
        active
          ? "border-primary ring-2 ring-primary/40"
          : "border-outline-variant/25 hover:-translate-y-0.5 hover:border-primary/30"
      )}
    >
      <div className="relative h-20 w-full p-2.5" style={{ backgroundColor: bg }}>
        <div className="flex h-full flex-col gap-1.5 rounded-lg p-2" style={{ backgroundColor: card }}>
          <span className="h-1.5 w-2/3 rounded-full" style={{ backgroundColor: text, opacity: 0.85 }} />
          <span className="h-1.5 w-1/2 rounded-full" style={{ backgroundColor: text, opacity: 0.4 }} />
          <span className="mt-auto h-3 w-10 rounded-full bg-primary" />
        </div>
        {locked ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
            <span className="material-symbols-outlined text-[22px] text-white">lock</span>
          </span>
        ) : null}
        {active ? (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
            <span className="material-symbols-outlined text-[14px]">check</span>
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 bg-secondary/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-on-surface">{name}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              style.premium ? "bg-premium/15 text-premium" : "bg-surface-container-high text-on-surface-variant"
            )}
          >
            {badge}
          </span>
        </div>
        <span className="text-xs text-on-surface-variant">{description}</span>
      </div>
    </button>
  );
}

function IconSetCard({
  set,
  name,
  active,
  locked,
  badge,
  onSelect,
}: {
  set: IconSet;
  name: string;
  active: boolean;
  locked: boolean;
  badge: string;
  onSelect: () => void;
}) {
  const keys = ["match", "discover", "chat", "map", "profile"] as const;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.98]",
        active
          ? "border-primary bg-primary/10 shadow-[0_8px_24px] shadow-primary/15"
          : "border-outline-variant/40 bg-surface-container-low hover:border-primary/40"
      )}
    >
      <div className="flex items-center justify-between gap-1 rounded-xl bg-surface-container-high px-2 py-2">
        {keys.map((k) => (
          <span
            key={k}
            className={cn("material-symbols-outlined text-[20px]", active ? "text-primary" : "text-on-surface-variant")}
            style={k === "match" ? { fontVariationSettings: "'FILL' 1" } : undefined}
            aria-hidden
          >
            {set.icons[k]}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-on-surface">{name}</span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
            set.premium ? "bg-premium/15 text-premium" : "bg-surface-container-high text-on-surface-variant"
          )}
        >
          {locked ? <span className="material-symbols-outlined text-[12px]">lock</span> : null}
          {badge}
        </span>
      </div>
    </button>
  );
}

export function AppearancePage() {
  const t = useTranslations("appearance");
  const ts = useTranslations("settings");
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    theme,
    setTheme,
    resolvedTheme,
    palette,
    setPalette,
    darkStyle,
    setDarkStyle,
    lightStyle,
    setLightStyle,
    iconSet,
    setIconSet,
  } = useTheme();
  const isPremium = Boolean(user?.profile?.is_premium);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const handlePalette = (p: Palette) => {
    if (p.premium && !isPremium) {
      router.push("/pricing");
      return;
    }
    setPalette(p.id);
  };

  const handleIconSet = (s: IconSet) => {
    if (s.premium && !isPremium) {
      router.push("/pricing");
      return;
    }
    setIconSet(s.id);
  };

  // Picking a style also switches to its mode, unless System already resolves to it.
  const handleDarkStyle = (s: SurfaceStyle<DarkStyleId>) => {
    if (s.premium && !isPremium) {
      router.push("/pricing");
      return;
    }
    setDarkStyle(s.id);
    if (resolvedTheme !== "dark") setTheme("dark");
  };

  const handleLightStyle = (s: SurfaceStyle<LightStyleId>) => {
    if (s.premium && !isPremium) {
      router.push("/pricing");
      return;
    }
    setLightStyle(s.id);
    if (resolvedTheme !== "light") setTheme("light");
  };

  return (
    <SecurityPageShell title={t("title")} backHref="/settings">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <section className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {t("modeHeading")}
          </h2>
          <div className="rounded-2xl border border-primary/10 bg-secondary/30 px-4 py-4 md:px-5 md:py-5">
            <p className="mb-3 text-sm text-on-surface-variant">{ts("items.themeLabel")}</p>
            <div className="flex gap-2 sm:gap-3">
              <ThemeOption mode="dark" label={ts("items.themeDark")} icon="dark_mode" active={theme === "dark"} onSelect={setTheme} />
              <ThemeOption mode="light" label={ts("items.themeLight")} icon="light_mode" active={theme === "light"} onSelect={setTheme} />
              <ThemeOption mode="system" label={ts("items.themeSystem")} icon="routine" active={theme === "system"} onSelect={setTheme} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t("darkStylesHeading")}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("darkStylesHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DARK_STYLES.map((s) => (
              <StyleCard
                key={s.id}
                style={s}
                name={t(`darkStyles.${s.id}.name`)}
                description={t(`darkStyles.${s.id}.description`)}
                active={darkStyle === s.id && resolvedTheme === "dark"}
                locked={s.premium && !isPremium}
                badge={s.premium ? t("premiumBadge") : t("freeBadge")}
                lockedLabel={t("locked")}
                onSelect={() => handleDarkStyle(s)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t("lightStylesHeading")}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("lightStylesHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LIGHT_STYLES.map((s) => (
              <StyleCard
                key={s.id}
                style={s}
                name={t(`lightStyles.${s.id}.name`)}
                description={t(`lightStyles.${s.id}.description`)}
                active={lightStyle === s.id && resolvedTheme === "light"}
                locked={s.premium && !isPremium}
                badge={s.premium ? t("premiumBadge") : t("freeBadge")}
                lockedLabel={t("locked")}
                onSelect={() => handleLightStyle(s)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {t("paletteHeading")}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("paletteHint")}</p>
          </div>

          {!isPremium ? (
            <div className="flex items-center gap-3 rounded-2xl border border-premium/30 bg-premium/10 px-4 py-3">
              <span className="material-symbols-outlined text-premium" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface">{t("upgradeTitle")}</p>
                <p className="text-xs text-on-surface-variant">{t("upgradeBody")}</p>
              </div>
              <Link
                href="/pricing"
                className="gradient-premium shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                {t("upgradeCta")}
              </Link>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {PALETTES.map((p) => (
              <PaletteCard
                key={p.id}
                palette={p}
                name={t(`palettes.${p.id}.name`)}
                description={t(`palettes.${p.id}.description`)}
                active={palette === p.id}
                locked={p.premium && !isPremium}
                badge={p.premium ? t("premiumBadge") : t("freeBadge")}
                lockedLabel={t("locked")}
                activeLabel={t("active")}
                onSelect={() => handlePalette(p)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              {t("iconSetsHeading")}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("iconSetsHint")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ICON_SETS.map((s) => (
              <IconSetCard
                key={s.id}
                set={s}
                name={t(`iconSets.${s.id}`)}
                active={iconSet === s.id}
                locked={s.premium && !isPremium}
                badge={s.premium ? t("premiumBadge") : t("freeBadge")}
                onSelect={() => handleIconSet(s)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {t("previewHeading")}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-primary/10 bg-surface-container">
            <div className="gradient-brand h-20 w-full" />
            <div className="-mt-8 space-y-3 px-4 pb-4">
              <div className="h-16 w-16 rounded-full border-4 border-surface-container bg-primary/20" />
              <div>
                <p className="text-base font-bold text-on-surface">{t("previewName")}</p>
                <p className="text-sm text-on-surface-variant">{t("previewBio")}</p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                  {t("previewLike")}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-4 py-2 text-sm font-semibold text-primary">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  {t("previewMessage")}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SecurityPageShell>
  );
}
