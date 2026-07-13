"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLenis } from "lenis/react";
import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { ChatPageSkeleton } from "@/components/skeletons/ChatPageSkeleton";

const MessagesSection = dynamic(() => import("@/components/message/message"), {
  loading: () => <ChatPageSkeleton />,
});

function ChatPageContent() {
  const searchParams = useSearchParams();
  const inThread = Boolean(searchParams.get("conversation"));
  const lenis = useLenis();

  useEffect(() => {
    lenis?.stop();
    return () => {
      lenis?.start();
    };
  }, [lenis]);

  return (
    <div
      className="flex h-[100dvh] min-h-0 overflow-hidden overscroll-none bg-surface"
      data-lenis-prevent
    >
      <ChatSidebarNav className={inThread ? "max-lg:hidden" : ""} />
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${
          !inThread ? "mobile-bottom-nav-offset" : ""
        }`}
      >
        <Suspense fallback={<ChatPageSkeleton />}>
          <MessagesSection />
        </Suspense>
      </div>
      {!inThread ? <BottomNav /> : null}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageSkeleton />}>
      <ChatPageContent />
    </Suspense>
  );
}
