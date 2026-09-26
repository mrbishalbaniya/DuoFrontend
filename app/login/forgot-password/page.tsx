"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import api, { OtpCooldownError } from "@/lib/api";
import { getPasswordStrength } from "@/lib/validation/registrationSchema";
import { useToast } from "@/contexts/ToastContext";
import { OtpInput, type OtpInputHandle, type OtpStatus } from "@/components/ui/otp-input";

type Step = "email" | "reset";
type ResetSubStep = "code" | "password";

export default function ForgotPasswordPage() {
  const t = useTranslations("settingsExtra.authExtra");
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [resetSubStep, setResetSubStep] = useState<ResetSubStep>("code");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpFieldRef = useRef<OtpInputHandle>(null);
  const { showToast, showErrorToast } = useToast();

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (error) showErrorToast(error);
  }, [error, showErrorToast]);

  useEffect(() => {
    if (info) showToast(info, { variant: "success" });
  }, [info, showToast]);

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await api.requestPasswordReset(email);
      setInfo(response.message);
      setStep("reset");
      setResetSubStep("code");
      setResendCooldown(response.retry_after ?? 60);
    } catch (err: unknown) {
      if (err instanceof OtpCooldownError) {
        setStep("reset");
        setResetSubStep("code");
        setResendCooldown(err.retryAfter);
      } else {
        setError(err instanceof Error ? err.message : t("couldNotSendCode"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await api.requestPasswordReset(email);
      setInfo(response.message);
      setResendCooldown(response.retry_after ?? 60);
    } catch (err: unknown) {
      if (err instanceof OtpCooldownError) {
        setResendCooldown(err.retryAfter);
      } else {
        setError(err instanceof Error ? err.message : t("couldNotResendCode"));
      }
    } finally {
      setSending(false);
    }
  };

  const handleOtpComplete = (code: string) => {
    setOtp(code);
    setOtpStatus("idle");
    setOtpErrorMessage("");
    setResetSubStep("password");
  };

  const handleBackToCode = () => {
    setResetSubStep("code");
    setOtpStatus("idle");
    setOtpErrorMessage("");
    setOtp("");
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (password.length < 8) {
      setError(t("passwordMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(email, otp, password);
      router.push("/login?reset=success");
    } catch (err: unknown) {
      // The code and password are validated together server-side, so an
      // invalid/expired code surfaces here rather than at code-entry time.
      // Route back to the code step and show the error there, matching the
      // login OTP page's error-on-the-boxes pattern.
      setResetSubStep("code");
      setOtpStatus("error");
      setOtpErrorMessage(err instanceof Error ? err.message : t("couldNotResetPassword"));
      setOtp("");
      otpFieldRef.current?.clear();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <header className="mb-12 z-10 text-center">
        <h1 className="text-3xl font-black text-gradient-brand font-[var(--font-headline)] tracking-tight mb-2">
          Duo
        </h1>
        <p className="text-on-surface-variant text-sm font-medium">
          {t("resetYourPassword")}
        </p>
      </header>

      <main className="w-full max-w-md z-10">
        <div className="glass-card rounded-[2rem] p-8 shadow-[0_40px_60px_-15px] shadow-primary/15">
          <div className="mb-8">
            <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface mb-1">
              {step === "email"
                ? t("forgotPasswordTitle")
                : resetSubStep === "code"
                  ? t("resetCodeLabel")
                  : t("setNewPasswordTitle")}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {step === "email"
                ? t("forgotPasswordDescription")
                : t("resetPasswordDescription", { email })}
            </p>
          </div>

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-on-surface-variant ml-1"
                  htmlFor="email"
                >
                  {t("emailLabel")}
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                  <input
                    className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline"
                    id="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("emailPlaceholder")}
                    type="email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-brand text-white py-4 rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-[var(--font-headline)] disabled:opacity-50"
              >
                {loading ? t("sendingCode") : t("sendResetCode")}
              </button>
            </form>
          ) : resetSubStep === "code" ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-6">
                <OtpInput
                  ref={otpFieldRef}
                  length={6}
                  label={t("resetCodeLabel")}
                  status={otpStatus}
                  errorMessage={otpErrorMessage}
                  disabled={loading}
                  autoFocus
                  onComplete={handleOtpComplete}
                />
              </div>
              <div className="flex w-full items-center justify-between px-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setResetSubStep("code");
                    setOtp("");
                    setPassword("");
                    setConfirmPassword("");
                    setError("");
                    setInfo("");
                    setOtpStatus("idle");
                    setOtpErrorMessage("");
                    setResendCooldown(0);
                  }}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  {t("useDifferentEmail")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={sending || resendCooldown > 0}
                  className="text-accent hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline"
                >
                  {sending
                    ? t("resending")
                    : resendCooldown > 0
                      ? t("resendCodeIn", { seconds: resendCooldown })
                      : t("resendCode")}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-on-surface-variant ml-1"
                  htmlFor="password"
                >
                  {t("newPasswordLabel")}
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-high rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline"
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("createStrongPasswordPlaceholder")}
                    type={showPassword ? "text" : "password"}
                    autoFocus
                    required
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {password ? (
                  <p className="text-xs text-on-surface-variant ml-1">
                    {t("strengthLabel")} <span className="font-semibold">{strength.label}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-on-surface-variant ml-1"
                  htmlFor="confirmPassword"
                >
                  {t("confirmPasswordLabel")}
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                  <input
                    className="w-full pl-12 pr-12 py-4 bg-surface-container-high rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t("reEnterPasswordPlaceholder")}
                    type={showConfirm ? "text" : "password"}
                    required
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    <span className="material-symbols-outlined">
                      {showConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-brand text-white py-4 rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-[var(--font-headline)] disabled:opacity-50"
              >
                {loading ? t("updatingPassword") : t("updatePassword")}
              </button>

              <button
                type="button"
                onClick={handleBackToCode}
                className="w-full text-sm font-semibold text-on-surface-variant hover:text-on-surface"
              >
                {t("useDifferentCode")}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              className="text-accent font-bold hover:underline underline-offset-4 text-sm"
              href="/login"
            >
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
