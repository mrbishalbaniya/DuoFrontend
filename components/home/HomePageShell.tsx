"use client";

import { type ReactNode } from "react";
import { HomePageSkeleton } from "@/components/skeletons/HomePageSkeleton";
import { useIsClient } from "@/lib/useIsClient";

export function HomePageShell({ children }: { children: ReactNode }) {
  const ready = useIsClient();

  if (!ready) {
    return <HomePageSkeleton />;
  }

  return children;
}
