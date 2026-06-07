"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { Profile, ProfileFormData } from "@/types";

export default function ProfilePage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: "",
    age: "",
    bio: "",
    location: "",
    education: "",
    occupation: "",
    pref_age_min: 22,
    pref_age_max: 35,
    pref_values: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      const p = user.profile;
      setProfile(p);
      setFormData({
        full_name: p.full_name || "",
        age: p.age || "",
        bio: p.bio || "",
        location: p.location || "",
        education: p.education || "",
        occupation: p.occupation || "",
        pref_age_min: p.pref_age_min || 22,
        pref_age_max: p.pref_age_max || 35,
        pref_values: p.pref_values || "",
      });
    }
  }, [user, authLoading, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(formData);
      await fetchUser();
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !profile) {
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
        {/* Cover banner — no overflow clip on profile info */}
        <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-primary/30 via-secondary/50 to-accent/25">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-surface/80" />
        </div>

        {/* Profile identity — centered on mobile, row on desktop */}
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
                onClick={() => setEditing(!editing)}
                className="px-8 py-3 gradient-brand text-white rounded-full font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                {editing ? "Cancel" : "Edit Profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Sidebar */}
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
              onClick={() => setEditing(!editing)}
              className="md:hidden w-full py-3.5 rounded-xl gradient-brand text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              {editing ? "Cancel Editing" : "Edit Profile"}
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8 md:space-y-12">
            {editing ? (
              <div className="bg-background p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-primary/10 shadow-[0_4px_24px] shadow-primary/6 space-y-6">
                <h2 className="text-2xl font-bold font-[var(--font-headline)] text-on-surface">
                  Edit Profile
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface-variant">Full Name</label>
                    <input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface-variant">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-3 bg-secondary/50 border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-on-surface-variant">Location</label>
                  <input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-on-surface-variant">Education</label>
                  <input
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-on-surface-variant">Occupation</label>
                  <input
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-on-surface-variant">Bio</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 bg-secondary/50 border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/30 resize-none"
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 gradient-brand text-white rounded-full font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              <>
                <section>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-[var(--font-headline)] mb-4 text-on-surface">
                    About Me
                  </h2>
                  <div className="bg-secondary/50 p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-outline-variant/30 shadow-[0_4px_20px] shadow-primary/5">
                    <p className="text-on-surface-variant leading-relaxed text-base sm:text-lg italic">
                      &ldquo;{profile.bio || "No bio yet. Tap Edit Profile to add one!"}&rdquo;
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-background p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-primary/10 shadow-[0_4px_20px] shadow-primary/6">
                    <div className="p-3 bg-secondary text-accent rounded-2xl w-fit mb-6">
                      <span className="material-symbols-outlined">school</span>
                    </div>
                    <h3 className="font-bold text-xl mb-4 font-[var(--font-headline)] text-on-surface">
                      Professional Path
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">
                          Education
                        </p>
                        <p className="text-on-surface font-medium">{profile.education || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-1">
                          Current Role
                        </p>
                        <p className="text-on-surface font-medium">{profile.occupation || "Not provided"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-primary/10 shadow-[0_4px_20px] shadow-primary/6">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl w-fit mb-6">
                      <span className="material-symbols-outlined">style</span>
                    </div>
                    <h3 className="font-bold text-xl mb-4 font-[var(--font-headline)] text-on-surface">
                      Lifestyle
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile.lifestyle_tags || []).length > 0 ? (
                        profile.lifestyle_tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 bg-secondary rounded-full text-xs font-semibold text-primary border border-primary/15"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-on-surface-variant text-sm">No lifestyle tags yet</p>
                      )}
                    </div>
                  </div>
                </div>

                <section className="relative p-6 sm:p-10 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-secondary/80 via-background to-primary/5 border border-primary/10 overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-[var(--font-headline)] mb-6 text-on-surface">
                      Partner Preferences
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-background/80 p-5 rounded-2xl border border-primary/10">
                        <span className="material-symbols-outlined text-primary mb-2">date_range</span>
                        <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wide">
                          Age Range
                        </p>
                        <p className="font-semibold text-on-surface mt-1">
                          {profile.pref_age_min} - {profile.pref_age_max} Years
                        </p>
                      </div>
                      <div className="bg-background/80 p-5 rounded-2xl border border-primary/10">
                        <span className="material-symbols-outlined text-primary mb-2">height</span>
                        <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wide">
                          Min Height
                        </p>
                        <p className="font-semibold text-on-surface mt-1">{profile.pref_min_height}</p>
                      </div>
                      <div className="bg-background/80 p-5 rounded-2xl border border-primary/10">
                        <span className="material-symbols-outlined text-primary mb-2">work</span>
                        <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wide">
                          Occupation
                        </p>
                        <p className="font-semibold text-on-surface mt-1">{profile.pref_occupation}</p>
                      </div>
                    </div>
                    {profile.pref_values && (
                      <div className="mt-6 p-5 bg-background/80 rounded-2xl border border-primary/10">
                        <p className="text-[11px] text-accent font-bold uppercase tracking-wide mb-2">
                          Desired Values
                        </p>
                        <p className="text-on-surface">{profile.pref_values}</p>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
