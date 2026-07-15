"use client";

import { Button } from "@/components/ui/button";

export function ReplaceConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="replace-about-title"
        aria-describedby="replace-about-desc"
        className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-background p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="replace-about-title"
          className="font-[var(--font-headline)] text-lg font-bold text-on-surface"
        >
          Replace existing text?
        </h3>
        <p id="replace-about-desc" className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Generating will overwrite what you already wrote in About Me, Looking For, and Future
          Goals.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full gradient-brand text-white"
            onClick={onConfirm}
          >
            Replace
          </Button>
        </div>
      </div>
    </div>
  );
}
