import * as THREE from "three";

import type { AvatarConfig } from "./types";
import { SKIN_TONES } from "./types";

export type MaterialSlot = "skin" | "outfit" | "accent" | "hair" | "eyes" | "unknown";

/** Classify mesh/material for Mixamo Xbot, Soldier, RPM, and generic humanoids. */
export function classifyMaterialSlot(mesh: THREE.Mesh, mat: THREE.Material): MaterialSlot {
  const blob = `${mesh.name} ${mesh.parent?.name ?? ""} ${mat.name}`.toLowerCase();

  if (/hair|beard|brow|lash|scalp/.test(blob)) return "hair";
  if (/eye|iris|pupil|visor/.test(blob)) return "eyes";
  if (/joint|skeleton|beta_joints/.test(blob)) return "accent";
  if (
    /shirt|top|torso|outfit|clothing|pants|pant|shoe|boot|jacket|hoodie|vanguardbody|clothes/.test(
      blob
    )
  ) {
    return "outfit";
  }
  if (/skin|body|surface|beta_surface|head|face|arm|hand|neck|limb|asdf1:beta/.test(blob)) {
    return "skin";
  }
  return "unknown";
}

function ensureUniqueMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((m) => m.clone());
    } else if (mesh.material) {
      mesh.material = mesh.material.clone();
    }
  });
}

function setMatColor(mat: THREE.Material, hex: string): void {
  if (!("color" in mat)) return;
  const std = mat as THREE.MeshStandardMaterial;
  // Drop albedo map so swatches are visible on textured models
  if (std.map) std.map = null;
  std.color.set(hex);
  std.needsUpdate = true;
}

/**
 * Apply studio colors to a realistic GLTF.
 * Clones materials once so the shared GLTF cache stays clean.
 */
export function applyConfigMaterials(
  root: THREE.Object3D,
  colors: {
    skinTone?: string;
    hairColor?: string;
    shirtColor?: string;
    pantsColor?: string;
    shoeColor?: string;
    eyeColor?: string;
    jacketColor?: string;
  }
): void {
  if (!root.userData.__duoMatsCloned) {
    ensureUniqueMaterials(root);
    root.userData.__duoMatsCloned = true;
  }

  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      const slot = classifyMaterialSlot(mesh, mat);

      if (slot === "hair" && colors.hairColor) {
        setMatColor(mat, colors.hairColor);
      } else if (slot === "eyes" && (colors.eyeColor || colors.shirtColor)) {
        setMatColor(mat, colors.eyeColor || colors.shirtColor!);
      } else if (slot === "accent") {
        // Xbot joints → pants / hair accent so clothing colors show
        const accent = colors.pantsColor || colors.hairColor || colors.jacketColor || colors.shoeColor;
        if (accent) setMatColor(mat, accent);
      } else if (slot === "outfit") {
        const outfit = colors.shirtColor || colors.pantsColor;
        if (outfit) setMatColor(mat, outfit);
      } else if (slot === "skin") {
        // Xbot/single-mesh: shirt + skin both drive the body surface (shirt wins for clothing UX)
        const primary = colors.shirtColor || colors.skinTone;
        if (primary) setMatColor(mat, primary);
      } else if (colors.shirtColor || colors.skinTone) {
        setMatColor(mat, (colors.shirtColor || colors.skinTone)!);
      }
    }
  });
}

function disposeGroup(group: THREE.Object3D): void {
  group.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) m?.dispose();
  });
}

function findHeadBone(root: THREE.Object3D): THREE.Object3D | undefined {
  const preferred = ["mixamorigHead", "mixamorig:Head", "Head", "head"];
  for (const name of preferred) {
    const found = root.getObjectByName(name);
    if (found) return found;
  }
  let best: THREE.Object3D | undefined;
  let bestY = -Infinity;
  const world = new THREE.Vector3();
  root.traverse((obj) => {
    if (!/head/i.test(obj.name) || /end|top|hair/i.test(obj.name)) return;
    obj.getWorldPosition(world);
    if (world.y > bestY) {
      bestY = world.y;
      best = obj;
    }
  });
  return best;
}

