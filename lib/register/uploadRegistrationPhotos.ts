import api from "@/lib/api";
import { getPhotoUploadError } from "@/lib/photos/validatePhotoUpload";
import type { PhotoAnalysis } from "@/types";
import type { RegistrationPhoto } from "@/types/registration";

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

export async function uploadRegistrationPhotos(photos: RegistrationPhoto[]): Promise<{
  profilePhotoUrl: string;
  galleryUrls: string[];
  analyses?: PhotoAnalysis[];
}> {
  if (!photos.length) {
    return { profilePhotoUrl: "", galleryUrls: [] };
  }

  const profilePhoto = photos.find((photo) => photo.isProfile) ?? photos[0];
  let profilePhotoUrl = "";
  const galleryUrls: string[] = [];
  const analyses: PhotoAnalysis[] = [];

  for (const photo of photos) {
    const file = await dataUrlToFile(photo.previewUrl, photo.fileName);
    const isPrimary = photo.id === profilePhoto.id;

    const result = await api.uploadAndAnalyzePhoto(file, { isPrimary });
    if (result.analysis) analyses.push(result.analysis);

    const uploadError = getPhotoUploadError(result, photo.fileName);
    if (uploadError) {
      throw new Error(uploadError);
    }

    if (result.image_url) {
      if (isPrimary) {
        profilePhotoUrl = result.image_url;
      } else {
        galleryUrls.push(result.image_url);
      }
    }
  }

  return { profilePhotoUrl, galleryUrls, analyses };
}
