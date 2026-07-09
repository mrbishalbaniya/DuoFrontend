import * as THREE from "three";

import type { AvatarConfig, AvatarGender } from "./types";
import { SKIN_TONES } from "./types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function pct(v: number): number {
  return Math.min(1, Math.max(0, v / 100));
}

function mat(
  color: string,
  opts: { roughness?: number; metalness?: number; flat?: boolean } = {}
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.55,
    metalness: opts.metalness ?? 0.05,
    flatShading: opts.flat ?? false,
  });
}

function addShadow(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export type ModularAvatarRig = {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  neck: THREE.Object3D;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftHand: THREE.Group;
  rightHand: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftShin: THREE.Group;
  rightShin: THREE.Group;
  leftFoot: THREE.Group;
  rightFoot: THREE.Group;
  hips: THREE.Group;
  faceParts: {
    jaw?: THREE.Object3D;
    leftEye?: THREE.Object3D;
    rightEye?: THREE.Object3D;
    leftBrow?: THREE.Object3D;
    rightBrow?: THREE.Object3D;
    nose?: THREE.Object3D;
    mouth?: THREE.Object3D;
    leftEar?: THREE.Object3D;
    rightEar?: THREE.Object3D;
  };
};

const HAIR_LIBRARY = 48;
const SHIRT_LIBRARY = 8;
const PANTS_LIBRARY = 8;
const SHOE_LIBRARY = 7;
const JACKET_LIBRARY = 5;

function skinColor(config: AvatarConfig): string {
  return SKIN_TONES[Math.min(SKIN_TONES.length - 1, Math.max(0, config.skinTone))] ?? SKIN_TONES[2]!;
}

function buildHair(config: AvatarConfig, head: THREE.Group): void {
  const color = config.hairColor;
  const highlight = config.hairHighlight;
  const vol = lerp(0.85, 1.35, pct(config.hairVolume));
  const len = lerp(0.55, 1.55, pct(config.hairLength));
  const shine = lerp(0.85, 0.35, pct(config.hairShine));
  const style = Math.abs(config.hairStyle) % HAIR_LIBRARY;
  const group = new THREE.Group();
  group.name = "hair";

  const hairMat = mat(color, { roughness: shine });
  const hlMat = mat(highlight, { roughness: shine });

  const cap = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.195 * vol, 18, 14), hairMat));
  cap.scale.set(1.05, 0.72, 1.05);
  cap.position.y = 0.12;
  group.add(cap);

  if (style <= 2) {
    // buzz / crew
    cap.scale.set(1.02, 0.45, 1.02);
  } else if (style <= 5) {
    // fade / undercut
    const top = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.14 * vol, 14, 12), hairMat.clone()));
    top.position.set(0, 0.16, 0.02);
    group.add(top);
  } else if (style <= 9) {
    // curly / wavy / afro
    const afro = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.22 * vol, 16, 14), hairMat.clone()));
    afro.position.y = 0.14;
    group.add(afro);
  } else if (style <= 14) {
    // long / layered
    const long = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.34 * vol, 0.35 * len, 0.28), hairMat.clone()));
    long.position.set(0, -0.05, -0.02);
    group.add(long);
  } else if (style <= 18) {
    // ponytail
    const tail = addShadow(
      new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.22 * len, 6, 10), hairMat.clone())
    );
    tail.position.set(0, 0.02, -0.16);
    group.add(tail);
  } else if (style <= 22) {
    // bun
    const bun = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.08 * vol, 12, 10), hairMat.clone()));
    bun.position.set(0, 0.2, -0.06);
    group.add(bun);
  } else if (style <= 28) {
    // braids / locs
    for (let i = 0; i < 5; i += 1) {
      const braid = addShadow(
        new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.2 * len, 4, 8), hairMat.clone())
      );
      braid.position.set((i - 2) * 0.05, -0.02, -0.12);
      group.add(braid);
    }
  } else if (style <= 34) {
    // side / middle part
    const side = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.28 * vol, 0.12, 0.22), hairMat.clone()));
    side.position.set(style % 2 === 0 ? 0.06 : -0.06, 0.14, 0.04);
    group.add(side);
  } else {
    // highlight layered
    const hl = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), hlMat));
    hl.position.set(0.08, 0.16, 0.06);
    group.add(hl);
  }

  head.add(group);
}

