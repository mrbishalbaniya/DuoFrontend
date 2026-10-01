import { Skeleton } from "@/components/ui/skeleton";

function ConversationRowSkeleton({ active = false }: { active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 border-l-4 px-4 py-3.5 ${active ? "border-primary/40 bg-surface-container-low" : "border-transparent"}`}>
      <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full max-w-[190px]" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-4 w-1.5 rounded-full" />
      </div>
    </div>
  );
}

/** "Messages" title, search box, Unread/Archived chips and conversation rows. */
export function ChatConversationListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="space-y-4 px-5 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-11 w-full rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden border-t border-outline-variant/30">
        {Array.from({ length: 8 }).map((_, index) => (
          <ConversationRowSkeleton key={index} active={index === 0} />
        ))}
      </div>
    </div>
  );
}

function MessageBubbleSkeleton({ align, width }: { align: "left" | "right"; width: string }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "items-end gap-2"}`}>
      {align === "left" ? <Skeleton className="h-8 w-8 shrink-0 rounded-full" /> : null}
      <Skeleton
        className={`h-10 rounded-[1.25rem] ${width} ${
          align === "right" ? "rounded-br-[0.2rem] bg-primary/20" : "rounded-bl-[0.2rem]"
        }`}
      />
    </div>
  );
}

/** Message bubbles only (used while a single conversation loads). */
export function ChatMessagesSkeleton() {
  const rows: ["left" | "right", string][] = [
    ["left", "w-40"],
    ["left", "w-56"],
    ["right", "w-32"],
    ["right", "w-48"],
    ["left", "w-36"],
    ["right", "w-60"],
    ["left", "w-44"],
    ["right", "w-28"],
  ];
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex justify-center py-2">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      {rows.map(([align, width], i) => (
        <MessageBubbleSkeleton key={i} align={align} width={width} />
      ))}
    </div>
  );
}

/** Thread header (back, avatar, name, call/video/insights/menu), bubbles and composer. */
export function ChatThreadSkeleton() {
  return (
    <div className="hidden min-h-0 flex-1 flex-col bg-background lg:flex">
      <div className="flex items-center gap-3 border-b border-outline-variant/40 px-6 py-3">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-7 rounded-lg" />
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-6 py-6">
        <ChatMessagesSkeleton />
      </div>
      <div className="flex items-center gap-2 border-t border-outline-variant/30 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-full" />
        ))}
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full bg-primary/25" />
      </div>
    </div>
  );
}

/** /chat content area (the page supplies the nav rail). */
export function ChatPageSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 overflow-hidden bg-background"
      role="status"
      aria-busy="true"
      aria-label="Loading messages"
    >
      <div className="flex w-full shrink-0 flex-col border-r border-outline-variant/40 lg:w-[320px]">
        <ChatConversationListSkeleton />
      </div>
      <ChatThreadSkeleton />
    </div>
  );
}
