import { MercatorCoordinate } from "maplibre-gl";
import type { MapSpaceTheme } from "@/lib/mapTheme";
import { SKY_TEXTURE_SIZE } from "./constants";

export type StarVertex = {
  dx: number;
  dy: number;
  dz: number;
  size: number;
  brightness: number;
  temperature: number;
  phase: number;
};

export type SkySphereVertex = {
  x: number;
  y: number;
  u: number;
  v: number;
};

export type ShootingStar = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  duration: number;
};

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise2(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hash(ix + iy * 57.0);
  const b = hash(ix + 1 + iy * 57.0);
  const c = hash(ix + (iy + 1) * 57.0);
  const d = hash(ix + 1 + (iy + 1) * 57.0);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 5; i += 1) {
    value += amp * noise2(x * freq, y * freq);
    freq *= 2.1;
    amp *= 0.5;
  }
  return value;
}

function sampleStarTemperature(): number {
  const roll = Math.random();
  if (roll < 0.12) return 0.05;
  if (roll < 0.28) return 0.35;
  if (roll < 0.88) return 0.55;
  return 0.92;
}

function lngLatToMercator(lng: number, lat: number): { x: number; y: number } {
  const c = MercatorCoordinate.fromLngLat({ lng, lat });
  return { x: c.x, y: c.y };
}

