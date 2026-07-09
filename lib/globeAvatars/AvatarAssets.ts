import * as THREE from "three";

import type { AvatarDNA } from "./types";

const SKIN_TONES = [
  "#f5d0b5",
  "#e8b796",
  "#c68642",
  "#8d5524",
  "#5c3a21",
  "#ffdfc4",
];

const HAIR_COLORS = [
  "#1a1208",
  "#3d2314",
  "#6b4423",
  "#c9a227",
  "#e8e8e8",
  "#8b4513",
  "#2c1810",
];

const SHIRT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#22c55e",
  "#ef4444",
];

const PANTS_COLORS = ["#1e293b", "#334155", "#4c1d95", "#0f766e", "#713f12"];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], seed: number, salt: number): T {
  return arr[(seed + salt) % arr.length]!;
}

export function createAvatarDNA(profileId: string): AvatarDNA {
  const seed = hashSeed(profileId);
  const hairStyles = [0, 1, 2, 3] as const;
  const accessories = ["none", "glasses", "hat", "earrings"] as const;
  const outfits = ["casual", "formal", "sporty"] as const;

  return {
    seed,
    skinTone: pick(SKIN_TONES, seed, 1),
    hairStyle: pick(hairStyles, seed, 3),
    hairColor: pick(HAIR_COLORS, seed, 5),
    shirtColor: pick(SHIRT_COLORS, seed, 7),
    pantsColor: pick(PANTS_COLORS, seed, 11),
    shoeColor: "#1f2937",
    accessory: pick(accessories, seed, 13),
    outfitStyle: pick(outfits, seed, 17),
  };
}

function mat(color: string, roughness = 0.55, metalness = 0.05): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  material.depthTest = false;
  material.depthWrite = false;
  return material;
}

function box(w: number, h: number, d: number, color: string, y: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function sphere(r: number, color: string, y: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(color));
  mesh.position.y = y;
  mesh.castShadow = true;
  return mesh;
}

export type AvatarRig = {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  hair: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  mouth: THREE.Mesh;
  ring: THREE.Mesh;
  glow: THREE.Mesh;
  accessoryGroup: THREE.Group;
};

export function buildAvatarRig(dna: AvatarDNA, lod: "low" | "medium" | "high"): AvatarRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const accessoryGroup = new THREE.Group();

  root.add(body);
  body.add(head, leftArm, rightArm, leftLeg, rightLeg);

  const torso = box(0.42, 0.55, 0.28, dna.shirtColor, 0.72);
  const hips = box(0.38, 0.2, 0.26, dna.pantsColor, 0.42);
  body.add(torso, hips);

  const headMesh = sphere(0.22, dna.skinTone, 1.18);
  head.add(headMesh);

  const leftEye = sphere(0.035, "#ffffff", 1.22);
  leftEye.position.set(-0.07, 0, 0.18);
  const rightEye = sphere(0.035, "#ffffff", 1.22);
  rightEye.position.set(0.07, 0, 0.18);
  const pupilL = sphere(0.018, "#1e293b", 1.22);
  pupilL.position.set(-0.07, 0, 0.2);
  const pupilR = sphere(0.018, "#1e293b", 1.22);
  pupilR.position.set(0.07, 0, 0.2);
  head.add(leftEye, rightEye, pupilL, pupilR);

  const mouth = sphere(0.03, "#c45c6a", 1.08);
  mouth.position.z = 0.19;
  mouth.scale.set(1.4, 0.5, 0.6);
  head.add(mouth);

  const hairStyles: Record<AvatarDNA["hairStyle"], () => THREE.Mesh> = {
    0: () => sphere(0.24, dna.hairColor, 1.28),
    1: () => {
      const m = box(0.44, 0.18, 0.36, dna.hairColor, 1.32);
      return m;
    },
    2: () => {
      const m = box(0.3, 0.35, 0.3, dna.hairColor, 1.25);
      m.position.x = 0.08;
      return m;
    },
    3: () => sphere(0.26, dna.hairColor, 1.3),
  };
  const hair = hairStyles[dna.hairStyle]();
  head.add(hair);

  leftArm.position.set(-0.28, 0.88, 0);
  rightArm.position.set(0.28, 0.88, 0);
  leftArm.add(box(0.12, 0.42, 0.12, dna.shirtColor, 0.18));
  rightArm.add(box(0.12, 0.42, 0.12, dna.shirtColor, 0.18));

  leftLeg.position.set(-0.1, 0.38, 0);
  rightLeg.position.set(0.1, 0.38, 0);
  leftLeg.add(box(0.14, 0.42, 0.14, dna.pantsColor, 0.18));
  rightLeg.add(box(0.14, 0.42, 0.14, dna.pantsColor, 0.18));
  leftLeg.add(box(0.15, 0.1, 0.22, dna.shoeColor, -0.02));
  rightLeg.add(box(0.15, 0.1, 0.22, dna.shoeColor, -0.02));

  if (lod !== "low" && dna.accessory === "glasses") {
    const glasses = box(0.28, 0.05, 0.04, "#1e293b", 1.22);
    glasses.position.z = 0.2;
    accessoryGroup.add(glasses);
  }
  if (lod === "high" && dna.accessory === "hat") {
    const hat = box(0.34, 0.08, 0.34, dna.shirtColor, 1.42);
    accessoryGroup.add(hat);
  }
  head.add(accessoryGroup);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.46, 32),
    new THREE.MeshBasicMaterial({
      color: "#ec4899",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 24),
    new THREE.MeshBasicMaterial({
      color: "#ec4899",
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.01;
  root.add(glow);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hair,
    leftEye: pupilL,
    rightEye: pupilR,
    mouth,
    ring,
    glow,
    accessoryGroup,
  };
}
