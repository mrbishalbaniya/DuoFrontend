import { ChatSidebarNav } from "@/components/chat/ChatSidebarNav";
import BottomNav from "@/components/BottomNav";
import { DiscoverPageSkeleton } from "@/components/skeletons/DiscoverPageSkeleton";

export default function MatchLoading() {
  return (
    <div className="flex h-[100dvh] min-h-0 overflow-hidden overscroll-none bg-surface">
      <ChatSidebarNav />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DiscoverPageSkeleton />
      </div>
      <BottomNav />
    </div>
  );
}
