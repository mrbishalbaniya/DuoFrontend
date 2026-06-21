"use client";

import {
  REGISTRATION_STEP_LABELS,
  TOTAL_REGISTRATION_STEPS,
  type RegistrationStep,
} from "@/types/registration";

interface RegistrationStepperProps {
  currentStep: RegistrationStep;
}

export function RegistrationStepper({ currentStep }: RegistrationStepperProps) {
  const progress = Math.round((currentStep / TOTAL_REGISTRATION_STEPS) * 100);

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Step {currentStep} of {TOTAL_REGISTRATION_STEPS}
          </p>
          <h1 className="mt-1 font-[var(--font-headline)] text-2xl font-extrabold text-on-surface sm:text-3xl">
            {REGISTRATION_STEP_LABELS[currentStep]}
          </h1>
        </div>
        <p className="text-sm font-medium text-on-surface-variant">{progress}%</p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full gradient-brand transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
