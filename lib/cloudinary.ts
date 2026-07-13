/**
 * Cloudinary delivery URL builder — dynamic transforms (no duplicate storage).
 * Mirrors backend `duo_project/cloudinary_media/delivery.py` presets.
 */

export type CloudinaryPreset =
  | "thumb"
  | "avatar"
  | "small"
  | "medium"
  | "large"
  | "discover_card"
  | "match_card"
  | "chat_preview"
  | "gallery"
  | "verification";

const DEFAULT_DELIVERY =
  "f_auto,q_auto:good,fl_progressive,dpr_auto";

const PRESET_TRANSFORMS: Record<CloudinaryPreset, string> = {
  thumb: "w_96,h_96,c_fill,g_face,f_auto,q_auto:good,fl_progressive,dpr_auto",
  avatar: "w_128,h_128,c_fill,g_face,f_auto,q_auto:good,fl_progressive,dpr_auto",
  small: "w_320,h_400,c_fill,g_auto,f_auto,q_auto:good,fl_progressive,dpr_auto",
  medium: "w_640,h_800,c_fill,g_auto,f_auto,q_auto:good,fl_progressive,dpr_auto",
  large: "w_1080,h_1350,c_limit,f_auto,q_auto:good,fl_progressive,dpr_auto",
  discover_card:
    "w_480,h_600,c_fill,g_auto,f_auto,q_auto:good,fl_progressive,dpr_auto",
  match_card:
    "w_420,h_560,c_fill,g_face,f_auto,q_auto:good,fl_progressive,dpr_auto",
  chat_preview: "w_480,h_480,c_limit,f_auto,q_auto:good,fl_progressive,dpr_auto",
  gallery: "w_720,h_900,c_limit,f_auto,q_auto:good,fl_progressive,dpr_auto",
  verification:
    "w_512,h_512,c_fill,g_face,f_auto,q_auto:good,fl_progressive,dpr_auto",
};

const TRANSFORM_SEGMENT_RE = /^(?:[a-z]{1,3}_[^,/]+)(?:,[a-z]{1,3}_[^,/]+)*$/;

export function isCloudinaryDeliveryUrl(url?: string | null): boolean {
  return !!url && url.includes("res.cloudinary.com");
}

function isTransformationSegment(segment: string): boolean {
  if (!segment) return false;
  if (/^v\d+$/.test(segment)) return false;
  return TRANSFORM_SEGMENT_RE.test(segment);
}

/** Apply preset transforms to a Cloudinary URL; passthrough for non-Cloudinary URLs. */
export function cloudinaryUrl(
  url?: string | null,
  preset?: CloudinaryPreset
): string | undefined {
  if (!url) return undefined;
  if (!isCloudinaryDeliveryUrl(url)) return url;

  const transform = preset ? PRESET_TRANSFORMS[preset] : DEFAULT_DELIVERY;
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx < 0) return url;

  const base = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  const segments = rest.split("/");

  while (segments.length > 0 && isTransformationSegment(segments[0]!)) {
    segments.shift();
  }

  return `${base}${transform}/${segments.join("/")}`;
}

/** Blur placeholder data URL for next/image (tiny LQIP-style). */
export function cloudinaryBlurDataUrl(url?: string | null): string | undefined {
  const optimized = cloudinaryUrl(url, "thumb");
  if (!optimized) return undefined;
  const tiny = optimized.replace(
    PRESET_TRANSFORMS.thumb,
    "w_16,h_16,c_fill,e_blur:800,f_auto,q_auto:low"
  );
  return tiny;
}

/** Video poster frame from Cloudinary video URL. */
export function cloudinaryVideoPoster(url?: string | null): string | undefined {
  if (!url || !isCloudinaryDeliveryUrl(url)) return undefined;
  if (!url.includes("/video/upload/")) return undefined;
  return cloudinaryUrl(url.replace("/video/upload/", "/image/upload/"), undefined)?.replace(
    DEFAULT_DELIVERY,
    "w_640,c_fill,f_jpg,q_auto:good"
  );
}
