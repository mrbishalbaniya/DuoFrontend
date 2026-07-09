import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * Local bundled humanoid (works offline / when Ready Player Me is blocked).
 * RPM URLs still preferred when the user creates a custom avatar and CDN is reachable.
 */
export const LOCAL_REALISTIC_MODEL_URL = "/models/avatars/xbot.glb";

/** Ready Player Me demo — may fail on networks that cannot resolve models.readyplayer.me */
export const RPM_DEMO_MODEL_URL =
  "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?textureSizeLimit=1024&textureFormat=webp";

export const DEFAULT_REALISTIC_MODEL_URL = LOCAL_REALISTIC_MODEL_URL;

const cache = new Map<string, Promise<THREE.Group>>();

function normalizeLoadError(err: unknown): Error {
  if (err instanceof Error) {
    if (/failed to fetch|load failed|networkerror/i.test(err.message)) {
      return new Error(
        "Could not download the 3D model (network blocked). Using a local avatar instead."
      );
    }
    return err;
  }
  return new Error("Failed to load avatar model");
}

function loadOnce(url: string): Promise<THREE.Group> {
  return new Promise<THREE.Group>((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;
        root.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);
        const height = Math.max(size.y, 0.001);
        const scale = 1.7 / height;
        root.scale.setScalar(scale);
        root.updateMatrixWorld(true);
        const box2 = new THREE.Box3().setFromObject(root);
        root.position.y -= box2.min.y;
        resolve(root);
      },
      undefined,
      (err) => reject(normalizeLoadError(err))
    );
  });
}

/** Proxy remote RPM models through our API when possible (CORS + DNS issues). */
export function toLoadableModelUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return LOCAL_REALISTIC_MODEL_URL;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("readyplayer.me")) {
      return `/api/avatar-model?url=${encodeURIComponent(trimmed)}`;
    }
  } catch {
    /* keep as-is */
  }
  return trimmed;
}

export async function loadGltfAvatar(url: string): Promise<THREE.Group> {
  const primary = toLoadableModelUrl(url);
  const fallbacks = [primary];
  if (primary !== LOCAL_REALISTIC_MODEL_URL) {
    fallbacks.push(LOCAL_REALISTIC_MODEL_URL);
  }

  const cacheKey = fallbacks.join("|");
  let pending = cache.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      let lastError: Error | null = null;
      for (const candidate of fallbacks) {
        try {
          return await loadOnce(candidate);
        } catch (err) {
          lastError = normalizeLoadError(err);
          console.warn("[avatar] model load failed", candidate, lastError.message);
        }
      }
      throw lastError ?? new Error("Failed to load avatar model");
    })();
    cache.set(cacheKey, pending);
  }

  const template = await pending;
  return cloneSkinned(template) as THREE.Group;
}

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) m?.dispose();
    }
  });
}

export { applyConfigMaterials } from "./applyCustomization";

export type RealisticAvatarRig = {
  root: THREE.Group;
  model: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  bones: {
    hips?: THREE.Object3D;
    spine?: THREE.Object3D;
    chest?: THREE.Object3D;
    neck?: THREE.Object3D;
    head?: THREE.Object3D;
    leftUpperArm?: THREE.Object3D;
    rightUpperArm?: THREE.Object3D;
    leftLowerArm?: THREE.Object3D;
    rightLowerArm?: THREE.Object3D;
    leftUpperLeg?: THREE.Object3D;
    rightUpperLeg?: THREE.Object3D;
    leftLowerLeg?: THREE.Object3D;
    rightLowerLeg?: THREE.Object3D;
  };
};

const BONE_ALIASES: Record<keyof RealisticAvatarRig["bones"], string[]> = {
  hips: ["Hips", "hips", "mixamorigHips", "pelvis"],
  spine: ["Spine", "spine", "mixamorigSpine"],
  chest: ["Spine1", "Spine2", "Chest", "chest", "mixamorigSpine1", "mixamorigSpine2"],
  neck: ["Neck", "neck", "mixamorigNeck"],
  head: ["Head", "head", "mixamorigHead"],
  leftUpperArm: ["LeftArm", "LeftUpperArm", "mixamorigLeftArm", "upperarm_l"],
  rightUpperArm: ["RightArm", "RightUpperArm", "mixamorigRightArm", "upperarm_r"],
  leftLowerArm: ["LeftForeArm", "LeftLowerArm", "mixamorigLeftForeArm", "lowerarm_l"],
  rightLowerArm: ["RightForeArm", "RightLowerArm", "mixamorigRightForeArm", "lowerarm_r"],
  leftUpperLeg: ["LeftUpLeg", "LeftUpperLeg", "mixamorigLeftUpLeg", "thigh_l"],
  rightUpperLeg: ["RightUpLeg", "RightUpperLeg", "mixamorigRightUpLeg", "thigh_r"],
  leftLowerLeg: ["LeftLeg", "LeftLowerLeg", "mixamorigLeftLeg", "calf_l"],
  rightLowerLeg: ["RightLeg", "RightLowerLeg", "mixamorigRightLeg", "calf_r"],
};

