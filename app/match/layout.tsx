import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Match",
  description: "Swipe, connect, and find your perfect match on Duo.",
  path: "/match",
});

export default function MatchLayout({ children }: { children: ReactNode }) {
  return children;
}
