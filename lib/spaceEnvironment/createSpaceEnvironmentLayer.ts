import type { CustomLayerInterface, CustomRenderMethodInput, Map as MapLibreMap } from "maplibre-gl";
import { readMapSpaceTheme } from "@/lib/mapTheme";
import { isDocumentVisible, requestMapRepaint } from "@/lib/mapPerf";
import { ALTITUDE, SPACE_ENVIRONMENT_LAYER_ID, STAR_COUNTS } from "./constants";
import {
  createProceduralSkyTexture,
  generateSkySphere,
  generateStarField,
  packSkySphere,
  packStars,
  prefersReducedMotion,
  ShootingStarManager,
} from "./procedural";
import { bindProjectionUniforms, linkProgram } from "./projection";
import {
  METEOR_FRAGMENT_SHADER,
  meteorVertexShader,
  SKY_FRAGMENT_SHADER,
  skyVertexShader,
  STAR_FRAGMENT_SHADER,
  starVertexShader,
} from "./shaders";
import { computeSpaceFade, starLodCounts } from "./zoomFade";

type GlContext = WebGLRenderingContext | WebGL2RenderingContext;

type ShaderBundle = {
  stars: WebGLProgram;
  sky: WebGLProgram;
  meteor: WebGLProgram;
  starAttrs: { dir: number; size: number; bright: number; temp: number; phase: number };
  skyAttrs: { pos: number; uv: number };
  meteorAttrs: { pos: number; t: number };
};

function saveGlState(gl: GlContext) {
  return {
    depth: gl.getParameter(gl.DEPTH_TEST),
    depthMask: gl.getParameter(gl.DEPTH_WRITEMASK),
    depthFunc: gl.getParameter(gl.DEPTH_FUNC),
    cull: gl.getParameter(gl.CULL_FACE),
    blend: gl.getParameter(gl.BLEND),
  };
}

function restoreGlState(gl: GlContext, state: ReturnType<typeof saveGlState>) {
  gl.depthMask(state.depthMask);
  if (state.depth) gl.enable(gl.DEPTH_TEST);
  else gl.disable(gl.DEPTH_TEST);
  if (state.cull) gl.enable(gl.CULL_FACE);
  else gl.disable(gl.CULL_FACE);
  if (!state.blend) gl.disable(gl.BLEND);
}

function setupTransparentDepth(gl: GlContext) {
  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE);
}