function buildFace(config: AvatarConfig, head: THREE.Group, skin: string, rig: ModularAvatarRig): void {
  const faceW = lerp(0.88, 1.18, pct(config.faceWidth));
  const faceH = lerp(0.9, 1.15, pct(config.faceHeight));
  const jawW = lerp(0.85, 1.2, pct(config.jawWidth));
  const chinL = lerp(0.9, 1.25, pct(config.chinLength));
  const cheek = lerp(0.9, 1.2, pct(config.cheekFullness));

  const skull = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 20), mat(skin, { roughness: lerp(0.7, 0.35, pct(config.smoothness)) })));
  skull.scale.set(faceW, faceH, lerp(0.95, 1.12, pct(config.jaw)));
  skull.name = "skull";
  head.add(skull);

  const jaw = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.22 * jawW, 0.1 * chinL, 0.16), mat(skin)));
  jaw.position.set(0, -0.12, 0.04);
  jaw.name = "jaw";
  head.add(jaw);
  rig.faceParts.jaw = jaw;

  const cheekL = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.05 * cheek, 10, 8), mat(skin)));
  cheekL.position.set(-0.12, -0.02, 0.12);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.12;
  head.add(cheekL, cheekR);

  // Eyes
  const eyeScale = lerp(0.75, 1.35, pct(config.eyeSize));
  const spacing = lerp(0.05, 0.1, pct(config.eyeSpacing));
  const angle = lerp(-0.25, 0.25, pct(config.eyeAngle));
  const eyeGeo = new THREE.SphereGeometry(0.032 * eyeScale, 12, 10);
  const white = mat("#f8fafc", { roughness: 0.4 });
  const iris = mat(config.eyeColor, { roughness: 0.25, metalness: 0.1 });
  const pupilR = lerp(0.4, 0.75, pct(config.pupilSize));

  const leftEye = new THREE.Group();
  leftEye.position.set(-spacing, 0.04, 0.16);
  leftEye.rotation.z = angle;
  leftEye.add(addShadow(new THREE.Mesh(eyeGeo, white)));
  const irisL = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.018 * eyeScale, 10, 8), iris));
  irisL.position.z = 0.02;
  const pupilL = addShadow(
    new THREE.Mesh(new THREE.SphereGeometry(0.01 * eyeScale * pupilR, 8, 6), mat("#0f172a"))
  );
  pupilL.position.z = 0.03;
  leftEye.add(irisL, pupilL);
  head.add(leftEye);
  rig.faceParts.leftEye = leftEye;

  const rightEye = leftEye.clone();
  rightEye.position.x = spacing;
  rightEye.rotation.z = -angle;
  head.add(rightEye);
  rig.faceParts.rightEye = rightEye;

  if (config.eyelashes > 20) {
    const lashMat = mat(config.browColor, { roughness: 0.8 });
    const lashL = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.02), lashMat));
    lashL.position.set(-spacing, 0.055, 0.175);
    const lashR = lashL.clone();
    lashR.position.x = spacing;
    head.add(lashL, lashR);
  }

  // Brows
  const browT = lerp(0.012, 0.045, pct(config.browThickness));
  const browLen = lerp(0.06, 0.12, pct(config.browLength));
  const browY = lerp(0.08, 0.14, pct(config.browPosition));
  const browRot = lerp(-0.35, 0.35, pct(config.browRotation));
  const browMat = mat(config.browColor, { roughness: 0.75 });
  const browL = addShadow(new THREE.Mesh(new THREE.BoxGeometry(browLen, browT, 0.025), browMat));
  browL.position.set(-spacing, browY, 0.17);
  browL.rotation.z = browRot;
  const browR = browL.clone();
  browR.position.x = spacing;
  browR.rotation.z = -browRot;
  head.add(browL, browR);
  rig.faceParts.leftBrow = browL;
  rig.faceParts.rightBrow = browR;

  // Nose
  const nose = addShadow(
    new THREE.Mesh(
      new THREE.BoxGeometry(
        lerp(0.035, 0.09, pct(config.noseWidth)),
        lerp(0.05, 0.12, pct(config.noseHeight)),
        lerp(0.04, 0.11, pct(config.noseLength))
      ),
      mat(skin)
    )
  );
  nose.position.set(0, lerp(-0.02, 0.04, pct(config.noseBridge)), 0.19);
  const tip = addShadow(
    new THREE.Mesh(new THREE.SphereGeometry(lerp(0.015, 0.035, pct(config.noseTip)), 10, 8), mat(skin))
  );
  tip.position.set(0, -0.03, 0.04);
  nose.add(tip);
  head.add(nose);
  rig.faceParts.nose = nose;

  // Mouth
  const mouthW = lerp(0.7, 1.4, pct(config.mouthWidth));
  const lipH = lerp(0.5, 1.4, pct(config.lipSize));
  const mouth = addShadow(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 10),
      mat(config.lipColor, { roughness: 0.4 })
    )
  );
  mouth.scale.set(mouthW * 1.3, 0.35 * lipH * lerp(0.8, 1.3, pct(config.upperLip)), 0.7);
  mouth.position.set(0, lerp(-0.08, -0.04, pct(config.smile)), 0.175);
  head.add(mouth);
  rig.faceParts.mouth = mouth;

  if (config.teethStyle > 0 || config.smile > 50) {
    const teeth = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), mat("#f8fafc")));
    teeth.position.set(0, mouth.position.y + 0.01, 0.19);
    head.add(teeth);
  }

  // Ears
  const earS = lerp(0.7, 1.35, pct(config.earSize));
  const earRot = lerp(-0.4, 0.4, pct(config.earRotation));
  const earL = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.04 * earS, 10, 8), mat(skin)));
  earL.scale.set(0.5, 1.1, 0.7);
  earL.position.set(-0.2 * faceW, 0.02, 0);
  earL.rotation.y = earRot;
  const earR = earL.clone();
  earR.position.x = 0.2 * faceW;
  earR.rotation.y = -earRot;
  head.add(earL, earR);
  rig.faceParts.leftEar = earL;
  rig.faceParts.rightEar = earR;

  // Freckles / moles as tiny dots
  if (config.freckles > 15) {
    const freckleMat = mat("#b07a5a", { roughness: 0.9 });
    for (let i = 0; i < Math.floor(config.freckles / 12); i += 1) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), freckleMat);
      f.position.set((i % 3) * 0.04 - 0.04, -0.02 - (i % 2) * 0.03, 0.19);
      head.add(f);
    }
  }
  if (config.moles > 20) {
    const mole = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 6), mat("#5c3a21"));
    mole.position.set(0.08, -0.04, 0.18);
    head.add(mole);
  }

  // Facial hair
  if (config.gender === "male" && config.beardStyle > 0) {
    const fh = config.facialHairColor || config.hairColor;
    const beard = addShadow(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.1 + config.beardLength / 400, 12, 10),
        mat(fh, { roughness: 0.85 })
      )
    );
    beard.position.set(0, -0.14, 0.08);
    beard.scale.set(1.15, 0.55 + config.beardLength / 200, 0.9);
    head.add(beard);
  }
  if (config.gender === "male" && config.mustache > 20) {
    const stache = addShadow(
      new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.025, 0.04), mat(config.facialHairColor || config.hairColor))
    );
    stache.position.set(0, -0.06, 0.19);
    head.add(stache);
  }
  if (config.gender === "male" && config.sideburns > 25) {
    const sbMat = mat(config.facialHairColor || config.hairColor);
    const sbL = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.04), sbMat));
    sbL.position.set(-0.17, -0.04, 0.08);
    const sbR = sbL.clone();
    sbR.position.x = 0.17;
    head.add(sbL, sbR);
  }
}

