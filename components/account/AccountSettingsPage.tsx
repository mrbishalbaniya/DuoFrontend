"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { DuoPhoneInput, type Value as PhoneValue } from "@/components/ui/phone-input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";
import { splitPhoneValue } from "@/lib/phone";
import { cn } from "@/lib/utils";

function formatPhoneLabel(countryCode?: string, phoneNumber?: string): string {
  if (!phoneNumber?.trim()) return "Not set";
  return `${countryCode?.trim() || ""} ${phoneNumber.trim()}`.trim();
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
        verified
      </span>
      Verified
    </span>
  );
}

function InfoRow({
  icon,
  label,
  value,
  badge,
  onEdit,
  children,
}: {
  icon: string;
  label: string;
  value: string;
  badge?: ReactNode;
  onEdit?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-[22px] text-primary">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-on-surface-variant">{label}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <p className="break-all font-semibold text-on-surface">{value}</p>
            {badge}
          </div>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${label.toLowerCase()}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary hover:text-primary"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function LinkRow({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-container-high/40"
    >
      <span className="material-symbols-outlined text-[22px] text-primary">{icon}</span>
      <span className="flex-1 font-semibold text-on-surface">{label}</span>
      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
    </Link>
  );
}

const cardClass =
  "divide-y divide-outline-variant/15 overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30";

export function AccountPage() {
  const { user, fetchUser } = useAuth();
  const { showErrorToast } = useToast();
  const lenis = useLenis();

  const profile = user?.profile;
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  useEffect(() => {
    let cancelled = false;
    api
      .getSecurityOverview()
      .then((overview) => {
        if (cancelled) return;
        setEmailVerified(overview.email_verified);
        setPhoneVerified(overview.phone_verified);
      })
      .catch(() => {
        // Without the overview we can't tell; the phone stays editable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startPhoneEdit = () => {
    setPhoneDraft((profile?.phone_country_code || "+977") + (profile?.phone_number || ""));
    setEditingPhone(true);
  };

  const savePhone = async () => {
    const split = splitPhoneValue(phoneDraft);
    if (!split?.phone_number) {
      showErrorToast("Enter a valid phone number.");
      return;
    }
    setSavingPhone(true);
    try {
      await api.updateProfile({
        phone_country_code: split.phone_country_code,
        phone_number: split.phone_number,
      });
      await fetchUser();
      setEditingPhone(false);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Could not update your phone number.");
    } finally {
      setSavingPhone(false);
    }
  };

  const startUsernameEdit = () => {
    setUsernameDraft(user?.username ?? "");
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    const next = usernameDraft.trim().replace(/^@/, "").toLowerCase();
    if (next.length < 3 || next.length > 30) {
      showErrorToast("Username must be 3-30 characters.");
      return;
    }
    setSavingUsername(true);
    try {
      await api.updateUsername(next);
      await fetchUser();
      setEditingUsername(false);
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Could not update your username.");
    } finally {
      setSavingUsername(false);
    }
  };

  const hasPhone = Boolean(profile?.phone_number?.trim());
  // A verified number is locked; only an unverified or missing one can change.
  const canEditPhone = !(phoneVerified && hasPhone);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <header className="flex shrink-0 items-center gap-3 border-b border-primary/10 px-4 py-3 md:px-6">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <h1 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">Account</h1>
        </header>

        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10"
          data-lenis-prevent
        >
          <div className="mx-auto w-full max-w-2xl space-y-6">
            <p className="text-sm leading-relaxed text-on-surface-variant">
              Manage your username, email and phone.
            </p>
            <div className={cardClass}>
              <InfoRow
                icon="alternate_email"
                label="Username"
                value={user?.username ? `@${user.username}` : "Not set"}
                onEdit={!editingUsername ? startUsernameEdit : undefined}
              >
                {editingUsername ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center rounded-xl border border-primary/20 bg-surface px-3 focus-within:border-primary">
                      <span className="text-on-surface-variant">@</span>
                      <input
                        id="account-username"
                        type="text"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={30}
                        value={usernameDraft}
                        onChange={(e) =>
                          setUsernameDraft(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveUsername();
                        }}
                        className="w-full bg-transparent py-2.5 pl-1 text-sm text-on-surface outline-none"
                        placeholder="your.username"
                      />
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      3-30 characters. Letters, numbers, dots and underscores.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-full"
                        disabled={savingUsername}
                        onClick={() => setEditingUsername(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="rounded-full gradient-brand text-white"
                        disabled={savingUsername}
                        onClick={() => void saveUsername()}
                      >
                        {savingUsername ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </InfoRow>
              <InfoRow
                icon="mail"
                label="Email"
                value={user?.email || "Not set"}
                badge={emailVerified ? <VerifiedBadge /> : null}
              />
              <InfoRow
                icon="phone"
                label="Phone"
                value={formatPhoneLabel(profile?.phone_country_code, profile?.phone_number)}
                badge={phoneVerified && hasPhone ? <VerifiedBadge /> : null}
                onEdit={canEditPhone && !editingPhone ? startPhoneEdit : undefined}
              >
                {editingPhone ? (
                  <div className="mt-4 space-y-3">
                    <DuoPhoneInput
                      id="account-phone"
                      size="compact"
                      value={phoneDraft as PhoneValue}
                      onChange={(value: PhoneValue) => setPhoneDraft(value ?? "")}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="rounded-full"
                        disabled={savingPhone}
                        onClick={() => setEditingPhone(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="rounded-full gradient-brand text-white"
                        disabled={savingPhone}
                        onClick={() => void savePhone()}
                      >
                        {savingPhone ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </InfoRow>
              <InfoRow
                icon="photo_camera_front"
                label="Profile verification"
                value={profile?.is_verified ? "Verified" : "Not verified"}
                badge={profile?.is_verified ? <VerifiedBadge /> : null}
              >
                {!profile?.is_verified ? (
                  <Link
                    href="/verify"
                    className={cn(
                      "mt-3 inline-flex rounded-full gradient-brand px-4 py-1.5 text-sm font-semibold text-white"
                    )}
                  >
                    Verify with a selfie
                  </Link>
                ) : null}
              </InfoRow>
            </div>

            <div className={cardClass}>
              <LinkRow href="/profile" icon="person" label="Edit profile" />
              <LinkRow href="/preferences" icon="favorite" label="Match preferences" />
              <LinkRow href="/security" icon="shield" label="Security" />
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
