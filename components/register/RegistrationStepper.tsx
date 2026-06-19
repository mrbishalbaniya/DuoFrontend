"use client";

import { cn } from "@/lib/utils";
import {
  REGISTRATION_STEP_LABELS,
  TOTAL_REGISTRATION_STEPS,
  type RegistrationStep,
} from "@/types/registration";

interface RegistrationStepperProps {
  currentStep: RegistrationStep;
  onStepClick?: (step: RegistrationStep) => void;
  allowJump?: boolean;
}

export function RegistrationStepper({
  currentStep,
  onStepClick,
  allowJump = false,
}: RegistrationStepperProps) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Registration · Step {currentStep} of {TOTAL_REGISTRATION_STEPS}
          </p>
          <h1 className="mt-1 font-[var(--font-headline)] text-2xl font-extrabold text-on-surface sm:text-3xl">
            {REGISTRATION_STEP_LABELS[currentStep]}
          </h1>
        </div>
        <p className="text-sm font-medium text-on-surface-variant">
          {Math.round((currentStep / TOTAL_REGISTRATION_STEPS) * 100)}%
        </p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          className="h-full rounded-full gradient-brand transition-all duration-500"
          style={{ width: `${(currentStep / TOTAL_REGISTRATION_STEPS) * 100}%` }}
        />
      </div>

      <div className="mt-4 hidden gap-2 overflow-x-auto pb-1 lg:flex">
        {Array.from({ length: TOTAL_REGISTRATION_STEPS }, (_, index) => {
          const step = (index + 1) as RegistrationStep;
          const active = step === currentStep;
          const completed = step < currentStep;
          return (
            <button
              key={step}
              type="button"
              disabled={!allowJump || step > currentStep}
              onClick={() => onStepClick?.(step)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active && "gradient-brand text-white",
                !active && completed && "bg-primary/15 text-primary",
                !active && !completed && "bg-surface-container text-on-surface-variant",
                allowJump && step <= currentStep && "hover:bg-surface-container-high"
              )}
            >
              {step}. {REGISTRATION_STEP_LABELS[step]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
