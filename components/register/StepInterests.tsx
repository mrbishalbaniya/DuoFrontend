"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MultiChipSelect } from "@/components/register/ChipSelect";
import { StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { INTEREST_OPTIONS } from "@/lib/register/constants";
import {
  interestsSchema,
  type InterestsFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepInterestsProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepInterests({ onContinue, onBack }: StepInterestsProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<InterestsFormValues>({
    resolver: zodResolver(interestsSchema),
    defaultValues: { interests: data.interests },
  });

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard
      title="Interests"
      subtitle="Pick what you love. Matches connect faster when interests overlap."
    >
      <form onSubmit={submit} className="space-y-5">
        <MultiChipSelect
          label="Your interests"
          values={form.watch("interests")}
          options={INTEREST_OPTIONS}
          min={5}
          onChange={(values) => form.setValue("interests", values, { shouldValidate: true })}
          error={form.formState.errors.interests?.message}
        />
        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
