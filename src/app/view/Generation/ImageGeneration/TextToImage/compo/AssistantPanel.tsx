"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  MessageSquare,
  Send,
  Loader2,
  User,
  Image as ImageIcon,
  Bot,
  Plus,
  Film,
  Music4,
  Trash2,
  Clock3,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDispatch } from "react-redux";
import {
  deductCreditsOptimistic,
  rollbackCreditsOptimistic,
  syncCreditsWithBackend,
} from "@/store/slices/creditsSlice";
import {
  AGENT_DEFAULT_MODEL_ID,
  AssistantMode,
  CHAT_MODELS,
  CLAUDE_ATTACHMENT_LIMITS,
  CLAUDE_DEFAULT_INPUT,
  CLAUDE_MODEL_ID,
  DEEPSEEK_ATTACHMENT_LIMITS,
  DEEPSEEK_DEFAULT_INPUT,
  DEEPSEEK_MODEL_ID,
  GEMINI_ATTACHMENT_LIMITS,
  GEMINI_DEFAULT_INPUT,
  GEMINI_MODEL_ID,
  GPT52_ATTACHMENT_LIMITS,
  GPT52_DEFAULT_INPUT,
  GPT52_MODEL_ID,
  getChatModelLabel,
} from "@/constants/assistantModels";

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
}

type GenerationAction = { type: "image" | "video"; prompt: string } | null;
type AssistantAttachment = {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  storagePath?: string | null;
  sizeBytes?: number | null;
};
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  id: string;
  attachments?: AssistantAttachment[];
  action?: GenerationAction;
  createdAt?: string | null;
};
type AssistantThread = {
  id: string;
  mode: AssistantMode;
  modelId: string;
  title: string;
  lastMessagePreview?: string | null;
  messageCount: number;
  attachmentCount: number;
  updatedAt?: string | null;
  createdAt?: string | null;
};

const IMAGE_KEYWORDS =
  /\b(generate|create|make|draw)\b\s+(?:a\s+)?(?:[\w-]+\s+){0,2}(image|photo|picture|illustration|artwork|art)\b|\b(image|photo|picture)\s+of\b/i;
const GENERIC_GEN_KEYWORDS = /^\s*(generate|create|make|draw)\b/i;
const MODE_META: Record<AssistantMode, { title: string; subtitle: string }> = {
  agent: {
    title: "Create with Agent Mode",
    subtitle:
      "Use the assistant to shape prompts, refine ideas, and turn replies into image-ready generations.",
  },
  chat: {
    title: "Chat with frontier models",
    subtitle:
      "Switch models, ask anything naturally, and keep the conversation focused in one clean workspace.",
  },
};
const DEFAULT_PANEL_WIDTH = 640;
const MIN_PANEL_WIDTH = 480;
const MAX_PANEL_WIDTH = 760;
const THREAD_RAIL_EXPANDED_WIDTH = 188;
const THREAD_RAIL_COLLAPSED_WIDTH = 68;

function detectIntent(userMsg: string): "image" | null {
  if (IMAGE_KEYWORDS.test(userMsg)) return "image";
  if (GENERIC_GEN_KEYWORDS.test(userMsg)) return "image";
  return null;
}

