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
import { ChatEmojiPicker } from "./ChatEmojiPicker";
import { CameraCaptureOverlay } from "./CameraCaptureOverlay";
import { getReplyPreview } from "./chatMessageUtils";
import { ChatComposerInput } from "./ChatComposerInput";

export function ChatComposer({
  replyingTo,
  otherProfileName,
  onCancelReply,
  showEmojiPicker,
  onAddEmoji,
  onToggleEmojiPicker,
  onCloseEmojiPicker,
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
  onShareLocation,
  sharingLocation,
}: {
  replyingTo: ChatMessage | null;
  otherProfileName?: string;
  onCancelReply: () => void;
  showEmojiPicker: boolean;
  onAddEmoji: (emoji: string) => void;
  onToggleEmojiPicker: () => void;
  onCloseEmojiPicker: () => void;
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
  onShareLocation: () => void;
  sharingLocation: boolean;
}) {
  return (
    <footer className="shrink-0 border-t border-outline-variant/30 bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 relative">
      {replyingTo && (
        <div className="mb-2 flex w-full items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
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

      <form onSubmit={handleSend} className="flex w-full items-center gap-2">
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
                    <button
                      type="button"
                      onPointerDown={keepComposerFocus}
                      onClick={onShareLocation}
                      disabled={uploading || sending || sharingLocation}
                      aria-label="Share your location"
                      title="Share location"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary touch-manipulation disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined ${sharingLocation ? "animate-pulse" : ""}`}>
                        location_on
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
                    <button
                      type="button"
                      onPointerDown={keepComposerFocus}
                      onClick={onShareLocation}
                      disabled={uploading || sending || sharingLocation}
                      aria-label="Share your location"
                      title="Share location"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary touch-manipulation disabled:opacity-50"
                    >
                      <span className={`material-symbols-outlined ${sharingLocation ? "animate-pulse" : ""}`}>
                        location_on
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
          className="flex min-w-0 flex-grow items-center rounded-full bg-secondary px-3 py-2"
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
              <div className="relative shrink-0">
                <button
                  type="button"
                  data-emoji-toggle
                  onPointerDown={keepComposerFocus}
                  onClick={onToggleEmojiPicker}
                  aria-label={showEmojiPicker ? "Close emoji picker" : "Open emoji picker"}
                  aria-expanded={showEmojiPicker}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    showEmojiPicker ? "bg-primary/15 text-primary" : "text-primary hover:bg-primary/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showEmojiPicker ? "keyboard" : "sentiment_satisfied"}
                  </span>
                </button>
                {showEmojiPicker && (
                  <ChatEmojiPicker onPick={onAddEmoji} onClose={onCloseEmojiPicker} />
                )}
              </div>
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
        <CameraCaptureOverlay
          videoRef={cameraVideoRef}
          starting={cameraStarting}
          busy={uploading}
          onClose={onCloseCamera}
          onCapture={onCapturePhoto}
          onSwitchCamera={onSwitchCameraFacing}
          onOpenGallery={() => {
            onCloseCamera();
            fileInputRef.current?.click();
          }}
        />
      )}
    </footer>
  );
}
