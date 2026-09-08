"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoAnalysisResult } from "@/components/photos/PhotoAnalysisResult";
import api from "@/lib/api";
import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import {
  CASTE_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  FIELD_OF_STUDY_OPTIONS,
  GOTRA_OPTIONS,
  HOROSCOPE_OPTIONS,
  INCOME_OPTIONS,
  MARRIAGE_PREF_OPTIONS,
  RELIGION_OPTIONS,
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

const selectClassName = inputClassName;

const MIN_PROFILE_PHOTOS = 1;
const MAX_PROFILE_PHOTOS = 3;

interface PendingPhotoUpload {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
  status: "uploading" | "error";
  errorMessage?: string;
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
      prev.map((p) => (p.id === pending.id ? { ...p, status: "uploading", errorMessage: undefined } : p))
    );

    try {
      const result = await api.uploadAndAnalyzePhoto(pending.file, { isPrimary: pending.isPrimary });
      const uploadError = getPhotoUploadError(result, pending.file.name);
      if (uploadError) throw new Error(uploadError);
      if (!result.image_url) {
        throw new Error(`${pending.file.name}: upload succeeded but no image URL was returned.`);
      }

      const photo: ProfileEditPhoto = {
        id: `${Date.now()}-${pending.file.name}`,
        url: result.image_url,
        fileName: pending.file.name,
        // A manual-review photo isn't approved yet — never default it to
        // primary even if this was the user's first upload.
        isProfile: pending.isPrimary && result.photo?.status === "APPROVED",
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

  const isApprovedForPrimary = (photo: ProfileEditPhoto) =>
    photo.moderationStatus === undefined || photo.moderationStatus === "APPROVED";
  const approvedPhotoCount = formData.photos.filter(isApprovedForPrimary).length;

  const removePhoto = (id: string) => {
    const removed = formData.photos.find((photo) => photo.id === id);
    const next = formData.photos.filter((photo) => photo.id !== id);
    if (next.length && !next.some((photo) => photo.isProfile)) {
      const promoted = next.find(isApprovedForPrimary);
      if (promoted) promoted.isProfile = true;
    }
    patch({ photos: next });
    if (removed?.photoId) {
      void api.deletePhoto(removed.photoId).catch(() => {});
    }
  };

  const setProfilePhoto = (id: string) => {
    const target = formData.photos.find((photo) => photo.id === id);
    if (!target || !isApprovedForPrimary(target)) return;
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pending.previewUrl}
                  alt={pending.file.name}
                  className={cn(
                    "aspect-[3/4] w-full object-cover",
                    pending.status === "uploading" && "opacity-50"
                  )}
                />
                {pending.status === "uploading" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span className="text-xs font-semibold text-white drop-shadow">Verifying…</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-end gap-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2">
                    <p className="line-clamp-3 text-[11px] leading-snug text-red-200">
                      {pending.errorMessage}
                    </p>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 flex-1 rounded-full text-[11px]"
                        onClick={() => void runUpload(pending)}
                      >
                        Retry
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-7 rounded-full px-2 text-[11px]"
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
              const underReview = photo.moderationStatus === "MANUAL_REVIEW";
              return (
                <div
                  key={photo.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border",
                    photo.isProfile ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/20"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.fileName} className="aspect-[3/4] w-full object-cover" />

                  {underReview ? (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Under review
                    </span>
                  ) : null}

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
                    ) : underReview ? (
                      <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-on-surface-variant">
                        Pending review
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
          <Field label="Age">
            <Input
              type="number"
              min={18}
              max={100}
              value={formData.age}
              onChange={(event) => patch({ age: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Gender">
            <select
              value={formData.gender}
              onChange={(event) => patch({ gender: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </Field>
          <Field label="Religion">
            <select
              value={formData.religion}
              onChange={(event) => patch({ religion: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select religion</option>
              {RELIGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phone country code">
            <Input
              value={formData.phone_country_code}
              onChange={(event) => patch({ phone_country_code: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Phone number">
            <Input
              value={formData.phone_number}
              onChange={(event) => patch({ phone_number: event.target.value })}
              className={inputClassName}
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
          <Field label="Relationship goal">
            <select
              value={formData.relationship_goal}
              onChange={(event) => patch({ relationship_goal: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select goal</option>
              <option value="dating">Dating</option>
              <option value="serious">Serious</option>
              <option value="casual">Casual</option>
            </select>
          </Field>
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
          <Field label="Education level">
            <select
              value={formData.educationLevel}
              onChange={(event) => patch({ educationLevel: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select level</option>
              {EDUCATION_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Field of study">
            <select
              value={formData.fieldOfStudy}
              onChange={(event) => patch({ fieldOfStudy: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select field</option>
              {FIELD_OF_STUDY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Work preference">
            <select
              value={formData.work_preference}
              onChange={(event) => patch({ work_preference: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select work preference</option>
              <option value="Private">Private sector</option>
              <option value="Government">Government</option>
              <option value="Business">Business / self-employed</option>
              <option value="NotWorking">Not working</option>
            </select>
          </Field>
          <Field label="Monthly income">
            <select
              value={formData.monthlyIncome}
              onChange={(event) => patch({ monthlyIncome: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select income range</option>
              {INCOME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Religion & Background">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Caste">
            <select
              value={formData.caste}
              onChange={(event) => patch({ caste: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select caste</option>
              {CASTE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Gotra">
            <select
              value={formData.gotra}
              onChange={(event) => patch({ gotra: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select gotra</option>
              {GOTRA_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Horoscope">
            <select
              value={formData.horoscope}
              onChange={(event) => patch({ horoscope: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select preference</option>
              {HOROSCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Birth time">
            <Input
              type="time"
              value={formData.birthTime}
              onChange={(event) => patch({ birthTime: event.target.value })}
              className={inputClassName}
            />
          </Field>
          <Field label="Birth place" className="md:col-span-2">
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
          <Field label="Looking for">
            <select
              value={formData.pref_gender}
              onChange={(event) => patch({ pref_gender: event.target.value })}
              className={selectClassName}
            >
              {PREF_GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred religion">
            <select
              value={formData.preferredReligion}
              onChange={(event) => patch({ preferredReligion: event.target.value })}
              className={selectClassName}
            >
              <option value="">Any religion</option>
              {RELIGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
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
          <Field label="Relationship preference">
            <select
              value={formData.pref_relationship_goal}
              onChange={(event) => patch({ pref_relationship_goal: event.target.value })}
              className={selectClassName}
            >
              <option value="everyone">Everyone</option>
              <option value="serious">Serious</option>
              <option value="casual">Casual</option>
              <option value="dating">Dating</option>
            </select>
          </Field>
          <Field label="Inter-caste">
            <select
              value={formData.interCaste}
              onChange={(event) => patch({ interCaste: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select preference</option>
              {MARRIAGE_PREF_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Inter-religion">
            <select
              value={formData.interReligion}
              onChange={(event) => patch({ interReligion: event.target.value })}
              className={selectClassName}
            >
              <option value="">Select preference</option>
              {MARRIAGE_PREF_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
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
          {approvedPhotoCount} of {MIN_PROFILE_PHOTOS} approved photos — add{" "}
          {MIN_PROFILE_PHOTOS - approvedPhotoCount} more, or wait for review to finish, to save.
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
