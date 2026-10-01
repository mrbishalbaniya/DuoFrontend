"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { WritingSuggestions } from "./WritingSuggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import {
  EmptyPhotoSlot,
  PendingPhotoCard,
  UploadedPhotoCard,
} from "@/components/photos/PhotoSlotCards";
import api from "@/lib/api";
import { screenImageForNsfw } from "@/lib/photos/nsfwScreen";
import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import { calculateAgeFromDob, maxBirthDateForMinAge, minBirthDate } from "@/lib/age";
import {
  EDUCATION_LEVEL_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
  INCOME_OPTIONS,
  LANGUAGE_GROUPS,
  OCCUPATION_PREF_OPTIONS,
  RASHI_OPTIONS,
  RELIGION_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
} from "@/lib/register/constants";
import type { ProfileEditFormData, ProfileEditPhoto } from "@/lib/profile/profileForm";
import {
  casteLabelFor,
  casteOptionsFor,
  gotraOptionsFor,
  reconcileBackground,
  subCasteFor,
} from "@/lib/profile/religionBackground";
import { cn } from "@/lib/utils";
import { InterestPicker } from "@/components/profile/InterestPicker";
import { DatePicker } from "@/components/ui/date-picker";
import { HeightSlider } from "@/components/profile/HeightSlider";
import { LifestyleFields } from "@/components/profile/LifestyleFields";

interface ProfileEditFormProps {
  formData: ProfileEditFormData;
  onChange: (data: ProfileEditFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  detectingLocation: boolean;
  locationError: string | null;
  onDetectLocation: () => void;
  /** Edit only this section (per-section edit on the profile page). */
  onlySection?: ProfileEditSection;
}

export const PROFILE_EDIT_SECTIONS = [
  "Photos",
  "Personal",
  "Religion & Background",
  "Education & Career",
  "Lifestyle & Interests",
  "About",
] as const;
export type ProfileEditSection = (typeof PROFILE_EDIT_SECTIONS)[number];

const GENDER_SELECT_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
] as const;

const RELATIONSHIP_GOAL_SELECT_OPTIONS = [
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious" },
  { value: "casual", label: "Casual" },
] as const;