export function generateStarField(count: number, sizeRange: [number, number]): StarVertex[] {
  const stars: StarVertex[] = [];
  const [minSize, maxSize] = sizeRange;
  for (let i = 0; i < count; i += 1) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const dx = Math.sin(phi) * Math.cos(theta);
    const dy = Math.cos(phi);
    const dz = Math.sin(phi) * Math.sin(theta);
    stars.push({
      dx,
      dy,
      dz,
      size: minSize + Math.random() * (maxSize - minSize),
      brightness: 0.18 + Math.random() ** 1.4 * 0.72,
      temperature: sampleStarTemperature(),
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export function packStars(stars: StarVertex[]): Float32Array {
  const packed = new Float32Array(stars.length * 7);
  for (let i = 0; i < stars.length; i += 1) {
    const s = stars[i];
    const o = i * 7;
    packed[o] = s.dx;
    packed[o + 1] = s.dy;
    packed[o + 2] = s.dz;
    packed[o + 3] = s.size;
    packed[o + 4] = s.brightness;
    packed[o + 5] = s.temperature;
    packed[o + 6] = s.phase;
  }
  return packed;
}

export function generateSkySphere(stepDeg = 5): SkySphereVertex[] {
  const verts: SkySphereVertex[] = [];
  for (let lat = -90; lat < 90; lat += stepDeg) {
    for (let lng = -180; lng < 180; lng += stepDeg) {
      const c00 = lngLatToMercator(lng, lat);
      const c10 = lngLatToMercator(lng + stepDeg, lat);
      const c01 = lngLatToMercator(lng, lat + stepDeg);
      const c11 = lngLatToMercator(lng + stepDeg, lat + stepDeg);
      const u00 = (lng + 180) / 360;
      const v00 = (90 - lat) / 180;
      const u10 = (lng + stepDeg + 180) / 360;
      const v10 = (90 - lat) / 180;
      const u01 = (lng + 180) / 360;
      const v01 = (90 - (lat + stepDeg)) / 180;
      const u11 = (lng + stepDeg + 180) / 360;
      const v11 = (90 - (lat + stepDeg)) / 180;

      verts.push(
        { x: c00.x, y: c00.y, u: u00, v: v00 },
        { x: c10.x, y: c10.y, u: u10, v: v10 },
        { x: c01.x, y: c01.y, u: u01, v: v01 },
        { x: c10.x, y: c10.y, u: u10, v: v10 },
        { x: c11.x, y: c11.y, u: u11, v: v11 },
        { x: c01.x, y: c01.y, u: u01, v: v01 }
      );
    }
  }
  return verts;
}

export function packSkySphere(verts: SkySphereVertex[]): Float32Array {
  const packed = new Float32Array(verts.length * 4);
  for (let i = 0; i < verts.length; i += 1) {
    const v = verts[i];
    const o = i * 4;
    packed[o] = v.x;
    packed[o + 1] = v.y;
    packed[o + 2] = v.u;
    packed[o + 3] = v.v;
  }
  return packed;
}

export function createProceduralSkyTexture(theme: MapSpaceTheme): HTMLCanvasElement {
  const { width, height } = SKY_TEXTURE_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const deep = theme.deep;
  const nebula = theme.nebula;
  const milky = theme.milkyWay;

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, `rgb(${deep[0] * 255 | 0}, ${deep[1] * 255 | 0}, ${(deep[2] * 255 + 8) | 0})`);
  grad.addColorStop(
    0.45,
    `rgb(${(deep[0] * 255 + nebula[0] * 30) | 0}, ${(deep[1] * 255 + nebula[1] * 20) | 0}, ${(deep[2] * 255 + nebula[2] * 40) | 0})`
  );
  grad.addColorStop(1, `rgb(${deep[0] * 255 | 0}, ${deep[1] * 255 | 0}, ${deep[2] * 255 | 0})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const milkyCenterV = 0.42;
  const milkyTilt = 0.08;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const v = y / height;
      const idx = (y * width + x) * 4;

      const band =
        Math.exp(-((v - milkyCenterV + Math.sin(u * Math.PI * 2) * milkyTilt) ** 2) / 0.018) *
        (0.55 + 0.45 * Math.sin(u * Math.PI * 4 + 1.2) ** 2);

      const neb =
        fbm(u * 6.5, v * 4.2) * 0.35 +
        fbm(u * 14 + 3.1, v * 9 - 1.7) * 0.2;

      const galaxyBlob =
        Math.exp(-((u - 0.72) ** 2 + (v - 0.28) ** 2) / 0.002) * 0.35 +
        Math.exp(-((u - 0.18) ** 2 + (v - 0.62) ** 2) / 0.0015) * 0.25;

      const haze = fbm(u * 2.5 + 10, v * 2.5) * 0.08;

      const r =
        data[idx] +
        (milky[0] * 255 * band * 0.55 + nebula[0] * 255 * neb * 0.35 + galaxyBlob * 180 + haze * 20);
      const g =
        data[idx + 1] +
        (milky[1] * 255 * band * 0.5 + nebula[1] * 255 * neb * 0.3 + galaxyBlob * 160 + haze * 18);
      const b =
        data[idx + 2] +
        (milky[2] * 255 * band * 0.65 + nebula[2] * 255 * neb * 0.45 + galaxyBlob * 200 + haze * 35);

      data[idx] = Math.min(255, r);
      data[idx + 1] = Math.min(255, g);
      data[idx + 2] = Math.min(255, b);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export class ShootingStarManager {
  private active: ShootingStar | null = null;
  private nextSpawn = 4 + Math.random() * 8;

  update(elapsed: number): ShootingStar | null {
    if (this.active) {
      this.active.progress += 1 / (60 * this.active.duration);
      if (this.active.progress >= 1) {
        this.active = null;
        this.nextSpawn = elapsed + 6 + Math.random() * 14;
      }
      return this.active;
    }
    if (elapsed < this.nextSpawn) return null;

    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lng = (Math.atan2(x, z) * 180) / Math.PI;
    const start = lngLatToMercator(lng, lat);
    const angle = Math.random() * Math.PI * 2;
    const len = 0.012 + Math.random() * 0.028;
    this.active = {
      startX: start.x,
      startY: start.y,
      endX: start.x + Math.cos(angle) * len,
      endY: start.y + Math.sin(angle) * len * 0.35,
      progress: 0,
      duration: 0.55 + Math.random() * 0.45,
    };
    return this.active;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
