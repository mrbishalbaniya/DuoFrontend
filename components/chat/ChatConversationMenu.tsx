"use client";

import { useEffect, useRef, useState } from "react";

type ChatConversationMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowProfile: () => void;
  onEditNickname: () => void;
  onBlock: () => void;
  onUnmatch: () => void;
  onUnmatchBlock: () => void;
  onClearHistory: () => void;
  onReport: () => void;
};

const MENU_ITEMS = [
  { id: "profile", label: "Show profile", icon: "person", tone: "default" as const },
  { id: "nickname", label: "Edit nickname", icon: "edit", tone: "default" as const },
  { id: "block", label: "Block", icon: "block", tone: "danger" as const },
  { id: "unmatch", label: "Unmatch", icon: "heart_broken", tone: "danger" as const },
  { id: "unmatchBlock", label: "Unmatch & block", icon: "do_not_disturb_on", tone: "danger" as const },
  { id: "clear", label: "Clear chat history", icon: "delete_sweep", tone: "danger" as const },
  { id: "report", label: "Report", icon: "flag", tone: "danger" as const },
];

export function ChatConversationMenu({
  open,
  onOpenChange,
  onShowProfile,
  onEditNickname,
  onBlock,
  onUnmatch,
  onUnmatchBlock,
  onClearHistory,
  onReport,
}: ChatConversationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const handlers: Record<string, () => void> = {
    profile: onShowProfile,
    nickname: onEditNickname,
    block: onBlock,
    unmatch: onUnmatch,
    unmatchBlock: onUnmatchBlock,
    clear: onClearHistory,
    report: onReport,
  };

  const runAction = (id: string) => {
    onOpenChange(false);
    handlers[id]?.();
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-label="Conversation options"
        aria-expanded={open}
        className={`shrink-0 transition-colors max-md:ios-nav-btn md:rounded-full md:p-2 ${
          open
            ? "md:bg-surface-container-low md:text-on-surface max-md:opacity-70"
            : "md:text-on-surface-variant md:hover:bg-surface-container-low md:hover:text-on-surface"
        }`}
      >
        <span className="material-symbols-outlined text-[22px] md:text-[22px] max-md:text-[24px]">
          more_vert
        </span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-[110] md:hidden" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
              aria-label="Close menu"
              onClick={() => onOpenChange(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Conversation options"
              className="ios-sheet absolute inset-x-0 bottom-0 z-[111]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="ios-action-sheet-panel space-y-2 pt-2">
                <div className="ios-inset-group">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => runAction(item.id)}
                      className={`ios-list-row w-full border-b border-white/[0.06] last:border-b-0 ${
                        item.tone === "danger" ? "text-red-400" : "text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span className="text-[15px] font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="ios-inset-group">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="ios-action-sheet-btn ios-action-sheet-btn--cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute right-0 top-[calc(100%+0.35rem)] z-[80] hidden min-w-[220px] overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high py-1 shadow-[0_16px_40px] shadow-black/25 md:block">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => runAction(item.id)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-surface-container ${
                  item.tone === "danger" ? "text-red-400" : "text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <div className="my-1 border-t border-outline-variant/20" />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
              Cancel
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

type ChatPromptDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel: string;
  multiline?: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
};

export function ChatPromptDialog({
  open,
  title,
  description,
  initialValue = "",
  placeholder,
  confirmLabel,
  multiline = false,
  onClose,
  onConfirm,
}: ChatPromptDialogProps) {
  if (!open) return null;

  return (
    <ChatPromptDialogContent
      key={initialValue}
      title={title}
      description={description}
      initialValue={initialValue}
      placeholder={placeholder}
      confirmLabel={confirmLabel}
      multiline={multiline}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function ChatPromptDialogContent({
  title,
  description,
  initialValue,
  placeholder,
  confirmLabel,
  multiline = false,
  onClose,
  onConfirm,
}: Omit<ChatPromptDialogProps, "open">) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-[121] w-full max-w-md rounded-[1.5rem] border border-white/10 bg-background p-5 shadow-2xl">
        <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
        ) : null}
        {multiline ? (
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            rows={4}
            className="mt-4 w-full resize-none rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        ) : (
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            className="mt-4 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="ios-bar-btn-text min-h-0 px-3 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm((value ?? "").trim())}
            className="ios-bar-btn-text min-h-0 px-3 py-2 font-semibold"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type ChatConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ChatConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  onClose,
  onConfirm,
}: ChatConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-[121] w-full max-w-md rounded-[1.5rem] border border-white/10 bg-background p-5 shadow-2xl">
        <h3 className="font-[var(--font-headline)] text-lg font-bold text-on-surface">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="ios-bar-btn-text min-h-0 px-3 py-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`ios-bar-btn-text min-h-0 px-3 py-2 font-semibold ${
              destructive ? "text-red-400" : ""
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
