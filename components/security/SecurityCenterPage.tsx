"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { SecurityOverview } from "@/types";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "./SecurityPageShell";

const ACTION_HREFS: Record<string, string> = {
  two_factor: "/security/two-factor",
  email: "/profile",
  phone: "/profile",
  biometric: "/security/two-factor",
  devices: "/security/devices",
};

function ScoreRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped >= 80 ? "#60bb46" : clamped >= 50 ? "#f5a623" : "#ef4444";
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
      <svg viewBox="0 0 96 96" className="h-28 w-28 -rotate-90">
        <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-outline-variant/20" />
        <circle
          cx="48"
          cy="48"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold tabular-nums text-on-surface">{clamped}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">score</span>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  value,
  tone,
}: {
  href: string;
  icon: string;
  title: string;
  value: string;
  tone?: "warning" | "critical";
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-container-high/60 md:px-5"
    >
      <div
        className={
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
          (tone === "critical"
            ? "bg-red-500/10 text-red-400"
            : tone === "warning"
              ? "bg-amber-500/10 text-amber-500"
              : "bg-primary/10 text-primary")
        }
      >
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-on-surface">{title}</p>
        <p className="mt-0.5 text-sm text-on-surface-variant">{value}</p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-on-surface-variant">chevron_right</span>
    </Link>
  );
}

export function SecurityCenterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getSecurityOverview()
      .then(setOverview)
      .catch(() => setError("Could not load your security overview."))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <SecurityPageShell title="Security Center" backHref="/settings">
      {loading ? (
        <SecuritySpinner pageName="Security Center" />
      ) : error ? (
        <SecurityNotice tone="error">{error}</SecurityNotice>
      ) : overview ? (
        <div className="space-y-6">
          <div className="flex items-center gap-5 rounded-2xl border border-primary/10 bg-secondary/30 p-5">
            <ScoreRing score={overview.security_score} />
            <div>
              <p className="font-semibold text-on-surface">Your security score</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {overview.security_score >= 80
                  ? "Great job — your account is well protected."
                  : overview.security_score >= 50
                    ? "Decent, but there's room to lock things down further."
                    : "Your account could use stronger protection."}
              </p>
            </div>
          </div>

          {overview.recommendations.length > 0 ? (
            <section className="space-y-3">
              <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Recommendations
              </h2>
              <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                {overview.recommendations.map((rec, idx) => (
                  <div key={rec.id}>
                    {idx > 0 ? <div className="border-t border-outline-variant/20" /> : null}
                    <Link
                      href={ACTION_HREFS[rec.action] ?? "/security"}
                      className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-container-high/60 md:px-5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                        <span className="material-symbols-outlined text-[20px]">priority_high</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-on-surface">{rec.title}</p>
                        <p className="mt-0.5 text-sm text-on-surface-variant">{rec.description}</p>
                      </div>
                      <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
                        chevron_right
                      </span>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Manage
            </h2>
            <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
              <QuickLink
                href="/security/two-factor"
                icon="phonelink_lock"
                title="Two-factor authentication"
                value={overview.two_factor_enabled ? `Enabled via ${overview.two_factor_method === "totp" ? "authenticator app" : "email"}` : "Off"}
              />
              <div className="border-t border-outline-variant/20" />
              <QuickLink
                href="/security/devices"
                icon="devices"
                title="Active devices"
                value={`${overview.active_devices} device${overview.active_devices === 1 ? "" : "s"} signed in`}
              />
              <div className="border-t border-outline-variant/20" />
              <QuickLink
                href="/security/login-history"
                icon="history"
                title="Login history"
                value="Review recent sign-in activity"
              />
              <div className="border-t border-outline-variant/20" />
              <QuickLink
                href="/security/alerts"
                icon="notifications_active"
                title="Security alerts"
                value={overview.unread_alerts > 0 ? `${overview.unread_alerts} unread` : "All caught up"}
                tone={overview.unread_alerts > 0 ? "warning" : undefined}
              />
            </div>
          </section>

          {overview.recent_suspicious ? (
            <SecurityNotice tone="error">
              We noticed unusual activity on your account recently. Review your login history and alerts below.
            </SecurityNotice>
          ) : null}
        </div>
      ) : null}
    </SecurityPageShell>
  );
}
