"use client";



import { memo } from "react";
import { SystemEventMessage } from "./SystemEventMessage";
import { LocationMessageCard } from "./LocationMessageCard";
import { parseLocationMessage } from "@/lib/chatLocation";

import { resolveChatMediaUrl, resolveMediaUrl } from "@/lib/mediaUrl";

import VoiceMessageBubble from "@/components/ui/voice-message-bubble";

import type { ChatMessage } from "@/types";

import {

  formatClockTime,

  isCompactBubble,

  isEmojiOnlyMessage,

  isSentImageOnly,

  isTextOnlyMessage,

  isVoiceMessage,

  isVoiceOnlyMessage,

  messageBubblePadding,

} from "./chatMessageUtils";

import {

  getMessageBodyText,

  getLegacyReplyPreview,

} from "./chatMessageGrouping";

import {

  getReactionEmojiForOtherUsers,

  getReactionEmojiForUser,

} from "./chatReactions";

import { MessageActionMenu } from "./MessageActionMenu";

import { MessageStatusIndicator } from "./MessageStatusIndicator";

import { ReactionBadge } from "./ReactionBadge";

import { ReplyQuote } from "./ReplyQuote";

import { UserAvatar } from "./UserAvatar";



export const ChatMessageBubble = memo(function ChatMessageBubble({

  msg,

  currentUserId,

  otherAvatarSrc,

  otherProfileName,

  showAvatar = true,

  isGrouped = false,

  menuOpen,

  onToggleMenu,

  onCopy,

  onReply,

  onReact,

  onDeleteForMe,

  onDeleteForEveryone,

  onImageClick,

  onRetry,

  onCallBack,

}: {

  msg: ChatMessage;

  currentUserId?: number | null;

  otherAvatarSrc?: string | null;

  otherProfileName?: string;

  showAvatar?: boolean;

  isGrouped?: boolean;

  menuOpen: boolean;

  onToggleMenu: (msg: ChatMessage) => void;

  onCopy: (msg: ChatMessage) => void;

  onReply: (msg: ChatMessage) => void;

  onReact: (msg: ChatMessage, emoji: string) => void;

  onDeleteForMe: (msg: ChatMessage) => void;

  onDeleteForEveryone: (msg: ChatMessage) => void;

  onImageClick?: (src: string) => void;

  onRetry?: (msg: ChatMessage) => void;
  onCallBack?: (video: boolean) => void;

}) {

  if (msg.message_type === "system") {
    return <SystemEventMessage msg={msg} onCallBack={onCallBack} />;
  }

  const myReaction =

    currentUserId != null ? getReactionEmojiForUser(msg.reactions, currentUserId) : null;

  const theirReaction =

    currentUserId != null

      ? getReactionEmojiForOtherUsers(msg.reactions, currentUserId)

      : null;

  const showMyReactionOnTheirMsg = !msg.is_mine && myReaction;

  const showTheirReactionOnMyMsg = msg.is_mine && theirReaction;

  const bodyText = getMessageBodyText(msg);
  const sharedLocation = isVoiceMessage(msg) || msg.image_url ? null : parseLocationMessage(msg.content);
  const emojiOnly = !sharedLocation && isEmojiOnlyMessage(msg);
  const bareContent = Boolean(sharedLocation) || emojiOnly;

  const legacyReply = getLegacyReplyPreview(msg);

  const canRetry = msg.send_status === "failed" && msg.is_mine && onRetry;



  return (

    <div

      className={`flex group relative min-w-0 overflow-visible ${msg.is_mine ? "justify-end" : "items-end gap-2"} max-w-[88%] sm:max-w-[75%] ${

        msg.is_mine ? "ml-auto" : ""

      } ${isGrouped ? "mt-0.5" : ""}`}

    >

      {!msg.is_mine && (

        showAvatar ? (

          <UserAvatar

            src={

              msg.sender_photo

                ? resolveMediaUrl(msg.sender_photo) ?? msg.sender_photo

                : otherAvatarSrc

            }

            name={msg.sender_name ?? otherProfileName}

            size="sm"

          />

        ) : (

          <div className="w-8 shrink-0" aria-hidden />

        )

      )}



      <div

        className={`flex min-w-0 max-w-full items-center gap-0.5 ${

          msg.is_mine ? "flex-row" : "flex-row"

        }`}

      >

        {msg.is_mine && !msg.is_deleted_for_everyone && (

          <MessageActionMenu

            msg={msg}

            open={menuOpen}

            onToggle={onToggleMenu}

            onCopy={onCopy}

            onReply={onReply}

            onReact={onReact}

            onDeleteForMe={onDeleteForMe}

            onDeleteForEveryone={onDeleteForEveryone}

          />

        )}



        <div className="relative min-w-0 max-w-full flex flex-col overflow-visible">

          <div

            className={`relative min-w-0 max-w-full overflow-hidden transition-all ${

              isCompactBubble(msg) || bareContent ? "w-fit" : ""

            } ${

              isSentImageOnly(msg) || bareContent

                ? "bg-transparent p-0 shadow-none"

                : `${messageBubblePadding(msg)} shadow-sm ${

                    msg.is_mine

                      ? "gradient-brand-br text-white rounded-[1.25rem] rounded-br-[0.2rem] shadow-md shadow-primary/10"

                      : "bg-secondary text-on-surface rounded-[1.25rem] rounded-bl-[0.2rem] border border-outline-variant/30"

                  }`

            } ${msg.is_deleted_for_everyone ? "opacity-60 italic" : ""} ${

              canRetry ? "ring-1 ring-red-300/60" : ""

            }`}

          >

            {msg.reply_to ? (

              <ReplyQuote reply={msg.reply_to} isMine={!!msg.is_mine} />

            ) : legacyReply ? (

              <div

                className={`mb-1.5 rounded-lg border-l-[3px] px-2 py-1 text-xs ${

                  msg.is_mine

                    ? "border-white/60 bg-white/10 text-white/90"

                    : "border-primary bg-primary/5 text-on-surface-variant"

                }`}

              >

                <p className={`font-semibold truncate ${msg.is_mine ? "text-white" : "text-primary"}`}>

                  {legacyReply.sender_name}

                </p>

                <p className="truncate opacity-80">{legacyReply.preview}</p>

              </div>

            ) : null}



            {msg.image_url && !msg.is_deleted_for_everyone && (

              <div className={isSentImageOnly(msg) || isVoiceOnlyMessage(msg) ? "" : "mb-1"}>

                {isVoiceMessage(msg) ? (

                  <div className="relative">

                    <VoiceMessageBubble

                      audioSrc={msg.image_url}

                      bubbleColor="transparent"

                      waveColor={msg.is_mine ? "#ffffff" : "#b76e79"}

                      onGradientBubble={msg.is_mine}

                      compact

                    />

                    {isVoiceOnlyMessage(msg) && (

                      <div

                        className={`pointer-events-none absolute bottom-0 flex items-center gap-0.5 ${

                          msg.is_mine ? "right-0" : "left-0"

                        }`}

                      >

                        <span

                          className={`text-[9px] leading-none ${

                            msg.is_mine ? "text-white/70" : "text-on-surface-variant/60"

                          }`}

                        >

                          {formatClockTime(msg.timestamp ?? msg.created_at)}

                        </span>

                        {msg.is_mine && <MessageStatusIndicator msg={msg} />}

                      </div>

                    )}

                  </div>

                ) : (

                  <button

                    type="button"

                    onClick={() => onImageClick?.(msg.image_url!)}

                    className={`block overflow-hidden ${

                      isSentImageOnly(msg)

                        ? "rounded-2xl rounded-br-md"

                        : "rounded-lg border border-black/5"

                    }`}

                  >

                    <img

                      src={resolveChatMediaUrl(msg.image_url) ?? msg.image_url}

                      alt="Attached"

                      loading="lazy"

                      decoding="async"

                      className="max-w-full max-h-64 object-cover"

                    />

                  </button>

                )}

              </div>

            )}

            {sharedLocation ? (
              <div className="flex flex-col gap-1">
                <LocationMessageCard location={sharedLocation} mine={Boolean(msg.is_mine)} />
                <span className="bubble-bare-meta flex items-center justify-end gap-0.5 px-1 text-[10px] leading-none text-on-surface-variant">
                  {formatClockTime(msg.timestamp ?? msg.created_at)}
                  {msg.is_mine && <MessageStatusIndicator msg={msg} />}
                </span>
              </div>
            ) : null}

            {emojiOnly ? (
              <div className={`flex flex-col gap-0.5 ${msg.is_mine ? "items-end" : "items-start"}`}>
                <span
                  className={`leading-none ${
                    [...(msg.content || "").replace(/\s/g, "")].length <= 3 ? "text-5xl" : "text-4xl"
                  }`}
                >
                  {msg.content}
                </span>
                <span className="bubble-bare-meta flex items-center gap-0.5 px-0.5 text-[10px] leading-none text-on-surface-variant">
                  {formatClockTime(msg.timestamp ?? msg.created_at)}
                  {msg.is_mine && <MessageStatusIndicator msg={msg} />}
                </span>
              </div>
            ) : null}

            {bodyText && !bareContent && !isVoiceMessage(msg) && (

              isTextOnlyMessage(msg) ? (

                <p className="text-sm leading-tight whitespace-pre-wrap break-words [overflow-wrap:anywhere]">

                  {bodyText}

                  <span

                    className={`inline-flex items-center gap-0.5 whitespace-nowrap ml-1.5 align-baseline text-[9px] leading-none ${

                      msg.is_mine ? "text-white/70" : "text-on-surface-variant/60"

                    }`}

                  >

                    {formatClockTime(msg.timestamp ?? msg.created_at)}

                    {msg.is_mine && <MessageStatusIndicator msg={msg} />}

                  </span>

                </p>

              ) : (

                <p className="text-sm leading-snug px-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">

                  {bodyText}

                </p>

              )

            )}



            {!isVoiceOnlyMessage(msg) && !isTextOnlyMessage(msg) && (

              <div

                className={`flex items-center gap-1 ${

                  isSentImageOnly(msg) ? "mt-1.5" : "mt-1"

                } ${msg.is_mine ? "justify-end" : "justify-start"}`}

              >

                <span

                  className={`text-[9px] ${

                    msg.is_mine && !isSentImageOnly(msg)

                      ? "text-white/70"

                      : "text-on-surface-variant/60"

                  }`}

                >

                  {formatClockTime(msg.timestamp ?? msg.created_at)}

                </span>

                {msg.is_mine && (

                  <MessageStatusIndicator

                    msg={msg}

                    className={isSentImageOnly(msg) ? "text-primary/60" : ""}

                  />

                )}

              </div>

            )}



            {canRetry ? (

              <button

                type="button"

                onClick={() => onRetry?.(msg)}

                className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-200"

              >

                <span className="material-symbols-outlined text-[14px]">refresh</span>

                Tap to retry

              </button>

            ) : null}

          </div>



          {showMyReactionOnTheirMsg && (

            <div className="relative z-10 -mt-2.5 flex justify-end pr-0.5">

              <ReactionBadge emoji={myReaction!} />

            </div>

          )}



          {showTheirReactionOnMyMsg && (

            <div className="relative z-10 -mt-2.5 flex justify-start pl-0.5">

              <ReactionBadge emoji={theirReaction!} />

            </div>

          )}

        </div>



        {!msg.is_mine && !msg.is_deleted_for_everyone && (

          <MessageActionMenu

            msg={msg}

            open={menuOpen}

            onToggle={onToggleMenu}

            onCopy={onCopy}

            onReply={onReply}

            onReact={onReact}

            onDeleteForMe={onDeleteForMe}

            onDeleteForEveryone={onDeleteForEveryone}

          />

        )}

      </div>

    </div>

  );

});


