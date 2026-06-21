"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HomePageSkeleton } from "@/components/skeletons/HomePageSkeleton";

export function HomePageShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <HomePageSkeleton />;
  }

  return children;
}
