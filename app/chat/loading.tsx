import Navbar from "@/components/Navbar";
import { ChatPageSkeleton } from "@/components/skeletons/ChatPageSkeleton";

export default function ChatLoading() {
  return (
    <div className="mobile-bottom-nav-offset flex h-[100dvh] flex-col overflow-hidden md:pb-0">
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-16">
        <ChatPageSkeleton />
      </div>
    </div>
  );
}
