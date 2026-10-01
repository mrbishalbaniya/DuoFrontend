"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, type ReactNode } from "react";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import api from "@/lib/api";
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

function LogoutDialog({
  open,
  title,
  confirmLabel,
  cancelLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        className="w-full max-w-sm rounded-3xl border border-outline-variant/20 bg-surface-container p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <span className="material-symbols-outlined text-3xl">logout</span>
        </div>
        <h2 id="logout-title" className="mt-4 text-xl font-bold text-on-surface">
          {title}
        </h2>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="w-full rounded-full border border-outline-variant/40 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-secondary"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const lenis = useLenis();

  const profile = user?.profile;
  const isVerified = profile?.is_verified;
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Same live balance as the Wallet page; the profile value is only a fallback.
  const [walletCoins, setWalletCoins] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .getWallet()
      .then((wallet) => {
        if (!cancelled) setWalletCoins(wallet.coins ?? wallet.balance ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);
  const coinBalance = walletCoins ?? profile?.wallet_balance ?? null;

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
                      coinBalance != null ? (
                        <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-on-surface">
                          <span className="text-base leading-none" aria-hidden>🪙</span>
                          {coinBalance.toLocaleString("en-NP")}
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

                <SettingsSection title={t("sections.matchPreferences")}>
                  <SettingsRow
                    icon="favorite"
                    title={t("items.matchPrefsTitle")}
                    description={t("items.matchPrefsDescription")}
                    href="/preferences"
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.appearance")}>
                  <SettingsRow
                    icon="palette"
                    title={t("items.themeLabel")}
                    description={
                      theme === "dark"
                        ? t("items.themeDark")
                        : theme === "light"
                          ? t("items.themeLight")
                          : t("items.themeSystem")
                    }
                    href="/settings/Appearance"
                  />
                </SettingsSection>

                <SettingsSection title={t("sections.notifications")}>
                  <SettingsRow
                    icon="notifications"
                    title={t("items.notificationPrefsTitle")}
                    description={t("items.notificationPrefsDescription")}
                    href="/notifications"
                  />
                  <SettingsRow
                    icon="mail"
                    title={t("items.emailPrefsTitle")}
                    description={t("items.emailPrefsDescription")}
                    href="/settings/mails"
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

      <LogoutDialog
        open={logoutConfirmOpen}
        title={t("logOutDialog.title")}
        confirmLabel={t("logOutDialog.confirm")}
        cancelLabel={t("logOutDialog.cancel")}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          handleLogout();
        }}
      />
      <BottomNav />
    </div>
  );
}
