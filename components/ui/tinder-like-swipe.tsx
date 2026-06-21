"use client";

import * as React from "react";
import { Heart, X } from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "motion/react";

import { cn } from "@/lib/utils";

export type SwipeDirection = "left" | "right";

/** Card fly-off + removal timing (keep in sync with exit transition). */
export const SWIPE_CARD_ANIMATION_MS = 380;

const EXIT_X = 420;
const SWIPE_THRESHOLD = 88;
const DRAG_ROTATION_RANGE = 22;

export type SwipeableCardStackHandle = {
  swipeTop: (direction: SwipeDirection) => void;
};

export interface SwipeableCardStackProps {
  images?: string[];
  borderRadius?: number;
  showInnerShadows?: boolean;
  greenShadowColor?: string;
  redShadowColor?: string;
  innerStrokeColor?: string;
  shadowSize?: string;
  shadowBlur?: string;
  rightIcon?: React.ReactNode | null;
  leftIcon?: React.ReactNode | null;
  className?: string;
  disabled?: boolean;
  onSwipe?: (
    direction: SwipeDirection,
    image: string,
    index: number
  ) => void | boolean | Promise<void | boolean>;
  onStackEmpty?: () => void;
  renderOverlay?: (index: number, isTopCard: boolean) => React.ReactNode;
}

type TopSwipeCardProps = {
  image: string;
  index: number;
  borderRadius: number;
  showInnerShadows: boolean;
  greenShadowColor: string;
  redShadowColor: string;
  innerStrokeColor: string;
  shadowSize: string;
  shadowBlur: string;
  rightIcon: React.ReactNode | null;
  leftIcon: React.ReactNode | null;
  disabled: boolean;
  renderOverlay?: (index: number, isTopCard: boolean) => React.ReactNode;
  onCommitSwipe: (direction: SwipeDirection, index: number) => void;
  flyOffRef: React.MutableRefObject<((dir: SwipeDirection) => Promise<void>) | null>;
};

function TopSwipeCard({
  image,
  index,
  borderRadius,
  showInnerShadows,
  greenShadowColor,
  redShadowColor,
  innerStrokeColor,
  shadowSize,
  shadowBlur,
  rightIcon,
  leftIcon,
  disabled,
  renderOverlay,
  onCommitSwipe,
  flyOffRef,
}: TopSwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(
    x,
    [-180, 0, 180],
    [-DRAG_ROTATION_RANGE, 0, DRAG_ROTATION_RANGE]
  );
  const direction = useTransform(x, (latest) => {
    if (latest > 14) return "right" as const;
    if (latest < -14) return "left" as const;
    return null;
  });
  const [directionLabel, setDirectionLabel] = React.useState<SwipeDirection | null>(null);

  React.useEffect(() => {
    const unsubscribe = direction.on("change", (value) => {
      setDirectionLabel(value);
    });
    return unsubscribe;
  }, [direction]);

  const flyOff = React.useCallback(
    async (dir: SwipeDirection) => {
      await animate(x, dir === "right" ? EXIT_X : -EXIT_X, {
        duration: SWIPE_CARD_ANIMATION_MS / 1000,
        ease: [0.32, 0.72, 0, 1],
      });
      onCommitSwipe(dir, index);
      x.set(0);
    },
    [index, onCommitSwipe, x]
  );

  React.useEffect(() => {
    flyOffRef.current = flyOff;
    return () => {
      flyOffRef.current = null;
    };
  }, [flyOff, flyOffRef]);

  const handleDragEnd = React.useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      const offsetX = info.offset.x;
      const velocityX = info.velocity.x;

      if (
        Math.abs(offsetX) > SWIPE_THRESHOLD ||
        Math.abs(velocityX) > 600
      ) {
        const dir: SwipeDirection =
          offsetX + velocityX * 0.12 > 0 ? "right" : "left";
        void flyOff(dir);
        return;
      }

      animate(x, 0, {
        type: "spring",
        stiffness: 520,
        damping: 34,
        mass: 0.8,
      });
      setDirectionLabel(null);
    },
    [disabled, flyOff, x]
  );

  const defaultRightIcon = (
    <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[3px] border-green-500 bg-white/90 text-green-500 shadow-[0_8px_24px] shadow-green-500/35">
      <Heart className="h-9 w-9 fill-green-500 stroke-green-500" strokeWidth={2} />
    </span>
  );

  const defaultLeftIcon = (
    <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[3px] border-error bg-white/90 text-error shadow-[0_8px_24px] shadow-error/25">
      <X className="h-9 w-9 stroke-error" strokeWidth={3} />
    </span>
  );

  return (
    <motion.div
      drag={disabled ? false : "x"}
      dragConstraints={{ left: -EXIT_X, right: EXIT_X }}
      dragElastic={0.55}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 380, bounceDamping: 28 }}
      onDragEnd={handleDragEnd}
      style={{
        x,
        rotate,
        borderRadius,
        boxShadow: `inset 0 0 0 1px ${innerStrokeColor}, ${shadowSize} ${shadowBlur}`,
        zIndex: index + 1,
        transformOrigin: "50% 100%",
        willChange: "transform",
        touchAction: "none",
      }}
      className={cn(
        "absolute inset-0 overflow-hidden bg-surface-variant",
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      )}
    >
      <img
        src={image}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        draggable={false}
      />

      {renderOverlay?.(index, true)}

      {showInnerShadows ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 transition-[box-shadow] duration-200 ease-out"
            style={{
              borderRadius,
              boxShadow:
                directionLabel === "right"
                  ? `inset 0px -80px 60px ${greenShadowColor}`
                  : directionLabel === "left"
                    ? `inset 0px -80px 60px ${redShadowColor}`
                    : "none",
            }}
          />
          {directionLabel ? (
            <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
              {directionLabel === "right"
                ? (rightIcon ?? defaultRightIcon)
                : (leftIcon ?? defaultLeftIcon)}
            </div>
          ) : null}
        </>
      ) : null}
    </motion.div>
  );
}

