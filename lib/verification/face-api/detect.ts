import type { FaceLandmarkPoint } from "@/lib/verification/face-overlay/landmarks";
import { getFaceApi } from "./loadModels";

export interface FaceApiDetectionResult {
  landmarks: FaceLandmarkPoint[];
  expressionHappy: number;
  detectionScore: number;
}

export async function detectFacesOnCanvas(
  canvas: HTMLCanvasElement
): Promise<FaceApiDetectionResult[]> {
  const faceapi = await getFaceApi();
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5,
  });

  const results = await faceapi
    .detectAllFaces(canvas, options)
    .withFaceLandmarks(true)
    .withFaceExpressions();

  const w = canvas.width;
  const h = canvas.height;

  return results.map((result) => {
    const positions = result.landmarks.positions;
    const landmarks: FaceLandmarkPoint[] = positions.map((p) => ({
      x: p.x / w,
      y: p.y / h,
      z: 0,
    }));

    return {
      landmarks,
      expressionHappy: result.expressions?.happy ?? 0,
      detectionScore: result.detection.score,
    };
  });
}
