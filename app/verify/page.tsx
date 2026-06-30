"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { VerificationFlow } from "@/components/verification/VerificationFlow";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden overscroll-none bg-surface" data-lenis-prevent>
      <ChatSidebarNav />
      <div className="mobile-bottom-nav-offset flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-0">
        <header className="flex shrink-0 items-center gap-3 border-b border-primary/10 px-4 py-3 md:px-6">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary md:hidden"
            aria-label="Back to settings"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </Link>
          <h1 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">
            Identity Verification
          </h1>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden" data-lenis-prevent>
          <VerificationFlow />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
