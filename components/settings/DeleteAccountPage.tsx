"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  SecurityNotice,
  SecurityPageShell,
} from "@/components/security/SecurityPageShell";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Submitting the form only opens the final "are you sure?" dialog.
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setConfirmOpen(true);
  };

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, submitting]);

  const handleDelete = async () => {
    setError("");
    setSubmitting(true);
    try {
      await api.deleteAccount(password, reason.trim());
      logout();
      router.push("/login?deleted=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <SecurityPageShell title="Delete account" backHref="/settings">
      {step === "warning" ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <p className="font-semibold text-red-400">This can&apos;t be easily undone</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Deleting your account will immediately:
              </p>
            </div>
          </div>

          <ul className="space-y-3 px-1">
            {[
              "Hide your profile from Discovery and remove you from everyone's matches",
              "Sign you out of every device, including this one",
              "Stop all notifications, calls, and messages from reaching you",
              "Cancel any active Premium subscription (unused coins are not refunded)",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-sm text-on-surface-variant">
                <span className="material-symbols-outlined mt-0.5 text-base text-red-400">close</span>
                {line}
              </li>
            ))}
          </ul>

          <p className="rounded-xl bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
            Your account is deactivated right away; some data may be retained for a limited period
            for legal and safety reasons. To request permanent erasure of your data, contact support
            after deleting your account.
          </p>

          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/15"
          >
            Continue to delete my account
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? <SecurityNotice tone="error">{error}</SecurityNotice> : null}

          <div className="space-y-2">
            <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="delete-reason">
              Tell us why you&apos;re leaving (optional)
            </label>
            <textarea
              id="delete-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="This helps us improve Duo"
              className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="delete-password">
              Confirm your password
            </label>
            <input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Leave blank if you signed in with Google"
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="delete-confirm-text">
              Type <span className="font-mono text-red-400">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              id="delete-confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm uppercase tracking-widest text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("warning")}
              className="flex-1 rounded-xl border border-outline-variant/30 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || confirmText.trim().toUpperCase() !== CONFIRM_PHRASE}
              className="flex-1 rounded-xl bg-red-500 py-3.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Delete my account"}
            </button>
          </div>
        </form>
      )}

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !submitting && setConfirmOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-sm rounded-3xl border border-outline-variant/20 bg-surface-container p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <h2 id="delete-title" className="mt-4 text-xl font-bold text-on-surface">
              Delete your account?
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">This can&apos;t be undone.</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={submitting}
                className="w-full rounded-full bg-red-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {submitting ? "Deleting…" : "Yes, delete my account"}
              </button>
              <button
                type="button"
                autoFocus
                disabled={submitting}
                onClick={() => setConfirmOpen(false)}
                className="w-full rounded-full border border-outline-variant/40 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-secondary disabled:opacity-60"
              >
                No, keep my account
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SecurityPageShell>
  );
}
