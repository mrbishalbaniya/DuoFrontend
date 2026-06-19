"use client";

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
    let active = true;

    const sendCode = async () => {
      setSending(true);
      setError(null);
      try {
        await api.sendEmailOtp(email);
        if (active) {
          setCodeSent(true);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not send verification email.");
        }
      } finally {
        if (active) {
          setSending(false);
        }
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
    setSending(true);
    setError(null);
    try {
      await api.sendEmailOtp(email);
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
