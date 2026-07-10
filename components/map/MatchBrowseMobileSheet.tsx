"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  type PanInfo,
} from "motion/react";

export type MatchBrowseSheetSnap = "map" | "list";

/** Peek height above the bottom nav so the sheet handle stays tappable. */
const PEEK_HEIGHT = 112;
const BOTTOM_NAV_CLEARANCE = 72;

interface MatchBrowseMobileSheetProps {
  snap: MatchBrowseSheetSnap;
  onSnapChange: (snap: MatchBrowseSheetSnap) => void;
  matchCount: number;
  hidden?: boolean;
  children: ReactNode;
}

export default function MatchBrowseMobileSheet({
  snap,
  onSnapChange,
  matchCount,
  hidden = false,
  children,
}: MatchBrowseMobileSheetProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const [sheetHeight, setSheetHeight] = useState(420);
  const y = useMotionValue(0);

  const collapsedY = Math.max(0, sheetHeight - PEEK_HEIGHT);

  useLayoutEffect(() => {
    const parent = measureRef.current?.parentElement;
    if (!parent) return;

    const measure = () => {
      const parentH = parent.getBoundingClientRect().height;
      const navClear = BOTTOM_NAV_CLEARANCE + (window.visualViewport?.offsetTop ?? 0);
      // Leave room for bottom nav; use most of remaining stage height when expanded.
      const available = Math.max(280, parentH - navClear * 0.15);
      const next = Math.round(Math.min(available * 0.9, parentH - 48));
      setSheetHeight(Math.max(300, next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const target = snap === "map" ? collapsedY : 0;
    const controls = animate(y, target, {
      type: "spring",
      damping: 32,
      stiffness: 380,
      mass: 0.85,
    });
    return () => controls.stop();
  }, [snap, collapsedY, y]);

  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, [snap, sheetHeight]);

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const current = y.get();
      const mid = collapsedY * 0.42;

      if (info.velocity.y > 400 || current > mid) {
        onSnapChange("map");
        return;
      }
      if (info.velocity.y < -400 || current < mid) {
        onSnapChange("list");
        return;
      }
      onSnapChange(current > mid ? "map" : "list");
    },
    [collapsedY, onSnapChange, y]
  );

  if (hidden) return null;

  return (
    <div
      ref={measureRef}
      className="map-browse-sheet-root pointer-events-none absolute inset-0 z-[35] md:hidden"
      aria-hidden={hidden}
    >
      <motion.div
        className="ios-sheet map-browse-sheet pointer-events-auto absolute inset-x-0 flex flex-col overflow-hidden rounded-t-[20px]"
        style={{ height: sheetHeight, y }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: collapsedY }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex shrink-0 touch-none flex-col"
          aria-label="Drag to show map or list"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <div className="flex justify-center pb-2 pt-2.5">
            <div className="ios-sheet__handle" />
          </div>

          <div className="px-4 pb-2">
            <p className="text-center text-[13px] font-medium text-on-surface-variant">
              {matchCount} {matchCount === 1 ? "friend" : "friends"} nearby
            </p>
          </div>

          <div className="ios-segmented mx-4 mb-3">
            <button
              type="button"
              data-active={snap === "map"}
              onClick={() => onSnapChange("map")}
              className="ios-segmented-btn"
            >
              Map
            </button>
            <button
              type="button"
              data-active={snap === "list"}
              onClick={() => onSnapChange("list")}
              className="ios-segmented-btn"
            >
              List
            </button>
          </div>
        </div>

        <div className="map-browse-sheet__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 hide-scrollbar sm:px-4">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
