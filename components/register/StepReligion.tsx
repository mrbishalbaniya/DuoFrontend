"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChipSelect } from "@/components/register/ChipSelect";
import { SelectField } from "@/components/register/SelectField";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CASTE_OPTIONS,
  GOTRA_OPTIONS,
  HOROSCOPE_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/register/constants";
import {
  religionSchema,
  type ReligionFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepReligionProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepReligion({ onContinue, onBack }: StepReligionProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<ReligionFormValues>({
    resolver: zodResolver(religionSchema),
    defaultValues: {
      religion: data.religion || undefined,
      caste: data.caste,
      gotra: data.gotra,
      horoscope: data.horoscope || undefined,
      birthTime: data.birthTime,
      birthPlace: data.birthPlace,
    },
  });

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard
      title="Religion & matrimonial"
      subtitle="Optional matrimonial details for culturally aligned matching."
      onSkip={onContinue}
    >
      <form onSubmit={submit} className="space-y-5">
        <ChipSelect
          label="Religion"
          value={form.watch("religion") ?? ""}
          options={RELIGION_OPTIONS}
          onChange={(value) => form.setValue("religion", value, { shouldValidate: true })}
          error={form.formState.errors.religion?.message}
          columns={3}
        />

        <SelectField
          label="Caste"
          options={CASTE_OPTIONS.map((option) => ({ value: option, label: option }))}
          value={form.watch("caste")}
          onChange={(event) => form.setValue("caste", event.target.value, { shouldValidate: true })}
          error={form.formState.errors.caste?.message}
        />

        <SelectField
          label="Gotra"
          options={GOTRA_OPTIONS.map((option) => ({ value: option, label: option }))}
          value={form.watch("gotra")}
          onChange={(event) => form.setValue("gotra", event.target.value, { shouldValidate: true })}
          error={form.formState.errors.gotra?.message}
        />

        <ChipSelect
          label="Horoscope / Kundali"
          value={form.watch("horoscope") ?? ""}
          options={HOROSCOPE_OPTIONS}
          onChange={(value) => form.setValue("horoscope", value, { shouldValidate: true })}
          error={form.formState.errors.horoscope?.message}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birthTime">Birth time</Label>
            <Input id="birthTime" type="time" {...form.register("birthTime")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthPlace">Birth place</Label>
            <Input id="birthPlace" placeholder="City or district" {...form.register("birthPlace")} />
          </div>
        </div>

        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
