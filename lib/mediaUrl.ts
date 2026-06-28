const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:8001";

/** Unsplash portraits — reachable where picsum.photos often times out (522). */
const PLACEHOLDER_PHOTOS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&q=80",
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function placeholderPhotoUrl(seed: string, index = 0, size = "600/800"): string {
  const [w, h] = size.split("/");
  const base = PLACEHOLDER_PHOTOS[(hashSeed(seed) + index) % PLACEHOLDER_PHOTOS.length];
  return base.replace("w=600&h=800", `w=${w}&h=${h}`);
}

function remapPicsumUrl(url: string): string {
  const match = url.match(/picsum\.photos\/seed\/([^/]+)/);
  const seed = match?.[1] ?? "duo";
  const indexMatch = seed.match(/-(\d+)$/);
  const index = indexMatch ? Math.max(0, parseInt(indexMatch[1], 10) - 1) : 0;
  const baseSeed = seed.replace(/-\d+$/, "");
  const sizeMatch = url.match(/\/(\d+)\/(\d+)(?:\?|$)/);
  const size =
    sizeMatch && sizeMatch[1] && sizeMatch[2]
      ? `${sizeMatch[1]}/${sizeMatch[2]}`
      : "600/800";
  return placeholderPhotoUrl(baseSeed, index, size);
}

function isDeadLocalMediaUrl(url: string): boolean {
  return url.startsWith("/media/") || url.includes("://localhost") && url.includes("/media/");
}

/** Resolve stored media URLs (Cloudinary HTTPS, legacy /media/, or broken picsum seeds). */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.includes("picsum.photos")) return remapPicsumUrl(url);
  if (isDeadLocalMediaUrl(url)) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/media/")) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
}

export function isCloudinaryUrl(url?: string | null): boolean {
  return !!url && url.includes("res.cloudinary.com");
}

type PhotoProfile = {
  photo_url?: string | null;
  photo_urls?: string[];
  user_id?: number;
  id?: number;
  full_name?: string;
};

export function resolveProfilePhotoUrl(profile: PhotoProfile, size = "400/500"): string {
  const seed = String(profile.user_id ?? profile.id ?? profile.full_name ?? "duo");
  return (
    resolveMediaUrl(profile.photo_url) ||
    resolveMediaUrl(
      Array.isArray(profile.photo_urls) ? profile.photo_urls.find(Boolean) : undefined
    ) ||
    placeholderPhotoUrl(seed, 0, size)
  );
}

export function resolveProfilePhotoUrls(profile: PhotoProfile, count = 3): string[] {
  const seed = String(profile.user_id ?? profile.id ?? profile.full_name ?? "duo");
  const fallbacks = Array.from({ length: count }, (_, index) =>
    placeholderPhotoUrl(seed, index)
  );

  if (Array.isArray(profile.photo_urls) && profile.photo_urls.length > 0) {
    const urls = profile.photo_urls
      .map((url) => resolveMediaUrl(url))
      .filter((url): url is string => Boolean(url))
      .slice(0, count);
    for (let i = urls.length; i < count; i += 1) {
      urls.push(fallbacks[i]);
    }
    return urls;
  }

  const primary = resolveMediaUrl(profile.photo_url);
  if (primary) {
    return [primary, ...fallbacks.slice(1)];
  }

  return fallbacks;
}
