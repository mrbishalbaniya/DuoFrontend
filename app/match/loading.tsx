import { AppShellSkeleton } from "@/components/skeletons/AppShellSkeleton";
import { DiscoverPageSkeleton } from "@/components/skeletons/DiscoverPageSkeleton";

export default function MatchLoading() {
  return (
    <AppShellSkeleton label="Loading profiles" offsetContent={false}>
      <DiscoverPageSkeleton />
    </AppShellSkeleton>
  );
}
