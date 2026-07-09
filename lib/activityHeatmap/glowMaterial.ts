import * as THREE from "three";

import type { ActivityLevel } from "./types";

const LEVEL_COLORS: Record<ActivityLevel, [THREE.Color, THREE.Color]> = {
  low: [new THREE.Color("#4ade80"), new THREE.Color("#22c55e")],
  moderate: [new THREE.Color("#fde047"), new THREE.Color("#facc15")],
  high: [new THREE.Color("#fb923c"), new THREE.Color("#f97316")],
  trending: [new THREE.Color("#f87171"), new THREE.Color("#ef4444")],
  viral: [new THREE.Color("#e879f9"), new THREE.Color("#c084fc")],
};

const GLOW_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLOW_FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec3 u_colorInner;
uniform vec3 u_colorOuter;
uniform float u_time;
uniform float u_phase;
uniform float u_intensity;
uniform float u_ripple;

float blob(vec2 uv, float pulse) {
  vec2 c = uv - 0.5;
  float d = length(c) * 2.0;
  float breathe = 0.88 + 0.12 * sin(u_time * 1.6 + u_phase);
  float core = smoothstep(1.0, 0.0, d / breathe) * u_intensity;
  float glow = smoothstep(1.0, 0.15, d / (breathe + 0.25)) * 0.45 * u_intensity;
  float ripple = smoothstep(0.85, 0.55, abs(d - 0.35 - u_ripple)) * 0.22 * u_intensity;
  return core + glow + ripple;
}

void main() {
  float pulse = blob(vUv, 1.0);
  vec3 col = mix(u_colorOuter, u_colorInner, pulse);
  float alpha = pulse * 0.62;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}`;

export function createGlowMaterial(level: ActivityLevel, phase: number): THREE.ShaderMaterial {
  const [inner, outer] = LEVEL_COLORS[level];
  return new THREE.ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: {
      u_colorInner: { value: inner },
      u_colorOuter: { value: outer },
      u_time: { value: 0 },
      u_phase: { value: phase },
      u_intensity: { value: 0.8 },
      u_ripple: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

export function levelPulseSpeed(level: ActivityLevel): number {
  switch (level) {
    case "viral":
      return 2.4;
    case "trending":
      return 2.0;
    case "high":
      return 1.6;
    case "moderate":
      return 1.2;
    default:
      return 0.9;
  }
}

export function rippleCount(level: ActivityLevel): number {
  if (level === "viral") return 3;
  if (level === "trending") return 2;
  if (level === "high") return 1;
  return 0;
}
