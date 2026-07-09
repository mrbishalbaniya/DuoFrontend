import type { AvatarConfig } from "@/lib/avatarStudio/types";
import { assembleModularAvatar } from "@/lib/avatarStudio/modularAssembler";
import { loadGltfAvatar, resolveModelUrl } from "@/lib/avatarStudio/realisticAvatar";
import { applyFullStudioCustomization } from "@/lib/avatarStudio/applyCustomization";
import * as THREE from "three";

import type { AvatarRig } from "./AvatarAssets";
import { buildAvatarRig, createAvatarDNA } from "./AvatarAssets";
import { avatarConfigToDNA } from "./configToDNA";

const gltfCache = new Map<string, Promise<THREE.Group>>();

function getCachedModel(url: string): Promise<THREE.Group> {
  let pending = gltfCache.get(url);
  if (!pending) {
    pending = loadGltfAvatar(url);
    gltfCache.set(url, pending);
  }
  return pending;
}

function wrapAsRig(root: THREE.Group): AvatarRig {
  const body = new THREE.Group();
  const head = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const accessoryGroup = new THREE.Group();
  const placeholder = new THREE.Mesh(
    new THREE.SphereGeometry(0.01, 4, 4),
    new THREE.MeshBasicMaterial({ visible: false })
  );

  // Modular assembler already built hierarchy inside root
  body.add(head, leftArm, rightArm, leftLeg, rightLeg, accessoryGroup);

  const ring =
    (root.getObjectByName("modular-avatar") as THREE.Object3D | undefined) ??
    root.children.find((c) => (c as THREE.Mesh).isMesh) ??
    placeholder;

  return {
    root,
    body: (root.getObjectByName("modular-avatar") as THREE.Group) ?? root,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hair: placeholder,
    leftEye: placeholder,
    rightEye: placeholder,
    mouth: placeholder,
    ring: ring as THREE.Mesh,
    glow: placeholder,
    accessoryGroup,
  };
}

function wrapGltfAsRig(model: THREE.Group): AvatarRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const accessoryGroup = new THREE.Group();
  const placeholder = new THREE.Mesh(
    new THREE.SphereGeometry(0.01, 4, 4),
    new THREE.MeshBasicMaterial({ visible: false })
  );

  root.add(body);
  body.add(model, head, leftArm, rightArm, leftLeg, rightLeg, accessoryGroup);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.36, 32),
    new THREE.MeshBasicMaterial({
      color: "#ec4899",
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hair: placeholder,
    leftEye: placeholder,
    rightEye: placeholder,
    mouth: placeholder,
    ring,
    glow: ring,
    accessoryGroup,
  };
}

/**
 * Build a globe avatar from saved studio config.
 * Prefer modular assembly; fall back to external GLB or procedural DNA.
 */
export async function buildGlobeAvatarFromConfig(
  profileId: string,
  config: AvatarConfig | null | undefined,
  lod: "low" | "medium" | "high"
): Promise<AvatarRig> {
  if (config && (config.modelSource === "modular" || config.gender) && !config.modelUrl) {
    const modular = assembleModularAvatar(config);
    const rig = wrapAsRig(modular.root);
    // Point animation bones at modular parts
    rig.body = modular.body;
    rig.head = modular.head;
    rig.leftArm = modular.leftArm;
    rig.rightArm = modular.rightArm;
    rig.leftLeg = modular.leftLeg;
    rig.rightLeg = modular.rightLeg;
    if (lod === "low") modular.root.scale.multiplyScalar(0.95);
    return rig;
  }

  if (config?.modelUrl || config?.modelSource === "gltf" || config?.modelSource === "readyplayerme") {
    try {
      const url = resolveModelUrl(config);
      const model = await getCachedModel(url);
      const rig = wrapGltfAsRig(model);
      if (config) applyFullStudioCustomization(rig.root, config);
      if (lod === "low") model.scale.multiplyScalar(0.98);
      return rig;
    } catch {
      /* fall through */
    }
  }

  if (config) {
    const modular = assembleModularAvatar(config);
    const rig = wrapAsRig(modular.root);
    rig.body = modular.body;
    rig.head = modular.head;
    rig.leftArm = modular.leftArm;
    rig.rightArm = modular.rightArm;
    rig.leftLeg = modular.leftLeg;
    rig.rightLeg = modular.rightLeg;
    return rig;
  }

  const dna = createAvatarDNA(profileId);
  return buildAvatarRig(dna, lod);
}

export function buildGlobeAvatarSync(
  profileId: string,
  config: AvatarConfig | null | undefined,
  lod: "low" | "medium" | "high"
): AvatarRig {
  if (config && (config.modelSource === "modular" || config.gender || !config.modelUrl)) {
    const modular = assembleModularAvatar(config);
    const rig = wrapAsRig(modular.root);
    rig.body = modular.body;
    rig.head = modular.head;
    rig.leftArm = modular.leftArm;
    rig.rightArm = modular.rightArm;
    rig.leftLeg = modular.leftLeg;
    rig.rightLeg = modular.rightLeg;
    return rig;
  }
  const dna = config ? avatarConfigToDNA(config, profileId) : createAvatarDNA(profileId);
  return buildAvatarRig(dna, lod);
}
