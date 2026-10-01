"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PhotoAnalysis } from "@/types";

/**
 * Shared photo slot cards used by registration (step 3) and profile editing,
 * so both flows look and behave the same.
 */

const VERIFYING_WORDS = ["Verifying", "Analyzing", "Quality", "Face", "Content"];

export function VerifyingTicker() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % VERIFYING_WORDS.length), 900);
    return () => clearInterval(timer);
  }, []);
  return (
    <span key={index} className="animate-pulse text-sm font-semibold text-white drop-shadow">
      {VERIFYING_WORDS[index]}…
    </span>
  );
}

export function describeUploadFailure(message: string, rateLimited: boolean): { title: string; icon: string } {
  const m = message.toLowerCase();
  if (rateLimited) return { title: "Upload limit reached", icon: "schedule" };
  if (m.includes("explicit") || m.includes("nsfw") || m.includes("inappropriate"))
    return { title: "Not allowed", icon: "block" };
  if (m.includes("duplicate")) return { title: "Already uploaded", icon: "content_copy" };
  if (m.includes("face")) return { title: "No face detected", icon: "face" };
  if (m.includes("blur") || m.includes("resolution") || m.includes("quality"))
    return { title: "Low quality photo", icon: "blur_on" };
  if (m.includes("type") || m.includes("format") || m.includes("size"))
    return { title: "Unsupported file", icon: "draft" };
  return { title: "Upload failed", icon: "error" };
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Remove photo"
      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
      onClick={onClick}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

function StatusPanel({
  icon,
  title,
  message,
  children,
}: {
  icon: string;
  title: string;
  message: string;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-black/40 px-3 py-4 text-center backdrop-blur-md">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
          <span className="material-symbols-outlined text-xl text-red-400">{icon}</span>
        </span>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="line-clamp-3 text-[11px] leading-relaxed text-white/75">{message}</p>
        {children}
      </div>
    </div>
  );
}

interface EmptyPhotoSlotProps {
  slotIndex: number;
  disabled?: boolean;
  buttonLabel?: string;
  onFile: (file: File) => void;
}

export function EmptyPhotoSlot({ slotIndex, disabled, buttonLabel = "Upload", onFile }: EmptyPhotoSlotProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-outline-variant/30 bg-surface-container/50 p-6 text-center transition-colors">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <span className="material-symbols-outlined text-3xl text-primary">add_a_photo</span>
        </div>
        <div>
          <p className="font-semibold text-on-surface">Photo {slotIndex + 1}</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {slotIndex === 0 ? "Profile photo" : "Additional photo"}
          </p>
        </div>
        <label className={cn("inline-flex", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file);
              event.target.value = "";
            }}
          />
          <span
            className={cn(
              "rounded-full gradient-brand px-4 py-2 text-sm font-semibold text-white",
              disabled && "opacity-50"
            )}
          >
            {buttonLabel}
          </span>
        </label>
      </div>
    </div>
  );
}

interface PendingPhotoCardProps {
  previewUrl: string;
  fileName: string;
  uploading: boolean;
  errorMessage?: string;
  nsfwBlocked?: boolean;
  rateLimited?: boolean;
  canRetry: boolean;
  retryDisabled?: boolean;
  retryLabel?: string;
  onRetry: () => void;
  onRemove: () => void;
}

export function PendingPhotoCard({
  previewUrl,
  fileName,
  uploading,
  errorMessage,
  nsfwBlocked,
  rateLimited,
  canRetry,
  retryDisabled,
  retryLabel = "Try again",
  onRetry,
  onRemove,
}: PendingPhotoCardProps) {
  const msg = (errorMessage ?? "").replace(`${fileName}: `, "");
  const info = describeUploadFailure(msg, Boolean(rateLimited));
  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline-variant/20">
      {nsfwBlocked ? (
        // Never render even a blurred preview of content our own screen flagged.
        <div className="aspect-[3/4] w-full bg-surface-container-high" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={fileName}
          className={cn(
            "aspect-[3/4] w-full object-cover",
            uploading ? "opacity-50" : "scale-110 blur-[10px]"
          )}
        />
      )}
      {uploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <VerifyingTicker />
        </div>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 bg-black/35" />
          <RemoveButton onClick={onRemove} />
          <StatusPanel icon={info.icon} title={info.title} message={msg}>
            {canRetry ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-1 h-8 rounded-full px-5 text-xs font-semibold"
                disabled={retryDisabled}
                onClick={onRetry}
              >
                <span className="material-symbols-outlined mr-1 text-sm">refresh</span>
                {retryLabel}
              </Button>
            ) : null}
          </StatusPanel>
        </>
      )}
    </div>
  );
}

interface UploadedPhotoCardProps {
  src: string;
  fileName: string;
  slotIndex: number;
  status?: "approved" | "rejected" | "analyzing";
  error?: string;
  isProfile: boolean;
  analysis?: PhotoAnalysis;
  flipped: boolean;
  onFlippedChange: (flipped: boolean) => void;
  onRemove: () => void;
  onSetProfile: () => void;
  /** Optional extra controls, such as reorder arrows. */
  extraControls?: ReactNode;
}

