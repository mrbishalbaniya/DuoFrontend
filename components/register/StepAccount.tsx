"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EmailOtp } from "@/components/auth/email-otp";
import { DuoPhoneInput } from "@/components/ui/phone-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import {
  accountSchema,
  getPasswordStrength,
  type AccountFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepAccountProps {
  onContinue: () => void;
  onBack?: () => void;
}

export function StepAccount({ onContinue, onBack }: StepAccountProps) {
  const { data, patchData, accountSubStep, setAccountSubStep } = useRegistrationStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState(data.email);

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      phone: data.phone,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
    },
  });

  const password = accountForm.watch("password") ?? "";
  const strength = getPasswordStrength(password);

  const submitAccount = accountForm.handleSubmit((values) => {
    patchData(values);
    setVerifiedEmail(values.email.trim().toLowerCase());
    setAccountSubStep("otp");
  });

  if (accountSubStep === "otp") {
    return (
      <StepCard
        title="Verify your email"
        subtitle={`We sent a 6-digit code to ${verifiedEmail}. Check your inbox and spam folder.`}
      >
        <EmailOtp
          email={verifiedEmail}
          onBack={() => setAccountSubStep("form")}
          onVerified={() => {
            patchData({ otpVerified: true, email: verifiedEmail });
            onContinue();
          }}
        />
      </StepCard>
    );
  }

  return (
    <StepCard
      title="Create your account"
      subtitle="Enter your mobile number and email. We will verify your email with a 6-digit code."
    >
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
    </StepCard>
  );
}