function buildShirt(config: AvatarConfig, torso: THREE.Group, build: number): void {
  const style = Math.abs(config.shirtStyle) % SHIRT_LIBRARY;
  const color = config.shirtColor;
  const w = 0.38 * build;
  let mesh: THREE.Mesh;
  if (style === 0) {
    // tank
    mesh = addShadow(new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.42, 0.24 * build), mat(color)));
  } else if (style === 2) {
    // polo collar
    mesh = addShadow(new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 0.26 * build), mat(color)));
    const collar = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.12), mat(color)));
    collar.position.set(0, 0.28, 0.08);
    mesh.add(collar);
  } else if (style === 3) {
    // hoodie
    mesh = addShadow(new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, 0.55, 0.3 * build), mat(color, { roughness: 0.85 })));
    const hood = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat(color, { roughness: 0.85 })));
    hood.position.set(0, 0.32, -0.05);
    mesh.add(hood);
  } else if (style === 5) {
    // sweater
    mesh = addShadow(new THREE.Mesh(new THREE.BoxGeometry(w * 1.05, 0.52, 0.28 * build), mat(color, { roughness: 0.9 })));
  } else {
    // tee / shirt default
    mesh = addShadow(new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 0.26 * build), mat(color)));
  }
  mesh.position.y = 0.28;
  mesh.name = "shirt";
  torso.add(mesh);
}

