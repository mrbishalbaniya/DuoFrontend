"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError, StepNavigation } from "@/components/register/StepNavigation";
import api from "@/lib/api";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase/errors";
import { getFirebaseTestPhoneConfig, isFirebaseTestPhone } from "@/lib/firebase/test-phone";
import { FirebaseTestPhoneHint } from "@/components/auth/firebase-test-phone-hint";
import {
  resetFirebasePhoneOtp,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
} from "@/lib/firebase/phone-auth";

interface FirebasePhoneOtpProps {
  phoneNumber: string;
  onVerified: () => void;
  onBack: () => void;
}

export function FirebasePhoneOtp({ phoneNumber, onVerified, onBack }: FirebasePhoneOtpProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const testConfig = getFirebaseTestPhoneConfig();
  const usingTestPhone = isFirebaseTestPhone(phoneNumber);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setError("Firebase phone OTP is not configured.");
      return;
    }

    let active = true;

    const sendCode = async () => {
      setSending(true);
      setError(null);
      try {
        await sendFirebasePhoneOtp(phoneNumber);
        if (active) {
          setCodeSent(true);
        }
      } catch (err) {
        if (active) {
          setError(getFirebaseAuthErrorMessage(err));
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
      resetFirebasePhoneOtp();
    };
  }, [phoneNumber]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const idToken = await verifyFirebasePhoneOtp(otp);
      await api.verifyFirebasePhone(idToken, phoneNumber);
      onVerified();
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    setError(null);
    try {
      resetFirebasePhoneOtp();
      await sendFirebasePhoneOtp(phoneNumber);
      setCodeSent(true);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div id="firebase-recaptcha" />

      {usingTestPhone ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-on-surface-variant">
          Test number — no SMS is sent. Enter code{" "}
          <span className="font-semibold text-primary">{testConfig?.otp}</span> below.
        </div>
      ) : (
        <FirebaseTestPhoneHint compact />
      )}

      <div className="space-y-2">
        <Label htmlFor="otp">OTP Code</Label>
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
            ? usingTestPhone
              ? "Starting test verification..."
              : "Sending verification code..."
            : codeSent
              ? usingTestPhone
                ? `Test mode ready for ${phoneNumber}`
                : `Code sent to ${phoneNumber}`
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
