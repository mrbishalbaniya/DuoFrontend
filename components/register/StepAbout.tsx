"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  aboutSchema,
  type AboutFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepAboutProps {
  onContinue: () => void;
  onBack: () => void;
}

export function StepAbout({ onContinue, onBack }: StepAboutProps) {
  const { data, patchData } = useRegistrationStore();
  const form = useForm<AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      bio: data.bio,
      lookingForText: data.lookingForText,
      futureGoals: data.futureGoals,
    },
  });

  const generateBio = () => {
    const sample = `Namaste! I'm ${data.firstName || "someone"} from ${data.municipality || data.province || "Nepal"}, passionate about ${data.interests.slice(0, 3).join(", ") || "meaningful connections"}. I value ${data.relationshipGoal || "genuine"} relationships built on trust, respect, and shared goals.`;
    form.setValue("bio", sample, { shouldValidate: true });
  };

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard title="About me" subtitle="Write in your voice. Authentic profiles get better matches.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="bio">Bio</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
              onClick={generateBio}
            >
              <span className="material-symbols-outlined mr-1 text-[16px]">auto_awesome</span>
              AI Generate Bio
            </Button>
          </div>
          <Textarea id="bio" rows={4} placeholder="Tell your story..." {...form.register("bio")} />
          <FieldError message={form.formState.errors.bio?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lookingForText">What I am looking for</Label>
          <Textarea
            id="lookingForText"
            rows={3}
            placeholder="Describe your ideal partner or connection..."
            {...form.register("lookingForText")}
          />
          <FieldError message={form.formState.errors.lookingForText?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="futureGoals">Future goals</Label>
          <Textarea
            id="futureGoals"
            rows={3}
            placeholder="Family, career, lifestyle, travel, faith..."
            {...form.register("futureGoals")}
          />
          <FieldError message={form.formState.errors.futureGoals?.message} />
        </div>

        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
