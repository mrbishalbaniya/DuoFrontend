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
    return `at ${new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(iso))}`;
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
      setPollError("Could not copy the link. Scan the code or use Email me instead.");
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
  const phoneStarted = completedSteps > 0;
  const onSelfie = progress?.status === "PENDING" && completedSteps >= totalSteps;
  const statusText = onSelfie
    ? "Taking selfie on your phone…"
    : phoneStarted
      ? `Face check ${completedSteps} of ${totalSteps} done`
      : "Waiting for your phone…";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center pb-2 pt-2 text-center">
      <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface">Scan with your phone</h2>
      <p className="mt-1.5 max-w-xs text-sm text-on-surface-variant">
        Open your phone camera and point it at the code. No login needed.
      </p>

      <div className="relative mt-6 rounded-[1.75rem] p-[3px] gradient-brand shadow-xl shadow-primary/20">
        <div className="rounded-[1.6rem] bg-white p-4">
          <QRCodeSVG
            value={handoffUrl}
            size={196}
            level="M"
            aria-label="QR code for verification link"
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">
        Code expires {formatExpiry(session.expires_at)}
      </p>

      <div className="mt-5 grid w-full grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="flex items-center justify-center gap-1.5 rounded-full bg-secondary/60 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-secondary"
        >
          <span className="material-symbols-outlined text-lg text-primary">
            {copied ? "check" : "link"}
          </span>
          {copied ? "Copied" : "Copy link"}
        </button>
        <button
          type="button"
          onClick={() => void sendEmail()}
          disabled={emailSending || emailSent}
          title={userEmail ? `Send to ${userEmail}` : undefined}
          className="flex items-center justify-center gap-1.5 rounded-full bg-secondary/60 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-secondary disabled:opacity-70"
        >
          <span className="material-symbols-outlined text-lg text-primary">
            {emailSent ? "mark_email_read" : "mail"}
          </span>
          {emailSending ? "Sending…" : emailSent ? "Email sent" : "Email me"}
        </button>
      </div>
      {emailSent && userEmail ? (
        <p className="mt-2 text-xs text-on-surface-variant">Sent to {userEmail}</p>
      ) : null}

      {emailError && (
        <p className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {emailError}
        </p>
      )}

      <div
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-primary/10 bg-secondary/30 px-4 py-3 text-left"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <span className="flex-1 text-sm font-medium text-on-surface">{statusText}</span>
        <span className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={
                "h-1.5 w-5 rounded-full transition-colors " +
                (i < completedSteps ? "gradient-brand" : "bg-outline-variant/30")
              }
            />
          ))}
        </span>
      </div>

      {pollError && (
        <p className="mt-3 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          {pollError}
        </p>
      )}

      <button
        type="button"
        onClick={onUseThisDevice}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-secondary hover:text-primary"
      >
        <span className="material-symbols-outlined text-lg">photo_camera</span>
        Use this device&apos;s camera instead
      </button>
    </div>
  );
}
