import api from "@/lib/api";
import type { RegistrationPhoto } from "@/types/registration";

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

export async function uploadRegistrationPhotos(photos: RegistrationPhoto[]): Promise<{
  profilePhotoUrl: string;
  galleryUrls: string[];
}> {
  if (!photos.length) {
    return { profilePhotoUrl: "", galleryUrls: [] };
  }

  const profilePhoto = photos.find((photo) => photo.isProfile) ?? photos[0];
  let profilePhotoUrl = "";
  const galleryUrls: string[] = [];

  for (const photo of photos) {
    const file = await dataUrlToFile(photo.previewUrl, photo.fileName);
    const { image_url } = await api.uploadProfilePhoto(file);

    if (photo.id === profilePhoto.id) {
      profilePhotoUrl = image_url;
    } else {
      galleryUrls.push(image_url);
    }
  }

  return { profilePhotoUrl, galleryUrls };
}
