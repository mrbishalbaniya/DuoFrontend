import type { Map as MapLibreMap } from "maplibre-gl";
import * as THREE from "three";

import { createGlowMaterial, levelPulseSpeed, rippleCount } from "./glowMaterial";
import type { DisplayZone } from "./types";
import { altitudeMetersForZoom, radiusMetersForZone } from "./zoomLOD";

type ZoneMesh = {
  id: string;
  root: THREE.Group;
  core: THREE.Mesh;
  rings: THREE.Mesh[];
  material: THREE.ShaderMaterial;
  ringMaterials: THREE.ShaderMaterial[];
};

export class ActivityHeatmapRenderer {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.Camera();
  private renderer: THREE.WebGLRenderer | null = null;
  private meshes = new Map<string, ZoneMesh>();
  private time = 0;
  private screenPoints: { id: string; x: number; y: number; radius: number }[] = [];

  init(canvas: HTMLCanvasElement, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      context: gl as WebGL2RenderingContext,
      antialias: true,
      alpha: true,
    });
    this.renderer.autoClear = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  syncZones(zones: DisplayZone[]): void {
    const ids = new Set(zones.map((z) => z.id));

    for (const id of this.meshes.keys()) {
      if (!ids.has(id)) {
        const mesh = this.meshes.get(id)!;
        this.scene.remove(mesh.root);
        mesh.core.geometry.dispose();
        mesh.material.dispose();
        mesh.rings.forEach((r, i) => {
          r.geometry.dispose();
          mesh.ringMaterials[i]?.dispose();
        });
        this.meshes.delete(id);
      }
    }

    for (const zone of zones) {
      let entry = this.meshes.get(zone.id);
      if (!entry) {
        entry = this.createZoneMesh(zone);
        this.meshes.set(zone.id, entry);
        this.scene.add(entry.root);
      }
      entry.material.uniforms.u_intensity!.value = 0.45 + zone.displayScore / 140;
      entry.material.uniforms.u_phase!.value = zone.phase;
    }
  }

  private createZoneMesh(zone: DisplayZone): ZoneMesh {
    const root = new THREE.Group();
    root.userData.id = zone.id;

    const material = createGlowMaterial(zone.level, zone.phase);
    const core = new THREE.Mesh(new THREE.CircleGeometry(1, 24), material);

    const rings: THREE.Mesh[] = [];
    const ringMaterials: THREE.ShaderMaterial[] = [];
    const ripples = rippleCount(zone.level);
    for (let i = 0; i < ripples; i += 1) {
      const ringMat = createGlowMaterial(zone.level, zone.phase + i * 0.8);
      ringMat.uniforms.u_intensity!.value = 0.35;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.95, 24), ringMat);
      ringMaterials.push(ringMat);
      rings.push(ring);
      root.add(ring);
    }

    root.add(core);
    return { id: zone.id, root, core, rings, material, ringMaterials };
  }

  private applyTransforms(map: MapLibreMap, zones: DisplayZone[], zoom: number): void {
    const altitude = altitudeMetersForZoom(zoom);

    for (const zone of zones) {
      const entry = this.meshes.get(zone.id);
      if (!entry) continue;

      const radiusM = radiusMetersForZone(zone.displayRadius, zoom);
      const modelMatrix = map.transform.getMatrixForModel([zone.lng, zone.lat], altitude);
      const scale = radiusM * 2;
      const local = new THREE.Matrix4().fromArray(modelMatrix);
      const scaleMatrix = new THREE.Matrix4().makeScale(scale, scale, scale);
      local.multiply(scaleMatrix);

      entry.root.matrix.copy(local);
      entry.root.matrixAutoUpdate = false;
      entry.root.updateMatrixWorld(true);
    }
  }

  updateAnimation(dt: number, zones: DisplayZone[]): void {
    this.time += dt;
    for (const zone of zones) {
      const entry = this.meshes.get(zone.id);
      if (!entry) continue;
      const speed = levelPulseSpeed(zone.level);
      entry.material.uniforms.u_time!.value = this.time * speed;
      entry.ringMaterials.forEach((mat, i) => {
        mat.uniforms.u_time!.value = this.time * speed;
        const ripple = (this.time * 0.35 + i * 0.33) % 1;
        mat.uniforms.u_ripple!.value = ripple;
      });
    }
  }

  render(
    projectionMatrix: ArrayLike<number>,
    map: MapLibreMap,
    zones: DisplayZone[],
    zoom: number,
    opacity: number
  ): void {
    if (!this.renderer || zones.length === 0) {
      this.screenPoints = [];
      return;
    }

    this.applyTransforms(map, zones, zoom);
    this.updateAnimation(1 / 60, zones);

    try {
      map.transform.overrideNearFarZ(0.1, 1e10);

      const m = new THREE.Matrix4().fromArray(Array.from(projectionMatrix));
      this.camera.projectionMatrix.copy(m);
      this.camera.projectionMatrixInverse.copy(m).invert();

      this.renderer.resetState();
      const gl = this.renderer.getContext();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      for (const zone of zones) {
        const entry = this.meshes.get(zone.id);
        if (!entry) continue;
        entry.material.uniforms.u_intensity!.value =
          (0.4 + zone.displayScore / 130) * opacity;
      }

      this.renderer.render(this.scene, this.camera);
    } finally {
      map.transform.clearNearFarZOverride();
    }

    this.screenPoints = zones.map((zone) => {
      const p = map.project([zone.lng, zone.lat]);
      return {
        id: zone.id,
        x: p.x,
        y: p.y,
        radius: Math.max(36, 24 + zone.displayRadius * 0.35),
      };
    });
  }

  getScreenPoints(): { id: string; x: number; y: number; radius: number }[] {
    return this.screenPoints;
  }

  dispose(): void {
    for (const entry of this.meshes.values()) {
      entry.core.geometry.dispose();
      entry.material.dispose();
      entry.rings.forEach((r, i) => {
        r.geometry.dispose();
        entry.ringMaterials[i]?.dispose();
      });
    }
    this.meshes.clear();
    this.renderer?.dispose();
    this.renderer = null;
  }
}
