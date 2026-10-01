"use client";

import {
  memo,
  useEffect,
  useRef,
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
}: ChatComposerInputProps & { clearToken: number }) {
  const [value, setValue] = useState("");

  // Clear in place when a message is sent. (Remounting the <input> via a
  // key would drop keyboard focus after every send.)
  const [seenClearToken, setSeenClearToken] = useState(clearToken);
  if (seenClearToken !== clearToken) {
    setSeenClearToken(clearToken);
    setValue("");
  }
  const lastClearToken = useRef(clearToken);
  useEffect(() => {
    if (lastClearToken.current === clearToken) return;
    lastClearToken.current = clearToken;
    draftRef.current = "";
    onHasTextChange(false);
  }, [clearToken, draftRef, onHasTextChange]);

  // Insert each pending emoji / starter exactly once. React re-runs effects on
  // mount in development (and the parent clears the value asynchronously), which
  // used to append the same text twice when the composer mounted with it pending.
  const appendedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!appendEmoji) {
      appendedRef.current = null;
      return;
    }
    if (appendedRef.current === appendEmoji) return;
    appendedRef.current = appendEmoji;
    const next = draftRef.current + appendEmoji;
    draftRef.current = next;
    setValue(next);
    onHasTextChange(next.length > 0);
    onAppendConsumed();
  }, [appendEmoji, draftRef, onAppendConsumed, onHasTextChange]);

  return (
    <input
      ref={inputRef}
      className="min-w-0 flex-grow border-none bg-transparent text-sm outline-none placeholder:text-on-surface-variant focus:ring-0"
      placeholder={placeholder}
      type="text"
      value={value}
      // readOnly (not disabled) so the field keeps focus while a message sends.
      readOnly={disabled}
      aria-disabled={disabled || undefined}
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
