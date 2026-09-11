"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PhotoAnalysisResult } from "@/components/photos/PhotoAnalysisResult";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import api from "@/lib/api";
import { screenImageForNsfw } from "@/lib/photos/nsfwScreen";
import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import {
  MAX_REGISTRATION_PHOTOS,
  MIN_REGISTRATION_PHOTOS,
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

const UPLOAD_CONCURRENCY = 3;

export function StepPhotos({ onContinue, onBack }: StepPhotosProps) {
  const { data, patchData } = useRegistrationStore();
  const [dragActive, setDragActive] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingPhotoUpload[]>([]);

  const form = useForm<PhotosFormValues>({
    resolver: zodResolver(photosSchema),
    defaultValues: { photos: data.photos },
  });

  const photos = form.watch("photos");

  // Concurrent uploads can each finish around the same moment; if every
  // completion read `photos` from its own render-time closure and called
  // form.setValue(), a later completion would overwrite an earlier one's
  // addition (lost update). This ref always holds the latest list
  // synchronously, so each completion appends onto what the previous one
  // just wrote, not a stale snapshot.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
    // Sync every change into the zustand store (and therefore localStorage)
    // immediately, not just on submit — otherwise clicking "Back" before
    // hitting "Continue" would discard photos that already went through a
    // real, expensive AI-verification round trip.
    patchData({ photos });
  }, [photos, patchData]);

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

  const runUpload = useCallback(
    async (pending: PendingPhotoUpload) => {
      setPendingUploads((prev) =>
        prev.map((p) =>
          p.id === pending.id
            ? { ...p, status: "uploading", errorMessage: undefined, nsfwBlocked: false }
            : p
        )
      );

      try {
        // Best-effort client-side screen, run before the file ever leaves
        // the browser. The backend's own check only verifies face/quality,
        // not content — see lib/photos/nsfwScreen.ts for why this is a
        // stopgap, not a real security boundary.
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
        // Detect and reject outright — no "under review" limbo state. A
        // photo either clears the checks (client-side NSFW screen above,
        // plus the backend's face/quality/content analysis) and is usable
        // immediately, or it's rejected with a clear reason. We don't gate
        // on the backend's separate async moderation record, since that
        // would leave every photo stuck waiting on a queue/worker that may
        // not even be running.
        if (result.photo?.status === "REJECTED") {
          throw new Error(`${pending.file.name}: this photo was rejected by our content checks.`);
        }

        const photo: RegistrationPhoto = {
          id: `${Date.now()}-${pending.file.name}`,
          fileName: pending.file.name,
          previewUrl: pending.previewUrl,
          isProfile: pending.isPrimary && !photosRef.current.some((p) => p.isProfile),
          imageUrl: result.image_url,
          analysis: result.analysis,
          status: "approved",
          moderationStatus: result.photo?.status,
        };
        const nextPhotos = [...photosRef.current, photo];
        photosRef.current = nextPhotos;
        form.setValue("photos", nextPhotos, { shouldValidate: true });

        setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `${pending.file.name}: verification failed.`;
        setPendingUploads((prev) =>
          prev.map((p) => (p.id === pending.id ? { ...p, status: "error", errorMessage: message } : p))
        );
      }
    },
    [form]
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (!list.length) return;

      const remaining = MAX_REGISTRATION_PHOTOS - photosRef.current.length - pendingUploadsRef.current.length;
      const selected = list.slice(0, Math.max(0, remaining));
      if (!selected.length) return;

      const sessionRes = await fetch("/api/backend/auth/me/", {
        credentials: "include",
        cache: "no-store",
      });
      if (!sessionRes.ok) {
        setSessionError("Sign in and complete account setup (steps 1–2) before uploading photos.");
        return;
      }
      setSessionError(null);

      const isFirstBatch = photosRef.current.length === 0 && pendingUploadsRef.current.length === 0;
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
      let cursor = 0;
      const runNext = async (): Promise<void> => {
        const index = cursor;
        cursor += 1;
        if (index >= newPending.length) return;
        await runUpload(newPending[index]);
        return runNext();
      };
      void Promise.all(
        Array.from({ length: Math.min(UPLOAD_CONCURRENCY, newPending.length) }, () => runNext())
      );
    },
    [runUpload]
  );

  const anyUploading = pendingUploads.some((p) => p.status === "uploading");
  const approvedCount = photos.filter((photo) => photo.status === "approved").length;
  const profileAnalysis =
    photos.find((photo) => photo.isProfile && photo.analysis)?.analysis ??
    photos.find((photo) => photo.analysis)?.analysis;

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

  const movePhoto = (id: string, direction: -1 | 1) => {
    const index = photos.findIndex((photo) => photo.id === id);
    if (index < 0) return;
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= photos.length) return;

    const next = [...photos];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    form.setValue("photos", next, { shouldValidate: true });
  };

  const submit = form.handleSubmit((values) => {
    patchData(values);
    onContinue();
  });

  return (
    <StepCard
      title="Photos"
      subtitle={`Upload ${MIN_REGISTRATION_PHOTOS}–${MAX_REGISTRATION_PHOTOS} photos. Each photo is checked instantly with AI for face, quality, and safety.`}
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
            {anyUploading
              ? "Uploading and verifying…"
              : `Upload ${MIN_REGISTRATION_PHOTOS}–${MAX_REGISTRATION_PHOTOS} verified photos`}
          </p>
          <label className="mt-4 inline-flex cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={anyUploading}
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
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

        {sessionError ? (
          <div className="rounded-xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {sessionError}
          </div>
        ) : null}

        {photos.length || pendingUploads.length ? (
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

            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border",
                  photo.isProfile ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/20",
                  photo.status === "rejected" && "border-red-400/60"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt={photo.fileName}
                  className="aspect-[3/4] w-full object-cover"
                />
                {photo.status === "approved" ? (
                  <span className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Verified
                  </span>
                ) : null}

                {photos.length > 1 ? (
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
                      disabled={index === photos.length - 1}
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
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container/40 p-6 text-center text-sm text-on-surface-variant">
            No photos uploaded yet.
          </div>
        )}

        {profileAnalysis ? <PhotoAnalysisResult analysis={profileAnalysis} /> : null}

        <p className="text-xs text-on-surface-variant">
          {approvedCount} of {MIN_REGISTRATION_PHOTOS} required verified photos
          {anyUploading ? " · verification in progress…" : ""}
        </p>

        <FieldError message={form.formState.errors.photos?.message} />
        <StepNavigation
          onBack={onBack}
          onNext={() => submit()}
          loading={anyUploading}
          nextLabel={anyUploading ? "Analyzing…" : "Continue"}
        />
      </form>
    </StepCard>
  );
}
