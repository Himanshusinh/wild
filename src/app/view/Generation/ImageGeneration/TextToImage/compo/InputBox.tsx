"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  ChevronUp,
  Trash2,
  Edit3,
  SquarePen,
  PhoneOutgoing,
  PhoneOutgoingIcon,
  ImageIcon,
  Menu,
  ArrowRight,
  Search,
  SlidersHorizontal,
  CalendarDays,
  X,
} from "lucide-react";
// HistoryEntry import follows below
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { AUTH_ROUTES, getSignInUrl } from "@/routes/routes";
import {
  setPrompt,
  generateImages,
  generateMiniMaxImages,
  setUploadedImages,
  setSelectedCharacter,
  addSelectedCharacter,
  removeSelectedCharacter,
  clearSelectedCharacters,
  setSelectedModel,
  addActiveGeneration,
  updateActiveGeneration,
  removeActiveGeneration,
  setImageCount,
  setFrameSize,
  setStyle,
  setOutputFormat,
  setNanoBananaResolution,
  setNanoBananaGoogleSearch,
  setNanoBananaImageSearch,
  setNanoBananaThinkingLevel,
  setNanoBananaLimitGenerations,
} from "@/store/slices/generationSlice";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import {
  runwayGenerate,
  runwayStatus,
  bflGenerate,
  falGenerate,
  replicateGenerate,
} from "@/store/slices/generationsApi";
import {
  toggleDropdown,
  addNotification,
  setCurrentGenerationType,
  setSidebarExpanded,
} from "@/store/slices/uiSlice";
import {
  loadMoreHistory,
  removeHistoryEntry,
  loadHistory,
  addHistoryEntry,
  updateHistoryEntry,
  clearHistory,
} from "@/store/slices/historySlice";
import axiosInstance, { getApiClient } from "@/lib/axiosInstance";
import {
  incrementFreeTurboUsedOptimistic,
  decrementFreeTurboUsedOptimistic,
} from "@/store/slices/creditsSlice";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";
import { getStudioDraft, clearStudioDraft } from "@/lib/studioDraft";
import { qlog, qwarn, qerr } from "@/lib/queueDebug";
import toast from "react-hot-toast";
import { enhancePromptAPI } from "@/lib/api/geminiApi";
// Note: addHistoryEntry and updateHistoryEntry are now imported from historySlice

// Import the new components
import { waitForRunwayCompletion } from "@/lib/runwayService";
import { uploadGeneratedImage } from "@/lib/imageUpload";
import { extractFalErrorDetails, showFalErrorToast } from "@/lib/falToast";
import {
  extractReplicateErrorDetails,
  showReplicateErrorToast,
} from "@/lib/replicateToast";
import { getIsPublic } from "@/lib/publicFlag";
import { useGenerationCredits } from "@/hooks/useCredits";
import {
  getImageGenerationCreditCost,
  formatCredits,
} from "@/utils/creditValidation";
import { saveUpload } from "@/lib/libraryApi";
import { toResourceProxy, toZataPath, toDirectUrl } from "@/lib/thumb";
// Replaced per-page IntersectionObserver with unified bottom scroll pagination
import { useBottomScrollPagination } from "@/hooks/useBottomScrollPagination";
import InfiniteScrollDebugOverlay, {
  IOEvent,
} from "@/components/debug/InfiniteScrollDebugOverlay";
import AssistantPanel from "./AssistantPanel";
import { updateFirebaseHistory, saveHistoryEntry } from "./inputBox/historyApi";
import { GifLoader } from "./inputBox/GifLoader";
import {
  getInputImageLimitForModel,
  normalizeIncomingImageModel,
} from "./inputBox/modelImageLimits";
import {
  INDIAN_STYLE_LOOKUP,
  getIndianBasePrompt,
} from "./inputBox/indianStylePrompts";
import {
  toGridAspectRatioCss,
  getHistoryImageDisplaySrc,
  historyEntryContributesGalleryTiles,
  countGalleryCellsForEntries,
} from "./inputBox/historyDisplayUtils";
import { InputBoxGlobalStyles } from "./inputBox/InputBoxGlobalStyles";
import { InputBoxHistoryChrome } from "./inputBox/InputBoxHistoryChrome";
import { InputBoxHistoryOverlays } from "./inputBox/InputBoxHistoryOverlays";
import { InputBoxHistoryScrollBody } from "./inputBox/InputBoxHistoryScrollBody";
import {
  convertFrameSizeToRunwayRatio,
  coerceRunwayRatio,
  mapRunwayStatus,
} from "./inputBox/runwayFrameUtils";
import {
  convertFrameSizeToZTurboDimensions,
  convertFrameSizeToFluxProDimensions,
} from "./inputBox/frameDimensionUtils";
import { InputBoxLayerModals } from "./inputBox/InputBoxLayerModals";
import { InputBoxFixedPromptDock } from "./inputBox/InputBoxFixedPromptDock";
import { InputBoxShell } from "./inputBox/InputBoxShell";
import { useInputBoxHistory } from "./inputBox/useInputBoxHistory";
import {
  bindHandleGenerate,
  type InputBoxGenerationRuntime,
} from "./inputBox/generation/handleGenerateCore";
import {
  createHandleFalError,
  createHandleReplicateError,
} from "./inputBox/generation/falReplicateErrorHandlers";
import { CUSTOM_STYLE_FROM_IMAGE_ID } from "@/constants/customStyleFromImage";

const PROMPT_EDITOR_MIN_HEIGHT_PX = 68; // ~4 lines default
const PROMPT_EDITOR_MAX_HEIGHT_PX = 68; // ~4 lines max

