"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MessagesSection from "@/components/message/message";
import Navbar from "@/components/Navbar";

function ChatPageContent() {
  const searchParams = useSearchParams();
  const inThread = Boolean(searchParams.get("conversation"));

  return (
    <div
      className={`flex h-[100dvh] flex-col overflow-hidden ${
        inThread ? "" : "mobile-bottom-nav-offset md:pb-0"
      }`}
    >
      <div className={inThread ? "max-lg:hidden" : ""}>
        <Navbar />
      </div>
      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${inThread ? "max-lg:pt-0" : "pt-16"}`}>
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-on-surface-variant">
              Loading messages…
            </div>
          }
        >
          <MessagesSection />
        </Suspense>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center text-on-surface-variant">
          Loading messages…
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
