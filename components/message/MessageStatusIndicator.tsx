"use client";

import { messageStatusIcon } from "./messageStatus";
import type { ChatMessage } from "@/types";

export function MessageStatusIndicator({
  msg,
  className = "",
}: {
  msg: ChatMessage;
  className?: string;
}) {
  const status = messageStatusIcon(msg);

  if (status === "pending") {
    return (
      <span
        className={`material-symbols-outlined text-[11px] animate-pulse ${className}`}
        aria-label="Sending"
      >
        schedule
      </span>
    );
  }

  if (msg.send_status === "failed") {
    return (
      <span
        className={`material-symbols-outlined text-[11px] text-red-300 ${className}`}
        aria-label="Failed to send"
      >
        error
      </span>
    );
  }

  const filled = status === "read";
  const icon = status === "sent" ? "done" : "done_all";
  const color =
    status === "read"
      ? "text-sky-200"
      : status === "delivered"
        ? "text-white/70"
        : "text-white/70";

  return (
    <span
      className={`material-symbols-outlined text-[11px] ${color} ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      aria-label={status === "read" ? "Read" : status === "delivered" ? "Delivered" : "Sent"}
    >
      {icon}
    </span>
  );
}
