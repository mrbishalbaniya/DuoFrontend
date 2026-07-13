import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Discover",
  description: "See who liked you, who you liked, and who viewed your profile on Duo.",
  path: "/discover",
});

export default function DiscoverLayout({ children }: { children: ReactNode }) {
  return children;
}
