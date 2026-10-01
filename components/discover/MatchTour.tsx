"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type TourStep = {
  target: string;
  icon: string;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    target: "card",
    icon: "swipe",
    title: "Discover people",
    body: "This is a profile card. Swipe right to like or swipe left to skip. Tap the photo to see more pictures.",
  },
  {
    target: "skip",
    icon: "close",
    title: "Skip",
    body: "Not interested? Tap the cross to pass on this profile and see the next one.",
  },
  {
    target: "like",
    icon: "favorite",
    title: "Like",
    body: "Tap the heart to like someone. If they like you back, it's a match and you can start chatting.",
  },
  {
    target: "rewind",
    icon: "replay",
    title: "Rewind",
    body: "Skipped someone by mistake? Rewind brings back your last swipe. This is a premium feature.",
  },
  {
    target: "profile",
    icon: "expand_less",
    title: "View profile",
    body: "Tap this arrow to open the full profile with bio, interests and more details.",
  },
  {
    target: "filters",
    icon: "tune",
    title: "Filters",
    body: "Set age, distance, religion and other preferences to choose who appears in your deck.",
  },
  {
    target: "menu",
    icon: "menu",
    title: "Menu",
    body: "Open the menu for your profile, settings and more.",
  },
  {
    target: "nav-home",
    icon: "home",
    title: "Home",
    body: "Go back to the Duo home page.",
  },
  {
    target: "nav-match",
    icon: "favorite",
    title: "Match",
    body: "This page. Swipe through profiles picked for you.",
  },
  {
    target: "nav-discover",
    icon: "group",
    title: "Discover",
    body: "Browse more people and your matches.",
  },
  {
    target: "nav-chat",
    icon: "chat_bubble",
    title: "Chat",
    body: "Talk with your matches. A badge shows unread messages.",
  },
  {
    target: "nav-map",
    icon: "map",
    title: "Map",
    body: "See people near you on a map.",
  },
  {
    target: "nav-profile",
    icon: "person",
    title: "Profile",
    body: "Edit your photos, bio and details so others know you better.",
  },
  {
    target: "nav-theme",
    icon: "dark_mode",
    title: "Theme",
    body: "Switch between light and dark mode.",
  },
  {
    target: "nav-settings",
    icon: "settings",
    title: "Settings",
    body: "Manage your account, privacy and notifications.",
  },
];

const PADDING = 8;

function findVisibleTarget(name: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const node of Array.from(nodes)) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

const START_EVENT = "duo:start-match-tour";

const HELP_POS_KEY = "duo-match-help-pos";
const HELP_SIZE = 24;

function clampPos(x: number, y: number) {
  return {
    x: Math.min(Math.max(4, x), window.innerWidth - HELP_SIZE - 4),
    y: Math.min(Math.max(4, y), window.innerHeight - HELP_SIZE - 4),
  };
}

/**
 * Tiny "?" (desktop only) that replays the match page guide.
 * Starts in the top-right corner; drag it anywhere, and the spot is remembered.
 */
export function MatchHelpButton({ className = "" }: { className?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ dx: number; dy: number; startX: number; startY: number; moved: boolean } | null>(null);

  // Restore the saved spot, and keep it on screen when the window resizes.
  useEffect(() => {
    const restore = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(HELP_POS_KEY) || "null");
        if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
          setPos(clampPos(saved.x, saved.y));
        }
      } catch {
        /* no saved spot: stay in the corner */
      }
    };
    restore();
    window.addEventListener("resize", restore);
    return () => window.removeEventListener("resize", restore);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, startX: e.clientX, startY: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 4) return;
    d.moved = true;
    setDragging(true);
    setPos(clampPos(e.clientX - d.dx, e.clientY - d.dy));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d) return;
    if (!d.moved) {
      window.dispatchEvent(new Event(START_EVENT));
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    try {
      localStorage.setItem(HELP_POS_KEY, JSON.stringify({ x: r.left, y: r.top }));
    } catch {
      /* storage unavailable: position lasts for this visit only */
    }
  };

  return (
    <button
      type="button"
      aria-label="Show help guide (drag to move)"
      title="Help · drag to move"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragRef.current = null;
        setDragging(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.dispatchEvent(new Event(START_EVENT));
        }
      }}
      style={pos ? { left: pos.x, top: pos.y, right: "auto" } : undefined}
      className={`fixed right-3 top-3 z-40 hidden h-6 w-6 touch-none select-none items-center justify-center rounded-full text-on-surface-variant opacity-70 hover:bg-surface-container-low hover:text-primary hover:opacity-100 md:flex ${
        dragging ? "cursor-grabbing bg-surface-container-low opacity-100 shadow-lg" : "cursor-grab transition-colors"
      } ${className}`}
    >
      <span className="material-symbols-outlined pointer-events-none text-[16px]">help</span>
    </button>
  );
}

