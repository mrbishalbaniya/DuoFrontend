"use client";

import {
  memo,
  useEffect,
  useState,
  type FormEvent,
} from "react";

type ChatComposerInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  disabled?: boolean;
  appendEmoji: string | null;
  onAppendConsumed: () => void;
  draftRef: React.MutableRefObject<string>;
  onHasTextChange: (hasText: boolean) => void;
  onFocusChange: (focused: boolean) => void;
  onSubmit: (e: FormEvent | React.KeyboardEvent) => void;
  onTyping: () => void;
};

/** Keeps draft text local so typing does not re-render the message list. */
export const ChatComposerInput = memo(function ChatComposerInput({
  clearToken,
  ...props
}: ChatComposerInputProps & { clearToken: number }) {
  return <ChatComposerInputInner key={clearToken} {...props} />;
});

const ChatComposerInputInner = memo(function ChatComposerInputInner({
  inputRef,
  placeholder,
  disabled,
  appendEmoji,
  onAppendConsumed,
  draftRef,
  onHasTextChange,
  onFocusChange,
  onSubmit,
  onTyping,
}: ChatComposerInputProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!appendEmoji) return;
    setValue((prev) => {
      const next = prev + appendEmoji;
      draftRef.current = next;
      onHasTextChange(next.length > 0);
      return next;
    });
    onAppendConsumed();
  }, [appendEmoji, draftRef, onAppendConsumed, onHasTextChange]);

  return (
    <input
      ref={inputRef}
      className="min-w-0 flex-grow border-none bg-transparent text-sm outline-none placeholder:text-on-surface-variant focus:ring-0"
      placeholder={placeholder}
      type="text"
      value={value}
      disabled={disabled}
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit(e);
        }
      }}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        draftRef.current = next;
        onHasTextChange(next.length > 0);
        if (next.length > 0) onTyping();
      }}
    />
  );
});
