"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { RegistrationStepper } from "@/components/register/RegistrationStepper";
import { StepAbout } from "@/components/register/StepAbout";
import { StepAccount } from "@/components/register/StepAccount";
import { StepBasicInfo } from "@/components/register/StepBasicInfo";
import { StepEducation } from "@/components/register/StepEducation";
import { StepInterests } from "@/components/register/StepInterests";
import { StepLocation } from "@/components/register/StepLocation";
import { StepLifestyle } from "@/components/register/StepLifestyle";
import { StepPhotos } from "@/components/register/StepPhotos";
import { StepPreferences } from "@/components/register/StepPreferences";
import { StepReligion } from "@/components/register/StepReligion";
import { StepReview } from "@/components/register/StepReview";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { SHOW_PRODUCT_ONBOARDING_KEY } from "@/lib/onboarding/content";
import { syncOnboardedCookie } from "@/lib/onboardingGate";
import { getRegistrationEmail, mapRegistrationToProfile } from "@/lib/register/mapToProfile";
import { uploadRegistrationPhotos } from "@/lib/register/uploadRegistrationPhotos";
import { useRegistrationStore } from "@/store/registrationStore";
import type { RegistrationStep } from "@/types/registration";

export default function RegisterPage() {
  const router = useRouter();
  const { register, fetchUser } = useAuth();
  const {
    step,
    data,
    nextStep,
    prevStep,
    goToStep,
    isSubmitting,
    setSubmitting,
    error,
    setError,
    accountCreated,
    setAccountCreated,
    reset,
  } = useRegistrationStore();

  const createAccount = useCallback(async () => {
    if (accountCreated || data.signedUpWithGoogle) return;
    const email = getRegistrationEmail(data);
    const fullName = `${data.firstName} ${data.lastName}`.trim() || "Duo Member";
    await register(email, data.password, fullName);
    setAccountCreated(true);
  }, [accountCreated, data, register, setAccountCreated]);

  const handleContinue = useCallback(async () => {
    setError(null);

    if (step === 2 && !accountCreated) {
      setSubmitting(true);
      try {
        await createAccount();
      } catch (err) {
        const message =
          err instanceof Error && err.message.trim()
            ? err.message
            : "Could not create your account. Check your email and password, or try again.";
        setError(message);
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    nextStep();
  }, [accountCreated, createAccount, nextStep, setError, setSubmitting, step]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (!accountCreated) {
        await createAccount();
      }
      const photoUrls = await uploadRegistrationPhotos(data.photos);
      await api.updateProfile(mapRegistrationToProfile(data, photoUrls));
      await fetchUser();
      syncOnboardedCookie(true);
      reset();
      try {
        sessionStorage.setItem(SHOW_PRODUCT_ONBOARDING_KEY, "1");
      } catch {
        // ignore storage errors
      }
      router.push("/onboarding");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete registration. Please try again.";
      setError(message || "Failed to complete registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    accountCreated,
    createAccount,
    data,
    fetchUser,
    reset,
    router,
    setError,
    setSubmitting,
  ]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepAccount onContinue={handleContinue} />;
      case 2:
        return <StepBasicInfo onContinue={handleContinue} onBack={prevStep} />;
      case 3:
        return <StepLocation onContinue={handleContinue} onBack={prevStep} />;
      case 4:
        return <StepEducation onContinue={handleContinue} onBack={prevStep} />;
      case 5:
        return <StepReligion onContinue={handleContinue} onBack={prevStep} />;
      case 6:
        return <StepLifestyle onContinue={handleContinue} onBack={prevStep} />;
      case 7:
        return <StepInterests onContinue={handleContinue} onBack={prevStep} />;
      case 8:
        return <StepPreferences onContinue={handleContinue} onBack={prevStep} />;
      case 9:
        return <StepAbout onContinue={handleContinue} onBack={prevStep} />;
      case 10:
        return <StepPhotos onContinue={handleContinue} onBack={prevStep} />;
      case 11:
        return (
          <StepReview
            onSubmit={handleSubmit}
            onBack={prevStep}
            onEditStep={(target: RegistrationStep) => goToStep(target)}
            loading={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden font-[var(--font-body)] text-on-surface">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,74,122,0.16),transparent_32%),radial-gradient(circle_at_bottom,rgba(139,92,246,0.12),transparent_28%)]" />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface/60 px-6 backdrop-blur-xl shadow-[0_40px_40px_-15px] shadow-primary/5">
        <div className="font-[var(--font-headline)] text-2xl font-black text-gradient-brand">Duo</div>
        <Link
          href="/"
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </Link>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 pb-32 pt-24">
        <RegistrationStepper currentStep={step} />

        {error ? (
          <div className="mb-6 rounded-xl bg-error-container p-4 text-sm font-medium text-on-error-container">
            {error}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
