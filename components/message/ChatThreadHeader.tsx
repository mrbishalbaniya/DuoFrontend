"use client";



import { ChatConversationMenu } from "@/components/chat/ChatConversationMenu";

import { formatMessageTime } from "./chatMessageUtils";

import { UserAvatar } from "./UserAvatar";



export function ChatThreadHeader({

  otherAvatarSrc,

  otherDisplayName,

  isOtherUserTyping,

  isVerified,

  matchCreatedAt,

  hasMatchId,

  chatMenuOpen,

  onBack,

  onOpenInsights,

  onChatMenuOpenChange,

  onShowProfile,

  onEditNickname,

  onUnmatchBlock,

  onClearHistory,

  onReport,

  onVoiceCall,

  onVideoCall,

}: {

  otherAvatarSrc?: string | null;

  otherDisplayName: string;

  isOtherUserTyping: boolean;

  isVerified?: boolean;

  matchCreatedAt?: string;

  hasMatchId: boolean;

  chatMenuOpen: boolean;

  onBack: () => void;

  onOpenInsights: () => void;

  onChatMenuOpenChange: (open: boolean) => void;

  onShowProfile: () => void;

  onEditNickname: () => void;

  onUnmatchBlock: () => void;

  onClearHistory: () => void;

  onReport: () => void;

  onVoiceCall?: () => void;

  onVideoCall?: () => void;

}) {

  const matchLabel = matchCreatedAt

    ? `Matched ${formatMessageTime(matchCreatedAt)}`

    : null;



  return (

    <header className="relative z-50 shrink-0 max-md:ios-sticky-header max-md:!top-0 max-md:px-1 md:border-b md:border-outline-variant md:bg-surface/60 md:px-6 md:py-3 md:backdrop-blur-xl">

      <div className="max-md:ios-nav-bar flex items-center justify-between gap-2 md:gap-3">

        <div className="flex min-w-0 flex-1 items-center gap-0.5 md:gap-3">

          <button

            type="button"

            onClick={onBack}

            className="ios-nav-btn shrink-0 md:hidden"

            aria-label="Back to conversations"

          >

            <span className="material-symbols-outlined text-[28px]">chevron_left</span>

          </button>

          <div className="relative shrink-0">

            <UserAvatar

              src={otherAvatarSrc}

              name={otherDisplayName}

              size="md"

            />

            {isOtherUserTyping ? (

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />

            ) : null}

          </div>

          <div className="min-w-0 flex-1">

            <h3 className="flex items-center gap-1 truncate font-semibold font-[var(--font-headline)] text-[17px] leading-tight text-on-surface md:text-base">

              {otherDisplayName}

              {isVerified ? (

                <span

                  className="material-symbols-outlined text-[16px] text-sky-500"

                  style={{ fontVariationSettings: "'FILL' 1" }}

                  title="Verified"

                >

                  verified

                </span>

              ) : null}

            </h3>

            {isOtherUserTyping ? (

              <p className="mt-0.5 text-[13px] font-medium text-primary animate-pulse md:text-xs md:font-bold">

                Typing…

              </p>

            ) : matchLabel ? (

              <p className="mt-0.5 text-[13px] text-on-surface-variant md:text-xs">{matchLabel}</p>

            ) : (

              <p className="mt-0.5 text-[13px] text-on-surface-variant md:text-xs">

                Your match

              </p>

            )}

          </div>

        </div>

        <div className="flex shrink-0 items-center gap-0.5">

          <button
            type="button"
            onClick={onVoiceCall}
            className="shrink-0 max-md:ios-nav-btn md:rounded-full md:p-2 md:text-primary md:transition-colors md:hover:bg-primary/10"
            aria-label="Voice call"
          >
            <span className="material-symbols-outlined text-[24px] md:text-[22px]">call</span>
          </button>

          <button
            type="button"
            onClick={onVideoCall}
            className="shrink-0 max-md:ios-nav-btn md:rounded-full md:p-2 md:text-primary md:transition-colors md:hover:bg-primary/10"
            aria-label="Video call"
          >
            <span className="material-symbols-outlined text-[24px] md:text-[22px]">videocam</span>
          </button>

          <button

            type="button"

            onClick={onOpenInsights}

            disabled={!hasMatchId}

            className="shrink-0 max-md:ios-nav-btn md:rounded-full md:p-2 md:text-primary md:transition-colors md:hover:bg-primary/10 disabled:opacity-40 max-md:disabled:opacity-35"

            aria-label="Match insights"

          >

            <span className="material-symbols-outlined text-[24px] md:text-[22px]">insights</span>

          </button>

          <ChatConversationMenu

            open={chatMenuOpen}

            onOpenChange={onChatMenuOpenChange}

            onShowProfile={onShowProfile}

            onEditNickname={onEditNickname}

            onUnmatchBlock={onUnmatchBlock}

            onClearHistory={onClearHistory}

            onReport={onReport}

          />

        </div>

      </div>

    </header>

  );

}


