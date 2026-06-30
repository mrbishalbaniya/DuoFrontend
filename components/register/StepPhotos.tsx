"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PhotoAnalysisResult } from "@/components/photos/PhotoAnalysisResult";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import api from "@/lib/api";
import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import {
  photosSchema,
  type PhotosFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";
import type { RegistrationPhoto } from "@/types/registration";
import { cn } from "@/lib/utils";

interface StepPhotosProps {
  onContinue: () => void;
  onBack: () => void;
}

function readPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

export function StepPhotos({ onContinue, onBack }: StepPhotosProps) {
  const { data, patchData } = useRegistrationStore();
  const [dragActive, setDragActive] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);

  const form = useForm<PhotosFormValues>({
    resolver: zodResolver(photosSchema),
    defaultValues: { photos: data.photos },
  });

  const photos = form.watch("photos");
  const approvedCount = photos.filter((photo) => photo.status === "approved").length;
  const profileAnalysis =
    photos.find((photo) => photo.isProfile && photo.analysis)?.analysis ??
    photos.find((photo) => photo.analysis)?.analysis;

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (!list.length) return;

      const remaining = 9 - photos.length;
      const selected = list.slice(0, remaining);
      if (!selected.length) return;

      const sessionRes = await fetch("/api/backend/auth/me/", {
        credentials: "include",
        cache: "no-store",
      });
      if (!sessionRes.ok) {
        setPhotoError("Sign in and complete account setup (steps 1–2) before uploading photos.");
        return;
      }

      setPhotoError(null);
      setAnalyzingPhotos(true);

      try {
        const uploaded: RegistrationPhoto[] = [...photos];
        const isFirstPhoto = photos.length === 0;

        for (let index = 0; index < selected.length; index += 1) {
          const file = selected[index];
          const isPrimary = isFirstPhoto && index === 0 && !uploaded.some((photo) => photo.isProfile);
          const previewUrl = await readPreview(file);

          const result = await api.uploadAndAnalyzePhoto(file, { isPrimary });
          const uploadError = getPhotoUploadError(result, file.name);
          if (uploadError) {
            throw new Error(uploadError);
          }
          if (!result.image_url) {
            throw new Error(`${file.name}: upload succeeded but no image URL was returned.`);
          }

          uploaded.push({
            id: `${Date.now()}-${file.name}-${index}`,
            fileName: file.name,
            previewUrl,
            isProfile: isPrimary,
            imageUrl: result.image_url,
            analysis: result.analysis,
            status: "approved",
          });
        }

        if (uploaded.length && !uploaded.some((photo) => photo.isProfile)) {
          uploaded[0].isProfile = true;
        }

        form.setValue("photos", uploaded, { shouldValidate: true });
      } catch (error) {
        setPhotoError(error instanceof Error ? error.message : "Photo verification failed.");
      } finally {
        setAnalyzingPhotos(false);
      }
    },
    [form, photos]
  );

  const removePhoto = (id: string) => {
    const next = photos.filter((photo) => photo.id !== id);
    if (next.length && !next.some((photo) => photo.isProfile)) {
      next[0].isProfile = true;
    }
    form.setValue("photos", next, { shouldValidate: true });
    setPhotoError(null);
  };

  const setProfilePhoto = (id: string) => {
    form.setValue(
      "photos",
      photos.map((photo) => ({ ...photo, isProfile: photo.id === id })),
      { shouldValidate: true }
    );
  };

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard
      title="Photos"
      subtitle="Upload at least 2 photos. Each photo is checked instantly with AI for face, quality, and safety."
    >
      <form onSubmit={submit} className="space-y-5">
        <div
          className={cn(
            "rounded-[1.5rem] border border-dashed p-8 text-center transition-colors",
            dragActive
              ? "border-primary bg-primary/10"
              : "border-outline-variant/30 bg-surface-container/50"
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
            void addFiles(event.dataTransfer.files);
          }}
        >
          <span className="material-symbols-outlined text-4xl text-primary">add_a_photo</span>
          <p className="mt-3 font-semibold text-on-surface">Drag & drop photos here</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {analyzingPhotos
              ? "Running AI verification (face, blur, AI-generated detection)…"
              : "Minimum 2 verified photos, maximum 9"}
          </p>
          <label className="mt-4 inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={analyzingPhotos}
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <span
              className={cn(
                "rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white",
                analyzingPhotos && "pointer-events-none opacity-60"
              )}
            >
              {analyzingPhotos ? "Analyzing…" : "Browse files"}
            </span>
          </label>
        </div>

        {photoError ? (
          <div className="rounded-xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {photoError}
          </div>
        ) : null}

        {photos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border",
                  photo.isProfile ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/20",
                  photo.status === "rejected" && "border-red-400/60"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt={photo.fileName} className="aspect-[3/4] w-full object-cover" />
                {photo.status === "approved" ? (
                  <span className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Verified
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/80 to-transparent p-2">
                  {!photo.isProfile ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 flex-1 rounded-full text-xs"
                      disabled={analyzingPhotos}
                      onClick={() => setProfilePhoto(photo.id)}
                    >
                      Set profile
                    </Button>
                  ) : (
                    <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-primary/90 text-xs font-semibold text-white">
                      Profile photo
                    </span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 rounded-full px-3 text-xs"
                    disabled={analyzingPhotos}
                    onClick={() => removePhoto(photo.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container/40 p-6 text-center text-sm text-on-surface-variant">
            No photos uploaded yet.
          </div>
        )}

        {profileAnalysis ? <PhotoAnalysisResult analysis={profileAnalysis} /> : null}

        <p className="text-xs text-on-surface-variant">
          {approvedCount} of 2 minimum verified photo{approvedCount === 1 ? "" : "s"}
          {analyzingPhotos ? " · verification in progress…" : ""}
        </p>

        <FieldError message={form.formState.errors.photos?.message} />
        <StepNavigation
          onBack={onBack}
          onNext={() => submit()}
          loading={analyzingPhotos}
          nextLabel={analyzingPhotos ? "Analyzing…" : "Continue"}
        />
      </form>
    </StepCard>
  );
}
