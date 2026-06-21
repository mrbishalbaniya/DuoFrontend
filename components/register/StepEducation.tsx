"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChipSelect } from "@/components/register/ChipSelect";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EDUCATION_LEVEL_OPTIONS,
  EMPLOYMENT_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
  INCOME_OPTIONS,
} from "@/lib/register/constants";
import {
  educationSchema,
  type EducationFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepEducationProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepEducation({ onContinue, onBack }: StepEducationProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      educationLevel: data.educationLevel || undefined,
      fieldOfStudy: data.fieldOfStudy || undefined,
      employment: data.employment || undefined,
      occupation: data.occupation,
      company: data.company,
      monthlyIncome: data.monthlyIncome || undefined,
    },
  });

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard title="Education & career" subtitle="Share your academic background and professional journey.">
      <form onSubmit={submit} className="space-y-5">
        <ChipSelect
          label="Education level"
          value={form.watch("educationLevel") ?? ""}
          options={EDUCATION_LEVEL_OPTIONS}
          onChange={(value) => form.setValue("educationLevel", value, { shouldValidate: true })}
          error={form.formState.errors.educationLevel?.message}
          columns={3}
        />

        <ChipSelect
          label="Field of study"
          value={form.watch("fieldOfStudy") ?? ""}
          options={FIELD_OF_STUDY_OPTIONS}
          onChange={(value) => form.setValue("fieldOfStudy", value, { shouldValidate: true })}
          error={form.formState.errors.fieldOfStudy?.message}
          columns={3}
        />

        <ChipSelect
          label="Employment"
          value={form.watch("employment") ?? ""}
          options={EMPLOYMENT_OPTIONS}
          onChange={(value) => form.setValue("employment", value, { shouldValidate: true })}
          error={form.formState.errors.employment?.message}
          columns={2}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" placeholder="Software Engineer" {...form.register("occupation")} />
            <FieldError message={form.formState.errors.occupation?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" placeholder="Optional" {...form.register("company")} />
          </div>
        </div>

        <ChipSelect
          label="Monthly income"
          value={form.watch("monthlyIncome") ?? ""}
          options={INCOME_OPTIONS}
          onChange={(value) => form.setValue("monthlyIncome", value, { shouldValidate: true })}
          error={form.formState.errors.monthlyIncome?.message}
          columns={2}
        />

        <StepNavigation onBack={onBack} onNext={() => submit()} onSkip={onContinue} />
      </form>
    </StepCard>
  );
}
