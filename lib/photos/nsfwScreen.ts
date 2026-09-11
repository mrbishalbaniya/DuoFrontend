/**
 * Client-side, best-effort screen for explicit/nude imagery, run in the
 * browser before a selected photo is uploaded or shown to the user.
 *
 * IMPORTANT: this is NOT a security control. It only protects people going
 * through this app's own UI — anyone calling the upload API directly
 * bypasses it entirely. The backend's photo-verification endpoint currently
 * only checks face detection, framing, and image quality; it has no content
 * moderation of its own. Real enforcement (the only thing that can't be
 * bypassed) has to be added server-side. This module exists to stop obvious
 * explicit content from ever being displayed as "Verified" or usable as a
 * profile photo for honest users using the normal flow, while that backend
 * gap gets fixed.
 */

export interface NsfwScreenResult {
  blocked: boolean;
  reason?: string;
}

// nsfwjs's default model classifies into five buckets. We block on the
// classes that are unambiguously explicit (Porn, Hentai) rather than
// "Sexy", which flags plenty of ordinary swimwear/gym photos and would
// cause too many false positives for a dating app's normal photo range.
const PORN_CLASS = "Porn";
const HENTAI_CLASS = "Hentai";
const SINGLE_CLASS_THRESHOLD = 0.6;
const COMBINED_THRESHOLD = 0.75;

type NsfwModel = {
  classify: (
    img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData
  ) => Promise<Array<{ className: string; probability: number }>>;
};

let modelPromise: Promise<NsfwModel> | null = null;

async function loadModel(): Promise<NsfwModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      // Dynamically imported so the ~5-10MB model and TensorFlow.js runtime
      // are only ever fetched when someone actually opens a photo step,
      // not bundled into the app's initial load.
      const nsfwjs = await import("nsfwjs");
      return nsfwjs.load();
    })();
  }
  return modelPromise;
}

function loadImageElement(file: File): Promise<{ img: HTMLImageElement; revoke: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, revoke: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file for content screening."));
    };
    img.src = url;
  });
}

export async function screenImageForNsfw(file: File): Promise<NsfwScreenResult> {
  let revoke: (() => void) | undefined;
  try {
    const [model, loaded] = await Promise.all([loadModel(), loadImageElement(file)]);
    revoke = loaded.revoke;

    const predictions = await model.classify(loaded.img);
    const porn = predictions.find((p) => p.className === PORN_CLASS)?.probability ?? 0;
    const hentai = predictions.find((p) => p.className === HENTAI_CLASS)?.probability ?? 0;

    if (porn >= SINGLE_CLASS_THRESHOLD || hentai >= SINGLE_CLASS_THRESHOLD || porn + hentai >= COMBINED_THRESHOLD) {
      return {
        blocked: true,
        reason: "This photo appears to contain explicit content and can't be uploaded.",
      };
    }
    return { blocked: false };
  } catch (error) {
    // Fail open: if the model can't load (offline, blocked CDN, unsupported
    // browser) we don't want to lock legitimate users out of uploading
    // photos entirely over a best-effort client-side check.
    console.warn("NSFW screening unavailable, allowing upload to proceed:", error);
    return { blocked: false };
  } finally {
    revoke?.();
  }
}
