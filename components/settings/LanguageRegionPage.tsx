"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  SecurityNotice,
  SecurityPageShell,
  SecuritySpinner,
} from "@/components/security/SecurityPageShell";
import { cn } from "@/lib/utils";

const LANGUAGES: Array<{ code: "en" | "ne"; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
];

const REGIONS = ["Nepal", "India", "United States", "United Kingdom", "Australia", "Other"];

export function LanguageRegionPage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const router = useRouter();
  const [language, setLanguage] = useState<"en" | "ne">("en");
  const [region, setRegion] = useState("Nepal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getMyProfile()
      .then((profile) => {
        setLanguage((profile.app_language as "en" | "ne") || "en");
        setRegion(profile.app_region || "Nepal");
      })
      .catch(() => setError("Could not load your language settings."))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (next: { language?: "en" | "ne"; region?: string }) => {
    const nextLanguage = next.language ?? language;
    const nextRegion = next.region ?? region;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.updateProfile({ app_language: nextLanguage, app_region: nextRegion });
      setLanguage(nextLanguage);
      setRegion(nextRegion);
      setNotice("Saved.");
      void fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SecurityPageShell title="Language & region" backHref="/settings">
      {loading ? (
        <SecuritySpinner />
      ) : (
        <div className="space-y-6">
          {error ? <SecurityNotice tone="error">{error}</SecurityNotice> : null}
          {notice ? <SecurityNotice>{notice}</SecurityNotice> : null}

          <section className="space-y-3">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              App language
            </h2>
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
              {LANGUAGES.map((option, idx) => (
                <div key={option.code}>
                  {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave({ language: option.code })}
                    className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-surface-container-high/60 disabled:opacity-60 md:px-5"
                  >
                    <div>
                      <p className="font-semibold text-on-surface">{option.label}</p>
                      <p className="text-sm text-on-surface-variant">{option.native}</p>
                    </div>
                    {language === option.code ? (
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    ) : (
                      <span className="h-5 w-5 rounded-full border-2 border-outline-variant/40" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <p className="px-1 text-xs text-on-surface-variant">
              Duo's interface is currently available in English. Nepali translations are on the way —
              your preference is saved and will apply automatically once ready.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Region
            </h2>
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
              {REGIONS.map((option, idx) => (
                <div key={option}>
                  {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave({ region: option })}
                    className={cn(
                      "flex w-full items-center justify-between px-4 py-3.5 text-left font-medium transition-colors hover:bg-surface-container-high/60 disabled:opacity-60 md:px-5",
                      region === option ? "text-primary" : "text-on-surface"
                    )}
                  >
                    {option}
                    {region === option ? (
                      <span className="material-symbols-outlined text-primary">check</span>
                    ) : null}
                  </button>
                </div>
              ))}
            </div>
            <p className="px-1 text-xs text-on-surface-variant">
              Used for regional content and formatting — this doesn't affect who you match with.
            </p>
          </section>
        </div>
      )}
    </SecurityPageShell>
  );
}
