import type { Map as MapLibreMap } from "maplibre-gl";
import * as THREE from "three";

import type { AvatarConfig } from "@/lib/avatarStudio/types";

import { createAvatarDNA } from "./AvatarAssets";
import {
  AvatarAnimationController,
  createAnimatedAvatar,
  type AnimatedAvatar,
} from "./AvatarAnimationController";
import {
  avatarAltitudeMeters,
  avatarWorldScaleMeters,
  resolveAvatarLOD,
  type AvatarLODLevel,
} from "./AvatarLOD";
import { buildGlobeAvatarFromConfig, buildGlobeAvatarSync } from "./buildFromConfig";
import { avatarConfigToDNA } from "./configToDNA";
import type { GlobeAvatarInstance, WeatherAccessory } from "./types";
import { presenceColor } from "./presence";

const RIG_HEIGHT_UNITS = 1.7;

function prepareGlobeMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      mat.depthTest = false;
      mat.depthWrite = false;
      mat.needsUpdate = true;
    }
  });
}

function addWeatherAccessory(
  group: THREE.Group,
  accessory: WeatherAccessory,
  lod: AvatarLODLevel
): void {
  if (lod === "impostor" || accessory === "none") return;
  if (accessory === "sunglasses") {
    const g = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.05, 0.04),
      new THREE.MeshBasicMaterial({ color: "#111827", depthTest: false, depthWrite: false })
    );
    g.position.set(0, 1.22, 0.2);
    group.add(g);
  } else if (accessory === "umbrella") {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6),
      new THREE.MeshBasicMaterial({ color: "#64748b", depthTest: false, depthWrite: false })
    );
    pole.position.set(0.35, 1.1, 0);
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: "#6366f1", depthTest: false, depthWrite: false })
    );
    canopy.position.set(0.35, 1.45, 0);
    group.add(pole, canopy);
  } else if (accessory === "winter") {
    const scarf = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.04, 6, 16),
      new THREE.MeshBasicMaterial({ color: "#38bdf8", depthTest: false, depthWrite: false })
    );
    scarf.position.set(0, 1.02, 0.12);
    scarf.rotation.x = Math.PI / 2;
    group.add(scarf);
  }
}

export class AvatarRenderer {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.Camera();
  readonly lights: THREE.Light[] = [];
  private renderer: THREE.WebGLRenderer | null = null;
  private readonly animation = new AvatarAnimationController();
  private animated: AnimatedAvatar[] = [];
  private lodKey = "";
  private screenPoints: { id: string; x: number; y: number; radius: number }[] = [];
  private loadGeneration = 0;
  private onNeedsRepaint: (() => void) | null = null;

  setRepaintHandler(handler: (() => void) | null): void {
    this.onNeedsRepaint = handler;
  }

