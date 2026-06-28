"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { MatchInsightsPanel } from "@/components/chat/MatchInsightsPanel";
import {
  ChatConfirmDialog,
  ChatConversationMenu,
  ChatPromptDialog,
} from "@/components/chat/ChatConversationMenu";
import { ProfileDetailSheet } from "@/components/discover/profileDiscoverUi";
import {
  ChatMessagesSkeleton,
  ChatPageSkeleton,
} from "@/components/skeletons/ChatPageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { closeChatSocket, getChatWebSocketUrl } from "@/lib/chatWebSocket";
import { resolveMediaUrl, resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import { VoiceInput, VoiceRecordingBar } from "@/components/ui/voice-input";
import VoiceMessageBubble from "@/components/ui/voice-message-bubble";
import type { ChatMessage, Conversation } from "@/types";

const VOICE_MESSAGE_LABEL = "🎤 Voice message";
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];
const EMOJI_LIST = [
  "❤️",
  "🙌",
  "🔥",
  "😂",
  "😮",
  "😢",
  "😡",
  "👍",
  "✨",
  "🙏",
  "💯",
  "🎉",
  "🌹",
  "🍷",
  "💖",
  "🥰",
];

function isAudioMediaUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(webm|ogg|mp3|wav|m4a|aac)(\?|$)/i.test(url);
}

function isVoiceMessage(msg: ChatMessage): boolean {
  return msg.content === VOICE_MESSAGE_LABEL || isAudioMediaUrl(msg.image_url);
}

function isSentImageOnly(msg: ChatMessage): boolean {
  if (!msg.is_mine || msg.is_deleted_for_everyone || !msg.image_url) return false;
  if (isVoiceMessage(msg)) return false;
  return !msg.content?.trim();
}

function isVoiceOnlyMessage(msg: ChatMessage): boolean {
  if (!isVoiceMessage(msg) || msg.is_deleted_for_everyone || !msg.image_url) return false;
  const text = msg.content?.trim();
  return !text || text === VOICE_MESSAGE_LABEL;
}

function isTextOnlyMessage(msg: ChatMessage): boolean {
  if (isVoiceMessage(msg) || msg.image_url) return false;
  return Boolean(msg.content?.trim()) || Boolean(msg.is_deleted_for_everyone);
}

function isCompactBubble(msg: ChatMessage): boolean {
  return isVoiceOnlyMessage(msg) || isTextOnlyMessage(msg);
}

function messageBubblePadding(msg: ChatMessage): string {
  if (isSentImageOnly(msg)) return "p-0";
  if (isCompactBubble(msg)) return "px-2 py-1";
  return "p-3";
}

function normalizeMessages(raw: ChatMessage[]): ChatMessage[] {
  return [...raw]
    .map((msg) => ({
      ...msg,
      image_url: resolveMediaUrl(msg.image_url) ?? msg.image_url,
      is_mine: msg.is_mine ?? false,
      reactions: msg.reactions ? normalizeReactionsOnePerUser(msg.reactions) : msg.reactions,
    }))
    .sort((a, b) => {
      const timeA = new Date(a.timestamp ?? a.created_at ?? 0).getTime();
      const timeB = new Date(b.timestamp ?? b.created_at ?? 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id;
    });
}

function parseReactionUserIds(value: unknown): number[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
  }
  // Scalar numbers from the API are reaction counts, not user IDs.
  if (typeof value === "string" && value.trim() !== "") {
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? [id] : [];
  }
  return [];
}

function normalizeReactionsInput(reactions: unknown): Record<string, number[]> {
  if (!reactions || typeof reactions !== "object" || Array.isArray(reactions)) {
    return {};
  }

  const next: Record<string, number[]> = {};
  for (const [emoji, rawIds] of Object.entries(reactions as Record<string, unknown>)) {
    const ids = parseReactionUserIds(rawIds);
    if (ids.length > 0) next[emoji] = ids;
  }
  return next;
}

function normalizeReactionsOnePerUser(reactions: unknown): Record<string, number[]> {
  const userToEmoji = new Map<number, string>();
  for (const [emoji, ids] of Object.entries(normalizeReactionsInput(reactions))) {
    for (const id of ids) {
      userToEmoji.set(id, emoji);
    }
  }
  const next: Record<string, number[]> = {};
  for (const [userId, emoji] of userToEmoji) {
    if (!next[emoji]) next[emoji] = [];
    next[emoji].push(userId);
  }
  return next;
}

type ReactionsMap = Record<string, number | number[]> | undefined;

function setUserReactionOnMessage(
  reactions: ReactionsMap,
  userId: number,
  emoji: string
): Record<string, number[]> {
  const next: Record<string, number[]> = {};
  const normalized = normalizeReactionsOnePerUser(reactions ?? {});

  for (const [existingEmoji, ids] of Object.entries(normalized)) {
    const filtered = ids.filter((id) => Number(id) !== Number(userId));
    if (filtered.length > 0) next[existingEmoji] = filtered;
  }

  next[emoji] = [...(next[emoji] ?? []), Number(userId)];
  return next;
}

function removeUserReaction(
  reactions: ReactionsMap,
  userId: number
): Record<string, number[]> {
  const next: Record<string, number[]> = {};
  for (const [emoji, ids] of Object.entries(normalizeReactionsOnePerUser(reactions ?? {}))) {
    const filtered = ids.filter((id) => Number(id) !== Number(userId));
    if (filtered.length > 0) next[emoji] = filtered;
  }
  return next;
}

function reactionIncludesUser(ids: number[], userId: number): boolean {
  return ids.some((id) => Number(id) === Number(userId));
}

function applyUserReaction(
  reactions: ReactionsMap,
  userId: number,
  emoji: string
): Record<string, number[]> {
  const normalized = normalizeReactionsOnePerUser(reactions ?? {});
  const hadSameEmoji = reactionIncludesUser(normalized[emoji] ?? [], userId);
  const next: Record<string, number[]> = {};

  for (const [existingEmoji, ids] of Object.entries(normalized)) {
    const filtered = ids.filter((id) => Number(id) !== Number(userId));
    if (filtered.length > 0) next[existingEmoji] = filtered;
  }

  if (!hadSameEmoji) {
    next[emoji] = [...(next[emoji] ?? []), Number(userId)];
  }

  return next;
}

