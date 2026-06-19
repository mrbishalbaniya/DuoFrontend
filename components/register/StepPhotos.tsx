"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
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

export function StepPhotos({ onContinue, onBack }: StepPhotosProps) {
  const { data, patchData } = useRegistrationStore();
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<PhotosFormValues>({
    resolver: zodResolver(photosSchema),
    defaultValues: { photos: data.photos },
  });

  const photos = form.watch("photos");

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (!list.length) return;

      const remaining = 9 - photos.length;
      const selected = list.slice(0, remaining);

      const nextPhotos = await Promise.all(
        selected.map(
          (file) =>
            new Promise<RegistrationPhoto>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  id: `${Date.now()}-${file.name}`,
                  fileName: file.name,
                  previewUrl: String(reader.result),
                  isProfile: photos.length === 0,
                });
              };
              reader.readAsDataURL(file);
            })
        )
      );

      form.setValue("photos", [...photos, ...nextPhotos], { shouldValidate: true });
    },
    [form, photos]
  );

  const removePhoto = (id: string) => {
    const next = photos.filter((photo) => photo.id !== id);
    if (next.length && !next.some((photo) => photo.isProfile)) {
      next[0].isProfile = true;
    }
    form.setValue("photos", next, { shouldValidate: true });
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
      subtitle="Upload at least 2 photos. Your first profile photo appears on your card."
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
          <p className="mt-1 text-sm text-on-surface-variant">Minimum 2, maximum 9 photos</p>
          <label className="mt-4 inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
              }}
            />
            <span className="rounded-full gradient-brand px-5 py-2 text-sm font-semibold text-white">
              Browse files
            </span>
          </label>
        </div>

        {photos.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border",
                  photo.isProfile ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/20"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt={photo.fileName} className="aspect-[3/4] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/80 to-transparent p-2">
                  {!photo.isProfile ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 flex-1 rounded-full text-xs"
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

        <FieldError message={form.formState.errors.photos?.message} />
        <StepNavigation onBack={onBack} onNext={() => submit()} />
      </form>
    </StepCard>
  );
}
