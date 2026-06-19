"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfileDataSection } from "@/components/profile/ProfileDataSection";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { detectUserLocation, isDefaultLocation } from "@/lib/geolocation";
import { buildProfileSections } from "@/lib/profile/formatProfile";
import {
  editFormToUpdatePayload,
  profileToEditForm,
  type ProfileEditFormData,
} from "@/lib/profile/profileForm";
import type { Profile, User } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
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
      return;
    }

    if (!user) return;

    let cancelled = false;

    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const freshProfile = await api.getMyProfile();
        if (cancelled) return;
        applyProfile(freshProfile, user);
      } catch {
        if (cancelled) return;
        applyProfile(user.profile, user);
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, applyProfile]);

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

  if (authLoading || loadingProfile || !profile || !profileUser || !sections || !formData) {
    return (
      <>
        <Navbar />
        <main className="pt-20 min-h-screen flex items-center justify-center bg-surface">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 pb-40 md:pb-16 bg-surface min-h-screen">
        <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-primary/30 via-secondary/50 to-accent/25">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-surface/80" />
        </div>

        <div className="relative z-10 px-5 sm:px-6 -mt-14 sm:-mt-16 md:-mt-20 max-w-7xl mx-auto">
          <div className="flex flex-col items-center md:flex-row md:items-end gap-4 md:gap-6">
            <div className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-[0_12px_32px] shadow-primary/25 overflow-hidden bg-surface-container">
              {profile.photo_url ? (
                <img
                  className="w-full h-full object-cover"
                  alt="Profile"
                  src={profile.photo_url}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl sm:text-6xl text-primary/35">
                    person
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left min-w-0 pb-1 md:pb-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface font-[var(--font-headline)]">
                {profile.full_name || user?.username}
                {profile.age ? (
                  <span className="text-primary">, {profile.age}</span>
                ) : null}
              </h1>
              <p className="mt-1.5 text-on-surface-variant font-medium flex items-center justify-center md:justify-start gap-1">
                <span className="material-symbols-outlined text-base text-primary">location_on</span>
                {profile.location || "Not set"}
              </p>
            </div>

            <div className="hidden md:flex shrink-0 mb-2">
              <button
                onClick={() => (editing ? handleCancelEdit() : setEditing(true))}
                className="px-8 py-3 gradient-brand text-white rounded-full font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-background rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 border border-primary/10 shadow-[0_8px_30px] shadow-primary/8">
              <h3 className="text-lg font-bold mb-4 flex items-center justify-between gap-2 font-[var(--font-headline)] text-on-surface">
                Profile Completeness
                <span className="text-primary text-sm font-bold">{profile.profile_completeness}%</span>
              </h3>
              <div className="w-full h-2.5 bg-secondary rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full gradient-brand rounded-full transition-all"
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

            {profile.is_verified && (
              <div className="bg-secondary/70 rounded-2xl p-5 flex items-center gap-4 border border-primary/10">
                <div className="p-3 gradient-brand-br text-white rounded-full shrink-0">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified_user
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">Verified Identity</p>
                  <p className="text-xs text-on-surface-variant">Document verification completed</p>
                </div>
              </div>
            )}

            <button
              onClick={() => (editing ? handleCancelEdit() : setEditing(true))}
              className="md:hidden w-full py-3.5 rounded-xl gradient-brand text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              {editing ? "Cancel Editing" : "Edit Profile"}
            </button>
          </div>

          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            {editing ? (
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
    </>
  );
}