/** Procedural overlays so hair / glasses / hat / beard controls work on simple GLBs. */
export function syncCustomizationOverlays(rigRoot: THREE.Group, config: AvatarConfig): void {
  const existing = rigRoot.userData.__duoOverlay as THREE.Group | undefined;
  if (existing?.parent) {
    existing.parent.remove(existing);
    disposeGroup(existing);
  }

  const overlay = new THREE.Group();
  overlay.name = "duo-custom-overlays";

  const head = findHeadBone(rigRoot);
  const parent = head ?? rigRoot;
  // Local offset: Mixamo head bone origin is near neck; nudge up/forward
  const y = head ? 0.1 : 1.55;
  const z = head ? 0.02 : 0;

  const hairColor = config.hairColor || "#3d2314";
  const hs = Math.abs(config.hairStyle) % 8;
  const vol = 0.85 + (config.hairVolume / 100) * 0.45;
  const len = 0.7 + (config.hairLength / 100) * 0.7;
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.72 });

  if (hs === 0) {
    const buzz = new THREE.Mesh(new THREE.SphereGeometry(0.11 * vol, 16, 12), hairMat);
    buzz.scale.set(1.05, 0.5, 1.05);
    buzz.position.set(0, y + 0.06, z);
    overlay.add(buzz);
  } else if (hs <= 2) {
    const short = new THREE.Mesh(new THREE.SphereGeometry(0.13 * vol, 16, 14), hairMat);
    short.position.set(0, y + 0.08, z);
    overlay.add(short);
  } else if (hs <= 4) {
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.125 * vol, 16, 14), hairMat.clone());
    top.position.set(0, y + 0.08, z);
    const tail = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.035, 0.16 * len, 6, 10),
      hairMat.clone()
    );
    tail.position.set(0, y - 0.02, z - 0.1);
    overlay.add(top, tail);
  } else if (hs === 5) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12 * vol, 14, 12), hairMat.clone());
    bun.position.set(0, y + 0.06, z);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.06 * vol, 12, 10), hairMat.clone());
    knot.position.set(0, y + 0.16, z - 0.04);
    overlay.add(bun, knot);
  } else {
    const afro = new THREE.Mesh(new THREE.SphereGeometry(0.16 * vol, 16, 14), hairMat);
    afro.position.set(0, y + 0.1, z);
    overlay.add(afro);
  }

  if (config.beardStyle > 0) {
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(0.065 + config.beardLength / 500, 12, 10),
      new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85 })
    );
    beard.position.set(0, y - 0.14, z + 0.08);
    beard.scale.set(1.15, 0.65 + config.beardLength / 220, 0.9);
    overlay.add(beard);
  }

  if (config.mustache > 25) {
    const stache = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 0.03),
      new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 })
    );
    stache.position.set(0, y - 0.08, z + 0.11);
    overlay.add(stache);
  }

  if (config.glassesStyle > 0) {
    const gColor = config.glassesStyle === 3 ? "#111827" : "#94a3b8";
    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(0.035, 0.008, 8, 16),
      new THREE.MeshStandardMaterial({ color: gColor, metalness: 0.5, roughness: 0.3 })
    );
    frame.position.set(-0.04, y - 0.02, z + 0.11);
    const frameR = frame.clone();
    frameR.position.x = 0.04;
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.01, 0.01),
      new THREE.MeshStandardMaterial({ color: gColor })
    );
    bridge.position.set(0, y - 0.02, z + 0.11);
    overlay.add(frame, frameR, bridge);
  }

  if (config.hatStyle > 0) {
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.07, 18),
      new THREE.MeshStandardMaterial({ color: config.shirtColor || "#334155", roughness: 0.65 })
    );
    hat.position.set(0, y + 0.16, z);
    if (config.hatStyle === 1) {
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.015, 18),
        new THREE.MeshStandardMaterial({ color: config.shirtColor || "#334155", roughness: 0.65 })
      );
      brim.position.set(0, y + 0.13, z);
      overlay.add(brim);
    }
    overlay.add(hat);
  }

  if (config.earringStyle > 0) {
    const gold = new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.85, roughness: 0.25 });
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), gold);
    l.position.set(-0.1, y - 0.06, z + 0.02);
    const r = l.clone();
    r.position.x = 0.1;
    overlay.add(l, r);
  }

  parent.add(overlay);
  rigRoot.userData.__duoOverlay = overlay;
}

export function applyFullStudioCustomization(rigRoot: THREE.Group, config: AvatarConfig): void {
  const skin = SKIN_TONES[Math.min(SKIN_TONES.length - 1, Math.max(0, config.skinTone))];
  applyConfigMaterials(rigRoot, {
    skinTone: skin,
    hairColor: config.hairColor,
    shirtColor: config.shirtColor,
    pantsColor: config.pantsColor,
    shoeColor: config.shoeColor,
    eyeColor: config.eyeColor,
    jacketColor: config.jacketColor,
  });
  syncCustomizationOverlays(rigRoot, config);

  const heightScale = 0.92 + (config.bodyHeight / 100) * 0.16;
  const buildMap = { slim: 0.92, average: 1, athletic: 1.08, heavy: 1.16 } as const;
  const build = buildMap[config.bodyBuild] ?? 1;
  rigRoot.scale.set(build, heightScale, build);
}
