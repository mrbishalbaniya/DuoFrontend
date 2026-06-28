"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  initialRegistrationData,
  type RegistrationData,
  type RegistrationStep,
  TOTAL_REGISTRATION_STEPS,
} from "@/types/registration";

type PersistedRegistrationState = {
  step: RegistrationStep;
  accountSubStep: "form" | "otp" | "phone";
  data: Omit<RegistrationData, "photos" | "password" | "confirmPassword">;
  accountCreated: boolean;
};

/** Photos and passwords must stay in memory only — not localStorage. */
function toPersistedData(data: RegistrationData): PersistedRegistrationState["data"] {
  const { photos: _photos, password: _password, confirmPassword: _confirm, ...rest } = data;
  return rest;
}

const registrationStorage = createJSONStorage<PersistedRegistrationState>(() => ({
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "QuotaExceededError")) {
        throw error;
      }
      // Clear stale entries that may include old photo payloads, then retry once.
      localStorage.removeItem(name);
      try {
        localStorage.setItem(name, value);
      } catch {
        console.warn("Could not persist registration progress to localStorage.");
      }
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}));

type RegistrationStore = {
  step: RegistrationStep;
  accountSubStep: "form" | "otp" | "phone";
  data: RegistrationData;
  isSubmitting: boolean;
  error: string | null;
  accountCreated: boolean;
  setStep: (step: RegistrationStep) => void;
  setAccountSubStep: (subStep: "form" | "otp" | "phone") => void;
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
      storage: registrationStorage,
      partialize: (state): PersistedRegistrationState => ({
        step: state.step,
        accountSubStep: state.accountSubStep,
        data: toPersistedData(state.data),
        accountCreated: state.accountCreated,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedRegistrationState | undefined;
        if (!persisted) return currentState;

        return {
          ...currentState,
          ...persisted,
          data: {
            ...currentState.data,
            ...persisted.data,
            photos: currentState.data.photos,
          },
        };
      },
    }
  )
);