function FormSection({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4 rounded-2xl border border-outline-variant/20 bg-secondary/20 p-5">
      <h3 className="text-lg font-bold font-[var(--font-headline)] text-on-surface">{title}</h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-bold text-on-surface-variant">{label}</Label>
      {children}
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-outline-variant/30 bg-secondary/50 px-4 py-3 outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/25";

const MIN_PROFILE_PHOTOS = 1;
const MAX_PROFILE_PHOTOS = 3;

interface PendingPhotoUpload {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
  status: "uploading" | "error";
  errorMessage?: string;
  /** Rejected by the client-side content screen, not the backend — the
   * preview must never be shown for these, even blurred-then-revealed. */
  nsfwBlocked?: boolean;
}

const OTHER_OCCUPATION = "__other";
const OCCUPATION_LABELS: string[] = OCCUPATION_PREF_OPTIONS.map((option) => option.label);

/** Occupation dropdown using the same groups as partner preferences, with
 * "Other" for anything not listed (occupation stays free text on the backend). */
function OccupationField({
  value,
  onChange,
  inputClassName,
}: {
  value: string;
  onChange: (next: string) => void;
  inputClassName: string;
}) {
  const listed = OCCUPATION_LABELS.find((label) => label.toLowerCase() === value.trim().toLowerCase());
  const [otherMode, setOtherMode] = useState(() => Boolean(value.trim()) && !listed);
  const selectValue = otherMode ? OTHER_OCCUPATION : listed ?? "";

  return (
    <div className="space-y-3">
      <SelectField
        label="Occupation"
        options={[
          { value: "", label: "Select occupation" },
          ...OCCUPATION_LABELS.map((label) => ({ value: label, label })),
          { value: OTHER_OCCUPATION, label: "Other (type your own)" },
        ]}
        value={selectValue}
        hidePlaceholderOption
        onChange={(event) => {
          const next = event.target.value;
          if (next === OTHER_OCCUPATION) {
            setOtherMode(true);
            if (listed) onChange("");
            return;
          }
          setOtherMode(false);
          onChange(next);
        }}
      />
      {otherMode ? (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Your occupation"
          maxLength={300}
          className={inputClassName}
        />
      ) : null}
    </div>
  );
}

export function ProfileEditForm({
  formData,
  onChange,
  onSave,
  onCancel,
  saving,
  detectingLocation,
  locationError,
  onDetectLocation,
  onlySection,
}: ProfileEditFormProps) {
  const show = (section: ProfileEditSection) => !onlySection || onlySection === section;
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [pendingUploads, setPendingUploads] = useState<PendingPhotoUpload[]>([]);

  const patch = useCallback(
    (patchData: Partial<ProfileEditFormData>) => {
      onChange({ ...formData, ...patchData });
    },
    [formData, onChange]
  );

  // Concurrent uploads can each finish around the same moment; if every
  // completion read `formData.photos` from its own render-time closure and
  // called patch(), a later completion would overwrite an earlier one's
  // addition (lost update). This ref always holds the latest list
  // synchronously, so each completion appends onto what the previous one
  // just wrote, not a stale snapshot.
  const photosRef = useRef(formData.photos);
  useEffect(() => {
    photosRef.current = formData.photos;
  }, [formData.photos]);

  const pendingUploadsRef = useRef(pendingUploads);
  pendingUploadsRef.current = pendingUploads;
  useEffect(
    () => () => {
      pendingUploadsRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    },
    []
  );

  const removePending = useCallback((id: string) => {
    setPendingUploads((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const runUpload = useCallback(async (pending: PendingPhotoUpload) => {
    setPendingUploads((prev) =>
      prev.map((p) =>
        p.id === pending.id
          ? { ...p, status: "uploading", errorMessage: undefined, nsfwBlocked: false }
          : p
      )
    );

    try {
      // Best-effort client-side screen, run before the file ever leaves the
      // browser. The backend's own check only verifies face/quality, not
      // content — see lib/photos/nsfwScreen.ts for why this is a stopgap,
      // not a real security boundary.
      const nsfw = await screenImageForNsfw(pending.file);
      if (nsfw.blocked) {
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.id === pending.id
              ? { ...p, status: "error", errorMessage: nsfw.reason, nsfwBlocked: true }
              : p
          )
        );
        return;
      }

      const result = await api.uploadAndAnalyzePhoto(pending.file, { isPrimary: pending.isPrimary });
      const uploadError = getPhotoUploadError(result, pending.file.name);
      if (uploadError) throw new Error(uploadError);
      if (!result.image_url) {
        throw new Error(`${pending.file.name}: upload succeeded but no image URL was returned.`);
      }
      // Detect and reject outright — no "under review" limbo state. A photo
      // either clears the checks (client-side NSFW screen above, plus the
      // backend's face/quality/content analysis) and is usable immediately,
      // or it's rejected with a clear reason. We don't gate on the
      // backend's separate async moderation record, since that would leave
      // every photo stuck waiting on a queue/worker that may not even be
      // running.
      const isRejected =
        result.photo?.status === "REJECTED" || result.analysis?.status === "REJECTED";

      const photo: ProfileEditPhoto = {
        id: `${Date.now()}-${pending.file.name}`,
        url: result.image_url,
        fileName: pending.file.name,
        isProfile: pending.isPrimary,
        analysis: result.analysis,
        photoId: result.photo?.id,
        moderationStatus: result.photo?.status,
        status: isRejected ? "rejected" : "approved",
        error: isRejected
          ? result.analysis?.rejection_reasons?.[0] ??
            "This photo was rejected by our checks. Remove it and upload another."
          : undefined,
      };
      const nextPhotos = [...photosRef.current, photo];
      photosRef.current = nextPhotos;
      patch({ photos: nextPhotos });

      URL.revokeObjectURL(pending.previewUrl);
      setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
      // Flip the new card to show its analysis, same as registration.
      setTimeout(() => setFlippedIds((prev) => new Set(prev).add(photo.id)), 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : `${pending.file.name}: verification failed.`;
      setPendingUploads((prev) =>
        prev.map((p) => (p.id === pending.id ? { ...p, status: "error", errorMessage: message } : p))
      );
    }
  }, [patch]);

  const addPhotoFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (!list.length) return;

      const remaining = MAX_PROFILE_PHOTOS - formData.photos.length - pendingUploads.length;
      const selected = list.slice(0, Math.max(0, remaining));
      if (!selected.length) return;

      const isFirstBatch = formData.photos.length === 0 && pendingUploads.length === 0;
      const newPending: PendingPhotoUpload[] = selected.map((file, index) => ({
        id: `${Date.now()}-${file.name}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: isFirstBatch && index === 0,
        status: "uploading",
      }));

      setPendingUploads((prev) => [...prev, ...newPending]);

      // Upload concurrently (a few at a time) instead of one-by-one — with N
      // photos selected, this is close to N times faster than sequential
      // awaits, since each upload+analysis is an independent server round trip.
      const CONCURRENCY = 3;
      let cursor = 0;
      const runNext = async (): Promise<void> => {
        const index = cursor;
        cursor += 1;
        if (index >= newPending.length) return;
        await runUpload(newPending[index]);
        return runNext();
      };
      void Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, newPending.length) }, () => runNext())
      );
    },
    [formData.photos.length, pendingUploads.length, runUpload]
  );

  const anyUploading = pendingUploads.some((p) => p.status === "uploading");

  // Rejected photos stay on their card so the user sees why, but they don't
  // count toward the minimum and must be removed before saving.
  const approvedPhotoCount = formData.photos.filter((photo) => photo.status !== "rejected").length;
  const hasRejectedPhoto = formData.photos.some((photo) => photo.status === "rejected");

  const removePhoto = (id: string) => {
    const removed = formData.photos.find((photo) => photo.id === id);
    const next = formData.photos.filter((photo) => photo.id !== id);
    if (next.length && !next.some((photo) => photo.isProfile)) {
      next[0].isProfile = true;
    }
    patch({ photos: next });
    if (removed?.photoId) {
      void api.deletePhoto(removed.photoId).catch(() => {});
    }
  };

  const setProfilePhoto = (id: string) => {
    const target = formData.photos.find((photo) => photo.id === id);
    if (!target) return;
    patch({
      photos: formData.photos.map((photo) => ({ ...photo, isProfile: photo.id === id })),
    });
    if (target.photoId) {
      void api.setPhotoPrimary(target.photoId).catch(() => {});
    }
  };

  const movePhoto = (id: string, direction: -1 | 1) => {
    const index = formData.photos.findIndex((photo) => photo.id === id);
    if (index < 0) return;
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= formData.photos.length) return;

    const next = [...formData.photos];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    patch({ photos: next });

    const photoIds = next
      .map((photo) => photo.photoId)
      .filter((photoId): photoId is number => photoId != null);
    if (photoIds.length === next.length) {
      void api.reorderPhotos(photoIds).catch(() => {});
    }
  };

  // Religion drives caste, caste drives sub-caste/clan and gotra. Changing
  // one level clears answers below it that no longer apply.
  const patchBackground = (change: { religion?: string; caste?: string }) => {
    const religion = change.religion ?? formData.religion;
    const next = reconcileBackground({
      religion,
      caste: change.caste ?? formData.caste,
      subCaste: formData.subCaste,
      gotra: formData.gotra,
    });
    patch({ religion, ...next });
  };
  // Keep a previously saved value visible even if it's outside today's list.
  const withSaved = (list: string[], saved: string) =>
    saved && !list.includes(saved) ? [saved, ...list] : list;
  const casteOptions = (() => {
    const list = casteOptionsFor(formData.religion);
    return list.length ? withSaved(list, formData.caste) : list;
  })();
  const subCaste = subCasteFor(formData.caste);
  const subCasteOptions = subCaste ? withSaved(subCaste.options, formData.subCaste) : [];
  const gotraList = gotraOptionsFor(formData.religion, formData.caste);
  const gotraOptions = gotraList ? withSaved(gotraList, formData.gotra) : null;

  return (
    <div className="space-y-6 rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_4px_24px] shadow-primary/6 sm:rounded-[2rem] sm:p-8">
      {/* Full-profile header; a single-section edit uses the section title and footer buttons instead. */}
      {!onlySection ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold font-[var(--font-headline)] text-on-surface">Edit Profile</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-secondary"
          >
            Cancel
          </button>
        </div>
      ) : null}

      {show("Photos") ? (
      <FormSection title="Photos">
        <p className="text-sm text-on-surface-variant">
          Upload {MIN_PROFILE_PHOTOS}–{MAX_PROFILE_PHOTOS} photos. Each photo is checked instantly with AI for
          face, quality, and safety.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: MAX_PROFILE_PHOTOS }, (_, slotIndex) => {
            const photo = formData.photos[slotIndex];
            if (photo) {
              return (
                <UploadedPhotoCard
                  key={photo.id}
                  src={photo.url}
                  fileName={photo.fileName}
                  slotIndex={slotIndex}
                  // Photos loaded from the saved profile were approved earlier.
                  status={photo.status ?? "approved"}
                  error={photo.error}
                  isProfile={photo.isProfile}
                  analysis={photo.analysis}
                  flipped={flippedIds.has(photo.id)}
                  onFlippedChange={(flip) =>
                    setFlippedIds((prev) => {
                      const next = new Set(prev);
                      if (flip) next.add(photo.id);
                      else next.delete(photo.id);
                      return next;
                    })
                  }
                  onRemove={() => removePhoto(photo.id)}
                  onSetProfile={() => setProfilePhoto(photo.id)}
                  extraControls={
                    formData.photos.length > 1 && photo.status !== "rejected" ? (
                      <div className="absolute right-2 top-11 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label="Move photo earlier"
                          disabled={slotIndex === 0}
                          onClick={() => movePhoto(photo.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-base">arrow_back</span>
                        </button>
                        <button
                          type="button"
                          aria-label="Move photo later"
                          disabled={slotIndex === formData.photos.length - 1}
                          onClick={() => movePhoto(photo.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </button>
                      </div>
                    ) : null
                  }
                />
              );
            }
            const pending = pendingUploads[slotIndex - formData.photos.length];
            if (pending) {
              return (
                <PendingPhotoCard
                  key={pending.id}
                  previewUrl={pending.previewUrl}
                  fileName={pending.file.name}
                  uploading={pending.status === "uploading"}
                  errorMessage={pending.errorMessage}
                  nsfwBlocked={pending.nsfwBlocked}
                  canRetry={!pending.nsfwBlocked}
                  onRetry={() => void runUpload(pending)}
                  onRemove={() => removePending(pending.id)}
                />
              );
            }
            return (
              <EmptyPhotoSlot
                key={`slot-${slotIndex}`}
                slotIndex={slotIndex}
                onFile={(file) => addPhotoFiles([file])}
              />
            );
          })}
        </div>
        <p className="text-xs text-on-surface-variant">
          {approvedPhotoCount} of {MIN_PROFILE_PHOTOS} required verified photos
          {anyUploading ? " · verification in progress…" : ""}
          {hasRejectedPhoto ? " · remove rejected photos to save" : ""}
        </p>
      </FormSection>
      ) : null}

      {show("Personal") ? (
      <FormSection title="Personal">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Full name">
            <Input
              value={formData.full_name}
              onChange={(event) => patch({ full_name: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Date of birth">
            <DatePicker
              min={minBirthDate()}
              max={maxBirthDateForMinAge(18)}
              value={formData.dateOfBirth}
              onChange={(dob) =>
                patch({
                  dateOfBirth: dob,
                  age: dob ? String(calculateAgeFromDob(dob)) : formData.age,
                })
              }
              placeholder="Select your date of birth"
            />
            {formData.age ? (
              <p className="ml-1 text-xs text-on-surface-variant">Age: {formData.age}</p>
            ) : null}
          </Field>
          <SelectField
            label="Gender"
            options={GENDER_SELECT_OPTIONS}
            value={formData.gender}
            placeholder="Select gender"
            onChange={(event) => patch({ gender: event.target.value })}
          />
          <SelectField
            label="Relationship goal"
            options={RELATIONSHIP_GOAL_SELECT_OPTIONS}
            value={formData.relationship_goal}
            placeholder="Select goal"
            onChange={(event) => patch({ relationship_goal: event.target.value })}
          />
          <HeightSlider value={formData.height} onChange={(height) => patch({ height })} />
          <Field label="Location">
            <div className="flex gap-2">
              <Input
                value={formData.location}
                onChange={(event) => patch({ location: event.target.value })}
                placeholder={detectingLocation ? "Detecting location…" : "City, Country"}
                className={cn(inputClassName, "min-w-0 flex-1")}
              />
              <button
                type="button"
                onClick={onDetectLocation}
                disabled={detectingLocation}
                aria-label="Detect current location"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[22px] ${detectingLocation ? "animate-pulse" : ""}`}>
                  my_location
                </span>
              </button>
            </div>
            {locationError ? <p className="text-xs text-error">{locationError}</p> : null}
          </Field>
        </div>
      </FormSection>
      ) : null}

      {show("Religion & Background") ? (
      <FormSection title="Religion & Background">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Religion"
            options={RELIGION_OPTIONS.map((option) => ({ value: option.label, label: option.label }))}
            value={formData.religion}
            placeholder="Select religion"
            onChange={(event) =>
              patchBackground({ religion: event.target.value })
            }
          />
          {casteOptions.length ? (
            <SelectField
              label={casteLabelFor(formData.religion)}
              options={casteOptions}
              value={formData.caste}
              placeholder="Select"
              disabled={casteOptions.length === 1 && casteOptions[0] === formData.caste}
              onChange={(event) => patchBackground({ caste: event.target.value })}
            />
          ) : null}
          {subCaste ? (
            <SelectField
              label={subCaste.label}
              options={subCasteOptions}
              value={formData.subCaste}
              placeholder="Select"
              onChange={(event) => patch({ subCaste: event.target.value })}
            />
          ) : null}
          {gotraOptions ? (
            <SelectField
              label="Gotra"
              options={gotraOptions}
              value={formData.gotra}
              placeholder="Select gotra"
              onChange={(event) => patch({ gotra: event.target.value })}
            />
          ) : null}
          {!formData.religion ? (
            <p className="self-center text-sm text-on-surface-variant">
              Choose a religion to see matching community, clan and gotra options.
            </p>
          ) : null}
          <SelectField
            label="Horoscope (Rashi)"
            options={RASHI_OPTIONS}
            value={formData.horoscope}
            placeholder="Select your rashi"
            onChange={(event) => patch({ horoscope: event.target.value })}
          />
          <Field label="Birth time">
            <Input
              type="time"
              value={formData.birthTime}
              onChange={(event) => patch({ birthTime: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Birth place">
            <Input
              value={formData.birthPlace}
              onChange={(event) => patch({ birthPlace: event.target.value })}
              className={inputClassName}
            />
          </Field>
        </div>
        <InterestPicker
          label="Languages"
          groups={LANGUAGE_GROUPS}
          searchPlaceholder="Search languages"
          selected={formData.languages}
          onChange={(languages) => patch({ languages })}
        />
      </FormSection>
      ) : null}

      {show("Education & Career") ? (
      <FormSection title="Education & Career">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Education level"
            options={EDUCATION_LEVEL_OPTIONS}
            value={formData.educationLevel}
            placeholder="Select level"
            onChange={(event) => patch({ educationLevel: event.target.value })}
          />
          <SelectField
            label="Field of study"
            options={FIELD_OF_STUDY_OPTIONS}
            value={formData.fieldOfStudy}
            placeholder="Select field"
            onChange={(event) => patch({ fieldOfStudy: event.target.value })}
          />
          <OccupationField
            value={formData.occupation}
            onChange={(occupation) => patch({ occupation })}
            inputClassName={inputClassName}
          />
          <Field label="Company">
            <Input
              value={formData.company}
              onChange={(event) => patch({ company: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <SelectField
            label="Work preference"
            options={WORK_PREFERENCE_OPTIONS}
            value={formData.work_preference}
            placeholder="Select work preference"
            onChange={(event) => patch({ work_preference: event.target.value })}
          />
          <SelectField
            label="Monthly income"
            options={INCOME_OPTIONS}
            value={formData.monthlyIncome}
            placeholder="Select income range"
            onChange={(event) => patch({ monthlyIncome: event.target.value })}
          />
        </div>
      </FormSection>
      ) : null}

      {show("Lifestyle & Interests") ? (
      <FormSection title="Lifestyle & Interests">
        <LifestyleFields
          value={formData.lifestyleTagsText}
          onChange={(lifestyleTagsText) => patch({ lifestyleTagsText })}
          inputClassName={inputClassName}
        />
      </FormSection>
      ) : null}

      {show("About") ? (
      <FormSection title="About">
        <Field label="Bio">
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(event) => patch({ bio: event.target.value })}
            placeholder="A few lines about you: what you do, what you love, and what makes you laugh."
            className={cn(inputClassName, "resize-none")}
          />
          <WritingSuggestions field="bio" draft={formData} onPick={(bio) => patch({ bio })} />
        </Field>
        <Field label="Looking for">
          <textarea
            rows={2}
            value={formData.lookingForText}
            onChange={(event) => patch({ lookingForText: event.target.value })}
            placeholder="Who you hope to meet, e.g. someone kind, family-oriented and up for weekend treks."
            className={cn(inputClassName, "resize-none")}
          />
          <WritingSuggestions
            field="looking_for"
            draft={formData}
            onPick={(lookingForText) => patch({ lookingForText })}
          />
        </Field>
        <Field label="Future goals">
          <textarea
            rows={2}
            value={formData.futureGoals}
            onChange={(event) => patch({ futureGoals: event.target.value })}
            placeholder="Where you see yourself in a few years: career, family, travel or anything else."
            className={cn(inputClassName, "resize-none")}
          />
          <WritingSuggestions
            field="future_goals"
            draft={formData}
            onPick={(futureGoals) => patch({ futureGoals })}
          />
        </Field>
      </FormSection>
      ) : null}


      {approvedPhotoCount < MIN_PROFILE_PHOTOS ? (
        <p className="text-center text-sm text-on-surface-variant">
          {approvedPhotoCount} of {MIN_PROFILE_PHOTOS} photos — add{" "}
          {MIN_PROFILE_PHOTOS - approvedPhotoCount} more to save.
        </p>
      ) : null}

      <div className="flex gap-3">
        {onlySection ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-full border border-outline-variant/30 py-4 font-bold text-on-surface transition-colors hover:bg-secondary/60 disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || anyUploading || hasRejectedPhoto || approvedPhotoCount < MIN_PROFILE_PHOTOS}
          className="flex-1 rounded-full py-4 font-bold text-white shadow-lg shadow-primary/20 gradient-brand transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? "Saving..." : onlySection ? "Save" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
