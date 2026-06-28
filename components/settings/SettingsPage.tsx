"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent } from "react";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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

function SettingsRow({
  icon,
  title,
  description,
  href,
  onClick,
  trailing,
}: {
  icon: string;
  title: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-on-surface">{title}</p>
        {description ? (
          <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>
        ) : null}
      </div>
      {trailing ?? (
        <span className="material-symbols-outlined shrink-0 text-on-surface-variant">chevron_right</span>
      )}
    </>
  );

  const className =
    "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-container-high/60 md:px-5 md:py-5";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const lenis = useLenis();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isVerified = user?.profile?.is_verified;

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

  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      setPasswordMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setPasswordSaving(false);
    }
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
            <SettingsSection title="Verification">
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
                    <p className="font-semibold text-on-surface">Verified Profile</p>
                    <p className="text-sm text-on-surface-variant">Your identity is verified.</p>
                  </div>
                </div>
              ) : (
                <SettingsRow
                  icon="photo_camera_front"
                  title="Verify your profile"
                  description="Take a selfie to earn a verified badge"
                  href="/verify"
                />
              )}
            </SettingsSection>

                <SettingsSection title="Appearance">
                  <div className="px-4 py-4 md:px-5 md:py-5">
                    <p className="mb-3 text-sm text-on-surface-variant">Theme</p>
                    <div className="flex gap-2 sm:gap-3">
                  <ThemeOption
                    mode="dark"
                    label="Dark"
                    icon="dark_mode"
                    active={theme === "dark"}
                    onSelect={setTheme}
                  />
                  <ThemeOption
                    mode="light"
                    label="Light"
                    icon="light_mode"
                    active={theme === "light"}
                    onSelect={setTheme}
                  />
                  <ThemeOption
                    mode="system"
                    label="System"
                    icon="routine"
                    active={theme === "system"}
                    onSelect={setTheme}
                  />
                </div>
              </div>
            </SettingsSection>
              </div>

              <div className="space-y-6">
            <SettingsSection title="Security">
              <form onSubmit={(e) => void handlePasswordChange(e)} className="space-y-0">
                <div className="space-y-3 px-4 py-4 md:px-5 md:py-5">
                  <p className="text-sm font-semibold text-on-surface">Change password</p>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 md:py-3.5"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 md:py-3.5"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20 md:py-3.5"
                  />
                  {passwordError ? (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  ) : null}
                  {passwordMessage ? (
                    <p className="text-sm text-accent">{passwordMessage}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                    className="w-full rounded-xl py-3 text-sm font-bold text-white gradient-brand disabled:opacity-50 md:py-3.5"
                  >
                    {passwordSaving ? "Updating…" : "Update password"}
                  </button>
                </div>
              </form>
            </SettingsSection>

            <SettingsSection title="Account">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 px-4 py-4 md:px-5 md:py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-on-surface-variant md:h-11 md:w-11">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">Email</p>
                  <p className="truncate text-sm text-on-surface-variant">{user?.email ?? "—"}</p>
                </div>
              </div>
              <SettingsRow
                icon="person"
                title="Edit profile"
                description="Update photos, bio, and preferences"
                href="/profile"
              />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-4 text-left text-red-400 transition-colors hover:bg-red-500/10 md:px-5 md:py-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 md:h-11 md:w-11">
                  <span className="material-symbols-outlined">logout</span>
                </div>
                <span className="font-semibold">Log out</span>
              </button>
            </SettingsSection>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
