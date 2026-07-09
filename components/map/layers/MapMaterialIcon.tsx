"use client";

interface MapMaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
}

export function MapMaterialIcon({ name, className = "", filled }: MapMaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-hidden
    >
      {name}
    </span>
  );
}
