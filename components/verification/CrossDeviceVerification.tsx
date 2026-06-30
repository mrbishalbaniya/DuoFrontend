"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";
import type {
  VerificationSessionDetail,
  VerificationStartResponse,
  VerificationStatusResponse,
} from "@/types";

interface CrossDeviceVerificationProps {
  session: VerificationStartResponse;
  userEmail?: string;
  onComplete: (result: VerificationStatusResponse) => void;
  onUseThisDevice: () => void;
}

const FINAL_STATUSES = new Set(["VERIFIED", "REJECTED", "UNDER_REVIEW"]);

function formatExpiry(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CrossDeviceVerification({
  session,
  userEmail,
  onComplete,
  onUseThisDevice,
}: CrossDeviceVerificationProps) {
  const handoffUrl =
    session.handoff_url ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/verify/device?session=${session.session_token}`
      : `/verify/device?session=${session.session_token}`);

  const [copied, setCopied] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [progress, setProgress] = useState<VerificationSessionDetail | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(handoffUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setPollError("Could not copy link. Select and copy the URL below.");
    }
  }, [handoffUrl]);

  const sendEmail = useCallback(async () => {
    setEmailSending(true);
    setEmailError(null);
    try {
      const response = await api.sendVerificationHandoffEmail(session.session_token);
      setEmailSent(true);
      if (!userEmail) {
        setEmailSent(true);
      }
      void response;
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Could not send email.");
    } finally {
      setEmailSending(false);
    }
  }, [session.session_token, userEmail]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const detail = await api.getVerificationSession(session.session_token);
        if (cancelled) return;
        setProgress(detail);
        setPollError(null);

        if (FINAL_STATUSES.has(detail.status)) {
          onComplete(detail);
        }
      } catch (err) {
        if (!cancelled) {
          setPollError(err instanceof Error ? err.message : "Could not check progress.");
        }
      }
    }

    void poll();
    const interval = setInterval(() => void poll(), 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session.session_token, onComplete]);

  const completedSteps = progress?.session?.liveness_steps_completed?.length ?? 0;
  const totalSteps = session.liveness_steps.length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/10 bg-secondary/40 p-5">
        <p className="text-sm text-on-surface-variant">
          Open this link on your phone or tablet — no login needed. We&apos;ll update this screen
          when verification finishes.
        </p>
        <p className="mt-2 text-xs text-on-surface-variant">
          Link expires {formatExpiry(session.expires_at)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="flex justify-center rounded-2xl border border-primary/10 bg-white p-4">
          <QRCodeSVG
            value={handoffUrl}
            size={168}
            level="M"
            includeMargin
            aria-label="QR code for verification link"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Verification link
            </p>
            <p className="break-all rounded-xl border border-primary/10 bg-background px-3 py-2 text-xs text-on-surface">
              {handoffUrl}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <span className="material-symbols-outlined text-lg">
              {copied ? "check" : "content_copy"}
            </span>
            {copied ? "Link copied" : "Copy link"}
          </button>

          <button
            type="button"
            onClick={() => void sendEmail()}
            disabled={emailSending || emailSent}
            className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">mail</span>
            {emailSending
              ? "Sending…"
              : emailSent
                ? "Email sent"
                : userEmail
                  ? `Email link to ${userEmail}`
                  : "Email link to me"}
          </button>
        </div>
      </div>

      {emailError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {emailError}
        </p>
      )}

      <div className="rounded-2xl border border-primary/10 bg-background p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Waiting on your other device</span>
          <span className="font-semibold text-on-surface">
            {completedSteps}/{totalSteps} liveness steps
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full gradient-brand transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((completedSteps / Math.max(totalSteps, 1)) * 100))}%`,
            }}
          />
        </div>
        {progress?.status === "PENDING" && completedSteps >= totalSteps && (
          <p className="mt-2 text-xs text-on-surface-variant">Selfie capture in progress…</p>
        )}
      </div>

      {pollError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {pollError}
        </p>
      )}

      <button
        type="button"
        onClick={onUseThisDevice}
        className="w-full rounded-xl py-3 text-sm font-semibold text-on-surface-variant underline-offset-2 hover:underline"
      >
        Use this device instead
      </button>
    </div>
  );
}
