"use client";

import { useEffect, useRef } from "react";

/**
 * Best-effort desktop screenshot detection for the web.
 *
 * Browsers expose no real screenshot API, so this watches the common OS
 * shortcuts that reach the page:
 * - Windows: PrintScreen (alone, Alt, or Win), Win+Shift+S (Snipping Tool)
 * - macOS: Cmd+Shift+3 / 4 / 5
 * - Snipping Tool opening often blurs the window right after Meta+Shift.
 *
 * Captures taken with a mouse-only tool or another device can't be seen.
 */
export function useScreenshotDetection(
  enabled: boolean,
  onScreenshot: () => void,
  cooldownMs = 4000
) {
  const callbackRef = useRef(onScreenshot);
  callbackRef.current = onScreenshot;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let lastFired = 0;
    let snipArmedAt = 0;

    const fire = () => {
      const now = Date.now();
      if (now - lastFired < cooldownMs) return;
      lastFired = now;
      callbackRef.current();
    };

    const isPrintScreen = (e: KeyboardEvent) =>
      e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isPrintScreen(e)) {
        fire();
        return;
      }
      const key = e.key.toLowerCase();
      // macOS: Cmd+Shift+3/4/5
      if (e.metaKey && e.shiftKey && ["3", "4", "5", "#", "$", "%"].includes(key)) {
        fire();
        return;
      }
      // Windows Snipping Tool: Win+Shift+S
      if (e.metaKey && e.shiftKey && key === "s") {
        fire();
        return;
      }
      if ((e.key === "Meta" || e.key === "OS") && e.shiftKey) snipArmedAt = Date.now();
      if (e.key === "Shift" && e.metaKey) snipArmedAt = Date.now();
    };

    // Chrome on Windows usually only delivers keyup for PrintScreen.
    const onKeyUp = (e: KeyboardEvent) => {
      if (isPrintScreen(e)) fire();
    };

    // Win+Shift+S opens the snipping overlay, which steals focus.
    const onBlur = () => {
      if (snipArmedAt && Date.now() - snipArmedAt < 1500) {
        snipArmedAt = 0;
        fire();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, cooldownMs]);
}
