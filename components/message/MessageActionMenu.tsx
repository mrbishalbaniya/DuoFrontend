"use client";

import { memo } from "react";
import type { ChatMessage } from "@/types";
import { QUICK_REACTIONS } from "./chatConstants";

export const MessageActionMenu = memo(function MessageActionMenu({
  msg,
  open,
  onToggle,
  onCopy,
  onReply,
  onReact,
  onDeleteForMe,
  onDeleteForEveryone,
}: {
  msg: ChatMessage;
  open: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
}) {
  return (
    <div className="relative shrink-0 self-center">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label="Message options"
        aria-expanded={open}
        className={`rounded-full p-1 transition-colors ${
          open
            ? "bg-secondary text-on-surface"
            : "text-on-surface-variant/60 hover:bg-secondary hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>

      {open && (
        <div
          className={`absolute top-full z-[60] mt-1 min-w-[180px] rounded-2xl border border-outline-variant bg-background p-2 shadow-2xl ${
            msg.is_mine ? "left-0" : "right-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onCopy}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
            Copy
          </button>
          <button
            type="button"
            onClick={onReply}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">reply</span>
            Reply
          </button>

          <div className="my-2 border-t border-outline-variant/40 pt-2">
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
              React
            </p>
            <div className="flex flex-wrap gap-1 px-1">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onReact(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-secondary transition-transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/40 pt-1">
            <button
              type="button"
              onClick={onDeleteForMe}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">visibility_off</span>
              Delete for me
            </button>
            {msg.is_mine && (
              <button
                type="button"
                onClick={onDeleteForEveryone}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                Delete for everyone
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
