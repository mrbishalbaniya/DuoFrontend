"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfileDataSection } from "@/components/profile/ProfileDataSection";
import {
  ProfileHeaderSkeleton,
  ProfileSectionsSkeleton,
  ProfileSidebarSkeleton,
} from "@/components/profile/ProfilePageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { detectUserLocation, isDefaultLocation } from "@/lib/geolocation";
import { buildProfileSections } from "@/lib/profile/formatProfile";
import {
  editFormToUpdatePayload,
  profileToEditForm,
  type ProfileEditFormData,
} from "@/lib/profile/profileForm";
import { resolveMediaUrl, resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { Profile, User } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const lenis = useLenis();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileEditFormData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const applyProfile = useCallback((freshProfile: Profile, currentUser: User) => {
    setProfile(freshProfile);
    setProfileUser(currentUser);
    setFormData(profileToEditForm(freshProfile));
  }, []);

  const handleDetectLocation = async () => {
    if (!formData) return;
    setDetectingLocation(true);
    setLocationError(null);
    try {
      const detected = await detectUserLocation();
      setFormData((prev) => (prev ? { ...prev, location: detected.label } : prev));
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : "Could not detect your location."
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  useEffect(() => {
    if (!user || profile) return;
    applyProfile(user.profile, user);
  }, [user, profile, applyProfile]);

  useEffect(() => {
    if (!user || authLoading) return;

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const freshProfile = await api.getMyProfile();
        if (cancelled) return;
        applyProfile(freshProfile, user);
      } catch {
        // Keep profile seeded from auth context.
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, applyProfile]);

  useEffect(() => {
    if (!editing || !formData) return;
    if (!isDefaultLocation(formData.location)) return;

    let cancelled = false;
    setDetectingLocation(true);
    setLocationError(null);

    detectUserLocation()
      .then((detected) => {
        if (!cancelled) {
          setFormData((prev) => (prev ? { ...prev, location: detected.label } : prev));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLocationError(
            error instanceof Error ? error.message : "Could not detect your location."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDetectingLocation(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editing]);

  const handleCancelEdit = () => {
    if (profile) {
      setFormData(profileToEditForm(profile));
    }
    setSaveError(null);
    setLocationError(null);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!formData || !profile) return;

    setSaving(true);
    setSaveError(null);
    try {
      const payload = await editFormToUpdatePayload(formData, profile);
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      setFormData(profileToEditForm(updated));
      await fetchUser();
      setEditing(false);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const sections =
    profile && profileUser ? buildProfileSections(profileUser, profile) : null;
  const showContentSkeleton =
    authLoading || !profile || !profileUser || !sections || !formData;

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <main
        className="mobile-bottom-nav-offset min-h-0 min-w-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain md:pb-8"
        data-lenis-prevent
        aria-busy={showContentSkeleton}
      >
        <div className="relative h-32 bg-gradient-to-br from-primary/30 via-secondary/50 to-accent/25 sm:h-40 md:h-48">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-surface/80" />
        </div>

        <div className="relative z-10 mx-auto -mt-14 max-w-7xl px-5 sm:-mt-16 sm:px-6 md:-mt-20">
          {showContentSkeleton ? (
            <ProfileHeaderSkeleton />
          ) : (
            <div className="flex flex-col items-start gap-4 md:flex-row md:items-end md:gap-6">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-background bg-surface-container shadow-[0_12px_32px] shadow-primary/25 sm:h-32 sm:w-32 md:h-40 md:w-40">
                <img
                    className="h-full w-full object-cover"
                    alt="Profile"
                    src={resolveProfilePhotoUrl(profile)}
                  />
              </div>

              <div className="min-w-0 flex-1 pb-1 text-left md:pb-3">
                <h1 className="font-[var(--font-headline)] text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl md:text-4xl">
                  {profile.full_name || user?.username}
                  {profile.age ? (
                    <span className="text-primary">, {profile.age}</span>
                  ) : null}
                </h1>
                <p className="mt-1.5 flex items-center gap-1 font-medium text-on-surface-variant">
                  <span className="material-symbols-outlined text-base text-primary">location_on</span>
                  {profile.location || "Not set"}
                </p>
              </div>

              <div className="mb-2 hidden shrink-0 md:flex">
                <button
                  onClick={() => (editing ? handleCancelEdit() : setEditing(true))}
                  className="rounded-full px-8 py-3 font-semibold text-white shadow-lg shadow-primary/20 transition-all gradient-brand active:scale-95"
                >
                  {editing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-5 sm:px-6 md:mt-10 md:gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4 lg:col-start-1">
            {showContentSkeleton ? (
              <ProfileSidebarSkeleton />
            ) : (
              <>
                <div className="rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_8px_30px] shadow-primary/8 sm:rounded-[2rem] sm:p-8">
                  <h3 className="mb-4 flex items-center justify-between gap-2 font-[var(--font-headline)] text-lg font-bold text-on-surface">
                    Profile Completeness
                    <span className="text-sm font-bold text-primary">
                      {profile.profile_completeness}%
                    </span>
                  </h3>
                  <div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full gradient-brand transition-all"
                      style={{ width: `${profile.profile_completeness}%` }}
                    />
                  </div>
                  <ul className="space-y-3.5">
                    {[
                      { done: !!profile.full_name, label: "Full name added" },
                      { done: !!profile.education, label: "Education details" },
                      { done: !!profile.bio, label: "Bio written" },
                      { done: profile.is_verified, label: "Identity verified" },
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
                        <span
                          className={`material-symbols-outlined text-lg ${item.done ? "text-accent" : "text-primary/30"}`}
                          style={item.done ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {item.done ? "check_circle" : "add_circle"}
                        </span>
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/avatar")}
                  className="flex w-full items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10"
                >
                  <div className="gradient-brand-br shrink-0 rounded-full p-3 text-white">
                    <span className="material-symbols-outlined">view_in_ar</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-on-surface">Avatar Studio</p>
                    <p className="text-xs text-on-surface-variant">
                      Create your 3D avatar for the globe
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    chevron_right
                  </span>
                </button>

                {profile.is_verified ? (
                  <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-secondary/70 p-5">
                    <div className="gradient-brand-br shrink-0 rounded-full p-3 text-white">
                      <span
                        className="material-symbols-outlined"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified_user
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">Verified Profile</p>
                      <p className="text-xs text-on-surface-variant">
                        Selfie verification completed
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/verify")}
                    className="flex w-full items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left transition-colors hover:bg-primary/10"
                  >
                    <div className="shrink-0 rounded-full bg-primary/10 p-3 text-primary">
                      <span className="material-symbols-outlined">photo_camera_front</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-on-surface">Verify your profile</p>
                      <p className="text-xs text-on-surface-variant">
                        Take a selfie to earn a verified badge
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      chevron_right
                    </span>
                  </button>
                )}

                <button
                  onClick={() => (editing ? handleCancelEdit() : setEditing(true))}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all gradient-brand active:scale-[0.98] md:hidden"
                >
                  {editing ? "Cancel Editing" : "Edit Profile"}
                </button>
              </>
            )}
          </div>

          <div className="space-y-8 md:space-y-12 lg:col-span-8 lg:col-start-5">
            {showContentSkeleton ? (
              <ProfileSectionsSkeleton />
            ) : editing ? (
              <ProfileEditForm
                formData={formData}
                onChange={setFormData}
                onSave={() => void handleSave()}
                onCancel={handleCancelEdit}
                saving={saving}
                saveError={saveError}
                detectingLocation={detectingLocation}
                locationError={locationError}
                onDetectLocation={() => void handleDetectLocation()}
              />
            ) : (
              <div className="space-y-6 md:space-y-8">
                {sections.photos.length > 0 ? (
                  <ProfileDataSection title="Photos" icon="photo_library">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {sections.photos.map((url, index) => (
                        <div
                          key={`${url}-${index}`}
                          className="overflow-hidden rounded-2xl border border-outline-variant/20"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Profile photo ${index + 1}`}
                            className="aspect-[3/4] w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </ProfileDataSection>
                ) : null}

                <ProfileDataSection title="Account" icon="account_circle" fields={sections.account} />
                <ProfileDataSection title="Personal" icon="person" fields={sections.personal} />
                <ProfileDataSection title="About Me" icon="format_quote" fields={sections.about} />
                <ProfileDataSection
                  title="Education & Career"
                  icon="school"
                  fields={sections.education}
                />
                <ProfileDataSection
                  title="Religion & Background"
                  icon="temple_hindu"
                  fields={sections.background}
                />

                <ProfileDataSection title="Lifestyle & Interests" icon="style">
                  {sections.lifestyleTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {sections.lifestyleTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-primary/15 bg-secondary px-3 py-1.5 text-xs font-semibold text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">No lifestyle tags yet.</p>
                  )}
                </ProfileDataSection>

                <ProfileDataSection
                  title="Partner Preferences"
                  icon="favorite"
                  fields={sections.preferences}
                />
                <ProfileDataSection title="Profile Status" icon="verified" fields={sections.status} />
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