const InputBox = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const userData = useAppSelector((state: any) => state.auth?.user);
  const authLoading = useAppSelector(
    (state: any) => state.auth?.loading ?? true,
  );
  const pathname = usePathname();
  const isInlineEditImagePage = (pathname || "").startsWith(
    "/text-to-image/edit-image",
  );
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    image: any;
  } | null>(null);
  const [assetViewer, setAssetViewer] = useState<{
    isOpen: boolean;
    assetUrl: string;
    assetType: "image" | "video" | "audio";
    title: string;
  }>({
    isOpen: false,
    assetUrl: "",
    assetType: "image",
    title: "Uploaded Asset",
  });
  const [isUpscaleOpen, setIsUpscaleOpen] = useState(false);
  const [isRemoveBgOpen, setIsRemoveBgOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isPluginsMenuOpen, setIsPluginsMenuOpen] = useState(false);
  const pluginsMenuRef = useRef<HTMLDivElement>(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);
  // Local, ephemeral entry to mimic history-style preview while generating
  const [localGeneratingEntries, setLocalGeneratingEntries] = useState<
    HistoryEntry[]
  >([]);

  // If user just logged in and the URL requests opening the external image editor, do it once.
  useEffect(() => {
    try {
      const shouldOpen = searchParams?.get("openImageEditor") === "1";
      if (!shouldOpen) return;
      if (!userData) return;

      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      const url = isLocal
        ? "http://localhost:3005"
        : "https://editor-image.wildmindai.com/";
      window.open(url, "_blank");

      // Clean up the query param so refresh doesn't keep opening tabs.
      router.replace("/text-to-image");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // Parallel-safe helpers: keep one local card per generation, without wiping other in-flight jobs.
  const upsertLocalGeneratingEntry = useCallback((entry: HistoryEntry) => {
    const id = String(
      (entry as any)?.id || (entry as any)?.firebaseHistoryId || "",
    );
    if (!id) return;
    qlog("Upserting local generating entry", {
      id,
      status: (entry as any)?.status,
    });
    setLocalGeneratingEntries((prev) => {
      const filtered = prev.filter((e: any) => {
        const eId = String(e?.id || "");
        const eFirebaseId = String((e as any)?.firebaseHistoryId || "");
        return eId !== id && eFirebaseId !== id;
      });
      return [entry, ...filtered].slice(0, 4);
    });
  }, []);

  const removeLocalGeneratingEntry = useCallback(
    (idOrIds?: string | string[]) => {
      const ids = (Array.isArray(idOrIds) ? idOrIds : [idOrIds])
        .filter(Boolean)
        .map(String);
      if (ids.length === 0) return;
      qlog("Removing local generating entries", { ids });
      setLocalGeneratingEntries((prev) =>
        prev.filter((e: any) => {
          const eId = String(e?.id || "");
          const eFirebaseId = String((e as any)?.firebaseHistoryId || "");
          return !ids.includes(eId) && !ids.includes(eFirebaseId);
        }),
      );
    },
    [],
  );

  // Local state setter kept for backward compatibility (parallel generation uses Redux `activeGenerations`)
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

  // Track which images have loaded to hide shimmer effect
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  // Local state to track prompt enhancement (loading skeleton)
  const [isEnhancing, setIsEnhancing] = useState(false);
  // Track if we've already shown a Runway base_resp toast to avoid duplicates
  const runwayBaseRespToastShownRef = useRef(false);
  const loadLockRef = useRef(false);

  useEffect(() => {
    if (!isPluginsMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (
        pluginsMenuRef.current &&
        !pluginsMenuRef.current.contains(event.target as Node)
      ) {
        setIsPluginsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isPluginsMenuOpen]);

  // Sync ref for handleGenerate to avoid stale closure issues in timeouts/effects
  const handleGenerateRef = useRef<any>(null);

  // Redux selector for parallel generation support
  const activeGenerations = useAppSelector(
    (state) => state.generation.activeGenerations,
  );
  // Ensure active generations have startedAt set promptly so watchdog & persistence work
  useEffect(() => {
    activeGenerations.forEach((g: any) => {
      if (
        (g.status === "pending" || g.status === "generating") &&
        !g.startedAt
      ) {
        dispatch(
          updateActiveGeneration({
            id: g.id,
            updates: { startedAt: Date.now() },
          }),
        );
      }
    });
  }, [activeGenerations, dispatch]);

  // Filter out video generations - only count image generations towards the limit (limit is 4)
  // This allows completed/failed items to be auto-replaced by new ones
  const normalizeGenType = (t?: string) =>
    t ? String(t).replace(/[_-]/g, "-").toLowerCase() : "";
  const imageOnlyActiveGenerations = activeGenerations.filter((gen) => {
    const genType =
      (gen as any).generationType || (gen as any).params?.generationType;
    const normalizedType = normalizeGenType(genType);
    const isVideoType =
      normalizedType === "text-to-video" ||
      normalizedType === "image-to-video" ||
      normalizedType === "video-to-video";
    return !isVideoType;
  });
  const runningGenerationsCount = imageOnlyActiveGenerations.filter(
    (g) => g.status === "pending" || g.status === "generating",
  ).length;

  // Track entries that have been added to history to prevent duplicate rendering
  // This ref is updated immediately when entries are added, before React re-renders
  const historyEntryIdsRef = useRef<Set<string>>(new Set());

  // Get current entries from Redux (will be updated on each render)
  const existingEntries = useAppSelector(
    (state: any) => state.history?.entries || [],
  );

  // Note: localGeneratingEntries was originally single-entry; with parallel generation enabled
  // the queue rendering relies on Redux `activeGenerations` instead for per-job placeholders.

  // Prefill uploaded image and prompt from query params (?image=, ?prompt=, ?sp=, ?model=, ?frame=, ?style=)
  // or from the homepage studio draft handoff.
  useEffect(() => {
    try {
      const current = new URL(window.location.href);
      // Support multiple uploads: allow repeated ?sp= and ?image= params
      const spAll = current.searchParams.getAll("sp");
      const imgAll = current.searchParams.getAll("image");
      const img = current.searchParams.get("image"); // legacy single param
      const sp = current.searchParams.get("sp"); // legacy single param
      const prm = current.searchParams.get("prompt");
      const mdl = current.searchParams.get("model");
      const frm = current.searchParams.get("frame");
      const sty = current.searchParams.get("style");
      const remixNonce = current.searchParams.get("remixNonce");
      const studioDraft = getStudioDraft();
      const draftImages = Array.isArray(studioDraft?.uploadedImages)
        ? studioDraft.uploadedImages
        : [];

      // Handle image upload - prioritize sp (storage path) over image URL.
      // Collect all URLs from sp/image params so multiple uploads are supported.
      const collectedUrls: string[] = [];

      const allSp = spAll.length ? spAll : sp ? [sp] : [];
      const allImg = imgAll.length ? imgAll : img ? [img] : [];

      allSp.forEach((spVal) => {
        if (!spVal) return;
        const decodedPath = decodeURIComponent(spVal).replace(/^\/+/, "");
        const directUrl = toDirectUrl(decodedPath);
        if (directUrl) {
          collectedUrls.push(directUrl);
        }
      });

      if (!allSp.length) {
        allImg.forEach((imgVal) => {
          if (!imgVal) return;
          const imageUrl = imgVal.trim();
          if (
            imageUrl &&
            !imageUrl.startsWith("blob:") &&
            !imageUrl.startsWith("data:")
          ) {
            collectedUrls.push(imageUrl);
          }
        });
      }

      if (!collectedUrls.length && draftImages.length > 0) {
        draftImages.forEach((imageUrl) => {
          if (
            !imageUrl ||
            imageUrl.startsWith("blob:") ||
            imageUrl.startsWith("data:")
          )
            return;
          collectedUrls.push(imageUrl);
        });
      }

      if (collectedUrls.length > 0) {
        const inputImageLimit = getInputImageLimitForModel(selectedModel);
        dispatch(
          setUploadedImages(collectedUrls.slice(0, inputImageLimit) as any),
        );
      }

      const promptToApply = prm || studioDraft?.prompt;
      if (promptToApply) {
        dispatch(setPrompt(promptToApply));
        // Force the visible contentEditable prompt editor to reflect the new prompt immediately.
        // This avoids cases where the editor is mid-update (isUpdatingRef=true) and would otherwise
        // ignore the prompt change, causing Remix to keep showing the old prompt.
        try {
          const el = document.querySelector(
            '[data-prompt-editor="true"]',
          ) as HTMLElement | null;
          if (el) {
            el.textContent = promptToApply;
            el.style.height = "auto";
            el.style.height =
              Math.min(el.scrollHeight, PROMPT_EDITOR_MAX_HEIGHT_PX) + "px";
          }
        } catch {}
      }

      const mapIncomingModel = (m: string): string => {
        if (!m) return m;
        // Normalize known backend → UI mappings
        if (m === "bytedance/seedream-4") return "seedream-v4";
        if (m === "bytedance/seedream-4.5") return "seedream-4.5";
        if (m === "recraft-v4") return "recraft-ai/recraft-v4";
        if (m === "z-image-turbo") return "new-turbo-model";
        // Bug 62: Fallback background-remover models to nano-banana-2 for generation tasks
        if (m === "851-labs/background-remover" || m === "lucataco/remove-bg")
          return "google/nano-banana-2";
        return m;
      };

      const modelToApply = mdl || studioDraft?.model;
      if (modelToApply) {
        dispatch(setSelectedModel(normalizeIncomingImageModel(modelToApply)));
      }

      const frameToApply = frm || studioDraft?.frameSize;
      if (frameToApply) {
        try {
          (dispatch as any)({
            type: "generation/setFrameSize",
            payload: frameToApply,
          });
        } catch {}
      }

      const styleToApply = sty || studioDraft?.style;
      if (styleToApply) {
        try {
          (dispatch as any)({
            type: "generation/setStyle",
            payload: styleToApply,
          });
        } catch {}
      }

      if (studioDraft?.imageCount) {
        try {
          (dispatch as any)({
            type: "generation/setImageCount",
            payload: studioDraft.imageCount,
          });
        } catch {}
      }

      if (studioDraft) {
        clearStudioDraft();
      }

      // Consume params once so a refresh doesn't keep re-applying Remix values.
      // IMPORTANT: Use Next router.replace (not window.history.replaceState) to avoid
      // desyncing Next.js searchParams, which can prevent subsequent Remix clicks from being detected.
      if (
        img ||
        prm ||
        sp ||
        mdl ||
        frm ||
        sty ||
        remixNonce ||
        spAll.length ||
        imgAll.length
      ) {
        current.searchParams.delete("image");
        current.searchParams.delete("prompt");
        current.searchParams.delete("sp");
        current.searchParams.delete("remixNonce");
        // Also delete any repeated params
        imgAll.forEach(() => current.searchParams.delete("image"));
        spAll.forEach(() => current.searchParams.delete("sp"));
        current.searchParams.delete("model");
        current.searchParams.delete("frame");
        current.searchParams.delete("style");
        const next =
          current.pathname +
          (current.searchParams.toString()
            ? `?${current.searchParams.toString()}`
            : "");
        router.replace(next, { scroll: false });
      }
    } catch {}
  }, [dispatch, searchParams, pathname, router]);

  // Track the first history request lifecycle so empty accounts can show the guide
  // after a real load completes, without flashing the guide before the request starts.
  const hasAttemptedInitialLoadRef = useRef(false);
  const hasStartedInitialLoadRef = useRef(false);

  const {
    showSwitchLoader,
    searchQuery,
    setSearchQuery,
    sortOrder,
    setSortOrder,
    dateRange,
    setDateRange,
    dateInput,
    setDateInput,
    dateInputRef,
    showCalendar,
    setShowCalendar,
    isMobileFilterMenuOpen,
    setIsMobileFilterMenuOpen,
    isInputBoxHovered,
    setIsInputBoxHovered,
    isMobileDateFiltering,
    calendarMonth,
    setCalendarMonth,
    calendarYear,
    setCalendarYear,
    calendarRef,
    mobileFilterMenuRef,
    isFiltering,
    calendarDaysInMonth,
    calendarFirstWeekday,
    mobileDateInputMax,
    isFutureMobileCalendarDate,
    runMobileDateFilterRefresh,
    isSorting,
    refreshHistoryFromBackend,
    onSortChange,
    page,
    setPage,
    currentFilters,
    loading,
    hasMore,
    historyEntries,
    refreshHistoryDebounced,
    refreshHistoryImmediate,
  } = useInputBoxHistory(userData);

  // Ensure UI slice reflects we are on the image generation page (avoids expectedType gating issues)
  useEffect(() => {
    try {
      (dispatch as any)(setCurrentGenerationType("text-to-image" as any));
    } catch {}
  }, [dispatch]);

  // Helper function to get clean prompt without style
  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, "").trim();
  };

  // Helper function to extract style from prompt
  const extractStyleFromPrompt = (promptText: string): string | undefined => {
    const match = promptText.match(/\[\s*Style:\s*([^\]]+)\]/i);
    return match?.[1]?.trim();
  };

  // Helper function to check if URL is blob or data URL
  const isBlobOrDataUrl = (u?: string) =>
    !!u && (u.startsWith("blob:") || u.startsWith("data:"));
  const hasMeaningfulPromptText = (text?: string) =>
    /[\p{L}\p{N}]/u.test(String(text || ""));
  const blockedUploadExtensionRegex =
    /\.(exe|msi|bat|cmd|com|dll|scr|jar|apk|app|dmg|iso|bin|ps1|sh|zip|rar|7z|tar|gz)(\?|#|$)/i;

  // Accepts typical image sources (http/https image links, blob URLs, and data:image/* URLs).
  // Explicitly rejects data URLs that are not images and known executable/archive extensions.
  const isSupportedUploadedImageSource = (value?: string): boolean => {
    const url = String(value || "").trim();
    if (!url) return false;
    if (url.startsWith("data:")) return url.startsWith("data:image/");
    if (url.startsWith("blob:")) return true;
    return !blockedUploadExtensionRegex.test(url);
  };

  // Helper function for frontend proxy resource URL
  // NOTE: For regenerate/remix flows we prefer direct Zata URLs instead of localhost paths,
  // so callers should usually pass storagePath via `sp` and only use this for in-app proxying.
  const toFrontendProxyResourceUrl = (
    urlOrPath: string | undefined,
  ): string => {
    if (!urlOrPath) return "";
    return toResourceProxy(urlOrPath);
  };

  // Handle recreate (hover regenerate button) - navigate to text-to-image with entry parameters.
  // Uses the same logic as the Regenerate button in ImagePreviewModal:
  // - Prefer ALL "Your Upload" images (inputImages) as inputs
  // - If there are no uploads, only send prompt/model/frame/style (no image)
  const handleRecreate = (e: React.MouseEvent, entry: HistoryEntry) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      if (!userData) {
        router.push(getSignInUrl());
        return;
      }

      const qs = new URLSearchParams();

      const entryAny: any = entry as any;
      const inputImages: any[] = Array.isArray(entryAny?.inputImages)
        ? entryAny.inputImages
        : [];

      // Collect ALL user uploads (Your Upload images)
      const storagePaths: string[] = [];
      const directUrls: string[] = [];

      inputImages.forEach((img: any) => {
        try {
          let sp = img?.storagePath || "";
          if (!sp) {
            const ZATA_PREFIX = (
              process.env.NEXT_PUBLIC_ZATA_PREFIX || ""
            ).replace(/\/$/, "/");
            const original = img?.url || img?.originalUrl || "";
            if (original && original.startsWith(ZATA_PREFIX)) {
              sp = original.substring(ZATA_PREFIX.length);
            }
          }
          if (sp) {
            storagePaths.push(sp);
            return;
          }
          const rawUrl = img?.url || img?.originalUrl || "";
          if (rawUrl && !isBlobOrDataUrl(rawUrl)) {
            const direct = toDirectUrl(rawUrl);
            if (direct) directUrls.push(direct);
          }
        } catch {}
      });

      // Use userPrompt for remix if available, otherwise use cleanPrompt
      const cleanPrompt = getCleanPrompt(entry.prompt || "");
      const remixPrompt = (entry as any)?.userPrompt || cleanPrompt;
      if (remixPrompt) qs.set("prompt", remixPrompt);

      // Attach all uploads:
      // - Prefer storage paths via repeated sp= params
      // - Fallback direct URLs via repeated image= params
      storagePaths.forEach((spVal) => {
        if (spVal) qs.append("sp", spVal);
      });
      if (!storagePaths.length) {
        directUrls.forEach((u) => {
          if (u) qs.append("image", u);
        });
      }

      // Also pass model, frameSize and style for preselection
      if (entry.model) {
        // Map backend model ids to UI dropdown ids where needed
        const m = String(entry.model);
        const mapped =
          m === "bytedance/seedream-4"
            ? "seedream-v4"
            : m === "bytedance/seedream-4.5"
              ? "seedream-4.5"
              : m;
        qs.set("model", mapped);
      }
      if (entry.frameSize) qs.set("frame", String(entry.frameSize));

      const sty =
        entry.style || extractStyleFromPrompt(entry.prompt || "") || "";
      if (sty && sty.toLowerCase() !== "none") qs.set("style", String(sty));

      // Client-side navigation to avoid full page reload (and don't scroll to top)
      router.push(`/text-to-image?${qs.toString()}`, { scroll: false });
    } catch (error) {
      console.error("Error recreating image:", error);
    }
  };

  // Adjust natural language references like "image 4" -> "image 3" (zero-based)
  // Also, if combinedImages and selectedCharacters are provided, replace @Name mentions
  // with the corresponding image index (1-based) that will be sent in uploadedImages.
  const adjustPromptImageNumbers = (
    text: string,
    combinedImages?: string[],
    selectedCharacters?: any[],
  ): string => {
    try {
      let t = String(text || "");

      // If we have combinedImages and selectedCharacters, replace @Name with image N (1-based)
      if (
        combinedImages &&
        Array.isArray(combinedImages) &&
        selectedCharacters &&
        Array.isArray(selectedCharacters)
      ) {
        const mentionRegex = /@([\w-]+)/g;
        let out = "";
        let lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = mentionRegex.exec(t))) {
          const matchIndex = m.index as number;
          const name = m[1];
          out += t.slice(lastIndex, matchIndex);
          // find matching character by name
          const char = selectedCharacters.find(
            (c: any) =>
              String(c.name).toLowerCase() === String(name).toLowerCase(),
          );
          if (char && char.frontImageUrl) {
            const url = String(char.frontImageUrl);
            const idx = combinedImages.findIndex(
              (u: string) => String(u) === url,
            );
            if (idx >= 0) {
              out += `the character in the image ${idx + 1}`; // 1-based in prompt, will be converted to zero-based below
            } else {
              out += m[0];
            }
          } else {
            out += m[0];
          }
          lastIndex = matchIndex + m[0].length;
        }
        out += t.slice(lastIndex);
        t = out;
      }

      // Now convert any "image N" (1-based) to zero-based indexes expected by some providers
      return t.replace(/\b(image|img)\s*([1-9]\d*)\b/gi, (_m, word, num) => {
        const n = Math.max(0, parseInt(String(num), 10) - 1);
        return `${word} ${n}`;
      });
    } catch {
      return text;
    }
  };

  // Copy prompt to clipboard (used on hover overlay)
  const copyPrompt = async (e: React.MouseEvent, text: string) => {
    try {
      console.log("beti");
      e.stopPropagation();
      e.preventDefault();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      (await import("react-hot-toast")).default.success("Prompt copied");
    } catch {
      try {
        (await import("react-hot-toast")).default.error("Failed to copy");
      } catch {}
    }
  };

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteImage = async (
    e: React.MouseEvent,
    entry: HistoryEntry,
    imageId?: string,
  ) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      if (!userData) {
        router.push(getSignInUrl());
        return;
      }

      const isSingleImage = imageId && entry.images && entry.images.length > 0;
      const confirmMessage = isSingleImage
        ? "Delete this image permanently? This cannot be undone."
        : "Delete this generation permanently? This cannot be undone.";

      if (!window.confirm(confirmMessage)) return;

      const response = await axiosInstance.delete(
        `/api/generations/${entry.id}`,
        {
          params: imageId ? { imageId } : undefined,
        },
      );

      const updatedItem = response.data?.data?.item;

      if (updatedItem && !updatedItem.isDeleted) {
        // Partial deletion - update entry with new images
        dispatch(
          updateHistoryEntry({
            id: entry.id,
            updates: { images: updatedItem.images } as any,
          }),
        );
        toast.success("Image deleted");
      } else {
        // Full deletion
        try {
          dispatch(removeHistoryEntry(entry.id));
        } catch {}
        toast.success("Generation deleted");
      }

      // Clear/reset document title when image/generation is deleted
      if (typeof document !== "undefined") {
        document.title = "WildMind";
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete generation");
    }
  };

  // Normalize frontend proxy URLs to absolute public URLs for provider APIs
  const toAbsoluteFromProxy = (url: string): string => {
    try {
      if (!url) return url;
      if (url.startsWith("data:")) return url;
      const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";
      const RESOURCE_SEG = "/api/proxy/resource/";
      if (url.startsWith(RESOURCE_SEG)) {
        const decoded = decodeURIComponent(url.substring(RESOURCE_SEG.length));
        return `${ZATA_PREFIX}${decoded}`;
      }
      if (url.startsWith("http://") || url.startsWith("https://")) {
        const u = new URL(url);
        if (u.pathname.startsWith(RESOURCE_SEG)) {
          const decoded = decodeURIComponent(
            u.pathname.substring(RESOURCE_SEG.length),
          );
          return `${ZATA_PREFIX}${decoded}`;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  const ensureProviderReadyImageUrl = useCallback(
    async (url: string): Promise<string> => {
      const normalized = toAbsoluteFromProxy(String(url || "").trim());
      if (!normalized) return normalized;
      if (
        normalized.startsWith("http://") ||
        normalized.startsWith("https://")
      ) {
        return normalized;
      }
      if (
        normalized.startsWith("data:") ||
        normalized.startsWith("blob:")
      ) {
        const resp = await saveUpload({ url: normalized, type: "image" });
        if (resp.responseStatus === "success" && resp.data?.url) {
          return resp.data.url;
        }
        throw new Error(resp.message || "Failed to prepare input image");
      }
      return normalized;
    },
    [],
  );

  const ensureProviderReadyImageUrls = useCallback(
    async (urls: string[], limit = 14): Promise<string[]> => {
      const prepared: string[] = [];
      for (const rawUrl of (urls || []).slice(0, limit)) {
        const resolvedUrl = await ensureProviderReadyImageUrl(rawUrl);
        if (resolvedUrl) {
          prepared.push(resolvedUrl);
        }
      }
      return prepared;
    },
    [ensureProviderReadyImageUrl],
  );

  // Fetch only first page on mount; further pages load on scroll
  // Replace legacy refresh helpers with hook-driven variants (wrapped with cooldown guard)
  // IMPORTANT: Use backend-filter-aware refresh to avoid overwriting date-filtered views.
  const rawRefreshHistory = () => {
    void refreshHistoryFromBackend();
  };
  const refreshAllHistory = () => {
    void refreshHistoryFromBackend();
  };
  const lastRefreshTimeRef = useRef(0);
  const REFRESH_COOLDOWN_MS = 2000; // suppress clustered refreshes that follow a generation completion

  // Function to fetch and add/update a single generation instead of reloading all
  const refreshSingleGeneration = async (historyId: string) => {
    try {
      const client = axiosInstance;
      // Attempt fetch by provided id. If it's a client-side id (gen-...) and the backend doesn't
      // recognize it yet, fall back to the linked backend historyId stored on the active generation.
      let resolvedId = historyId;
      let res: any;
      try {
        res = await client.get(`/api/generations/${resolvedId}`);
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 404) {
          const linked = activeGenerations.find(
            (g: any) => String(g?.id || "") === String(historyId),
          );
          const fallbackId =
            linked && (linked as any)?.historyId
              ? String((linked as any).historyId)
              : "";
          if (fallbackId && fallbackId !== resolvedId) {
            resolvedId = fallbackId;
            res = await client.get(`/api/generations/${resolvedId}`);
          } else {
            throw e;
          }
        } else {
          throw e;
        }
      }
      const item = res.data?.data?.item;
      if (!item) {
        console.warn(
          "[refreshSingleGeneration] Generation not found, falling back to full refresh",
        );
        refreshHistory();
        return;
      }

      // Normalize the item to match HistoryEntry format
      const created = item?.createdAt || item?.updatedAt || item?.timestamp;
      const iso =
        typeof created === "string"
          ? created
          : created && created.toString
            ? created.toString()
            : new Date().toISOString();
      const normalizedEntry: HistoryEntry = {
        ...item,
        id: item.id || resolvedId || historyId,
        timestamp: iso,
        createdAt: iso,
      } as HistoryEntry;

      // Find an existing entry by any known identifier to avoid duplicates.
      const idsToMatch = Array.from(
        new Set(
          [
            historyId,
            resolvedId,
            normalizedEntry.id,
            (normalizedEntry as any)?.firebaseHistoryId,
          ]
            .filter(Boolean)
            .map((x) => String(x)),
        ),
      );
      const existing = existingEntries.find((e: any) => {
        const eId = String(e?.id || "");
        const eFirebaseId = String((e as any)?.firebaseHistoryId || "");
        return (
          idsToMatch.includes(eId) ||
          (eFirebaseId && idsToMatch.includes(eFirebaseId))
        );
      }) as any;

      // CRITICAL: Track this entry ID in ref IMMEDIATELY before adding to Redux
      // This ensures we can check it in the same render cycle
      qlog("[DEBUG refreshSingleGeneration] Tracking entry IDs:", {
        historyId,
        normalizedEntryId: normalizedEntry.id,
        firebaseHistoryId: (normalizedEntry as any)?.firebaseHistoryId,
        currentRefSize: historyEntryIdsRef.current.size,
        currentRefContents: Array.from(historyEntryIdsRef.current),
      });

      historyEntryIdsRef.current.add(historyId);
      if (resolvedId) historyEntryIdsRef.current.add(resolvedId);
      if (normalizedEntry.id)
        historyEntryIdsRef.current.add(normalizedEntry.id);
      if ((normalizedEntry as any)?.firebaseHistoryId) {
        historyEntryIdsRef.current.add(
          (normalizedEntry as any).firebaseHistoryId,
        );
      }

      qlog("[DEBUG refreshSingleGeneration] After adding to ref:", {
        newRefSize: historyEntryIdsRef.current.size,
        newRefContents: Array.from(historyEntryIdsRef.current),
      });

      if (existing) {
        // Update existing entry - only update changed fields to avoid overwriting
        qlog(
          "[DEBUG refreshSingleGeneration] Updating existing entry:",
          existing.id,
        );
        const extraUpdates: any = {};
        if (Array.isArray((normalizedEntry as any)?.inputImages))
          extraUpdates.inputImages = (normalizedEntry as any).inputImages;
        dispatch(
          updateHistoryEntry({
            id: existing.id,
            updates: {
              status: normalizedEntry.status,
              images: normalizedEntry.images,
              imageCount: normalizedEntry.imageCount,
              timestamp: normalizedEntry.timestamp,
              ...extraUpdates,
            },
          }),
        );
        qlog(
          "[refreshSingleGeneration] Updated existing generation:",
          existing.id,
        );
      } else {
        // Add new entry at the beginning
        qlog("[DEBUG refreshSingleGeneration] Adding new entry to Redux:", {
          historyId: resolvedId || historyId,
          entryId: normalizedEntry.id,
          firebaseHistoryId: (normalizedEntry as any)?.firebaseHistoryId,
          status: normalizedEntry.status,
          imageCount: normalizedEntry.images?.length || 0,
          params: (normalizedEntry as any)?.params || {},
        });
        dispatch(addHistoryEntry(normalizedEntry));
        qlog(
          "[refreshSingleGeneration] Added new generation:",
          resolvedId || historyId,
        );

        // Attempt to correlate newly added history with any active generation that has a matching provider requestId
        try {
          const candidateReqIds = new Set<string>();
          const pushIf = (v: any) => {
            if (v) candidateReqIds.add(String(v));
          };
          const ne = normalizedEntry as any;
          pushIf(ne?.params?.requestId);
          pushIf(ne?.requestId);
          pushIf(ne?.request_id);
          pushIf(ne?.idempotencyKey);
          pushIf(ne?.providerRequestId);
          pushIf((ne?.provider || {})?.requestId);

          if (candidateReqIds.size > 0) {
            activeGenerations.forEach((g: any) => {
              const gReq = String((g?.params || {})?.requestId || "");
              if (!gReq) return;
              if (candidateReqIds.has(gReq)) {
                console.log(
                  "[queue] Correlating active generation by requestId",
                  {
                    generationId: g.id,
                    historyId: normalizedEntry.id,
                    requestId: gReq,
                  },
                );
                // Attach canonical historyId to the active generation so future syncs match by id
                dispatch(
                  updateActiveGeneration({
                    id: g.id,
                    updates: { historyId: normalizedEntry.id },
                  }),
                );
                // Also remove local preview entries associated with this generation
                removeLocalGeneratingEntry([g.id, normalizedEntry.id]);
              }
            });
          }

          // If we didn't find a requestId-based match, try a safe prompt+timestamp correlation
          try {
            const nePrompt = String((normalizedEntry as any)?.prompt || "")
              .replace(/\s*\[Style:.*?\]\s*$/i, "")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();
            const neModel = String((normalizedEntry as any)?.model || "");
            const createdRaw =
              (normalizedEntry as any)?.createdAt ||
              (normalizedEntry as any)?.timestamp ||
              (normalizedEntry as any)?.updatedAt;
            const neTime =
              typeof createdRaw === "number"
                ? createdRaw
                : Date.parse(String(createdRaw || "")) || Date.now();
            /** History row must be from *this* job: created at/after generation start (not a prior run with the same prompt). */
            const START_SKEW_MS = 5000; // clock / ordering slack only
            const LATE_RESULT_CAP_MS = 45 * 60 * 1000; // allow slow models; still reject impossible timestamps

            activeGenerations.forEach((g: any) => {
              try {
                const gPrompt = String(g?.prompt || "")
                  .replace(/\s*\[Style:.*?\]\s*$/i, "")
                  .replace(/\s+/g, " ")
                  .trim()
                  .toLowerCase();
                const gModel = String(g?.model || "");
                const gTimeRaw = g?.startedAt || g?.createdAt || 0;
                const gTime =
                  typeof gTimeRaw === "number"
                    ? gTimeRaw
                    : Date.parse(String(gTimeRaw || "")) || 0;
                const resultAfterStart =
                  gTime > 0 && neTime >= gTime - START_SKEW_MS;
                const resultNotAbsurdlyLate =
                  neTime <= gTime + LATE_RESULT_CAP_MS;
                const promptMatch =
                  gPrompt &&
                  nePrompt &&
                  (gPrompt === nePrompt ||
                    gPrompt.startsWith(nePrompt) ||
                    nePrompt.startsWith(gPrompt));
                const modelMatch = gModel && neModel && gModel === neModel;

                if (
                  resultAfterStart &&
                  resultNotAbsurdlyLate &&
                  promptMatch &&
                  (!gModel || !neModel || modelMatch)
                ) {
                  console.log(
                    "[queue] Correlating active generation by prompt+time",
                    {
                      generationId: g.id,
                      historyId: normalizedEntry.id,
                      promptMatch: gPrompt.slice(0, 50),
                      deltaMs: neTime - gTime,
                    },
                  );
                  dispatch(
                    updateActiveGeneration({
                      id: g.id,
                      updates: { historyId: normalizedEntry.id },
                    }),
                  );
                  removeLocalGeneratingEntry([g.id, normalizedEntry.id]);
                }
              } catch (e) {
                // continue
              }
            });
          } catch (e) {
            // ignore
          }
        } catch (e) {
          qerr(
            "Failed to correlate new history entry with active generations by requestId:",
            e,
          );
        }
      }

      // Clear any local preview entries that match this generation.
      removeLocalGeneratingEntry(idsToMatch);
    } catch (error) {
      qerr(
        "[refreshSingleGeneration] Failed to fetch single generation, falling back to full refresh:",
        error,
      );
      // Fallback to full refresh if single fetch fails
      refreshHistory();
    }
  };

  // Poll for a new history entry matching this generation's prompt/requestId and attach it to the active generation
  const pollForMatchingHistory = async (opts: {
    generationId?: string;
    tempEntryId?: string;
    model?: string;
    prompt?: string;
    requestId?: string;
    startedAt?: number;
    timeoutMs?: number;
  }) => {
    const { generationId } = opts;
    // Ensure generation has a startedAt so adaptive watchdog and persistence work
    const ensureStartedAt = (id?: string) => {
      if (!id) return;
      const g = activeGenerations.find((x: any) => x.id === id);
      if (g && !g.startedAt) {
        dispatch(
          updateActiveGeneration({ id, updates: { startedAt: Date.now() } }),
        );
      }
    };
    ensureStartedAt(generationId);

    const {
      generationId: _gid,
      tempEntryId,
      model,
      prompt,
      requestId,
      startedAt = Date.now(),
      timeoutMs = 120000,
    } = opts;
    const api = axiosInstance;
    const normalize = (s = "") =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    const target = normalize((prompt || "").slice(0, 100));
    const deadline = Date.now() + timeoutMs;
    let attempt = 0;

    qlog("Starting pollForMatchingHistory", {
      generationId: _gid,
      tempEntryId,
      model,
      requestId,
      startedAt,
      timeoutMs,
    });

    while (Date.now() < deadline) {
      attempt++;
      try {
        const res = await api.get("/api/generations", {
          params: { limit: 30, sortBy: "createdAt", mode: "image" },
          timeout: 10000,
        });
        const items: any[] = res.data?.data?.items || res.data?.items || [];
        qlog("pollForMatchingHistory: fetched items", {
          attempt,
          itemsFound: items.length,
        });

        // Try to find exact historyId match first (if requestId looks like a history id)
        for (const it of items) {
          if (!it) continue;
          // If requestId shows up anywhere in the raw item, treat as match
          const raw = JSON.stringify(it || "");
          if (requestId && String(raw || "").includes(String(requestId))) {
            qlog("pollForMatchingHistory: matched via requestId in item", {
              matchedId: it.id,
              requestId,
            });
            await refreshSingleGeneration(it.id);
            if (generationId)
              dispatch(
                updateActiveGeneration({
                  id: generationId,
                  updates: { historyId: it.id },
                }),
              );
            return it.id;
          }
        }

        // Otherwise, attempt fuzzy prompt + timestamp match (must be THIS run — not an older row with the same prompt)
        const startMs =
          typeof startedAt === "number" && Number.isFinite(startedAt)
            ? startedAt
            : Date.now();
        const POLL_START_SKEW_MS = 15000;
        const POLL_LATE_CAP_MS = 30 * 60 * 1000; // ignore entries impossibly far in the future
        for (const it of items) {
          try {
            if (!it || !it.prompt) continue;
            const p = normalize((it.prompt || "").slice(0, 100));
            const t =
              Date.parse(
                String(it.createdAt || it.timestamp || it.updatedAt || 0),
              ) || 0;
            if (!t) continue;
            // History row must be created at/after when this job started (minus small skew)
            const isNewEnough = t >= startMs - POLL_START_SKEW_MS;
            const notFromFuture = t <= startMs + POLL_LATE_CAP_MS;
            const modelOk =
              !model ||
              !it.model ||
              String(it.model).toLowerCase() === String(model).toLowerCase();
            if (
              target &&
              p.includes(target) &&
              isNewEnough &&
              notFromFuture &&
              modelOk
            ) {
              qlog("pollForMatchingHistory: fuzzy matched item", {
                matchedId: it.id,
                promptMatch: p.slice(0, 100),
                itemTime: t,
                startMs,
              });
              await refreshSingleGeneration(it.id);
              if (generationId)
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: { historyId: it.id },
                  }),
                );
              return it.id;
            }
          } catch (e) {
            /* continue */
          }
        }
      } catch (err: any) {
        qwarn("pollForMatchingHistory: fetch failed", {
          attempt,
          err: err?.message || err,
        });
      }

      // Backoff: 1s -> 2s -> 3s -> 4s up to 5s
      const delay = Math.min(5000, 500 + attempt * 500);
      await new Promise((res) => setTimeout(res, delay));
    }

    qwarn("pollForMatchingHistory: timeout, no matching history found", {
      generationId,
      tempEntryId,
      model,
      requestId,
    });
    return undefined;
  };

  const refreshHistory = () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < REFRESH_COOLDOWN_MS) return; // skip redundant refresh within cooldown
    lastRefreshTimeRef.current = now;
    rawRefreshHistory();
  };

  // Redux state

  const prompt = useAppSelector((state: any) => state.generation?.prompt || "");
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "flux-dev",
  );
  const imageCount = useAppSelector(
    (state: any) => state.generation?.imageCount || 1,
  );
  const frameSize = useAppSelector(
    (state: any) => state.generation?.frameSize || "1:1",
  );
  const style = useAppSelector(
    (state: any) => state.generation?.style || "realistic",
  );
  const customStyleFromImage = useAppSelector(
    (state: any) => state.generation?.customStyleFromImage || null,
  );
  const indianStyleVersion = useAppSelector(
    (state: any) => state.generation?.indianStyleVersion || "V1",
  );
  // Lucid Origin and Phoenix 1.0 options
  const lucidStyle = useAppSelector(
    (state: any) => state.generation?.lucidStyle || "none",
  );
  const lucidContrast = useAppSelector(
    (state: any) => state.generation?.lucidContrast || "medium",
  );
  const lucidMode = useAppSelector(
    (state: any) => state.generation?.lucidMode || "standard",
  );
  const lucidPromptEnhance = useAppSelector(
    (state: any) => state.generation?.lucidPromptEnhance || false,
  );
  const phoenixStyle = useAppSelector(
    (state: any) => state.generation?.phoenixStyle || "none",
  );
  const phoenixContrast = useAppSelector(
    (state: any) => state.generation?.phoenixContrast || "medium",
  );
  const phoenixMode = useAppSelector(
    (state: any) => state.generation?.phoenixMode || "fast",
  );
  const phoenixPromptEnhance = useAppSelector(
    (state: any) => state.generation?.phoenixPromptEnhance || false,
  );
  const nanoBananaResolution = useAppSelector(
    (state: any) => state.generation?.nanoBananaResolution || "1K",
  );
  const nanoBananaGoogleSearch = useAppSelector(
    (state: any) => state.generation?.nanoBananaGoogleSearch || false,
  );
  const nanoBananaImageSearch = useAppSelector(
    (state: any) => state.generation?.nanoBananaImageSearch || false,
  );
  const nanoBananaThinkingLevel = useAppSelector(
    (state: any) => state.generation?.nanoBananaThinkingLevel || "minimal",
  );
  const nanoBananaLimitGenerations = useAppSelector(
    (state: any) => state.generation?.nanoBananaLimitGenerations ?? true,
  );
  const outputFormat = useAppSelector(
    (state: any) => state.generation?.outputFormat || "jpeg",
  );
  const nanoSupportedOutputFormats = useMemo<Array<"jpg" | "png" | "webp">>(
    () => ["png", "jpg", "webp"],
    [],
  );

  // Keep output format aligned with model schema and normalize legacy "jpeg" to "jpg".
  useEffect(() => {
    const isNanoModel =
      selectedModel === "google/nano-banana-2" ||
      selectedModel === "google/nano-banana-pro" ||
      selectedModel === "nano-banana-pro" ||
      selectedModel === "gemini-25-flash-image";
    if (!isNanoModel) return;

    if (outputFormat === "jpeg") {
      dispatch(setOutputFormat("png"));
      return;
    }

    const normalized = outputFormat === "jpeg" ? "jpg" : outputFormat;
    if (!nanoSupportedOutputFormats.includes(normalized as any)) {
      dispatch(setOutputFormat(nanoSupportedOutputFormats[0]));
      return;
    }
    if (normalized !== outputFormat) {
      dispatch(setOutputFormat(normalized));
    }
  }, [dispatch, selectedModel, outputFormat, nanoSupportedOutputFormats]);

  // Nano Banana 2 (FAL): aspect_ratio must match schema (auto + listed ratios; no match_input_image).
  useEffect(() => {
    if (selectedModel !== "google/nano-banana-2") return;
    const allowed = new Set([
      "auto",
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
      "4:1",
      "1:4",
      "8:1",
      "1:8",
    ]);
    if (!allowed.has(frameSize) || frameSize === "match_input_image") {
      dispatch(setFrameSize("auto"));
    }
  }, [selectedModel, frameSize, dispatch]);

  // Gemini 25 Flash image: no "auto"; Nano Banana Pro: allow "auto" per FAL schema.
  useEffect(() => {
    const flashAllowed = new Set([
      "21:9",
      "16:9",
      "3:2",
      "4:3",
      "5:4",
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
    ]);
    const proAllowed = new Set([...flashAllowed, "auto"]);
    if (selectedModel === "gemini-25-flash-image") {
      if (!flashAllowed.has(frameSize) || frameSize === "auto") {
        dispatch(setFrameSize("1:1"));
      }
      return;
    }
    if (
      selectedModel === "google/nano-banana-pro" ||
      selectedModel === "nano-banana-pro"
    ) {
      if (!proAllowed.has(frameSize)) {
        dispatch(setFrameSize("auto"));
      }
    }
  }, [selectedModel, frameSize, dispatch]);

  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector(
    (state: any) => state.ui?.activeDropdown,
  );
  // Track previously loaded entries to animate new ones
  // This ref persists across renders and is updated AFTER render, so we can check against previous render's entries
  const previousEntriesRef = useRef<Set<string>>(new Set<string>());

  // Seedream-specific UI state
  const [seedreamSize, setSeedreamSize] = useState<
    "1K" | "2K" | "4K" | "custom"
  >("2K");
  const [seedreamWidth, setSeedreamWidth] = useState<number>(2048);
  const [seedreamHeight, setSeedreamHeight] = useState<number>(2048);
  // Seedream 4.5-specific UI state (FAL image_size auto_2K/auto_4K)
  const [seedream45Resolution, setSeedream45Resolution] = useState<"2K" | "4K">(
    "2K",
  );
  const [seedream5LiteResolution, setSeedream5LiteResolution] = useState<
    "2K" | "3K"
  >("2K");
  const [gptImage2CustomWidth, setGptImage2CustomWidth] = useState<number>(1024);
  const [gptImage2CustomHeight, setGptImage2CustomHeight] =
    useState<number>(1024);
  const [nanoBananaProResolution, setNanoBananaProResolution] = useState<
    "1K" | "2K" | "4K"
  >("2K");
  const [flux2ProResolution, setFlux2ProResolution] = useState<"1K" | "2K">(
    "1K",
  );
  const [qwenResolution, setQwenResolution] = useState<"1K" | "2K">("1K");
  const [zTurboOutputFormat, setZTurboOutputFormat] = useState<
    "png" | "jpg" | "webp"
  >("jpg");
  const [gptImage15Quality, setGptImage15Quality] = useState<
    "low" | "medium" | "high" | "auto"
  >("low");
  const [gptImage15OutputFormat, setGptImage15OutputFormat] = useState<
    "png" | "jpg" | "webp"
  >("jpg");
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null); // retained for optional debug overlay
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false); // legacy reference (no longer used by IO, kept for compatibility)
  // Block pagination while generation finishes & initial history refresh occurs
  const postGenerationBlockRef = useRef(false);
  // Debug event storage removed; bottom scroll pagination doesn't emit IO events

  // Lock scrollRootRef overflow when in edit image page to prevent false scrolling (Bug 51)
  useEffect(() => {
    const originalBodyStyle = window.getComputedStyle(document.body).overflow;
    const originalHtmlStyle = window.getComputedStyle(
      document.documentElement,
    ).overflow;

    if (isInlineEditImagePage) {
      if (scrollRootRef.current)
        scrollRootRef.current.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      if (scrollRootRef.current) scrollRootRef.current.style.overflow = "auto";
      // Body/HTML reset is handled by EditImageInterface's unmount or should we do it here too?
      // For safety, let's reset if it's NOT the edit page.
      document.body.style.overflow = originalBodyStyle || "auto";
      document.documentElement.style.overflow = originalHtmlStyle || "auto";
    }

    return () => {
      if (scrollRootRef.current) scrollRootRef.current.style.overflow = "auto";
      document.body.style.overflow = originalBodyStyle || "auto";
      document.documentElement.style.overflow = originalHtmlStyle || "auto";
    };
  }, [isInlineEditImagePage]);

  // Keep the queue panel (activeGenerations) in sync with the real history list.
  // If a generation completes/fails and is visible in the grid, update the queue item immediately
  // (and fill in images) so loader cards don't get stuck and slots free up.
  // OPTIMIZED: Debounced to prevent excessive runs on every Redux update
  useEffect(() => {
    if (!activeGenerations || activeGenerations.length === 0) {
      console.log("[queue] Sync: No active generations to sync");
      return;
    }
    if (!historyEntries || historyEntries.length === 0) {
      console.log("[queue] Sync: No history entries loaded yet, waiting...");
      return;
    }

    // OPTIMIZED: Early exit if no in-progress generations need syncing
    const hasInProgress = activeGenerations.some((gen: any) => {
      const status = String(gen?.status || "").toLowerCase();
      return status === "pending" || status === "generating";
    });
    if (!hasInProgress) {
      // Only sync if we have completed/failed items that need cleanup
      const hasCompleted = activeGenerations.some((gen: any) => {
        const status = String(gen?.status || "").toLowerCase();
        return status === "completed" || status === "failed";
      });
      if (!hasCompleted) {
        return; // Nothing to sync
      }
    }

    // OPTIMIZED: Debounce sync to avoid running on every Redux update
    const timeoutId = setTimeout(() => {
      console.log(
        "[queue] Sync: Running with",
        activeGenerations.length,
        "active generations and",
        historyEntries.length,
        "history entries",
      );

      // Build a quick lookup of history items by id (including firebaseHistoryId for matching)
      const historyMap = new Map<string, any>();
      historyEntries.forEach((e: any) => {
        const id = String(e?.id || "");
        const fbId = String((e as any)?.firebaseHistoryId || "");
        if (id) historyMap.set(id, e);
        if (fbId) historyMap.set(fbId, e);
      });

      activeGenerations.forEach((gen: any) => {
        const genId = String(gen?.id || "");
        const backendId = String(gen?.historyId || "");
        const candidateIds = [backendId, genId].filter(Boolean);
        let match = candidateIds.map((id) => historyMap.get(id)).find(Boolean);

        // Fallback: If no ID match, try matching by prompt + timestamp (for refresh scenarios where historyId isn't saved)
        // CRITICAL: Only use fallback matching for generations that already have a historyId OR were created very recently
        // This prevents new generations from being incorrectly matched to old completed entries
        // Only match if:
        // 1. Generation already has a historyId (being refreshed/synced)
        // 2. OR generation was created within 10 seconds (likely a refresh scenario)
        // This ensures brand new generations with the same prompt/config can still generate
        if (!match && gen.prompt) {
          const genStartMsRaw =
            typeof gen.startedAt === "number"
              ? gen.startedAt
              : gen.createdAt;
          const genTime =
            typeof genStartMsRaw === "number"
              ? genStartMsRaw
              : new Date(genStartMsRaw).getTime();
          const now = Date.now();
          const ageInSeconds = (now - genTime) / 1000;

          // Only use fallback if generation already has historyId OR is very recent (within 10 seconds)
          // This prevents matching brand new generations to old completed ones
          const shouldUseFallback = backendId || ageInSeconds < 10;

          if (shouldUseFallback && !isNaN(genTime)) {
            console.log(
              "[queue] No ID match found, trying prompt+timestamp fallback for:",
              {
                genId,
                prompt: gen.prompt.slice(0, 30),
                genCreatedAt: gen.createdAt,
                hasHistoryId: !!backendId,
                ageInSeconds: ageInSeconds.toFixed(1),
              },
            );

            /** History row must belong to *this* queue item: created at/after job start (not a prior run with the same prompt). */
            const SYNC_SKEW_MS = 5000;
            const SYNC_LATE_CAP_MS = 20 * 60 * 1000;

            // OPTIMIZED: Pre-normalize prompt once instead of in loop
            const normalizePrompt = (p: string) => {
              return String(p || "")
                .replace(/\s*\[Style:.*?\]\s*$/i, "") // Remove [Style: ...] suffix
                .replace(/\s+/g, " ") // Normalize whitespace
                .trim()
                .toLowerCase();
            };
            const genPromptNormalized = normalizePrompt(gen.prompt);
            const genModel = String(gen.model || "");

            // OPTIMIZED: Filter to entries created after this job started (same prompt allowed)
            const recentEntries = historyEntries.filter((e: any) => {
              const eTimeRaw = e.timestamp || e.createdAt || e.created_at;
              const eTime =
                typeof eTimeRaw === "number"
                  ? eTimeRaw
                  : new Date(eTimeRaw).getTime();
              if (isNaN(eTime) || isNaN(genTime)) return false;
              return (
                eTime >= genTime - SYNC_SKEW_MS &&
                eTime <= genTime + SYNC_LATE_CAP_MS
              );
            });

            // OPTIMIZED: Only search through recent entries (much smaller set)
            match = recentEntries.find((e: any) => {
              const eTimeRaw = e.timestamp || e.createdAt || e.created_at;
              const eTime =
                typeof eTimeRaw === "number"
                  ? eTimeRaw
                  : new Date(eTimeRaw).getTime();
              const timeDiff = Math.abs(genTime - eTime);

              const ePromptNormalized = normalizePrompt(e.prompt);

              // Check if prompts match (exact or one contains the other for truncation cases)
              const promptMatch =
                genPromptNormalized === ePromptNormalized ||
                genPromptNormalized.startsWith(ePromptNormalized) ||
                ePromptNormalized.startsWith(genPromptNormalized);

              const modelMatch = String(e.model || "") === genModel;

              if (
                !isNaN(eTime) &&
                eTime >= genTime - SYNC_SKEW_MS &&
                eTime <= genTime + SYNC_LATE_CAP_MS
              ) {
                console.log("[queue] Comparing with history entry:", {
                  historyId: e.id,
                  timeDiff,
                  promptMatch,
                  modelMatch,
                  genPrompt: genPromptNormalized.slice(0, 50),
                  historyPrompt: ePromptNormalized.slice(0, 50),
                });
              }

              return (
                promptMatch &&
                modelMatch &&
                eTime >= genTime - SYNC_SKEW_MS &&
                eTime <= genTime + SYNC_LATE_CAP_MS
              );
            });

            if (match) {
              console.log("[queue] ✅ Matched by prompt+timestamp fallback:", {
                genId,
                historyId: match.id,
                prompt: gen.prompt.slice(0, 30),
              });
              // Update the active generation with the found historyId for future syncs
              dispatch(
                updateActiveGeneration({
                  id: genId,
                  updates: { historyId: match.id },
                }),
              );
            } else {
              console.log("[queue] ❌ No match found via fallback for:", genId);
            }
          } else {
            console.log(
              "[queue] Skipping fallback matching for new generation:",
              {
                genId,
                hasHistoryId: !!backendId,
                ageInSeconds: ageInSeconds.toFixed(1),
                reason:
                  !backendId && ageInSeconds >= 10
                    ? "too old for fallback"
                    : "other",
              },
            );
          }
        }

        console.log("[queue] Sync check for generation:", {
          genId,
          backendId,
          hasMatch: !!match,
          matchStatus: match?.status,
        });

        if (!match) return;

        const status = String(match?.status || "").toLowerCase();
        if (status !== "completed" && status !== "failed") return;

        // If queue item is still "pending/generating" or is missing media, bring it up to date.
        const queueStatus = String(gen?.status || "").toLowerCase();
        const hasImages = Array.isArray(gen?.images) && gen.images.length > 0;
        const hasVideos = Array.isArray(gen?.videos) && gen.videos.length > 0;
        const hasAudios = Array.isArray(gen?.audios) && gen.audios.length > 0;
        const historyImages = Array.isArray(match?.images) ? match.images : [];
        const historyVideos = Array.isArray(match?.videos) ? match.videos : [];
        const historyAudios = Array.isArray(match?.audios) ? match.audios : [];

        // Update if status changed or if we have new media (images/videos/audio)
        const needsUpdate =
          queueStatus !== status ||
          (!hasImages && historyImages.length > 0) ||
          (!hasVideos && historyVideos.length > 0) ||
          (!hasAudios && historyAudios.length > 0);

        if (needsUpdate) {
          const mediaCount =
            historyImages.length + historyVideos.length + historyAudios.length;
          console.log("[queue] Updating active generation:", {
            genId,
            oldStatus: queueStatus,
            newStatus: status,
            mediaCount,
          });
          dispatch(
            updateActiveGeneration({
              id: genId,
              updates: {
                status: status as any,
                images: historyImages.length > 0 ? historyImages : gen.images,
                videos: historyVideos.length > 0 ? historyVideos : gen.videos,
                audios: historyAudios.length > 0 ? historyAudios : gen.audios,
                error: match?.error || gen?.error,
                historyId: backendId || match?.id || gen?.historyId,
              },
            }),
          );
        }

        // Clear any local preview for this generation once the history item is final.
        removeLocalGeneratingEntry(
          [genId, backendId, String(match?.id || "")].filter(Boolean) as any,
        );

        // IMPORTANT: Don't remove from queue here - let useQueueManagement hook handle it
        // The hook will:
        // - Show success toast and remove after 5 seconds for completed
        // - Show error (already shown by error handlers) and remove after 3 seconds for failed
        console.log(
          "[queue] Generation status synced, queue management hook will handle removal:",
          { genId, status },
        );
      });
    }, 300); // OPTIMIZED: Debounce sync by 300ms to batch updates and reduce excessive runs

    return () => clearTimeout(timeoutId);
  }, [activeGenerations, historyEntries, dispatch, removeLocalGeneratingEntry]);

  // Simple periodic check for in-progress generations (respects rate limits)
  // OPTIMIZED: Increased interval to 30s to reduce API load and improve performance
  useEffect(() => {
    if (!activeGenerations || activeGenerations.length === 0) return;

    const checkGenerations = async () => {
      const inProgressGens = activeGenerations.filter((gen: any) => {
        const status = String(gen?.status || "").toLowerCase();
        const backendId = String(gen?.historyId || "");
        return (status === "pending" || status === "generating") && backendId;
      });

      // If we have in-progress generations with historyIds, do a single batch history refresh
      // instead of individual API calls (avoids 429 rate limits)
      if (inProgressGens.length > 0) {
        console.log(
          "[queue] Refreshing history to check",
          inProgressGens.length,
          "in-progress generations",
        );
        try {
          await dispatch(
            loadHistory({
              paginationParams: { limit: 20 },
              forceRefresh: true,
              debugTag: "queue-check",
            }),
          ).unwrap();
        } catch (err) {
          console.log("[queue] History refresh failed:", err);
        }
      }
    };

    // OPTIMIZED: Increased from 10s to 30s to reduce API calls and improve performance
    // This still provides timely updates while significantly reducing server load
    const interval = setInterval(checkGenerations, 30000);
    // Only run immediately if we have in-progress generations
    const hasInProgress = activeGenerations.some((gen: any) => {
      const status = String(gen?.status || "").toLowerCase();
      return status === "pending" || status === "generating";
    });
    if (hasInProgress) {
      checkGenerations();
    }

    return () => clearInterval(interval);
  }, [activeGenerations, dispatch]);

  // Filter entries by search query, date range, and sort order
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = [...historyEntries];

    // Filter by search query (search in prompt)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((entry: HistoryEntry) => {
        const prompt = (entry.prompt || "").toLowerCase();
        return prompt.includes(query);
      });
    }

    if (dateRange.start && dateRange.end) {
      const startMs = dateRange.start.getTime();
      const endMs = dateRange.end.getTime();
      filtered = filtered.filter((entry: HistoryEntry) => {
        try {
          const raw =
            entry.timestamp || entry.createdAt || (entry as any).updatedAt;
          const ms = new Date(raw as any).getTime();
          return !Number.isNaN(ms) && ms >= startMs && ms <= endMs;
        } catch {
          return false;
        }
      });
    }

    return filtered;
  }, [historyEntries, searchQuery, dateRange]);

  // Mark that the initial load has started/completed even if the backend returns zero entries.
  useEffect(() => {
    if (loading) {
      hasStartedInitialLoadRef.current = true;
      hasAttemptedInitialLoadRef.current = true;
      return;
    }

    if (historyEntries.length > 0 || hasStartedInitialLoadRef.current) {
      hasAttemptedInitialLoadRef.current = true;
    }
  }, [loading, historyEntries.length]);

  // Sentinel element at bottom of list (place near end of render)

  // Group entries by date while PRESERVING backend order (no client-side sorting).
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    const dateOrder: string[] = [];

    for (const entry of filteredAndSortedEntries) {
      const date = new Date(entry.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
        dateOrder.push(date);
      }
      groups[date].push(entry);
    }

    // Sort entries within each date group by timestamp based on sortOrder
    const getTs = (entry: HistoryEntry) => new Date(entry.timestamp).getTime();
    Object.keys(groups).forEach((date) => {
      if (sortOrder === "asc") {
        groups[date].sort(
          (a: HistoryEntry, b: HistoryEntry) => getTs(a) - getTs(b),
        ); // Oldest first
      } else {
        groups[date].sort(
          (a: HistoryEntry, b: HistoryEntry) => getTs(b) - getTs(a),
        ); // Newest first
      }
    });

    // NEW: Merge active generations from Redux (persistent parallel generations)
    // NOTE: The grid UI renders `entry.images.map(...)`. For in-flight jobs, we must provide
    // placeholder images so each concurrent generation shows its own loading tiles.
    if (imageOnlyActiveGenerations.length > 0) {
      // Use the already-filtered image-only generations
      const imageActiveGenerations = imageOnlyActiveGenerations;

      imageActiveGenerations.forEach((gen) => {
        // Keep placeholder ids stable: always render under the client generation id ("gen-...").
        // Use gen.historyId only for de-dupe when the real history entry arrives.
        const displayId = String(gen.id);
        const backendId = String((gen as any)?.historyId || "");
        const idsToMatch = [displayId, backendId].filter(Boolean);

        // If backend history already contains the *final* entry (completed/failed), prefer history and skip placeholder.
        const historyAlreadyHasFinal = filteredAndSortedEntries.some(
          (e: any) => {
            const eId = String(e?.id || "");
            if (!idsToMatch.includes(eId)) return false;
            return e?.status === "completed" || e?.status === "failed";
          },
        );
        if (historyAlreadyHasFinal) return;

        const genDate = new Date(gen.createdAt);
        const genDateKey = genDate.toDateString();

        if (!groups[genDateKey]) {
          groups[genDateKey] = [];
        }

        const existsInGroup = groups[genDateKey].some((e: HistoryEntry) => {
          const eId = String((e as any)?.id || "");
          const eFirebaseId = String((e as any)?.firebaseHistoryId || "");
          return (
            idsToMatch.includes(eId) ||
            (eFirebaseId && idsToMatch.includes(eFirebaseId))
          );
        });

        if (!existsInGroup) {
          const count = Math.max(1, Number(gen.params?.imageCount || 1));
          const placeholderImages = Array.from({ length: count }, (_, idx) => ({
            id: `placeholder-${gen.id}-${idx}`,
            url: "",
            originalUrl: "",
            thumbnailUrl: "",
            avifUrl: "",
          }));

          const placeholder: HistoryEntry = {
            id: String(displayId),
            status: gen.status === "pending" ? "generating" : gen.status,
            prompt: gen.prompt,
            model: gen.model,
            generationType: "text-to-image" as any,
            timestamp: genDate.toISOString(),
            createdAt: genDate.toISOString(),
            // If we have real images, use them; otherwise, use placeholders so the loader tiles render.
            images:
              Array.isArray(gen.images) && gen.images.length > 0
                ? (gen.images as any)
                : (placeholderImages as any),
            imageCount: count,
            frameSize: gen.params?.frameSize,
            style: gen.params?.style,
            isPublic: gen.params?.isPublic,
            // Store the backend historyId if available for later matching
            ...(gen.historyId ? { firebaseHistoryId: gen.historyId } : {}),
          } as any;

          if (sortOrder === "desc") groups[genDateKey].unshift(placeholder);
          else groups[genDateKey].push(placeholder);
        }
      });
    }

    return groups;
  }, [filteredAndSortedEntries, sortOrder, imageOnlyActiveGenerations]);

  // Sort dates based on sortOrder
  const sortedDates = useMemo(() => {
    const dates = new Set(Object.keys(groupedByDate));
    const datesArray = Array.from(dates);
    if (sortOrder === "asc") {
      return datesArray.sort(
        (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime(), // Oldest first
      );
    } else {
      return datesArray.sort(
        (a: string, b: string) => new Date(b).getTime() - new Date(a).getTime(), // Newest first
      );
    }
  }, [groupedByDate, sortOrder]);

  // Only show date sections that actually render at least one image tile (avoids empty headers + stray dividers).
  const sortedDatesWithVisibleTiles = useMemo(() => {
    return sortedDates.filter((date) => {
      const raw =
        (groupedByDate as { [key: string]: HistoryEntry[] })[date] ?? [];
      const entries = raw.filter(historyEntryContributesGalleryTiles);
      return countGalleryCellsForEntries(entries) > 0;
    });
  }, [sortedDates, groupedByDate]);

  // Track previous entries for animation - update AFTER render completes
  // This ensures that during render, previousEntriesRef still contains entries from the PREVIOUS render
  useEffect(() => {
    const currentEntryIds = new Set<string>(
      filteredAndSortedEntries.map((e: HistoryEntry) => e.id),
    );
    // Also include active generation placeholders so they don't re-animate every render.
    activeGenerations.forEach((g: any) => {
      const id = String(g?.id || "");
      const hid = String(g?.historyId || "");
      if (id) currentEntryIds.add(id);
      if (hid) currentEntryIds.add(hid);
    });

    // Update ref AFTER render completes (for next render cycle comparison)
    previousEntriesRef.current = currentEntryIds;
  }, [filteredAndSortedEntries, activeGenerations]);

  // Memoize date formatter to avoid recreating on every render
  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);
  const uploadedImages = useAppSelector(
    (state: any) => state.generation?.uploadedImages || [],
  );
  const selectedCharacters = useAppSelector(
    (state: any) => state.generation?.selectedCharacters || [],
  );

  // ContentEditable approach for inline character tags (like Cursor)
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);
  /** Clears previous timeouts so an old 100ms timer cannot drop isUpdatingRef while the user is still typing (that let updateContentEditable run and jump the caret to the start). */
  const promptInputIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (promptInputIdleTimeoutRef.current) {
        clearTimeout(promptInputIdleTimeoutRef.current);
        promptInputIdleTimeoutRef.current = null;
      }
    };
  }, []);

  // Function to update contentEditable with tags
  const updateContentEditable = React.useCallback(() => {
    if (!contentEditableRef.current) return;

    // If currently handling an user typing update via onInput, bail out completely.
    // Retrying here causes a race condition that destroys the user's cursor position.
    if (isUpdatingRef.current) {
      return;
    }

    const div = contentEditableRef.current;
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    // Save cursor position
    let cursorOffset = 0;
    if (range && div.contains(range.startContainer)) {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(div);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorOffset = preCaretRange.toString().length;
    }

    isUpdatingRef.current = true;

    // Clear and rebuild content
    div.innerHTML = "";

    // If no prompt and no characters, leave empty
    if (!prompt && selectedCharacters.length === 0) {
      isUpdatingRef.current = false;
      return;
    }

    // Parse prompt and create nodes
    let parts: Array<{
      type: "text" | "tag";
      content: string;
      character?: any;
    }> = [];
    let lastIndex = 0;

    // Find all @references in the prompt
    const refMatches = Array.from(
      prompt.matchAll(/@(\w+)/gi),
    ) as RegExpMatchArray[];

    refMatches.forEach((match) => {
      const matchIndex = match.index!;
      const refName = match[1];
      const character = selectedCharacters.find(
        (char: any) => char.name.toLowerCase() === refName.toLowerCase(),
      );

      if (character && matchIndex >= lastIndex) {
        // Add text before reference
        if (matchIndex > lastIndex) {
          const textBefore = prompt.substring(lastIndex, matchIndex);
          if (textBefore) {
            parts.push({ type: "text", content: textBefore });
          }
        }
        // Add reference tag
        parts.push({ type: "tag", content: match[0], character });
        lastIndex = matchIndex + match[0].length;
      }
    });

    // Add remaining text
    if (lastIndex < prompt.length) {
      const textAfter = prompt.substring(lastIndex);
      if (textAfter) {
        parts.push({ type: "text", content: textAfter });
      }
    }

    // If no parts and we have text, add it as text
    if (parts.length === 0 && prompt) {
      parts.push({ type: "text", content: prompt });
    }

    // If there are selected characters but no explicit @tags in the prompt,
    // prepend the selected characters as visible tags so users always see
    // the attached characters in the contentEditable area (like Freepik).
    // This lets users type anywhere while the tags remain present.
    const hasTagParts = parts.some((p) => p.type === "tag");
    if (selectedCharacters && selectedCharacters.length > 0 && !hasTagParts) {
      const leadingTags = selectedCharacters.map((char: any) => ({
        type: "tag" as const,
        content: `@${char.name}`,
        character: char,
      }));
      parts = [...leadingTags, ...parts];
    }

    // Build DOM nodes
    parts.forEach((part) => {
      if (part.type === "tag" && part.character) {
        const tagSpan = document.createElement("span");
        tagSpan.className =
          "character-tag group relative inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded text-blue-300 text-sm font-medium hover:bg-blue-500/30 transition-colors mx-0.5";
        tagSpan.contentEditable = "false";
        tagSpan.style.display = "inline-flex";
        tagSpan.style.verticalAlign = "baseline";
        tagSpan.setAttribute("data-character-id", part.character.id);

        const nameSpan = document.createElement("span");
        nameSpan.textContent = `@${part.character.name}`;
        tagSpan.appendChild(nameSpan);

        const removeBtn = document.createElement("button");
        removeBtn.className =
          "opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-blue-200 hover:text-white";
        removeBtn.type = "button";
        removeBtn.contentEditable = "false";
        removeBtn.innerHTML =
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          removeCharacterReference(part.character.name);
        };
        tagSpan.appendChild(removeBtn);

        div.appendChild(tagSpan);
      } else {
        const textNode = document.createTextNode(part.content);
        div.appendChild(textNode);
      }
    });

    // Restore cursor position
    if (range && cursorOffset > 0) {
      try {
        const walker = document.createTreeWalker(
          div,
          NodeFilter.SHOW_TEXT,
          null,
        );

        let currentPos = 0;
        let node;
        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent?.length || 0;
          if (currentPos + nodeLength >= cursorOffset) {
            const newRange = document.createRange();
            newRange.setStart(
              node,
              Math.min(cursorOffset - currentPos, nodeLength),
            );
            newRange.setEnd(
              node,
              Math.min(cursorOffset - currentPos, nodeLength),
            );
            selection?.removeAllRanges();
            selection?.addRange(newRange);
            break;
          }
          currentPos += nodeLength;
        }
      } catch (e) {
        // Ignore cursor restoration errors
      }
    }

    // Adjust height
    div.style.height = "auto";
    div.style.height =
      Math.min(div.scrollHeight, PROMPT_EDITOR_MAX_HEIGHT_PX) + "px";

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 50);
  }, [prompt, selectedCharacters]);

  // Ensure contentEditable is synced whenever prompt or selected characters change
  useEffect(() => {
    // Defer to next tick to avoid interfering with other layout tasks
    setTimeout(() => {
      try {
        updateContentEditable();
      } catch (e) {
        // ignore
      }
    }, 0);
  }, [prompt, selectedCharacters, updateContentEditable]);

  // Helper function to convert AVIF thumbnail URLs back to original JPG/PNG format
  const convertAvifToOriginal = (url: string): string => {
    if (!url) return url;

    // If it's already a non-AVIF URL, return as-is
    if (!url.includes("_thumb.avif") && !url.endsWith(".avif")) {
      return url;
    }

    // Replace _thumb.avif with .jpg (default, backend should handle if it's actually png)
    // Also handle cases where the URL ends with .avif
    let converted = url.replace("_thumb.avif", ".jpg");
    if (converted.endsWith(".avif")) {
      converted = converted.replace(/\.avif$/, ".jpg");
    }

    return converted;
  };

  // Helper function to get the best available image URL from a character object
  const getCharacterImageUrl = (char: any): string | null => {
    if (!char) return null;

    // If character has an entry structure with images array (from history), use that
    if (char.images && Array.isArray(char.images) && char.images.length > 0) {
      const image = char.images[0];
      // Priority: originalUrl > url (if not AVIF) > firebaseUrl > storagePath-based URL
      if (
        image.originalUrl &&
        !image.originalUrl.includes("_thumb.avif") &&
        !image.originalUrl.endsWith(".avif")
      ) {
        return image.originalUrl;
      }
      if (
        image.url &&
        !image.url.includes("_thumb.avif") &&
        !image.url.endsWith(".avif")
      ) {
        return image.url;
      }
      if (
        image.firebaseUrl &&
        !image.firebaseUrl.includes("_thumb.avif") &&
        !image.firebaseUrl.endsWith(".avif")
      ) {
        return image.firebaseUrl;
      }
      // If we have storagePath, try to construct original URL
      if (image.storagePath && !image.storagePath.includes("_thumb.avif")) {
        // Remove _thumb.avif or .avif extension and try common extensions
        let basePath = image.storagePath
          .replace(/_thumb\.avif$/, "")
          .replace(/\.avif$/, "");
        // Try to get original extension from storagePath or default to .jpg
        const zataBase = (process.env.NEXT_PUBLIC_ZATA_PREFIX || "").replace(
          /\/$/,
          "/",
        );
        // Check if storagePath already has an extension
        if (!basePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
          basePath += ".jpg"; // Default to jpg
        }
        return `${zataBase}${basePath}`;
      }
    }

    // Priority order: original URL > firebase URL > frontImageUrl (converted if AVIF)
    // Check if character has original URL fields (from the entry structure)
    const originalUrl = char.url || char.originalUrl;
    if (
      originalUrl &&
      !originalUrl.includes("_thumb.avif") &&
      !originalUrl.endsWith(".avif")
    ) {
      return originalUrl;
    }

    const firebaseUrl = char.firebaseUrl;
    if (
      firebaseUrl &&
      !firebaseUrl.includes("_thumb.avif") &&
      !firebaseUrl.endsWith(".avif")
    ) {
      return firebaseUrl;
    }

    // If frontImageUrl is AVIF, try to convert it to original format
    if (char.frontImageUrl) {
      const frontUrl = String(char.frontImageUrl);
      // If it's already a non-AVIF URL, use it directly
      if (!frontUrl.includes("_thumb.avif") && !frontUrl.endsWith(".avif")) {
        return frontUrl;
      }
      // Try to convert AVIF to original format
      // Remove _thumb.avif or .avif and replace with .jpg
      let converted = frontUrl
        .replace(/_thumb\.avif$/, "")
        .replace(/\.avif$/, "");
      // If it doesn't have an extension now, add .jpg
      if (!converted.match(/\.(jpg|jpeg|png|webp)$/i)) {
        converted += ".jpg";
      } else {
        // If it has an extension, ensure it's not .avif
        converted = converted.replace(/\.avif$/i, ".jpg");
      }
      return converted;
    }

    return null;
  };

  // Helper function to combine uploadedImages with selectedCharacters images
  // Maps @references in prompt to character images in the correct order
  const getCombinedUploadedImages = (): string[] => {
    const result: string[] = [];
    const added = new Set<string>();

    // 1) Add character images in the order they are mentioned in the prompt (@Name)
    try {
      const mentionRegex = /@([\w-]+)/g;
      const seenNames = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = mentionRegex.exec(prompt))) {
        const name = m[1];
        if (seenNames.has(name.toLowerCase())) continue; // skip duplicate mentions
        seenNames.add(name.toLowerCase());
        const char = (selectedCharacters || []).find(
          (c: any) => String(c.name).toLowerCase() === name.toLowerCase(),
        );
        if (char) {
          const url = getCharacterImageUrl(char);
          if (url && !added.has(url)) {
            result.push(url);
            added.add(url);
          }
        }
      }
    } catch (e) {
      // fall back to simple behavior below
    }

    // 2) Append any selected character images that weren't mentioned (preserve selection order)
    (selectedCharacters || []).forEach((c: any) => {
      const url = getCharacterImageUrl(c);
      if (url && !added.has(url)) {
        result.push(url);
        added.add(url);
      }
    });

    // 3) Append other uploaded images (user-uploaded) that are not already included
    (uploadedImages || []).forEach((u: string) => {
      try {
        const url = String(u);
        if (url && !added.has(url)) {
          result.push(url);
          added.add(url);
        }
      } catch {
        /* ignore */
      }
    });

    return result;
  };

  const expectedCredits = useMemo(() => {
    try {
      const resolution =
        selectedModel === "google/nano-banana-pro"
          ? nanoBananaProResolution
          : selectedModel === "google/nano-banana-2"
            ? nanoBananaResolution
            : selectedModel === "flux-2-pro"
              ? flux2ProResolution
              : selectedModel === "qwen-image-edit-2512"
                ? qwenResolution
                : selectedModel === "seedream-4.5"
                  ? seedream45Resolution
                  : selectedModel === "seedream-5-lite"
                    ? seedream5LiteResolution
                    : selectedModel === "seedream-v4"
                      ? seedreamSize
                      : undefined;
      const cost = getImageGenerationCreditCost(
        selectedModel,
        imageCount,
        frameSize,
        style,
        resolution,
        getCombinedUploadedImages(),
        selectedModel === "openai/gpt-image-1.5" ||
          selectedModel === "openai/gpt-image-2"
          ? gptImage15Quality
          : undefined,
      );

      // Special case for z-image-turbo: show 0 credits for free plan users
      const isFreeTurboModel = selectedModel === 'new-turbo-model' || selectedModel === 'z-image-turbo';
      const isFreePlan = planCode === 'free';
      if (isFreeTurboModel && isFreePlan) {
        return 0;
      }

      return cost;
    } catch {
      return 0;
    }
  }, [
    selectedModel,
    imageCount,
    frameSize,
    style,
    nanoBananaProResolution,
    nanoBananaResolution,
    flux2ProResolution,
    qwenResolution,
    seedream45Resolution,
    seedream5LiteResolution,
    seedreamSize,
    gptImage15Quality,
    prompt,
    uploadedImages,
    selectedCharacters,
  ]);

  const nanoBananaProResolutionCredits = useMemo(
    () => ({
      "1K": getImageGenerationCreditCost(
        "google/nano-banana-pro",
        1,
        frameSize,
        style,
        "1K",
        getCombinedUploadedImages(),
      ),
      "2K": getImageGenerationCreditCost(
        "google/nano-banana-pro",
        1,
        frameSize,
        style,
        "2K",
        getCombinedUploadedImages(),
      ),
      "4K": getImageGenerationCreditCost(
        "google/nano-banana-pro",
        1,
        frameSize,
        style,
        "4K",
        getCombinedUploadedImages(),
      ),
    }),
    [frameSize, style, prompt, uploadedImages, selectedCharacters],
  );

  const nanoBanana2ResolutionCredits = useMemo(
    () => ({
      "0.5K": getImageGenerationCreditCost(
        "google/nano-banana-2",
        1,
        frameSize,
        style,
        "0.5K",
        getCombinedUploadedImages(),
      ),
      "1K": getImageGenerationCreditCost(
        "google/nano-banana-2",
        1,
        frameSize,
        style,
        "1K",
        getCombinedUploadedImages(),
      ),
      "2K": getImageGenerationCreditCost(
        "google/nano-banana-2",
        1,
        frameSize,
        style,
        "2K",
        getCombinedUploadedImages(),
      ),
      "4K": getImageGenerationCreditCost(
        "google/nano-banana-2",
        1,
        frameSize,
        style,
        "4K",
        getCombinedUploadedImages(),
      ),
    }),
    [frameSize, style, prompt, uploadedImages, selectedCharacters],
  );

  const seedream45ResolutionCredits = useMemo(
    () => ({
      "2K": getImageGenerationCreditCost(
        "seedream-4.5",
        1,
        frameSize,
        style,
        "2K",
        getCombinedUploadedImages(),
      ),
      "4K": getImageGenerationCreditCost(
        "seedream-4.5",
        1,
        frameSize,
        style,
        "4K",
        getCombinedUploadedImages(),
      ),
    }),
    [frameSize, style, prompt, uploadedImages, selectedCharacters],
  );

  const seedream5LiteResolutionCredits = useMemo(
    () => ({
      "2K": getImageGenerationCreditCost(
        "seedream-5-lite",
        1,
        frameSize,
        style,
        "2K",
        getCombinedUploadedImages(),
      ),
      "3K": getImageGenerationCreditCost(
        "seedream-5-lite",
        1,
        frameSize,
        style,
        "3K",
        getCombinedUploadedImages(),
      ),
    }),
    [frameSize, style, prompt, uploadedImages, selectedCharacters],
  );

  // Function to remove character reference (removes from selectedCharacters)
  const removeCharacterReference = (characterName: string) => {
    // Remove the character from selectedCharacters and clean up any @mentions
    try {
      const character = (selectedCharacters || []).find(
        (char: any) =>
          String(char.name).toLowerCase() ===
          String(characterName).toLowerCase(),
      );
      if (character) {
        dispatch(removeSelectedCharacter(character.id));
      }

      // Helper to escape special chars for regex
      const escapeRegExp = (s: string) =>
        s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");

      // Remove any @characterName occurrences from the prompt (case-insensitive)
      // Be liberal in matching so we also remove trailing punctuation like commas/periods
      const nameEsc = escapeRegExp(String(characterName));
      // Match @Name followed by optional non-word punctuation (e.g. @Name, @Name.) or end of string
      const regex = new RegExp(`@${nameEsc}(?:[^\\w]|$)`, "gi");
      if (prompt && regex.test(prompt)) {
        const newPrompt = prompt
          .replace(regex, " ")
          .trim()
          .replace(/\s+/g, " ");
        dispatch(setPrompt(newPrompt));
      }

      // Also remove any leftover plain-text @mentions inside the contentEditable DOM
      // (This handles cases where the DOM contains a text node like "@Name" that didn't come from prompt)
      setTimeout(() => {
        try {
          const div = contentEditableRef.current;
          if (div) {
            const walker = document.createTreeWalker(
              div,
              NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
              null,
            );
            const nodesToRemove: Node[] = [];
            const nodesToTrim: { node: Text; value: string }[] = [];
            let node: Node | null = walker.nextNode();
            while (node) {
              // If element is a character-tag with matching data-character-id, remove it
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.classList && el.classList.contains("character-tag")) {
                  const dataId = el.getAttribute("data-character-id");
                  if (
                    character &&
                    dataId &&
                    String(dataId) === String(character.id)
                  ) {
                    nodesToRemove.push(el);
                  }
                }
              }

              // If it's a text node containing the literal @name, trim/remove it
              if (node.nodeType === Node.TEXT_NODE) {
                const txt = node.nodeValue || "";
                // Liberal match inside text nodes (handle trailing punctuation)
                const re = new RegExp(`@${nameEsc}(?:[^\\w]|$)`, "i");
                if (re.test(txt)) {
                  // If the text node is mostly the mention, remove it entirely
                  if (
                    txt
                      .trim()
                      .toLowerCase()
                      .replace(/[^\w@]/g, "") ===
                    `@${String(characterName).toLowerCase().replace(/[^\w]/g, "")}`
                  ) {
                    nodesToRemove.push(node);
                  } else {
                    // Otherwise remove just the mention substring
                    const newVal = txt.replace(re, " ").replace(/\s+/g, " ");
                    nodesToTrim.push({ node: node as Text, value: newVal });
                  }
                }
              }

              node = walker.nextNode();
            }

            nodesToRemove.forEach((n) => n.parentNode?.removeChild(n));
            nodesToTrim.forEach((t) => (t.node.nodeValue = t.value));

            // After DOM manip, force the controlled content to re-sync
            updateContentEditable();
            // Keep focus on the contentEditable for UX continuity
            div.focus();
          }
        } catch (e) {
          // ignore DOM cleanup errors
        }
      }, 50);
    } catch (e) {
      // swallow to avoid breaking UI
    }
  };

  // Credits management
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    credits,
    planCode,
    clearCreditsError,
    refreshCredits,
  } = useGenerationCredits("image", selectedModel, {
    frameSize,
    count: imageCount,
    style,
    resolution:
      selectedModel === "google/nano-banana-pro"
        ? nanoBananaProResolution
        : selectedModel === "google/nano-banana-2"
          ? nanoBananaResolution
          : selectedModel === "flux-2-pro"
            ? flux2ProResolution
            : selectedModel === "qwen-image-edit-2512"
              ? qwenResolution
              : undefined,
    quality:
      selectedModel === "openai/gpt-image-1.5" ||
      selectedModel === "openai/gpt-image-2"
        ? gptImage15Quality
        : undefined,
  });

  // Function to clear input after successful generation
  // DISABLED: User wants to preserve all inputs after generation
  // Note: Selected characters and uploaded images are NOT cleared - they remain for easy remixing
  const clearInputs = () => {
    // PRESERVE INPUTS: All inputs are now preserved after generation
    // Users can continue generating with the same settings or modify them as needed
    // No clearing of prompt, uploaded images, or selected characters
    return;

    // OLD CODE (disabled):
    // dispatch(setPrompt(""));
    // dispatch(setUploadedImages([]));
    // dispatch(clearSelectedCharacters());
    // if (inputEl.current) {
    //   inputEl.current.value = "";
    // }
    // if (contentEditableRef.current) {
    //   contentEditableRef.current.textContent = "";
    // }
  };

  // Function to auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    if (!element) return;
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  // Auto-adjust height when prompt changes
  useEffect(() => {
    if (inputEl.current) {
      adjustTextareaHeight(inputEl.current);
    }
  }, [prompt]);

  // Bottom scroll pagination (History page style) with added post-load safeguards
  const { userScrolledRef } = useBottomScrollPagination({
    containerRef: scrollRootRef,
    hasMore,
    loading,
    enabled:
      historyEntries.length > 0 && sortedDatesWithVisibleTiles.length > 0,
    loadMore: async () => {
      if (!userData) return;
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        // Use currentFilters from Redux to get the latest values (sync with HistoryControls)
        // This ensures consistency with search, sort, and date filters managed by HistoryControls
        const currentSortOrder =
          (currentFilters as any)?.sortOrder || sortOrder || "desc";
        const currentSearch =
          (currentFilters as any)?.search || searchQuery?.trim() || "";
        const currentDateRange =
          (currentFilters as any)?.dateRange ||
          (dateRange.start && dateRange.end
            ? {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
              }
            : null);

        const paginationFilters: any = {
          mode: "image",
          sortOrder: currentSortOrder,
        };
        if (currentSearch) paginationFilters.search = currentSearch;
        if (currentDateRange?.start && currentDateRange?.end) {
          paginationFilters.dateRange = {
            start:
              typeof currentDateRange.start === "string"
                ? currentDateRange.start
                : new Date(currentDateRange.start).toISOString(),
            end:
              typeof currentDateRange.end === "string"
                ? currentDateRange.end
                : new Date(currentDateRange.end).toISOString(),
          };
        }

        const backendFilters: any = {
          mode: "image",
          sortOrder: currentSortOrder,
          ...(currentSearch ? { search: currentSearch } : {}),
          ...(currentDateRange?.start && currentDateRange?.end
            ? {
                dateRange: {
                  start:
                    typeof currentDateRange.start === "string"
                      ? currentDateRange.start
                      : new Date(currentDateRange.start).toISOString(),
                  end:
                    typeof currentDateRange.end === "string"
                      ? currentDateRange.end
                      : new Date(currentDateRange.end).toISOString(),
                },
              }
            : {}),
        };

        await (dispatch as any)(
          loadMoreHistory({
            filters: paginationFilters,
            backendFilters: backendFilters,
            paginationParams: { limit: 50 }, // Increased to 50 for better pagination coverage
          }),
        ).unwrap();
      } catch (e: any) {
        // swallow non-critical errors; backend handles end-of-pagination
      }
    },
    bottomOffset: 800,
    throttleMs: 250, // slightly higher throttle for heavier image grid
    requireUserScroll: true, // Match video behavior; prevents extra requests on sort/reset
    requireScrollAfterLoad: true,
    postLoadCooldownMs: 500, // Reduced cooldown for smoother loading
    blockLoadRef: postGenerationBlockRef, // hard block during generation completion window
    allowAutoloadWhenNotScrollable: true,
  });

  const handleFalError = useMemo(
    () =>
      createHandleFalError({
        dispatch,
        upsertLocalGeneratingEntry,
        removeLocalGeneratingEntry,
        setIsGeneratingLocally,
        postGenerationBlockRef,
        handleGenerationFailure,
      }),
    [
      dispatch,
      upsertLocalGeneratingEntry,
      removeLocalGeneratingEntry,
      setIsGeneratingLocally,
      postGenerationBlockRef,
      handleGenerationFailure,
    ],
  );

  const handleReplicateError = useMemo(
    () =>
      createHandleReplicateError({
        dispatch,
        upsertLocalGeneratingEntry,
        removeLocalGeneratingEntry,
        setIsGeneratingLocally,
        postGenerationBlockRef,
        handleGenerationFailure,
      }),
    [
      dispatch,
      upsertLocalGeneratingEntry,
      removeLocalGeneratingEntry,
      setIsGeneratingLocally,
      postGenerationBlockRef,
      handleGenerationFailure,
    ],
  );

  const generationRuntimeRef = useRef<InputBoxGenerationRuntime>({});
  const handleGenerate = useMemo(
    () => bindHandleGenerate(() => generationRuntimeRef.current!),
    [],
  );

  // Handle manual prompt enhancement (button)
  const handleEnhancePrompt = async () => {
    if (isEnhancing) return;
    if (!prompt || !prompt.trim()) {
      toast("Please enter a prompt to enhance");
      return;
    }

    try {
      setIsEnhancing(true);
      // Explicitly pass 'image' as media type for image generation
      const res = await enhancePromptAPI(prompt, "openai/gpt-4o", "image");
      if (res.ok && res.enhancedPrompt) {
        const enhancedPrompt = res.enhancedPrompt;

        // Update Redux state - this will trigger the useEffect that calls updateContentEditable
        dispatch(setPrompt(enhancedPrompt));

        // Immediately update the contentEditable element for instant visual feedback
        // This bypasses any Redux state propagation delays
        const el = contentEditableRef.current as HTMLElement | null;
        if (el) {
          // Set text content directly for immediate update
          el.textContent = enhancedPrompt;

          // Focus and position cursor at end
          el.focus();
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }

        // Let updateContentEditable run after Redux state has updated to properly format
        // with character tags if needed (runs via useEffect watching prompt)
        // Also call it directly after a brief delay to ensure proper formatting
        // updateContentEditable will be triggered by the useEffect watching 'prompt'
        // No need to call it manually here, as it might use a stale closure of 'prompt'

        toast.success("Prompt enhanced");
      } else {
        toast.error(res.error || "Failed to enhance prompt");
      }
    } catch (e: any) {
      console.error("Prompt enhancement error:", e);
      toast.error(e?.message || "Failed to enhance prompt. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };
  handleGenerateRef.current = handleGenerate;

  // Mark that the initial load has started/completed even if the backend returns zero entries.
  useEffect(() => {
    if (loading) {
      hasStartedInitialLoadRef.current = true;
      hasAttemptedInitialLoadRef.current = true;
      return;
    }

    if (historyEntries.length > 0 || hasStartedInitialLoadRef.current) {
      hasAttemptedInitialLoadRef.current = true;
    }
  }, [loading, historyEntries.length]);

  // Check for auto-resume intent on mount
  useEffect(() => {
    console.log("[AutoResume] ========================================");
    console.log(
      "[AutoResume] Effect running, userData:",
      !!userData,
      "runningGenerationsCount:",
      runningGenerationsCount,
    );
    console.log("[AutoResume] localStorage keys:", Object.keys(localStorage));
    console.log(
      "[AutoResume] localStorage.wildmind_auto_resume_intent:",
      localStorage.getItem("wildmind_auto_resume_intent"),
    );

    // CRITICAL: Check for intent FIRST, before checking userData
    const intent = getAutoResumeIntent();
    console.log("[AutoResume] Checking for intent:", intent);
    console.log("[AutoResume] Intent type:", intent?.type);
    console.log("[AutoResume] Intent data:", intent?.data);

    if (!intent || intent.type !== "image") {
      console.log("[AutoResume] No image intent found or wrong type");
      return;
    }

    // Intent exists! Now check if we have userData
    if (!userData) {
      console.log("[AutoResume] ⏳ Intent found but waiting for userData...");
      return; // Effect will re-run when userData becomes available
    }

    // We have both intent AND userData - proceed!
    const { data } = intent;
    console.log(
      "[AutoResume] ✅ Found image intent AND userData, restoring state:",
      data,
    );

    if (data.prompt) {
      console.log("[AutoResume] Restoring prompt:", data.prompt);
      dispatch(setPrompt(data.prompt));

      // Fallback: visually update the contentEditable immediately in case the
      // React state -> DOM update cycle misses it during the initial mount
      setTimeout(() => {
        if (
          contentEditableRef.current &&
          contentEditableRef.current.textContent?.trim() === ""
        ) {
          contentEditableRef.current.textContent = data.prompt;
        }
      }, 100);
    }
    if (data.model) {
      console.log("[AutoResume] Restoring model:", data.model);
      dispatch(setSelectedModel(normalizeIncomingImageModel(data.model)));
    }
    if (data.imageCount) dispatch(setImageCount(data.imageCount));
    if (data.frameSize) dispatch(setFrameSize(data.frameSize));
    if (data.style) dispatch(setStyle(data.style));
    if (data.uploadedImages) {
      dispatch(setUploadedImages(data.uploadedImages));
    }

    if (data.selectedCharacters && Array.isArray(data.selectedCharacters)) {
      data.selectedCharacters.forEach((char: any) => {
        dispatch(addSelectedCharacter(char));
      });
    }

    clearAutoResumeIntent();
    console.log("[AutoResume] Intent cleared, scheduling auto-trigger in 1.5s");

    // Auto-trigger generation after a short delay to ensure Redux state is updated
    setTimeout(() => {
      console.log("[AutoResume] Timeout fired! Checking conditions...");
      console.log("[AutoResume] - Has prompt:", !!data.prompt);
      console.log("[AutoResume] - Running count:", runningGenerationsCount);
      console.log(
        "[AutoResume] - Can trigger:",
        data.prompt && runningGenerationsCount < 4,
      );

      if (data.prompt && runningGenerationsCount < 4) {
        console.log(
          "[AutoResume] 🚀 AUTO-TRIGGERING GENERATION WITH QUEUE FEEDBACK!",
        );
        const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        // Ensure imageOnlyActiveGenerations will include this by adding proper metadata
        const resumeStart = Date.now();
        dispatch(
          addActiveGeneration({
            id: generationId,
            prompt: data.prompt,
            model: data.model || selectedModel,
            status: "pending",
            createdAt: resumeStart,
            startedAt: resumeStart,
            updatedAt: resumeStart,
            generationType: "text-to-image", // Top-level for filtering
            params: {
              imageCount: data.imageCount || imageCount,
              frameSize: data.frameSize || frameSize,
              style: data.style || style,
              uploadedImages: data.uploadedImages || [],
              generationType: "text-to-image",
            },
          }),
        );

        // Trigger generation directly via Ref (avoids stale closure)
        console.log(
          "[AutoResume] Calling handleGenerate with ID via Ref:",
          generationId,
        );
        if (handleGenerateRef.current) {
          handleGenerateRef.current(generationId);
        } else {
          handleGenerate(generationId);
        }
      } else {
        console.log("[AutoResume] ❌ Conditions not met for auto-trigger");
        if (!data.prompt) console.log("[AutoResume] - Missing prompt");
        if (runningGenerationsCount >= 4)
          console.log("[AutoResume] - Queue full");
      }
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, dispatch, runningGenerationsCount]);


  // Check for auto-resume intent on mount
  useEffect(() => {
    console.log('[AutoResume] ========================================');
    console.log('[AutoResume] Effect running, userData:', !!userData, 'runningGenerationsCount:', runningGenerationsCount);
    console.log('[AutoResume] localStorage keys:', Object.keys(localStorage));
    console.log('[AutoResume] localStorage.wildmind_auto_resume_intent:', localStorage.getItem('wildmind_auto_resume_intent'));

    // CRITICAL: Check for intent FIRST, before checking userData
    const intent = getAutoResumeIntent();
    console.log('[AutoResume] Checking for intent:', intent);
    console.log('[AutoResume] Intent type:', intent?.type);
    console.log('[AutoResume] Intent data:', intent?.data);

    if (!intent || intent.type !== 'image') {
      console.log('[AutoResume] No image intent found or wrong type');
      return;
    }

    // Intent exists! Now check if we have userData
    if (!userData) {
      console.log('[AutoResume] ⏳ Intent found but waiting for userData...');
      return; // Effect will re-run when userData becomes available
    }

    // We have both intent AND userData - proceed!
    const { data } = intent;
    console.log('[AutoResume] ✅ Found image intent AND userData, restoring state:', data);

    if (data.prompt) {
      console.log('[AutoResume] Restoring prompt:', data.prompt);
      dispatch(setPrompt(data.prompt));
    }
    if (data.model) {
      console.log('[AutoResume] Restoring model:', data.model);
      dispatch(setSelectedModel(data.model));
    }
    if (data.imageCount) dispatch(setImageCount(data.imageCount));
    if (data.frameSize) dispatch(setFrameSize(data.frameSize));
    if (data.style) dispatch(setStyle(data.style));
    if (data.uploadedImages) {
      dispatch(setUploadedImages(data.uploadedImages));
    }

    if (data.selectedCharacters && Array.isArray(data.selectedCharacters)) {
      data.selectedCharacters.forEach((char: any) => {
        dispatch(addSelectedCharacter(char));
      });
    }

    clearAutoResumeIntent();
    console.log('[AutoResume] Intent cleared, scheduling auto-trigger in 1.5s');

    // Auto-trigger generation after a short delay to ensure Redux state is updated
    setTimeout(() => {
      console.log('[AutoResume] Timeout fired! Checking conditions...');
      console.log('[AutoResume] - Has prompt:', !!data.prompt);
      console.log('[AutoResume] - Running count:', runningGenerationsCount);
      console.log('[AutoResume] - Can trigger:', data.prompt && runningGenerationsCount < 4);

      if (data.prompt && runningGenerationsCount < 4) {
        console.log('[AutoResume] 🚀 AUTO-TRIGGERING GENERATION!');
        const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        dispatch(addActiveGeneration({
          id: generationId,
          prompt: data.prompt,
          model: data.model || selectedModel,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          params: {
            imageCount: data.imageCount || imageCount,
            frameSize: data.frameSize || frameSize,
            style: data.style || style,
            uploadedImages: data.uploadedImages || []
          }
        }));
        // Trigger generation directly without relying on handleGenerate in dependencies
        console.log('[AutoResume] Calling handleGenerate with ID:', generationId);
        handleGenerate(generationId);
      } else {
        console.log('[AutoResume] ❌ Conditions not met for auto-trigger');
        if (!data.prompt) console.log('[AutoResume] - Missing prompt');
        if (runningGenerationsCount >= 4) console.log('[AutoResume] - Queue full');
      }
    }, 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, dispatch, runningGenerationsCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        activeDropdown &&
        !target.closest(".dropdown-container") &&
        !target.closest("[data-dropdown]")
      ) {
        dispatch(toggleDropdown(""));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dispatch]);

  generationRuntimeRef.current = {
    activeGenerations,
    adjustPromptImageNumbers,
    clearInputs,
    contentEditableRef,
    dispatch,
    ensureProviderReadyImageUrls,
    expectedCredits,
    flux2ProResolution,
    frameSize,
    getCombinedUploadedImages,
    gptImage15OutputFormat,
    gptImage15Quality,
    gptImage2CustomHeight,
    gptImage2CustomWidth,
    handleFalError,
    handleReplicateError,
    hasMeaningfulPromptText,
    imageCount,
    indianStyleVersion,
    isEnhancing,
    isGeneratingLocally,
    isSupportedUploadedImageSource,
    loading,
    localGeneratingEntries,
    lucidContrast,
    lucidMode,
    lucidPromptEnhance,
    lucidStyle,
    nanoBananaGoogleSearch,
    nanoBananaLimitGenerations,
    nanoBananaProResolution,
    nanoBananaResolution,
    nanoBananaThinkingLevel,
    outputFormat,
    phoenixContrast,
    phoenixMode,
    phoenixPromptEnhance,
    phoenixStyle,
    pollForMatchingHistory,
    postGenerationBlockRef,
    preview,
    prompt,
    qwenResolution,
    refreshHistory,
    refreshSingleGeneration,
    removeLocalGeneratingEntry,
    router,
    runwayBaseRespToastShownRef,
    seedream45Resolution,
    seedream5LiteResolution,
    seedreamHeight,
    seedreamSize,
    seedreamWidth,
    selectedCharacters,
    selectedModel,
    style,
    customStyleFromImage,
    toAbsoluteFromProxy,
    updateContentEditable,
    uploadedImages,
    upsertLocalGeneratingEntry,
    userData,
    zTurboOutputFormat,
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    clearCreditsError,
    refreshCredits,
    credits,
    planCode,
    setIsEnhancing,
    setIsGeneratingLocally,
    setLocalGeneratingEntries,
  };

  return (
    <>
      <InputBoxGlobalStyles />

      <InputBoxShell
        scrollRootRef={scrollRootRef}
        isAssistantOpen={isAssistantOpen}
      >
        <div className="md:py-0  py-0 md:pl-0  ">
          <InputBoxHistoryChrome
            pathname={pathname}
            userData={userData}
            showGuideInfoButton={
              historyEntries.length > 0 &&
              sortedDatesWithVisibleTiles.length > 0
            }
            onOpenSidebar={() => dispatch(setSidebarExpanded(true))}
            onOpenGuide={() => setIsGuideModalOpen(true)}
            onNavigateImageTab={() => router.push("/text-to-image")}
            onNavigateEditTab={() => router.push("/text-to-image/edit-image")}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            refreshHistoryFromBackend={refreshHistoryFromBackend}
            dateInputRef={dateInputRef}
            dateInput={dateInput}
            setDateInput={setDateInput}
            mobileDateInputMax={mobileDateInputMax}
            runMobileDateFilterRefresh={runMobileDateFilterRefresh}
            isFutureMobileCalendarDate={isFutureMobileCalendarDate}
            mobileFilterMenuRef={mobileFilterMenuRef}
            isMobileFilterMenuOpen={isMobileFilterMenuOpen}
            setIsMobileFilterMenuOpen={setIsMobileFilterMenuOpen}
            showCalendar={showCalendar}
            setShowCalendar={setShowCalendar}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            dateRange={dateRange}
            calendarRef={calendarRef}
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            setCalendarYear={setCalendarYear}
            setCalendarMonth={setCalendarMonth}
            calendarFirstWeekday={calendarFirstWeekday}
            calendarDaysInMonth={calendarDaysInMonth}
          />

          {/* Mobile: Search, Sort, and Date controls */}
        </div>

        <InputBoxHistoryOverlays
          userData={userData}
          isInlineEditImagePage={isInlineEditImagePage}
          loading={loading}
          hasAttemptedInitialLoadRef={hasAttemptedInitialLoadRef}
          historyEntriesLength={historyEntries.length}
          activeGenerationsLength={activeGenerations.length}
          isMobileDateFiltering={isMobileDateFiltering}
          isFiltering={isFiltering}
          isSorting={isSorting}
          sortOrder={sortOrder}
        />
        <InputBoxHistoryScrollBody
          isInlineEditImagePage={isInlineEditImagePage}
          sentinelRef={sentinelRef}
          authLoading={authLoading}
          userData={userData}
          hasAttemptedInitialLoadRef={hasAttemptedInitialLoadRef}
          loading={loading}
          isFiltering={isFiltering}
          historyEntries={historyEntries}
          sortedDates={sortedDates}
          activeGenerations={activeGenerations}
          currentFilters={currentFilters}
          setSearchQuery={setSearchQuery}
          setDateRange={setDateRange}
          setDateInput={setDateInput}
          refreshHistoryFromBackend={refreshHistoryFromBackend}
          sortOrder={sortOrder}
          sortedDatesWithVisibleTiles={sortedDatesWithVisibleTiles}
          groupedByDate={groupedByDate}
          loadedImages={loadedImages}
          setLoadedImages={setLoadedImages}
          previousEntriesRef={previousEntriesRef}
          setPreview={setPreview}
          handleRecreate={handleRecreate}
          copyPrompt={copyPrompt}
          getCleanPrompt={getCleanPrompt}
          handleDeleteImage={handleDeleteImage}
          formatDate={formatDate}
        />
      </InputBoxShell>

      <AssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onApplyPrompt={(newPrompt) => {
          // Add prompt to Redux/Local state
          if (inputEl.current) {
            inputEl.current.value = newPrompt;
          }
          dispatch(setPrompt(newPrompt));
          // setIsAssistantOpen(false); // DO NOT Auto close assistant

          // Trigger the generation immediately using the current state values but with the new prompt
          if (!userData) {
            saveAutoResumeIntent("image", {
              prompt: newPrompt,
              model: selectedModel,
              imageCount,
              frameSize,
              style,
              uploadedImages: getCombinedUploadedImages(),
              selectedCharacters: selectedCharacters,
            });
            router.push(getSignInUrl());
            return;
          }

          if (runningGenerationsCount >= 4) {
            toast.error(
              "Queue full (4/4 active). Please wait for a generation to complete.",
            );
            return;
          }

          const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const assistantStart = Date.now();
          dispatch(
            addActiveGeneration({
              id: generationId,
              prompt: newPrompt, // Use the new prompt from assistant
              model: selectedModel,
              status: "pending",
              createdAt: assistantStart,
              startedAt: assistantStart,
              updatedAt: assistantStart,
              generationType: "text-to-image",
              params: {
                imageCount,
                frameSize,
                style,
                uploadedImages: getCombinedUploadedImages(),
              },
            }),
          );

          handleGenerate(generationId, newPrompt); // Pass the new prompt explicitly if handleGenerate can take it
        }}
      />

      {!isInlineEditImagePage && (
        <InputBoxFixedPromptDock
          dispatch={dispatch}
          router={router}
          contentEditableRef={contentEditableRef}
          pluginsMenuRef={pluginsMenuRef}
          inputEl={inputEl}
          isUpdatingRef={isUpdatingRef}
          promptInputIdleTimeoutRef={promptInputIdleTimeoutRef}
          prompt={prompt}
          selectedCharacters={selectedCharacters}
          isInputBoxHovered={isInputBoxHovered}
          setIsInputBoxHovered={setIsInputBoxHovered}
          isPluginsMenuOpen={isPluginsMenuOpen}
          setIsPluginsMenuOpen={setIsPluginsMenuOpen}
          isAssistantOpen={isAssistantOpen}
          setIsAssistantOpen={setIsAssistantOpen}
          setIsCharacterModalOpen={setIsCharacterModalOpen}
          setIsUploadOpen={setIsUploadOpen}
          uploadedImages={uploadedImages}
          hasCustomStylePrompt={
            style === CUSTOM_STYLE_FROM_IMAGE_ID &&
            !!String(customStyleFromImage?.directive || "").trim()
          }
          onViewUploadedImage={(url, zeroBasedIndex) =>
            setAssetViewer({
              isOpen: true,
              assetUrl: url,
              assetType: "image",
              title: `Uploaded Image ${zeroBasedIndex + 1}`,
            })
          }
          selectedModel={selectedModel}
          isEnhancing={isEnhancing}
          userData={userData}
          runningGenerationsCount={runningGenerationsCount}
          expectedCredits={expectedCredits}
          planCode={planCode}
          credits={credits}
          imageCount={imageCount}
          frameSize={frameSize}
          style={style}
          gptImage2CustomWidth={gptImage2CustomWidth}
          setGptImage2CustomWidth={setGptImage2CustomWidth}
          gptImage2CustomHeight={gptImage2CustomHeight}
          setGptImage2CustomHeight={setGptImage2CustomHeight}
          nanoBananaProResolution={nanoBananaProResolution}
          setNanoBananaProResolution={setNanoBananaProResolution}
          outputFormat={outputFormat}
          nanoSupportedOutputFormats={nanoSupportedOutputFormats}
          nanoBananaProResolutionCredits={nanoBananaProResolutionCredits}
          nanoBananaResolution={nanoBananaResolution}
          nanoBanana2ResolutionCredits={nanoBanana2ResolutionCredits}
          flux2ProResolution={flux2ProResolution}
          setFlux2ProResolution={setFlux2ProResolution}
          qwenResolution={qwenResolution}
          setQwenResolution={setQwenResolution}
          seedream45Resolution={seedream45Resolution}
          setSeedream45Resolution={setSeedream45Resolution}
          seedream45ResolutionCredits={seedream45ResolutionCredits}
          seedreamSize={seedreamSize}
          setSeedreamSize={setSeedreamSize}
          seedreamWidth={seedreamWidth}
          setSeedreamWidth={setSeedreamWidth}
          seedreamHeight={seedreamHeight}
          setSeedreamHeight={setSeedreamHeight}
          seedream5LiteResolution={seedream5LiteResolution}
          setSeedream5LiteResolution={setSeedream5LiteResolution}
          seedream5LiteResolutionCredits={seedream5LiteResolutionCredits}
          zTurboOutputFormat={zTurboOutputFormat}
          setZTurboOutputFormat={setZTurboOutputFormat}
          gptImage15Quality={gptImage15Quality}
          setGptImage15Quality={setGptImage15Quality}
          updateContentEditable={updateContentEditable}
          handleEnhancePrompt={handleEnhancePrompt}
          handleGenerate={handleGenerate}
          getCombinedUploadedImages={getCombinedUploadedImages}
        />
      )}
      <InputBoxLayerModals
        preview={preview}
        onClosePreview={() => setPreview(null)}
        assetViewer={assetViewer}
        onCloseAssetViewer={() =>
          setAssetViewer((prev) => ({ ...prev, isOpen: false }))
        }
        isUpscaleOpen={isUpscaleOpen}
        onCloseUpscale={() => setIsUpscaleOpen(false)}
        isRemoveBgOpen={isRemoveBgOpen}
        onCloseRemoveBg={() => setIsRemoveBgOpen(false)}
        isInlineEditImagePage={isInlineEditImagePage}
        isEditOpen={isEditOpen}
        onCloseEdit={() => setIsEditOpen(false)}
        onEditUpscale={() => setIsUpscaleOpen(true)}
        onEditRemoveBg={() => setIsRemoveBgOpen(true)}
        isUploadOpen={isUploadOpen}
        onCloseUpload={() => setIsUploadOpen(false)}
        uploadRemainingSlots={Math.max(
          0,
          getInputImageLimitForModel(selectedModel) -
            (uploadedImages?.length || 0),
        )}
        onUploadAdd={(urls: string[]) => {
          try {
            const sanitizedUrls = (urls || []).filter((url) =>
              isSupportedUploadedImageSource(url),
            );
            if (sanitizedUrls.length !== (urls || []).length) {
              toast.error("Only image files are allowed.");
            }
            const next = [...(uploadedImages || []), ...sanitizedUrls];
            dispatch(
              setUploadedImages(
                next.slice(0, getInputImageLimitForModel(selectedModel)),
              ),
            );
          } catch {}
        }}
        isCharacterModalOpen={isCharacterModalOpen}
        onCloseCharacter={() => setIsCharacterModalOpen(false)}
        onCharacterAdd={(character) => {
          try {
            dispatch(addSelectedCharacter(character));
          } catch {}
        }}
        onCharacterRemove={(characterId: string) => {
          try {
            dispatch(removeSelectedCharacter(characterId));
          } catch {}
        }}
        selectedCharacters={selectedCharacters}
        isGuideModalOpen={isGuideModalOpen}
        onCloseGuide={() => setIsGuideModalOpen(false)}
        uploadedImages={uploadedImages}
        refreshAllHistory={refreshAllHistory}
      />
    </>
  );
};

export default InputBox;