"use client";

import { useState, type FormEvent } from "react";

export function PasswordConfirmModal({
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-[1.5rem] border border-white/10 bg-background p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
          />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-outline-variant/30 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className={
                destructive
                  ? "rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  : "rounded-full px-5 py-2.5 text-sm font-bold text-white gradient-brand disabled:opacity-50"
              }
            >
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
