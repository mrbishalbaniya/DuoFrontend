"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, type ReactNode } from "react";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import { ChatConfirmDialog } from "@/components/chat/ChatConversationMenu";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const APP_VERSION = "0.1.0";

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
        {children}
      </div>
    </section>
  );
}

function SettingsDivider() {
  return <div className="border-t border-outline-variant/20" />;
}

function SettingsRow({
  icon,
  title,
  description,
  href,
  onClick,
  trailing,
  destructive = false,
  disabled = false,
}: {
  icon: string;
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:h-11 md:w-11",
          destructive ? "bg-red-500/10 text-red-400" : "bg-primary/10 text-primary"
        )}
      >
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", destructive ? "text-red-400" : "text-on-surface")}>
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {trailing ?? (
        <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
          chevron_right
        </span>
      )}
    </>
  );

  const className = cn(
    "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors md:px-5 md:py-5",
    disabled
      ? "cursor-default opacity-70"
      : destructive
        ? "hover:bg-red-500/10"
        : "hover:bg-surface-container-high/60"
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} className={className}>
      {content}
    </button>
  );
}

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

export function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const lenis = useLenis();

  const profile = user?.profile;
  const isVerified = profile?.is_verified;
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12"
          data-lenis-prevent
        >
          <div className="mx-auto w-full max-w-6xl">

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8 xl:gap-10">
              <div className="space-y-6">
                <SettingsSection title={t("sections.wallet")}>
                  <SettingsRow
                    icon="account_balance_wallet"
                    title={t("items.walletTitle")}
                    description={t("items.walletDescription")}
                    href="/wallet"
                    trailing={
                      profile?.wallet_balance != null ? (
                        <span className="flex items-center gap-1 text-sm font-semibold tabular-nums text-on-surface">
                          <span className="material-symbols-outlined text-base text-primary">toll</span>
                          {profile.wallet_balance.toLocaleString("en-NP")}
                        </span>
                      ) : undefined
                    }
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.verification")}>
                  {isVerified ? (
                    <div className="flex items-center gap-3 px-4 py-4 md:px-5 md:py-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent md:h-11 md:w-11">
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{t("items.verifiedProfileTitle")}</p>
                        <p className="text-sm text-on-surface-variant">{t("items.verifiedProfileDescription")}</p>
                      </div>
                    </div>
                  ) : (
                    <SettingsRow
                      icon="photo_camera_front"
                      title={t("items.verifyProfileTitle")}
                      description={t("items.verifyProfileDescription")}
                      href="/verify"
                    />
                  )}
                </SettingsSection>

                <SettingsSection title={t("sections.account")}>
                  <SettingsRow
                    icon="person"
                    title={t("items.accountInfoTitle")}
                    description={t("items.accountInfoDescription")}
                    href="/account"
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.appearance")}>
                  <div className="px-4 py-4 md:px-5 md:py-5">
                    <p className="mb-3 text-sm text-on-surface-variant">{t("items.themeLabel")}</p>
                    <div className="flex gap-2 sm:gap-3">
                      <ThemeOption
                        mode="dark"
                        label={t("items.themeDark")}
                        icon="dark_mode"
                        active={theme === "dark"}
                        onSelect={setTheme}
                      />
                      <ThemeOption
                        mode="light"
                        label={t("items.themeLight")}
                        icon="light_mode"
                        active={theme === "light"}
                        onSelect={setTheme}
                      />
                      <ThemeOption
                        mode="system"
                        label={t("items.themeSystem")}
                        icon="routine"
                        active={theme === "system"}
                        onSelect={setTheme}
                      />
                    </div>
                  </div>
                </SettingsSection>

                <SettingsSection title={t("sections.notifications")}>
                  <SettingsRow
                    icon="notifications"
                    title={t("items.notificationPrefsTitle")}
                    description={t("items.notificationPrefsDescription")}
                    href="/notifications"
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.privacy")}>
                  <SettingsRow
                    icon="map"
                    title={t("items.locationPrivacyTitle")}
                    description={t("items.locationPrivacyDescription")}
                    href="/map"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="tune"
                    title={t("items.discoveryPrefsTitle")}
                    description={t("items.discoveryPrefsDescription")}
                    href="/profile"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="shield"
                    title={t("items.chatPrivacyTitle")}
                    description={t("items.chatPrivacyDescription")}
                    href="/chat"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="block"
                    title={t("items.blockedUsersTitle")}
                    description={t("items.blockedUsersDescription")}
                    href="/blocked-users"
                  />
                </SettingsSection>
              </div>

              <div className="space-y-6">
                <SettingsSection title={t("sections.security")}>
                  <SettingsRow
                    icon="security"
                    title={t("items.securityCenterTitle")}
                    description={t("items.securityCenterDescription")}
                    href="/security"
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.language")}>
                  <SettingsRow
                    icon="language"
                    title={t("items.appLanguageTitle")}
                    description={profile?.app_language === "ne" ? "नेपाली" : "English"}
                    href="/language"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="public"
                    title={t("items.regionTitle")}
                    description={profile?.app_region || "Nepal"}
                    href="/language"
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.help")}>
                  <SettingsRow
                    icon="help"
                    title={t("items.helpCenterTitle")}
                    description={t("items.helpCenterDescription")}
                    href="/help"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="support_agent"
                    title={t("items.contactSupportTitle")}
                    description={t("items.contactSupportDescription")}
                    href="/help/contact"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="quiz"
                    title={t("items.faqTitle")}
                    description={t("items.faqDescription")}
                    href="/help/faq"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="bug_report"
                    title={t("items.reportBugTitle")}
                    description={t("items.reportBugDescription")}
                    href="/help/report-bug"
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.about")}>
                  <SettingsRow
                    icon="privacy_tip"
                    title={t("items.privacyPolicyTitle")}
                    href="/legal/privacy"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="description"
                    title={t("items.termsTitle")}
                    href="/legal/terms"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="info"
                    title={t("items.versionTitle")}
                    description={t("items.versionLabel", { version: APP_VERSION })}
                    trailing={<span />}
                    disabled
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.dangerZone")}>
                  <SettingsRow
                    icon="delete_forever"
                    title={t("items.deleteAccountTitle")}
                    description={t("items.deleteAccountDescription")}
                    destructive
                    href="/delete-account"
                  />
                  <SettingsDivider />
                  <SettingsRow
                    icon="logout"
                    title={t("items.logOutTitle")}
                    destructive
                    trailing={<span />}
                    onClick={() => setLogoutConfirmOpen(true)}
                  />
                </SettingsSection>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatConfirmDialog
        open={logoutConfirmOpen}
        title={t("logOutDialog.title")}
        description={t("logOutDialog.description")}
        confirmLabel={t("logOutDialog.confirm")}
        destructive
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          handleLogout();
        }}
      />
      <BottomNav />
    </div>
  );
}