function buildPants(config: AvatarConfig, hips: THREE.Group, leftLeg: THREE.Group, rightLeg: THREE.Group, build: number): void {
  const style = Math.abs(config.pantsStyle) % PANTS_LIBRARY;
  const color = config.pantsColor;
  const isSkirt = style === 7 || (config.gender === "female" && style >= 6);
  const isShorts = style === 3 || style === 4;

  if (isSkirt) {
    const skirt = addShadow(
      new THREE.Mesh(new THREE.CylinderGeometry(0.22 * build, 0.32 * build, 0.4, 16), mat(color, { roughness: 0.7 }))
    );
    skirt.position.y = 0.05;
    hips.add(skirt);
    return;
  }

  const pantH = isShorts ? 0.22 : 0.42;
  const pantL = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.14 * build, pantH, 0.14 * build), mat(color)));
  pantL.position.y = isShorts ? 0.05 : -0.05;
  leftLeg.add(pantL);
  const pantR = pantL.clone();
  rightLeg.add(pantR);

  const hip = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.36 * build, 0.18, 0.24 * build), mat(color)));
  hip.position.y = 0.12;
  hips.add(hip);
}

function buildShoes(config: AvatarConfig, leftFoot: THREE.Group, rightFoot: THREE.Group): void {
  const style = Math.abs(config.shoeStyle) % SHOE_LIBRARY;
  const color = config.shoeColor;
  const footScale = lerp(0.85, 1.25, pct(config.footSize));
  let geo: THREE.BufferGeometry;
  if (style === 4) {
    // heels
    geo = new THREE.BoxGeometry(0.1 * footScale, 0.08, 0.22 * footScale);
  } else if (style === 3) {
    geo = new THREE.BoxGeometry(0.11 * footScale, 0.05, 0.2 * footScale);
  } else if (style === 1 || style === 2) {
    geo = new THREE.BoxGeometry(0.12 * footScale, 0.09, 0.24 * footScale);
  } else {
    geo = new THREE.BoxGeometry(0.12 * footScale, 0.08, 0.22 * footScale);
  }
  const shoeL = addShadow(new THREE.Mesh(geo, mat(color, { roughness: 0.5, metalness: 0.1 })));
  shoeL.position.set(0, -0.02, 0.04);
  leftFoot.add(shoeL);
  const shoeR = shoeL.clone();
  rightFoot.add(shoeR);
  if (style === 4) {
    const heel = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.08, 8), mat(color)));
    heel.position.set(0, -0.06, -0.06);
    leftFoot.add(heel);
    rightFoot.add(heel.clone());
  }
}

