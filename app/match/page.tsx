"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { DiscoverExperience } from "@/components/discover/DiscoverExperience";

export default function MatchPage() {
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
    <div
      className="flex h-[100dvh] min-h-0 overflow-hidden overscroll-none bg-surface"
      data-lenis-prevent
    >
      <ChatSidebarNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DiscoverExperience />
      </div>
      <BottomNav />
    </div>
  );
}
