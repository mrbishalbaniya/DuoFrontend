import * as THREE from "three";

import type { AvatarRig } from "./AvatarAssets";
import type { AvatarAnimationState } from "./types";

export type AnimatedAvatar = {
  id: string;
  rig: AvatarRig;
  state: AvatarAnimationState;
  phase: number;
};

export class AvatarAnimationController {
  private time = 0;

  update(avatars: AnimatedAvatar[], dt: number): void {
    this.time += dt;

    for (const avatar of avatars) {
      const { rig, state } = avatar;
      avatar.phase += dt;
      const t = this.time + avatar.phase;
      const breathe = Math.sin(t * 2.1) * 0.02;
      const sway = Math.sin(t * 0.9) * 0.04;

      rig.body.position.y = breathe;
      rig.body.rotation.y = sway;
      rig.head.rotation.y = Math.sin(t * 0.55) * 0.12;
      rig.head.rotation.x = Math.sin(t * 0.35) * 0.04;

      const blink = Math.sin(t * 3.2) > 0.96 ? 0.15 : 1;
      rig.leftEye.scale.y = blink;
      rig.rightEye.scale.y = blink;

      rig.hair.rotation.z = Math.sin(t * 1.4) * 0.03;
      rig.leftArm.rotation.x = Math.sin(t * 1.1) * 0.08;
      rig.rightArm.rotation.x = -Math.sin(t * 1.1) * 0.08;
      rig.leftLeg.rotation.x = 0;
      rig.rightLeg.rotation.x = 0;

      if (state === "selected") {
        const wave = Math.sin(t * 6) * 0.55;
        rig.rightArm.rotation.z = -0.8 + wave;
        rig.rightArm.rotation.x = -0.4;
        rig.body.position.y = breathe + Math.abs(Math.sin(t * 4)) * 0.06;
        rig.mouth.scale.y = 0.8 + Math.sin(t * 5) * 0.2;
        const ringMat = rig.ring.material as THREE.MeshBasicMaterial;
        const glowMat = rig.glow.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0.75 + Math.sin(t * 3) * 0.15;
        glowMat.opacity = 0.18 + Math.sin(t * 2.5) * 0.08;
      } else if (state === "walking") {
        const step = Math.sin(t * 8);
        rig.leftLeg.rotation.x = step * 0.45;
        rig.rightLeg.rotation.x = -step * 0.45;
        rig.leftArm.rotation.x = -step * 0.35;
        rig.rightArm.rotation.x = step * 0.35;
        const ringMat = rig.ring.material as THREE.MeshBasicMaterial;
        const glowMat = rig.glow.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0;
        glowMat.opacity = 0;
      } else {
        rig.rightArm.rotation.z = 0;
        const ringMat = rig.ring.material as THREE.MeshBasicMaterial;
        const glowMat = rig.glow.material as THREE.MeshBasicMaterial;
        ringMat.opacity = 0;
        glowMat.opacity = 0;
        rig.mouth.scale.y = 0.5;
      }
    }
  }
}

export function createAnimatedAvatar(id: string, rig: AvatarRig, state: AvatarAnimationState): AnimatedAvatar {
  return {
    id,
    rig,
    state,
    phase: Math.random() * Math.PI * 2,
  };
}