  init(canvas: HTMLCanvasElement, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl as WebGL2RenderingContext,
      antialias: true,
      alpha: true,
    });
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.sortObjects = false;

    const ambient = new THREE.AmbientLight(0xffffff, 1.1);
    const sun = new THREE.DirectionalLight(0xfff0dd, 1.35);
    sun.position.set(3, 6, 2);
    const fill = new THREE.DirectionalLight(0xc4d4ff, 0.65);
    fill.position.set(-4, 2, -3);
    this.scene.add(ambient, sun, fill);
    this.lights.push(ambient, sun, fill);
  }

  syncInstances(
    instances: GlobeAvatarInstance[],
    zoom: number,
    weatherAccessory: WeatherAccessory,
    configByUserId: Record<string, AvatarConfig> = {},
    configRevision = 0
  ): void {
    const lod = resolveAvatarLOD(zoom);
    const key = `${lod}:${configRevision}:${instances.map((i) => i.id).join(",")}`;
    if (key === this.lodKey) {
      for (const anim of this.animated) {
        const inst = instances.find((i) => i.id === anim.id);
        if (inst) anim.state = inst.animation;
      }
      return;
    }
    this.lodKey = key;
    const generation = ++this.loadGeneration;

    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]!);
    }
    this.lights.forEach((l) => this.scene.add(l));

    this.animated = [];

    for (const inst of instances) {
      const saved = configByUserId[inst.id];
      const dna = saved ? avatarConfigToDNA(saved, inst.id) : createAvatarDNA(inst.id);
      if (lod === "impostor") {
        const impostor = new THREE.Group();
        const disc = new THREE.Mesh(
          new THREE.CircleGeometry(0.35, 20),
          new THREE.MeshBasicMaterial({
            color: dna.shirtColor,
            transparent: true,
            opacity: 0.95,
            depthTest: false,
            depthWrite: false,
          })
        );
        disc.rotation.x = -Math.PI / 2;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshBasicMaterial({ color: presenceColor(inst.presence), depthTest: false, depthWrite: false })
        );
        dot.position.set(0.22, 0.05, 0.22);
        impostor.add(disc, dot);
        impostor.userData.id = inst.id;
        this.scene.add(impostor);
        this.animated.push(
          createAnimatedAvatar(
            inst.id,
            {
              root: impostor,
              body: impostor,
              head: impostor,
              leftArm: impostor,
              rightArm: impostor,
              leftLeg: impostor,
              rightLeg: impostor,
              hair: disc,
              leftEye: dot,
              rightEye: dot,
              mouth: disc,
              ring: disc,
              glow: disc,
              accessoryGroup: impostor,
            },
            inst.animation
          )
        );
        continue;
      }

      const meshLod = lod === "high" ? "high" : lod === "medium" ? "medium" : "low";
      const wantsAsyncGltf = Boolean(saved?.modelUrl) && saved?.modelSource !== "modular";

      const standIn = buildGlobeAvatarSync(inst.id, saved, meshLod);
      prepareGlobeMaterials(standIn.root);
      addWeatherAccessory(standIn.root, weatherAccessory, lod);
      const statusOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 8, 8),
        new THREE.MeshBasicMaterial({ color: presenceColor(inst.presence), depthTest: false, depthWrite: false })
      );
      statusOrb.position.set(0.24, 1.55, 0.18);
      standIn.root.add(statusOrb);
      standIn.root.userData.id = inst.id;
      this.scene.add(standIn.root);
      this.animated.push(createAnimatedAvatar(inst.id, standIn, inst.animation));

      if (wantsAsyncGltf && saved) {
        void buildGlobeAvatarFromConfig(inst.id, saved, meshLod).then((rig) => {
          if (generation !== this.loadGeneration) return;
          prepareGlobeMaterials(rig.root);
          addWeatherAccessory(rig.root, weatherAccessory, lod);
          const orb = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 8, 8),
            new THREE.MeshBasicMaterial({
              color: presenceColor(inst.presence),
              depthTest: false,
              depthWrite: false,
            })
          );
          orb.position.set(0.24, 1.55, 0.18);
          rig.root.add(orb);
          rig.root.userData.id = inst.id;

          const idx = this.animated.findIndex((a) => a.id === inst.id);
          if (idx < 0) return;
          this.scene.remove(this.animated[idx]!.rig.root);
          this.scene.add(rig.root);
          this.animated[idx] = createAnimatedAvatar(inst.id, rig, inst.animation);
          this.onNeedsRepaint?.();
        });
      }
    }
  }

  updateAnimation(dt: number): void {
    this.animation.update(this.animated, dt);
  }

  render(
    projectionMatrix: ArrayLike<number>,
    map: MapLibreMap,
    instances: GlobeAvatarInstance[],
    zoom: number
  ): void {
    if (!this.renderer || instances.length === 0) {
      this.screenPoints = [];
      return;
    }

    this.updateAnimation(1 / 60);

    const m = new THREE.Matrix4().fromArray(Array.from(projectionMatrix));
    const altitude = avatarAltitudeMeters(zoom);
    const worldScale = avatarWorldScaleMeters(zoom) / RIG_HEIGHT_UNITS;

    const visibility = this.animated.map((anim) => anim.rig.root.visible);

    try {
      map.transform.overrideNearFarZ(0.1, 1e10);

      for (const anim of this.animated) {
        const inst = instances.find((i) => i.id === anim.id);
        if (!inst) continue;

        for (const other of this.animated) {
          other.rig.root.visible = false;
        }
        anim.rig.root.visible = true;
        anim.rig.root.matrix.identity();
        anim.rig.root.matrixAutoUpdate = true;
        anim.rig.root.position.set(0, 0, 0);
        anim.rig.root.rotation.set(0, 0, 0);
        anim.rig.root.scale.set(1, 1, 1);
        anim.rig.root.updateMatrixWorld(true);

        const modelMatrix = map.transform.getMatrixForModel([inst.lng, inst.lat], altitude);
        const l = new THREE.Matrix4()
          .fromArray(modelMatrix)
          .scale(new THREE.Vector3(worldScale, worldScale, worldScale));

        this.camera.projectionMatrix.copy(m).multiply(l);
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
      }
    } finally {
      map.transform.clearNearFarZOverride();
    }

    this.animated.forEach((anim, index) => {
      anim.rig.root.visible = visibility[index] ?? true;
    });

    this.screenPoints = instances.map((inst) => {
      const p = map.project([inst.lng, inst.lat]);
      const visualMeters = avatarWorldScaleMeters(zoom);
      const screenRadius = Math.min(90, Math.max(40, 28 + visualMeters / (zoom < 10 ? 8 : 4)));
      return {
        id: inst.id,
        x: p.x,
        y: p.y,
        radius: screenRadius,
      };
    });
  }

  getScreenPoints(): { id: string; x: number; y: number; radius: number }[] {
    return this.screenPoints;
  }

  dispose(): void {
    this.loadGeneration += 1;
    this.renderer?.dispose();
    this.renderer = null;
    this.lodKey = "";
    this.animated = [];
    this.onNeedsRepaint = null;
  }
}
