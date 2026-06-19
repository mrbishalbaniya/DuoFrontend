"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  initialRegistrationData,
  type RegistrationData,
  type RegistrationStep,
  TOTAL_REGISTRATION_STEPS,
} from "@/types/registration";

type RegistrationStore = {
  step: RegistrationStep;
  accountSubStep: "form" | "otp";
  data: RegistrationData;
  isSubmitting: boolean;
  error: string | null;
  accountCreated: boolean;
  setStep: (step: RegistrationStep) => void;
  setAccountSubStep: (subStep: "form" | "otp") => void;
  patchData: (patch: Partial<RegistrationData>) => void;
  setSubmitting: (value: boolean) => void;
  setError: (value: string | null) => void;
  setAccountCreated: (value: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: RegistrationStep) => void;
  reset: () => void;
  progressPercent: () => number;
};

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set, get) => ({
      step: 1,
      accountSubStep: "form",
      data: initialRegistrationData(),
      isSubmitting: false,
      error: null,
      accountCreated: false,
      setStep: (step) => set({ step }),
      setAccountSubStep: (accountSubStep) => set({ accountSubStep }),
      patchData: (patch) =>
        set((state) => ({
          data: { ...state.data, ...patch },
        })),
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setError: (error) => set({ error }),
      setAccountCreated: (accountCreated) => set({ accountCreated }),
      nextStep: () =>
        set((state) => ({
          step: Math.min(TOTAL_REGISTRATION_STEPS, state.step + 1) as RegistrationStep,
        })),
      prevStep: () =>
        set((state) => ({
          step: Math.max(1, state.step - 1) as RegistrationStep,
        })),
      goToStep: (step) => set({ step }),
      reset: () =>
        set({
          step: 1,
          accountSubStep: "form",
          data: initialRegistrationData(),
          isSubmitting: false,
          error: null,
          accountCreated: false,
        }),
      progressPercent: () => Math.round((get().step / TOTAL_REGISTRATION_STEPS) * 100),
    }),
    {
      name: "duo-registration-store",
      partialize: (state) => ({
        step: state.step,
        accountSubStep: state.accountSubStep,
        data: state.data,
        accountCreated: state.accountCreated,
      }),
    }
  )
);
