"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { MatchInsightsPanel } from "@/components/chat/MatchInsightsPanel";
import {
  ChatConfirmDialog,
  ChatPromptDialog,
} from "@/components/chat/ChatConversationMenu";
import { ProfileDetailSheet } from "@/components/discover/profileDiscoverUi";
import {
  ChatMessagesSkeleton,
  ChatPageSkeleton,
} from "@/components/skeletons/ChatPageSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCall } from "@/components/call/CallBridge";
import api from "@/lib/api";
import { resolveAvatarUrl, resolveMediaUrl, resolveProfilePhotoUrl } from "@/lib/mediaUrl";
import { useChatWebSocket } from "@/lib/useChatWebSocket";
import { useUnreadMessagesStore } from "@/store/unreadMessagesStore";
import type { ChatMessage, Conversation } from "@/types";
import { VOICE_MESSAGE_LABEL } from "./chatConstants";
import {
  applyUserReaction,
  getReactionEmojiForUser,
  normalizeReactionsInput,
  normalizeReactionsOnePerUser,
  removeUserReaction,
  setUserReactionOnMessage,
} from "./chatReactions";
import {
  conversationPublicKey,
  findConversationByParam,
  getCopyableText,
  getConversationLastActivity,
  getReplyPreview,
  isVoiceMessage,
  lastMessagePreview,
  normalizeMessages,
  touchConversationInList,
  sortConversationsByActivity,
} from "./chatMessageUtils";
import {
  buildMessageTimeline,
  createOptimisticMessage,
  getMessageBodyText,
} from "./chatMessageGrouping";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatThreadHeader } from "./ChatThreadHeader";
import { ConversationSidebar } from "./ConversationSidebar";
import { ImageLightbox } from "./ImageLightbox";

