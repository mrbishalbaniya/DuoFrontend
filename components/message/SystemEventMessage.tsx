"use client";

import { memo } from "react";
import type { ChatMessage } from "@/types";
import { formatClockTime } from "./chatMessageUtils";

type Tone = "neutral" | "danger" | "success";

type EventStyle = {
  icon: string;
  tone: Tone;
  title: string;
  detail?: string;
};

const LEADING_EMOJI = /^[\p{Extended_Pictographic}️‍\s]+/u;

/** Older system messages were saved with an emoji prefix; drop it. */
export function stripEventEmoji(text: string) {
  return (text || "").replace(LEADING_EMOJI, "").trim();
}

function inferCode(msg: ChatMessage): string {
  if (msg.event_code) return msg.event_code;
  const text = (msg.content || "").toLowerCase();
  if (text.includes("screenshot")) return "SCREENSHOT_TAKEN";
  if (text.includes("started screen recording") || text.includes("screen recorded")) return "SCREEN_RECORDING_STARTED";
  if (text.includes("stopped screen recording")) return "SCREEN_RECORDING_STOPPED";
  return "";
}

function firstName(msg: ChatMessage): string {
  const name = (msg.sender_name || "").trim();
  if (name) return name.split(/\s+/)[0];
  // Older events only carry "<Full Name> took a screenshot."
  const content = stripEventEmoji(msg.content || "");
  const m = content.match(/^(.+?) (took a screenshot|started screen recording|stopped screen recording|screen recorded)/i);
  return m ? m[1].trim().split(/\s+/)[0] : "Someone";
}

/**
 * Screen-capture notice text: "You …" for your own, the sender's first name
 * otherwise. Null for events that aren't shown (recording stopped).
 */
export function screenEventText(msg: ChatMessage): string | null | undefined {
  const code = inferCode(msg);
  const who = msg.is_mine ? "You" : firstName(msg);
  if (code === "SCREENSHOT_TAKEN") return `${who} took a screenshot`;
  if (code === "SCREEN_RECORDING_STARTED") return `${who} screen recorded the chat`;
  if (code === "SCREEN_RECORDING_STOPPED") return null;
  return undefined; // not a screen-capture event
}

function describe(msg: ChatMessage): EventStyle {
  const code = inferCode(msg);
  const content = stripEventEmoji(msg.content || "");
  const isVideo = content.toLowerCase().includes("video");
  const mine = Boolean(msg.is_mine);
  const kind = isVideo ? "video call" : "voice call";
  const Kind = isVideo ? "Video call" : "Voice call";

  switch (code) {
    case "SCREENSHOT_TAKEN":
      return { icon: "screenshot_monitor", tone: "neutral", title: content };
    case "SCREEN_RECORDING_STARTED":
      return { icon: "screen_record", tone: "danger", title: content };
    case "SCREEN_RECORDING_STOPPED":
      return { icon: "stop_circle", tone: "neutral", title: content };
    case "CALL_ENDED": {
      const duration = content.split("·")[1]?.trim();
      return {
        icon: isVideo ? "videocam" : mine ? "call_made" : "call_received",
        tone: "success",
        title: mine ? `Outgoing ${kind}` : `Incoming ${kind}`,
        detail: duration,
      };
    }
    case "CALL_MISSED":
    case "CALL_BUSY":
      return mine
        ? { icon: isVideo ? "missed_video_call" : "call_made", tone: "neutral", title: `${Kind} not answered` }
        : { icon: isVideo ? "missed_video_call" : "phone_missed", tone: "danger", title: `Missed ${kind}` };
    case "CALL_DECLINED":
      return {
        icon: "call_end",
        tone: "danger",
        title: mine ? `${Kind} declined` : `You declined a ${kind}`,
      };
    case "CALL_CANCELLED":
      return mine
        ? { icon: "phone_disabled", tone: "neutral", title: `Cancelled ${kind}` }
        : { icon: isVideo ? "missed_video_call" : "phone_missed", tone: "danger", title: `Missed ${kind}` };
    case "CALL_FAILED":
      return { icon: "phone_disabled", tone: "danger", title: `${Kind} failed` };
    default:
      return { icon: "info", tone: "neutral", title: content };
  }
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-on-surface/10 text-on-surface-variant",
  danger: "bg-red-500/15 text-red-500",
  success: "bg-emerald-500/15 text-emerald-500",
};

export const SystemEventMessage = memo(function SystemEventMessage({
  msg,
  onCallBack,
}: {
  msg: ChatMessage;
  onCallBack?: (video: boolean) => void;
}) {
  const screenText = screenEventText(msg);
  const style = describe(msg);
  const isCall = (msg.event_code || "").startsWith("CALL_");
  const isVideo = (msg.content || "").toLowerCase().includes("video");
  const time = formatClockTime(msg.timestamp ?? msg.created_at);

  if (isCall) {
    return (
      <div className="flex justify-center py-2">
        <div className="flex min-w-[220px] max-w-[85%] items-center gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-high px-3 py-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[style.tone]}`}
          >
            <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-semibold ${style.tone === "danger" ? "text-red-500" : "text-on-surface"}`}>
              {style.title}
            </p>
            <p className="text-[11px] text-on-surface-variant">
              {[time, style.detail].filter(Boolean).join(" · ")}
            </p>
          </div>
          {onCallBack ? (
            <button
              type="button"
              onClick={() => onCallBack(isVideo)}
              aria-label={isVideo ? "Video call back" : "Call back"}
              title={isVideo ? "Video call back" : "Call back"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
            >
              <span className="material-symbols-outlined text-[20px]">{isVideo ? "videocam" : "call"}</span>
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // Screen capture: plain text, no icon ("You took a screenshot").
  if (screenText === null) return null;
  if (screenText !== undefined) {
    return (
      <div className="flex justify-center py-2">
        <span className="max-w-[85%] rounded-full bg-surface-container-high px-3 py-1 text-center text-[11px] font-medium text-on-surface-variant">
          {screenText}
          {time ? <span className="opacity-60"> {"·"} {time}</span> : null}
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-2">
      <span className="flex max-w-[85%] items-center gap-1.5 rounded-full bg-surface-container-high px-3 py-1 text-center text-[11px] font-medium text-on-surface-variant">
        <span
          className={`material-symbols-outlined text-[15px] ${style.tone === "danger" ? "text-red-500" : ""}`}
        >
          {style.icon}
        </span>
        {style.title}
        {time ? <span className="opacity-60">{"·"} {time}</span> : null}
      </span>
    </div>
  );
});
