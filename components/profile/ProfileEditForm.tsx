"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/ui/select-field";
import { DuoPhoneInput, type Value as PhoneValue } from "@/components/ui/phone-input";
import { PhotoAnalysisResult } from "@/components/photos/PhotoAnalysisResult";
import api from "@/lib/api";
import { screenImageForNsfw } from "@/lib/photos/nsfwScreen";
import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import { splitPhoneValue } from "@/lib/phone";
import { calculateAgeFromDob, maxBirthDateForMinAge, minBirthDate } from "@/lib/age";
import {
  CASTE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
  GOTRA_OPTIONS,
  INCOME_OPTIONS,
  MARRIAGE_PREF_OPTIONS,
  RASHI_OPTIONS,
  RELIGION_OPTIONS,
  WORK_PREFERENCE_OPTIONS,
} from "@/lib/register/constants";
import type { ProfileEditFormData, ProfileEditPhoto } from "@/lib/profile/profileForm";
import { cn } from "@/lib/utils";

interface ProfileEditFormProps {
  formData: ProfileEditFormData;
  onChange: (data: ProfileEditFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  saveError: string | null;
  detectingLocation: boolean;
  locationError: string | null;
  onDetectLocation: () => void;
}

const PREF_GENDER_OPTIONS = [
  { value: "women", label: "Female" },
  { value: "men", label: "Male" },
  { value: "everyone", label: "Everyone" },
] as const;

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

const PREF_RELATIONSHIP_GOAL_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "serious", label: "Serious" },
  { value: "casual", label: "Casual" },
  { value: "dating", label: "Dating" },
] as const;

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-outline-variant/20 bg-secondary/20 p-5">
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

