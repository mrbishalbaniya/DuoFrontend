import { AppShellSkeleton } from "@/components/skeletons/AppShellSkeleton";
import { ChatPageSkeleton } from "@/components/skeletons/ChatPageSkeleton";

export default function ChatLoading() {
  return (
    <AppShellSkeleton label="Loading messages">
      <ChatPageSkeleton />
    </AppShellSkeleton>
  );
}
