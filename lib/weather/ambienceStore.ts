"use client";

import {
  DEFAULT_AMBIENCE,
  lerpAmbience,
  type WeatherAmbience,
} from "./conditions";

type Listener = () => void;

let current = { ...DEFAULT_AMBIENCE };
let target = { ...DEFAULT_AMBIENCE };
let lastTick = performance.now();
const listeners = new Set<Listener>();

const LERP_SPEED = 1.8;

export function getWeatherAmbience(): WeatherAmbience {
  return current;
}

export function setWeatherAmbienceTarget(next: WeatherAmbience) {
  target = next;
}

export function resetWeatherAmbience() {
  current = { ...DEFAULT_AMBIENCE };
  target = { ...DEFAULT_AMBIENCE };
}

export function tickWeatherAmbience(now = performance.now()): WeatherAmbience {
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;
  const t = Math.min(1, dt * LERP_SPEED);
  current = lerpAmbience(current, target, t);
  if (t > 0) notify();
  return current;
}

export function subscribeWeatherAmbience(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const l of listeners) l();
}
