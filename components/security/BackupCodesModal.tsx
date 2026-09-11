"use client";

import { useState } from "react";

export function BackupCodesModal({ codes, onClose }: { codes: string[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; the codes are still visible on screen.
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-[1.5rem] border border-white/10 bg-background p-5 shadow-2xl sm:p-6"
      >
        <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">
          Save your backup codes
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Each code can be used once to sign in if you lose access to your authenticator or email.
          Store them somewhere safe — this is the only time they will be shown.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-container-high p-4 font-mono text-sm text-on-surface">
          {codes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-full border border-outline-variant/30 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high/60"
          >
            {copied ? "Copied!" : "Copy codes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-white gradient-brand"
          >
            I've saved them
          </button>
        </div>
      </div>
    </div>
  );
}
