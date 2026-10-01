"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import api, { type NotificationPreferences } from "@/lib/api";
import {
  SecurityNotice,
  SecurityPageShell,
  SecuritySpinner,
} from "@/components/security/SecurityPageShell";
import { cn } from "@/lib/utils";

type EmailKey =
  | "email_matches"
  | "email_payments"
  | "email_verification"
  | "email_announcements"
  | "email_marketing";

const CATEGORIES: Array<{ key: EmailKey; icon: string; i18n: string }> = [
  { key: "email_matches", icon: "favorite", i18n: "matches" },
  { key: "email_payments", icon: "receipt_long", i18n: "payments" },
  { key: "email_verification", icon: "verified", i18n: "verification" },
  { key: "email_announcements", icon: "campaign", i18n: "announcements" },
  { key: "email_marketing", icon: "local_offer", i18n: "marketing" },
];

const ALWAYS_SENT = ["security", "account"] as const;

function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-primary" : "bg-surface-container-highest",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

function Row({
  icon,
  title,
  description,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 md:px-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-on-surface">{title}</p>
        <p className="mt-0.5 text-sm text-on-surface-variant">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function MailPreferencesPage() {
  const t = useTranslations("mailPrefs");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getNotificationPreferences()
      .then(setPrefs)
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [user, t]);

  // Optimistic update; roll back if the server rejects it.
  const update = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!prefs) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    setSaving(key);
    setError("");
    try {
      setPrefs(await api.updateNotificationPreferences({ [key]: value }));
    } catch {
      setPrefs(previous);
      setError(t("saveError"));
    } finally {
      setSaving(null);
    }
  };

  const masterOn = prefs?.email_enabled ?? true;

  return (
    <SecurityPageShell title={t("title")} backHref="/settings">
      {loading ? (
        <SecuritySpinner />
      ) : (
        <div className="mx-auto w-full max-w-2xl space-y-6">
          {error ? <SecurityNotice tone="error">{error}</SecurityNotice> : null}
          {user?.email ? (
            <p className="px-1 text-sm text-on-surface-variant">
              {t("sendingTo")} <span className="font-semibold text-on-surface">{user.email}</span>
            </p>
          ) : null}

          {prefs ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                <Row icon="mail" title={t("master.title")} description={t("master.description")}>
                  <Switch
                    checked={masterOn}
                    disabled={saving === "email_enabled"}
                    label={t("master.title")}
                    onChange={(v) => void update("email_enabled", v)}
                  />
                </Row>
              </div>

              <section className="space-y-3">
                <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("categoriesHeading")}
                </h2>
                <div
                  className={cn(
                    "divide-y divide-outline-variant/15 overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30 transition-opacity",
                    !masterOn && "opacity-60"
                  )}
                >
                  {CATEGORIES.map((c) => (
                    <Row
                      key={c.key}
                      icon={c.icon}
                      title={t(`categories.${c.i18n}.title`)}
                      description={t(`categories.${c.i18n}.description`)}
                    >
                      <Switch
                        checked={masterOn && prefs[c.key]}
                        disabled={!masterOn || saving === c.key}
                        label={t(`categories.${c.i18n}.title`)}
                        onChange={(v) => void update(c.key, v)}
                      />
                    </Row>
                  ))}
                </div>
                {!masterOn ? (
                  <p className="px-1 text-xs text-on-surface-variant">{t("masterOffHint")}</p>
                ) : null}
              </section>

              <section className="space-y-3">
                <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {t("alwaysHeading")}
                </h2>
                <div className="divide-y divide-outline-variant/15 overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                  {ALWAYS_SENT.map((k) => (
                    <Row
                      key={k}
                      icon={k === "security" ? "lock" : "manage_accounts"}
                      title={t(`always.${k}.title`)}
                      description={t(`always.${k}.description`)}
                    >
                      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                        {t("alwaysOn")}
                      </span>
                    </Row>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      )}
    </SecurityPageShell>
  );
}
