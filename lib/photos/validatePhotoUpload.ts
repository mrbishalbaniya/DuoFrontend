import type { PhotoUploadAnalysisResponse } from "@/types";

export function getPhotoUploadError(
  result: PhotoUploadAnalysisResponse,
  fileName?: string
): string | null {
  if (!result.analysis) {
    return result.detail || "Photo verification failed.";
  }

  if (!result.analysis.face_detected) {
    return "No human face detected. Please upload a clear photo showing your face.";
  }

  if (!result.success || result.analysis.status === "REJECTED") {
    const prefix = fileName ? `${fileName}: ` : "";
    return (
      prefix +
      (result.detail ||
        result.analysis.rejection_reasons.join("; ") ||
        "Photo did not pass verification.")
    );
  }

  if (!result.image_url) {
    return fileName ? `Failed to upload ${fileName}.` : "Photo upload failed.";
  }

  return null;
}

/** Must match PROFILE_IMAGE_TYPES / MAX_PROFILE_UPLOAD_BYTES in the backend. */
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/**
 * Check a file in the browser before uploading it, so obviously bad files
 * never reach the server or use upload quota. Returns an error message or null.
 */
export function validatePhotoFile(file: File): string | null {
  if (!(ALLOWED_PHOTO_TYPES as readonly string[]).includes(file.type)) {
    return "Please choose a JPG, PNG, WebP or GIF image.";
  }
  if (file.size === 0) {
    return "This file is empty. Please choose another photo.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return `This photo is too large. The maximum size is ${MAX_PHOTO_BYTES / (1024 * 1024)} MB.`;
  }
  return null;
}

/** Human-friendly wait, e.g. "45s", "12 min", "1 h 5 min". */
export function formatWait(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 60) return `${s}s`;
  const minutes = Math.ceil(s / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