/** First-visit guide for the match page. Shown once per user per browser. */
export function MatchTour({ userId }: { userId: string }) {
  const storageKey = `duo-match-tour-done:${userId}`;
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Start after the page has rendered its controls; skip steps whose control is absent.
  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey)) return;
    } catch {
      return;
    }
    // Start as soon as the main controls are on screen (checked every 100ms, up to 6s).
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      const ready = findVisibleTarget("skip") || findVisibleTarget("filters");
      if (!ready && tries < 60) return;
      clearInterval(timer);
      const available = STEPS.filter((s) => findVisibleTarget(s.target));
      if (available.length > 0) setSteps(available);
    }, 100);
    return () => clearInterval(timer);
  }, [storageKey]);

  // The help button restarts the tour at any time.
  useEffect(() => {
    const start = () => {
      const available = STEPS.filter((s) => findVisibleTarget(s.target));
      if (available.length === 0) return;
      setIndex(0);
      setSteps(available);
    };
    window.addEventListener(START_EVENT, start);
    return () => window.removeEventListener(START_EVENT, start);
  }, []);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step) return;
    const el = findVisibleTarget(step.target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // Play the highlighted control's own animation (sidebar icons) while its step is shown.
  useEffect(() => {
    if (!step) return;
    const el = findVisibleTarget(step.target);
    el?.setAttribute("data-tour-active", "");
    return () => el?.removeAttribute("data-tour-active");
  }, [step]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* storage unavailable: tour may show again next visit */
    }
    setSteps([]);
  }, [storageKey]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, finish]);

  if (!step || typeof document === "undefined") return null;

  const next = () => (index + 1 < steps.length ? setIndex(index + 1) : finish());
  const back = () => setIndex(Math.max(0, index - 1));

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tooltipWidth = Math.min(320, vw - 32);

  // Below the target if there is room, else above; large targets (the card) get it over their lower part.
  let tooltipStyle: CSSProperties = { left: (vw - tooltipWidth) / 2, top: vh / 2 - 90 };
  if (rect) {
    const left = Math.min(
      Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2),
      vw - tooltipWidth - 16
    );
    const top = Math.min(Math.max(16, rect.top + rect.height / 2 - 100), vh - 216);
    if (rect.right < 120 && vw - rect.right > tooltipWidth + 40) {
      // Sidebar icon: sit to its right.
      tooltipStyle = { left: rect.right + PADDING + 12, top };
    } else if (rect.height > vh * 0.5 && vw - rect.right > tooltipWidth + 40) {
      // Tall target (the card) on a wide screen: sit to its right.
      tooltipStyle = { left: rect.right + PADDING + 20, top };
    } else if (rect.height > vh * 0.5 && rect.left > tooltipWidth + 40) {
      tooltipStyle = { left: rect.left - PADDING - 20 - tooltipWidth, top };
    } else if (vh - rect.bottom > 200) {
      tooltipStyle = { left, top: rect.bottom + PADDING + 12 };
    } else if (rect.top > 200) {
      tooltipStyle = { left, bottom: vh - rect.top + PADDING + 12 };
    } else {
      tooltipStyle = { left, bottom: Math.max(16, vh - rect.bottom + 24) };
    }
  }

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 2147483646, isolation: "isolate", transform: "translateZ(0)" }} role="dialog" aria-modal="true" aria-label="Match page guide">
      {/* Blocks clicks on the page underneath during the tour. */}
      <div className="absolute inset-0" />

      {rect ? (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-white/80 transition-all duration-150 ease-out"
          style={{
            left: rect.left - PADDING,
            top: rect.top - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      <div
        className="absolute rounded-2xl bg-background p-4 text-on-surface shadow-2xl transition-all duration-150 ease-out"
        style={{ ...tooltipStyle, width: tooltipWidth }}
      >
        <style>{`@keyframes duoTourIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
        <div key={index} style={{ animation: "duoTourIn 160ms ease-out" }}>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-brand text-white">
            <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
          </span>
          <p className="flex-1 font-semibold">{step.title}</p>
          <span className="text-xs text-on-surface-variant">
            {index + 1}/{steps.length}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-on-surface-variant">{step.body}</p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-xs font-medium text-on-surface-variant hover:text-on-surface"
          >
            Skip tour
          </button>
          <div className="flex-1" />
          {index > 0 ? (
            <button
              type="button"
              onClick={back}
              className="rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={next}
            className="rounded-full gradient-brand px-4 py-1.5 text-xs font-semibold text-white"
          >
            {index + 1 < steps.length ? "Next" : "Got it"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
