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
  Link2,
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
  GEMINI25_FLASH_ATTACHMENT_LIMITS,
  GEMINI25_FLASH_DEFAULT_INPUT,
  GEMINI25_FLASH_MODEL_ID,
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

type ThinkingOption = {
  value: string;
  label: string;
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
const GEMINI_THINKING_OPTIONS: ThinkingOption[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const GPT52_REASONING_OPTIONS: ThinkingOption[] = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "X-High" },
];
const DEEPSEEK_THINKING_OPTIONS: ThinkingOption[] = [
  { value: "None", label: "None" },
  { value: "medium", label: "Medium" },
];
const CHAT_MODEL_TRIGGER_MIN_WIDTH = `calc(${Math.max(...CHAT_MODELS.map((model) => model.label.length))}ch + 3.5rem)`;
const SELECT_CONTROL_CLASSNAME =
  "inline-flex h-9 items-center justify-between gap-3 rounded-lg border border-white/12 bg-[#0F1117] px-4 text-left text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors";
const ICON_CONTROL_CLASSNAME =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-[#0F1117] text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-white/20 hover:bg-[#131722] hover:text-white disabled:opacity-50";

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
  const quoted = aiReply.match(/(?:"|â€œ|â€)([^"â€œâ€]{15,})(?:"|â€œ|â€)/);
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

function formatThreadDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
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
  const [draftMode, setDraftMode] = useState<AssistantMode>("chat");
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
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isThinkingMenuOpen, setIsThinkingMenuOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [geminiThinkingLevel, setGeminiThinkingLevel] = useState<
    "low" | "medium" | "high"
  >(GEMINI_DEFAULT_INPUT.thinking_level);
  const [gpt52ReasoningEffort, setGpt52ReasoningEffort] = useState<
    "none" | "low" | "medium" | "high" | "xhigh"
  >(GPT52_DEFAULT_INPUT.reasoning_effort);
  const [deepSeekThinkingMode, setDeepSeekThinkingMode] = useState<
    "None" | "medium"
  >(DEEPSEEK_DEFAULT_INPUT.thinking);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuButtonRef = useRef<HTMLButtonElement>(null);
  const thinkingMenuRef = useRef<HTMLDivElement>(null);
  const thinkingMenuButtonRef = useRef<HTMLButtonElement>(null);
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
  const isGemini25FlashThread =
    effectiveMode === "chat" && effectiveModelId === GEMINI25_FLASH_MODEL_ID;
  const shouldShowThinkingSelector =
    isGeminiThread || isGPT52Thread || isDeepSeekThread;
  const thinkingOptions = isGeminiThread
    ? GEMINI_THINKING_OPTIONS
    : isGPT52Thread
      ? GPT52_REASONING_OPTIONS
      : isDeepSeekThread
        ? DEEPSEEK_THINKING_OPTIONS
        : [];
  const currentThinkingValue = isGeminiThread
    ? geminiThinkingLevel
    : isGPT52Thread
      ? gpt52ReasoningEffort
      : isDeepSeekThread
        ? deepSeekThinkingMode
        : "";
  const currentThinkingLabel =
    thinkingOptions.find((option) => option.value === currentThinkingValue)
      ?.label ?? "Thinking";
  const shouldModelMenuScroll = CHAT_MODELS.length > 4;
  const shouldThinkingMenuScroll = thinkingOptions.length > 4;
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
  const openPreferredAttachmentPicker = () => {
    imageInputRef.current?.click();
  };

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

  useEffect(() => {
    if (!isModelMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        modelMenuRef.current?.contains(target) ||
        modelMenuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsModelMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModelMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isModelMenuOpen]);

  useEffect(() => {
    if (!isThinkingMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        thinkingMenuRef.current?.contains(target) ||
        thinkingMenuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsThinkingMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsThinkingMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isThinkingMenuOpen]);

  const handleStartNewChat = () => {
    setActiveThread(null);
    setChatHistory([]);
    setComposerAttachments([]);
    setAttachmentError(null);
    setIsModelMenuOpen(false);
    setIsThinkingMenuOpen(false);
    setPrompt("");
    setIsDraftingNewThread(true);
    setDraftMode("chat");
    setDraftModelId(CHAT_MODELS[0].id);
    setGeminiThinkingLevel(GEMINI_DEFAULT_INPUT.thinking_level);
    setGpt52ReasoningEffort(GPT52_DEFAULT_INPUT.reasoning_effort);
    setDeepSeekThinkingMode(DEEPSEEK_DEFAULT_INPUT.thinking);
    if (textareaRef.current) textareaRef.current.style.height = "36px";
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleDeleteActiveThread = useCallback(async () => {
    if (!activeThread) return;

    const deletedThreadId = activeThread.id;

    handleStartNewChat();
    setThreads((prev) => prev.filter((item) => item.id !== deletedThreadId));

    try {
      const res = await fetch(`/api/assistant/threads/${deletedThreadId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete thread");
      }
    } catch (error) {
      console.error("[AssistantPanel] Failed to delete thread", error);
    } finally {
      void loadThreads({ preserveDraft: true });
    }
  }, [activeThread, loadThreads]);

  const validateAttachmentSelection = (
    type: AssistantAttachment["type"],
    files: File[],
  ): string | null => {
    const attachmentLimits = isGeminiThread
      ? GEMINI_ATTACHMENT_LIMITS
      : isGemini25FlashThread
        ? GEMINI25_FLASH_ATTACHMENT_LIMITS
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
          ? {
              ...GEMINI_DEFAULT_INPUT,
              thinking_level: geminiThinkingLevel,
            }
          : effectiveMode === "chat" &&
              effectiveModelId === GEMINI25_FLASH_MODEL_ID
            ? GEMINI25_FLASH_DEFAULT_INPUT
            : effectiveMode === "chat" && effectiveModelId === CLAUDE_MODEL_ID
              ? CLAUDE_DEFAULT_INPUT
              : effectiveMode === "chat" && effectiveModelId === GPT52_MODEL_ID
                ? {
                    ...GPT52_DEFAULT_INPUT,
                    reasoning_effort: gpt52ReasoningEffort,
                  }
                : effectiveMode === "chat" &&
                    effectiveModelId === DEEPSEEK_MODEL_ID
                  ? {
                      ...DEEPSEEK_DEFAULT_INPUT,
                      thinking: deepSeekThinkingMode,
                    }
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
                  : effectiveModelId === GEMINI25_FLASH_MODEL_ID
                    ? {
                        ...chatModelInput,
                        images: currentAttachments
                          .filter((item) => item.type === "image")
                          .map((item) => item.url),
                        videos: currentAttachments
                          .filter((item) => item.type === "video")
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
          content: "Something went wrong â€” please try again!",
          id: (Date.now() + 1).toString(),
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full h-full max-w-[1200px] sm:rounded-2xl overflow-visible border-0 sm:border sm:border-white/[0.07] bg-[#0E0F13] shadow-2xl">
        {/* SIDEBAR */}
        <div
          className={`hidden sm:flex border-r border-white/[0.07] bg-[#16181F] flex-col flex-shrink-0 w-[260px]`}
        >
          <div className="h-[54px] px-3 border-b border-white/[0.07] flex items-center min-w-[260px]">
            <button
              type="button"
              onClick={handleStartNewChat}
              className="flex items-center gap-2 w-full px-3.5 py-2 bg-[#4A6CF7] border-none rounded-[10px] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
              title="New chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New conversation</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col min-w-[260px]">
            <p className="px-[14px] pt-[14px] pb-[6px] text-[10px] font-medium uppercase tracking-[0.1em] text-white/20 shrink-0">
              Recents
            </p>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 flex flex-col gap-0.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-white/[0.07] [&::-webkit-scrollbar-thumb]:rounded">
              {isThreadsLoading && threads.length === 0 ? (
                <div className="rounded-lg text-[11px] text-white/20 p-3">
                  Loading...
                </div>
              ) : threads.length === 0 ? (
                <div className="rounded-lg text-[11px] leading-5 text-white/20 p-3">
                  Your saved assistant chats will appear here.
                </div>
              ) : (
                threads.map((thread) => {
                  const isActive = activeThread?.id === thread.id;
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => void loadThread(thread.id)}
                      className={`w-full rounded-lg text-left transition-colors cursor-pointer px-3 py-2 ${
                        isActive
                          ? "bg-[rgba(74,108,247,0.12)]"
                          : "hover:bg-[#1E2029]"
                      }`}
                    >
                      <p className="text-[12.5px] text-[#F0F0F5] line-clamp-1 leading-5">
                        {thread.title}
                      </p>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-white/30">
                        <span className="truncate">
                          {thread.mode === "chat"
                            ? getChatModelLabel(thread.modelId)
                            : "Agent"}
                        </span>
                        <span className="shrink-0 text-right">
                          {formatThreadDateTime(
                            thread.updatedAt,
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* MOBILE SIDEBAR DRAWER */}
        {isMobileSidebarOpen && (
          <div
            className="sm:hidden absolute inset-0 z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/55" />
            <div
              className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#16181F] border-r border-white/[0.07] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.4)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-[54px] px-3 border-b border-white/[0.07] flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    handleStartNewChat();
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3.5 py-2 bg-[#4A6CF7] border-none rounded-[10px] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New conversation</span>
                </button>
              </div>
              <p className="px-[14px] pt-[14px] pb-[6px] text-[10px] font-medium uppercase tracking-[0.1em] text-white/20 shrink-0">
                Recents
              </p>
              <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 flex flex-col gap-0.5 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-white/[0.07] [&::-webkit-scrollbar-thumb]:rounded">
                {threads.length === 0 ? (
                  <div className="rounded-lg text-[11px] leading-5 text-white/20 p-3">
                    Your saved assistant chats will appear here.
                  </div>
                ) : (
                  threads.map((thread) => {
                    const isActive = activeThread?.id === thread.id;
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => {
                          void loadThread(thread.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full rounded-lg text-left transition-colors cursor-pointer px-3 py-2 ${
                          isActive
                            ? "bg-[rgba(74,108,247,0.12)]"
                            : "hover:bg-[#1E2029]"
                        }`}
                      >
                        <p className="text-[12.5px] text-[#F0F0F5] line-clamp-1 leading-5">
                          {thread.title}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-[10px] text-white/30">
                          <span className="truncate">
                            {thread.mode === "chat"
                              ? getChatModelLabel(thread.modelId)
                              : "Agent"}
                          </span>
                          <span className="shrink-0 text-right">
                            {formatThreadDateTime(thread.updatedAt)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* MAIN */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* TOPBAR */}
          <div className="h-[54px] border-b border-white/[0.07] flex items-center px-3 gap-[10px] flex-shrink-0">
            {/* Mobile sidebar toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="sm:hidden w-[30px] h-[30px] rounded-lg border border-white/[0.07] flex items-center justify-center text-white/45 hover:bg-[#1E2029] hover:text-[#F0F0F5] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 4h10M2 7h10M2 10h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(74,108,247,0.12)] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-[#4A6CF7]" />
            </div>
            <div className="min-w-0">
              <div
                className="text-[#F0F0F5] text-[14px] font-semibold"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Chat with  AI
              </div>
              <div className="text-[11px] text-white/45 truncate">
                {currentModelLabel}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-[6px]">
              {activeThread && (
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteActiveThread();
                  }}
                  className="w-[30px] h-[30px] rounded-lg border border-white/[0.07] flex items-center justify-center text-white/45 hover:bg-[#1E2029] hover:text-[#F0F0F5] transition-colors"
                  title="Delete current thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-[30px] h-[30px] rounded-lg border border-white/[0.07] flex items-center justify-center text-white/45 hover:bg-[#1E2029] hover:text-[#F0F0F5] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-white/[0.07] [&::-webkit-scrollbar-thumb]:rounded">
            {!hasChatHistory && !isThreadLoading && (
              <div className="h-full flex items-center justify-center pb-10">
                <div className="flex flex-col items-center gap-[10px] text-center">
                  <div className="w-[54px] h-[54px] rounded-2xl bg-[rgba(74,108,247,0.12)] border border-[rgba(74,108,247,0.25)] flex items-center justify-center mb-1.5">
                    <MessageSquare className="w-6 h-6 text-[#4A6CF7]" />
                  </div>
                  <p
                    className="text-[#F0F0F5] text-xl font-semibold"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                  >
                    {MODE_META[effectiveMode].title}
                  </p>
                  <p className="text-[13px] text-white/45 max-w-[280px] leading-relaxed">
                    {MODE_META[effectiveMode].subtitle}
                  </p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-white/[0.07] bg-[#1E2029] px-3 py-1 text-[10px] text-white/45">
                    {effectiveMode === "chat"
                      ? `Ready for ${currentModelLabel}`
                      : "Start with an idea, prompt, or creative ask"}
                  </div>
                </div>
              </div>
            )}

            {isThreadLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-lg bg-[#1E2029] border border-white/[0.07] px-4 py-3 text-sm text-white/45">
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
                        <div className="shrink-0 w-7 h-7 rounded-lg bg-[rgba(74,108,247,0.12)] flex items-center justify-center mt-0.5 text-[#4A6CF7]">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="flex flex-col gap-0.5 max-w-[85%] sm:max-w-[520px] lg:max-w-[600px]">
                        <div
                          className={`rounded-xl px-3.5 py-2.5 text-[13.5px] leading-[1.65] whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-[#4A6CF7] text-white rounded-tr-sm"
                              : "bg-[#1E2029] border border-white/[0.07] text-[#F0F0F5] rounded-tl-sm"
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
                                className={`group overflow-hidden rounded-xl border border-white/[0.07] bg-[#1E2029] text-[10px] text-white/45 ${attachment.type === "image" ? "w-[116px]" : "inline-flex items-center gap-1 px-2.5 py-1.5"}`}
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
                            className="self-start flex flex-col gap-0.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all active:scale-95 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-blue-900/30 w-full"
                          >
                            <div className="flex items-center gap-1.5 w-full">
                              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate flex-1 text-left">
                                {msg.action.prompt}
                              </span>
                            </div>
                            <div className="w-full border-t border-white/20 pt-1.5 text-[10px] text-center text-white/90">
                              Apply & Generate Image â†’
                            </div>
                          </motion.button>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#4A6CF7] to-[#8B5CF6] flex items-center justify-center mt-0.5">
                          <User className="w-3 h-3 text-white" />
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
                      <div className="w-7 h-7 rounded-lg bg-[rgba(74,108,247,0.12)] flex items-center justify-center text-[#4A6CF7]">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-[#1E2029] border border-white/[0.07] rounded-xl rounded-tl-sm px-4 py-3 flex gap-1.5">
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

          {/* INPUT AREA */}
          <div className="p-3 sm:p-0 sm:px-4 flex-shrink-0">
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

            <div className="relative rounded-lg backdrop-blur-3xl ring-1 ring-white/20 hover:ring-white/30 shadow-2xl bg-black/20 hover:bg-black/40 px-3 pt-3 pb-2 space-y-2 transition-all duration-300">
              <div className="flex items-center justify-between gap-3">
                {/* Agent/Chat mode toggle â€“ agent mode commented out for now
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
              */}

                {effectiveMode === "chat" && (
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <div
                      className="relative flex-1 sm:flex-none"
                      style={{ minWidth: CHAT_MODEL_TRIGGER_MIN_WIDTH }}
                    >
                      <button
                        ref={modelMenuButtonRef}
                        type="button"
                        onClick={() => {
                          if (!activeThread) {
                            setIsThinkingMenuOpen(false);
                            setIsModelMenuOpen((prev) => !prev);
                          }
                        }}
                        disabled={!!activeThread}
                        aria-haspopup="menu"
                        aria-expanded={isModelMenuOpen}
                        className={`${SELECT_CONTROL_CLASSNAME} w-full ${
                          activeThread
                            ? "cursor-not-allowed opacity-70"
                            : "hover:border-white/20 hover:bg-[#131722]"
                        }`}
                      >
                        <span className="truncate">{currentModelLabel}</span>
                        <svg
                          className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${isModelMenuOpen ? "rotate-180" : ""}`}
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M5 7.5L10 12.5L15 7.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {isModelMenuOpen && !activeThread && (
                        <div
                          ref={modelMenuRef}
                          className="absolute left-0 top-[calc(100%+8px)] z-[60] min-w-full overflow-hidden rounded-lg border border-white/10 bg-[#0B0D12] shadow-[0_22px_50px_rgba(0,0,0,0.45)]"
                        >
                          <div
                            className={`${shouldModelMenuScroll ? "max-h-[100px] overflow-y-auto pr-0.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.38)]" : "overflow-y-visible"} py-0`}
                            style={
                              shouldModelMenuScroll
                                ? {
                                    scrollbarWidth: "thin",
                                    scrollbarColor:
                                      "rgba(255,255,255,0.38) transparent",
                                  }
                                : undefined
                            }
                          >
                            {CHAT_MODELS.map((model) => {
                              const isSelected = model.id === effectiveModelId;

                              return (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => {
                                    setDraftModelId(model.id);
                                    setIsModelMenuOpen(false);
                                  }}
                                  className={`flex w-full items-center gap-3 px-2 py-2 text-left text-[12px] transition-colors ${
                                    isSelected
                                      ? "bg-white/95 text-black"
                                      : "text-white hover:bg-white/5"
                                  }`}
                                >
                                  <span className="truncate">{model.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {shouldShowThinkingSelector && (
                      <div className="relative min-w-[138px] flex-1 sm:flex-none">
                        <button
                          ref={thinkingMenuButtonRef}
                          type="button"
                          onClick={() => {
                            setIsModelMenuOpen(false);
                            setIsThinkingMenuOpen((prev) => !prev);
                          }}
                          aria-haspopup="menu"
                          aria-expanded={isThinkingMenuOpen}
                          className={`${SELECT_CONTROL_CLASSNAME} w-full hover:border-white/20 hover:bg-[#131722]`}
                        >
                          <span className="truncate">{currentThinkingLabel}</span>
                          <svg
                            className={`h-4 w-4 shrink-0 text-white/70 transition-transform ${isThinkingMenuOpen ? "rotate-180" : ""}`}
                            viewBox="0 0 20 20"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M5 7.5L10 12.5L15 7.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {isThinkingMenuOpen && (
                          <div
                            ref={thinkingMenuRef}
                            className="absolute left-0 top-[calc(100%+8px)] z-[60] min-w-full overflow-hidden rounded-lg border border-white/10 bg-[#0B0D12] shadow-[0_22px_50px_rgba(0,0,0,0.45)]"
                          >
                            <div
                              className={`${shouldThinkingMenuScroll ? "max-h-[132px] overflow-y-auto pr-0.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(255,255,255,0.38)]" : "overflow-y-visible"} py-0`}
                              style={
                                shouldThinkingMenuScroll
                                  ? {
                                      scrollbarWidth: "thin",
                                      scrollbarColor:
                                        "rgba(255,255,255,0.38) transparent",
                                    }
                                  : undefined
                              }
                            >
                              {thinkingOptions.map((option) => {
                                const isSelected =
                                  option.value === currentThinkingValue;

                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      if (isGeminiThread) {
                                        setGeminiThinkingLevel(
                                          option.value as "low" | "medium" | "high",
                                        );
                                      } else if (isGPT52Thread) {
                                        setGpt52ReasoningEffort(
                                          option.value as
                                            | "none"
                                            | "low"
                                            | "medium"
                                            | "high"
                                            | "xhigh",
                                        );
                                      } else if (isDeepSeekThread) {
                                        setDeepSeekThinkingMode(
                                          option.value as "None" | "medium",
                                        );
                                      }
                                      setIsThinkingMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center px-3 py-2 text-left text-[12px] transition-colors ${
                                      isSelected
                                        ? "bg-white/95 text-black"
                                        : "text-white hover:bg-white/5"
                                    }`}
                                  >
                                    <span className="truncate">
                                      {option.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {(isGeminiThread ||
                  isGemini25FlashThread ||
                  isClaudeThread ||
                  isGPT52Thread) && (
                  <div className="relative ml-auto flex items-center gap-3">
                    {isUploadingAttachments && (
                      <span className="text-[10px] text-white/40">
                        Uploading...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={openPreferredAttachmentPicker}
                      disabled={isUploadingAttachments}
                      className={ICON_CONTROL_CLASSNAME}
                      title="Attach files"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {(isGeminiThread ||
                isGemini25FlashThread ||
                isClaudeThread ||
                isGPT52Thread) && (
                <div>
                  {/* <p className="mt-1.5 text-[10px] leading-4 text-white/30">
                    {isGeminiThread && (
                      <>
                        {GEMINI_ATTACHMENT_LIMITS.image.helper}{" "}
                        {GEMINI_ATTACHMENT_LIMITS.video.helper}{" "}
                        {GEMINI_ATTACHMENT_LIMITS.audio.helper}
                      </>
                    )}
                    {isGemini25FlashThread && (
                      <>
                        {GEMINI25_FLASH_ATTACHMENT_LIMITS.image.helper}{" "}
                        {GEMINI25_FLASH_ATTACHMENT_LIMITS.video.helper}
                      </>
                    )}
                    {isClaudeThread && (
                      <>{CLAUDE_ATTACHMENT_LIMITS.image.helper}</>
                    )}
                    {isGPT52Thread && (
                      <>{GPT52_ATTACHMENT_LIMITS.image.helper}</>
                    )}
                  </p> */}
                  {attachmentError && (
                    <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
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
                      className={`overflow-hidden rounded-lg border border-white/10 bg-black/30 text-[10px] text-white/50 ${attachment.type === "image" ? "w-[120px]" : ""}`}
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
                              className="text-white/40 hover:text-white"
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
                            className="text-white/40 hover:text-white"
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
                      ? `Ask ${currentModelLabel}...`
                      : "Ask assistant..."
                  }
                  className="w-full bg-transparent border-0 ring-0 focus:ring-0 outline-none text-white placeholder-white/50 text-[13px] font-thin min-h-[100px] max-h-[100px] px-1 py-1.5 resize-none leading-relaxed"
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
                    className="shrink-0 w-8 h-8 rounded-lg bg-[#2F6BFF] hover:bg-[#2a5fe3] flex items-center justify-center text-white disabled:opacity-70 disabled:hover:bg-[#2F6BFF] transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
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
            <p className="text-center text-[11px] text-white/20 mt-1.5">
              WildMind AI can make mistakes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;
