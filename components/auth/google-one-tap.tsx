"use client";

import { useEffect, useRef } from "react";
import { useGoogleOAuth, type CredentialResponse, type IdConfiguration } from "@react-oauth/google";

interface GoogleOneTapProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
}

// `@react-oauth/google` doesn't type the `window.google` global it relies on.
type GoogleAccountsId = {
  initialize: (config: IdConfiguration) => void;
  prompt: () => void;
  cancel: () => void;
};

function getGoogleId(): GoogleAccountsId | undefined {
  return (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } }).google?.accounts
    ?.id;
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
 *
 * This intentionally reimplements `@react-oauth/google`'s `useGoogleOneTapLogin`
 * instead of calling it directly: that hook's effect calls
 * `google.accounts.id.initialize()` + `.prompt()` synchronously on mount. In
 * dev, React Strict Mode double-invokes effects (mount -> cleanup -> mount),
 * and Chrome's FedCM `navigator.credentials.get()` call from the first
 * (phantom) mount doesn't always finish aborting before the second mount's
 * `.prompt()` fires, producing "Only one navigator.credentials.get request
 * may be outstanding at one time." Deferring the actual prompt by a short
 * macrotask delay lets the phantom mount's cleanup fully settle first.
 */
export function GoogleOneTap({ onSuccess, onError, disabled = false }: GoogleOneTapProps) {
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  // Tracks whether `.prompt()` actually ran for the *current* effect instance,
  // so cleanup only calls `.cancel()` (which makes Google's own SDK log a
  // console error for the aborted signal, even for an intentional/harmless
  // cancel) when a request is genuinely outstanding — not on every cleanup,
  // e.g. the React Strict Mode dev double-invoke's phantom mount, which never
  // gets far enough to call `.prompt()` before its cleanup runs.
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!scriptLoadedSuccessfully) return;

    if (disabled) {
      if (hasPromptedRef.current) {
        getGoogleId()?.cancel();
        hasPromptedRef.current = false;
      }
      return;
    }

    const timer = setTimeout(() => {
      const googleId = getGoogleId();
      googleId?.initialize({
        client_id: clientId,
        callback: (credentialResponse: CredentialResponse) => {
          hasPromptedRef.current = false;
          if (!credentialResponse.credential) {
            onErrorRef.current?.();
            return;
          }
          onSuccessRef.current(credentialResponse.credential);
        },
        // Require an explicit "Continue as X" click rather than silently
        // signing the user in the instant the prompt renders.
        auto_select: false,
        cancel_on_tap_outside: true,
        // Google is phasing out third-party cookies for this flow; FedCM is
        // the supported replacement and avoids the prompt silently failing.
        use_fedcm_for_prompt: true,
      });
      googleId?.prompt();
      hasPromptedRef.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (hasPromptedRef.current) {
        getGoogleId()?.cancel();
        hasPromptedRef.current = false;
      }
    };
  }, [clientId, scriptLoadedSuccessfully, disabled]);

  return null;
}
