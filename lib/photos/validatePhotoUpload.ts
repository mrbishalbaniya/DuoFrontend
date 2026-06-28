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