function getReactionEmojiForUser(
  reactions: ReactionsMap,
  userId: number
): string | null {
  if (!reactions) return null;
  const normalized = normalizeReactionsOnePerUser(reactions);
  for (const [emoji, ids] of Object.entries(normalized)) {
    if (reactionIncludesUser(ids, userId)) return emoji;
  }
  return null;
}

function getReactionEmojiForOtherUsers(
  reactions: ReactionsMap,
  currentUserId: number
): string | null {
  if (!reactions) return null;
  const normalized = normalizeReactionsOnePerUser(reactions);
  for (const [emoji, ids] of Object.entries(normalized)) {
    if (ids.some((id) => Number(id) !== Number(currentUserId))) return emoji;
  }
  return null;
}

function ReactionBadge({ emoji }: { emoji: string }) {
  return (
    <span
      role="img"
      aria-label={`Reaction ${emoji}`}
      className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-background px-1.5 text-[17px] leading-none shadow-sm"
    >
      {emoji}
    </span>
  );
}

function getCopyableText(msg: ChatMessage): string {
  if (msg.is_deleted_for_everyone) return "";
  if (isVoiceMessage(msg)) return VOICE_MESSAGE_LABEL;
  if (msg.content?.trim()) return msg.content.trim();
  if (msg.image_url && !isVoiceMessage(msg)) return msg.image_url;
  return "";
}

function getReplyPreview(msg: ChatMessage, fallbackName?: string): string {
  if (msg.is_deleted_for_everyone) return "Message deleted";
  const text = getCopyableText(msg);
  if (text) return text.length > 80 ? `${text.slice(0, 80)}…` : text;
  return fallbackName ? `Message from ${fallbackName}` : "Message";
}

function MessageActionMenu({
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
}

function lastMessagePreview(convo: Conversation): string {
  if (typeof convo.last_message === "string") return convo.last_message;
  return convo.last_message?.content || "Start the conversation!";
}

function getConversationLastActivity(convo: Conversation): string | undefined {
  if (convo.last_message_at) return convo.last_message_at;
  if (convo.updated_at) return convo.updated_at;
  const lastMessage = convo.last_message;
  if (lastMessage && typeof lastMessage === "object") {
    return lastMessage.timestamp || lastMessage.created_at;
  }
  return convo.created_at;
}

function formatMessageTime(iso?: string): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    const now = new Date();
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return "";
  }
}

function touchConversationInList(
  conversations: Conversation[],
  convoId: number,
  preview: string,
  iso: string,
  isMine: boolean
): Conversation[] {
  const label = isMine ? `You: ${preview}` : preview;
  const next = conversations.map((c) =>
    c.id === convoId
      ? {
          ...c,
          last_message_at: iso,
          last_message: label,
        }
      : c
  );

  return next.sort(
    (a, b) =>
      new Date(getConversationLastActivity(b) || 0).getTime() -
      new Date(getConversationLastActivity(a) || 0).getTime()
  );
}

function formatClockTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
}: {
  src?: string | null;
  name?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "w-8 h-8" : "w-12 h-12";
  const iconSize = size === "sm" ? "text-xs" : "text-sm";
  return (
    <div
      className={`${dim} rounded-full overflow-hidden bg-surface-container border border-primary/15 shrink-0 ${className}`}
    >
      {src ? (
        <img className="w-full h-full object-cover" alt="" src={resolveMediaUrl(src) ?? src} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className={`material-symbols-outlined ${iconSize} text-primary/30`}>person</span>
        </div>
      )}
    </div>
  );
}

