import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Chat",
  description: "Message your matches in real time on Duo.",
  path: "/chat",
  noIndex: true,
});

export default function ChatLayout({ children }: { children: ReactNode }) {
  return children;
}