export function ProfileEditForm({
  formData,
  onChange,
  onSave,
  onCancel,
  saving,
  saveError,
  detectingLocation,
  locationError,
  onDetectLocation,
}: ProfileEditFormProps) {
  const [dragActive, setDragActive] = useState(false);
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
      if (result.photo?.status === "REJECTED") {
        throw new Error(`${pending.file.name}: this photo was rejected by our content checks.`);
      }

      const photo: ProfileEditPhoto = {
        id: `${Date.now()}-${pending.file.name}`,
        url: result.image_url,
        fileName: pending.file.name,
        isProfile: pending.isPrimary,
        analysis: result.analysis,
        photoId: result.photo?.id,
        moderationStatus: result.photo?.status,
      };
      const nextPhotos = [...photosRef.current, photo];
      photosRef.current = nextPhotos;
      patch({ photos: nextPhotos });

      URL.revokeObjectURL(pending.previewUrl);
      setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
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

  // A photo only ever enters formData.photos after clearing the client-side
  // NSFW screen and the backend's analysis/moderation checks in runUpload
  // (anything explicitly rejected throws before it gets here), so every
  // photo present is already usable — no separate "approved" filter needed.
  const approvedPhotoCount = formData.photos.length;

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

  return (
    <div className="space-y-6 rounded-2xl border border-primary/10 bg-background p-6 shadow-[0_4px_24px] shadow-primary/6 sm:rounded-[2rem] sm:p-8">
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

      {saveError ? (
        <div className="rounded-xl bg-error-container p-4 text-sm font-medium text-on-error-container">
          {saveError}
        </div>
      ) : null}

      <FormSection title="Photos">
        <div
          className={cn(
            "rounded-[1.5rem] border border-dashed p-6 text-center transition-colors",
            dragActive ? "border-primary bg-primary/10" : "border-outline-variant/30 bg-surface-container/50"
          )}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addPhotoFiles(event.dataTransfer.files);
          }}
        >
          <p className="text-sm text-on-surface-variant">
            {anyUploading
              ? "Uploading and verifying…"
              : `Drag photos here or browse. Upload ${MIN_PROFILE_PHOTOS}–${MAX_PROFILE_PHOTOS} photos — each one is verified automatically.`}
          </p>
          <label className="mt-3 inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={anyUploading}
              onChange={(event) => {
                if (event.target.files) addPhotoFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <span
              className={cn(
                "rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white",
                anyUploading && "pointer-events-none opacity-60"
              )}
            >
              {anyUploading ? "Uploading…" : "Browse files"}
            </span>
          </label>
        </div>

        {formData.photos.some((photo) => photo.analysis) ? (
          <PhotoAnalysisResult
            analysis={
              [...formData.photos].reverse().find((photo) => photo.analysis)?.analysis!
            }
          />
        ) : null}

        {formData.photos.length || pendingUploads.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pendingUploads.map((pending) => (
              <div
                key={pending.id}
                className="relative overflow-hidden rounded-2xl border border-outline-variant/20"
              >
                {pending.nsfwBlocked ? (
                  // Never render even a blurred preview of content our own
                  // screen flagged as explicit — show a plain placeholder.
                  <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 bg-surface-container-high p-3 text-center">
                    <span className="material-symbols-outlined text-3xl text-red-300">block</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pending.previewUrl}
                    alt={pending.file.name}
                    className={cn(
                      "aspect-[3/4] w-full object-cover",
                      pending.status === "uploading" && "opacity-50"
                    )}
                  />
                )}
                {pending.status === "uploading" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span className="text-xs font-semibold text-white drop-shadow">Verifying…</span>
                  </div>
                ) : (
                  <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2">
                    <p className="line-clamp-3 text-[11px] leading-snug text-red-200">
                      {pending.errorMessage}
                    </p>
                    <div className="flex gap-1.5">
                      {pending.nsfwBlocked ? null : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 flex-1 rounded-full text-[11px]"
                          onClick={() => void runUpload(pending)}
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className={cn("h-7 rounded-full px-2 text-[11px]", pending.nsfwBlocked && "flex-1")}
                        onClick={() => removePending(pending.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {formData.photos.map((photo, index) => {
              return (
                <div
                  key={photo.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border",
                    photo.isProfile ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/20"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.fileName}
                    className="aspect-[3/4] w-full object-cover"
                  />

                  {formData.photos.length > 1 ? (
                    <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Move photo earlier"
                        disabled={index === 0}
                        onClick={() => movePhoto(photo.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-base">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Move photo later"
                        disabled={index === formData.photos.length - 1}
                        onClick={() => movePhoto(photo.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-30"
                      >
                        <span className="material-symbols-outlined text-base">arrow_downward</span>
                      </button>
                    </div>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/80 to-transparent p-2">
                    {photo.isProfile ? (
                      <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-primary/90 text-xs font-semibold text-white">
                        Profile photo
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 flex-1 rounded-full text-xs"
                        onClick={() => setProfilePhoto(photo.id)}
                      >
                        Set profile
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={() => removePhoto(photo.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </FormSection>

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
            <Input
              type="date"
              min={minBirthDate()}
              max={maxBirthDateForMinAge(18)}
              value={formData.dateOfBirth}
              onChange={(event) => {
                const dob = event.target.value;
                patch({
                  dateOfBirth: dob,
                  age: dob ? String(calculateAgeFromDob(dob)) : formData.age,
                });
              }}
              className={inputClassName}
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
          <Field label="Phone number">
            <DuoPhoneInput
              id="profile-phone"
              size="compact"
              value={
                ((formData.phone_country_code || "+977") + formData.phone_number) as PhoneValue
              }
              onChange={(value: PhoneValue) => {
                const split = splitPhoneValue(value ?? "");
                patch({
                  phone_country_code: split?.phone_country_code ?? formData.phone_country_code,
                  phone_number: split?.phone_number ?? "",
                });
              }}
            />
          </Field>
          <Field label="Height">
            <Input
              value={formData.height}
              onChange={(event) => patch({ height: event.target.value })}
              placeholder={"5'6\""}
              className={inputClassName}
            />
          </Field>
          <SelectField
            label="Relationship goal"
            options={RELATIONSHIP_GOAL_SELECT_OPTIONS}
            value={formData.relationship_goal}
            placeholder="Select goal"
            onChange={(event) => patch({ relationship_goal: event.target.value })}
          />
        </div>

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
      </FormSection>

      <FormSection title="About">
        <Field label="Bio">
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(event) => patch({ bio: event.target.value })}
            className={cn(inputClassName, "resize-none")}
          />
        </Field>
        <Field label="Looking for">
          <textarea
            rows={2}
            value={formData.lookingForText}
            onChange={(event) => patch({ lookingForText: event.target.value })}
            className={cn(inputClassName, "resize-none")}
          />
        </Field>
        <Field label="Future goals">
          <textarea
            rows={2}
            value={formData.futureGoals}
            onChange={(event) => patch({ futureGoals: event.target.value })}
            className={cn(inputClassName, "resize-none")}
          />
        </Field>
      </FormSection>

      <FormSection title="Education & Career">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Education summary">
            <Input
              value={formData.education}
              onChange={(event) => patch({ education: event.target.value })}
              className={inputClassName}
            />
          </Field>
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
          <Field label="Occupation">
            <Input
              value={formData.occupation}
              onChange={(event) => patch({ occupation: event.target.value })}
              className={inputClassName}
            />
          </Field>
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

      <FormSection title="Religion & Background">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Religion"
            options={RELIGION_OPTIONS.map((option) => ({ value: option.label, label: option.label }))}
            value={formData.religion}
            placeholder="Select religion"
            onChange={(event) => patch({ religion: event.target.value })}
          />
          <SelectField
            label="Caste"
            options={[...CASTE_OPTIONS]}
            value={formData.caste}
            placeholder="Select caste"
            onChange={(event) => patch({ caste: event.target.value })}
          />
          <SelectField
            label="Gotra"
            options={[...GOTRA_OPTIONS]}
            value={formData.gotra}
            placeholder="Select gotra"
            onChange={(event) => patch({ gotra: event.target.value })}
          />
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
      </FormSection>

      <FormSection title="Lifestyle & Interests">
        <Field label="Tags (comma separated)">
          <textarea
            rows={3}
            value={formData.lifestyleTagsText}
            onChange={(event) => patch({ lifestyleTagsText: event.target.value })}
            placeholder="Trekking, Music, personality:introvert, smoking:no"
            className={cn(inputClassName, "resize-none")}
          />
        </Field>
      </FormSection>

      <FormSection title="Partner Preferences">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Looking for"
            options={PREF_GENDER_OPTIONS}
            value={formData.pref_gender}
            hidePlaceholderOption
            onChange={(event) => patch({ pref_gender: event.target.value })}
          />
          <SelectField
            label="Preferred religion"
            options={RELIGION_OPTIONS}
            value={formData.preferredReligion}
            placeholder="Any religion"
            onChange={(event) => patch({ preferredReligion: event.target.value })}
          />
          <Field label="Preferred age min">
            <Input
              type="number"
              min={18}
              max={80}
              value={formData.pref_age_min}
              onChange={(event) => patch({ pref_age_min: Number(event.target.value) || 18 })}
              className={inputClassName}
            />
          </Field>
          <Field label="Preferred age max">
            <Input
              type="number"
              min={18}
              max={80}
              value={formData.pref_age_max}
              onChange={(event) => patch({ pref_age_max: Number(event.target.value) || 35 })}
              className={inputClassName}
            />
          </Field>
          <Field label="Min height">
            <Input
              value={formData.pref_min_height}
              onChange={(event) => patch({ pref_min_height: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Preferred occupation">
            <Input
              value={formData.pref_occupation}
              onChange={(event) => patch({ pref_occupation: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Preferred location">
            <Input
              value={formData.pref_location}
              onChange={(event) => patch({ pref_location: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Max distance (km)">
            <Input
              type="number"
              min={1}
              max={500}
              value={formData.pref_max_distance_km}
              onChange={(event) =>
                patch({ pref_max_distance_km: Number(event.target.value) || 50 })
              }
              className={inputClassName}
            />
          </Field>
          <SelectField
            label="Relationship preference"
            options={PREF_RELATIONSHIP_GOAL_OPTIONS}
            value={formData.pref_relationship_goal}
            hidePlaceholderOption
            onChange={(event) => patch({ pref_relationship_goal: event.target.value })}
          />
          <SelectField
            label="Inter-caste"
            options={MARRIAGE_PREF_OPTIONS}
            value={formData.interCaste}
            placeholder="Select preference"
            onChange={(event) => patch({ interCaste: event.target.value })}
          />
          <SelectField
            label="Inter-religion"
            options={MARRIAGE_PREF_OPTIONS}
            value={formData.interReligion}
            placeholder="Select preference"
            onChange={(event) => patch({ interReligion: event.target.value })}
          />
          <Field label="Verified profiles only" className="md:col-span-2">
            <label className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-secondary/50 px-4 py-3">
              <input
                type="checkbox"
                checked={formData.pref_verified_only}
                onChange={(event) => patch({ pref_verified_only: event.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm text-on-surface">Only show verified profiles in discovery</span>
            </label>
          </Field>
        </div>
      </FormSection>

      {approvedPhotoCount < MIN_PROFILE_PHOTOS ? (
        <p className="text-center text-sm text-on-surface-variant">
          {approvedPhotoCount} of {MIN_PROFILE_PHOTOS} photos — add{" "}
          {MIN_PROFILE_PHOTOS - approvedPhotoCount} more to save.
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={saving || approvedPhotoCount < MIN_PROFILE_PHOTOS}
        className="w-full rounded-full py-4 font-bold text-white shadow-lg shadow-primary/20 gradient-brand transition-all active:scale-95 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
