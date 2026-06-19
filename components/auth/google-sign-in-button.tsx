"use client";

import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <p className="rounded-xl bg-surface-container px-4 py-3 text-center text-sm text-on-surface-variant">
        Google sign-in is not configured.
      </p>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      <GoogleLogin
        onSuccess={(response: CredentialResponse) => {
          if (response.credential) {
            onSuccess(response.credential);
            return;
          }
          onError?.();
        }}
        onError={() => onError?.()}
        theme="filled_black"
        size="large"
        text="continue_with"
        shape="pill"
        width="100%"
        locale="en"
      />
    </div>
  );
}
