import type { CustomLayerInterface, Map as MapLibreMap } from "maplibre-gl";
import { linkProgram } from "@/lib/spaceEnvironment/projection";
import { computeSpaceFade } from "@/lib/spaceEnvironment/zoomFade";
import { getWeatherAmbience, tickWeatherAmbience } from "./ambienceStore";
import type { WeatherAmbience } from "./conditions";

export const SNAP_ATMOSPHERE_LAYER_ID = "duo-snap-weather-atmosphere";

export type SnapAtmosphereFlags = {
  live: boolean;
  temperature: boolean;
  clouds: boolean;
  sunny: boolean;
  fog: boolean;
  storms: boolean;
};

const VERT = `#version 300 es
out vec2 v_uv;
void main() {
  float x = float((gl_VertexID & 1) << 2) - 1.0;
  float y = float((gl_VertexID & 2) << 1) - 1.0;
  v_uv = vec2(x * 0.5 + 0.5, 1.0 - (y * 0.5 + 0.5));
  gl_Position = vec4(x, y, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform float u_time;
uniform float u_opacity;
uniform float u_temp;
uniform float u_clouds;
uniform float u_sunny;
uniform float u_fog;
uniform float u_storm;
uniform float u_wet;
uniform float u_lightning;
uniform float u_tempFx;
uniform float u_cloudFx;
uniform float u_sunnyFx;
uniform float u_fogFx;
uniform float u_stormFx;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = v_uv;
  float t = u_time * 0.04;

  float warm = smoothstep(-5.0, 32.0, u_temp);
  float cold = 1.0 - smoothstep(-18.0, 8.0, u_temp);
  vec3 warmTint = vec3(1.0, 0.72, 0.42);
  vec3 coldTint = vec3(0.45, 0.68, 1.0);
  vec3 tempColor = mix(coldTint * cold, warmTint * warm, warm);
  float tempAmt = (warm * 0.14 + cold * 0.12) * u_tempFx;

  float cloudNoise = noise(uv * 3.5 + vec2(t * 0.35, t * 0.12));
  cloudNoise += noise(uv * 7.0 - vec2(t * 0.2, t * 0.08)) * 0.5;
  float cloudCover = smoothstep(0.25, 0.85, cloudNoise) * (u_clouds / 100.0) * u_cloudFx;
  vec3 cloudShadow = vec3(0.08, 0.1, 0.14) * cloudCover * 0.35;

  vec2 sunPos = vec2(0.78, 0.22);
  float sunDist = length(uv - sunPos);
  float sunGlow = exp(-sunDist * 5.5) * u_sunny * u_sunnyFx;
  float lens = exp(-abs(sin(uv.x * 24.0 + t)) * 0.08) * sunGlow * 0.25;
  vec3 sunColor = vec3(1.0, 0.92, 0.72) * (sunGlow + lens);

  float fogNoise = noise(uv * 2.0 + vec2(t * 0.08, 0.0));
  float fogAmt = u_fog * u_fogFx * (0.45 + fogNoise * 0.55);
  vec3 fogColor = vec3(0.78, 0.82, 0.88);

  float stormDark = u_storm * u_stormFx * 0.28;
  float wetShimmer = u_wet * (0.5 + 0.5 * sin(u_time * 2.2 + uv.x * 30.0)) * 0.06;

  vec3 color = tempColor * tempAmt;
  color += sunColor;
  color -= cloudShadow;
  color = mix(color, fogColor, fogAmt * 0.55);
  color *= 1.0 - stormDark;
  color += vec3(1.0) * u_lightning * 0.55;
  color += vec3(0.55, 0.72, 1.0) * wetShimmer;

  float alpha = u_opacity * (
    tempAmt * 0.9 +
    cloudCover * 0.45 +
    sunGlow * 0.55 +
    fogAmt * 0.65 +
    stormDark * 0.8 +
    u_lightning * 0.9 +
    wetShimmer * 2.0
  );
  fragColor = vec4(color, clamp(alpha, 0.0, 0.72));
}`;

function ambienceUniforms(a: WeatherAmbience) {
  return {
    u_temp: a.temp,
    u_clouds: a.clouds,
    u_sunny: a.sunnyIntensity,
    u_fog: a.fogIntensity,
    u_storm: a.stormIntensity,
    u_wet: a.wetness,
  };
}

export function createSnapAtmosphereLayer(
  getFlags: () => SnapAtmosphereFlags
): CustomLayerInterface {
  let mapRef: MapLibreMap | null = null;
  let start = 0;
  let program: WebGLProgram | null = null;
  let lightningUntil = 0;

  return {
    id: SNAP_ATMOSPHERE_LAYER_ID,
    type: "custom",
    renderingMode: "2d",
    onAdd(map, gl) {
      mapRef = map;
      start = performance.now();
      if (!(gl instanceof WebGL2RenderingContext)) return;
      program = linkProgram(gl, VERT, FRAG);
    },
    onRemove(_map, gl) {
      if (program) gl.deleteProgram(program);
      program = null;
      mapRef = null;
    },
    render(gl, _args) {
      const map = mapRef;
      if (!map || !program) return;
      const flags = getFlags();
      if (!flags.live) return;

      const zoom = map.getZoom();
      // Don't darken the planetary globe with a fullscreen weather wash.
      if (zoom < 4.5) return;

      const ambience = tickWeatherAmbience();
      const fade = computeSpaceFade(zoom);
      const zoomOpacity =
        zoom < 6
          ? 0.18 + fade.stars * 0.12
          : 0.45 + Math.min(0.3, (zoom - 3) * 0.04);

      const elapsed = (performance.now() - start) / 1000;
      let lightning = 0;
      if (flags.storms && ambience.stormIntensity > 0.2) {
        if (Math.sin(elapsed * 7.5) > 0.94 && performance.now() > lightningUntil) {
          lightningUntil = performance.now() + 120;
        }
        if (performance.now() < lightningUntil) {
          lightning = ambience.stormIntensity;
        }
      }

      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(program);
      const u = ambienceUniforms(ambience);
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), elapsed);
      gl.uniform1f(gl.getUniformLocation(program, "u_opacity"), zoomOpacity);
      gl.uniform1f(gl.getUniformLocation(program, "u_temp"), u.u_temp);
      gl.uniform1f(gl.getUniformLocation(program, "u_clouds"), u.u_clouds);
      gl.uniform1f(gl.getUniformLocation(program, "u_sunny"), u.u_sunny);
      gl.uniform1f(gl.getUniformLocation(program, "u_fog"), u.u_fog);
      gl.uniform1f(gl.getUniformLocation(program, "u_storm"), u.u_storm);
      gl.uniform1f(gl.getUniformLocation(program, "u_wet"), u.u_wet);
      gl.uniform1f(gl.getUniformLocation(program, "u_lightning"), lightning);
      gl.uniform1f(gl.getUniformLocation(program, "u_tempFx"), flags.temperature ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, "u_cloudFx"), flags.clouds ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, "u_sunnyFx"), flags.sunny ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, "u_fogFx"), flags.fog ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(program, "u_stormFx"), flags.storms ? 1 : 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      map.triggerRepaint();
    },
  };
}
