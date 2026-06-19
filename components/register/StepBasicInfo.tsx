"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChipSelect } from "@/components/register/ChipSelect";
import { SelectField } from "@/components/register/SelectField";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GENDER_OPTIONS,
  HEIGHT_FEET,
  HEIGHT_INCHES,
  MARITAL_STATUS_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
} from "@/lib/register/constants";
import { maxBirthDateForMinAge, minBirthDate } from "@/lib/age";
import {
  basicInfoSchema,
  type BasicInfoFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepBasicInfoProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepBasicInfo({ onContinue, onBack }: StepBasicInfoProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender || undefined,
      dateOfBirth: data.dateOfBirth,
      heightFeet: data.heightFeet || 5,
      heightInches: data.heightInches || 6,
      maritalStatus: data.maritalStatus || undefined,
      relationshipGoal: data.relationshipGoal || undefined,
    },
  });

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard title="Basic information" subtitle="Tell us who you are and what you are looking for.">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...form.register("firstName")} />
            <FieldError message={form.formState.errors.firstName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...form.register("lastName")} />
            <FieldError message={form.formState.errors.lastName?.message} />
          </div>
        </div>

        <ChipSelect
          label="Gender"
          value={form.watch("gender") ?? ""}
          options={GENDER_OPTIONS}
          onChange={(value) => form.setValue("gender", value, { shouldValidate: true })}
          error={form.formState.errors.gender?.message}
        />

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            min={minBirthDate()}
            max={maxBirthDateForMinAge(18)}
            {...form.register("dateOfBirth")}
          />
          <FieldError message={form.formState.errors.dateOfBirth?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Height (feet)"
            options={HEIGHT_FEET.map(String)}
            value={String(form.watch("heightFeet") ?? "")}
            onChange={(event) =>
              form.setValue("heightFeet", Number(event.target.value), { shouldValidate: true })
            }
            error={form.formState.errors.heightFeet?.message}
          />
          <SelectField
            label="Height (inches)"
            options={HEIGHT_INCHES.map(String)}
            value={String(form.watch("heightInches") ?? "")}
            onChange={(event) =>
              form.setValue("heightInches", Number(event.target.value), { shouldValidate: true })
            }
            error={form.formState.errors.heightInches?.message}
          />
        </div>

        <ChipSelect
          label="Marital status"
          value={form.watch("maritalStatus") ?? ""}
          options={MARITAL_STATUS_OPTIONS}
          onChange={(value) => form.setValue("maritalStatus", value, { shouldValidate: true })}
          error={form.formState.errors.maritalStatus?.message}
        />

        <ChipSelect
          label="Relationship goal"
          value={form.watch("relationshipGoal") ?? ""}
          options={RELATIONSHIP_GOAL_OPTIONS}
          onChange={(value) => form.setValue("relationshipGoal", value, { shouldValidate: true })}
          error={form.formState.errors.relationshipGoal?.message}
          columns={2}
        />

        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
