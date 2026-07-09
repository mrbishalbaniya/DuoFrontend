import type { CustomRenderMethodInput } from "maplibre-gl";

type GlContext = WebGLRenderingContext | WebGL2RenderingContext;

export function bindProjectionUniforms(
  gl: GlContext,
  program: WebGLProgram,
  projection: CustomRenderMethodInput["defaultProjectionData"]
) {
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "u_projection_fallback_matrix"),
    false,
    projection.fallbackMatrix
  );
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "u_projection_matrix"),
    false,
    projection.mainMatrix
  );
  gl.uniform4f(
    gl.getUniformLocation(program, "u_projection_tile_mercator_coords"),
    ...projection.tileMercatorCoords
  );
  gl.uniform4f(
    gl.getUniformLocation(program, "u_projection_clipping_plane"),
    ...projection.clippingPlane
  );
  gl.uniform1f(
    gl.getUniformLocation(program, "u_projection_transition"),
    projection.projectionTransition
  );
}

export function compileShader(gl: GlContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "shader compile failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

export function linkProgram(gl: GlContext, vert: string, frag: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  const v = compileShader(gl, gl.VERTEX_SHADER, vert);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, frag);
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "program link failed";
    gl.deleteProgram(program);
    throw new Error(log);
  }
  return program;
}
