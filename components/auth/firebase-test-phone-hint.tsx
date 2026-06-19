"use client";

import { getFirebaseTestPhoneConfig } from "@/lib/firebase/test-phone";

interface FirebaseTestPhoneHintProps {
  onUseTestPhone?: () => void;
  compact?: boolean;
}

export function FirebaseTestPhoneHint({ onUseTestPhone, compact = false }: FirebaseTestPhoneHintProps) {
  const config = getFirebaseTestPhoneConfig();
  if (!config) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm">
      <p className="font-semibold text-primary">Free OTP (no Blaze billing)</p>
      {!compact ? (
        <p className="mt-2 text-on-surface-variant">
          In Firebase Console → Authentication → Sign-in method → Phone, add this under{" "}
          <strong>Phone numbers for testing</strong>, then use it here:
        </p>
      ) : null}
      <p className="mt-2 font-mono text-xs text-on-surface">
        {config.phone} · code {config.otp}
      </p>
      {onUseTestPhone ? (
        <button
          type="button"
          onClick={onUseTestPhone}
          className="mt-3 rounded-full bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          Use test number
        </button>
      ) : null}
    </div>
  );
}
