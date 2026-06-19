"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimationMode = "auto-rotate" | "rotate-on-hover" | "stop-rotate-on-hover" | "static";

interface BorderRotateProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  children: ReactNode;
  className?: string;
  animationMode?: AnimationMode;
  animationSpeed?: number;
  gradientColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  borderWidth?: number;
  borderRadius?: number;
  style?: CSSProperties;
}

const defaultGradientColors = {
  primary: "#8a2445",
  secondary: "#e84a7a",
  accent: "#d4a574",
};

export const BorderRotate = ({
  children,
  className = "",
  animationMode = "auto-rotate",
  animationSpeed = 6,
  gradientColors = defaultGradientColors,
  borderWidth = 2,
  borderRadius = 32,
  style = {},
  ...props
}: BorderRotateProps) => {
  const getAnimationClass = () => {
    switch (animationMode) {
      case "auto-rotate":
        return "gradient-border-auto";
      case "rotate-on-hover":
        return "gradient-border-hover";
      case "stop-rotate-on-hover":
        return "gradient-border-stop-hover";
      default:
        return "";
    }
  };

  const innerRadius = Math.max(borderRadius - borderWidth, 0);

  return (
    <div
      className={cn("relative", className)}
      style={{
        borderRadius: `${borderRadius}px`,
        padding: `${borderWidth}px`,
        ...style,
      }}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ borderRadius: `${borderRadius}px` }}
        aria-hidden
      >
        <div
          className={cn(
            "absolute left-1/2 top-1/2 aspect-square w-[calc(100%*1.414)] max-w-none -translate-x-1/2 -translate-y-1/2",
            getAnimationClass()
          )}
          style={
            {
              "--animation-duration": `${animationSpeed}s`,
              background: `conic-gradient(
                from var(--gradient-angle, 0deg),
                ${gradientColors.primary} 0%,
                ${gradientColors.secondary} 25%,
                ${gradientColors.accent} 50%,
                ${gradientColors.secondary} 75%,
                ${gradientColors.primary} 100%
              )`,
            } as CSSProperties
          }
        />
      </div>

      <div
        className="relative overflow-hidden"
        style={{ borderRadius: `${innerRadius}px` }}
      >
        {children}
      </div>
    </div>
  );
};
