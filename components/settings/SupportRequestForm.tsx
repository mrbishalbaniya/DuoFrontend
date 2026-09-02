"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { SupportRequestCategory } from "@/types";
import {
  SecurityNotice,
  SecurityPageShell,
} from "@/components/security/SecurityPageShell";

export function SupportRequestForm({
  title,
  icon,
  intro,
  category,
  subjectLabel,
  subjectPlaceholder,
  messageLabel,
  messagePlaceholder,
  submitLabel,
  includeDeviceInfo = false,
}: {
  title: string;
  icon: string;
  intro: string;
  category: SupportRequestCategory;
  subjectLabel: string;
  subjectPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitLabel: string;
  includeDeviceInfo?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.submitSupportRequest({
        category,
        subject: subject.trim(),
        message: message.trim(),
        contact_email: email.trim(),
        device_info: includeDeviceInfo && typeof navigator !== "undefined" ? navigator.userAgent : "",
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SecurityPageShell title={title} backHref="/help">
      {done ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <p className="font-semibold text-on-surface">Thanks — we've got it</p>
          <p className="max-w-xs text-sm text-on-surface-variant">
            Our team will review your message and follow up by email if needed.
          </p>
          <button
            type="button"
            onClick={() => router.push("/help")}
            className="mt-2 rounded-full px-5 py-2.5 text-sm font-bold text-white gradient-brand"
          >
            Back to Help
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-secondary/30 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <p className="text-sm text-on-surface-variant">{intro}</p>
          </div>

          {error ? <SecurityNotice tone="error">{error}</SecurityNotice> : null}

          <div className="space-y-2">
            <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="support-subject">
              {subjectLabel}
            </label>
            <input
              id="support-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={subjectPlaceholder}
              maxLength={200}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="support-message">
              {messageLabel}
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messagePlaceholder}
              required
              minLength={5}
              rows={6}
              className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="support-email">
              Contact email
            </label>
            <input
              id="support-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || message.trim().length < 5}
            className="w-full rounded-xl py-3.5 text-sm font-bold text-white gradient-brand disabled:opacity-50"
          >
            {submitting ? "Sending..." : submitLabel}
          </button>
        </form>
      )}
    </SecurityPageShell>
  );
}
