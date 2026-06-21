"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLenis } from "lenis/react";

export function MatchLayoutShell({ children }: { children: ReactNode }) {
  const lenis = useLenis();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    lenis?.stop();

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      lenis?.start();
    };
  }, [lenis]);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden overscroll-none bg-surface">
      {children}
    </div>
  );
}
