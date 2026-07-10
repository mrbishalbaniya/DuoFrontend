import type { ChatMessage } from "@/types";

export type MessageSendStatus = "pending" | "sent" | "failed";

export function getMessageSendStatus(msg: ChatMessage): MessageSendStatus {
  if (msg.send_status) return msg.send_status;
  if (msg.id < 0) return "pending";
  return "sent";
}

export function isMessageDelivered(msg: ChatMessage): boolean {
  return Boolean(msg.delivered_at || msg.is_read || msg.read_at);
}

export function isMessageRead(msg: ChatMessage): boolean {
  return Boolean(msg.is_read || msg.read_at);
}

export function messageStatusIcon(msg: ChatMessage): "pending" | "sent" | "delivered" | "read" {
  const status = getMessageSendStatus(msg);
  if (status === "pending") return "pending";
  if (status === "failed") return "sent";
  if (isMessageRead(msg)) return "read";
  if (isMessageDelivered(msg)) return "delivered";
  return "sent";
}