export default function MessagesSection() {
  const { user, loading: authLoading } = useAuth();
  const call = useCall();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerHasText, setComposerHasText] = useState(false);
  const [composerClearToken, setComposerClearToken] = useState(0);
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDraftReady, setVoiceDraftReady] = useState(false);
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
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [unmatchDialogOpen, setUnmatchDialogOpen] = useState(false);
  const [unmatchBlockDialogOpen, setUnmatchBlockDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [chatActionNotice, setChatActionNotice] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [unreadFilter, setUnreadFilter] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [deleteConvoDialog, setDeleteConvoDialog] = useState<Conversation | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const failedSendPayloadsRef = useRef<Map<string, { content: string; imageUrl: string; replyToId?: number }>>(
    new Map()
  );

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
  const isResizing = useRef(false);
  const pendingImagePreviewRef = useRef<string | null>(null);
  const newMessageRef = useRef("");
  const messagesCacheRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMessagesRequestRef = useRef(0);
  /** Prevents URL sync from re-opening a thread while back navigation clears the query param. */
  const leavingThreadRef = useRef(false);

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
    () =>
      selectedKey
        ? findConversationByParam(conversations, selectedKey) ?? null
        : null,
    [conversations, selectedKey]
  );
  const selectedId = selected?.id ?? null;
  const selectedApiKey = selected ? conversationPublicKey(selected) : selectedKey;

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (unreadFilter) {
      list = list.filter((c) => (c.unread_count ?? 0) > 0);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((convo) => {
      const name =
        convo.other_user_nickname?.trim() ||
        convo.other_user_profile?.full_name?.toLowerCase() ||
        "";
      const preview = lastMessagePreview(convo).toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }, [conversations, search, unreadFilter]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [conversations]
  );
  const showMobileThread = selectedKey != null;
  const mobileSlideTransition = { type: "tween" as const, duration: 0.28, ease: [0.32, 0.72, 0, 1] as const };
  const visibleMessages = useMemo(
    () => messages.filter((msg) => !msg.is_deleted_for_me),
    [messages]
  );
  const messageTimeline = useMemo(
    () => buildMessageTimeline(visibleMessages),
    [visibleMessages]
  );
  const otherProfile = selected?.other_user_profile;
  const otherDisplayName =
    selected?.other_user_nickname?.trim() || otherProfile?.full_name || "Match";
  const otherAvatarSrc = useMemo(
    () =>
      resolveAvatarUrl(otherProfile?.photo_url) ??
      resolveProfilePhotoUrl(otherProfile ?? {}),
    [otherProfile]
  );
  const isTypingActive = isInputFocused || composerHasText;
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
      const data = await api.getConversations({
        archived: showArchived,
        unread: unreadFilter,
      });
      const sorted = sortConversationsByActivity(data);
      setConversations(sorted);
      const total = sorted.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      useUnreadMessagesStore.getState().setTotalUnread(total);
    } catch {
      /* ignore */
    } finally {
      if (!options?.silent) setLoadingConversations(false);
    }
  }, [showArchived, unreadFilter]);

  const loadMessages = useCallback(async (convoKey: string, options?: { silent?: boolean }) => {
    const requestId = ++loadMessagesRequestRef.current;
    const cached = messagesCacheRef.current.get(convoKey);
    if (cached && !options?.silent) {
      setMessages(cached);
      setLoadingMessages(false);
    } else if (!options?.silent) {
      setLoadingMessages(true);
    }

    try {
      const [page, convoDetail] = await Promise.all([
        api.getMessages(convoKey, { limit: 50 }),
        api.getConversationDetail(convoKey).catch(() => null),
      ]);
      if (requestId !== loadMessagesRequestRef.current) return;

      const normalized = normalizeMessages(page.results as ChatMessage[]);
      messagesCacheRef.current.set(convoKey, normalized);
      setMessages(normalized);
      setHasMoreMessages(page.has_more);

      if (normalized.length > 0) {
        const last = normalized[normalized.length - 1];
        const ts = last.timestamp ?? last.created_at;
        if (ts) {
          const preview =
            last.content?.trim() ||
            (last.image_url ? (isVoiceMessage(last) ? VOICE_MESSAGE_LABEL : "Photo") : "Message");
          setConversations((prev) => {
            const match = findConversationByParam(prev, convoKey);
            if (!match) return prev;
            return touchConversationInList(prev, match.id, preview, ts, !!last.is_mine);
          });
        }
      }
      // Opening a thread marks messages read on the server — clear local unread.
      setConversations((prev) => {
        const next = prev.map((c) =>
          conversationPublicKey(c) === convoKey || String(c.id) === convoKey
            ? { ...c, unread_count: 0 }
            : c
        );
        const total = next.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        useUnreadMessagesStore.getState().setTotalUnread(total);
        return next;
      });
      if (convoDetail) {
        setIsOtherUserTyping(Boolean(convoDetail.is_other_user_typing));
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === loadMessagesRequestRef.current && !options?.silent) {
        setLoadingMessages(false);
      }
    }
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!selectedApiKey || loadingOlder || !hasMoreMessages) return;
    const oldest = messages.find((m) => m.id > 0);
    if (!oldest) return;

    const container = messageListRef.current;
    const prevHeight = container?.scrollHeight ?? 0;

    setLoadingOlder(true);
    try {
      const page = await api.getMessages(selectedApiKey, {
        before: oldest.id,
        limit: 50,
      });
      const older = normalizeMessages(page.results as ChatMessage[]);
      setHasMoreMessages(page.has_more);
      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.id));
        const merged = [...older.filter((m) => !known.has(m.id)), ...prev];
        messagesCacheRef.current.set(selectedApiKey, merged);
        return merged;
      });
      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop = container.scrollHeight - prevHeight;
      });
    } catch {
      /* ignore */
    } finally {
      setLoadingOlder(false);
    }
  }, [selectedApiKey, loadingOlder, hasMoreMessages, messages]);

  const clearComposerDraft = useCallback(() => {
    newMessageRef.current = "";
    setComposerHasText(false);
    setPendingEmoji(null);
    setComposerClearToken((token) => token + 1);
  }, []);

  const handleComposerHasTextChange = useCallback((hasText: boolean) => {
    setComposerHasText((prev) => {
      if (prev === hasText) return prev;
      return hasText;
    });
    if (hasText) setAttachmentsExpanded(false);
  }, []);

  const handleComposerFocusChange = useCallback((focused: boolean) => {
    setIsInputFocused(focused);
    if (focused) setAttachmentsExpanded(false);
    else if (!newMessageRef.current.trim()) setAttachmentsExpanded(false);
  }, []);

  const handleEmojiAppendConsumed = useCallback(() => {
    setPendingEmoji(null);
  }, []);

  useEffect(() => {
    if (!isTypingActive) setAttachmentsExpanded(false);
  }, [isTypingActive]);

  useEffect(() => {
    if (user) void loadConversations();
  }, [showArchived, unreadFilter, user, loadConversations]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Sync selection FROM the URL (back/forward, deep links). Never overwrite a
  // newer in-memory selection while the URL is still catching up.
  useEffect(() => {
    const param = searchParams.get("conversation");

    if (!param) {
      if (leavingThreadRef.current) {
        leavingThreadRef.current = false;
      }
      // On mobile, dropping the query param means return to the list view.
      // On desktop, keep the in-memory selection until the URL sync effect catches up.
      if (isMobile && selectedKey !== null) {
        setSelectedKey(null);
      }
      return;
    }

    if (loadingConversations || leavingThreadRef.current) return;

    // Already selected this conversation (public_id or legacy short id).
    if (selectedKey === param) return;
    if (
      selected &&
      (selected.public_id === param || String(selected.id) === param)
    ) {
      return;
    }

    // User just picked another chat; wait for the URL write effect.
    if (selectedKey) {
      const pending = findConversationByParam(conversations, selectedKey);
      if (pending && conversationPublicKey(pending) !== param && String(pending.id) !== param) {
        return;
      }
    }

    const match = findConversationByParam(conversations, param);
    if (match) {
      setSelectedKey(conversationPublicKey(match));
    }
  }, [searchParams, loadingConversations, conversations, selectedKey, selected, isMobile]);

  useEffect(() => {
    if (!selectedApiKey) return;
    const cached = messagesCacheRef.current.get(selectedApiKey);
    if (cached) {
      setMessages(cached);
      setLoadingMessages(false);
      void loadMessages(selectedApiKey, { silent: true });
      return;
    }
    setMessages([]);
    void loadMessages(selectedApiKey);
  }, [selectedApiKey, loadMessages]);

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
  }, [selectedKey, clearPendingImage]);

  useEffect(() => () => clearPendingImage(), [clearPendingImage]);

  useEffect(() => {
    if (!selectedKey || loadingMessages) return;
    if (visibleMessages.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => scrollToLatestMessage("auto"));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedKey, loadingMessages, visibleMessages.length, scrollToLatestMessage]);

  useEffect(() => {
    const container = messageListRef.current;
    if (!container || !selectedKey || loadingMessages) return;

    const observer = new ResizeObserver(() => {
      if (isNearBottomOfMessages()) {
        scrollToLatestMessage("auto");
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [selectedKey, loadingMessages, visibleMessages.length, scrollToLatestMessage, isNearBottomOfMessages]);

  useEffect(() => {
    if (!selectedApiKey) {
      // Only clear the URL when the user explicitly left the thread.
      if (selectedKey === null && searchParams.get("conversation")) {
        router.replace("/chat", { scroll: false });
      }
      return;
    }
    const current = searchParams.get("conversation");
    // Already pointing at this conversation via public_id or legacy id.
    if (
      current === selectedApiKey ||
      (selected && (current === selected.public_id || current === String(selected.id)))
    ) {
      // Upgrade legacy short ids in the address bar to the 10-digit public_id.
      if (selected?.public_id && current !== selected.public_id) {
        router.replace(`/chat?conversation=${selected.public_id}`, { scroll: false });
      }
      return;
    }
    router.replace(`/chat?conversation=${selectedApiKey}`, { scroll: false });
  }, [selectedApiKey, selectedKey, selected, searchParams, router]);

  useEffect(() => {
    if (loadingConversations || selectedKey || searchParams.get("conversation")) return;
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;
    const first = filteredConversations[0];
    if (first) setSelectedKey(conversationPublicKey(first));
  }, [loadingConversations, selectedKey, filteredConversations, searchParams]);

  const handleWsMessage = useCallback(
    (data: Record<string, unknown>) => {
      if (!user?.id || !selectedId) return;

      if (data.type === "chat_message") {
        const clientTempId =
          typeof data.client_temp_id === "string" ? data.client_temp_id : undefined;
        const newMsg: ChatMessage = {
          id: data.id as number,
          sender_id: data.sender_id as number,
          content: (data.content as string) || "",
          image_url: resolveMediaUrl(data.image_url as string),
          timestamp: data.timestamp as string,
          sender_name: data.sender_name as string,
          message_type: data.message_type as ChatMessage["message_type"],
          reply_to: data.reply_to as ChatMessage["reply_to"],
          is_mine: data.sender_id === user.id,
          is_read: false,
          send_status: data.sender_id === user.id ? "sent" : undefined,
        };
        setMessages((prev) => {
          if (clientTempId) {
            const idx = prev.findIndex((m) => m.client_temp_id === clientTempId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...newMsg, client_temp_id: clientTempId, send_status: "sent" };
              if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
              failedSendPayloadsRef.current.delete(clientTempId);
              return next;
            }
          }
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const next = [...prev, newMsg];
          if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
          return next;
        });
        const preview =
          getMessageBodyText(newMsg).trim() ||
          (newMsg.image_url ? (isVoiceMessage(newMsg) ? VOICE_MESSAGE_LABEL : "Photo") : "Message");
        const ts = newMsg.timestamp ?? new Date().toISOString();
        setConversations((prev) =>
          touchConversationInList(prev, selectedId, preview, ts, newMsg.is_mine ?? false)
        );
        if (isNearBottomOfMessages()) {
          window.requestAnimationFrame(() => scrollToLatestMessage("smooth"));
        }
      } else if (data.type === "messages_read") {
        const ids = Array.isArray(data.message_ids)
          ? (data.message_ids as number[])
          : [];
        if (ids.length === 0) return;
        const now = new Date().toISOString();
        setMessages((prev) => {
          const next = prev.map((m) =>
            ids.includes(m.id) && m.is_mine
              ? { ...m, is_read: true, read_at: now, delivered_at: m.delivered_at ?? now }
              : m
          );
          if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
          return next;
        });
      } else if (data.type === "typing_status") {
        if (data.user_id !== user.id) {
          setIsOtherUserTyping(Boolean(data.is_typing));
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (data.is_typing) {
            typingTimeoutRef.current = setTimeout(() => setIsOtherUserTyping(false), 3000);
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
    },
    [user?.id, selectedId, selectedApiKey, scrollToLatestMessage, isNearBottomOfMessages]
  );

  const { connected: wsConnected, send: sendWs } = useChatWebSocket(
    selectedApiKey,
    user?.id,
    handleWsMessage
  );

  useEffect(() => {
    if (!wsConnected || !selectedApiKey) return;
    sendWs({ type: "mark_read" });
  }, [wsConnected, selectedApiKey, sendWs, visibleMessages.length]);

  useEffect(() => {
    if (!selectedApiKey || wsConnected) return;

    let conversationsTick = 0;
    const pollMessages = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      try {
        const page = await api.getMessages(selectedApiKey);
        const normalized = normalizeMessages(page.results as ChatMessage[]);
        setMessages((prev) => {
          if (normalized.length === 0) return prev;
          const knownIds = new Set(prev.map((m) => m.id));
          const incoming = normalized.filter((m) => !knownIds.has(m.id));
          if (incoming.length === 0) {
            if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, prev);
            return prev;
          }
          const next = [...prev, ...incoming];
          messagesCacheRef.current.set(selectedApiKey, next);
          return next;
        });
        conversationsTick += 1;
        if (conversationsTick % 3 === 0) {
          void loadConversations({ silent: true });
        }
      } catch {
        /* ignore polling errors */
      }
    };

    void pollMessages();
    const interval = window.setInterval(() => void pollMessages(), 8000);
    return () => window.clearInterval(interval);
  }, [selectedApiKey, wsConnected, loadConversations]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
    if (activeMessageMenu === null) return;
    const closeMenu = () => setActiveMessageMenu(null);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [activeMessageMenu]);

  const resetVoiceSession = () => {
    setIsRecording(false);
    setVoiceDraftReady(false);
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

  const handleBackToList = useCallback(() => {
    leavingThreadRef.current = true;
    setSelectedKey(null);
    setReplyingTo(null);
    setInsightsOpen(false);
    setChatMenuOpen(false);
    router.replace("/chat", { scroll: false });
  }, [router]);

  const updateConversationNickname = useCallback(
    async (nickname: string) => {
      if (!selectedApiKey || selectedId == null) return;
      try {
        const result = await api.updateConversationNickname(selectedApiKey, nickname);
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
    [selectedApiKey, selectedId]
  );

  const handleClearChatHistory = useCallback(async () => {
    if (!selectedApiKey) return;
    try {
      await api.clearConversationHistory(selectedApiKey);
      messagesCacheRef.current.set(selectedApiKey, []);
      setMessages([]);
      setClearDialogOpen(false);
      setChatActionNotice("Chat history cleared.");
    } catch {
      setChatActionNotice("Could not clear chat history.");
    }
  }, [selectedApiKey]);

  const removeSelectedConversation = useCallback(() => {
    if (selectedId == null) return;
    setConversations((prev) => {
      const next = prev.filter((convo) => convo.id !== selectedId);
      const total = next.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      useUnreadMessagesStore.getState().setTotalUnread(total);
      return next;
    });
    handleBackToList();
  }, [handleBackToList, selectedId]);

  const handleBlockUser = useCallback(async () => {
    if (!selectedApiKey) return;
    try {
      await api.blockConversation(selectedApiKey);
      setBlockDialogOpen(false);
      removeSelectedConversation();
      setChatActionNotice("User blocked.");
    } catch {
      setChatActionNotice("Could not block user. Please try again.");
      setBlockDialogOpen(false);
    }
  }, [removeSelectedConversation, selectedApiKey]);

  const handleUnmatch = useCallback(async () => {
    if (!selectedApiKey) return;
    try {
      await api.unmatchConversation(selectedApiKey);
      setUnmatchDialogOpen(false);
      removeSelectedConversation();
      setChatActionNotice("Unmatched successfully.");
    } catch {
      setChatActionNotice("Could not unmatch. Please try again.");
      setUnmatchDialogOpen(false);
    }
  }, [removeSelectedConversation, selectedApiKey]);

  const handleUnmatchBlock = useCallback(async () => {
    if (!selectedApiKey) return;
    try {
      await api.unmatchAndBlockConversation(selectedApiKey);
      setUnmatchBlockDialogOpen(false);
      removeSelectedConversation();
      setChatActionNotice("Unmatched and blocked.");
    } catch {
      setChatActionNotice("Could not unmatch and block. Please try again.");
      setUnmatchBlockDialogOpen(false);
    }
  }, [removeSelectedConversation, selectedApiKey]);

  const handleReportUser = useCallback(
    async (reason: string) => {
      if (!selectedApiKey) return;
      try {
        await api.reportConversation(selectedApiKey, reason);
        setReportDialogOpen(false);
        setChatActionNotice("Report submitted. Thank you.");
      } catch {
        setChatActionNotice("Could not submit report.");
        setReportDialogOpen(false);
      }
    },
    [selectedApiKey]
  );

  const selectConversation = (convo: Conversation) => {
    leavingThreadRef.current = false;
    const key = conversationPublicKey(convo);
    setActiveMessageMenu(null);
    setReplyingTo(null);
    setSelectedKey(key);
    // Update the URL immediately so the URL→selection effect cannot snap back.
    router.replace(`/chat?conversation=${key}`, { scroll: false });
  };

  const buildMessageContent = (rawContent: string): string => rawContent.trim();

  const markMessageFailed = useCallback(
    (clientTempId: string) => {
      setMessages((prev) => {
        const next = prev.map((m) =>
          m.client_temp_id === clientTempId ? { ...m, send_status: "failed" as const } : m
        );
        if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
        return next;
      });
    },
    [selectedApiKey]
  );

  const commitSentMessage = useCallback(
    (clientTempId: string | undefined, msg: ChatMessage) => {
      const normalized = normalizeMessages([msg])[0];
      setMessages((prev) => {
        if (clientTempId) {
          const idx = prev.findIndex((m) => m.client_temp_id === clientTempId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...normalized, send_status: "sent" };
            if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
            failedSendPayloadsRef.current.delete(clientTempId);
            return next;
          }
        }
        if (prev.some((m) => m.id === normalized.id)) return prev;
        const next = [...prev, { ...normalized, send_status: "sent" as const }];
        if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
        return next;
      });
      return normalized;
    },
    [selectedApiKey]
  );

  const handleSend = async (
    e?: FormEvent | React.KeyboardEvent | null,
    imageUrl: string | null = null,
    contentOverride?: string
  ) => {
    if (e && "preventDefault" in e) e.preventDefault();
    const rawContent = contentOverride ?? newMessageRef.current.trim();
    const content = buildMessageContent(rawContent);
    if (!content && !imageUrl) return;
    if (!selectedApiKey || !selectedId || sending) return;

    const replyTo = replyingTo;
    const replyToId = replyTo && replyTo.id > 0 ? replyTo.id : undefined;
    const clientTempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimistic = createOptimisticMessage({
      clientTempId,
      content,
      imageUrl: imageUrl || undefined,
      userId: user!.id!,
      userName: user?.profile?.full_name || user?.username || "You",
      userPhoto: user?.profile?.photo_url ?? undefined,
      replyToId,
      replyTo: replyTo
        ? {
            id: replyTo.id,
            content: getReplyPreview(replyTo, otherProfile?.full_name),
            sender_name:
              replyTo.sender_name ||
              (replyTo.is_mine ? "You" : otherProfile?.full_name || "Them"),
            image_url: replyTo.image_url || "",
            message_type: replyTo.message_type,
          }
        : undefined,
    });

    failedSendPayloadsRef.current.set(clientTempId, {
      content,
      imageUrl: imageUrl || "",
      replyToId,
    });

    setMessages((prev) => {
      const next = [...prev, optimistic];
      if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
      return next;
    });
    clearComposerDraft();
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setAttachmentsExpanded(false);
    window.requestAnimationFrame(() => scrollToLatestMessage("smooth"));

    const wsPayload = {
      type: "chat_message",
      content,
      image_url: imageUrl || "",
      reply_to_id: replyToId,
      client_temp_id: clientTempId,
    };

    if (sendWs(wsPayload)) {
      return;
    }

    try {
      setSending(true);
      const msg = await api.sendMessage(
        selectedApiKey,
        content,
        imageUrl || "",
        replyToId ?? null
      );
      const normalized = commitSentMessage(clientTempId, msg as ChatMessage);
      const ts = normalized.timestamp ?? normalized.created_at ?? new Date().toISOString();
      const preview =
        getMessageBodyText(normalized).trim() ||
        (normalized.image_url
          ? isVoiceMessage(normalized)
            ? VOICE_MESSAGE_LABEL
            : "Photo"
          : "Message");
      setConversations((prev) =>
        touchConversationInList(prev, selectedId, preview, ts, true)
      );
    } catch (err) {
      console.error(err);
      markMessageFailed(clientTempId);
    } finally {
      setSending(false);
    }
  };

  const retryFailedMessage = useCallback(
    (msg: ChatMessage) => {
      const clientTempId = msg.client_temp_id;
      if (!clientTempId || !selectedApiKey || !selectedId) return;
      const payload = failedSendPayloadsRef.current.get(clientTempId);
      if (!payload) return;

      setMessages((prev) => {
        const next = prev.map((m) =>
          m.client_temp_id === clientTempId ? { ...m, send_status: "pending" as const } : m
        );
        if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
        return next;
      });

      const wsPayload = {
        type: "chat_message",
        content: payload.content,
        image_url: payload.imageUrl,
        reply_to_id: payload.replyToId,
        client_temp_id: clientTempId,
      };

      if (sendWs(wsPayload)) return;

      void (async () => {
        try {
          const sent = await api.sendMessage(
            selectedApiKey,
            payload.content,
            payload.imageUrl,
            payload.replyToId ?? null
          );
          const normalized = commitSentMessage(clientTempId, sent as ChatMessage);
          const ts = normalized.timestamp ?? normalized.created_at ?? new Date().toISOString();
          const preview =
            getMessageBodyText(normalized).trim() ||
            (normalized.image_url
              ? isVoiceMessage(normalized)
                ? VOICE_MESSAGE_LABEL
                : "Photo"
              : "Message");
          setConversations((prev) =>
            touchConversationInList(prev, selectedId, preview, ts, true)
          );
        } catch {
          markMessageFailed(clientTempId);
        }
      })();
    },
    [
      selectedApiKey,
      selectedId,
      sendWs,
      commitSentMessage,
      markMessageFailed,
    ]
  );

  const handleArchiveConversation = useCallback(
    async (convo: Conversation, archived: boolean) => {
      const key = conversationPublicKey(convo);
      try {
        await api.updateConversationSettings(key, { is_archived: archived });
        setConversations((prev) =>
          archived ? prev.filter((c) => c.id !== convo.id) : prev.map((c) =>
            c.id === convo.id ? { ...c, is_archived: archived } : c
          )
        );
        if (archived && selectedId === convo.id) {
          handleBackToList();
        }
        void loadConversations({ silent: true });
      } catch {
        setChatActionNotice("Could not update archive setting.");
      }
    },
    [selectedId, loadConversations, handleBackToList]
  );

  const handleMuteConversation = useCallback(async (convo: Conversation, muted: boolean) => {
    const key = conversationPublicKey(convo);
    try {
      await api.updateConversationSettings(key, { is_muted: muted });
      setConversations((prev) =>
        prev.map((c) => (c.id === convo.id ? { ...c, is_muted: muted } : c))
      );
    } catch {
      setChatActionNotice("Could not update mute setting.");
    }
  }, []);

  const handlePinConversation = useCallback(async (convo: Conversation, pinned: boolean) => {
    const key = conversationPublicKey(convo);
    try {
      await api.updateConversationSettings(key, { is_pinned: pinned });
      setConversations((prev) =>
        sortConversationsByActivity(
          prev.map((c) => (c.id === convo.id ? { ...c, is_pinned: pinned } : c))
        )
      );
    } catch {
      setChatActionNotice("Could not update pin setting.");
    }
  }, []);

  const handleDeleteConversation = useCallback(
    async (convo: Conversation) => {
      const key = conversationPublicKey(convo);
      try {
        await api.clearConversationHistory(key);
        if (!showArchived) {
          await api.updateConversationSettings(key, { is_archived: true });
        }
        messagesCacheRef.current.delete(key);
        setConversations((prev) => {
          const next = prev.filter((c) => c.id !== convo.id);
          const total = next.reduce((sum, c) => sum + (c.unread_count || 0), 0);
          useUnreadMessagesStore.getState().setTotalUnread(total);
          return next;
        });
        if (selectedId === convo.id) {
          handleBackToList();
        }
        setDeleteConvoDialog(null);
        setChatActionNotice("Conversation deleted.");
      } catch {
        setChatActionNotice("Could not delete conversation.");
        setDeleteConvoDialog(null);
      }
    },
    [showArchived, selectedId, handleBackToList]
  );

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
    setPendingEmoji(emoji);
    setShowEmojiPicker(false);
    setAttachmentsExpanded(false);
    requestAnimationFrame(() => messageInputRef.current?.focus());
  };

  const handleReact = (messageId: number, emoji: string) => {
    if (!user?.id) return;

    setMessages((prev) => {
      const next = prev.map((m) =>
        m.id === messageId
          ? {
              ...m,
              reactions: applyUserReaction(m.reactions, user.id, emoji),
            }
          : m
      );
      if (selectedApiKey) messagesCacheRef.current.set(selectedApiKey, next);
      return next;
    });
    setActiveMessageMenu(null);

    if (sendWs({ type: "message_reaction", id: messageId, user_id: user.id, emoji })) {
      return;
    }
    void api.reactToMessage(messageId, emoji).catch(() => undefined);
  };

  const handleDelete = (messageId: number, deleteType: "for_me" | "for_everyone") => {
    setActiveMessageMenu(null);
    if (replyingTo?.id === messageId) setReplyingTo(null);
    if (
      sendWs({
        type: "delete_message",
        id: messageId,
        user_id: user?.id,
        delete_type: deleteType,
      })
    ) {
      return;
    }
    void api.deleteMessage(messageId, deleteType).catch(() => undefined);
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

  const handleTyping = useCallback(() => {
    if (!selectedApiKey) return;
    const now = Date.now();
    if (now - lastTypingSignalRef.current > 2000) {
      lastTypingSignalRef.current = now;
      if (sendWs({ type: "typing", user_id: user?.id, is_typing: true })) {
        return;
      }
      void api.sendTypingHeartbeat(selectedApiKey).catch(() => undefined);
    }
  }, [selectedApiKey, sendWs, user?.id]);

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
        <ConversationSidebar
          sidebarWidth={sidebarWidth}
          isMobile={isMobile}
          showMobileThread={showMobileThread}
          mobileSlideTransition={mobileSlideTransition}
          totalUnread={totalUnread}
          loadingConversations={loadingConversations}
          search={search}
          onSearchChange={setSearch}
          onRefresh={() => void loadConversations()}
          filteredConversations={filteredConversations}
          selectedKey={selectedKey}
          onSelectConversation={selectConversation}
          unreadFilter={unreadFilter}
          onUnreadFilterChange={setUnreadFilter}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
          onArchiveConversation={(convo, archived) => void handleArchiveConversation(convo, archived)}
          onMuteConversation={(convo, muted) => void handleMuteConversation(convo, muted)}
          onPinConversation={(convo, pinned) => void handlePinConversation(convo, pinned)}
          onDeleteConversation={setDeleteConvoDialog}
        />

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
          {!selectedKey ? (
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
              <ChatThreadHeader
                otherAvatarSrc={otherAvatarSrc}
                otherDisplayName={otherDisplayName}
                isOtherUserTyping={isOtherUserTyping}
                isVerified={otherProfile?.is_verified}
                matchCreatedAt={selected?.match_created_at}
                hasMatchId={Boolean(selected?.match_id)}
                chatMenuOpen={chatMenuOpen}
                onBack={handleBackToList}
                onOpenInsights={() => {
                  setChatMenuOpen(false);
                  setInsightsOpen(true);
                }}
                onChatMenuOpenChange={setChatMenuOpen}
                onShowProfile={() => setProfileSheetOpen(true)}
                onEditNickname={() => setNicknameDialogOpen(true)}
                onBlock={() => setBlockDialogOpen(true)}
                onUnmatch={() => setUnmatchDialogOpen(true)}
                onUnmatchBlock={() => setUnmatchBlockDialogOpen(true)}
                onClearHistory={() => setClearDialogOpen(true)}
                onReport={() => setReportDialogOpen(true)}
                onVoiceCall={() => {
                  if (!selected?.public_id) return;
                  void call.startOutgoing({
                    conversationId: String(selected.public_id),
                    callType: "voice",
                    remoteName: otherDisplayName,
                  });
                }}
                onVideoCall={() => {
                  if (!selected?.public_id) return;
                  void call.startOutgoing({
                    conversationId: String(selected.public_id),
                    callType: "video",
                    remoteName: otherDisplayName,
                  });
                }}
              />

              {chatActionNotice ? (
                <div className="shrink-0 border-b border-white/10 bg-surface-variant/40 px-4 py-2 text-center text-xs text-on-surface">
                  {chatActionNotice}
                </div>
              ) : null}

              <div
                ref={messageListRef}
                data-lenis-prevent
                onScroll={() => {
                  const container = messageListRef.current;
                  if (!container || loadingOlder || !hasMoreMessages) return;
                  if (container.scrollTop < 96) void loadOlderMessages();
                }}
                className="relative z-0 min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-y-contain hide-scrollbar bg-surface-container-low px-3 py-4 sm:px-6 sm:py-6 space-y-1"
              >
                {hasMoreMessages ? (
                  <div className="flex justify-center pb-2">
                    <button
                      type="button"
                      onClick={() => void loadOlderMessages()}
                      disabled={loadingOlder}
                      className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-semibold text-on-surface-variant disabled:opacity-50"
                    >
                      {loadingOlder ? "Loading…" : "Load earlier messages"}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center pb-3">
                    <span className="bg-surface-container-high text-on-surface-variant px-4 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                      Start of conversation
                    </span>
                  </div>
                )}

                {loadingMessages ? (
                  <ChatMessagesSkeleton />
                ) : (
                  messageTimeline.map((item) =>
                    item.type === "date" ? (
                      <div key={item.key} className="flex justify-center py-2">
                        <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-semibold text-on-surface-variant">
                          {item.label}
                        </span>
                      </div>
                    ) : (
                      <ChatMessageBubble
                        key={item.key}
                        msg={item.msg}
                        showAvatar={item.showAvatar}
                        isGrouped={item.isGrouped}
                        currentUserId={user?.id}
                        otherAvatarSrc={otherAvatarSrc}
                        otherProfileName={otherProfile?.full_name}
                        menuOpen={activeMessageMenu === item.msg.id}
                        onToggleMenu={() =>
                          setActiveMessageMenu(
                            activeMessageMenu === item.msg.id ? null : item.msg.id
                          )
                        }
                        onCopy={() => void handleCopyMessage(item.msg)}
                        onReply={() => handleReplyToMessage(item.msg)}
                        onReact={(emoji) => handleReact(item.msg.id, emoji)}
                        onDeleteForMe={() => handleDelete(item.msg.id, "for_me")}
                        onDeleteForEveryone={() => handleDelete(item.msg.id, "for_everyone")}
                        onImageClick={(src) => setLightboxSrc(src)}
                        onRetry={() => retryFailedMessage(item.msg)}
                      />
                    )
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              <ChatComposer
                replyingTo={replyingTo}
                otherProfileName={otherProfile?.full_name}
                onCancelReply={() => setReplyingTo(null)}
                showEmojiPicker={showEmojiPicker}
                onAddEmoji={addEmoji}
                onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
                handleSend={(e) => void handleSend(e)}
                fileInputRef={fileInputRef}
                onFileUpload={handleFileUpload}
                isVoiceComposeActive={isVoiceComposeActive}
                onCancelVoiceRecording={cancelVoiceRecording}
                isRecording={isRecording}
                voiceDraftReady={voiceDraftReady}
                onVoiceListeningChange={handleVoiceListeningChange}
                uploading={uploading}
                sending={sending}
                isTypingActive={isTypingActive}
                attachmentsExpanded={attachmentsExpanded}
                onToggleAttachments={() => setAttachmentsExpanded((prev) => !prev)}
                keepComposerFocus={keepComposerFocus}
                onOpenCamera={openCameraCapture}
                attachmentSlideTransition={attachmentSlideTransition}
                messageInputRef={messageInputRef}
                composerClearToken={composerClearToken}
                pendingEmoji={pendingEmoji}
                onEmojiAppendConsumed={handleEmojiAppendConsumed}
                draftRef={newMessageRef}
                onHasTextChange={handleComposerHasTextChange}
                onFocusChange={handleComposerFocusChange}
                onTyping={handleTyping}
                composerHasText={composerHasText}
                onSendVoiceMessage={() => void sendVoiceMessage()}
                showCameraCapture={showCameraCapture}
                onCloseCamera={closeCameraCapture}
                onSwitchCameraFacing={switchCameraFacing}
                cameraStarting={cameraStarting}
                cameraVideoRef={cameraVideoRef}
                onCapturePhoto={() => void capturePhotoFromCamera()}
              />
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

      {lightboxSrc ? (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
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
        open={deleteConvoDialog != null}
        title="Delete conversation?"
        description={`This clears your chat history with ${
          deleteConvoDialog?.other_user_nickname?.trim() ||
          deleteConvoDialog?.other_user_profile?.full_name ||
          "this match"
        } and removes it from your inbox. The other person can still see the messages.`}
        confirmLabel="Delete"
        destructive
        onClose={() => setDeleteConvoDialog(null)}
        onConfirm={() => {
          if (deleteConvoDialog) void handleDeleteConversation(deleteConvoDialog);
        }}
      />

      <ChatConfirmDialog
        open={blockDialogOpen}
        title="Block this user?"
        description={`${otherDisplayName} will no longer be able to message you, and you will not see them in your matches.`}
        confirmLabel="Block"
        destructive
        onClose={() => setBlockDialogOpen(false)}
        onConfirm={() => void handleBlockUser()}
      />

      <ChatConfirmDialog
        open={unmatchDialogOpen}
        title="Unmatch?"
        description={`You will unmatched with ${otherDisplayName} and this conversation will be removed.`}
        confirmLabel="Unmatch"
        destructive
        onClose={() => setUnmatchDialogOpen(false)}
        onConfirm={() => void handleUnmatch()}
      />

      <ChatConfirmDialog
        open={unmatchBlockDialogOpen}
        title="Unmatch & block?"
        description={`You will unmatched with ${otherDisplayName}, block them, and delete this conversation.`}
        confirmLabel="Unmatch & block"
        destructive
        onClose={() => setUnmatchBlockDialogOpen(false)}
        onConfirm={() => void handleUnmatchBlock()}
      />
    </div>
  );
}
