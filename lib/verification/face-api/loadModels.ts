import type * as FaceApi from "@vladmandic/face-api";

const MODEL_URI = "/models/face-api";

let faceApiModule: typeof FaceApi | null = null;
let loadPromise: Promise<typeof FaceApi> | null = null;

export async function getFaceApi(): Promise<typeof FaceApi> {
  if (faceApiModule) return faceApiModule;

  if (!loadPromise) {
    loadPromise = (async () => {
      const faceapi = await import("@vladmandic/face-api");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URI),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URI),
      ]);
      faceApiModule = faceapi;
      return faceapi;
    })();
  }

  return loadPromise;
}
