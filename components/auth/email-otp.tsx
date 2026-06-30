"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError, StepNavigation } from "@/components/register/StepNavigation";
import api from "@/lib/api";

interface EmailOtpProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailOtp({ email, onVerified, onBack }: EmailOtpProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Email is missing. Go back and enter your email address.");
      return;
    }

    let active = true;

    const sendCode = async () => {
      setSending(true);
      setError(null);
      try {
        await api.sendEmailOtp(normalized);
        if (active) {
          setCodeSent(true);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not send verification email.");
        }
      } finally {
        setSending(false);
      }
    };

    void sendCode();

    return () => {
      active = false;
    };
  }, [email]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.verifyEmailOtp(email, otp);
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError("Email is missing. Go back and enter your email address.");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await api.sendEmailOtp(normalized);
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend verification email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <FieldError message={error ?? undefined} />
        {error?.toLowerCase().includes("already exists") ? (
          <p className="text-xs text-on-surface-variant">
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            with this email or go back and use a different address.
          </p>
        ) : null}
        {error?.toLowerCase().includes("brevo") ||
        error?.toLowerCase().includes("resend") ||
        error?.toLowerCase().includes("render") ? (
          <p className="text-xs text-on-surface-variant">
            Production needs a Brevo or Resend API key in the backend admin. Gmail SMTP does not work on
            Render free tier.
          </p>
        ) : null}
        <p className="text-xs text-on-surface-variant">
          {sending
            ? "Sending verification email..."
            : codeSent
              ? `We sent a 6-digit code to ${email}`
              : "Preparing verification..."}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full border-outline-variant/30 bg-surface-container-high"
        onClick={handleResend}
        disabled={sending || loading}
      >
        {sending ? "Sending..." : "Resend code"}
      </Button>

      <StepNavigation
        onBack={onBack}
        onNext={handleVerify}
        nextLabel="Verify & Continue"
        loading={loading}
      />
    </div>
  );
}
