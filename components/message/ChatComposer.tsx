"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { VoiceInput, VoiceRecordingBar } from "@/components/ui/voice-input";
import type { ChatMessage } from "@/types";
import { EMOJI_LIST } from "./chatConstants";
import { getReplyPreview } from "./chatMessageUtils";
import { ChatComposerInput } from "./ChatComposerInput";

export function ChatComposer({
  replyingTo,
  otherProfileName,
  onCancelReply,
  showEmojiPicker,
  onAddEmoji,
  onToggleEmojiPicker,
  handleSend,
  fileInputRef,
  onFileUpload,
  isVoiceComposeActive,
  onCancelVoiceRecording,
  isRecording,
  voiceDraftReady,
  onVoiceListeningChange,
  uploading,
  sending,
  isTypingActive,
  attachmentsExpanded,
  onToggleAttachments,
  keepComposerFocus,
  onOpenCamera,
  attachmentSlideTransition,
  messageInputRef,
  composerClearToken,
  pendingEmoji,
  onEmojiAppendConsumed,
  draftRef,
  onHasTextChange,
  onFocusChange,
  onTyping,
  composerHasText,
  onSendVoiceMessage,
  showCameraCapture,
  onCloseCamera,
  onSwitchCameraFacing,
  cameraStarting,
  cameraVideoRef,
  onCapturePhoto,
}: {
  replyingTo: ChatMessage | null;
  otherProfileName?: string;
  onCancelReply: () => void;
  showEmojiPicker: boolean;
  onAddEmoji: (emoji: string) => void;
  onToggleEmojiPicker: () => void;
  handleSend: (e?: FormEvent | React.KeyboardEvent | null) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  isVoiceComposeActive: boolean;
  onCancelVoiceRecording: () => void;
  isRecording: boolean;
  voiceDraftReady: boolean;
  onVoiceListeningChange: (next: boolean) => void;
  uploading: boolean;
  sending: boolean;
  isTypingActive: boolean;
  attachmentsExpanded: boolean;
  onToggleAttachments: () => void;
  keepComposerFocus: (e: ReactPointerEvent) => void;
  onOpenCamera: () => void;
  attachmentSlideTransition: {
    type: "tween";
    duration: number;
    ease: readonly [number, number, number, number];
  };
  messageInputRef: RefObject<HTMLInputElement | null>;
  composerClearToken: number;
  pendingEmoji: string | null;
  onEmojiAppendConsumed: () => void;
  draftRef: React.MutableRefObject<string>;
  onHasTextChange: (hasText: boolean) => void;
  onFocusChange: (focused: boolean) => void;
  onTyping: () => void;
  composerHasText: boolean;
  onSendVoiceMessage: () => void;
  showCameraCapture: boolean;
  onCloseCamera: () => void;
  onSwitchCameraFacing: () => void;
  cameraStarting: boolean;
  cameraVideoRef: RefObject<HTMLVideoElement | null>;
  onCapturePhoto: () => void;
}) {
  return (
    <footer className="shrink-0 border-t border-outline-variant/30 bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 relative">
      {replyingTo && (
        <div className="mx-auto mb-2 flex max-w-4xl items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">reply</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-primary">
              Replying to{" "}
              {replyingTo.is_mine
                ? "yourself"
                : replyingTo.sender_name ?? otherProfileName ?? "message"}
            </p>
            <p className="truncate text-xs text-on-surface-variant">
              {getReplyPreview(replyingTo, otherProfileName)}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="shrink-0 rounded-full p-1 text-on-surface-variant hover:bg-secondary"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 p-3 bg-white rounded-2xl shadow-2xl border border-outline-variant grid grid-cols-4 gap-2 z-50">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onAddEmoji(emoji)}
              className="w-10 h-10 flex items-center justify-center text-xl hover:bg-secondary rounded-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          className="hidden"
          accept="image/*"
        />

        <div className="relative z-10 flex shrink-0 items-center gap-1">
          {isVoiceComposeActive ? (
            <>
              <button
                type="button"
                onClick={onCancelVoiceRecording}
                aria-label="Cancel voice recording"
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary"
              >
                <span className="material-symbols-outlined text-[22px]">delete</span>
              </button>
              <VoiceInput
                iconOnly
                listening={isRecording}
                paused={voiceDraftReady && !isRecording}
                onListeningChange={onVoiceListeningChange}
                disabled={uploading || sending}
              />
            </>
          ) : isTypingActive ? (
            <>
              <button
                type="button"
                onPointerDown={keepComposerFocus}
                onClick={onToggleAttachments}
                disabled={uploading || sending}
                aria-label={
                  attachmentsExpanded
                    ? "Hide camera, image, and voice options"
                    : "Show camera, image, and voice options"
                }
                aria-expanded={attachmentsExpanded}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary touch-manipulation"
              >
                <motion.span
                  animate={{ rotate: attachmentsExpanded ? 180 : 0 }}
                  transition={attachmentSlideTransition}
                  className="material-symbols-outlined block"
                >
                  chevron_right
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {attachmentsExpanded && (
                  <motion.div
                    key="attachment-options"
                    initial={{ width: 0, opacity: 0, x: -12 }}
                    animate={{ width: "auto", opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: -12 }}
                    transition={attachmentSlideTransition}
                    className="flex items-center gap-1 overflow-hidden"
                  >
                    <button
                      type="button"
                      onPointerDown={keepComposerFocus}
                      onClick={onOpenCamera}
                      disabled={uploading || sending}
                      aria-label="Take photo with camera"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary touch-manipulation"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                    </button>
                    <button
                      type="button"
                      onPointerDown={keepComposerFocus}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || sending}
                      aria-label="Choose image from gallery"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary touch-manipulation"
                    >
                      <span className="material-symbols-outlined">
                        {uploading ? "hourglass_top" : "image"}
                      </span>
                    </button>
                    <VoiceInput
                      listening={isRecording}
                      onListeningChange={onVoiceListeningChange}
                      disabled={uploading || sending}
                      iconOnly
                      keepComposerFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <button
                type="button"
                onPointerDown={keepComposerFocus}
                onClick={onOpenCamera}
                disabled={uploading || sending}
                aria-label="Take photo with camera"
                className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary touch-manipulation"
              >
                <span className="material-symbols-outlined">photo_camera</span>
              </button>
              <button
                type="button"
                onPointerDown={keepComposerFocus}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                aria-label="Choose image from gallery"
                className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary touch-manipulation"
              >
                <span className="material-symbols-outlined">
                  {uploading ? "hourglass_top" : "image"}
                </span>
              </button>
              <VoiceInput
                listening={isRecording}
                onListeningChange={onVoiceListeningChange}
                disabled={uploading || sending}
                iconOnly
                keepComposerFocus
              />
            </>
          )}
        </div>

        <div
          className={`flex min-w-0 flex-grow items-center rounded-full border bg-secondary px-3 py-2 ${
            isVoiceComposeActive
              ? "border-primary/20 ring-2 ring-primary/15"
              : "border-outline-variant/40 focus-within:ring-2 focus-within:ring-primary"
          }`}
        >
          {isVoiceComposeActive ? (
            <VoiceRecordingBar
              active={isRecording}
              visible={isVoiceComposeActive}
            />
          ) : (
            <>
              <ChatComposerInput
                inputRef={messageInputRef}
                placeholder={replyingTo ? "Write a reply…" : "Aa"}
                disabled={sending || uploading}
                clearToken={composerClearToken}
                appendEmoji={pendingEmoji}
                onAppendConsumed={onEmojiAppendConsumed}
                draftRef={draftRef}
                onHasTextChange={onHasTextChange}
                onFocusChange={onFocusChange}
                onSubmit={(e) => void handleSend(e)}
                onTyping={onTyping}
              />
              <button
                type="button"
                onClick={onToggleEmojiPicker}
                className="shrink-0 text-primary hover:opacity-70"
              >
                <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
              </button>
            </>
          )}
        </div>

        {isVoiceComposeActive ? (
          <button
            type="button"
            onClick={onSendVoiceMessage}
            disabled={uploading || sending}
            aria-label="Send voice message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand-br text-white shadow-lg shadow-primary/20 active:scale-90 disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              send
            </span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={(!composerHasText && !uploading) || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand-br text-white shadow-lg shadow-primary/20 active:scale-90 disabled:opacity-50"
            aria-label="Send message"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              send
            </span>
          </button>
        )}
      </form>

      {showCameraCapture && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
            <button
              type="button"
              onClick={onCloseCamera}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
              aria-label="Close camera"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <span className="text-sm font-medium">Take Photo</span>
            <button
              type="button"
              onClick={onSwitchCameraFacing}
              disabled={cameraStarting}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-50"
              aria-label="Switch camera"
            >
              <span className="material-symbols-outlined">flip_camera_ios</span>
            </button>
          </div>

          <div className="relative flex-1 min-h-0 bg-black">
            <video
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            {cameraStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                Starting camera…
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onCapturePhoto}
              disabled={cameraStarting || uploading}
              aria-label="Capture photo"
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:scale-95 disabled:opacity-50"
            />
          </div>
        </div>
      )}
    </footer>
  );
}
