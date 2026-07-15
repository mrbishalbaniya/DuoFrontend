"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChipSelect } from "@/components/register/ChipSelect";
import { StepCard, StepNavigation } from "@/components/register/StepNavigation";
import {
  EXERCISE_OPTIONS,
  FREQUENCY_OPTIONS,
  LIFESTYLE_OPTIONS,
  PERSONALITY_OPTIONS,
} from "@/lib/register/constants";
import {
  lifestyleSchema,
  type LifestyleFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepLifestyleProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepLifestyle({ onContinue, onBack }: StepLifestyleProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<LifestyleFormValues>({
    resolver: zodResolver(lifestyleSchema),
    defaultValues: {
      personality: data.personality || undefined,
      lifestyle: data.lifestyle || undefined,
      smoking: data.smoking || undefined,
      drinking: data.drinking || undefined,
      exercise: data.exercise || undefined,
    },
  });

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard
      title="Personality & lifestyle"
      subtitle="Help matches understand your daily rhythm and habits."
      onSkip={onContinue}
    >
      <form onSubmit={submit} className="space-y-5">
        <ChipSelect
          label="Personality"
          value={form.watch("personality") ?? ""}
          options={PERSONALITY_OPTIONS}
          onChange={(value) => form.setValue("personality", value, { shouldValidate: true })}
          error={form.formState.errors.personality?.message}
        />

        <ChipSelect
          label="Lifestyle"
          value={form.watch("lifestyle") ?? ""}
          options={LIFESTYLE_OPTIONS}
          onChange={(value) => form.setValue("lifestyle", value, { shouldValidate: true })}
          error={form.formState.errors.lifestyle?.message}
        />

        <ChipSelect
          label="Smoking"
          value={form.watch("smoking") ?? ""}
          options={FREQUENCY_OPTIONS}
          onChange={(value) => form.setValue("smoking", value, { shouldValidate: true })}
          error={form.formState.errors.smoking?.message}
        />

        <ChipSelect
          label="Drinking"
          value={form.watch("drinking") ?? ""}
          options={FREQUENCY_OPTIONS}
          onChange={(value) => form.setValue("drinking", value, { shouldValidate: true })}
          error={form.formState.errors.drinking?.message}
        />

        <ChipSelect
          label="Exercise"
          value={form.watch("exercise") ?? ""}
          options={EXERCISE_OPTIONS}
          onChange={(value) => form.setValue("exercise", value, { shouldValidate: true })}
          error={form.formState.errors.exercise?.message}
          columns={3}
        />

        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