export function UploadedPhotoCard({
  src,
  fileName,
  slotIndex,
  status,
  error,
  isProfile,
  analysis,
  flipped,
  onFlippedChange,
  onRemove,
  onSetProfile,
  extraControls,
}: UploadedPhotoCardProps) {
  const rejected = status === "rejected";
  return (
    <div className="space-y-3">
      <div className="relative" style={{ perspective: "1000px" }}>
        <div
          className={cn("relative transition-transform duration-700", flipped && "[transform:rotateY(180deg)]")}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={cn(
              "group relative overflow-hidden rounded-2xl border",
              isProfile ? "border-primary ring-2 ring-primary/30" : "border-outline-variant/20",
              rejected && "border-red-400/60"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={fileName}
              className={cn("aspect-[3/4] w-full object-cover", rejected && "scale-110 blur-[10px]")}
            />
            {status === "approved" ? (
              <span className="absolute left-2 top-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Verified
              </span>
            ) : rejected ? (
              <>
                <div className="pointer-events-none absolute inset-0 bg-black/35" />
                <span className="absolute left-2 top-2 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Rejected
                </span>
                <StatusPanel
                  icon="gpp_bad"
                  title="Photo rejected"
                  message={error ?? "This photo didn't pass our checks. Remove it and upload another."}
                />
              </>
            ) : null}

            <RemoveButton onClick={onRemove} />
            {extraControls}

            {rejected ? null : (
              <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/80 to-transparent p-2">
                {isProfile ? (
                  <span className="flex h-8 flex-1 items-center justify-center rounded-full bg-primary/90 text-xs font-semibold text-white">
                    Profile photo
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 flex-1 rounded-full text-xs"
                    onClick={onSetProfile}
                  >
                    Set profile
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Back: Analysis Results */}
          {analysis ? (
            <div
              className="absolute inset-0 rounded-xl border border-white/10 bg-surface-container-high/95 p-4"
              style={{ 
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  Photo {slotIndex + 1} Analysis
                </p>
                <span
                  className={cn(
                    "text-xs font-bold",
                    analysis.status === "APPROVED" && "text-emerald-400",
                    analysis.status === "WARNING" && "text-amber-400",
                    analysis.status === "REJECTED" && "text-red-400"
                  )}
                >
                  {analysis.status}
                </span>
              </div>

              {status === "rejected" ? (
                <p className="mb-3 rounded-lg bg-red-500/15 px-2 py-1.5 text-[11px] font-semibold leading-snug text-red-300">
                  Rejected: {error ?? "remove this photo and upload another."}
                </p>
              ) : (
                <p className="mb-3 rounded-lg bg-emerald-500/15 px-2 py-1.5 text-[11px] font-semibold text-emerald-300">
                  Verified
                </p>
              )}

              <div className="space-y-2 text-xs">
                {/* Face Detection */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "material-symbols-outlined text-base",
                      analysis.face_detected ? "text-emerald-400" : "text-red-400"
                    )}
                    style={analysis.face_detected ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {analysis.face_detected ? "check_circle" : "cancel"}
                  </span>
                  <span className="text-on-surface">
                    {analysis.face_detected ? "✓ Face detected" : "✗ No face found"}
                  </span>
                </div>

                {/* Person Count */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "material-symbols-outlined text-base",
                      analysis.face_count === 1 ? "text-emerald-400" : analysis.face_count > 1 ? "text-amber-400" : "text-red-400"
                    )}
                    style={analysis.face_count === 1 ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {analysis.face_count === 1 ? "check_circle" : "warning"}
                  </span>
                  <span className="text-on-surface">
                    {analysis.face_count === 1
                      ? "✓ One person only"
                      : analysis.face_count > 1
                        ? `⚠ ${analysis.face_count} people`
                        : "No people"}
                  </span>
                </div>

                {/* Image Quality */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "material-symbols-outlined text-base",
                      analysis.blur_score >= 120 && analysis.resolution_passed
                        ? "text-emerald-400"
                        : "text-amber-400"
                    )}
                    style={
                      analysis.blur_score >= 120 && analysis.resolution_passed
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    {analysis.blur_score >= 120 && analysis.resolution_passed
                      ? "check_circle"
                      : "warning"}
                  </span>
                  <span className="text-on-surface">
                    {analysis.blur_score >= 120 && analysis.resolution_passed
                      ? "✓ Clear & sharp"
                      : analysis.blur_score < 120
                        ? "⚠ Blurry"
                        : "⚠ Low res"}
                  </span>
                </div>

                {/* Face Centered */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "material-symbols-outlined text-base",
                      analysis.face_centered ? "text-emerald-400" : "text-amber-400"
                    )}
                    style={analysis.face_centered ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {analysis.face_centered ? "check_circle" : "warning"}
                  </span>
                  <span className="text-on-surface">
                    {analysis.face_centered ? "✓ Well positioned" : "⚠ Not centered"}
                  </span>
                </div>

                {/* Quality Score */}
                <div className="mt-2 flex items-center justify-between rounded-lg bg-black/20 px-2.5 py-1.5">
                  <span className="font-medium text-on-surface-variant">Quality</span>
                  <span className="font-bold text-on-surface">
                    {analysis.quality_score}
                    <span className="text-[10px] text-on-surface-variant">/100</span>
                  </span>
                </div>

                {/* Warnings */}
                {analysis.warnings.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {analysis.warnings.slice(0, 2).map((warning, idx) => (
                      <p key={idx} className="text-[11px] leading-snug text-amber-300/90">
                        ⚠ {warning}
                      </p>
                    ))}
                  </div>
                ) : null}

                {/* Rejection Reasons */}
                {analysis.rejection_reasons.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {analysis.rejection_reasons.slice(0, 2).map((reason, idx) => (
                      <p key={idx} className="text-[11px] leading-snug text-red-300/90">
                        ✗ {reason}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Flip back button */}
              <button
                type="button"
                onClick={() => onFlippedChange(false)}
                className="mt-3 w-full rounded-full bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/30"
              >
                View Photo
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {analysis && !flipped ? (
        <button
          type="button"
          onClick={() => onFlippedChange(true)}
          className="w-full rounded-full bg-primary/15 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/25"
        >
          View Analysis
        </button>
      ) : null}
    </div>
  );
}