export default function MessagesSection() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDraftReady, setVoiceDraftReady] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<"environment" | "user">("environment");
  const [cameraStarting, setCameraStarting] = useState(false);
  const [activeMessageMenu, setActiveMessageMenu] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isMobile, setIsMobile] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [unmatchDialogOpen, setUnmatchDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [chatActionNotice, setChatActionNotice] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const lastTypingSignalRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const isResizing = useRef(false);
  const pendingImagePreviewRef = useRef<string | null>(null);

  const clearPendingImage = useCallback(() => {
    if (pendingImagePreviewRef.current) {
      URL.revokeObjectURL(pendingImagePreviewRef.current);
      pendingImagePreviewRef.current = null;
    }
    setPendingImageFile(null);
    setPendingImagePreview(null);
  }, []);

  const queueImageForConfirm = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      clearPendingImage();
      const preview = URL.createObjectURL(file);
      pendingImagePreviewRef.current = preview;
      setPendingImageFile(file);
      setPendingImagePreview(preview);
    },
    [clearPendingImage]
  );

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((convo) => {
      const name =
        convo.other_user_nickname?.trim() ||
        convo.other_user_profile?.full_name?.toLowerCase() ||
        "";
      const preview = lastMessagePreview(convo).toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }, [conversations, search]);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const showMobileThread = selectedId != null;
  const mobileSlideTransition = { type: "tween" as const, duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };
  const visibleMessages = useMemo(
    () => messages.filter((msg) => !msg.is_deleted_for_me),
    [messages]
  );
  const otherProfile = selected?.other_user_profile;
  const otherDisplayName =
    selected?.other_user_nickname?.trim() || otherProfile?.full_name || "Match";
  const isTypingActive = isInputFocused || newMessage.length > 0;
  const attachmentSlideTransition = {
    type: "tween" as const,
    duration: 0.24,
    ease: [0.32, 0.72, 0, 1] as const,
  };

  const scrollToLatestMessage = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messageListRef.current;
    if (!container) return;

    if (behavior === "auto") {
      container.scrollTop = container.scrollHeight;
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const isNearBottomOfMessages = useCallback(() => {
    const container = messageListRef.current;
    if (!container) return true;
    const threshold = 120;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
    );
  }, []);

  const loadConversations = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoadingConversations(true);
    try {
      const data = await api.getConversations();
      setConversations(
        [...data].sort(
          (a, b) =>
            new Date(getConversationLastActivity(b) || 0).getTime() -
            new Date(getConversationLastActivity(a) || 0).getTime()
        )
      );
    } catch {
      /* ignore */
    } finally {
      if (!options?.silent) setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (convoId: number, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoadingMessages(true);
    try {
      const data = await api.getMessages(convoId);
      const normalized = normalizeMessages(data as ChatMessage[]);
      setMessages(normalized);
      if (normalized.length > 0) {
        const last = normalized[normalized.length - 1];
        const ts = last.timestamp ?? last.created_at;
        if (ts) {
          const preview =
            last.content?.trim() ||
            (last.image_url ? (isVoiceMessage(last) ? VOICE_MESSAGE_LABEL : "Photo") : "Message");
          setConversations((prev) =>
            touchConversationInList(prev, convoId, preview, ts, !!last.is_mine)
          );
        }
      }
      const convoDetail = await api.getConversationDetail(convoId);
      setIsOtherUserTyping(Boolean(convoDetail.is_other_user_typing));
    } catch (err) {
      console.error(err);
    } finally {
      if (!options?.silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!isTypingActive) setAttachmentsExpanded(false);
  }, [isTypingActive]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) void loadConversations();
  }, [user, authLoading, router, loadConversations]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const param = searchParams.get("conversation");
    if (!param || loadingConversations) return;
    const id = Number(param);
    if (!Number.isNaN(id) && conversations.some((c) => c.id === id)) {
      setSelectedId(id);
    }
  }, [searchParams, loadingConversations, conversations]);

  useEffect(() => {
    if (!selectedId) return;
    setMessages([]);
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    setInsightsOpen(false);
    setChatMenuOpen(false);
    setProfileSheetOpen(false);
    setNicknameDialogOpen(false);
    setUnmatchDialogOpen(false);
    setClearDialogOpen(false);
    setReportDialogOpen(false);
    setChatActionNotice(null);
    clearPendingImage();
  }, [selectedId, clearPendingImage]);

  useEffect(() => () => clearPendingImage(), [clearPendingImage]);

  useEffect(() => {
    if (!selectedId || loadingMessages) return;
    if (visibleMessages.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToLatestMessage("auto"));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedId, loadingMessages, visibleMessages.length, scrollToLatestMessage]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container || !selectedId || loadingMessages) return;

    const observer = new ResizeObserver(() => {
      if (isNearBottomOfMessages()) {
        scrollToLatestMessage("auto");
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [selectedId, loadingMessages, visibleMessages.length, scrollToLatestMessage, isNearBottomOfMessages]);

  useEffect(() => {
    if (!selectedId) {
      if (searchParams.get("conversation")) {
        router.replace("/chat", { scroll: false });
      }
      return;
    }
    const current = searchParams.get("conversation");
    if (current === String(selectedId)) return;
    router.replace(`/chat?conversation=${selectedId}`, { scroll: false });
  }, [selectedId, searchParams, router]);

  useEffect(() => {
    if (loadingConversations || selectedId || searchParams.get("conversation")) return;
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;
    const first = filteredConversations[0];
    if (first) setSelectedId(first.id);
  }, [loadingConversations, selectedId, filteredConversations, searchParams]);

  useEffect(() => {
    if (!selectedId || !user?.id) return;

    let cancelled = false;
    let socket: WebSocket | null = null;

    void (async () => {
      try {
        const ticket = await api.getWsTicket(Number(selectedId));
        if (cancelled) return;

        const wsUrl = getChatWebSocketUrl(selectedId, ticket);
        socket = new WebSocket(wsUrl);
        socketRef.current = socket;

    socket.onopen = () => {
      if (cancelled) {
        closeChatSocket(socket, "unmounted");
      }
    };

    socket.onmessage = (e) => {
      const data = JSON.parse(e.data as string) as Record<string, unknown>;

      if (data.type === "chat_message") {
        const newMsg: ChatMessage = {
          id: data.id as number,
          sender_id: data.sender_id as number,
          content: (data.content as string) || "",
          image_url: resolveMediaUrl(data.image_url as string),
          timestamp: data.timestamp as string,
          sender_name: data.sender_name as string,
          is_mine: data.sender_id === user.id,
          is_read: false,
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        const preview =
          newMsg.content?.trim() ||
          (newMsg.image_url ? (isVoiceMessage(newMsg) ? VOICE_MESSAGE_LABEL : "Photo") : "Message");
        const ts = newMsg.timestamp ?? new Date().toISOString();
        setConversations((prev) =>
          touchConversationInList(prev, selectedId, preview, ts, newMsg.is_mine ?? false)
        );
        window.requestAnimationFrame(() => scrollToLatestMessage("smooth"));
      } else if (data.type === "typing_status") {
        if (data.user_id !== user.id) {
          setIsOtherUserTyping(Boolean(data.is_typing));
          if (data.is_typing) {
            setTimeout(() => setIsOtherUserTyping(false), 3000);
          }
        }
      } else if (data.type === "message_deleted") {
        const id = data.id as number;
        const userId = data.user_id as number;
        const deleteType = data.delete_type as "for_me" | "for_everyone";
        setMessages((prev) => {
          if (deleteType === "for_everyone") {
            return prev.map((m) =>
              m.id === id
                ? {
                    ...m,
                    is_deleted_for_everyone: true,
                    content: "This message was deleted",
                    image_url: "",
                  }
                : m
            );
          }
          if (userId === user.id) {
            return prev.filter((m) => m.id !== id);
          }
          return prev;
        });
      } else if (data.type === "message_reacted") {
        const id = data.id as number;
        const eventUserId = Number(data.user_id);
        const eventEmoji = typeof data.emoji === "string" ? data.emoji : undefined;
        const incomingIds = normalizeReactionsInput(data.reactions);

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== id) return m;

            if (Object.values(incomingIds).some((ids) => ids.length > 0)) {
              return { ...m, reactions: normalizeReactionsOnePerUser(incomingIds) };
            }

            if (!Number.isFinite(eventUserId) || eventUserId <= 0 || !eventEmoji) {
              return m;
            }

            // Own reaction is already applied optimistically; re-applying toggles it off.
            if (eventUserId === Number(user.id)) {
              return m;
            }

            const local = normalizeReactionsOnePerUser(m.reactions ?? {});
            const hadReaction = getReactionEmojiForUser(local, eventUserId);
            const serverCounts = data.reactions as Record<string, unknown> | undefined;
            const countVal = serverCounts?.[eventEmoji];
            const serverCount =
              typeof countVal === "number"
                ? countVal
                : Array.isArray(countVal)
                  ? countVal.length
                  : null;

            if (hadReaction === eventEmoji && serverCount === 0) {
              return {
                ...m,
                reactions: removeUserReaction(m.reactions, eventUserId),
              };
            }

            return {
              ...m,
              reactions: setUserReactionOnMessage(m.reactions, eventUserId, eventEmoji),
            };
          })
        );
      }
    };

      } catch (err) {
        console.error("WebSocket connection failed:", err);
      }
    })();

    return () => {
      cancelled = true;
      closeChatSocket(socket, "conversation changed");
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [selectedId, user?.id, scrollToLatestMessage]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    };
  }, []);

  const stopCameraStream = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, []);

  const startCameraStream = useCallback(async (facingMode: "environment" | "user") => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Camera capture is not supported in this browser.");
      return false;
    }

    stopCameraStream();
    setCameraStarting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      return true;
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Camera permission is required to capture a photo.");
      stopCameraStream();
      return false;
    } finally {
      setCameraStarting(false);
    }
  }, [stopCameraStream]);

  useEffect(() => {
    if (!showCameraCapture) return;

    void (async () => {
      const ok = await startCameraStream(cameraFacingMode);
      if (!ok) setShowCameraCapture(false);
    })();

    return () => {
      stopCameraStream();
    };
  }, [showCameraCapture, cameraFacingMode, startCameraStream, stopCameraStream]);

  useEffect(() => {
    if (!isRecording) return;
    const intervalId = setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRecording]);

  useEffect(() => {
    if (activeMessageMenu === null) return;
    const closeMenu = () => setActiveMessageMenu(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [activeMessageMenu]);

  const resetVoiceSession = () => {
    setIsRecording(false);
    setVoiceDraftReady(false);
    setRecordingSeconds(0);
    recordingChunksRef.current = [];
    mediaRecorderRef.current = null;
  };

  const isVoiceComposeActive = isRecording || voiceDraftReady;

  /** Keep the text field focused when tapping composer tools on mobile (avoids lost taps). */
  const keepComposerFocus = (e: ReactPointerEvent) => {
    e.preventDefault();
  };

  const openCameraCapture = () => {
    if (uploading || sending || isVoiceComposeActive) return;
    setShowCameraCapture(true);
  };

  const closeCameraCapture = () => {
    stopCameraStream();
    setShowCameraCapture(false);
    setCameraFacingMode("environment");
  };

  const switchCameraFacing = () => {
    setCameraFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleBackToList = () => {
    setSelectedId(null);
    setReplyingTo(null);
    setInsightsOpen(false);
    setChatMenuOpen(false);
    router.replace("/chat", { scroll: false });
  };

  const updateConversationNickname = useCallback(
    async (nickname: string) => {
      if (!selectedId) return;
      try {
        const result = await api.updateConversationNickname(selectedId, nickname);
        setConversations((prev) =>
          prev.map((convo) =>
            convo.id === selectedId
              ? { ...convo, other_user_nickname: result.nickname }
              : convo
          )
        );
        setChatActionNotice(nickname ? "Nickname updated." : "Nickname removed.");
      } catch {
        setChatActionNotice("Could not update nickname.");
      } finally {
        setNicknameDialogOpen(false);
      }
    },
    [selectedId]
  );

  const handleClearChatHistory = useCallback(async () => {
    if (!selectedId) return;
    try {
      await api.clearConversationHistory(selectedId);
      setMessages([]);
      setClearDialogOpen(false);
      setChatActionNotice("Chat history cleared.");
    } catch {
      setChatActionNotice("Could not clear chat history.");
    }
  }, [selectedId]);

  const handleUnmatchBlock = useCallback(async () => {
    if (!selectedId) return;
    try {
      await api.unmatchConversation(selectedId);
      setConversations((prev) => prev.filter((convo) => convo.id !== selectedId));
      setUnmatchDialogOpen(false);
      handleBackToList();
    } catch {
      setChatActionNotice("Could not unmatch. Please try again.");
      setUnmatchDialogOpen(false);
    }
  }, [selectedId]);

  const handleReportUser = useCallback(
    async (reason: string) => {
      if (!selectedId) return;
      try {
        await api.reportConversation(selectedId, reason);
        setReportDialogOpen(false);
        setChatActionNotice("Report submitted. Thank you.");
      } catch {
        setChatActionNotice("Could not submit report.");
        setReportDialogOpen(false);
      }
    },
    [selectedId]
  );

  const selectConversation = (convo: Conversation) => {
    setActiveMessageMenu(null);
    setReplyingTo(null);
    setSelectedId(convo.id);
  };

  const buildMessageContent = (rawContent: string): string => {
    const trimmed = rawContent.trim();
    if (!replyingTo || !trimmed) return trimmed;

    const sender = replyingTo.is_mine
      ? "You"
      : replyingTo.sender_name ?? otherProfile?.full_name ?? "Them";
    const preview = getReplyPreview(replyingTo, otherProfile?.full_name);
    return `↩ ${sender}: ${preview}\n${trimmed}`;
  };

  const handleSend = async (
    e?: FormEvent | null,
    imageUrl: string | null = null,
    contentOverride?: string
  ) => {
    if (e) e.preventDefault();
    const rawContent = contentOverride ?? newMessage.trim();
    const content = buildMessageContent(rawContent);
    if (!content && !imageUrl) return;
    if (!selectedId || sending) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "chat_message",
          content,
          image_url: imageUrl || "",
        })
      );
      setNewMessage("");
      setReplyingTo(null);
      setShowEmojiPicker(false);
      setAttachmentsExpanded(false);
      return;
    }

    try {
      setSending(true);
      const msg = await api.sendMessage(selectedId, content, imageUrl || "");
      const normalized = normalizeMessages([msg as ChatMessage])[0];
      setMessages((prev) => [...prev, normalized]);
      const ts = normalized.timestamp ?? normalized.created_at ?? new Date().toISOString();
      const preview =
        normalized.content?.trim() ||
        (normalized.image_url
          ? isVoiceMessage(normalized)
            ? VOICE_MESSAGE_LABEL
            : "Photo"
          : "Message");
      setConversations((prev) =>
        touchConversationInList(prev, selectedId, preview, ts, true)
      );
      setNewMessage("");
      setReplyingTo(null);
      setShowEmojiPicker(false);
      setAttachmentsExpanded(false);
      window.requestAnimationFrame(() => scrollToLatestMessage("smooth"));
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const uploadAndSendFile = async (file: File, content = "") => {
    try {
      setUploading(true);
      const data = await api.uploadChatImage(file);
      await handleSend(null, resolveMediaUrl(data.image_url) ?? data.image_url, content);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const confirmSendPendingImage = async () => {
    if (!pendingImageFile || uploading || sending) return;
    const file = pendingImageFile;
    clearPendingImage();
    await uploadAndSendFile(file);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    queueImageForConfirm(file);
  };

  const capturePhotoFromCamera = async () => {
    const video = cameraVideoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) return;

    closeCameraCapture();
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    queueImageForConfirm(file);
  };

  const sendVoiceRecording = async () => {
    const blob = new Blob(recordingChunksRef.current, {
      type: recordingChunksRef.current[0]?.type || "audio/webm",
    });
    recordingChunksRef.current = [];

    if (blob.size === 0) return;

    const extension = blob.type.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: blob.type });
    await uploadAndSendFile(file, VOICE_MESSAGE_LABEL);
  };

  const finalizeVoiceRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      setVoiceDraftReady(false);
      return;
    }

    setIsRecording(false);
    setVoiceDraftReady(false);

    await new Promise<void>((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        resolve();
      };
      recorder.stop();
    });

    mediaRecorderRef.current = null;
  };

  const pauseVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      setIsRecording(false);
      return;
    }

    if (typeof recorder.pause === "function") {
      recorder.pause();
      setIsRecording(false);
      setVoiceDraftReady(true);
      return;
    }

    void finalizeVoiceRecording().then(() => {
      if (recordingChunksRef.current.length > 0) {
        setVoiceDraftReady(true);
      }
    });
  };

  const resumeVoiceRecording = (): boolean => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return false;

    recorder.resume();
    setIsRecording(true);
    setVoiceDraftReady(true);
    return true;
  };

  const sendVoiceMessage = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await finalizeVoiceRecording();
    }

    if (recordingChunksRef.current.length === 0) {
      resetVoiceSession();
      return;
    }

    await sendVoiceRecording();
    resetVoiceSession();
  };

  const startVoiceRecording = async (): Promise<boolean> => {
    if (isRecording || uploading || sending) return false;

    if (mediaRecorderRef.current?.state === "paused") {
      return resumeVoiceRecording();
    }

    if (mediaRecorderRef.current) return false;

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Voice recording is not supported in this browser.");
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setVoiceDraftReady(true);
      setRecordingSeconds(0);
      return true;
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone permission is required to send voice messages.");
      return false;
    }
  };

  const cancelVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
      };
      recorder.stop();
    }

    resetVoiceSession();
  };

  const handleVoiceListeningChange = (next: boolean) => {
    if (next) {
      if (voiceDraftReady && mediaRecorderRef.current?.state === "paused") {
        resumeVoiceRecording();
      } else {
        void startVoiceRecording();
      }
    } else if (isRecording) {
      pauseVoiceRecording();
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReact = (messageId: number, emoji: string) => {
    if (!user?.id) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: applyUserReaction(m.reactions, user.id, emoji),
            }
          : m
      )
    );
    setActiveMessageMenu(null);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "message_reaction",
          id: messageId,
          user_id: user.id,
          emoji,
        })
      );
    } else {
      void api.reactToMessage(messageId, emoji).catch(() => undefined);
    }
  };

  const handleDelete = (messageId: number, deleteType: "for_me" | "for_everyone") => {
    setActiveMessageMenu(null);
    if (replyingTo?.id === messageId) setReplyingTo(null);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "delete_message",
          id: messageId,
          user_id: user?.id,
          delete_type: deleteType,
        })
      );
    } else {
      void api.deleteMessage(messageId, deleteType).catch(() => undefined);
    }
  };

  const handleCopyMessage = async (msg: ChatMessage) => {
    const text = getCopyableText(msg);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API may be unavailable.
    }
    setActiveMessageMenu(null);
  };

  const handleReplyToMessage = (msg: ChatMessage) => {
    setReplyingTo(msg);
    setActiveMessageMenu(null);
    setShowEmojiPicker(false);
    setAttachmentsExpanded(false);
    requestAnimationFrame(() => messageInputRef.current?.focus());
  };

  const handleTyping = () => {
    if (!selectedId) return;
    const now = Date.now();
    if (now - lastTypingSignalRef.current > 2000) {
      lastTypingSignalRef.current = now;
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "typing",
            user_id: user?.id,
            is_typing: true,
          })
        );
      } else {
        void api.sendTypingHeartbeat(selectedId).catch(() => undefined);
      }
    }
  };

  const startResize = (e: ReactMouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: globalThis.MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSidebarWidth(Math.min(520, Math.max(200, ev.clientX - rect.left)));
    };

    const onUp = () => {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (authLoading || loadingConversations) {
    return <ChatPageSkeleton />;
  }

  if (conversations.length === 0) {
    return (
      <>
        <div className="flex h-full flex-col items-center justify-center bg-surface p-6">
          <span className="material-symbols-outlined text-6xl text-primary/20 mb-6">chat</span>
          <h2 className="text-2xl font-[var(--font-headline)] font-bold text-on-surface mb-2">
            No conversations yet
          </h2>
          <p className="text-on-surface-variant mb-8 text-center max-w-xs">
            Start swiping to find matches and begin chatting!
          </p>
          <Link
            href="/match"
            className="px-8 py-3 gradient-brand text-white rounded-full font-bold shadow-lg active:scale-95 transition-all"
          >
            Find Matches
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={containerRef} className="relative flex min-h-0 flex-1 overflow-hidden bg-surface">
        <motion.aside
          style={{ ["--msg-sidebar-w" as string]: `${sidebarWidth}px` } as CSSProperties}
          initial={false}
          animate={{
            x: isMobile ? (showMobileThread ? "-100%" : "0%") : 0,
          }}
          transition={mobileSlideTransition}
          className="flex shrink-0 flex-col overflow-hidden border-r border-outline-variant bg-background w-full lg:w-[var(--msg-sidebar-w)] lg:min-w-[200px] lg:max-w-[520px] max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-10 max-lg:w-full"
        >
          <div className="border-b border-outline-variant p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-base font-bold font-[var(--font-headline)] text-on-surface sm:text-lg">
                  Messages
                </h2>
                {totalUnread > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void loadConversations()}
                className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors"
                title="Refresh"
              >
                <span
                  className={`material-symbols-outlined text-[20px] text-on-surface-variant ${
                    loadingConversations ? "animate-spin" : ""
                  }`}
                >
                  refresh
                </span>
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div
            data-lenis-prevent
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain hide-scrollbar"
          >
            {filteredConversations.length === 0 ? (
              <p className="p-6 text-center text-sm text-on-surface-variant">No matches for your search.</p>
            ) : (
              filteredConversations.map((convo) => {
                const isSelected = selectedId === convo.id;
                const preview = lastMessagePreview(convo);
                const time = formatMessageTime(getConversationLastActivity(convo));
                return (
                  <button
                    key={convo.id}
                    type="button"
                    onClick={() => selectConversation(convo)}
                    className={`flex w-full gap-3 border-l-4 p-3 text-left transition-colors active:bg-surface-container sm:p-4 ${
                      isSelected
                        ? "bg-surface-container-low border-primary"
                        : "hover:bg-surface-container-low border-transparent"
                    }`}
                  >
                    <UserAvatar
                      src={
                        resolveMediaUrl(convo.other_user_profile?.photo_url) ??
                        resolveProfilePhotoUrl(convo.other_user_profile ?? {})
                      }
                      name={convo.other_user_nickname?.trim() || convo.other_user_profile?.full_name}
                    />
                    <div className="flex min-w-0 flex-1 items-stretch gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="mb-0.5 block truncate font-semibold text-sm text-on-surface">
                          {convo.other_user_nickname?.trim() || convo.other_user_profile?.full_name}
                        </span>
                        <p className="truncate text-xs text-on-surface-variant">{preview}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-between gap-1 pl-1">
                        {time ? (
                          <span className="whitespace-nowrap text-[11px] tabular-nums text-on-surface-variant">
                            {time}
                          </span>
                        ) : null}
                        {(convo.unread_count ?? 0) > 0 && (
                          <span className="min-w-[18px] rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                            {convo.unread_count! > 99 ? "99+" : convo.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.aside>

        <div
          onMouseDown={startResize}
          className="relative hidden w-1 shrink-0 cursor-col-resize bg-outline-variant transition-colors hover:bg-primary active:bg-primary lg:block"
          title="Drag to resize"
        />

        <motion.main
          initial={false}
          {...(isMobile
            ? {
                animate: { x: showMobileThread ? "0%" : "100%" },
                transition: mobileSlideTransition,
              }
            : {})}
          className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background lg:relative max-lg:absolute max-lg:inset-0 max-lg:z-20 max-lg:w-full ${
            isMobile && !showMobileThread ? "pointer-events-none" : ""
          }`}
        >
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-on-surface-variant">
              Select a conversation to start messaging
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              {insightsOpen && selected?.match_id ? (
                <MatchInsightsPanel
                  matchId={selected.match_id}
                  myProfile={user?.profile}
                  otherProfile={otherProfile}
                  onClose={() => setInsightsOpen(false)}
                />
              ) : (
                <>
              <header className="relative z-50 shrink-0 max-md:ios-sticky-header max-md:!top-0 max-md:px-1 md:border-b md:border-outline-variant md:bg-surface/60 md:px-6 md:py-3 md:backdrop-blur-xl">
                <div className="max-md:ios-nav-bar flex items-center justify-between gap-2 md:gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-0.5 md:gap-3">
                    <button
                      type="button"
                      onClick={handleBackToList}
                      className="ios-nav-btn shrink-0 md:hidden"
                      aria-label="Back to conversations"
                    >
                      <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                    </button>
                    <UserAvatar
                      src={
                        resolveMediaUrl(otherProfile?.photo_url) ??
                        resolveProfilePhotoUrl(otherProfile ?? {})
                      }
                      name={otherDisplayName}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold font-[var(--font-headline)] text-[17px] leading-tight text-on-surface md:text-base">
                        {otherDisplayName}
                      </h3>
                      {isOtherUserTyping ? (
                        <p className="mt-0.5 text-[13px] font-medium text-primary animate-pulse md:text-xs md:font-bold">
                          Typing…
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[13px] text-on-surface-variant md:text-xs">
                          Active now
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setChatMenuOpen(false);
                        setInsightsOpen(true);
                      }}
                      disabled={!selected?.match_id}
                      className="shrink-0 max-md:ios-nav-btn md:rounded-full md:p-2 md:text-primary md:transition-colors md:hover:bg-primary/10 disabled:opacity-40 max-md:disabled:opacity-35"
                      aria-label="Match insights"
                    >
                      <span className="material-symbols-outlined text-[24px] md:text-[22px]">insights</span>
                    </button>
                    <ChatConversationMenu
                      open={chatMenuOpen}
                      onOpenChange={setChatMenuOpen}
                      onShowProfile={() => setProfileSheetOpen(true)}
                      onEditNickname={() => setNicknameDialogOpen(true)}
                      onUnmatchBlock={() => setUnmatchDialogOpen(true)}
                      onClearHistory={() => setClearDialogOpen(true)}
                      onReport={() => setReportDialogOpen(true)}
                    />
                  </div>
                </div>
              </header>

              {chatActionNotice ? (
                <div className="shrink-0 border-b border-white/10 bg-surface-variant/40 px-4 py-2 text-center text-xs text-on-surface">
                  {chatActionNotice}
                </div>
              ) : null}

              <div
                ref={messageListRef}
                data-lenis-prevent
                className="relative z-0 min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain hide-scrollbar bg-surface-container-low px-3 py-4 sm:px-6 sm:py-6 space-y-4"
              >
                <div className="flex justify-center">
                  <span className="bg-surface-container-high text-on-surface-variant px-4 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                    Start of conversation
                  </span>
                </div>

                {loadingMessages ? (
                  <ChatMessagesSkeleton />
                ) : (
                  messages
                    .filter((msg) => !msg.is_deleted_for_me)
                    .map((msg) => {
                      const myReaction =
                        user?.id != null
                          ? getReactionEmojiForUser(msg.reactions, user.id)
                          : null;
                      const theirReaction =
                        user?.id != null
                          ? getReactionEmojiForOtherUsers(msg.reactions, user.id)
                          : null;
                      const showMyReactionOnTheirMsg = !msg.is_mine && myReaction;
                      const showTheirReactionOnMyMsg = msg.is_mine && theirReaction;

                      return (
                      <div
                        key={msg.id}
                        className={`flex group relative min-w-0 overflow-visible ${msg.is_mine ? "justify-end" : "items-end gap-2"} max-w-[88%] sm:max-w-[75%] ${
                          msg.is_mine ? "ml-auto" : ""
                        }`}
                      >
                        {!msg.is_mine && (
                          <UserAvatar
                            src={
                              resolveMediaUrl(msg.sender_photo ?? otherProfile?.photo_url) ??
                              resolveProfilePhotoUrl(otherProfile ?? {})
                            }
                            name={msg.sender_name ?? otherProfile?.full_name}
                            size="sm"
                          />
                        )}

                        <div
                          className={`flex min-w-0 max-w-full items-center gap-0.5 ${
                            msg.is_mine ? "flex-row" : "flex-row"
                          }`}
                        >
                          {msg.is_mine && !msg.is_deleted_for_everyone && (
                            <MessageActionMenu
                              msg={msg}
                              open={activeMessageMenu === msg.id}
                              onToggle={() =>
                                setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)
                              }
                              onCopy={() => void handleCopyMessage(msg)}
                              onReply={() => handleReplyToMessage(msg)}
                              onReact={(emoji) => handleReact(msg.id, emoji)}
                              onDeleteForMe={() => handleDelete(msg.id, "for_me")}
                              onDeleteForEveryone={() => handleDelete(msg.id, "for_everyone")}
                            />
                          )}

                          <div className="relative min-w-0 max-w-full flex flex-col overflow-visible">
                          <div
                            className={`relative min-w-0 max-w-full overflow-hidden transition-all ${
                              isCompactBubble(msg) ? "w-fit" : ""
                            } ${
                              isSentImageOnly(msg)
                                ? "bg-transparent p-0 shadow-none"
                                : `${messageBubblePadding(msg)} shadow-sm ${
                                    msg.is_mine
                                      ? "gradient-brand-br text-white rounded-[1.25rem] rounded-br-[0.2rem] shadow-md shadow-primary/10"
                                      : "bg-secondary text-on-surface rounded-[1.25rem] rounded-bl-[0.2rem] border border-outline-variant/30"
                                  }`
                            } ${msg.is_deleted_for_everyone ? "opacity-60 italic" : ""}`}
                          >

                            {msg.image_url && !msg.is_deleted_for_everyone && (
                              <div className={isSentImageOnly(msg) || isVoiceOnlyMessage(msg) ? "" : "mb-1"}>
                                {isVoiceMessage(msg) ? (
                                  <div className="relative">
                                    <VoiceMessageBubble
                                      audioSrc={msg.image_url}
                                      bubbleColor="transparent"
                                      waveColor={msg.is_mine ? "#ffffff" : "#b76e79"}
                                      onGradientBubble={msg.is_mine}
                                      compact
                                    />
                                    {isVoiceOnlyMessage(msg) && (
                                      <div
                                        className={`pointer-events-none absolute bottom-0 flex items-center gap-0.5 ${
                                          msg.is_mine ? "right-0" : "left-0"
                                        }`}
                                      >
                                        <span
                                          className={`text-[9px] leading-none ${
                                            msg.is_mine ? "text-white/70" : "text-on-surface-variant/60"
                                          }`}
                                        >
                                          {formatClockTime(msg.timestamp ?? msg.created_at)}
                                        </span>
                                        {msg.is_mine && (
                                          <span
                                            className="material-symbols-outlined text-[11px] text-white/70"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                          >
                                            {msg.is_read ? "done_all" : "done"}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    className={`overflow-hidden ${
                                      isSentImageOnly(msg)
                                        ? "rounded-2xl rounded-br-md"
                                        : "rounded-lg border border-black/5"
                                    }`}
                                  >
                                    <img
                                      src={msg.image_url}
                                      alt="Attached"
                                      className="max-w-full max-h-64 object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.content && !isVoiceMessage(msg) && (
                              isTextOnlyMessage(msg) ? (
                                <p className="text-sm leading-tight whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                  {msg.content}
                                  <span
                                    className={`inline-flex items-center gap-0.5 whitespace-nowrap ml-1.5 align-baseline text-[9px] leading-none ${
                                      msg.is_mine ? "text-white/70" : "text-on-surface-variant/60"
                                    }`}
                                  >
                                    {formatClockTime(msg.timestamp ?? msg.created_at)}
                                    {msg.is_mine && (
                                      <span
                                        className="material-symbols-outlined text-[11px] text-white/70"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                      >
                                        {msg.is_read ? "done_all" : "done"}
                                      </span>
                                    )}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-sm leading-snug px-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                  {msg.content}
                                </p>
                              )
                            )}

                            {!isVoiceOnlyMessage(msg) && !isTextOnlyMessage(msg) && (
                            <div
                              className={`flex items-center gap-1 ${
                                isSentImageOnly(msg) ? "mt-1.5" : "mt-1"
                              } ${msg.is_mine ? "justify-end" : "justify-start"}`}
                            >
                              <span
                                className={`text-[9px] ${
                                  msg.is_mine && !isSentImageOnly(msg)
                                    ? "text-white/70"
                                    : "text-on-surface-variant/60"
                                }`}
                              >
                                {formatClockTime(msg.timestamp ?? msg.created_at)}
                              </span>
                              {msg.is_mine && (
                                <span
                                  className={`material-symbols-outlined text-[12px] ${
                                    isSentImageOnly(msg) ? "text-primary/60" : "text-white/70"
                                  }`}
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  {msg.is_read ? "done_all" : "done"}
                                </span>
                              )}
                            </div>
                            )}

                          </div>

                          {showMyReactionOnTheirMsg && (
                            <div className="relative z-10 -mt-2.5 flex justify-end pr-0.5">
                              <ReactionBadge emoji={myReaction!} />
                            </div>
                          )}

                          {showTheirReactionOnMyMsg && (
                            <div className="relative z-10 -mt-2.5 flex justify-start pl-0.5">
                              <ReactionBadge emoji={theirReaction!} />
                            </div>
                          )}
                          </div>

                          {!msg.is_mine && !msg.is_deleted_for_everyone && (
                            <MessageActionMenu
                              msg={msg}
                              open={activeMessageMenu === msg.id}
                              onToggle={() =>
                                setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)
                              }
                              onCopy={() => void handleCopyMessage(msg)}
                              onReply={() => handleReplyToMessage(msg)}
                              onReact={(emoji) => handleReact(msg.id, emoji)}
                              onDeleteForMe={() => handleDelete(msg.id, "for_me")}
                              onDeleteForEveryone={() => handleDelete(msg.id, "for_everyone")}
                            />
                          )}
                        </div>
                      </div>
                      );
                    })
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="shrink-0 border-t border-outline-variant/30 bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 relative">
                {replyingTo && (
                  <div className="mx-auto mb-2 flex max-w-4xl items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-primary">reply</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-primary">
                        Replying to{" "}
                        {replyingTo.is_mine
                          ? "yourself"
                          : replyingTo.sender_name ?? otherProfile?.full_name ?? "message"}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {getReplyPreview(replyingTo, otherProfile?.full_name)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
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
                        onClick={() => addEmoji(emoji)}
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
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*"
                  />

                  <div className="relative z-10 flex shrink-0 items-center gap-1">
                    {isVoiceComposeActive ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelVoiceRecording}
                          aria-label="Cancel voice recording"
                          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-secondary"
                        >
                          <span className="material-symbols-outlined text-[22px]">delete</span>
                        </button>
                        <VoiceInput
                          iconOnly
                          listening={isRecording}
                          paused={voiceDraftReady && !isRecording}
                          onListeningChange={handleVoiceListeningChange}
                          disabled={uploading || sending}
                        />
                      </>
                    ) : isTypingActive ? (
                      <>
                        <button
                          type="button"
                          onPointerDown={keepComposerFocus}
                          onClick={() => setAttachmentsExpanded((prev) => !prev)}
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
                                onClick={openCameraCapture}
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
                                onListeningChange={handleVoiceListeningChange}
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
                          onClick={openCameraCapture}
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
                          onListeningChange={handleVoiceListeningChange}
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
                        seconds={recordingSeconds}
                      />
                    ) : (
                      <>
                        <input
                          ref={messageInputRef}
                          className="min-w-0 flex-grow border-none bg-transparent text-sm outline-none placeholder:text-on-surface-variant focus:ring-0"
                          placeholder={replyingTo ? "Write a reply…" : "Aa"}
                          type="text"
                          value={newMessage}
                          onFocus={() => {
                            setIsInputFocused(true);
                            setAttachmentsExpanded(false);
                          }}
                          onBlur={() => {
                            setIsInputFocused(false);
                            if (!newMessage.trim()) setAttachmentsExpanded(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleSend(e);
                            }
                          }}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            if (e.target.value.length > 0) setAttachmentsExpanded(false);
                            handleTyping();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
                      onClick={() => void sendVoiceMessage()}
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
                      disabled={(!newMessage.trim() && !uploading) || sending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand-br text-white shadow-lg shadow-primary/20 active:scale-90 disabled:opacity-50"
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
                        onClick={closeCameraCapture}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
                        aria-label="Close camera"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                      <span className="text-sm font-medium">Take Photo</span>
                      <button
                        type="button"
                        onClick={switchCameraFacing}
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
                        onClick={() => void capturePhotoFromCamera()}
                        disabled={cameraStarting || uploading}
                        aria-label="Capture photo"
                        className="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:scale-95 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </footer>
                </>
              )}
            </div>
          )}
        </motion.main>
      </div>

      <ProfileDetailSheet
        profile={otherProfile ?? null}
        open={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
      />

      {pendingImageFile && pendingImagePreview ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label="Cancel sending photo"
            onClick={clearPendingImage}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-photo-title"
            className="relative z-[121] w-full max-w-md overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-background shadow-2xl sm:rounded-[1.5rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/10 px-5 py-4">
              <h3
                id="send-photo-title"
                className="font-[var(--font-headline)] text-lg font-bold text-on-surface"
              >
                Send this photo?
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Confirm before sending to {otherDisplayName}.
              </p>
            </div>
            <div className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImagePreview}
                alt="Photo preview"
                className="mx-auto max-h-[min(50vh,420px)] w-full rounded-xl bg-black/20 object-contain"
              />
            </div>
            <div className="flex gap-2 border-t border-white/10 p-4">
              <button
                type="button"
                onClick={clearPendingImage}
                disabled={uploading}
                className="flex-1 rounded-full border border-outline-variant/40 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSendPendingImage()}
                disabled={uploading || sending}
                className="flex-1 rounded-full py-3 text-sm font-semibold text-white gradient-brand transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ChatPromptDialog
        open={nicknameDialogOpen}
        title="Edit nickname"
        description={`Choose a private nickname for ${otherProfile?.full_name || "this match"}. Only you will see it.`}
        initialValue={selected?.other_user_nickname || ""}
        placeholder="Enter nickname"
        confirmLabel="Save"
        onClose={() => setNicknameDialogOpen(false)}
        onConfirm={(value) => void updateConversationNickname(value)}
      />

      <ChatPromptDialog
        open={reportDialogOpen}
        title="Report user"
        description="Tell us what happened. Our team will review your report."
        placeholder="Describe the issue…"
        confirmLabel="Submit report"
        multiline
        onClose={() => setReportDialogOpen(false)}
        onConfirm={(value) => void handleReportUser(value)}
      />

      <ChatConfirmDialog
        open={clearDialogOpen}
        title="Clear chat history?"
        description="This removes all messages from this chat on your device. The other person will still see the conversation."
        confirmLabel="Clear history"
        destructive
        onClose={() => setClearDialogOpen(false)}
        onConfirm={() => void handleClearChatHistory()}
      />

      <ChatConfirmDialog
        open={unmatchDialogOpen}
        title="Unmatch & block?"
        description={`You will unmatched with ${otherDisplayName}, block them, and delete this conversation.`}
        confirmLabel="Unmatch & block"
        destructive
        onClose={() => setUnmatchDialogOpen(false)}
        onConfirm={() => void handleUnmatchBlock()}
      />
    </div>
  );
}
