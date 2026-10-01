"use client";

import { AnimatePresence, motion } from "motion/react";
import { MatchInsightsPanel } from "@/components/chat/MatchInsightsPanel";
import { ChatProfileView } from "@/components/chat/ChatProfileView";
import type { Profile } from "@/types";

export type ChatDetailsTab = "profile" | "insights";

/**
 * Collapsible right-hand panel for the chat page (desktop), mirroring the map
 * page's side panels: an edge tab toggles it, the conversation stays visible.
 */
export function ChatDetailsPanel({
  open,
  tab,
  onTabChange,
  onToggle,
  profile,
  matchId,
  myProfile,
  onUseStarter,
  conversationId,
  onOpenImage,
  matchedAt,
  onVoiceCall,
  onVideoCall,
}: {
  open: boolean;
  tab: ChatDetailsTab;
  onTabChange: (tab: ChatDetailsTab) => void;
  onToggle: () => void;
  profile: Profile | null;
  matchId?: number | null;
  myProfile?: Profile | null;
  onUseStarter?: (text: string) => void;
  conversationId?: string | null;
  onOpenImage?: (src: string) => void;
  matchedAt?: string | null;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
}) {
  return (
    <>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.aside
            id="chat-details-panel"
            key="chat-details"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{ width: "var(--chat-details-width)" }}
            className="hidden h-full shrink-0 overflow-hidden border-l border-outline-variant/30 bg-background lg:block"
          >
            <div className="flex h-full flex-col" style={{ width: "var(--chat-details-width)" }}>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {tab === "insights" && matchId ? (
                  <MatchInsightsPanel
                    matchId={matchId}
                    myProfile={myProfile}
                    otherProfile={profile}
                    onClose={onToggle}
                    onUseStarter={onUseStarter}
                    compact
                  />
                ) : (
                  <>
                    <header className="flex shrink-0 items-center gap-3 border-b border-outline-variant/40 px-4 py-3">
                      <h3 className="min-w-0 flex-1 truncate text-lg font-bold text-on-surface">Profile</h3>
                      <button
                        type="button"
                        onClick={onToggle}
                        aria-label="Close profile"
                        title="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[22px]">close</span>
                      </button>
                    </header>
                    <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      <ChatProfileView
                        profile={profile}
                        conversationId={conversationId}
                        onOpenImage={onOpenImage}
                        matchedAt={matchedAt}
                        onVoiceCall={onVoiceCall}
                        onVideoCall={onVideoCall}
                        onOpenInsights={matchId ? () => onTabChange("insights") : undefined}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
