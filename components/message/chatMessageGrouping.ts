import type { ChatMessage } from "@/types";

const GROUP_WINDOW_MS = 5 * 60 * 1000;

export type MessageTimelineItem =
  | { type: "date"; key: string; label: string }
  | {
      type: "message";
      key: string;
      msg: ChatMessage;
      showAvatar: boolean;
      isGrouped: boolean;
    };

export function formatDateSeparator(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
  }
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function messageTimestamp(msg: ChatMessage): number {
  return new Date(msg.timestamp ?? msg.created_at ?? 0).getTime();
}

export function buildMessageTimeline(messages: ChatMessage[]): MessageTimelineItem[] {
  const items: MessageTimelineItem[] = [];
  let lastDateKey = "";

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i];
    const ts = msg.timestamp ?? msg.created_at;
    const dateKey = ts ? new Date(ts).toDateString() : "";

    if (dateKey && dateKey !== lastDateKey) {
      items.push({
        type: "date",
        key: `date-${dateKey}`,
        label: formatDateSeparator(ts),
      });
      lastDateKey = dateKey;
    }

    const prev = messages[i - 1];
    const next = messages[i + 1];
    const msgTime = messageTimestamp(msg);
    const sameSenderAsPrev =
      prev &&
      !prev.is_mine === !msg.is_mine &&
      (prev.sender_id ?? (prev.is_mine ? -1 : -2)) ===
        (msg.sender_id ?? (msg.is_mine ? -1 : -2)) &&
      msgTime - messageTimestamp(prev) <= GROUP_WINDOW_MS;
    const sameSenderAsNext =
      next &&
      !next.is_mine === !msg.is_mine &&
      (next.sender_id ?? (next.is_mine ? -1 : -2)) ===
        (msg.sender_id ?? (msg.is_mine ? -1 : -2)) &&
      messageTimestamp(next) - msgTime <= GROUP_WINDOW_MS;

    items.push({
      type: "message",
      key: msg.client_temp_id ? `temp-${msg.client_temp_id}` : `msg-${msg.id}`,
      msg,
      showAvatar: !msg.is_mine && !sameSenderAsNext,
      isGrouped: Boolean(sameSenderAsPrev || sameSenderAsNext),
    });
  }

  return items;
}

/** Legacy reply prefix: ↩ Sender: preview\nbody */
const LEGACY_REPLY_RE = /^↩\s*(.+?):\s*(.+)\n([\s\S]*)$/;

export function parseLegacyReplyContent(content: string): {
  body: string;
  reply?: { sender_name: string; preview: string };
} {
  const match = content.match(LEGACY_REPLY_RE);
  if (!match) return { body: content };
  return {
    body: match[3],
    reply: { sender_name: match[1], preview: match[2] },
  };
}

export function getMessageBodyText(msg: ChatMessage): string {
  if (msg.reply_to) return msg.content;
  const parsed = parseLegacyReplyContent(msg.content);
  return parsed.body;
}

export function getLegacyReplyPreview(msg: ChatMessage) {
  if (msg.reply_to) return null;
  return parseLegacyReplyContent(msg.content).reply ?? null;
}

export function createOptimisticMessage(params: {
  clientTempId: string;
  content: string;
  imageUrl?: string;
  userId: number;
  userName: string;
  userPhoto?: string;
  replyToId?: number;
  replyTo?: ChatMessage["reply_to"];
}): ChatMessage {
  const now = new Date().toISOString();
  return {
    id: -Date.now(),
    client_temp_id: params.clientTempId,
    send_status: "pending",
    sender_id: params.userId,
    sender_name: params.userName,
    sender_photo: params.userPhoto,
    content: params.content,
    image_url: params.imageUrl ?? "",
    timestamp: now,
    created_at: now,
    is_mine: true,
    is_read: false,
    reply_to: params.replyTo,
  };
}
