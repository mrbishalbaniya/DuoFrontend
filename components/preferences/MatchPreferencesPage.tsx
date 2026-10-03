"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import { PartnerPreferencesFields } from "@/components/profile/PartnerPreferencesFields";
import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";
import { DEFAULT_FILTERS } from "@/lib/discoveryFilters";
import {
  editFormToUpdatePayload,
  profileToEditForm,
  type ProfileEditFormData,
} from "@/lib/profile/profileForm";
import type { Profile } from "@/types";

/** Dedicated page for partner / match preferences (linked from match filters and settings). */
export function PartnerPreferencesPage() {
  const { user, fetchUser } = useAuth();
  const lenis = useLenis();
  const { showErrorToast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(user?.profile ?? null);
  const [formData, setFormData] = useState<ProfileEditFormData | null>(
    user?.profile ? profileToEditForm(user.profile) : null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyProfile()
      .then((fresh) => {
        if (cancelled) return;
        setProfile(fresh);
        setFormData(profileToEditForm(fresh));
      })
      .catch(() => {
        // Keep the profile seeded from the auth context.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((data: Partial<ProfileEditFormData>) => {
    setFormData((prev) => (prev ? { ...prev, ...data } : prev));
    setDirty(true);
    setSaved(false);
  }, []);

  const handleSave = async () => {
    if (!formData || !profile) return;
    setSaving(true);
    try {
      const payload = await editFormToUpdatePayload(formData, profile);
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      setFormData(profileToEditForm(updated));
      setDirty(false);
      setSaved(true);
      await fetchUser();
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : "Could not save your preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!profile) return;
    setFormData(profileToEditForm(profile));
    setDirty(false);
  };

  // Fill in the recommended defaults (same as "Reset" in the match filters).
  // Nothing is saved until the user presses Save.
  const handleResetToDefaults = () => {
    patch({
      pref_gender: DEFAULT_FILTERS.pref_gender,
      pref_age_min: DEFAULT_FILTERS.pref_age_min,
      pref_age_max: DEFAULT_FILTERS.pref_age_max,
      pref_max_distance_km: DEFAULT_FILTERS.pref_max_distance_km,
      pref_relationship_goal: DEFAULT_FILTERS.pref_relationship_goal,
      pref_verified_only: DEFAULT_FILTERS.pref_verified_only,
      pref_location: "",
      pref_min_height: "",
      pref_occupation: "",
      preferredReligion: "",
      interReligion: "yes",
      preferredCaste: "",
      interCaste: "yes",
      preferredRashi: "",
    });
  };

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
          <h1 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">
            Match Preferences
          </h1>
        </header>

        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10"
          data-lenis-prevent
        >
          <div className="mx-auto w-full max-w-3xl space-y-6">
            <div>
              <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">
                Partner Preferences
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tell us who you&apos;d like to meet. These preferences shape who appears in Match.
              </p>
            </div>

            {formData ? (
              <PartnerPreferencesFields formData={formData} patch={patch} />
            ) : (
              <div className="flex justify-center py-16">
                <Loader pageName="Preferences" />
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/match"
                className="text-center text-sm font-semibold text-primary hover:underline sm:text-left"
              >
                Back to Match
              </Link>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1 rounded-full sm:flex-none"
                  disabled={!dirty || saving}
                  onClick={handleReset}
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-full gradient-brand text-white sm:flex-none sm:px-8"
                  disabled={!formData || !dirty || saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving…" : saved && !dirty ? "Saved" : "Save preferences"}
                </Button>
              </div>
            </div>

            {formData ? (
              <div className="border-t border-outline-variant/20 pt-5 text-center">
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-secondary hover:text-primary disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">restart_alt</span>
                  Reset to recommended
                </button>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Fills in the default preferences. Press Save to keep them.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
