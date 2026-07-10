"use client";

import type { MessageReplyPreview } from "@/types";
import { VOICE_MESSAGE_LABEL } from "./chatConstants";

export function ReplyQuote({
  reply,
  isMine,
}: {
  reply: MessageReplyPreview;
  isMine: boolean;
}) {
  const preview =
    reply.content?.trim() ||
    (reply.message_type === "voice" || reply.content === VOICE_MESSAGE_LABEL
      ? "Voice message"
      : reply.image_url
        ? "Photo"
        : "Message");

  return (
    <div
      className={`mb-1.5 rounded-lg border-l-[3px] px-2 py-1 text-xs ${
        isMine
          ? "border-white/60 bg-white/10 text-white/90"
          : "border-primary bg-primary/5 text-on-surface-variant"
      }`}
    >
      <p className={`font-semibold truncate ${isMine ? "text-white" : "text-primary"}`}>
        {reply.sender_name}
      </p>
      <p className="truncate opacity-80">{preview}</p>
    </div>
  );
}