function detectIntentFromReply(
  aiReply: string,
  userMsgIntent: "image" | null,
): "image" | null {
  if (userMsgIntent) return userMsgIntent;

  const hasQuotedText =
    /["\u201c\u201d][^"\u201c\u201d]{15,}["\u201c\u201d]/.test(aiReply);
  const hasListAndPromptMention =
    /\b(?:prompt|suggestion|idea)s?\b/i.test(aiReply) &&
    /(?:^|\n|\:\s*)\s*[-*]\s+/.test(aiReply);
  const hasPromptColon =
    /\b(?:prompt|use this|try this|suggestion)\b\s*:/i.test(aiReply);

  if (hasQuotedText || hasListAndPromptMention || hasPromptColon) {
    return "image";
  }
  return null;
}

function extractPrompt(aiReply: string, userMsg: string): string {
  const quoted = aiReply.match(/(?:"|“|”)([^"“”]{15,})(?:"|“|”)/);
  if (quoted) return quoted[1].trim();

  const bulletMatch = aiReply.match(/(?:^|\n|\:\s*)\s*[-*]\s+([^\n]{15,})/);
  if (bulletMatch) {
    let extracted = bulletMatch[1].trim();
    const nextBulletIdx = extracted.search(/\s+[-*]\s+/);
    if (nextBulletIdx !== -1) {
      extracted = extracted.slice(0, nextBulletIdx);
    }
    return extracted.replace(/["'.,!?]$/, "");
  }

  const explicitPrompt = aiReply.match(
    /\b(?:prompt|use this|try this|suggestion)\s*:\s*["'\n]*([^\n]{15,})/i,
  );
  if (explicitPrompt) return explicitPrompt[1].replace(/["'.,!?]$/, "").trim();

  const colonMatch = aiReply.match(/:\s*\n*([A-Z][^\n]{15,})/);
  if (colonMatch) return colonMatch[1].replace(/["'.,!?]$/, "").trim();

  return userMsg.trim();
}

function attachmentLabel(attachment: AssistantAttachment): string {
  return attachment.fileName || `${attachment.type} attachment`;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function formatRelativeTime(value?: string | null): string {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function attachmentIcon(attachment: AssistantAttachment) {
  if (attachment.type === "video") return <Film className="w-3 h-3" />;
  if (attachment.type === "audio") return <Music4 className="w-3 h-3" />;
  return <ImageIcon className="w-3 h-3" />;
}

function parseThreadsResponse(data: any): AssistantThread[] {
  return Array.isArray(data?.data?.threads) ? data.data.threads : [];
}

function parseThreadResponse(data: any): {
  thread: AssistantThread | null;
  messages: ChatMessage[];
} {
  const thread = data?.data?.thread || null;
  const messages = Array.isArray(data?.data?.messages)
    ? data.data.messages.map((message: any) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        attachments: Array.isArray(message.attachments)
          ? message.attachments
          : [],
        action: null,
        createdAt: message.createdAt ?? null,
      }))
    : [];
  return { thread, messages };
}

const AssistantPanel: React.FC<AssistantPanelProps> = ({
  isOpen,
  onClose,
  onApplyPrompt,
}) => {
  const dispatch = useDispatch();
  const [draftMode, setDraftMode] = useState<AssistantMode>("agent");
  const [draftModelId, setDraftModelId] = useState<string>(CHAT_MODELS[0].id);
  const [prompt, setPrompt] = useState("");
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [activeThread, setActiveThread] = useState<AssistantThread | null>(
    null,
  );
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [composerAttachments, setComposerAttachments] = useState<
    AssistantAttachment[]
  >([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isThreadsLoading, setIsThreadsLoading] = useState(false);
  const [isThreadLoading, setIsThreadLoading] = useState(false);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [isDraftingNewThread, setIsDraftingNewThread] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isThreadRailCollapsed, setIsThreadRailCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  const hasChatHistory = chatHistory.length > 0;
  const effectiveMode = activeThread?.mode ?? draftMode;
  const effectiveModelId =
    activeThread?.modelId ??
    (effectiveMode === "chat" ? draftModelId : AGENT_DEFAULT_MODEL_ID);
  const currentModelLabel =
    effectiveMode === "chat"
      ? getChatModelLabel(effectiveModelId)
      : "Agent workflow";
  const isGeminiThread =
    effectiveMode === "chat" && effectiveModelId === GEMINI_MODEL_ID;
  const isClaudeThread =
    effectiveMode === "chat" && effectiveModelId === CLAUDE_MODEL_ID;
  const isGPT52Thread =
    effectiveMode === "chat" && effectiveModelId === GPT52_MODEL_ID;
  const isDeepSeekThread =
    effectiveMode === "chat" && effectiveModelId === DEEPSEEK_MODEL_ID;
  const threadRailWidth = isThreadRailCollapsed
    ? THREAD_RAIL_COLLAPSED_WIDTH
    : THREAD_RAIL_EXPANDED_WIDTH;
  const isCompactLayout = panelWidth < 560;
  const panelHorizontalPadding = isCompactLayout ? "px-3" : "px-5";
  const imageAttachmentCount = composerAttachments.filter(
    (item) => item.type === "image",
  ).length;
  const videoAttachmentCount = composerAttachments.filter(
    (item) => item.type === "video",
  ).length;
  const audioAttachmentCount = composerAttachments.filter(
    (item) => item.type === "audio",
  ).length;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [chatHistory, isAiThinking]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => textareaRef.current?.focus(), 430);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    const applyViewportConstraints = () => {
      if (typeof window === "undefined") return;
      const availableWidth = Math.max(420, window.innerWidth - 24);
      const nextMax = Math.min(MAX_PANEL_WIDTH, availableWidth);
      setPanelWidth((prev) =>
        Math.min(Math.max(MIN_PANEL_WIDTH, prev), nextMax),
      );
      if (availableWidth < 560) {
        setIsThreadRailCollapsed(true);
      }
    };

    applyViewportConstraints();
    window.addEventListener("resize", applyViewportConstraints);
    return () => window.removeEventListener("resize", applyViewportConstraints);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStartRef.current || typeof window === "undefined") return;
      const delta = resizeStartRef.current.startX - event.clientX;
      const availableWidth = Math.max(420, window.innerWidth - 24);
      const nextMax = Math.min(MAX_PANEL_WIDTH, availableWidth);
      const nextWidth = Math.min(
        nextMax,
        Math.max(MIN_PANEL_WIDTH, resizeStartRef.current.startWidth + delta),
      );
      setPanelWidth(nextWidth);
      if (nextWidth < 560) {
        setIsThreadRailCollapsed(true);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const loadThread = useCallback(async (threadId: string) => {
    setIsThreadLoading(true);
    try {
      const res = await fetch(`/api/assistant/threads/${threadId}?limit=120`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load thread");

      const parsed = parseThreadResponse(data);
      setActiveThread(parsed.thread);
      setChatHistory(parsed.messages);
      setComposerAttachments([]);
      setAttachmentError(null);
      setIsDraftingNewThread(false);
    } finally {
      setIsThreadLoading(false);
    }
  }, []);

  const loadThreads = useCallback(
    async (options?: { selectThreadId?: string; preserveDraft?: boolean }) => {
      setIsThreadsLoading(true);
      try {
        const res = await fetch("/api/assistant/threads?limit=40", {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load threads");

        const nextThreads = parseThreadsResponse(data);
        setThreads(nextThreads);

        if (options?.selectThreadId) {
          await loadThread(options.selectThreadId);
          return;
        }

        if (
          !activeThread &&
          !isDraftingNewThread &&
          !options?.preserveDraft &&
          nextThreads[0]
        ) {
          await loadThread(nextThreads[0].id);
        }
      } catch (error) {
        console.error("[AssistantPanel] Failed to load threads", error);
      } finally {
        setIsThreadsLoading(false);
      }
    },
    [activeThread, isDraftingNewThread, loadThread],
  );

  useEffect(() => {
    if (isOpen) {
      void loadThreads({ preserveDraft: true });
    }
  }, [isOpen, loadThreads]);

  const handleStartNewChat = () => {
    setActiveThread(null);
    setChatHistory([]);
    setComposerAttachments([]);
    setAttachmentError(null);
    setPrompt("");
    setIsDraftingNewThread(true);
    setDraftMode("agent");
    setDraftModelId(CHAT_MODELS[0].id);
    if (textareaRef.current) textareaRef.current.style.height = "36px";
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const validateAttachmentSelection = (
    type: AssistantAttachment["type"],
    files: File[],
  ): string | null => {
    const attachmentLimits = isGeminiThread
      ? GEMINI_ATTACHMENT_LIMITS
      : isClaudeThread
        ? CLAUDE_ATTACHMENT_LIMITS
        : isGPT52Thread
          ? GPT52_ATTACHMENT_LIMITS
        : isDeepSeekThread
          ? DEEPSEEK_ATTACHMENT_LIMITS
          : GEMINI_ATTACHMENT_LIMITS;
    const rule = attachmentLimits[type];
    const nextCount =
      (type === "image"
        ? imageAttachmentCount
        : type === "video"
          ? videoAttachmentCount
          : audioAttachmentCount) + files.length;

    if (nextCount > rule.maxCount) {
      if (type === "audio") {
        return "You can attach only 1 audio file per message.";
      }
      return `You can attach up to ${rule.maxCount} ${type}s per message.`;
    }

    const allowedMimeTypes = new Set(rule.accept.split(","));
    for (const file of files) {
      if (!allowedMimeTypes.has(file.type)) {
        return `${file.name} is not a supported ${type} format.`;
      }

      if (file.size <= 0) {
        return `${file.name} is empty or unreadable.`;
      }

      if (file.size > rule.maxBytes) {
        const sizeLabel = formatBytes(rule.maxBytes);
        return `${file.name} exceeds the ${sizeLabel} ${type} upload limit.`;
      }
    }

    return null;
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    resizeStartRef.current = {
      startX: event.clientX,
      startWidth: panelWidth,
    };
    setIsResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
  };

  const uploadAttachments = async (
    type: AssistantAttachment["type"],
    fileList: FileList | null,
  ) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const selectionError = validateAttachmentSelection(type, files);
    if (selectionError) {
      setAttachmentError(selectionError);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      return;
    }

    setIsUploadingAttachments(true);
    setAttachmentError(null);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        if (activeThread?.id) {
          formData.append("threadId", activeThread.id);
        }

        const res = await fetch("/api/assistant/attachments/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to upload attachment");
        }

        const attachment = data?.data?.attachment;
        if (attachment) {
          setComposerAttachments((prev) => [...prev, attachment]);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload attachment";
      setAttachmentError(message);
      console.error("[AssistantPanel] Attachment upload failed", error);
    } finally {
      setIsUploadingAttachments(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setComposerAttachments((prev) =>
      prev.filter((item) => item.id !== attachmentId),
    );
  };

  const handleSendChat = async () => {
    const text = prompt.trim();
    if (!text || isAiThinking) return;
    const optimisticDebit = effectiveMode === "agent" ? 1 : 0;

    const intent = detectIntent(text);
    const currentAttachments =
      effectiveMode === "chat" ? composerAttachments : [];
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      id: Date.now().toString(),
      attachments: currentAttachments,
    };

    setChatHistory((p) => [...p, userMsg]);
    setPrompt("");
    setComposerAttachments([]);
    setAttachmentError(null);
    if (textareaRef.current) textareaRef.current.style.height = "36px";
    setIsAiThinking(true);

    if (optimisticDebit > 0) {
      dispatch(deductCreditsOptimistic(optimisticDebit));
    }

    try {
      const endpoint =
        effectiveMode === "chat"
          ? "/api/assistant/chat-mode"
          : "/api/assistant/chat";
      const chatModelInput =
        effectiveMode === "chat" && effectiveModelId === GEMINI_MODEL_ID
          ? GEMINI_DEFAULT_INPUT
          : effectiveMode === "chat" && effectiveModelId === CLAUDE_MODEL_ID
            ? CLAUDE_DEFAULT_INPUT
            : effectiveMode === "chat" && effectiveModelId === GPT52_MODEL_ID
              ? GPT52_DEFAULT_INPUT
              : effectiveMode === "chat" &&
                  effectiveModelId === DEEPSEEK_MODEL_ID
                ? DEEPSEEK_DEFAULT_INPUT
              : undefined;
      const payload =
        effectiveMode === "chat"
          ? {
              message: text,
              history: chatHistory
                .slice(-6)
                .map(({ role, content }) => ({ role, content })),
              modelId: effectiveModelId,
              modelInput: chatModelInput
                ? effectiveModelId === CLAUDE_MODEL_ID
                  ? {
                      ...chatModelInput,
                      images: currentAttachments
                        .filter((item) => item.type === "image")
                        .map((item) => item.url),
                    }
                  : effectiveModelId === GPT52_MODEL_ID
                    ? {
                        ...chatModelInput,
                        image_input: currentAttachments
                          .filter((item) => item.type === "image")
                          .map((item) => item.url),
                      }
                    : effectiveModelId === DEEPSEEK_MODEL_ID
                      ? {
                          ...chatModelInput,
                          prompt: text,
                        }
                    : {
                        ...chatModelInput,
                        images: currentAttachments
                          .filter((item) => item.type === "image")
                          .map((item) => item.url),
                        videos: currentAttachments
                          .filter((item) => item.type === "video")
                          .map((item) => item.url),
                        audio:
                          currentAttachments.find(
                            (item) => item.type === "audio",
                          )?.url ?? null,
                      }
                : undefined,
              threadId: activeThread?.id,
              attachments: currentAttachments,
            }
          : {
              message: text,
              history: chatHistory
                .slice(-6)
                .map(({ role, content }) => ({ role, content })),
              threadId: activeThread?.id,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      const reply =
        data.reply || "I'm ready to help you create something amazing!";
      if (data.thread) {
        setActiveThread(data.thread);
        setIsDraftingNewThread(false);
      }

      const genPrompt = extractPrompt(reply, text);
      const finalIntent = detectIntentFromReply(reply, intent);
      const action: GenerationAction = finalIntent
        ? { type: finalIntent, prompt: genPrompt }
        : null;

      setChatHistory((p) => [
        ...p,
        {
          role: "assistant",
          content: reply,
          id: (Date.now() + 1).toString(),
          action,
        },
      ]);
      void loadThreads({ preserveDraft: true });
      await dispatch(syncCreditsWithBackend() as any);
    } catch {
      if (optimisticDebit > 0) {
        dispatch(rollbackCreditsOptimistic(optimisticDebit));
      }
      setChatHistory((p) => [
        ...p,
        {
          role: "assistant",
          content: "Something went wrong — please try again!",
          id: (Date.now() + 1).toString(),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div
      className={`fixed top-[64px] right-0 bottom-0 z-[100] transition-all duration-500 ease-in-out transform ${
        isOpen ? "translate-x-0" : "translate-x-full"
      } bg-black/70 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex`}
      style={{
        width: isOpen ? `${panelWidth}px` : "0px",
      }}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 z-[2] w-3 cursor-ew-resize transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onMouseDown={handleResizeStart}
        title="Resize assistant panel"
      >
        <div className="flex h-full w-full items-center justify-center">
          <div
            className={`rounded-full border border-white/10 bg-black/35 p-1 text-zinc-500 transition-colors ${isResizing ? "text-blue-300 border-blue-400/30" : ""}`}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div
        className="border-r border-white/5 bg-black/30 p-3 flex flex-col transition-[width] duration-300"
        style={{ width: `${threadRailWidth}px` }}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleStartNewChat}
            className={`inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 py-2.5 text-[11px] font-medium text-white hover:bg-blue-500 transition-colors ${
              isThreadRailCollapsed ? "w-10 px-0" : "flex-1 px-3"
            }`}
            title="New chat"
          >
            <Plus className="w-3.5 h-3.5" />
            {!isThreadRailCollapsed && <span>New</span>}
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsThreadRailCollapsed((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
              title={isThreadRailCollapsed ? "Expand chats" : "Collapse chats"}
            >
              {isThreadRailCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            {!isThreadRailCollapsed && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex-1 min-h-0">
          {!isThreadRailCollapsed && (
            <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Chats
            </p>
          )}
          <div className="space-y-2 overflow-y-auto pr-1 no-scrollbar">
            {isThreadsLoading && threads.length === 0 ? (
              <div
                className={`rounded-2xl border border-white/8 bg-white/[0.03] text-[11px] text-zinc-500 ${isThreadRailCollapsed ? "p-2 text-center" : "p-3"}`}
              >
                {isThreadRailCollapsed ? "..." : "Loading..."}
              </div>
            ) : threads.length === 0 ? (
              <div
                className={`rounded-2xl border border-white/8 bg-white/[0.03] text-[11px] leading-5 text-zinc-500 ${isThreadRailCollapsed ? "p-2 text-center" : "p-3"}`}
              >
                {isThreadRailCollapsed
                  ? "0"
                  : "Your saved assistant chats will appear here."}
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = activeThread?.id === thread.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => void loadThread(thread.id)}
                    className={`w-full rounded-2xl border text-left transition-colors ${
                      isActive
                        ? "border-blue-500/40 bg-blue-500/12 shadow-[0_10px_28px_rgba(37,99,235,0.14)]"
                        : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"
                    } ${isThreadRailCollapsed ? "px-0 py-3 flex items-center justify-center" : "px-3 py-3"}`}
                    title={isThreadRailCollapsed ? thread.title : undefined}
                  >
                    {isThreadRailCollapsed ? (
                      <div className="flex flex-col items-center gap-1 text-zinc-400">
                        {thread.mode === "agent" ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <MessageSquare className="w-4 h-4" />
                        )}
                        <span className="text-[9px]">
                          {thread.messageCount}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {thread.mode === "agent" ? (
                              <Bot className="w-3 h-3" />
                            ) : (
                              <MessageSquare className="w-3 h-3" />
                            )}
                            <span className="truncate">
                              {thread.mode === "chat"
                                ? getChatModelLabel(thread.modelId)
                                : "Agent"}
                            </span>
                          </div>
                          <span className="shrink-0 text-[9px] text-zinc-600">
                            {formatRelativeTime(
                              thread.updatedAt || thread.createdAt,
                            )}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-white">
                          {thread.title}
                        </p>
                        {thread.lastMessagePreview ? (
                          <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500">
                            {thread.lastMessagePreview}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-1.5 text-[9px] text-zinc-600">
                          <span className="rounded-full border border-white/8 bg-black/25 px-1.5 py-0.5">
                            {thread.messageCount} msg
                          </span>
                          {thread.attachmentCount > 0 && (
                            <span className="rounded-full border border-white/8 bg-black/25 px-1.5 py-0.5">
                              {thread.attachmentCount} files
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div
          className={`flex items-center justify-between ${panelHorizontalPadding} py-4 border-b border-white/5`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center shrink-0">
              {effectiveMode === "agent" ? (
                <Bot className="w-4 h-4 text-blue-400" />
              ) : (
                <MessageSquare className="w-4 h-4 text-blue-400" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-semibold text-sm">AI Assistant</h2>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 truncate">
                <span className="truncate">{currentModelLabel}</span>
                {activeThread && (
                  <span className="inline-flex items-center gap-1 shrink-0 text-zinc-600">
                    <Clock3 className="w-3 h-3" />
                    <span>
                      {formatRelativeTime(
                        activeThread.updatedAt || activeThread.createdAt,
                      )}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
          {activeThread && (
            <button
              type="button"
              onClick={() => {
                void fetch(`/api/assistant/threads/${activeThread.id}`, {
                  method: "DELETE",
                });
                handleStartNewChat();
                setThreads((prev) =>
                  prev.filter((item) => item.id !== activeThread.id),
                );
              }}
              className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              title="Delete current thread"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {isThreadRailCollapsed && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto ${panelHorizontalPadding} py-5 no-scrollbar`}
        >
          {!hasChatHistory && !isThreadLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-[360px] rounded-3xl border border-white/8 bg-white/[0.03] px-6 py-7 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
                  {effectiveMode === "agent" ? (
                    <Bot className="w-5 h-5" />
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </div>
                <p className="text-white text-base font-semibold">
                  {MODE_META[effectiveMode].title}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {MODE_META[effectiveMode].subtitle}
                </p>
                <div className="mt-4 inline-flex items-center rounded-full border border-white/8 bg-black/25 px-3 py-1 text-[10px] text-zinc-500">
                  {effectiveMode === "chat"
                    ? `Ready for ${currentModelLabel}`
                    : "Start with an idea, prompt, or creative ask"}
                </div>
              </div>
            </div>
          )}

          {isThreadLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-500">
                Loading chat...
              </div>
            </div>
          ) : (
            <div className={`space-y-4 ${hasChatHistory ? "pb-4" : ""}`}>
              <AnimatePresence initial={false}>
                {chatHistory.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring" as const,
                      damping: 22,
                      stiffness: 280,
                    }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="shrink-0 w-7 h-7 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mt-0.5 text-blue-300">
                        {effectiveMode === "agent" ? (
                          <Bot className="w-3.5 h-3.5" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5" />
                        )}
                      </div>
                    )}
                    <div
                      className={`flex flex-col gap-1.5 ${isCompactLayout ? "max-w-[96%]" : "max-w-[92%]"}`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-[0_12px_40px_rgba(0,0,0,0.22)] ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-white/[0.05] border border-white/10 text-zinc-200 rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-[10px] text-zinc-300 ${attachment.type === "image" ? "w-[116px]" : "inline-flex items-center gap-1 px-2.5 py-1.5"}`}
                            >
                              {attachment.type === "image" ? (
                                <div className="flex flex-col">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={attachment.url}
                                    alt={attachmentLabel(attachment)}
                                    className="h-[76px] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="flex items-center gap-1 px-2 py-1.5">
                                    <ImageIcon className="w-3 h-3 shrink-0" />
                                    <span className="truncate">
                                      {attachmentLabel(attachment)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {attachmentIcon(attachment)}
                                  <span className="max-w-[140px] truncate">
                                    {attachmentLabel(attachment)}
                                  </span>
                                </>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                      {msg.createdAt && (
                        <div
                          className={`px-1 text-[10px] ${msg.role === "user" ? "text-right text-blue-200/70" : "text-zinc-600"}`}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </div>
                      )}
                      {msg.role === "assistant" && msg.action && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0, scale: 0.9, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            type: "spring" as const,
                            damping: 20,
                            stiffness: 300,
                            delay: 0.15,
                          }}
                          onClick={() => onApplyPrompt(msg.action!.prompt)}
                          className="self-start flex flex-col gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all active:scale-95 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-blue-900/30 w-full"
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate flex-1 text-left">
                              {msg.action.prompt}
                            </span>
                          </div>
                          <div className="w-full border-t border-white/20 pt-1.5 text-[10px] text-center text-white/90">
                            Apply & Generate Image →
                          </div>
                        </motion.button>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="shrink-0 w-7 h-7 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center mt-0.5">
                        <User className="w-3 h-3 text-zinc-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {isAiThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="w-7 h-7 rounded-2xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center text-blue-300">
                      {effectiveMode === "agent" ? (
                        <Bot className="w-3.5 h-3.5" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        <div
          className={`${isCompactLayout ? "p-3" : "p-4"} border-t border-white/5 bg-black/40 backdrop-blur-md`}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept={GEMINI_ATTACHMENT_LIMITS.image.accept}
            multiple
            className="hidden"
            onChange={(e) => void uploadAttachments("image", e.target.files)}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept={GEMINI_ATTACHMENT_LIMITS.video.accept}
            multiple
            className="hidden"
            onChange={(e) => void uploadAttachments("video", e.target.files)}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept={GEMINI_ATTACHMENT_LIMITS.audio.accept}
            className="hidden"
            onChange={(e) => void uploadAttachments("audio", e.target.files)}
          />

          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_-10px_40px_rgba(0,0,0,0.25)] focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
            <div className="mb-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-full bg-black/40 border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!activeThread) setDraftMode("agent");
                  }}
                  disabled={!!activeThread}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-colors ${effectiveMode === "agent" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200"} ${activeThread ? "cursor-not-allowed opacity-60" : ""}`}
                  title="Agent mode"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Agent</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!activeThread) setDraftMode("chat");
                  }}
                  disabled={!!activeThread}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition-colors ${effectiveMode === "chat" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200"} ${activeThread ? "cursor-not-allowed opacity-60" : ""}`}
                  title="Chat mode"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              </div>

              {effectiveMode === "chat" && (
                <select
                  value={effectiveModelId}
                  onChange={(e) => {
                    if (!activeThread) setDraftModelId(e.target.value);
                  }}
                  disabled={!!activeThread}
                  className={`ml-auto ${isCompactLayout ? "max-w-[132px]" : "max-w-[160px]"} bg-black/40 border border-white/10 rounded-full px-3 py-1.5 text-[11px] text-zinc-200 focus:outline-none ${activeThread ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {CHAT_MODELS.map((model) => (
                    <option
                      key={model.id}
                      value={model.id}
                      className="bg-zinc-900"
                    >
                      {model.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {(isGeminiThread || isClaudeThread || isGPT52Thread) && (
              <div className="mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {isGeminiThread && (
                    <>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={
                          isUploadingAttachments ||
                          imageAttachmentCount >=
                            GEMINI_ATTACHMENT_LIMITS.image.maxCount
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.06] transition-colors"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>
                          Images {imageAttachmentCount}/
                          {GEMINI_ATTACHMENT_LIMITS.image.maxCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={
                          isUploadingAttachments ||
                          videoAttachmentCount >=
                            GEMINI_ATTACHMENT_LIMITS.video.maxCount
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.06] transition-colors"
                      >
                        <Film className="w-3 h-3" />
                        <span>
                          Videos {videoAttachmentCount}/
                          {GEMINI_ATTACHMENT_LIMITS.video.maxCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => audioInputRef.current?.click()}
                        disabled={
                          isUploadingAttachments ||
                          audioAttachmentCount >=
                            GEMINI_ATTACHMENT_LIMITS.audio.maxCount
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                      >
                        <Music4 className="w-3 h-3" />
                        <span>
                          Audio {audioAttachmentCount}/
                          {GEMINI_ATTACHMENT_LIMITS.audio.maxCount}
                        </span>
                      </button>
                    </>
                  )}
                  {isClaudeThread && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={
                        isUploadingAttachments ||
                        imageAttachmentCount >=
                          CLAUDE_ATTACHMENT_LIMITS.image.maxCount
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>
                        Images {imageAttachmentCount}/
                        {CLAUDE_ATTACHMENT_LIMITS.image.maxCount}
                      </span>
                    </button>
                  )}
                  {isGPT52Thread && (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={
                        isUploadingAttachments ||
                        imageAttachmentCount >=
                          GPT52_ATTACHMENT_LIMITS.image.maxCount
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>
                        Images {imageAttachmentCount}/
                        {GPT52_ATTACHMENT_LIMITS.image.maxCount}
                      </span>
                    </button>
                  )}
                  {isUploadingAttachments && (
                    <span className="text-[10px] text-zinc-500">
                      Uploading...
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[10px] leading-4 text-zinc-500">
                  {isGeminiThread && (
                    <>
                      {GEMINI_ATTACHMENT_LIMITS.image.helper}{" "}
                      {GEMINI_ATTACHMENT_LIMITS.video.helper}{" "}
                      {GEMINI_ATTACHMENT_LIMITS.audio.helper}
                    </>
                  )}
                  {isClaudeThread && (
                    <>{CLAUDE_ATTACHMENT_LIMITS.image.helper}</>
                  )}
                  {isGPT52Thread && <>{GPT52_ATTACHMENT_LIMITS.image.helper}</>}
                </p>
                {attachmentError && (
                  <div className="mt-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                    {attachmentError}
                  </div>
                )}
              </div>
            )}

            {composerAttachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {composerAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] text-[10px] text-zinc-300 ${attachment.type === "image" ? "w-[120px]" : ""}`}
                  >
                    {attachment.type === "image" ? (
                      <div className="flex flex-col">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachment.url}
                          alt={attachmentLabel(attachment)}
                          className="h-[80px] w-full object-cover"
                        />
                        <div className="flex items-center gap-1 px-2 py-1.5">
                          <ImageIcon className="w-3 h-3 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">
                            {attachmentLabel(attachment)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-zinc-500 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1.5">
                        {attachmentIcon(attachment)}
                        <span className="max-w-[150px] truncate">
                          {attachmentLabel(attachment)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="text-zinc-500 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (e.target) {
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder={
                  effectiveMode === "chat"
                    ? `Ask ${isCompactLayout ? "model" : currentModelLabel}...`
                    : "Ask assistant..."
                }
                className="w-full bg-transparent border-0 ring-0 focus:ring-0 outline-none text-white placeholder-zinc-500 text-sm min-h-[28px] max-h-[120px] px-1 py-1.5 resize-none font-sans"
                rows={1}
              />
              <AnimatePresence mode="wait">
                <motion.button
                  key={isAiThinking ? "thinking" : "send"}
                  onClick={handleSendChat}
                  disabled={
                    !prompt.trim() || isAiThinking || isUploadingAttachments
                  }
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="mb-0.5 shrink-0 rounded-full bg-blue-600 p-2 text-white hover:bg-blue-500 disabled:bg-white/8 disabled:text-white/20 transition-colors"
                >
                  {isAiThinking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              </AnimatePresence>
            </div>
          </div>
          <p className="text-center text-[9px] text-zinc-600 mt-2">
            WildMind AI can make mistakes. Review responses before using them in
            production prompts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;