export const SwipeableCardStack = React.forwardRef<
  SwipeableCardStackHandle,
  SwipeableCardStackProps
>(function SwipeableCardStack(
  {
    images = [],
    borderRadius = 16,
    showInnerShadows = true,
    greenShadowColor = "rgba(34, 197, 94, 0.72)",
    redShadowColor = "rgba(239, 68, 68, 0.72)",
    innerStrokeColor = "rgba(0, 0, 0, 0.1)",
    shadowSize = "0 8px 20px",
    shadowBlur = "rgba(0, 0, 0, 0.3)",
    rightIcon = null,
    leftIcon = null,
    className,
    disabled = false,
    onSwipe,
    onStackEmpty,
    renderOverlay,
  },
  ref
) {
  const [cards, setCards] = React.useState<string[]>([...images]);
  const cardsRef = React.useRef(cards);
  cardsRef.current = cards;
  const exitingRef = React.useRef(false);
  const topFlyOffRef = React.useRef<((dir: SwipeDirection) => Promise<void>) | null>(
    null
  );

  const imagesKey = images.join("\0");

  React.useEffect(() => {
    setCards([...images]);
    exitingRef.current = false;
  }, [imagesKey, images]);

  React.useEffect(() => {
    if (cards.length === 0 && images.length === 0) {
      onStackEmpty?.();
    }
  }, [cards.length, images.length, onStackEmpty]);

  const removeCard = React.useCallback(
    (index: number) => {
      setCards((current) => {
        const next = current.filter((_, i) => i !== index);
        if (next.length === 0) {
          onStackEmpty?.();
        }
        return next;
      });
      exitingRef.current = false;
    },
    [onStackEmpty]
  );

  const commitSwipe = React.useCallback(
    (direction: SwipeDirection, index: number) => {
      if (exitingRef.current) return;
      exitingRef.current = true;

      const image = cardsRef.current[index];
      if (!image) {
        exitingRef.current = false;
        return;
      }

      void Promise.resolve(onSwipe?.(direction, image, index)).then((shouldRemove) => {
        if (shouldRemove === false) {
          setCards([...images]);
          exitingRef.current = false;
          return;
        }
        removeCard(index);
      });
    },
    [images, onSwipe, removeCard]
  );

  const swipeTop = React.useCallback(
    (direction: SwipeDirection) => {
      if (disabled || cards.length === 0 || exitingRef.current) return;
      void topFlyOffRef.current?.(direction);
    },
    [cards.length, disabled]
  );

  React.useImperativeHandle(ref, () => ({ swipeTop }), [swipeTop]);

  if (cards.length === 0) {
    return (
      <div
        className={cn(
          "relative flex h-full min-h-0 w-full items-center justify-center rounded-2xl bg-surface-variant",
          className
        )}
      >
        <span className="text-sm text-on-surface-variant">No cards to show</span>
      </div>
    );
  }

  const topIndex = cards.length - 1;

  return (
    <div
      className={cn("relative h-full min-h-0 w-full touch-none", className)}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {cards.map((image, index) => {
          const isTopCard = index === topIndex;
          const depth = topIndex - index;

          if (isTopCard) {
            return (
              <TopSwipeCard
                key={`${image}-${index}`}
                image={image}
                index={index}
                borderRadius={borderRadius}
                showInnerShadows={showInnerShadows}
                greenShadowColor={greenShadowColor}
                redShadowColor={redShadowColor}
                innerStrokeColor={innerStrokeColor}
                shadowSize={shadowSize}
                shadowBlur={shadowBlur}
                rightIcon={rightIcon}
                leftIcon={leftIcon}
                disabled={disabled || exitingRef.current}
                renderOverlay={renderOverlay}
                onCommitSwipe={commitSwipe}
                flyOffRef={topFlyOffRef}
              />
            );
          }

          return (
            <motion.div
              key={`${image}-${index}`}
              initial={false}
              animate={{
                scale: 1 - depth * 0.05,
                y: -depth * 14,
                opacity: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 32,
                mass: 0.85,
              }}
              className="pointer-events-none absolute inset-0 overflow-hidden bg-surface-variant"
              style={{
                borderRadius,
                boxShadow: `inset 0 0 0 1px ${innerStrokeColor}, ${shadowSize} ${shadowBlur}`,
                zIndex: index + 1,
                transformOrigin: "50% 100%",
                willChange: "transform",
              }}
            >
              <img
                src={image}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                draggable={false}
              />
              {renderOverlay?.(index, false)}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

SwipeableCardStack.displayName = "SwipeableCardStack";
