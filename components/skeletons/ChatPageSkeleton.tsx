import { Skeleton } from "@/components/ui/skeleton";

function ConversationRowSkeleton() {
  return (
    <div className="flex gap-3 border-l-4 border-transparent p-3 sm:p-4">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full max-w-[180px]" />
      </div>
      <Skeleton className="h-3 w-10 shrink-0" />
    </div>
  );
}

function MessageBubbleSkeleton({ align }: { align: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "items-end gap-2"}`}>
      {align === "left" ? <Skeleton className="h-8 w-8 shrink-0 rounded-full" /> : null}
      <Skeleton
        className={`h-14 rounded-[1.25rem] ${
          align === "right" ? "w-48 rounded-br-[0.2rem]" : "w-56 rounded-bl-[0.2rem]"
        }`}
      />
    </div>
  );
}

export function ChatConversationListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="border-b border-outline-variant p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="flex-1 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <ConversationRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="hidden min-h-0 flex-1 flex-col bg-surface lg:flex">
      <div className="flex items-center gap-3 border-b border-outline-variant bg-background px-4 py-3 sm:px-6">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-hidden bg-surface-container-low px-3 py-4 sm:px-6 sm:py-6">
        <div className="flex justify-center">
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
        <MessageBubbleSkeleton align="left" />
        <MessageBubbleSkeleton align="right" />
        <MessageBubbleSkeleton align="left" />
        <MessageBubbleSkeleton align="right" />
      </div>
      <div className="border-t border-outline-variant bg-background p-3 sm:p-4">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ChatPageSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 overflow-hidden bg-surface"
      aria-busy="true"
      aria-label="Loading chat"
    >
      <div className="hidden w-[4.25rem] shrink-0 border-r border-outline-variant/30 bg-surface md:flex" />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <aside className="flex w-full shrink-0 flex-col overflow-hidden border-r border-outline-variant bg-background lg:w-[320px]">
            <ChatConversationListSkeleton />
          </aside>
          <ChatThreadSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div className="space-y-4 px-3 py-4 sm:px-6 sm:py-6">
      <MessageBubbleSkeleton align="left" />
      <MessageBubbleSkeleton align="right" />
      <MessageBubbleSkeleton align="left" />
      <MessageBubbleSkeleton align="right" />
    </div>
  );
}
