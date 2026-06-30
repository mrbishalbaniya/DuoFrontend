"use client";

import { Button } from "@/components/ui/button";
import { StepCard, StepNavigation } from "@/components/register/StepNavigation";
import {
  DISTANCE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  EMPLOYMENT_OPTIONS,
  GENDER_OPTIONS,
  LOOKING_FOR_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  RELIGION_OPTIONS,
} from "@/lib/register/constants";
import { useRegistrationStore } from "@/store/registrationStore";
import {
  REGISTRATION_STEP_LABELS,
  type RegistrationStep,
} from "@/types/registration";

interface StepReviewProps {
  onSubmit: () => void;
  onBack: () => void;
  onEditStep: (step: RegistrationStep) => void;
  loading?: boolean;
}

function labelFor<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string
) {
  return options.find((option) => option.value === value)?.label ?? (value || "—");
}

function ReviewSection({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: RegistrationStep;
  onEdit: (step: RegistrationStep) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{title}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => onEdit(step)}
        >
          Edit
        </Button>
      </div>
      <dl className="grid gap-2 text-sm">{children}</dl>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
      <dt className="font-semibold text-on-surface-variant">{label}</dt>
      <dd className="text-on-surface">{value}</dd>
    </div>
  );
}

export function StepReview({ onSubmit, onBack, onEditStep, loading }: StepReviewProps) {
  const { data } = useRegistrationStore();
  const profilePhoto = data.photos.find((photo) => photo.isProfile) ?? data.photos[0];

  return (
    <StepCard
      title="Review your profile"
      subtitle="Check everything before you start matching across Nepal."
    >
      <div className="space-y-4">
        {profilePhoto ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-primary/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profilePhoto.previewUrl}
              alt="Profile preview"
              className="aspect-[16/7] w-full object-cover"
            />
          </div>
        ) : null}

        <ReviewSection title={REGISTRATION_STEP_LABELS[1]} step={1} onEdit={onEditStep}>
          <ReviewRow label="Phone" value={data.phone || "—"} />
          <ReviewRow label="Email" value={data.email || "Not provided"} />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[2]} step={2} onEdit={onEditStep}>
          <ReviewRow label="Name" value={`${data.firstName} ${data.lastName}`.trim()} />
          <ReviewRow label="Gender" value={labelFor(GENDER_OPTIONS, data.gender)} />
          <ReviewRow label="Date of birth" value={data.dateOfBirth} />
          <ReviewRow label="Height" value={`${data.heightFeet}'${data.heightInches}"`} />
          <ReviewRow
            label="Relationship goal"
            value={labelFor(RELATIONSHIP_GOAL_OPTIONS, data.relationshipGoal)}
          />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[3]} step={3} onEdit={onEditStep}>
          <ReviewRow
            label="Location"
            value={[data.municipality, data.district, data.province, data.country].filter(Boolean).join(", ")}
          />
          <ReviewRow label="Current location" value={data.currentLocation || "—"} />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[4]} step={4} onEdit={onEditStep}>
          <ReviewRow label="Education" value={labelFor(EDUCATION_LEVEL_OPTIONS, data.educationLevel)} />
          <ReviewRow label="Employment" value={labelFor(EMPLOYMENT_OPTIONS, data.employment)} />
          <ReviewRow label="Occupation" value={data.occupation} />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[5]} step={5} onEdit={onEditStep}>
          <ReviewRow label="Religion" value={labelFor(RELIGION_OPTIONS, data.religion)} />
          <ReviewRow label="Caste" value={data.caste} />
          <ReviewRow label="Gotra" value={data.gotra} />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[7]} step={7} onEdit={onEditStep}>
          <ReviewRow label="Interests" value={data.interests.join(", ") || "—"} />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[8]} step={8} onEdit={onEditStep}>
          <ReviewRow label="Looking for" value={labelFor(LOOKING_FOR_OPTIONS, data.lookingFor)} />
          <ReviewRow label="Age range" value={`${data.prefAgeMin} - ${data.prefAgeMax}`} />
          <ReviewRow
            label="Distance"
            value={labelFor(DISTANCE_OPTIONS, data.distancePreference)}
          />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[9]} step={9} onEdit={onEditStep}>
          <ReviewRow label="Bio" value={data.bio} />
        </ReviewSection>

        <ReviewSection title={REGISTRATION_STEP_LABELS[10]} step={10} onEdit={onEditStep}>
          <ReviewRow
            label="Verified photos"
            value={`${data.photos.filter((photo) => photo.status === "approved").length} photo(s)`}
          />
        </ReviewSection>
      </div>

      <StepNavigation
        onBack={onBack}
        onNext={onSubmit}
        nextLabel="Submit & Start Matching"
        loading={loading}
      />
    </StepCard>
  );
}
