/** Direct download URL for the latest Duo Android APK (GitHub Releases). */
export const ANDROID_APK_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim() ||
  "https://github.com/mrbishalbaniya/duoflutter/releases/latest/download/app-release.apk";

export const ANDROID_RELEASES_URL =
  process.env.NEXT_PUBLIC_ANDROID_RELEASES_URL?.trim() ||
  "https://github.com/mrbishalbaniya/duoflutter/releases/latest";
