"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getPasswordStrength } from "@/lib/validation/registrationSchema";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const response = await api.requestPasswordReset(email);
      setInfo(response.message);
      setStep("reset");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    setError("");
    try {
      const response = await api.requestPasswordReset(email);
      setInfo(response.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not resend reset code.");
    } finally {
      setSending(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (otp.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(email, otp, password);
      router.push("/login?reset=success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
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
          Reset your password
        </p>
      </header>

      <main className="w-full max-w-md z-10">
        <div className="glass-card rounded-[2rem] p-8 shadow-[0_40px_60px_-15px] shadow-primary/15">
          <div className="mb-8">
            <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface mb-1">
              {step === "email" ? "Forgot password?" : "Set a new password"}
            </h2>
            <p className="text-on-surface-variant text-sm">
              {step === "email"
                ? "Enter your account email and we will send you a reset code."
                : `Enter the code sent to ${email} and choose a new password.`}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {info && (
            <div className="mb-6 p-4 bg-primary-container text-on-primary-container rounded-xl text-sm font-medium">
              {info}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-on-surface-variant ml-1"
                  htmlFor="email"
                >
                  Email
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
                    placeholder="you@example.com"
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
                {loading ? "Sending code..." : "Send reset code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-on-surface-variant ml-1"
                  htmlFor="otp"
                >
                  Reset code
                </label>
                <input
                  className="w-full px-4 py-4 bg-surface-container-high rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline tracking-[0.3em] text-center font-semibold"
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-on-surface-variant ml-1"
                  htmlFor="password"
                >
                  New password
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
                    placeholder="Create a strong password"
                    type={showPassword ? "text" : "password"}
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
                    Strength: <span className="font-semibold">{strength.label}</span>
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-on-surface-variant ml-1"
                  htmlFor="confirmPassword"
                >
                  Confirm password
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
                    placeholder="Re-enter your password"
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
                type="button"
                onClick={handleResend}
                disabled={sending || loading}
                className="w-full rounded-full border border-outline-variant/30 bg-surface-container-high py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container disabled:opacity-50"
              >
                {sending ? "Resending..." : "Resend code"}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-brand text-white py-4 rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-[var(--font-headline)] disabled:opacity-50"
              >
                {loading ? "Updating password..." : "Update password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setPassword("");
                  setConfirmPassword("");
                  setError("");
                  setInfo("");
                }}
                className="w-full text-sm font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              className="text-accent font-bold hover:underline underline-offset-4 text-sm"
              href="/login"
            >
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
