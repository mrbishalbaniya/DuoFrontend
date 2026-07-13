import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Map",
  description: "Explore activity zones and nearby connections on the Duo map.",
  path: "/map",
  noIndex: true,
});

export default function MapLayout({ children }: { children: ReactNode }) {
  return children;
}
