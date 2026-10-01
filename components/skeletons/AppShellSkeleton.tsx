import type { ReactNode } from "react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";

/**
 * Page frame used by every app skeleton: the real left navigation rail
 * (desktop) and bottom tab bar (mobile) stay put while the content loads, so
 * nothing jumps when the page arrives.
 */
export function AppShellSkeleton({
  label,
  children,
  bottomNav = true,
  offsetContent = true,
}: {
  label: string;
  children: ReactNode;
  bottomNav?: boolean;
  /** Pad for the mobile tab bar (off when the child already does, like /match). */
  offsetContent?: boolean;
}) {
  return (
    <div
      className="flex h-[100dvh] min-h-0 overflow-hidden bg-surface"
      role="status"
      aria-busy="true"
      aria-label={label}
      data-lenis-prevent
    >
      <ChatSidebarNav />
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${bottomNav && offsetContent ? "mobile-bottom-nav-offset md:pb-0" : ""}`}
      >
        {children}
      </div>
      {bottomNav ? <BottomNav /> : null}
    </div>
  );
}
