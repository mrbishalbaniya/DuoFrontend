import { Suspense } from "react";
import { DiscoverMatchesPage } from "@/components/discover/DiscoverMatchesPage";
import { DiscoverMatchesSkeleton } from "@/components/skeletons/DiscoverMatchesSkeleton";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverMatchesSkeleton />}>
      <DiscoverMatchesPage />
    </Suspense>
  );
}
