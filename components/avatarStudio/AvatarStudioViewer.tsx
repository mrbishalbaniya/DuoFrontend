"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import {
  assembleModularAvatar,
  applyModularAnimation,
  disposeModularRig,
  type ModularAvatarRig,
} from "@/lib/avatarStudio/modularAssembler";
import type { AvatarConfig, AvatarPreviewAnimation, AvatarStudioBackground } from "@/lib/avatarStudio/types";

type AvatarStudioViewerProps = {
  config: AvatarConfig;
  animation: AvatarPreviewAnimation;
  background: AvatarStudioBackground;
  autoRotate: boolean;
  cameraMode: "full" | "head" | "portrait";
};

const BG: Record<AvatarStudioBackground, string> = {
  transparent: "#00000000",
  studio: "#1a1c20",
  gradient: "#12141a",
  dark: "#0a0a0c",
  light: "#e8eaef",
  space: "#02040a",
  globe: "#071018",
};

export default function AvatarStudioViewer({
  config,
  animation,
  background,
  autoRotate,
  cameraMode,
}: AvatarStudioViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  const animRef = useRef(animation);
  const autoRef = useRef(autoRotate);
  const modeRef = useRef(cameraMode);
  const bgRef = useRef(background);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    configRef.current = config;
    animRef.current = animation;
    autoRef.current = autoRotate;
    modeRef.current = cameraMode;
    bgRef.current = background;
  }, [config, animation, autoRotate, cameraMode, background]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    let rig: ModularAvatarRig | null = null;
    let configKey = "";

    const markReady = () => {
      queueMicrotask(() => {
        if (!disposed) setReady(true);
      });
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 1.05, 2.85);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x2a3038, 0.65);
    const key = new THREE.DirectionalLight(0xfff1e0, 1.65);
    key.position.set(2.6, 4.8, 2.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0001;
    const fill = new THREE.DirectionalLight(0xb8c8ff, 0.6);
    fill.position.set(-3.4, 2.4, -1.0);
    const rim = new THREE.DirectionalLight(0xffffff, 0.55);
    rim.position.set(0, 2.8, -3.8);
    const bounce = new THREE.DirectionalLight(0xffe4ef, 0.25);
    bounce.position.set(0, -1, 2);
    scene.add(hemi, key, fill, rim, bounce);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(2.2, 64),
      new THREE.MeshStandardMaterial({
        color: "#1c1e22",
        roughness: 0.35,
        metalness: 0.15,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Soft reflection disc
    const mirror = new THREE.Mesh(
      new THREE.CircleGeometry(1.1, 48),
      new THREE.MeshStandardMaterial({
        color: "#2a2d33",
        roughness: 0.15,
        metalness: 0.55,
        transparent: true,
        opacity: 0.55,
      })
    );
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = 0.002;
    scene.add(mirror);

    let dragging = false;
    let lastX = 0;
    let yaw = 0.35;
    let pitch = 0.06;
    let distance = 3.2;
    let targetY = 1.0;
    let lastMode: "full" | "head" | "portrait" | null = null;
    let lastBg: AvatarStudioBackground | null = null;
    const bgColor = new THREE.Color();

    const applyCameraMode = () => {
      const mode = modeRef.current;
      if (mode === lastMode) return;
      lastMode = mode;
      if (mode === "head") {
        distance = 1.25;
        targetY = 1.55;
      } else if (mode === "portrait") {
        distance = 2.0;
        targetY = 1.25;
      } else {
        distance = 3.2;
        targetY = 1.0;
      }
    };
    applyCameraMode();

    const applyBackground = () => {
      const id = bgRef.current;
      if (id === lastBg) return;
      lastBg = id;
      const hex = BG[id] ?? BG.studio;
      if (id === "transparent") {
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
      } else {
        bgColor.set(id === "gradient" ? "#1a1030" : hex);
        scene.background = bgColor;
        renderer.setClearColor(bgColor, 1);
      }
      floor.visible = id !== "transparent" && id !== "space";
      mirror.visible = floor.visible;
    };

    const rebuild = (cfg: AvatarConfig) => {
      if (rig) {
        scene.remove(rig.root);
        disposeModularRig(rig);
      }
      rig = assembleModularAvatar(cfg);
      scene.add(rig.root);
      configKey = JSON.stringify(cfg);
      markReady();
    };

    if (configRef.current.gender) {
      rebuild(configRef.current);
    } else {
      markReady();
    }

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      mount.setPointerCapture(e.pointerId);
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      try {
        mount.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      yaw += (e.clientX - lastX) * 0.01;
      lastX = e.clientX;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.min(5.8, Math.max(1.05, distance + e.deltaY * 0.002));
    };

    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const start = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const cfg = configRef.current;
      if (cfg.gender) {
        const nextKey = JSON.stringify(cfg);
        if (nextKey !== configKey) rebuild(cfg);
      } else if (rig) {
        scene.remove(rig.root);
        disposeModularRig(rig);
        rig = null;
        configKey = "";
      }

      applyCameraMode();
      if (autoRef.current && !dragging) yaw += 0.004;

      const t = (performance.now() - start) / 1000;
      if (rig) applyModularAnimation(rig, animRef.current, t);

      camera.position.x = Math.sin(yaw) * Math.cos(pitch) * distance;
      camera.position.z = Math.cos(yaw) * Math.cos(pitch) * distance;
      camera.position.y = targetY + Math.sin(pitch) * distance * 0.3;
      camera.lookAt(0, targetY, 0);

      applyBackground();
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("wheel", onWheel);
      if (rig) {
        scene.remove(rig.root);
        disposeModularRig(rig);
      }
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
      void disposed;
    };
  }, []);

  return (
    <div className="avatar-studio-viewer-wrap">
      <div ref={mountRef} className="avatar-studio-viewer" />
      {!config.gender && (
        <div className="avatar-studio-viewer__badge">Choose Male or Female to begin</div>
      )}
      {config.gender && !ready && (
        <div className="avatar-studio-viewer__badge">Building character…</div>
      )}
    </div>
  );
}
