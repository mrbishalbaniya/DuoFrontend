import type { CustomRenderMethodInput } from "maplibre-gl";

export function starVertexShader(shaderData: CustomRenderMethodInput["shaderData"]): string {
  return `#version 300 es
${shaderData.vertexShaderPrelude}
${shaderData.define}

uniform float u_altitude;
uniform float u_pixelRatio;
uniform float u_sizeScale;
in vec3 a_dir;
in float a_size;
in float a_brightness;
in float a_temp;
in float a_phase;
out float v_brightness;
out float v_temp;
out float v_phase;

void main() {
  vec3 dir = normalize(a_dir);
  vec3 elevatedPos = dir * (1.0 + u_altitude / GLOBE_RADIUS);
  vec4 globePosition = u_projection_matrix * vec4(elevatedPos, 1.0);
  globePosition.z = globeComputeClippingZ(elevatedPos) * globePosition.w;
  gl_Position = globePosition;
  float w = max(0.3, gl_Position.w);
  float size = a_size * u_sizeScale * u_pixelRatio * (620.0 / w);
  gl_PointSize = clamp(size, 0.45, 3.2);
  v_brightness = a_brightness;
  v_temp = a_temp;
  v_phase = a_phase;
}`;
}

export const STAR_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform float u_opacity;
uniform vec3 u_starWhite;
uniform vec3 u_starBlue;
uniform vec3 u_starYellow;
uniform vec3 u_starRed;
in float v_brightness;
in float v_temp;
in float v_phase;
out vec4 fragColor;

vec3 starColor(float t) {
  if (t < 0.2) return mix(u_starBlue, u_starWhite, t / 0.2);
  if (t < 0.5) return mix(u_starWhite, u_starYellow, (t - 0.2) / 0.3);
  if (t < 0.75) return mix(u_starYellow, u_starWhite, (t - 0.5) / 0.25);
  return mix(u_starWhite, u_starRed, (t - 0.75) / 0.25);
}

void main() {
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = dot(p, p);
  if (d > 0.24) discard;
  float core = smoothstep(0.24, 0.0, d);
  float halo = smoothstep(0.5, 0.08, d) * 0.15;
  float twinkle = 0.9 + 0.1 * sin(u_time * (0.6 + v_phase * 0.3) + v_phase);
  vec3 color = starColor(v_temp);
  float alpha = (core + halo) * v_brightness * twinkle * u_opacity;
  fragColor = vec4(color * alpha, alpha);
}`;

export function skyVertexShader(shaderData: CustomRenderMethodInput["shaderData"]): string {
  return `#version 300 es
${shaderData.vertexShaderPrelude}
${shaderData.define}

uniform float u_altitude;
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;

void main() {
  gl_Position = projectTileFor3D(a_pos, u_altitude);
  v_uv = a_uv;
}`;
}

export const SKY_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform sampler2D u_skyTex;
uniform float u_milkyOpacity;
uniform float u_nebulaOpacity;
uniform vec3 u_nebulaTint;
uniform vec3 u_hazeTint;
uniform float u_haze;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 tex = texture(u_skyTex, v_uv);
  float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
  float neb = smoothstep(0.06, 0.5, lum) * u_nebulaOpacity;
  vec3 color = tex.rgb * u_milkyOpacity;
  color += u_nebulaTint * neb * lum;
  color += u_hazeTint * u_haze * (1.0 - length(v_uv - vec2(0.5)) * 0.6);
  float alpha = clamp(u_milkyOpacity * lum + neb * 0.35 + u_haze * 0.12, 0.0, 1.0);
  fragColor = vec4(color, alpha);
}`;

export function meteorVertexShader(shaderData: CustomRenderMethodInput["shaderData"]): string {
  return `#version 300 es
${shaderData.vertexShaderPrelude}
${shaderData.define}

uniform float u_altitude;
uniform float u_progress;
in vec2 a_pos;
in float a_t;
out float v_t;

void main() {
  v_t = a_t;
  gl_Position = projectTileFor3D(a_pos, u_altitude);
}`;
}

export const METEOR_FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform float u_opacity;
uniform float u_progress;
in float v_t;
out vec4 fragColor;

void main() {
  float head = smoothstep(0.0, 0.15, u_progress) * (1.0 - smoothstep(0.85, 1.0, u_progress));
  float along = smoothstep(1.0, 0.0, v_t);
  float alpha = along * head * u_opacity * 0.85;
  fragColor = vec4(vec3(0.95, 0.97, 1.0) * alpha, alpha);
}`;