function buildAccessories(config: AvatarConfig, head: THREE.Group, body: THREE.Group, leftArm: THREE.Group): void {
  if (config.glassesStyle > 0) {
    const gColor = config.glassesStyle >= 3 ? "#111827" : "#94a3b8";
    const frame = new THREE.Group();
    const lens = mat(gColor, { metalness: 0.4, roughness: 0.3 });
    const l = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 16), lens));
    l.position.set(-0.05, 0.04, 0.19);
    const r = l.clone();
    r.position.x = 0.05;
    const bridge = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), lens));
    bridge.position.set(0, 0.04, 0.19);
    frame.add(l, r, bridge);
    head.add(frame);
  }
  if (config.hatStyle > 0) {
    const hat = addShadow(
      new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 18), mat(config.shirtColor || "#334155"))
    );
    hat.position.y = 0.28;
    if (config.hatStyle === 1) {
      const brim = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 18), mat(config.shirtColor || "#334155")));
      brim.position.y = 0.22;
      head.add(brim);
    }
    head.add(hat);
  }
  if (config.earringStyle > 0) {
    const gold = mat("#fbbf24", { metalness: 0.85, roughness: 0.25 });
    const eL = addShadow(new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), gold));
    eL.position.set(-0.2, 0, 0.02);
    const eR = eL.clone();
    eR.position.x = 0.2;
    head.add(eL, eR);
  }
  if (config.necklaceStyle > 0) {
    const neck = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 20), mat("#fbbf24", { metalness: 0.7 })));
    neck.rotation.x = Math.PI / 2;
    neck.position.y = 1.02;
    body.add(neck);
  }
  if (config.watchStyle > 0) {
    const watch = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.06), mat("#94a3b8", { metalness: 0.6 })));
    watch.position.set(0, 0.02, 0);
    leftArm.add(watch);
  }
  if (config.backpackStyle > 0) {
    const pack = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.12), mat(config.jacketColor || "#334155")));
    pack.position.set(0, 0.85, -0.2);
    body.add(pack);
  }
  if (config.scarfStyle > 0) {
    const scarf = addShadow(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), mat(config.shirtColor)));
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.05;
    body.add(scarf);
  }
  if (config.jacketStyle > 0 || config.outerwearStyle > 0) {
    const jc = config.jacketStyle > 0 ? config.jacketColor : config.outerwearColor;
    const jacket = addShadow(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.32), mat(jc, { roughness: 0.65 })));
    jacket.position.y = 0.9;
    body.add(jacket);
  }
}

/**
 * Assemble a full modular humanoid from config — interchangeable geometry, not recolor-only.
 */
