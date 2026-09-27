"use client";

import { useEffect, type RefObject } from "react";

/** Element the iOS sheets line up with (the swipe card area on /match). */
export const SHEET_ANCHOR_ID = "match-card-area";

/**
 * Shifts a centered `.dfs-root` sheet horizontally so it sits over the swipe
 * card instead of the viewport center (they differ by the sidebar width).
 * Writes `--dfs-shift`, which discovery-filters.css applies from 768px up.
 * Without an anchor on the page the sheet stays centered.
 */
export function useSheetAnchor(open: boolean, rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;

    const update = () => {
      const anchor = document.getElementById(SHEET_ANCHOR_ID);
      if (!anchor) {
        root.style.removeProperty("--dfs-shift");
        return;
      }
      const rect = anchor.getBoundingClientRect();
      const shift = rect.left + rect.width / 2 - window.innerWidth / 2;
      root.style.setProperty("--dfs-shift", `${Math.round(shift)}px`);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, rootRef]);
}
