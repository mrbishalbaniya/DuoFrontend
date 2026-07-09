import {
  MercatorCoordinate,
  type CustomLayerInterface,
  type CustomRenderMethodInput,
  type Map as MapLibreMap,
} from "maplibre-gl";
import { bindProjectionUniforms, linkProgram } from "@/lib/spaceEnvironment/projection";
import { computeSpaceFade } from "@/lib/spaceEnvironment/zoomFade";
import { getWeatherAmbience, tickWeatherAmbience } from "./ambienceStore";
import type { WeatherAmbience } from "./conditions";

export const WEATHER_PARTICLE_LAYER_ID = "duo-weather-particles";

export type SnapParticleFlags = {
  live: boolean;
  rain: boolean;
  snow: boolean;
  wind: boolean;
  storms: boolean;
};

const MAX_PARTICLES = 2400;

function generateViewportParticles(map: MapLibreMap, ambience: WeatherAmbience): Float32Array {
  const b = map.getBounds();
  const west = MercatorCoordinate.fromLngLat({ lng: b.getWest(), lat: b.getCenter().lat }).x;
  const east = MercatorCoordinate.fromLngLat({ lng: b.getEast(), lat: b.getCenter().lat }).x;
  const south = MercatorCoordinate.fromLngLat({ lng: b.getCenter().lng, lat: b.getSouth() }).y;
  const north = MercatorCoordinate.fromLngLat({ lng: b.getCenter().lng, lat: b.getNorth() }).y;

  const rainCount = Math.floor(MAX_PARTICLES * ambience.rainIntensity * 0.85);
  const snowCount = Math.floor(MAX_PARTICLES * ambience.snowIntensity * 0.7);
  const windCount = Math.floor(MAX_PARTICLES * Math.min(1, ambience.windSpeed / 12) * 0.35);
  const boltCount = Math.floor(40 * ambience.stormIntensity);
  const total = Math.min(MAX_PARTICLES, rainCount + snowCount + windCount + boltCount);

  const data = new Float32Array(total * 5);
  let i = 0;

  const push = (kind: number, size: number) => {
    if (i >= total) return;
    const lng = b.getWest() + Math.random() * (b.getEast() - b.getWest());
    const lat = b.getSouth() + Math.random() * (b.getNorth() - b.getSouth());
    const c = MercatorCoordinate.fromLngLat({ lng, lat });
    const o = i * 5;
    data[o] = c.x;
    data[o + 1] = c.y;
    data[o + 2] = kind;
    data[o + 3] = size;
    data[o + 4] = Math.random() * Math.PI * 2;
    i += 1;
  };

  for (let n = 0; n < rainCount; n += 1) push(0, 1.2 + Math.random() * 1.4);
  for (let n = 0; n < snowCount; n += 1) push(1, 1.5 + Math.random() * 1.2);
  for (let n = 0; n < windCount; n += 1) push(2, 0.9 + Math.random() * 0.8);
  for (let n = 0; n < boltCount; n += 1) push(3, 2.2 + Math.random() * 1.5);

  void west;
  void east;
  void south;
  void north;
  return data.subarray(0, i * 5);
}

function vert(shaderData: CustomRenderMethodInput["shaderData"]) {
  return `#version 300 es
${shaderData.vertexShaderPrelude}
${shaderData.define}
uniform float u_altitude;
uniform float u_pixelRatio;
uniform float u_windRad;
uniform float u_time;
uniform float u_zoom;
in vec2 a_pos;
in float a_kind;
in float a_size;
in float a_phase;
out float v_kind;
out float v_alpha;
void main() {
  float kind = a_kind;
  float fall = mod(u_time * (0.8 + a_size * 0.15) + a_phase, 1.0);
  vec2 drift = vec2(cos(u_windRad), sin(u_windRad)) * fall * 0.018 * (1.0 + u_zoom * 0.02);
  vec2 drop = vec2(0.0, fall * 0.025);
  vec2 offset = mix(drop, drift, step(1.5, kind));
  vec4 clip = projectTileFor3D(a_pos + offset + drift * step(0.5, kind) * (1.0 - step(1.5, kind)), u_altitude);
  gl_Position = clip;
  float w = max(0.35, clip.w);
  float sizeMul = kind < 0.5 ? 2.8 : kind < 1.5 ? 2.2 : kind < 2.5 ? 1.6 : 3.5;
  gl_PointSize = clamp(a_size * sizeMul * u_pixelRatio * (480.0 / w), 0.8, kind > 2.5 ? 6.0 : 4.2);
  v_kind = kind;
  v_alpha = 0.55 + 0.45 * sin(a_phase + u_time);
}`;
}

