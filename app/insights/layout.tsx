import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Match Insights",
  description: "Compatibility insights and shared values with your Duo matches.",
  path: "/insights",
  noIndex: true,
});

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return children;
}
