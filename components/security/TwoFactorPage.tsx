"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import type { SecurityOverview } from "@/types";
import { BackupCodesModal } from "./BackupCodesModal";
import { PasswordConfirmModal } from "./PasswordConfirmModal";
import { SecurityNotice, SecurityPageShell, SecuritySpinner } from "./SecurityPageShell";

type SetupMethod = "totp" | "email";
type ModalKind = "setup-totp" | "setup-email" | "disable" | "regenerate" | null;

export function TwoFactorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modal, setModal] = useState<ModalKind>(null);
  const [pendingMethod, setPendingMethod] = useState<SetupMethod | null>(null);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauth_uri: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const refresh = () => {
    setLoading(true);
    api
      .getSecurityOverview()
      .then(setOverview)
      .catch(() => setError("Could not load your two-factor settings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startSetup = (method: SetupMethod) => {
    setPendingMethod(method);
    setModal(method === "totp" ? "setup-totp" : "setup-email");
  };

  const handleSetupConfirm = async (password: string) => {
    if (pendingMethod === "totp") {
      const data = await api.setupTwoFactorTotp(password);
      setTotpSetup(data);
    } else {
      await api.setupTwoFactorEmail(password);
      setNotice("A verification code was sent to your email.");
    }
    setModal(null);
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError("");
    try {
      const result = await api.enableTwoFactor(verifyCode.trim());
      setBackupCodes(result.backup_codes);
      setTotpSetup(null);
      setPendingMethod(null);
      setVerifyCode("");
      refresh();
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async (password: string) => {
    await api.disableTwoFactor(password);
    setModal(null);
    setNotice("Two-factor authentication has been disabled.");
    refresh();
  };

  const handleRegenerate = async (password: string) => {
    const result = await api.regenerateBackupCodes(password);
    setModal(null);
    setBackupCodes(result.codes);
    refresh();
  };

  const cancelSetup = () => {
    setModal(null);
    setPendingMethod(null);
    setTotpSetup(null);
    setNotice("");
    setVerifyCode("");
    setVerifyError("");
  };

  const isSettingUp = pendingMethod !== null && modal === null;

  return (
    <SecurityPageShell title="Two-factor authentication">
      {loading ? (
        <SecuritySpinner pageName="Two-factor authentication" />
      ) : error ? (
        <SecurityNotice tone="error">{error}</SecurityNotice>
      ) : overview ? (
        <div className="space-y-6">
          {overview.two_factor_enabled ? (
            <div className="space-y-6">
              <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-secondary/30 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">Two-factor authentication is on</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Protected via {overview.two_factor_method === "totp" ? "an authenticator app" : "email codes"}.
                  </p>
                </div>
              </div>

              <section className="space-y-3">
                <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Backup codes
                </h2>
                <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                  <div className="flex items-center gap-3 px-4 py-4 md:px-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined text-[22px]">key</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-on-surface">
                        {overview.backup_codes_remaining} code{overview.backup_codes_remaining === 1 ? "" : "s"} remaining
                      </p>
                      <p className="mt-0.5 text-sm text-on-surface-variant">
                        Use these to sign in if you lose access to your device.
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-outline-variant/20" />
                  <button
                    type="button"
                    onClick={() => setModal("regenerate")}
                    className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold text-primary hover:bg-surface-container-high/60 md:px-5"
                  >
                    Regenerate backup codes
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                </div>
              </section>

              {notice ? <SecurityNotice>{notice}</SecurityNotice> : null}

              <button
                type="button"
                onClick={() => setModal("disable")}
                className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm font-bold text-red-400 hover:bg-red-500/15"
              >
                Turn off two-factor authentication
              </button>
            </div>
          ) : isSettingUp && pendingMethod === "totp" && totpSetup ? (
            <form onSubmit={(e) => void handleVerify(e)} className="space-y-6">
              <div className="rounded-2xl border border-primary/10 bg-secondary/30 p-5">
                <p className="font-semibold text-on-surface">Scan this QR code</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Use Google Authenticator, Authy, or any TOTP app to scan the code below.
                </p>
                <div className="mt-4 flex justify-center rounded-2xl border border-primary/10 bg-white p-4">
                  <QRCodeSVG value={totpSetup.otpauth_uri} size={176} level="M" includeMargin />
                </div>
                <p className="mt-4 text-xs text-on-surface-variant">Can't scan? Enter this code manually:</p>
                <code className="mt-1 block break-all rounded-lg bg-surface-container-high px-3 py-2 text-xs text-on-surface">
                  {totpSetup.secret}
                </code>
              </div>

              <div className="space-y-2">
                <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="verify-code">
                  Enter the 6-digit code from your app
                </label>
                <input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3.5 text-center text-lg tracking-[0.3em] text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                />
                {verifyError ? <p className="px-1 text-sm text-red-500">{verifyError}</p> : null}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelSetup}
                  className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-high/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || !verifyCode.trim()}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white gradient-brand disabled:opacity-50"
                >
                  {verifying ? "Verifying..." : "Enable"}
                </button>
              </div>
            </form>
          ) : isSettingUp && pendingMethod === "email" ? (
            <form onSubmit={(e) => void handleVerify(e)} className="space-y-6">
              {notice ? <SecurityNotice>{notice}</SecurityNotice> : null}
              <div className="space-y-2">
                <label className="block px-1 text-sm font-semibold text-on-surface-variant" htmlFor="verify-code-email">
                  Enter the 6-digit code we emailed you
                </label>
                <input
                  id="verify-code-email"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3.5 text-center text-lg tracking-[0.3em] text-on-surface outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
                />
                {verifyError ? <p className="px-1 text-sm text-red-500">{verifyError}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelSetup}
                  className="flex-1 rounded-xl border border-outline-variant/30 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-high/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || !verifyCode.trim()}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white gradient-brand disabled:opacity-50"
                >
                  {verifying ? "Verifying..." : "Enable"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="px-1 text-sm text-on-surface-variant">
                Add an extra layer of protection so only you can sign in, even if someone has your password.
              </p>
              <div className="overflow-hidden rounded-2xl border border-primary/10 bg-secondary/30">
                <button
                  type="button"
                  onClick={() => startSetup("totp")}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-container-high/60 md:px-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">Authenticator app</p>
                    <p className="mt-0.5 text-sm text-on-surface-variant">
                      Use Google Authenticator, Authy, or similar
                    </p>
                  </div>
                  <span className="material-symbols-outlined shrink-0 text-on-surface-variant">chevron_right</span>
                </button>
                <div className="border-t border-outline-variant/20" />
                <button
                  type="button"
                  onClick={() => startSetup("email")}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-container-high/60 md:px-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[22px]">mail</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-on-surface">Email OTP</p>
                    <p className="mt-0.5 text-sm text-on-surface-variant">Get a code by email each time you sign in</p>
                  </div>
                  <span className="material-symbols-outlined shrink-0 text-on-surface-variant">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {modal === "setup-totp" || modal === "setup-email" ? (
        <PasswordConfirmModal
          title="Confirm your password"
          description="For your security, please confirm your password to continue."
          confirmLabel="Continue"
          onCancel={cancelSetup}
          onConfirm={handleSetupConfirm}
        />
      ) : null}

      {modal === "disable" ? (
        <PasswordConfirmModal
          title="Turn off two-factor authentication?"
          description="Your account will be less secure. Enter your password to confirm."
          confirmLabel="Turn off"
          destructive
          onCancel={() => setModal(null)}
          onConfirm={handleDisable}
        />
      ) : null}

      {modal === "regenerate" ? (
        <PasswordConfirmModal
          title="Regenerate backup codes?"
          description="Your old backup codes will stop working. Enter your password to confirm."
          confirmLabel="Regenerate"
          onCancel={() => setModal(null)}
          onConfirm={handleRegenerate}
        />
      ) : null}

      {backupCodes ? (
        <BackupCodesModal codes={backupCodes} onClose={() => setBackupCodes(null)} />
      ) : null}
    </SecurityPageShell>
  );
}
