import type { ReactNode } from "react";
import { MatchLayoutShell } from "@/components/match/MatchLayoutShell";

export default function MatchLayout({ children }: { children: ReactNode }) {
  return <MatchLayoutShell>{children}</MatchLayoutShell>;
}