function findBone(root: THREE.Object3D, names: string[]): THREE.Object3D | undefined {
  for (const name of names) {
    const found = root.getObjectByName(name);
    if (found) return found;
  }
  return undefined;
}

export async function buildRealisticAvatarRig(modelUrl: string): Promise<RealisticAvatarRig> {
  const model = await loadGltfAvatar(modelUrl);
  const root = new THREE.Group();
  root.add(model);

  const bones: RealisticAvatarRig["bones"] = {};
  (Object.keys(BONE_ALIASES) as Array<keyof typeof BONE_ALIASES>).forEach((key) => {
    bones[key] = findBone(model, BONE_ALIASES[key]);
  });

  return { root, model, mixer: null, bones };
}

export function applyRealisticPreviewAnimation(
  rig: RealisticAvatarRig,
  animation: string,
  time: number
): void {
  const { bones, root } = rig;
  const t = time;
  const breathe = Math.sin(t * 2.1) * 0.012;
  if (bones.spine) bones.spine.rotation.x = breathe;
  if (bones.chest) bones.chest.rotation.x = breathe * 0.5;

  switch (animation) {
    case "walk":
    case "run": {
      const speed = animation === "run" ? 8 : 4.5;
      const amp = animation === "run" ? 0.7 : 0.45;
      if (bones.leftUpperLeg) bones.leftUpperLeg.rotation.x = Math.sin(t * speed) * amp;
      if (bones.rightUpperLeg) bones.rightUpperLeg.rotation.x = Math.sin(t * speed + Math.PI) * amp;
      if (bones.leftUpperArm) bones.leftUpperArm.rotation.x = Math.sin(t * speed + Math.PI) * amp * 0.7;
      if (bones.rightUpperArm) bones.rightUpperArm.rotation.x = Math.sin(t * speed) * amp * 0.7;
      root.position.y = Math.abs(Math.sin(t * speed)) * (animation === "run" ? 0.04 : 0.02);
      break;
    }
    case "wave":
      if (bones.rightUpperArm) {
        bones.rightUpperArm.rotation.z = -1.4;
        bones.rightUpperArm.rotation.x = Math.sin(t * 6) * 0.35;
      }
      break;
    case "dance":
      if (bones.hips) bones.hips.rotation.y = Math.sin(t * 3) * 0.2;
      if (bones.leftUpperArm) bones.leftUpperArm.rotation.z = 0.9 + Math.sin(t * 5) * 0.2;
      if (bones.rightUpperArm) bones.rightUpperArm.rotation.z = -0.9 + Math.cos(t * 5) * 0.2;
      break;
    case "celebrate":
    case "jump":
      root.position.y = Math.abs(Math.sin(t * 4)) * 0.12;
      if (bones.leftUpperArm) bones.leftUpperArm.rotation.z = 1.2;
      if (bones.rightUpperArm) bones.rightUpperArm.rotation.z = -1.2;
      break;
    case "sit":
      root.position.y = -0.35;
      if (bones.leftUpperLeg) bones.leftUpperLeg.rotation.x = -1.3;
      if (bones.rightUpperLeg) bones.rightUpperLeg.rotation.x = -1.3;
      break;
    case "selfie":
      if (bones.rightUpperArm) {
        bones.rightUpperArm.rotation.x = -1.5;
        bones.rightUpperArm.rotation.z = -0.5;
      }
      if (bones.head) bones.head.rotation.y = 0.2;
      break;
    case "heart":
      if (bones.leftUpperArm) {
        bones.leftUpperArm.rotation.z = 1.0;
        bones.leftUpperArm.rotation.x = -0.5;
      }
      if (bones.rightUpperArm) {
        bones.rightUpperArm.rotation.z = -1.0;
        bones.rightUpperArm.rotation.x = -0.5;
      }
      break;
    default:
      if (bones.leftUpperArm) bones.leftUpperArm.rotation.z = 0.12 + Math.sin(t) * 0.03;
      if (bones.rightUpperArm) bones.rightUpperArm.rotation.z = -0.12 + Math.cos(t) * 0.03;
      if (bones.head) bones.head.rotation.y = Math.sin(t * 0.6) * 0.08;
      root.position.y = 0;
  }
}

export function resolveModelUrl(config: { modelUrl?: string }): string {
  if (config.modelUrl && config.modelUrl.trim()) return config.modelUrl.trim();
  return LOCAL_REALISTIC_MODEL_URL;
}

/** Normalize Ready Player Me export URL for web (webp textures, size cap). */
export function optimizeRpmUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("readyplayer.me")) return url;
    if (!u.pathname.endsWith(".glb")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://models.readyplayer.me/${id}.glb?textureSizeLimit=1024&textureFormat=webp`;
    }
    u.searchParams.set("textureSizeLimit", "1024");
    u.searchParams.set("textureFormat", "webp");
    return u.toString();
  } catch {
    return url;
  }
}
