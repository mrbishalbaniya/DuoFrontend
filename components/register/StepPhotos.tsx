"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FieldError, StepCard, StepNavigation } from "@/components/register/StepNavigation";
import {
  EmptyPhotoSlot,
  PendingPhotoCard,
  UploadedPhotoCard,
} from "@/components/photos/PhotoSlotCards";
import api, { RateLimitError } from "@/lib/api";
import { DUPLICATE_PHOTO_MESSAGE, isDuplicatePhoto } from "@/lib/photos/duplicatePhoto";
import { screenImageForNsfw } from "@/lib/photos/nsfwScreen";
import { formatWait, getPhotoUploadError, validatePhotoFile } from "@/lib/photos/validatePhotoUpload";
import {
  MAX_REGISTRATION_PHOTOS,
  MIN_REGISTRATION_PHOTOS,
  photosSchema,
  type PhotosFormValues,
} from "@/lib/validation/registrationSchema";
import { useRegistrationStore } from "@/store/registrationStore";
import type { RegistrationPhoto } from "@/types/registration";

interface StepPhotosProps {
  onContinue: () => void;
  onBack: () => void;
}

interface PendingPhotoUpload {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
  /** Reused on every retry so the server can replay a finished result. */
  idempotencyKey: string;
  status: "uploading" | "error" | "rate_limited";
  errorMessage?: string;
  nsfwBlocked?: boolean;
  /** False when retrying the same file cannot help (e.g. wrong file type). */
  retryable?: boolean;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StepPhotos({ onContinue, onBack }: StepPhotosProps) {
  const { data, patchData } = useRegistrationStore();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingPhotoUpload[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  // Rate-limit cooldown: uploads stay disabled until this timestamp (ms).
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= cooldownUntil) {
        setCooldownUntil(null);
        // The wait is over: rate-limited photos can be retried again.
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.status === "rate_limited"
              ? { ...p, status: "error", errorMessage: "Ready to retry.", retryable: true }
              : p
          )
        );
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);
  const cooldownSeconds = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const inCooldown = cooldownSeconds > 0;
  const cooldownRef = useRef(cooldownUntil);
  cooldownRef.current = cooldownUntil;

  const form = useForm<PhotosFormValues>({
    resolver: zodResolver(photosSchema),
    // Drop empty entries a gappy list may have left in saved registration data.
    defaultValues: { photos: (data.photos ?? []).filter(Boolean) },
  });

  const photos = form.watch("photos");

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
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
    async (pending: PendingPhotoUpload, slotIndex: number) => {
      // Never send a request while rate-limited: it would fail and extend the wait.
      if (cooldownRef.current && Date.now() < cooldownRef.current) {
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.id === pending.id
              ? { ...p, status: "rate_limited", errorMessage: "Upload limit reached." }
              : p
          )
        );
        return;
      }

      setPendingUploads((prev) =>
        prev.map((p) =>
          p.id === pending.id
            ? { ...p, status: "uploading", errorMessage: undefined, nsfwBlocked: false }
            : p
        )
      );

      try {
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

        const result = await api.uploadAndAnalyzePhoto(pending.file, {
          isPrimary: pending.isPrimary,
          idempotencyKey: pending.idempotencyKey,
        });
        const uploadError = getPhotoUploadError(result, pending.file.name);
        if (uploadError) throw new Error(uploadError);
        if (!result.image_url) {
          throw new Error(`${pending.file.name}: upload succeeded but no image URL was returned.`);
        }

        const isRejected =
          result.photo?.status === "REJECTED" || result.analysis?.status === "REJECTED";

        const photo: RegistrationPhoto = {
          id: `${Date.now()}-${pending.file.name}`,
          fileName: pending.file.name,
          previewUrl: pending.previewUrl,
          isProfile: pending.isPrimary && !photosRef.current.some((p) => p.isProfile),
          imageUrl: result.image_url,
          analysis: result.analysis,
          status: isRejected ? "rejected" : "approved",
          error: isRejected
            ? result.analysis?.rejection_reasons?.[0] ??
              "This photo was rejected by our checks. Remove it and upload another."
            : undefined,
          moderationStatus: result.photo?.status,
        };
        // Append, never write at slotIndex: that left holes in the list when
        // uploads finished out of order, which crashed anything reading .status.
        const nextPhotos = [...photosRef.current.filter(Boolean), photo];
        const placedIndex = nextPhotos.length - 1;
        photosRef.current = nextPhotos;
        form.setValue("photos", nextPhotos, { shouldValidate: true });

        setPendingUploads((prev) => prev.filter((p) => p.id !== pending.id));

        // Trigger flip animation after successful upload
        setTimeout(() => {
          setFlippedCards((prev) => new Set(prev).add(placedIndex));
        }, 100);
      } catch (error) {
        if (error instanceof RateLimitError) {
          setCooldownUntil((prev) => Math.max(prev ?? 0, error.retryAt));
          setPendingUploads((prev) =>
            prev.map((p) =>
              p.id === pending.id
                ? { ...p, status: "rate_limited", errorMessage: "Upload limit reached." }
                : p
            )
          );
          return;
        }
        const message =
          error instanceof Error ? error.message : `${pending.file.name}: verification failed.`;
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.id === pending.id ? { ...p, status: "error", errorMessage: message, retryable: true } : p
          )
        );
      }
    },
    [form]
  );

  const addFileToSlot = useCallback(
    async (file: File, requestedSlot: number) => {
      if (cooldownRef.current && Date.now() < cooldownRef.current) return;

      // Photos fill slots left to right, so upload into the first free slot
      // (no photo and no upload in progress) rather than the one clicked.
      const takenByPending = new Set(
        pendingUploadsRef.current.map((p) => Number(p.id.split("-")[1]))
      );
      const photoCount = photosRef.current.filter(Boolean).length;
      let slotIndex = requestedSlot;
      for (let i = 0; i < MAX_REGISTRATION_PHOTOS; i += 1) {
        if (i >= photoCount && !takenByPending.has(i)) {
          slotIndex = i;
          break;
        }
      }

      const isPrimary = slotIndex === 0;
      const makePending = (): PendingPhotoUpload => ({
        id: `slot-${slotIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary,
        idempotencyKey: newIdempotencyKey(),
        status: "uploading",
      });

      // Reject bad files in the browser. They never reach the server.
      const fileError = validatePhotoFile(file);
      if (fileError) {
        setPendingUploads((prev) => [
          ...prev,
          { ...makePending(), status: "error", errorMessage: fileError, retryable: false },
        ]);
        return;
      }

      // Reject exact or near-identical copies of photos already added.
      const candidate = makePending();
      const existingSrcs = [
        ...photosRef.current.filter(Boolean).map((p) => p!.previewUrl),
        ...pendingUploadsRef.current
          .filter((p) => p.status !== "error" && !p.nsfwBlocked)
          .map((p) => p.previewUrl),
      ];
      if (await isDuplicatePhoto(candidate.previewUrl, existingSrcs)) {
        setPendingUploads((prev) => [
          ...prev,
          { ...candidate, status: "error", errorMessage: DUPLICATE_PHOTO_MESSAGE, retryable: false },
        ]);
        return;
      }
      URL.revokeObjectURL(candidate.previewUrl);

      const sessionRes = await fetch("/api/backend/auth/me/", {
        credentials: "include",
        cache: "no-store",
      });
      if (!sessionRes.ok) {
        setSessionError("Sign in and complete account setup (steps 1–2) before uploading photos.");
        return;
      }
      setSessionError(null);

      const pending = makePending();
      setPendingUploads((prev) => [...prev, pending]);
      await runUpload(pending, slotIndex);
    },
    [runUpload]
  );

  const anyUploading = pendingUploads.some((p) => p.status === "uploading");
  const approvedCount = photos.filter((photo) => photo?.status === "approved").length;

  const removePhoto = (id: string, slotIndex: number) => {
    const next = photos.filter((photo) => photo.id !== id);
    if (next.length && !next.some((photo) => photo.isProfile)) {
      next[0].isProfile = true;
    }
    form.setValue("photos", next, { shouldValidate: true });
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(slotIndex);
      return newSet;
    });
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

  const getPhotoAtIndex = (index: number) => {
    return photos[index] || null;
  };

  const getPendingForSlot = (slotIndex: number) => {
    return pendingUploads.find(p => p.id.startsWith(`slot-${slotIndex}-`)) || null;
  };

  const renderPhotoCard = (slotIndex: number) => {
    const photo = getPhotoAtIndex(slotIndex);
    const pending = getPendingForSlot(slotIndex);
    const isFlipped = flippedCards.has(slotIndex);

    if (!photo && !pending) {
      return (
        <EmptyPhotoSlot
          key={`slot-${slotIndex}`}
          slotIndex={slotIndex}
          disabled={inCooldown}
          buttonLabel={inCooldown ? `Wait ${formatWait(cooldownSeconds)}` : "Upload"}
          onFile={(file) => void addFileToSlot(file, slotIndex)}
        />
      );
    }

    if (pending) {
      return (
        <PendingPhotoCard
          key={pending.id}
          previewUrl={pending.previewUrl}
          fileName={pending.file.name}
          uploading={pending.status === "uploading"}
          errorMessage={pending.errorMessage}
          nsfwBlocked={pending.nsfwBlocked}
          rateLimited={pending.status === "rate_limited"}
          canRetry={!pending.nsfwBlocked && pending.retryable !== false}
          retryDisabled={inCooldown}
          retryLabel={inCooldown ? `Retry in ${formatWait(cooldownSeconds)}` : "Try again"}
          onRetry={() => void runUpload(pending, slotIndex)}
          onRemove={() => removePending(pending.id)}
        />
      );
    }

    if (photo) {
      return (
        <UploadedPhotoCard
          key={photo.id}
          src={photo.previewUrl}
          fileName={photo.fileName}
          slotIndex={slotIndex}
          status={photo.status}
          error={photo.error}
          isProfile={photo.isProfile}
          analysis={photo.analysis}
          flipped={isFlipped}
          onFlippedChange={(flip) =>
            setFlippedCards((prev) => {
              const next = new Set(prev);
              if (flip) next.add(slotIndex);
              else next.delete(slotIndex);
              return next;
            })
          }
          onRemove={() => removePhoto(photo.id, slotIndex)}
          onSetProfile={() => setProfilePhoto(photo.id)}
        />
      );
    }

    return null;
  };

  return (
    <StepCard
      title="Photos"
      subtitle={`Upload ${MIN_REGISTRATION_PHOTOS} photos. Each photo is checked instantly with AI for face, quality, and safety.`}
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => renderPhotoCard(index))}
        </div>

        {inCooldown ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          >
            <span className="material-symbols-outlined text-xl text-amber-300">hourglass_top</span>
            <div>
              <p className="font-semibold">Upload limit reached</p>
              <p className="mt-0.5 text-amber-100/80">
                You can upload again in {formatWait(cooldownSeconds)}. Photos you already verified are saved.
              </p>
            </div>
          </div>
        ) : null}

        {sessionError ? (
          <div className="rounded-xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {sessionError}
          </div>
        ) : null}

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
