"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "@/components/ui/mapcn-map";
import { useMapLayersStore } from "@/lib/mapLayers/store";

export default function MapDebugHud() {
  const { map, isLoaded } = useMap();
  const showFps = useMapLayersStore((s) => s.enabled["dev-fps"] === true);
  const showCamera = useMapLayersStore((s) => s.enabled["dev-camera-info"] === true);
  const [fps, setFps] = useState(0);
  const [camera, setCamera] = useState({ lng: 0, lat: 0, zoom: 0, pitch: 0, bearing: 0 });
  const frameRef = useRef({ frames: 0, last: 0 });

  useEffect(() => {
    if (!map || !isLoaded || (!showFps && !showCamera)) return;

    let raf = 0;
    frameRef.current.last = performance.now();

    const tick = () => {
      const now = performance.now();
      frameRef.current.frames += 1;
      if (now - frameRef.current.last >= 500) {
        setFps(Math.round((frameRef.current.frames * 1000) / (now - frameRef.current.last)));
        frameRef.current.frames = 0;
        frameRef.current.last = now;
      }

      if (showCamera) {
        const center = map.getCenter();
        setCamera({
          lng: center.lng,
          lat: center.lat,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [map, isLoaded, showFps, showCamera]);

  if (!showFps && !showCamera) return null;

  return (
    <div className="map-debug-hud pointer-events-none absolute bottom-4 left-4 z-30 font-mono text-[11px] leading-relaxed">
      {showFps ? <div>FPS {fps}</div> : null}
      {showCamera ? (
        <div>
          {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)} · z{camera.zoom.toFixed(2)} · p
          {camera.pitch.toFixed(0)}° · b{camera.bearing.toFixed(0)}°
        </div>
      ) : null}
    </div>
  );
}
