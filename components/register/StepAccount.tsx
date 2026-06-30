"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailOtp } from "@/components/auth/email-otp";
import { DuoPhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  accountSchema,
  getPasswordStrength,
  googlePhoneSchema,
  type AccountFormValues,
  type GooglePhoneFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

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
  const [googleHydrating, setGoogleHydrating] = useState(isGoogleRegistrationEntry);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

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

  useEffect(() => {
    const fromGoogle = isGoogleRegistrationEntry();

    if (!fromGoogle) {
      setGoogleHydrating(false);
      return;
    }

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

  const submitAccount = accountForm.handleSubmit((values) => {
    const email = values.email.trim().toLowerCase();
    patchData({ ...values, email, signedUpWithGoogle: false });
    setAccountSubStep("otp");
  });

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

  if (accountSubStep === "otp" && !data.signedUpWithGoogle && !data.otpVerified) {
    const otpEmail = data.email.trim().toLowerCase();

    return (
      <StepCard
        title="Verify your email"
        subtitle={
          otpEmail
            ? `We sent a 6-digit code to ${otpEmail}. Check your inbox and spam folder.`
            : "Enter the email you used to sign up, then verify with the code we send."
        }
      >
        <EmailOtp
          email={otpEmail}
          onBack={() => setAccountSubStep("form")}
          onVerified={() => {
            patchData({ otpVerified: true, signedUpWithGoogle: false });
            onContinue();
          }}
        />
      </StepCard>
    );
  }

  return (
    <StepCard
      title="Create your account"
      subtitle="Sign up with Google or register with email. Email users verify with a 6-digit code."
    >
      <div className="space-y-5">
        {googleError ? (
          <div className="rounded-xl bg-error-container p-4 text-sm font-medium text-on-error-container">
            {googleError}
          </div>
        ) : null}

        <GoogleSignInButton
          disabled={googleLoading}
          onSuccess={handleGoogleSuccess}
          onError={() => setGoogleError("Google sign-in was cancelled or failed.")}
        />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant/30" />
          <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
            or register with email
          </span>
          <div className="h-px flex-1 bg-outline-variant/30" />
        </div>

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

          <StepNavigation onBack={onBack} onNext={() => submitAccount()} showBack={Boolean(onBack)} />
        </form>
      </div>
    </StepCard>
  );
}