const FRAG = `#version 300 es
precision highp float;
uniform float u_time;
uniform float u_opacity;
uniform float u_lightning;
in float v_kind;
in float v_alpha;
out vec4 fragColor;
void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = dot(p, p);
  float streak = v_kind < 0.5 ? smoothstep(0.2, 0.0, abs(p.x) + abs(p.y) * 2.5) : smoothstep(0.25, 0.0, d);
  if (streak < 0.01) discard;
  vec3 rain = vec3(0.68, 0.82, 1.0);
  vec3 snow = vec3(0.96, 0.98, 1.0);
  vec3 wind = vec3(0.62, 0.8, 1.0);
  vec3 bolt = vec3(1.0, 0.97, 0.82);
  vec3 color = rain;
  color = mix(color, snow, step(0.5, v_kind) * (1.0 - step(1.5, v_kind)));
  color = mix(color, wind, step(1.5, v_kind) * (1.0 - step(2.5, v_kind)));
  color = mix(color, bolt, step(2.5, v_kind));
  float flash = 1.0 + u_lightning * step(2.5, v_kind) * 2.0;
  float alpha = streak * u_opacity * v_alpha * flash;
  fragColor = vec4(color * alpha, alpha);
}`;

export function createWeatherParticleLayer(
  getFlags: () => SnapParticleFlags
): CustomLayerInterface {
  let mapRef: MapLibreMap | null = null;
  let buffer: WebGLBuffer | null = null;
  let particleCount = 0;
  let start = 0;
  let lightningUntil = 0;
  const programs = new Map<string, WebGLProgram>();

  const regen = (map: MapLibreMap, gl: WebGL2RenderingContext) => {
    const ambience = getWeatherAmbience();
    const data = generateViewportParticles(map, ambience);
    particleCount = data.length / 5;
    if (!buffer) buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  };

  let moveEndHandler: (() => void) | null = null;

  return {
    id: WEATHER_PARTICLE_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd(map, gl) {
      mapRef = map;
      start = performance.now();
      if (!(gl instanceof WebGL2RenderingContext)) return;
      regen(map, gl);
      moveEndHandler = () => regen(map, gl);
      map.on("moveend", moveEndHandler);
    },
    onRemove(map, gl) {
      if (moveEndHandler) map.off("moveend", moveEndHandler);
      moveEndHandler = null;
      if (buffer) gl.deleteBuffer(buffer);
      for (const p of programs.values()) gl.deleteProgram(p);
      programs.clear();
      buffer = null;
      mapRef = null;
    },
    render(gl, args) {
      const map = mapRef;
      if (!map || !buffer || particleCount === 0) return;

      const flags = getFlags();
      if (!flags.live) return;

      const ambience = tickWeatherAmbience();
      const showRain = flags.rain && ambience.rainIntensity > 0.05;
      const showSnow = flags.snow && ambience.snowIntensity > 0.05;
      const showWind = flags.wind && ambience.windSpeed > 1.5;
      const showStorm = flags.storms && ambience.stormIntensity > 0.1;
      if (!showRain && !showSnow && !showWind && !showStorm) return;

      const zoom = map.getZoom();
      const fade = computeSpaceFade(zoom);
      const altitude = zoom < 5 ? 28_000_000 : zoom < 9 ? 12_000_000 : 4_500_000;
      const opacity =
        (0.3 + ambience.rainIntensity * 0.45 + ambience.snowIntensity * 0.4) *
        Math.max(0.25, fade.stars + (zoom > 6 ? 0.45 : 0));

      const elapsed = (performance.now() - start) / 1000;
      let lightning = 0;
      if (showStorm && Math.sin(elapsed * 8) > 0.93 && performance.now() > lightningUntil) {
        lightningUntil = performance.now() + 100;
      }
      if (performance.now() < lightningUntil) lightning = ambience.stormIntensity;

      const key = args.shaderData.variantName;
      let program = programs.get(key);
      if (!program) {
        program = linkProgram(gl, vert(args.shaderData), FRAG);
        programs.set(key, program);
      }

      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(program);
      bindProjectionUniforms(gl, program, args.defaultProjectionData);
      gl.uniform1f(gl.getUniformLocation(program, "u_altitude"), altitude);
      gl.uniform1f(gl.getUniformLocation(program, "u_pixelRatio"), window.devicePixelRatio || 1);
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), elapsed);
      gl.uniform1f(gl.getUniformLocation(program, "u_opacity"), opacity);
      gl.uniform1f(gl.getUniformLocation(program, "u_zoom"), zoom);
      gl.uniform1f(
        gl.getUniformLocation(program, "u_windRad"),
        ((ambience.windDeg - 90) * Math.PI) / 180
      );
      gl.uniform1f(gl.getUniformLocation(program, "u_lightning"), lightning);

      const stride = 20;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const pos = gl.getAttribLocation(program, "a_pos");
      const kind = gl.getAttribLocation(program, "a_kind");
      const size = gl.getAttribLocation(program, "a_size");
      const phase = gl.getAttribLocation(program, "a_phase");
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(kind);
      gl.vertexAttribPointer(kind, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(size);
      gl.vertexAttribPointer(size, 1, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(phase);
      gl.vertexAttribPointer(phase, 1, gl.FLOAT, false, stride, 16);

      gl.drawArrays(gl.POINTS, 0, particleCount);
      map.triggerRepaint();
    },
  };
}