function bindStarBuffer(
  gl: GlContext,
  buffer: WebGLBuffer,
  attrs: ShaderBundle["starAttrs"]
) {
  const stride = 7 * 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(attrs.dir);
  gl.vertexAttribPointer(attrs.dir, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(attrs.size);
  gl.vertexAttribPointer(attrs.size, 1, gl.FLOAT, false, stride, 12);
  gl.enableVertexAttribArray(attrs.bright);
  gl.vertexAttribPointer(attrs.bright, 1, gl.FLOAT, false, stride, 16);
  gl.enableVertexAttribArray(attrs.temp);
  gl.vertexAttribPointer(attrs.temp, 1, gl.FLOAT, false, stride, 20);
  gl.enableVertexAttribArray(attrs.phase);
  gl.vertexAttribPointer(attrs.phase, 1, gl.FLOAT, false, stride, 24);
}

function drawStarLayer(
  gl: GlContext,
  program: WebGLProgram,
  buffer: WebGLBuffer,
  attrs: ShaderBundle["starAttrs"],
  count: number,
  altitude: number,
  opacity: number,
  sizeScale: number,
  elapsed: number,
  pixelRatio: number,
  theme: ReturnType<typeof readMapSpaceTheme>,
  projection: CustomRenderMethodInput["defaultProjectionData"]
) {
  if (count <= 0 || opacity <= 0.01) return;
  gl.useProgram(program);
  bindProjectionUniforms(gl, program, projection);
  gl.uniform1f(gl.getUniformLocation(program, "u_altitude"), altitude);
  gl.uniform1f(gl.getUniformLocation(program, "u_time"), elapsed);
  gl.uniform1f(gl.getUniformLocation(program, "u_opacity"), opacity);
  gl.uniform1f(gl.getUniformLocation(program, "u_pixelRatio"), pixelRatio);
  gl.uniform1f(gl.getUniformLocation(program, "u_sizeScale"), sizeScale);
  gl.uniform3f(gl.getUniformLocation(program, "u_starWhite"), 1, 1, 1);
  gl.uniform3f(gl.getUniformLocation(program, "u_starBlue"), ...theme.starCool);
  gl.uniform3f(gl.getUniformLocation(program, "u_starYellow"), ...theme.starWarm);
  gl.uniform3f(gl.getUniformLocation(program, "u_starRed"), 1, 0.55, 0.42);
  bindStarBuffer(gl, buffer, attrs);
  gl.drawArrays(gl.POINTS, 0, count);
}

export function createSpaceEnvironmentLayer(): CustomLayerInterface {
  let mapRef: MapLibreMap | null = null;
  let startTime = 0;
  let lastPaintMs = { current: 0 };
  let meteorBuffer: WebGLBuffer | null = null;
  const shaderCache = new Map<string, ShaderBundle>();

  let distantBuffer: WebGLBuffer | null = null;
  let mediumBuffer: WebGLBuffer | null = null;
  let brightBuffer: WebGLBuffer | null = null;
  let dustBuffer: WebGLBuffer | null = null;
  let skyBuffer: WebGLBuffer | null = null;
  let skyTexture: WebGLTexture | null = null;
  let skyVertexCount = 0;

  const shootingStars = new ShootingStarManager();

  const getShaders = (gl: GlContext, args: CustomRenderMethodInput): ShaderBundle => {
    const key = args.shaderData.variantName;
    const cached = shaderCache.get(key);
    if (cached) return cached;

    const stars = linkProgram(gl, starVertexShader(args.shaderData), STAR_FRAGMENT_SHADER);
    const sky = linkProgram(gl, skyVertexShader(args.shaderData), SKY_FRAGMENT_SHADER);
    const meteor = linkProgram(gl, meteorVertexShader(args.shaderData), METEOR_FRAGMENT_SHADER);

    const bundle: ShaderBundle = {
      stars,
      sky,
      meteor,
      starAttrs: {
        dir: gl.getAttribLocation(stars, "a_dir"),
        size: gl.getAttribLocation(stars, "a_size"),
        bright: gl.getAttribLocation(stars, "a_brightness"),
        temp: gl.getAttribLocation(stars, "a_temp"),
        phase: gl.getAttribLocation(stars, "a_phase"),
      },
      skyAttrs: {
        pos: gl.getAttribLocation(sky, "a_pos"),
        uv: gl.getAttribLocation(sky, "a_uv"),
      },
      meteorAttrs: {
        pos: gl.getAttribLocation(meteor, "a_pos"),
        t: gl.getAttribLocation(meteor, "a_t"),
      },
    };
    shaderCache.set(key, bundle);
    return bundle;
  };

  return {
    id: SPACE_ENVIRONMENT_LAYER_ID,
    type: "custom",
    renderingMode: "3d",
    onAdd(map, gl) {
      mapRef = map;
      startTime = performance.now();

      const isWebGL2 =
        typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
      if (!isWebGL2) {
        console.warn("Space environment requires WebGL2");
        return;
      }

      const theme = readMapSpaceTheme();
      const distant = packStars(generateStarField(STAR_COUNTS.distant, [0.35, 0.9]));
      const medium = packStars(generateStarField(STAR_COUNTS.medium, [0.65, 1.35]));
      const bright = packStars(generateStarField(STAR_COUNTS.bright, [1.1, 2.4]));
      const dust = packStars(generateStarField(STAR_COUNTS.dust, [0.25, 0.55]));

      distantBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, distantBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, distant, gl.STATIC_DRAW);

      mediumBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, mediumBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, medium, gl.STATIC_DRAW);

      brightBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, brightBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, bright, gl.STATIC_DRAW);

      dustBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, dustBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, dust, gl.STATIC_DRAW);

      const skyVerts = generateSkySphere(6);
      skyVertexCount = skyVerts.length;
      const skyPacked = packSkySphere(skyVerts);
      skyBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, skyPacked, gl.STATIC_DRAW);

      const skyCanvas = createProceduralSkyTexture(theme);
      skyTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, skyTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, skyCanvas);
    },
    onRemove(_map, gl) {
      for (const bundle of shaderCache.values()) {
        gl.deleteProgram(bundle.stars);
        gl.deleteProgram(bundle.sky);
        gl.deleteProgram(bundle.meteor);
      }
      shaderCache.clear();
      if (distantBuffer) gl.deleteBuffer(distantBuffer);
      if (mediumBuffer) gl.deleteBuffer(mediumBuffer);
      if (brightBuffer) gl.deleteBuffer(brightBuffer);
      if (dustBuffer) gl.deleteBuffer(dustBuffer);
      if (skyBuffer) gl.deleteBuffer(skyBuffer);
      if (meteorBuffer) gl.deleteBuffer(meteorBuffer);
      if (skyTexture) gl.deleteTexture(skyTexture);
      distantBuffer = null;
      mediumBuffer = null;
      brightBuffer = null;
      dustBuffer = null;
      skyBuffer = null;
      meteorBuffer = null;
      skyTexture = null;
      mapRef = null;
    },
    render(gl, args) {
      const map = mapRef;
      if (!map || !distantBuffer || !mediumBuffer || !brightBuffer || !dustBuffer || !skyBuffer || !skyTexture) {
        return;
      }

      const zoom = map.getZoom();
      const fade = computeSpaceFade(zoom);
      const lod = starLodCounts(zoom);
      if (fade.stars <= 0.01 && fade.milkyWay <= 0.01) return;
      if (!isDocumentVisible()) return;

      const elapsed = (performance.now() - startTime) / 1000;
      const intro = Math.min(1, elapsed / 2);
      const theme = readMapSpaceTheme();
      const shaders = getShaders(gl, args);
      const pixelRatio = window.devicePixelRatio || 1;
      const glState = saveGlState(gl);
      setupTransparentDepth(gl);

      // Pure black globe background — star points only, no milky/nebula sky dome.
      const enableSkyDome = false;
      if (enableSkyDome && fade.milkyWay > 0.01 && skyVertexCount > 0) {
        const milkyOpacity = fade.milkyWay * intro * 0.92;
        gl.useProgram(shaders.sky);
        bindProjectionUniforms(gl, shaders.sky, args.defaultProjectionData);
        gl.uniform1f(gl.getUniformLocation(shaders.sky, "u_altitude"), ALTITUDE.skyDome);
        gl.uniform1f(gl.getUniformLocation(shaders.sky, "u_milkyOpacity"), milkyOpacity);
        gl.uniform1f(gl.getUniformLocation(shaders.sky, "u_nebulaOpacity"), fade.nebula * intro * 0.75);
        gl.uniform3f(gl.getUniformLocation(shaders.sky, "u_nebulaTint"), ...theme.nebula);
        gl.uniform3f(gl.getUniformLocation(shaders.sky, "u_hazeTint"), ...theme.milkyWay);
        gl.uniform1f(gl.getUniformLocation(shaders.sky, "u_haze"), fade.haze * intro);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, skyTexture);
        gl.uniform1i(gl.getUniformLocation(shaders.sky, "u_skyTex"), 0);

        const stride = 4 * 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, skyBuffer);
        gl.enableVertexAttribArray(shaders.skyAttrs.pos);
        gl.vertexAttribPointer(shaders.skyAttrs.pos, 2, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(shaders.skyAttrs.uv);
        gl.vertexAttribPointer(shaders.skyAttrs.uv, 2, gl.FLOAT, false, stride, 8);
        gl.drawArrays(gl.TRIANGLES, 0, skyVertexCount);
      }

      const starOpacity = fade.stars * intro * 0.9;
      drawStarLayer(
        gl,
        shaders.stars,
        distantBuffer,
        shaders.starAttrs,
        lod.distant,
        ALTITUDE.distantStars,
        starOpacity * 0.85,
        0.9,
        elapsed,
        pixelRatio,
        theme,
        args.defaultProjectionData
      );
      drawStarLayer(
        gl,
        shaders.stars,
        mediumBuffer,
        shaders.starAttrs,
        lod.medium,
        ALTITUDE.mediumStars,
        starOpacity,
        1,
        elapsed,
        pixelRatio,
        theme,
        args.defaultProjectionData
      );
      drawStarLayer(
        gl,
        shaders.stars,
        brightBuffer,
        shaders.starAttrs,
        lod.bright,
        ALTITUDE.brightStars,
        starOpacity * 1.05,
        1.15,
        elapsed,
        pixelRatio,
        theme,
        args.defaultProjectionData
      );
      drawStarLayer(
        gl,
        shaders.stars,
        dustBuffer,
        shaders.starAttrs,
        lod.dust,
        ALTITUDE.dust,
        fade.dust * intro * 0.35,
        0.7,
        elapsed,
        pixelRatio,
        theme,
        args.defaultProjectionData
      );

      if (!prefersReducedMotion() && fade.stars > 0.2) {
        const meteor = shootingStars.update(elapsed);
        if (meteor) {
          const t = meteor.progress;
          const x = meteor.startX + (meteor.endX - meteor.startX) * t;
          const y = meteor.startY + (meteor.endY - meteor.startY) * t;
          const px = meteor.startX + (meteor.endX - meteor.startX) * Math.max(0, t - 0.12);
          const py = meteor.startY + (meteor.endY - meteor.startY) * Math.max(0, t - 0.12);
          const segments = new Float32Array([px, py, 0, x, y, 1]);
          if (!meteorBuffer) meteorBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, meteorBuffer);
          gl.bufferData(gl.ARRAY_BUFFER, segments, gl.STREAM_DRAW);
          gl.useProgram(shaders.meteor);
          bindProjectionUniforms(gl, shaders.meteor, args.defaultProjectionData);
          gl.uniform1f(gl.getUniformLocation(shaders.meteor, "u_altitude"), ALTITUDE.shootingStars);
          gl.uniform1f(gl.getUniformLocation(shaders.meteor, "u_progress"), t);
          gl.uniform1f(gl.getUniformLocation(shaders.meteor, "u_opacity"), fade.stars * intro);
          gl.enableVertexAttribArray(shaders.meteorAttrs.pos);
          gl.vertexAttribPointer(shaders.meteorAttrs.pos, 2, gl.FLOAT, false, 12, 0);
          gl.enableVertexAttribArray(shaders.meteorAttrs.t);
          gl.vertexAttribPointer(shaders.meteorAttrs.t, 1, gl.FLOAT, false, 12, 8);
          gl.drawArrays(gl.LINES, 0, 2);
        }
      }

      restoreGlState(gl, glState);

      if (!prefersReducedMotion()) {
        requestMapRepaint(map, lastPaintMs, 28);
      }
    },
  };
}

export { SPACE_ENVIRONMENT_LAYER_ID };
