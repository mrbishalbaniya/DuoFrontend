import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { ChatMessage, Conversation } from "@/types";
import { VOICE_MESSAGE_LABEL } from "./chatConstants";
import { normalizeReactionsOnePerUser } from "./chatReactions";
import { getMessageBodyText } from "./chatMessageGrouping";

export function isAudioMediaUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(webm|ogg|mp3|wav|m4a|aac)(\?|$)/i.test(url);
}

export function isVoiceMessage(msg: ChatMessage): boolean {
  return msg.content === VOICE_MESSAGE_LABEL || isAudioMediaUrl(msg.image_url);
}

export function isSentImageOnly(msg: ChatMessage): boolean {
  if (!msg.is_mine || msg.is_deleted_for_everyone || !msg.image_url) return false;
  if (isVoiceMessage(msg)) return false;
  return !msg.content?.trim();
}

export function isVoiceOnlyMessage(msg: ChatMessage): boolean {
  if (!isVoiceMessage(msg) || msg.is_deleted_for_everyone || !msg.image_url) return false;
  const text = msg.content?.trim();
  return !text || text === VOICE_MESSAGE_LABEL;
}

export function isTextOnlyMessage(msg: ChatMessage): boolean {
  if (isVoiceMessage(msg) || msg.image_url) return false;
  return Boolean(msg.content?.trim()) || Boolean(msg.is_deleted_for_everyone);
}

export function isCompactBubble(msg: ChatMessage): boolean {
  return isVoiceOnlyMessage(msg) || isTextOnlyMessage(msg);
}

export function messageBubblePadding(msg: ChatMessage): string {
  if (isSentImageOnly(msg)) return "p-0";
  if (isCompactBubble(msg)) return "px-2 py-1";
  return "p-3";
}

export function normalizeMessages(raw: ChatMessage[]): ChatMessage[] {
  return [...raw]
    .map((msg) => ({
      ...msg,
      image_url: resolveMediaUrl(msg.image_url) ?? msg.image_url,
      is_mine: msg.is_mine ?? false,
      reactions: msg.reactions ? normalizeReactionsOnePerUser(msg.reactions) : msg.reactions,
    }))
    .sort((a, b) => {
      const timeA = new Date(a.timestamp ?? a.created_at ?? 0).getTime();
      const timeB = new Date(b.timestamp ?? b.created_at ?? 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id;
    });
}

export function getCopyableText(msg: ChatMessage): string {
  if (msg.is_deleted_for_everyone) return "";
  if (isVoiceMessage(msg)) return VOICE_MESSAGE_LABEL;
  const text = getMessageBodyText(msg);
  if (text.trim()) return text.trim();
  if (msg.image_url && !isVoiceMessage(msg)) return msg.image_url;
  return "";
}

export function getReplyPreview(msg: ChatMessage, fallbackName?: string): string {
  if (msg.is_deleted_for_everyone) return "Message deleted";
  const text = getCopyableText(msg);
  if (text) return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  return fallbackName ? `Message from ${fallbackName}` : "Message";
}

export function lastMessagePreview(convo: Conversation): string {
  if (typeof convo.last_message === "string") return convo.last_message;
  return convo.last_message?.content || "Start the conversation!";
}

export function getConversationLastActivity(convo: Conversation): string | undefined {
  if (convo.last_message_at) return convo.last_message_at;
  if (convo.updated_at) return convo.updated_at;
  const lastMessage = convo.last_message;
  if (lastMessage && typeof lastMessage === "object") {
    return lastMessage.timestamp || lastMessage.created_at;
  }
  return convo.created_at;
}

/** Prefer 10-digit public_id for URLs and API paths. */
export function conversationPublicKey(convo: Conversation): string {
  return convo.public_id || String(convo.id);
}

export function findConversationByParam(
  conversations: Conversation[],
  param: string
): Conversation | undefined {
  return conversations.find(
    (c) => c.public_id === param || String(c.id) === param
  );
}

export function formatMessageTime(iso?: string): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    const now = new Date();
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return "";
  }
}

export function sortConversationsByActivity(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const pinA = a.is_pinned ? 1 : 0;
    const pinB = b.is_pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    return (
      new Date(getConversationLastActivity(b) || 0).getTime() -
      new Date(getConversationLastActivity(a) || 0).getTime()
    );
  });
}

export function touchConversationInList(
  conversations: Conversation[],
  convoId: number,
  preview: string,
  iso: string,
  isMine: boolean
): Conversation[] {
  const label = isMine ? `You: ${preview}` : preview;
  const next = conversations.map((c) =>
    c.id === convoId
      ? {
          ...c,
          last_message_at: iso,
          last_message: label,
        }
      : c
  );

  return sortConversationsByActivity(next);
}

export function formatClockTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
