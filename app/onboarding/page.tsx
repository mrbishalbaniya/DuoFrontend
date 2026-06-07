"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { OnboardingFormData } from "@/types";

export default function OnboardingPage() {
  const { user, register, fetchUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(user ? 2 : 1);
  const [formData, setFormData] = useState<OnboardingFormData>({
    username: "", email: "", password: "",
    full_name: "", age: "", gender: "M",
    religion: "Hindu", education: "", occupation: "",
    work_preference: "Private", bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof OnboardingFormData, value: string) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(formData.username, formData.email, formData.password, formData.full_name);
      setStep(2);
    } catch (err) {
      setError("Registration failed. Username may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.updateProfile({
        full_name: formData.full_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        religion: formData.religion,
        education: formData.education,
        occupation: formData.occupation,
        work_preference: formData.work_preference,
        bio: formData.bio,
        is_onboarded: true,
      });
      await fetchUser();
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const religions = ["Hindu", "Buddhist", "Christian", "Muslim", "Other"];
  const workPrefs = [
    { value: "Private", label: "Private Sector" },
    { value: "Government", label: "Government" },
    { value: "Business", label: "Business/Self-Employed" },
    { value: "NotWorking", label: "Not Working" },
  ];

  return (
    <div className="bg-surface font-[var(--font-body)] text-on-surface min-h-screen">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface/60 backdrop-blur-xl shadow-[0_40px_40px_-15px_rgba(33,79,199,0.04)]">
        <div className="text-2xl font-black gradient-brand bg-clip-text text-transparent font-[var(--font-headline)]">
          Duo
        </div>
        <Link href="/" className="flex items-center justify-center p-2 rounded-full hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </Link>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-2xl mx-auto">
        <div className="mb-10 px-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-primary font-[var(--font-headline)] font-bold text-sm tracking-wider uppercase">
                Step {step} of 2
              </span>
              <h1 className="text-3xl font-[var(--font-headline)] font-extrabold text-on-surface mt-1">
                {step === 1 ? "Create Account" : "Your Profile"}
              </h1>
            </div>
            <div className="text-on-surface-variant font-medium text-sm">{step * 50}% Complete</div>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full gradient-brand rounded-full transition-all duration-500"
              style={{ width: `${step * 50}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 mx-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1}>
            <section className="glass-card rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(33,79,199,0.05)] border border-white/40 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface ml-1">Full Name</label>
                  <input value={formData.full_name} onChange={(e) => update("full_name", e.target.value)} className="w-full px-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline shadow-sm outline-none" placeholder="Your full name" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface ml-1">Username</label>
                  <input value={formData.username} onChange={(e) => update("username", e.target.value)} className="w-full px-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline shadow-sm outline-none" placeholder="Choose a username" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface ml-1">Email</label>
                <input value={formData.email} onChange={(e) => update("email", e.target.value)} type="email" className="w-full px-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline shadow-sm outline-none" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface ml-1">Password</label>
                <input value={formData.password} onChange={(e) => update("password", e.target.value)} type="password" className="w-full px-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline shadow-sm outline-none" placeholder="At least 6 characters" required minLength={6} />
              </div>
            </section>
            <div className="mt-10 flex gap-4">
              <Link href="/login" className="flex-1 py-4 px-6 rounded-full font-[var(--font-headline)] font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-all active:scale-95 text-center">
                Back to Login
              </Link>
              <button type="submit" disabled={loading} className="flex-[2] py-4 px-6 rounded-full font-[var(--font-headline)] font-bold text-white gradient-brand shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
                {loading ? "Creating..." : "Continue"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStep2}>
            <section className="glass-card rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(33,79,199,0.05)] border border-white/40 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface ml-1">Full Name</label>
                  <input value={formData.full_name} onChange={(e) => update("full_name", e.target.value)} className="w-full px-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface shadow-sm outline-none" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface ml-1">Age</label>
                  <input value={formData.age} onChange={(e) => update("age", e.target.value)} type="number" min={18} max={60} className="w-full px-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface shadow-sm outline-none" required />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-on-surface ml-1">Religion</label>
                <div className="flex flex-wrap gap-2">
                  {religions.map((r) => (
                    <button key={r} type="button" onClick={() => update("religion", r)}
                      className={`px-4 py-2 rounded-[1rem] text-sm font-medium transition-colors ${formData.religion === r ? "bg-primary-container text-white" : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-high"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-outline-variant opacity-20"></div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface ml-1">Education</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">school</span>
                  <input value={formData.education} onChange={(e) => update("education", e.target.value)} className="w-full pl-12 pr-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline shadow-sm outline-none" placeholder="Highest Degree" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface ml-1">Occupation</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">work</span>
                  <input value={formData.occupation} onChange={(e) => update("occupation", e.target.value)} className="w-full pl-12 pr-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline shadow-sm outline-none" placeholder="Current Occupation" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-outline-variant uppercase tracking-widest ml-1">Work Preference</label>
                <div className="flex flex-wrap gap-2">
                  {workPrefs.map((wp) => (
                    <button key={wp.value} type="button" onClick={() => update("work_preference", wp.value)}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${formData.work_preference === wp.value ? "bg-primary-container text-white shadow-sm" : "bg-surface-variant text-on-surface-variant hover:bg-surface-container-high"}`}>
                      {wp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface ml-1">About you</label>
                <textarea value={formData.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className="w-full px-5 py-4 bg-white border-0 rounded-xl focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-outline shadow-sm outline-none resize-none" placeholder="Tell us about yourself..." />
              </div>
            </section>

            <div className="mt-10 flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 px-6 rounded-full font-[var(--font-headline)] font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-all active:scale-95 text-center">
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-[2] py-4 px-6 rounded-full font-[var(--font-headline)] font-bold text-white gradient-brand shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? "Saving..." : "Start Matching"}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
