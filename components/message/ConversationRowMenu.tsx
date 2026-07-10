"use client";

import { useEffect, useRef } from "react";
import type { Conversation } from "@/types";

export function ConversationRowMenu({
  convo,
  showArchived,
  open,
  onOpenChange,
  onPin,
  onMute,
  onArchive,
  onDelete,
}: {
  convo: Conversation;
  showArchived: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPin: (pinned: boolean) => void;
  onMute: (muted: boolean) => void;
  onArchive: (archived: boolean) => void;
  onDelete: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, onOpenChange]);

  const items = [
    {
      id: "pin",
      label: convo.is_pinned ? "Unpin" : "Pin",
      icon: convo.is_pinned ? "keep_off" : "push_pin",
      action: () => onPin(!convo.is_pinned),
      danger: false,
    },
    {
      id: "mute",
      label: convo.is_muted ? "Unmute" : "Mute",
      icon: convo.is_muted ? "notifications" : "notifications_off",
      action: () => onMute(!convo.is_muted),
      danger: false,
    },
    {
      id: "archive",
      label: showArchived ? "Unarchive" : "Archive",
      icon: showArchived ? "unarchive" : "inventory_2",
      action: () => onArchive(!showArchived),
      danger: false,
    },
    {
      id: "delete",
      label: "Delete",
      icon: "delete",
      action: () => onDelete(),
      danger: true,
    },
  ];

  return (
    <div className="relative shrink-0 self-center" ref={menuRef}>
      <button
        type="button"
        aria-label="Conversation options"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!open);
        }}
        className={`rounded-full p-0.5 text-on-surface-variant transition-colors hover:bg-surface-container-high ${
          open ? "bg-surface-container-high text-on-surface" : ""
        }`}
      >
        <span className="inline-flex h-4 w-4 items-center justify-center">
          <span className="material-symbols-outlined origin-center scale-[0.72] text-[18px] leading-none">
            more_vert
          </span>
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[148px] overflow-hidden rounded-xl border border-outline-variant/40 bg-surface py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onOpenChange(false);
                item.action();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-container-low ${
                item.danger ? "text-red-500" : "text-on-surface"
              } ${item.id === "delete" ? "border-t border-outline-variant/30" : ""}`}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${
                  item.danger ? "text-red-500" : "text-on-surface-variant"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
