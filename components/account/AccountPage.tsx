"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

function formatPhoneLabel(countryCode?: string, phoneNumber?: string): string {
  if (!phoneNumber?.trim()) return "Not set";
  const code = countryCode?.trim() || "";
  return `${code}${phoneNumber.trim()}`.trim();
}

function AccountInfoCard({
  icon,
  title,
  value,
  description,
  href,
}: {
  icon: string;
  title: string;
  value: string;
  description?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium uppercase tracking-wider text-on-surface-variant">
            {title}
          </p>
          <p className="mt-1 text-lg font-semibold text-on-surface break-words">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
          )}
        </div>
        {href && (
          <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
            edit
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-2xl border border-primary/10 bg-secondary/30 px-5 py-5 transition-colors hover:bg-surface-container-high/40 md:px-6 md:py-6"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/10 bg-secondary/30 px-5 py-5 md:px-6 md:py-6">
      {content}
    </div>
  );
}

export function AccountPage() {
  const { user } = useAuth();
  const lenis = useLenis();

  const profile = user?.profile;
  const isVerified = profile?.is_verified;
  const phoneLabel = formatPhoneLabel(profile?.phone_country_code, profile?.phone_number);
  const usernameLabel = user?.username ? `@${user.username}` : "Not set";

  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-12"
          data-lenis-prevent
        >
          <div className="mx-auto w-full max-w-3xl">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
              <Link
                href="/settings"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container-high/60 transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface">arrow_back</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-on-surface md:text-3xl">
                  Account Information
                </h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                  View and manage your account details
                </p>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <AccountInfoCard
                icon="mail"
                title="Email Address"
                value={user?.email ?? "—"}
                description="Your email is used for login and important notifications"
              />

              <AccountInfoCard
                icon="alternate_email"
                title="Username"
                value={usernameLabel}
                description="Your unique identifier on Duo"
                href="/profile"
              />

              <AccountInfoCard
                icon="phone"
                title="Phone Number"
                value={phoneLabel}
                description="Used for account security and verification"
                href="/profile"
              />

              {/* Verification Status */}
              {isVerified ? (
                <div className="rounded-2xl border border-accent/20 bg-accent/10 px-5 py-5 md:px-6 md:py-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium uppercase tracking-wider text-accent">
                        Verification Status
                      </p>
                      <p className="mt-1 text-lg font-semibold text-on-surface">
                        Verified Profile
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Your identity has been verified with a selfie
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/verify"
                  className="block rounded-2xl border border-primary/10 bg-secondary/30 px-5 py-5 transition-colors hover:bg-surface-container-high/40 md:px-6 md:py-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[24px]">
                        photo_camera_front
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium uppercase tracking-wider text-on-surface-variant">
                        Verification Status
                      </p>
                      <p className="mt-1 text-lg font-semibold text-on-surface">
                        Not Verified
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        Take a selfie to earn a verified badge
                      </p>
                    </div>
                    <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="mb-4 px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Quick Actions
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-4 transition-colors hover:bg-surface-container-high/60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">Edit Profile</p>
                    <p className="text-xs text-on-surface-variant">Photos, bio & more</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    chevron_right
                  </span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-4 transition-colors hover:bg-surface-container-high/60"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">Personal Info</p>
                    <p className="text-xs text-on-surface-variant">Name, birthday & more</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    chevron_right
                  </span>
                </Link>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low/50 px-4 py-4 md:px-5 md:py-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <div className="text-sm text-on-surface-variant">
                  <p>
                    To update your email address or delete your account, please contact support.
                    For security reasons, these actions require additional verification.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
