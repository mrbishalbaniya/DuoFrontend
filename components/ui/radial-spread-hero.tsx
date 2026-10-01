"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type RadialSpreadImage = { src: string; alt: string };

type RadialCard = {
  item: RadialSpreadImage;
  linearOffset: { x: number; y: number };
  linearRotate: number;
  target: { x: number; y: number; rotate: number; scale: number; w: number; h: number };
  targetSm: { x: number; y: number; rotate: number; scale: number; w: number; h: number };
  z: number;
};

// Dynamically generate a perfect radial layout with both Desktop and Mobile coordinates
const generateRadialCards = (images: RadialSpreadImage[]): RadialCard[] => {
  const radiusX = 35; // vw for desktop
  const radiusY = 32; // vh for desktop
  const total = images.length;

  return images.map((item, i) => {
    const angle = (i * (Math.PI * 2)) / total;
    // Offset by -90 degrees so the first card is at 12 o'clock
    const x = Math.cos(angle - Math.PI / 2) * radiusX;
    const y = Math.sin(angle - Math.PI / 2) * radiusY;
    const rotate = (angle * 180) / Math.PI;

    return {
      item,
      // Initial stacked offset (slight stagger)
      linearOffset: { x: (i - total / 2) * 5, y: (i - total / 2) * 2 },
      linearRotate: (i - total / 2) * 2,
      // Desktop positioning & sizing
      target: { x, y, rotate, scale: 0.85, w: 15, h: 22 },
      // Mobile positioning & sizing (tighter X, wider Y, larger cards)
      targetSm: {
        x: x * 0.6,
        y: y * 1.2,
        rotate,
        scale: 0.85,
        w: 35,
        h: 28,
      },
      z: i + 1,
    };
  });
};

// Ultra-smooth physics tuning
const SPRING_CONFIG = { stiffness: 60, damping: 20, mass: 0.5 };
const PROGRESS_SPRING = { stiffness: 80, damping: 25, restDelta: 0.001 };

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled || !active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (e: PointerEvent) => {
      rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

function Card({
  card,
  progress,
  pointer,
  index,
  total,
  isSpreadActive,
  isMobile,
}: {
  card: RadialCard;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  index: number;
  total: number;
  isSpreadActive: boolean;
  isMobile: boolean;
}) {
  const { item, linearOffset, linearRotate } = card;

  // Pick target based on screen size
  const activeTarget = isMobile ? card.targetSm : card.target;
  const depthFactor = 0.4 + (index / total) * 0.6; // Creates parallax depth tiers

  const translate = useTransform(
    [progress, pointer.x, pointer.y],
    ([p, px, py]: number[]) => {
      // Custom cubic ease for snappier deployment
      const easeP = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const tx = linearOffset.x + (activeTarget.x - linearOffset.x) * easeP;
      const ty = linearOffset.y + (activeTarget.y - linearOffset.y) * easeP;

      const dx = tx - px * 3 * depthFactor * p;
      const dy = ty - py * 3 * depthFactor * p;
      return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
    }
  );

  const rotate = useTransform(progress, [0, 1], [linearRotate, activeTarget.rotate]);
  const scale = useTransform(progress, [0, 1], [0.7, activeTarget.scale]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform cursor-pointer"
      style={{
        width: `${activeTarget.w}vw`,
        height: `${activeTarget.h}vh`,
        zIndex: card.z,
        translate,
        rotate,
        scale,
      }}
      whileHover={
        isSpreadActive
          ? { scale: activeTarget.scale * 1.1, zIndex: 100, transition: SPRING_CONFIG }
          : undefined
      }
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-2xl transition-all duration-500"
        style={{ boxShadow: "0 18px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)" }}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-black/5 opacity-60" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-110"
        />
      </div>
    </motion.div>
  );
}

export type RadialSpreadHeroProps = {
  images: RadialSpreadImage[];
  title?: ReactNode;
  description?: ReactNode;
};

/**
 * Radial spread: a stack of cards fans out into an orbit as you scroll, with
 * the title fading in at the centre. Colours use the app theme (light / dark);
 * section height is inline so a stale cached stylesheet can't collapse it.
 */
export default function RadialSpreadHero({
  images,
  title = "Perfect Symmetry.",
  description = "Scroll down to watch the rigid stack expand into a calculated orbit.",
}: RadialSpreadHeroProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const cards = useMemo(() => generateRadialCards(images), [images]);

  // Handle responsive layout detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Check immediately on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, PROGRESS_SPRING);

  // Compress the animation into the middle 60% of the scroll
  const progress = useTransform(smoothProgress, [0.1, 0.9], [0, 1]);

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => setSpread(p > 0.95));

  const pointer = usePointerParallax(spread, !reduce);

  // Text animations start hidden/scaled down and fade IN as the user scrolls
  const textScale = useTransform(progress, [0, 1], [0.85, 1]);
  const textOpacity = useTransform(progress, [0.2, 0.8], [0, 1]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full bg-surface text-on-surface transition-colors duration-500"
      style={{ height: "350vh" }}
    >
      <div
        className="sticky top-0 flex w-full items-center justify-center overflow-hidden"
        style={{ height: "100svh" }}
      >
        {/* Ambient backlight in the brand colour */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ scale: textScale, opacity: 0.45, filter: "blur(110px)" }}
        >
          <div
            className="rounded-full"
            style={{
              width: "min(60vw, 40rem)",
              height: "min(60vw, 40rem)",
              background: "color-mix(in srgb, var(--color-primary) 35%, transparent)",
            }}
          />
        </motion.div>

        {/* Central Typography */}
        <motion.div
          className="pointer-events-none z-[5] flex flex-col items-center px-6 text-center"
          style={{ opacity: textOpacity, scale: textScale }}
        >
          <h2
            className="font-[var(--font-headline)] font-extrabold tracking-tighter"
            style={{ fontSize: "clamp(2.25rem, 6vw, 6rem)", lineHeight: 1.02 }}
          >
            {title}
          </h2>
          <p
            className="mt-4 text-on-surface-variant"
            style={{ maxWidth: "50ch", fontSize: "clamp(0.9rem, 1.2vw, 1.15rem)" }}
          >
            {description}
          </p>
        </motion.div>

        {/* Cards rendering */}
        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card
              key={i}
              card={card}
              progress={progress}
              pointer={pointer}
              index={i}
              total={cards.length}
              isSpreadActive={spread}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
