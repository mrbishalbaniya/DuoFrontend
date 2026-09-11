"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import BottomNav from "@/components/BottomNav";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import Loader from "@/components/ui/loader";

export function SecurityPageShell({
  title,
  backHref = "/security",
  children,
}: {
  title: string;
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-8">
        <header className="flex shrink-0 items-center gap-3 border-b border-primary/10 px-4 py-3 md:px-6">
          <Link
            href={backHref}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <h1 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{title}</h1>
        </header>
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-6 sm:px-6 md:px-8 md:py-10"
          data-lenis-prevent
        >
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export function SecuritySpinner({ pageName }: { pageName?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader pageName={pageName} />
    </div>
  );
}

export function SecurityNotice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: ReactNode;
}) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400"
          : "rounded-xl border border-primary/15 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
      }
    >
      {children}
    </div>
  );
}
