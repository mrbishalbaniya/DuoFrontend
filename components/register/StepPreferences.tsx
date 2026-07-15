"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChipSelect } from "@/components/register/ChipSelect";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DISTANCE_OPTIONS,
  LOOKING_FOR_OPTIONS,
  MARRIAGE_PREF_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/register/constants";
import {
  preferencesSchema,
  type PreferencesFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepPreferencesProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepPreferences({ onContinue, onBack }: StepPreferencesProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      lookingFor: data.lookingFor || undefined,
      prefAgeMin: data.prefAgeMin,
      prefAgeMax: data.prefAgeMax,
      distancePreference: data.distancePreference || undefined,
      preferredReligion: data.preferredReligion || undefined,
      interCaste: data.interCaste || undefined,
      interReligion: data.interReligion || undefined,
    },
  });

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard
      title="Partner preferences"
      subtitle="Define the kind of connection you want to discover."
      onSkip={onContinue}
    >
      <form onSubmit={submit} className="space-y-5">
        <ChipSelect
          label="Looking for"
          value={form.watch("lookingFor") ?? ""}
          options={LOOKING_FOR_OPTIONS}
          onChange={(value) => form.setValue("lookingFor", value, { shouldValidate: true })}
          error={form.formState.errors.lookingFor?.message}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prefAgeMin">Preferred age min</Label>
            <Input
              id="prefAgeMin"
              type="number"
              min={18}
              max={80}
              {...form.register("prefAgeMin", { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.prefAgeMin?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prefAgeMax">Preferred age max</Label>
            <Input
              id="prefAgeMax"
              type="number"
              min={18}
              max={80}
              {...form.register("prefAgeMax", { valueAsNumber: true })}
            />
            <FieldError message={form.formState.errors.prefAgeMax?.message} />
          </div>
        </div>

        <ChipSelect
          label="Distance preference"
          value={form.watch("distancePreference") ?? ""}
          options={DISTANCE_OPTIONS}
          onChange={(value) =>
            form.setValue("distancePreference", value, { shouldValidate: true })
          }
          error={form.formState.errors.distancePreference?.message}
          columns={3}
        />

        <ChipSelect
          label="Preferred religion"
          value={form.watch("preferredReligion") ?? ""}
          options={RELIGION_OPTIONS}
          onChange={(value) =>
            form.setValue("preferredReligion", value, { shouldValidate: true })
          }
          error={form.formState.errors.preferredReligion?.message}
          columns={3}
        />

        <ChipSelect
          label="Inter-caste marriage"
          value={form.watch("interCaste") ?? ""}
          options={MARRIAGE_PREF_OPTIONS}
          onChange={(value) => form.setValue("interCaste", value, { shouldValidate: true })}
          error={form.formState.errors.interCaste?.message}
        />

        <ChipSelect
          label="Inter-religion marriage"
          value={form.watch("interReligion") ?? ""}
          options={MARRIAGE_PREF_OPTIONS}
          onChange={(value) => form.setValue("interReligion", value, { shouldValidate: true })}
          error={form.formState.errors.interReligion?.message}
        />

        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
