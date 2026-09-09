"use client";

import { useGoogleOneTapLogin } from "@react-oauth/google";

interface GoogleOneTapProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
}

/**
 * Renders Google's "One Tap" prompt (the auto-detected account bubble in the
 * top-right corner, like Medium/YouTube show). It uses the browser's existing
 * Google session to offer a one-click sign-in, without requiring the user to
 * click a "Continue with Google" button first.
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID and must be mounted inside
 * GoogleOAuthProviderWrapper (see components/providers/ClientProviders.tsx).
 * Renders nothing itself — the prompt is drawn by Google's own script.
 */
export function GoogleOneTap({ onSuccess, onError, disabled = false }: GoogleOneTapProps) {
  useGoogleOneTapLogin({
    onSuccess: (credentialResponse) => {
      if (!credentialResponse.credential) {
        onError?.();
        return;
      }
      onSuccess(credentialResponse.credential);
    },
    onError,
    disabled,
    // Require an explicit "Continue as X" click rather than silently signing
    // the user in the instant the prompt renders.
    auto_select: false,
    cancel_on_tap_outside: true,
    // Google is phasing out third-party cookies for this flow; FedCM is the
    // supported replacement and avoids the prompt silently failing.
    use_fedcm_for_prompt: true,
  });

  return null;
}
