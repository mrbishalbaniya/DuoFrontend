"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { resolveMediaUrl, resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import type { Conversation } from "@/types";
import {
  conversationPublicKey,
  formatMessageTime,
  getConversationLastActivity,
  lastMessagePreview,
} from "./chatMessageUtils";
import { ConversationRowMenu } from "./ConversationRowMenu";
import { UserAvatar } from "./UserAvatar";

export function ConversationSidebar({
  sidebarWidth,
  isMobile,
  showMobileThread,
  mobileSlideTransition,
  totalUnread,
  loadingConversations,
  search,
  onSearchChange,
  onRefresh,
  filteredConversations,
  selectedKey,
  onSelectConversation,
  unreadFilter,
  onUnreadFilterChange,
  showArchived,
  onShowArchivedChange,
  onArchiveConversation,
  onMuteConversation,
  onPinConversation,
  onDeleteConversation,
}: {
  sidebarWidth: number;
  isMobile: boolean;
  showMobileThread: boolean;
  mobileSlideTransition: {
    type: "tween";
    duration: number;
    ease: readonly [number, number, number, number];
  };
  totalUnread: number;
  loadingConversations: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  filteredConversations: Conversation[];
  selectedKey: string | null;
  onSelectConversation: (convo: Conversation) => void;
  unreadFilter: boolean;
  onUnreadFilterChange: (value: boolean) => void;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
  onArchiveConversation: (convo: Conversation, archived: boolean) => void;
  onMuteConversation: (convo: Conversation, muted: boolean) => void;
  onPinConversation: (convo: Conversation, pinned: boolean) => void;
  onDeleteConversation: (convo: Conversation) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <motion.aside
      style={{ ["--msg-sidebar-w" as string]: `${sidebarWidth}px` } as CSSProperties}
      initial={false}
      animate={{
        x: isMobile ? (showMobileThread ? "-100%" : "0%") : 0,
      }}
      transition={mobileSlideTransition}
      className="flex shrink-0 flex-col overflow-hidden border-r border-outline-variant bg-background w-full lg:w-[var(--msg-sidebar-w)] lg:min-w-[200px] lg:max-w-[520px] max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-10 max-lg:w-full"
    >
      <div className="border-b border-outline-variant p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="text-base font-bold font-[var(--font-headline)] text-on-surface sm:text-lg">
              Messages
            </h2>
            {totalUnread > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors"
            title="Refresh"
          >
            <span
              className={`material-symbols-outlined text-[20px] text-on-surface-variant ${
                loadingConversations ? "animate-spin" : ""
              }`}
            >
              refresh
            </span>
          </button>
        </div>
        <div className="relative mb-2">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onUnreadFilterChange(!unreadFilter)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              unreadFilter
                ? "bg-primary text-white"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => onShowArchivedChange(!showArchived)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              showArchived
                ? "bg-primary text-white"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      <div
        data-lenis-prevent
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain hide-scrollbar"
        onClick={() => setOpenMenuId(null)}
      >
        {filteredConversations.length === 0 ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            {showArchived ? "No archived conversations." : "No matches for your search."}
          </p>
        ) : (
          filteredConversations.map((convo) => {
            const isSelected = selectedKey === conversationPublicKey(convo);
            const preview = lastMessagePreview(convo);
            const time = formatMessageTime(getConversationLastActivity(convo));
            const profile = convo.other_user_profile;
            const isTyping = Boolean(
              (convo as Conversation & { is_other_user_typing?: boolean }).is_other_user_typing
            );

            return (
              <div
                key={convo.id}
                className={`flex w-full items-stretch gap-1 border-l-4 pr-1 transition-colors sm:pr-2 ${
                  isSelected
                    ? "bg-surface-container-low border-primary"
                    : "hover:bg-surface-container-low border-transparent"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectConversation(convo)}
                  className="flex min-w-0 flex-1 gap-3 p-3 text-left active:bg-surface-container sm:p-4 sm:pr-2"
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={
                        resolveMediaUrl(profile?.photo_url) ??
                        resolveProfilePhotoUrl(profile ?? {})
                      }
                      name={convo.other_user_nickname?.trim() || profile?.full_name}
                    />
                    {isTyping ? (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex min-w-0 items-center gap-1">
                        <span className="truncate font-semibold text-sm text-on-surface">
                          {convo.other_user_nickname?.trim() || profile?.full_name}
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-px">
                          {profile?.is_verified ? (
                            <span
                              className="inline-flex h-[10px] w-[10px] items-center justify-center"
                              title="Verified"
                            >
                              <span
                                className="material-symbols-outlined origin-center scale-[0.48] text-[16px] leading-none text-sky-500"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                verified
                              </span>
                            </span>
                          ) : null}
                          {convo.is_muted ? (
                            <span
                              className="inline-flex h-[10px] w-[10px] items-center justify-center"
                              title="Muted"
                            >
                              <span className="material-symbols-outlined origin-center scale-[0.48] text-[16px] leading-none text-on-surface-variant/75">
                                notifications_off
                              </span>
                            </span>
                          ) : null}
                          {convo.is_pinned ? (
                            <span
                              className="inline-flex h-[10px] w-[10px] items-center justify-center"
                              title="Pinned"
                            >
                              <span className="material-symbols-outlined origin-center scale-[0.48] text-[16px] leading-none text-on-surface-variant/60">
                                push_pin
                              </span>
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <p
                        className={`truncate text-xs ${
                          isTyping ? "font-medium text-primary" : "text-on-surface-variant"
                        }`}
                      >
                        {isTyping ? "Typing…" : preview}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1 pl-1">
                      {time ? (
                        <span className="whitespace-nowrap text-[11px] tabular-nums text-on-surface-variant">
                          {time}
                        </span>
                      ) : null}
                      {(convo.unread_count ?? 0) > 0 && (
                        <span className="min-w-[18px] rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {convo.unread_count! > 99 ? "99+" : convo.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                <ConversationRowMenu
                  convo={convo}
                  showArchived={showArchived}
                  open={openMenuId === convo.id}
                  onOpenChange={(next) => setOpenMenuId(next ? convo.id : null)}
                  onPin={(pinned) => onPinConversation(convo, pinned)}
                  onMute={(muted) => onMuteConversation(convo, muted)}
                  onArchive={(archived) => onArchiveConversation(convo, archived)}
                  onDelete={() => onDeleteConversation(convo)}
                />
              </div>
            );
          })
        )}
      </div>
    </motion.aside>
  );
}
