"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, type CSSProperties } from "react";
import { EmojiStyle, SuggestionMode, Theme, type EmojiClickData } from "emoji-picker-react";
import { useTheme } from "@/contexts/ThemeContext";

// The picker is large; load it only when first opened.
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] w-full items-center justify-center text-sm text-on-surface-variant">
      <span className="material-symbols-outlined mr-2 animate-spin text-[18px]">progress_activity</span>
      Loading emojis…
    </div>
  ),
});

/** Maps the picker's CSS variables onto the app's design tokens. */
const pickerVars = {
  "--epr-bg-color": "transparent",
  "--epr-category-label-bg-color": "var(--color-background)",
  "--epr-picker-border-color": "transparent",
  "--epr-picker-border-radius": "0px",
  "--epr-text-color": "var(--color-on-surface)",
  "--epr-category-label-text-color": "var(--color-on-surface-variant)",
  "--epr-search-input-bg-color": "var(--color-secondary)",
  "--epr-search-input-bg-color-active": "var(--color-secondary)",
  "--epr-search-input-text-color": "var(--color-on-surface)",
  "--epr-search-input-placeholder-color": "var(--color-on-surface-variant)",
  "--epr-search-border-color": "transparent",
  "--epr-search-border-color-active": "var(--color-primary)",
  "--epr-search-input-border-radius": "999px",
  "--epr-search-input-height": "38px",
  "--epr-highlight-color": "var(--color-primary)",
  "--epr-hover-bg-color": "color-mix(in srgb, var(--color-primary) 14%, transparent)",
  "--epr-focus-bg-color": "color-mix(in srgb, var(--color-primary) 20%, transparent)",
  "--epr-hover-bg-color-reduced-opacity": "color-mix(in srgb, var(--color-primary) 8%, transparent)",
  "--epr-category-icon-active-color": "var(--color-primary)",
  "--epr-skin-tone-picker-menu-color": "var(--color-background)",
  "--epr-dark-bg-color": "transparent",
  "--epr-dark-category-label-bg-color": "var(--color-background)",
  "--epr-dark-text-color": "var(--color-on-surface)",
  "--epr-dark-search-input-bg-color": "var(--color-secondary)",
  "--epr-dark-search-input-bg-color-active": "var(--color-secondary)",
  "--epr-dark-hover-bg-color": "color-mix(in srgb, var(--color-primary) 14%, transparent)",
  "--epr-dark-focus-bg-color": "color-mix(in srgb, var(--color-primary) 20%, transparent)",
  "--epr-dark-highlight-color": "var(--color-primary)",
  "--epr-dark-category-icon-active-color": "var(--color-primary)",
  "--epr-dark-picker-border-color": "transparent",
  "--epr-dark-skin-tone-picker-menu-color": "var(--color-background)",
  "--epr-emoji-size": "26px",
  "--epr-emoji-padding": "6px",
  "--epr-category-navigation-button-size": "28px",
  "--epr-header-padding": "10px 12px 6px",
  "--epr-horizontal-padding": "12px",
  "--epr-category-label-height": "32px",
  "--epr-emoji-gap": "2px",
  fontFamily: "inherit",
} as CSSProperties;

/**
 * Full emoji picker anchored above the composer's emoji button.
 * Closes on outside click or Escape.
 */
export function ChatEmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      // The toggle button handles its own click.
      if ((target as HTMLElement).closest?.("[data-emoji-toggle]")) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Emoji picker"
      className="chat-emoji-picker absolute bottom-full right-0 z-50 mb-3 w-[352px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-3xl border border-outline-variant/50 bg-background/95 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur-xl"
      style={{ animation: "chatEmojiIn 160ms cubic-bezier(0.2, 0.9, 0.3, 1.2)", transformOrigin: "bottom right" }}
      // Keep the text field focused so the caret position is preserved.
      onMouseDown={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes chatEmojiIn { from { opacity: 0; transform: translateY(6px) scale(0.96); } to { opacity: 1; transform: none; } }
        .chat-emoji-picker .EmojiPickerReact { border: 0 !important; }
        .chat-emoji-picker .epr-category-nav { padding: 4px 10px 8px !important; border-bottom: 1px solid color-mix(in srgb, var(--color-on-surface) 8%, transparent); }
        .chat-emoji-picker .epr-emoji-category-label { font-size: 11px !important; font-weight: 600 !important; letter-spacing: 0.06em; text-transform: uppercase; backdrop-filter: blur(8px); }
        .chat-emoji-picker .epr-body::-webkit-scrollbar { width: 6px; }
        .chat-emoji-picker .epr-body::-webkit-scrollbar-thumb { background: color-mix(in srgb, var(--color-on-surface) 18%, transparent); border-radius: 999px; }
        .chat-emoji-picker .epr-body::-webkit-scrollbar-track { background: transparent; }
        .chat-emoji-picker .epr-btn:hover { transform: scale(1.12); transition: transform 120ms ease; }
      `}</style>

      <div className="flex items-center justify-between px-4 pb-0 pt-3">
        <p className="text-sm font-semibold text-on-surface">Emoji</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close emoji picker"
          className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <EmojiPicker
        theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
        emojiStyle={EmojiStyle.NATIVE}
        onEmojiClick={(data: EmojiClickData) => onPick(data.emoji)}
        suggestedEmojisMode={SuggestionMode.RECENT}
        lazyLoadEmojis
        autoFocusSearch={false}
        width="100%"
        height={380}
        previewConfig={{ showPreview: false }}
        searchPlaceholder="Search emoji"
        style={pickerVars}
      />
    </div>
  );
}
