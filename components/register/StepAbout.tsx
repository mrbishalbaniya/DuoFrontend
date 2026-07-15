"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CharCounter } from "@/components/register/about/CharCounter";
import { QualityMeter } from "@/components/register/about/QualityMeter";
import { ReplaceConfirmDialog } from "@/components/register/about/ReplaceConfirmDialog";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { assessWritingQuality, truncateAtSentence } from "@/lib/register/aboutQuality";
import { ABOUT_LIMITS, ABOUT_PLACEHOLDERS } from "@/lib/register/aboutSuggestions";
import {
  aboutSchema,
  type AboutFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";

interface StepAboutProps {
  onContinue: () => void;
  onBack: () => void;
}

type SaveStatus = "idle" | "saving" | "saved" | "failed";

export function StepAbout({ onContinue, onBack }: StepAboutProps) {
  const { data, patchData } = useRegistrationStore();
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<AboutFormValues>({
    resolver: zodResolver(aboutSchema),
    mode: "onChange",
    defaultValues: {
      bio: data.bio,
      lookingForText: data.lookingForText,
      futureGoals: data.futureGoals,
    },
  });

  const bio = useWatch({ control: form.control, name: "bio" }) ?? "";
  const lookingForText = useWatch({ control: form.control, name: "lookingForText" }) ?? "";
  const futureGoals = useWatch({ control: form.control, name: "futureGoals" }) ?? "";

  const bioQuality = useMemo(() => assessWritingQuality(bio, ABOUT_LIMITS.bio), [bio]);
  const lookingQuality = useMemo(
    () => assessWritingQuality(lookingForText, ABOUT_LIMITS.lookingForText),
    [lookingForText]
  );
  const goalsQuality = useMemo(
    () => assessWritingQuality(futureGoals, ABOUT_LIMITS.futureGoals),
    [futureGoals]
  );

  const isValid = form.formState.isValid;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const persistDraft = useCallback(
    (values: AboutFormValues) => {
      setSaveStatus("saving");
      try {
        patchData({
          bio: values.bio,
          lookingForText: values.lookingForText,
          futureGoals: values.futureGoals,
        });
        setSaveStatus("saved");
        if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
        savedFlashRef.current = setTimeout(() => setSaveStatus("idle"), 1600);
      } catch {
        setSaveStatus("failed");
      }
    },
    [patchData]
  );

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistDraft({ bio, lookingForText, futureGoals });
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [bio, lookingForText, futureGoals, persistDraft]);

  useEffect(() => {
    return () => {
      if (savedFlashRef.current) clearTimeout(savedFlashRef.current);
    };
  }, []);

  const applyGenerated = (payload: {
    bio: string;
    looking_for: string;
    future_goals: string;
  }) => {
    const nextBio = truncateAtSentence(payload.bio, ABOUT_LIMITS.bio.max);
    const nextLooking = truncateAtSentence(payload.looking_for, ABOUT_LIMITS.lookingForText.max);
    const nextGoals = truncateAtSentence(payload.future_goals, ABOUT_LIMITS.futureGoals.max);
    form.setValue("bio", nextBio, { shouldValidate: true, shouldDirty: true });
    form.setValue("lookingForText", nextLooking, { shouldValidate: true, shouldDirty: true });
    form.setValue("futureGoals", nextGoals, { shouldValidate: true, shouldDirty: true });
    patchData({
      aboutStepSkipped: false,
      bio: nextBio,
      lookingForText: nextLooking,
      futureGoals: nextGoals,
    });
  };

  const runGenerate = async () => {
    setGenerating(true);
    setConfirmReplaceOpen(false);
    try {
      const payload = await api.generateProfileCopy({
        style: "friendly",
        language: "en",
        force: true,
        apply: false,
      });
      applyGenerated(payload);
    } catch {
      showToast("Unable to generate profile. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    const hasExisting =
      bio.trim().length > 0 || lookingForText.trim().length > 0 || futureGoals.trim().length > 0;
    if (hasExisting) {
      setConfirmReplaceOpen(true);
      return;
    }
    void runGenerate();
  };

  const skip = () => {
    patchData({
      aboutStepSkipped: true,
      bio,
      lookingForText,
      futureGoals,
    });
    onContinue();
  };

  const submit = form.handleSubmit((values) => {
    patchData({
      ...values,
      aboutStepSkipped: false,
    });
    onContinue();
  });

  const saveLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveStatus === "failed"
          ? "Failed to Save"
          : null;

  return (
    <>
      <StepCard
        title="About me"
        subtitle="Write in your voice. Authentic profiles get better matches."
        onSkip={skip}
        skipDisabled={generating}
      >
        <form onSubmit={submit} className="space-y-6 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-primary/25 bg-primary/10 text-primary hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={handleGenerateClick}
              disabled={generating}
              aria-busy={generating}
            >
              {generating ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-1.5 text-[18px]">auto_awesome</span>
                  Generate from My Profile
                </>
              )}
            </Button>
            {saveLabel ? (
              <p
                className={`text-xs font-medium ${
                  saveStatus === "failed" ? "text-error" : "text-on-surface-variant"
                }`}
                aria-live="polite"
              >
                {saveLabel}
              </p>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-end justify-between gap-3">
              <Label htmlFor="bio" className="text-sm font-semibold">
                About Me (Bio)
              </Label>
              <CharCounter count={bio.length} max={ABOUT_LIMITS.bio.max} id="bio-counter" />
            </div>
            <Textarea
              id="bio"
              rows={5}
              className="min-h-[140px] sm:min-h-[160px]"
              placeholder={ABOUT_PLACEHOLDERS.bio}
              aria-describedby="bio-counter bio-quality bio-error"
              aria-invalid={Boolean(form.formState.errors.bio)}
              disabled={generating}
              {...form.register("bio")}
            />
            <div id="bio-quality">
              <QualityMeter quality={bioQuality} />
            </div>
            <div id="bio-error">
              <FieldError message={form.formState.errors.bio?.message} />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-end justify-between gap-3">
              <Label htmlFor="lookingForText" className="text-sm font-semibold">
                What I am Looking For
              </Label>
              <CharCounter
                count={lookingForText.length}
                max={ABOUT_LIMITS.lookingForText.max}
                id="looking-counter"
              />
            </div>
            <Textarea
              id="lookingForText"
              rows={4}
              className="min-h-[120px]"
              placeholder={ABOUT_PLACEHOLDERS.lookingFor}
              aria-describedby="looking-counter looking-quality looking-error"
              aria-invalid={Boolean(form.formState.errors.lookingForText)}
              disabled={generating}
              {...form.register("lookingForText")}
            />
            <div id="looking-quality">
              <QualityMeter quality={lookingQuality} />
            </div>
            <div id="looking-error">
              <FieldError message={form.formState.errors.lookingForText?.message} />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-end justify-between gap-3">
              <Label htmlFor="futureGoals" className="text-sm font-semibold">
                Future Goals
              </Label>
              <CharCounter
                count={futureGoals.length}
                max={ABOUT_LIMITS.futureGoals.max}
                id="goals-counter"
              />
            </div>
            <Textarea
              id="futureGoals"
              rows={4}
              className="min-h-[120px]"
              placeholder={ABOUT_PLACEHOLDERS.futureGoals}
              aria-describedby="goals-counter goals-quality goals-error"
              aria-invalid={Boolean(form.formState.errors.futureGoals)}
              disabled={generating}
              {...form.register("futureGoals")}
            />
            <div id="goals-quality">
              <QualityMeter quality={goalsQuality} />
            </div>
            <div id="goals-error">
              <FieldError message={form.formState.errors.futureGoals?.message} />
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-1 border-t border-white/5 bg-background/90 px-1 pt-4 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:backdrop-blur-none">
            <StepNavigation
              onBack={onBack}
              onNext={() => void submit()}
              loading={generating}
              disableNext={!isValid || generating}
            />
          </div>
        </form>
      </StepCard>

      <ReplaceConfirmDialog
        open={confirmReplaceOpen}
        onCancel={() => setConfirmReplaceOpen(false)}
        onConfirm={() => void runGenerate()}
      />

      {toast ? (
        <div
          role="status"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 z-[90] w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-error/30 bg-error-container px-4 py-3 text-center text-sm font-medium text-on-error-container shadow-xl"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