export function assembleModularAvatar(config: AvatarConfig): ModularAvatarRig {
  const gender: AvatarGender = config.gender === "female" ? "female" : config.gender === "male" ? "male" : "male";
  const skin = skinColor(config);
  const root = new THREE.Group();
  root.name = "modular-avatar";

  const body = new THREE.Group();
  const hips = new THREE.Group();
  const torso = new THREE.Group();
  const head = new THREE.Group();
  const neck = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  const leftForearm = new THREE.Group();
  const rightForearm = new THREE.Group();
  const leftHand = new THREE.Group();
  const rightHand = new THREE.Group();
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  const leftShin = new THREE.Group();
  const rightShin = new THREE.Group();
  const leftFoot = new THREE.Group();
  const rightFoot = new THREE.Group();

  root.add(body);
  body.add(hips, torso);
  torso.add(neck);
  neck.add(head);
  torso.add(leftArm, rightArm);
  leftArm.add(leftForearm);
  rightArm.add(rightForearm);
  leftForearm.add(leftHand);
  rightForearm.add(rightHand);
  hips.add(leftLeg, rightLeg);
  leftLeg.add(leftShin);
  rightLeg.add(rightShin);
  leftShin.add(leftFoot);
  rightShin.add(rightFoot);

  const heightScale = lerp(0.88, 1.18, pct(config.bodyHeight));
  const weight = lerp(0.88, 1.2, pct(config.bodyWeight));
  const muscle = lerp(0.92, 1.22, pct(config.muscle));
  const fat = lerp(1, 1.15, pct(config.bodyFat));
  const build = weight * ((muscle + fat) / 2);
  const shoulder = lerp(0.85, 1.3, pct(config.shoulderWidth)) * (gender === "male" ? 1.05 : 0.92);
  const chest = lerp(0.85, 1.25, pct(config.chestSize));
  const waist = lerp(0.8, 1.25, pct(config.waistSize));
  const hip = lerp(0.85, 1.3, pct(config.hipSize)) * (gender === "female" ? 1.08 : 0.95);
  const armT = lerp(0.8, 1.3, pct(config.armThickness)) * muscle;
  const legT = lerp(0.8, 1.3, pct(config.legThickness));
  const handS = lerp(0.85, 1.25, pct(config.handSize));

  // Hips / pelvis
  const pelvis = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(0.34 * hip * build, 0.16, 0.22 * build), mat(skin))
  );
  pelvis.position.y = 0.95;
  hips.position.y = 0;
  hips.add(pelvis);

  // Torso / chest
  const chestMesh = addShadow(
    new THREE.Mesh(
      new THREE.BoxGeometry(0.36 * shoulder * chest * build, 0.42, 0.22 * build),
      mat(skin)
    )
  );
  chestMesh.position.y = 1.22;
  torso.add(chestMesh);

  // Waist
  const waistMesh = addShadow(
    new THREE.Mesh(new THREE.BoxGeometry(0.3 * waist * build, 0.14, 0.2 * build), mat(skin))
  );
  waistMesh.position.y = 1.02;
  torso.add(waistMesh);

  // Neck
  const neckMesh = addShadow(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 12), mat(skin)));
  neckMesh.position.y = 1.48;
  neck.position.y = 0;
  neck.add(neckMesh);
  head.position.y = 1.58;

  const rig: ModularAvatarRig = {
    root,
    body,
    torso,
    head,
    neck,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    leftShin,
    rightShin,
    leftFoot,
    rightFoot,
    hips,
    faceParts: {},
  };

  buildFace(config, head, skin, rig);
  buildHair(config, head);

  // Arms
  const upperArmGeo = new THREE.CapsuleGeometry(0.045 * armT, 0.22, 6, 10);
  leftArm.position.set(-0.22 * shoulder * build, 1.38, 0);
  rightArm.position.set(0.22 * shoulder * build, 1.38, 0);
  leftArm.add(addShadow(new THREE.Mesh(upperArmGeo, mat(skin))));
  rightArm.add(addShadow(new THREE.Mesh(upperArmGeo.clone(), mat(skin))));

  leftForearm.position.set(0, -0.28, 0);
  rightForearm.position.set(0, -0.28, 0);
  const foreGeo = new THREE.CapsuleGeometry(0.038 * armT, 0.2, 6, 10);
  leftForearm.add(addShadow(new THREE.Mesh(foreGeo, mat(skin))));
  rightForearm.add(addShadow(new THREE.Mesh(foreGeo.clone(), mat(skin))));

  leftHand.position.set(0, -0.24, 0);
  rightHand.position.set(0, -0.24, 0);
  const handGeo = new THREE.BoxGeometry(0.07 * handS, 0.1 * handS, 0.04 * handS);
  leftHand.add(addShadow(new THREE.Mesh(handGeo, mat(skin))));
  rightHand.add(addShadow(new THREE.Mesh(handGeo.clone(), mat(skin))));
  // Fingers
  for (let i = 0; i < 4; i += 1) {
    const finger = addShadow(new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.04, 4, 6), mat(skin)));
    finger.position.set((i - 1.5) * 0.018, -0.08, 0.01);
    leftHand.add(finger);
    rightHand.add(finger.clone());
  }

  // Legs
  leftLeg.position.set(-0.1 * hip * build, 0.88, 0);
  rightLeg.position.set(0.1 * hip * build, 0.88, 0);
  const thighGeo = new THREE.CapsuleGeometry(0.06 * legT * build, 0.28, 6, 10);
  leftLeg.add(addShadow(new THREE.Mesh(thighGeo, mat(skin))));
  rightLeg.add(addShadow(new THREE.Mesh(thighGeo.clone(), mat(skin))));

  leftShin.position.set(0, -0.32, 0);
  rightShin.position.set(0, -0.32, 0);
  const shinGeo = new THREE.CapsuleGeometry(0.05 * legT, 0.28, 6, 10);
  leftShin.add(addShadow(new THREE.Mesh(shinGeo, mat(skin))));
  rightShin.add(addShadow(new THREE.Mesh(shinGeo.clone(), mat(skin))));

  leftFoot.position.set(0, -0.3, 0.02);
  rightFoot.position.set(0, -0.3, 0.02);

  // Clothing layers
  buildShirt(config, torso, build * shoulder);
  buildPants(config, hips, leftLeg, rightLeg, build * hip);
  buildShoes(config, leftFoot, rightFoot);
  buildAccessories(config, head, body, leftForearm);

  root.scale.set(1, heightScale, 1);

  // Studio ground ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.4, 48),
    new THREE.MeshBasicMaterial({
      color: "#ec4899",
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  root.add(ring);

  return rig;
}

export function applyModularAnimation(rig: ModularAvatarRig, animation: string, time: number): void {
  const t = time;
  const breathe = Math.sin(t * 2.1) * 0.012;
  rig.torso.position.y = breathe;

  const reset = () => {
    rig.leftArm.rotation.set(0, 0, 0.12);
    rig.rightArm.rotation.set(0, 0, -0.12);
    rig.leftForearm.rotation.set(0, 0, 0);
    rig.rightForearm.rotation.set(0, 0, 0);
    rig.leftLeg.rotation.set(0, 0, 0);
    rig.rightLeg.rotation.set(0, 0, 0);
    rig.leftShin.rotation.set(0, 0, 0);
    rig.rightShin.rotation.set(0, 0, 0);
    rig.head.rotation.set(0, 0, 0);
    rig.body.position.y = 0;
  };
  reset();

  switch (animation) {
    case "walk":
    case "run": {
      const speed = animation === "run" ? 8 : 4.5;
      const amp = animation === "run" ? 0.65 : 0.4;
      rig.leftLeg.rotation.x = Math.sin(t * speed) * amp;
      rig.rightLeg.rotation.x = Math.sin(t * speed + Math.PI) * amp;
      rig.leftShin.rotation.x = Math.max(0, -Math.sin(t * speed) * amp * 0.5);
      rig.rightShin.rotation.x = Math.max(0, -Math.sin(t * speed + Math.PI) * amp * 0.5);
      rig.leftArm.rotation.x = Math.sin(t * speed + Math.PI) * amp * 0.7;
      rig.rightArm.rotation.x = Math.sin(t * speed) * amp * 0.7;
      rig.body.position.y = Math.abs(Math.sin(t * speed)) * (animation === "run" ? 0.04 : 0.02);
      break;
    }
    case "wave":
      rig.rightArm.rotation.z = -1.5;
      rig.rightForearm.rotation.z = -0.3;
      rig.rightArm.rotation.x = Math.sin(t * 6) * 0.4;
      break;
    case "dance":
      rig.hips.rotation.y = Math.sin(t * 3) * 0.25;
      rig.leftArm.rotation.z = 0.9 + Math.sin(t * 5) * 0.25;
      rig.rightArm.rotation.z = -0.9 + Math.cos(t * 5) * 0.25;
      rig.leftLeg.rotation.x = Math.sin(t * 5) * 0.2;
      rig.rightLeg.rotation.x = Math.cos(t * 5) * 0.2;
      break;
    case "celebrate":
    case "jump":
      rig.body.position.y = Math.abs(Math.sin(t * 4)) * 0.14;
      rig.leftArm.rotation.z = 1.3;
      rig.rightArm.rotation.z = -1.3;
      break;
    case "sit":
      rig.body.position.y = -0.35;
      rig.leftLeg.rotation.x = -1.25;
      rig.rightLeg.rotation.x = -1.25;
      rig.leftShin.rotation.x = 1.1;
      rig.rightShin.rotation.x = 1.1;
      break;
    case "selfie":
      rig.rightArm.rotation.x = -1.5;
      rig.rightArm.rotation.z = -0.5;
      rig.head.rotation.y = 0.25;
      break;
    case "look":
      rig.head.rotation.y = Math.sin(t * 0.8) * 0.45;
      rig.head.rotation.x = Math.sin(t * 0.5) * 0.12;
      break;
    case "heart":
      rig.leftArm.rotation.z = 1.0;
      rig.rightArm.rotation.z = -1.0;
      rig.leftArm.rotation.x = -0.5;
      rig.rightArm.rotation.x = -0.5;
      break;
    default:
      rig.leftArm.rotation.z = 0.12 + Math.sin(t) * 0.03;
      rig.rightArm.rotation.z = -0.12 + Math.cos(t) * 0.03;
      rig.head.rotation.y = Math.sin(t * 0.6) * 0.08;
  }
}

export function disposeModularRig(rig: ModularAvatarRig): void {
  rig.root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) m?.dispose();
    }
  });
}

export { HAIR_LIBRARY, SHIRT_LIBRARY, PANTS_LIBRARY, SHOE_LIBRARY, JACKET_LIBRARY };
