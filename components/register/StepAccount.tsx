"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { DuoPhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { OtpInput, type OtpInputHandle, type OtpStatus } from "@/components/ui/otp-input";
import api, { OtpCooldownError } from "@/lib/api";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  accountSchema,
  getPasswordStrength,
  googlePhoneSchema,
  type AccountFormValues,
  type GooglePhoneFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";
import type { RegistrationData } from "@/types/registration";

interface StepAccountProps {
  onContinue: () => void;
  onBack?: () => void;
}

function parseGoogleName(fullName?: string) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function isGoogleRegistrationEntry(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("google") === "1") return true;
  return sessionStorage.getItem("duo_register_via_google") === "1";
}

export function StepAccount({ onContinue, onBack }: StepAccountProps) {
  const { loginWithGoogle, fetchUser, user, loading: authLoading } = useAuth();
  const {
    data,
    patchData,
    accountSubStep,
    setAccountSubStep,
    setAccountCreated,
  } = useRegistrationStore();
  const [googleHydrating, setGoogleHydrating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const { showErrorToast, showToast } = useToast();
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [otpErrorMessage, setOtpErrorMessage] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpFieldRef = useRef<OtpInputHandle>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (googleError) showErrorToast(googleError);
  }, [googleError, showErrorToast]);

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      phone: data.phone,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    },
  });

  const phoneForm = useForm<GooglePhoneFormValues>({
    resolver: zodResolver(googlePhoneSchema),
    defaultValues: {
      phone: data.phone,
    },
  });

  // Keep the store in sync with every keystroke, not just on submit, so a
  // refresh or accidental navigation away doesn't discard what was typed.
  // (Password fields are stripped out before the store persists to
  // localStorage — see registrationStore's toPersistedData — so this never
  // writes a plaintext password to disk.)
  useEffect(() => {
    const subscription = accountForm.watch((values) => {
      patchData(values as Partial<RegistrationData>);
    });
    return () => subscription.unsubscribe();
  }, [accountForm, patchData]);

  useEffect(() => {
    const subscription = phoneForm.watch((values) => {
      patchData(values as Partial<RegistrationData>);
    });
    return () => subscription.unsubscribe();
  }, [phoneForm, patchData]);

  useEffect(() => {
    const fromGoogle = isGoogleRegistrationEntry();

    if (!fromGoogle) {
      return;
    }

    setGoogleHydrating(true);

    if (authLoading) return;

    async function hydrateGoogleRegistration() {
      try {
        await fetchUser();

        const meRes = await fetch("/api/backend/auth/me/", {
          credentials: "include",
          cache: "no-store",
        });
        if (!meRes.ok) return;

        const me = (await meRes.json()) as {
          email?: string;
          profile?: { full_name?: string };
        };

        const email = (me.email || "").trim().toLowerCase();
        if (!email) return;

        const { firstName, lastName } = parseGoogleName(me.profile?.full_name);
        patchData({
          email,
          signedUpWithGoogle: true,
          otpVerified: true,
          verifiedEmail: email,
          password: "",
          confirmPassword: "",
          firstName: data.firstName || firstName,
          lastName: data.lastName || lastName,
        });
        setAccountCreated(true);
        setAccountSubStep("phone");
      } finally {
        sessionStorage.removeItem("duo_register_via_google");
        setGoogleHydrating(false);
      }
    }

    void hydrateGoogleRegistration();
  }, [
    authLoading,
    data.firstName,
    data.lastName,
    fetchUser,
    patchData,
    setAccountCreated,
    setAccountSubStep,
  ]);

  useEffect(() => {
    if (data.signedUpWithGoogle && accountSubStep === "form") {
      setAccountSubStep("phone");
    }
    if (data.signedUpWithGoogle && accountSubStep === "otp") {
      setAccountSubStep("phone");
    }
  }, [accountSubStep, data.signedUpWithGoogle, setAccountSubStep]);

  if (googleHydrating) {
    return (
      <StepCard title="Signing in with Google" subtitle="Preparing your registration…">
        <p className="text-sm text-on-surface-variant">
          Your Google email is already verified — no email code needed.
        </p>
      </StepCard>
    );
  }

  const password = accountForm.watch("password") ?? "";
  const strength = getPasswordStrength(password);

  const sendCode = async (email: string): Promise<boolean> => {
    setOtpSending(true);
    try {
      const response = await api.sendEmailOtp(email);
      setResendCooldown(response.retry_after ?? 60);
      showToast(`We sent a 6-digit code to ${email}.`, { variant: "success" });
      return true;
    } catch (err: unknown) {
      if (err instanceof OtpCooldownError) {
        // A code is already on its way; let the user enter it.
        setResendCooldown(err.retryAfter);
        return true;
      }
      showErrorToast(err instanceof Error ? err.message : "Could not send verification code.");
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  const submitAccount = accountForm.handleSubmit(async (values) => {
    const email = values.email.trim().toLowerCase();
    const alreadyVerified = data.otpVerified && data.verifiedEmail === email;
    patchData({
      ...values,
      email,
      signedUpWithGoogle: false,
      otpVerified: alreadyVerified,
      verifiedEmail: alreadyVerified ? email : "",
    });
    if (alreadyVerified) {
      onContinue();
      return;
    }
    setOtpStatus("idle");
    setOtpErrorMessage("");
    if (await sendCode(email)) {
      setAccountSubStep("otp");
    }
  });

  const handleVerifyCode = async (code: string) => {
    setOtpVerifying(true);
    setOtpStatus("idle");
    setOtpErrorMessage("");
    try {
      await api.verifyEmailOtp(data.email, code);
      setOtpStatus("success");
      patchData({ otpVerified: true, verifiedEmail: data.email.trim().toLowerCase() });
      showToast("Email verified. Let's build your profile.", { variant: "success" });
      setAccountSubStep("form");
      onContinue();
    } catch (err: unknown) {
      setOtpStatus("error");
      setOtpErrorMessage(err instanceof Error ? err.message : "Invalid or expired verification code.");
      otpFieldRef.current?.clear();
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || otpSending) return;
    setOtpStatus("idle");
    setOtpErrorMessage("");
    otpFieldRef.current?.clear();
    await sendCode(data.email);
  };

  const submitGooglePhone = phoneForm.handleSubmit((values) => {
    patchData({ phone: values.phone });
    onContinue();
  });

  const handleGoogleSuccess = async (credential: string) => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const authData = await loginWithGoogle(credential);
      const user = authData.user;
      const email = (user?.email || "").trim().toLowerCase();
      const { firstName, lastName } = parseGoogleName(user?.profile?.full_name);

      patchData({
        email,
        signedUpWithGoogle: true,
        otpVerified: true,
        verifiedEmail: email,
        password: "",
        confirmPassword: "",
        firstName: data.firstName || firstName,
        lastName: data.lastName || lastName,
      });
      sessionStorage.removeItem("duo_register_via_google");
      setAccountCreated(true);
      setAccountSubStep("phone");
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  if (accountSubStep === "otp" && !data.signedUpWithGoogle) {
    return (
      <StepCard
        title="Verify your email"
        subtitle={`Enter the 6-digit code we sent to ${data.email}. You can continue once your email is verified.`}
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/10 px-4 py-3">
            <span className="material-symbols-outlined text-primary">mark_email_unread</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-on-surface-variant">Code sent to</p>
              <p className="truncate text-sm font-semibold text-on-surface">{data.email}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <OtpInput
              ref={otpFieldRef}
              length={6}
              label="Verification code"
              status={otpStatus}
              errorMessage={otpErrorMessage}
              disabled={otpVerifying}
              autoFocus
              onComplete={(code) => void handleVerifyCode(code)}
            />
            {otpVerifying ? (
              <div className="w-full rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  <div>
                    <p className="text-sm font-semibold text-on-surface">Verifying...</p>
                    <p className="text-xs text-on-surface-variant">Checking your code</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-on-surface-variant">
                The code expires in 10 minutes. Check your spam folder if you don't see it.
              </p>
            )}
          </div>

          <div className="flex w-full items-center justify-between px-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAccountSubStep("form");
                setOtpStatus("idle");
                setOtpErrorMessage("");
              }}
              className="text-on-surface-variant hover:text-on-surface"
            >
              Change email
            </button>
            <button
              type="button"
              onClick={() => void handleResendCode()}
              disabled={otpSending || resendCooldown > 0}
              className="text-accent hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline"
            >
              {otpSending
                ? "Sending…"
                : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
            </button>
          </div>
        </div>
      </StepCard>
    );
  }

  if (accountSubStep === "phone") {
    return (
      <StepCard
        title="Add your mobile number"
        subtitle="Your Google email is already verified. We only need your phone number to continue."
      >
        <form onSubmit={submitGooglePhone} className="space-y-5">
          {data.email ? (
            <div className="rounded-xl border border-primary/15 bg-primary/10 px-4 py-3">
              <p className="text-xs font-medium text-on-surface-variant">Signed in with Google</p>
              <p className="text-sm font-semibold text-on-surface">{data.email}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="google-phone">Mobile number</Label>
            <DuoPhoneInput
              id="google-phone"
              value={phoneForm.watch("phone") || undefined}
              onChange={(value) =>
                phoneForm.setValue("phone", value ?? "", { shouldValidate: true })
              }
            />
            <FieldError message={phoneForm.formState.errors.phone?.message} />
          </div>

          <StepNavigation
            onBack={() => setAccountSubStep("form")}
            onNext={() => submitGooglePhone()}
            showBack
          />
        </form>
      </StepCard>
    );
  }


  return (
    <StepCard
      title="Create your account"
      subtitle="Register with your email and password, or sign up with Google."
    >
      <div className="space-y-5">
        <form onSubmit={submitAccount} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <DuoPhoneInput
              id="phone"
              value={accountForm.watch("phone") || undefined}
              onChange={(value) =>
                accountForm.setValue("phone", value ?? "", { shouldValidate: true })
              }
            />
            <FieldError message={accountForm.formState.errors.phone?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...accountForm.register("email")}
            />
            <FieldError message={accountForm.formState.errors.email?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pr-12"
                placeholder="Create a strong password"
                {...accountForm.register("password")}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                onClick={() => setShowPassword((value) => !value)}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <FieldError message={accountForm.formState.errors.password?.message} />
            {password ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Password strength</span>
                  <span className="font-semibold text-on-surface">{strength.label}</span>
                </div>
                <Progress value={(strength.score / 5) * 100} />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                className="pr-12"
                placeholder="Re-enter your password"
                {...accountForm.register("confirmPassword")}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                onClick={() => setShowConfirm((value) => !value)}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {showConfirm ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            <FieldError message={accountForm.formState.errors.confirmPassword?.message} />
          </div>

          <StepNavigation
            onBack={onBack}
            onNext={() => void submitAccount()}
            showBack={Boolean(onBack)}
            loading={otpSending}
            nextLabel={
              data.otpVerified && data.verifiedEmail === data.email.trim().toLowerCase()
                ? undefined
                : "Send code"
            }
          />
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant/30" />
          <span className="text-xs font-bold uppercase tracking-widest text-outline">or</span>
          <div className="h-px flex-1 bg-outline-variant/30" />
        </div>

        <GoogleSignInButton
          disabled={googleLoading}
          onSuccess={handleGoogleSuccess}
          onError={() => setGoogleError("Google sign-in was cancelled or failed.")}
        />

        <p className="text-center text-xs text-on-surface-variant">
          {googleLoading
            ? "Connecting to Google…"
            : "Use your Google account to skip email verification. You'll only need to add your mobile number."}
        </p>
      </div>
    </StepCard>
  );
}
