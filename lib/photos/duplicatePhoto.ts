/**
 * Near-duplicate photo detection using a difference hash (dHash).
 * Identical or re-saved/resized/lightly edited copies produce almost the same
 * hash. A different pose or angle changes the image layout, so the hash differs.
 */

const HASH_W = 17;
const HASH_H = 16;
/** Max differing bits (of 256) to treat two photos as the same image. */
const DUPLICATE_THRESHOLD = 20;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function computePhotoHash(src: string): Promise<boolean[] | null> {
  try {
    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = HASH_W;
    canvas.height = HASH_H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, HASH_W, HASH_H);
    const { data } = ctx.getImageData(0, 0, HASH_W, HASH_H);
    const gray = (x: number, y: number) => {
      const i = (y * HASH_W + x) * 4;
      return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    };
    const bits: boolean[] = [];
    for (let y = 0; y < HASH_H; y += 1) {
      for (let x = 0; x < HASH_W - 1; x += 1) {
        bits.push(gray(x, y) > gray(x + 1, y));
      }
    }
    return bits;
  } catch {
    // Unreadable image (e.g. cross-origin without CORS): skip the check.
    return null;
  }
}

function hammingDistance(a: boolean[], b: boolean[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) d += 1;
  return d;
}

/** True when the new image matches any of the existing images. */
export async function isDuplicatePhoto(newSrc: string, existingSrcs: string[]): Promise<boolean> {
  if (existingSrcs.length === 0) return false;
  const target = await computePhotoHash(newSrc);
  if (!target) return false;
  const hashes = await Promise.all(existingSrcs.map(computePhotoHash));
  return hashes.some((h) => h !== null && hammingDistance(target, h) <= DUPLICATE_THRESHOLD);
}

export const DUPLICATE_PHOTO_MESSAGE =
  "This photo is the same as one you already uploaded. Use a different photo, pose, or angle.";
