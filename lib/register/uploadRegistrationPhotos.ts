import { MIN_REGISTRATION_PHOTOS } from "@/lib/validation/registrationSchema";
import type { PhotoAnalysis } from "@/types";
import type { RegistrationPhoto } from "@/types/registration";

export async function uploadRegistrationPhotos(photos: RegistrationPhoto[]): Promise<{
  profilePhotoUrl: string;
  galleryUrls: string[];
  analyses?: PhotoAnalysis[];
}> {
  if (!photos.length) {
    return { profilePhotoUrl: "", galleryUrls: [] };
  }

  const approved = photos.filter(
    (photo) => photo.status === "approved" && photo.imageUrl
  );
  if (approved.length < MIN_REGISTRATION_PHOTOS) {
    throw new Error(
      `Upload and verify at least ${MIN_REGISTRATION_PHOTOS} photos on the Photos step.`
    );
  }

  const profilePhoto =
    approved.find((photo) => photo.isProfile) ?? approved[0];
  const galleryUrls: string[] = [];
  const analyses: PhotoAnalysis[] = [];

  for (const photo of approved) {
    if (photo.analysis) analyses.push(photo.analysis);
    if (photo.id === profilePhoto.id) continue;
    if (photo.imageUrl) galleryUrls.push(photo.imageUrl);
  }

  return {
    profilePhotoUrl: profilePhoto.imageUrl ?? "",
    galleryUrls,
    analyses,
  };
}
