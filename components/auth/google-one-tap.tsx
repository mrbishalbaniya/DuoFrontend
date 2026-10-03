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
};

function getGoogleId(): GoogleAccountsId | undefined {
  return (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } }).google?.accounts
    ?.id;
}

// One FedCM request per page load. The browser allows only one outstanding
// `navigator.credentials.get()` at a time, and aborting it via
// `google.accounts.id.cancel()` makes Google's SDK log
// "[GSI_LOGGER]: FedCM get() rejects with AbortError", which Next.js dev
// surfaces as a console error. So we never cancel: we prompt once and simply
// ignore the result if the component is disabled or unmounted by then.
let promptStarted = false;
let activeHandler: ((response: CredentialResponse) => void) | null = null;

// Google's script reports expected One Tap outcomes through console.error,
// e.g. "[GSI_LOGGER]: FedCM get() rejects with NetworkError" when the browser
// isn't signed in to Google or third-party sign-in is blocked. One Tap just
// doesn't show in that case and the regular Google button still works, but
// Next.js turns every console.error into an error overlay. Downgrade only
// Google's own [GSI_LOGGER] lines to console.debug; all other errors pass through.
let gsiLogFilterInstalled = false;
function installGsiLogFilter() {
  if (gsiLogFilterInstalled || typeof window === "undefined") return;
  gsiLogFilterInstalled = true;
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("[GSI_LOGGER]")) {
      console.debug(...args);
      return;
    }
    originalError(...args);
  };
}

/**
 * Renders Google's "One Tap" prompt (the auto-detected account bubble in the
 * top-right corner). Uses the browser's existing Google session to offer a
 * one-click sign-in without clicking "Continue with Google" first.
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID and must be mounted inside
 * GoogleOAuthProviderWrapper (see components/providers/ClientProviders.tsx).
 * Renders nothing itself — the prompt is drawn by Google's own script.
 */
export function GoogleOneTap({ onSuccess, onError, disabled = false }: GoogleOneTapProps) {
  const { clientId, scriptLoadedSuccessfully } = useGoogleOAuth();
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    disabledRef.current = disabled;
  });

  // Route the (single, page-wide) Google callback to whichever instance is
  // currently mounted; with none mounted the credential is dropped.
  useEffect(() => {
    const handler = (response: CredentialResponse) => {
      if (disabledRef.current) return;
      if (!response.credential) {
        onErrorRef.current?.();
        return;
      }
      onSuccessRef.current(response.credential);
    };
    activeHandler = handler;
    return () => {
      if (activeHandler === handler) activeHandler = null;
    };
  }, []);

  useEffect(() => {
    if (!scriptLoadedSuccessfully || disabled || promptStarted) return;

    // Short delay so React Strict Mode's dev mount -> unmount -> mount cycle
    // settles before the one real prompt starts.
    const timer = setTimeout(() => {
      const googleId = getGoogleId();
      if (!googleId || promptStarted) return;
      promptStarted = true;
      installGsiLogFilter();
      googleId.initialize({
        client_id: clientId,
        callback: (response: CredentialResponse) => activeHandler?.(response),
        // Require an explicit "Continue as X" click rather than silently
        // signing the user in the instant the prompt renders.
        auto_select: false,
        // Must stay false: tapping outside makes Google's SDK abort its own
        // FedCM request, which logs the same AbortError console error.
        cancel_on_tap_outside: false,
        // Google is phasing out third-party cookies for this flow; FedCM is
        // the supported replacement.
        use_fedcm_for_prompt: true,
      });
      googleId.prompt();
    }, 100);

    return () => clearTimeout(timer);
  }, [clientId, scriptLoadedSuccessfully, disabled]);

  return null;
}
