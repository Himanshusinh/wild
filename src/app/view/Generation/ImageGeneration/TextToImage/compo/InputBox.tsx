"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { ChevronUp, Trash2, Edit3 } from 'lucide-react';
// HistoryEntry import follows below
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
// RemoveBgPopup and EditPopup are now lazy loaded below

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
} from "@/store/slices/generationSlice";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import { runwayGenerate, runwayStatus, bflGenerate, falGenerate, replicateGenerate } from "@/store/slices/generationsApi";
import { toggleDropdown, addNotification, setCurrentGenerationType } from "@/store/slices/uiSlice";
import {
  loadMoreHistory,
  removeHistoryEntry,
  loadHistory,
  addHistoryEntry,
  updateHistoryEntry,
  setFilters,
  clearHistory,
} from "@/store/slices/historySlice";
import useHistoryLoader from '@/hooks/useHistoryLoader';
import axiosInstance, { getApiClient } from "@/lib/axiosInstance";
import { qlog, qwarn, qerr } from '@/lib/queueDebug';
import toast from 'react-hot-toast';
import { enhancePromptAPI } from '@/lib/api/geminiApi';
// History sync helpers (backend supports PATCH /api/generations/:historyId)
const updateFirebaseHistory = async (id: string | undefined, updates: any) => {
  if (!id) return;
  try {
    await axiosInstance.patch(`/api/generations/${encodeURIComponent(id)}`, updates);
  } catch {
    // best-effort; UI will refresh from backend anyway
  }
};
// Backend no longer exposes POST /api/generations from the web app; providers create history records themselves.
const saveHistoryEntry = async (_entry: any): Promise<string | undefined> => undefined;
// Note: addHistoryEntry and updateHistoryEntry are now imported from historySlice

// Import the new components
import ModelsDropdown from "./ModelsDropdown";
import ImageCountDropdown from "./ImageCountDropdown";
import FrameSizeDropdown from "./FrameSizeDropdown";
import StyleSelector from "./StyleSelector";
import LucidOriginOptions from "./LucidOriginOptions";
import PhoenixOptions from "./PhoenixOptions";
import FileTypeDropdown from "./FileTypeDropdown";
import ResolutionDropdown from "./ResolutionDropdown";
import ZTurboOutputFormatDropdown from "./ZTurboOutputFormatDropdown";
import QualityDropdown from "./QualityDropdown";
import ImageGenerationGuide from "./ImageGenerationGuide";
// Lazy load heavy modal components for better initial load performance
import dynamic from 'next/dynamic';
const ImagePreviewModal = dynamic(() => import("./ImagePreviewModal"), { ssr: false });
import AssetViewerModal from '@/components/AssetViewerModal';
const UpscalePopup = dynamic(() => import("./UpscalePopup"), { ssr: false });
const RemoveBgPopup = dynamic(() => import("./RemoveBgPopup"), { ssr: false });
const EditPopup = dynamic(() => import("./EditPopup"), { ssr: false });
const UploadModal = dynamic(() => import("./UploadModal"), { ssr: false });
const CharacterModal = dynamic(() => import("./CharacterModal"), { ssr: false });
import type { Character } from "./CharacterModal";
import { waitForRunwayCompletion } from "@/lib/runwayService";
import { uploadGeneratedImage } from "@/lib/imageUpload";
import { getIsPublic } from '@/lib/publicFlag';
import { useGenerationCredits } from "@/hooks/useCredits";
import { getImageGenerationCreditCost, formatCredits } from '@/utils/creditValidation';
import Image from "next/image";
import LoadingSpinner from '@/components/LoadingSpinner';
import { toResourceProxy, toZataPath, toDirectUrl } from '@/lib/thumb';
// Replaced per-page IntersectionObserver with unified bottom scroll pagination
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import InfiniteScrollDebugOverlay, { IOEvent } from '@/components/debug/InfiniteScrollDebugOverlay';
import HistoryControls from '@/app/view/Generation/VideoGeneration/TextToVideo/compo/HistoryControls';

const GifLoader: React.FC<{ size?: number; alt?: string; className?: string }> = ({ size = 64, alt = 'Loading', className }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center ${className || ''}`}
        style={{ width: size, height: size }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Image
      src="/styles/Logo.gif"
      alt={alt}
      width={size}
      height={size}
      className={className || 'mx-auto'}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
};

const InputBox = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    image: any;
  } | null>(null);
  const [assetViewer, setAssetViewer] = useState<{
    isOpen: boolean;
    assetUrl: string;
    assetType: 'image' | 'video' | 'audio';
    title: string;
  }>({
    isOpen: false,
    assetUrl: '',
    assetType: 'image',
    title: 'Uploaded Asset'
  });
  const [isUpscaleOpen, setIsUpscaleOpen] = useState(false);
  const [isRemoveBgOpen, setIsRemoveBgOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const inputEl = useRef<HTMLTextAreaElement>(null);
  // Local, ephemeral entry to mimic history-style preview while generating
  const [localGeneratingEntries, setLocalGeneratingEntries] = useState<HistoryEntry[]>([]);
  // Show loader when switching back into image tab until history is ready
  const [showSwitchLoader, setShowSwitchLoader] = useState(false);
  const switchLoadInFlightRef = useRef(false);

  // Parallel-safe helpers: keep one local card per generation, without wiping other in-flight jobs.
  const upsertLocalGeneratingEntry = useCallback((entry: HistoryEntry) => {
    const id = String((entry as any)?.id || (entry as any)?.firebaseHistoryId || '');
    if (!id) return;
    qlog('Upserting local generating entry', { id, status: (entry as any)?.status });
    setLocalGeneratingEntries((prev) => {
      const filtered = prev.filter((e: any) => {
        const eId = String(e?.id || '');
        const eFirebaseId = String((e as any)?.firebaseHistoryId || '');
        return eId !== id && eFirebaseId !== id;
      });
      return [entry, ...filtered].slice(0, 4);
    });
  }, []);

  const removeLocalGeneratingEntry = useCallback((idOrIds?: string | string[]) => {
    const ids = (Array.isArray(idOrIds) ? idOrIds : [idOrIds]).filter(Boolean).map(String);
    if (ids.length === 0) return;
    qlog('Removing local generating entries', { ids });
    setLocalGeneratingEntries((prev) =>
      prev.filter((e: any) => {
        const eId = String(e?.id || '');
        const eFirebaseId = String((e as any)?.firebaseHistoryId || '');
        return !ids.includes(eId) && !ids.includes(eFirebaseId);
      })
    );
  }, []);

  // Local state setter kept for backward compatibility (parallel generation uses Redux `activeGenerations`)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setIsGeneratingLocally] = useState(false);

  // Track which images have loaded to hide shimmer effect
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  // Local state to track prompt enhancement (loading skeleton)
  const [isEnhancing, setIsEnhancing] = useState(false);
  // Track if we've already shown a Runway base_resp toast to avoid duplicates
  const runwayBaseRespToastShownRef = useRef(false);
  const loadLockRef = useRef(false);

  // Redux selector for parallel generation support
  const activeGenerations = useAppSelector(state => state.generation.activeGenerations);
  // Ensure active generations have startedAt set promptly so watchdog & persistence work
  useEffect(() => {
    activeGenerations.forEach((g: any) => {
      if ((g.status === 'pending' || g.status === 'generating') && !g.startedAt) {
        dispatch(updateActiveGeneration({ id: g.id, updates: { startedAt: Date.now() } }));
      }
    });
  }, [activeGenerations, dispatch]);

  // Filter out video generations - only count image generations towards the limit (limit is 4)
  // This allows completed/failed items to be auto-replaced by new ones
  const normalizeGenType = (t?: string) => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');
  const imageOnlyActiveGenerations = activeGenerations.filter(gen => {
    const genType = (gen as any).generationType || (gen as any).params?.generationType;
    const normalizedType = normalizeGenType(genType);
    const isVideoType = normalizedType === 'text-to-video' ||
      normalizedType === 'image-to-video' ||
      normalizedType === 'video-to-video';
    return !isVideoType;
  });
  const runningGenerationsCount = imageOnlyActiveGenerations.filter(g => g.status === 'pending' || g.status === 'generating').length;

  // Filter states for search, sort, and date
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [dateInput, setDateInput] = useState<string>("");
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isInputBoxHovered, setIsInputBoxHovered] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const calendarDaysInMonth = useMemo(() => new Date(calendarYear, calendarMonth + 1, 0).getDate(), [calendarYear, calendarMonth]);
  const calendarFirstWeekday = useMemo(() => new Date(calendarYear, calendarMonth, 1).getDay(), [calendarYear, calendarMonth]);

  // Handle calendar click outside
  useEffect(() => {
    if (!showCalendar) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (calendarRef.current && !calendarRef.current.contains(t)) setShowCalendar(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCalendar(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [showCalendar]);

  // Handle search query changes with loading state
  useEffect(() => {
    // Show loading when filtering/searching/sorting
    if (searchQuery.trim() || dateRange.start) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsFiltering(false);
    }
  }, [searchQuery, dateRange]);

  // Track sort order changes separately to show loader
  const [isSorting, setIsSorting] = useState(false);
  const prevSortOrderRef = useRef<'desc' | 'asc' | null>(null);
  useEffect(() => {
    if (prevSortOrderRef.current !== null && prevSortOrderRef.current !== sortOrder) {
      setIsSorting(true);
      const timer = setTimeout(() => {
        setIsSorting(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    prevSortOrderRef.current = sortOrder;
  }, [sortOrder]);

  const refreshHistoryFromBackend = useCallback(async (next?: { sortOrder?: 'asc' | 'desc'; dateRange?: { start: Date | null; end: Date | null } }) => {
    const order = next?.sortOrder || sortOrder;
    const dr = next?.dateRange || dateRange;

    // Update local UI state if caller provided overrides
    if (next?.sortOrder) setSortOrder(next.sortOrder);
    if (next?.dateRange) setDateRange(next.dateRange);

    setPage(1);

    const filters: any = { mode: 'image', sortOrder: order };
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    if (dr.start && dr.end) filters.dateRange = { start: dr.start.toISOString(), end: dr.end.toISOString() };
    dispatch(setFilters(filters));

    await (dispatch as any)(loadHistory({
      filters,
      backendFilters: { mode: 'image', sortOrder: order, ...(dr.start && dr.end ? { dateRange: { start: dr.start.toISOString(), end: dr.end.toISOString() } } : {}) } as any,
      paginationParams: { limit: 60 },
      requestOrigin: 'page',
      expectedType: 'text-to-image',
      skipBackendGenerationFilter: true,
      forceRefresh: true,
    }));
  }, [dispatch, searchQuery, sortOrder, dateRange]);

  // Backend is the source of truth for sorting/pagination. When sort changes, clear UI and re-fetch from backend.
  const onSortChange = useCallback(async (order: 'asc' | 'desc') => {
    await refreshHistoryFromBackend({ sortOrder: order });
  }, [refreshHistoryFromBackend]);

  // Track entries that have been added to history to prevent duplicate rendering
  // This ref is updated immediately when entries are added, before React re-renders
  const historyEntryIdsRef = useRef<Set<string>>(new Set());

  // Get current entries from Redux (will be updated on each render)
  const existingEntries = useAppSelector((state: any) => state.history?.entries || []);

  // Note: localGeneratingEntries was originally single-entry; with parallel generation enabled
  // the queue rendering relies on Redux `activeGenerations` instead for per-job placeholders.

  // Prefill uploaded image and prompt from query params (?image=, ?prompt=, ?sp=, ?model=, ?frame=, ?style=)
  useEffect(() => {
    try {
      const current = new URL(window.location.href);
      // Support multiple uploads: allow repeated ?sp= and ?image= params
      const spAll = current.searchParams.getAll('sp');
      const imgAll = current.searchParams.getAll('image');
      const img = current.searchParams.get('image'); // legacy single param
      const sp = current.searchParams.get('sp');     // legacy single param
      const prm = current.searchParams.get('prompt');
      const mdl = current.searchParams.get('model');
      const frm = current.searchParams.get('frame');
      const sty = current.searchParams.get('style');
      const remixNonce = current.searchParams.get('remixNonce');

      // Handle image upload - prioritize sp (storage path) over image URL.
      // Collect all URLs from sp/image params so multiple uploads are supported.
      const collectedUrls: string[] = [];

      const allSp = spAll.length ? spAll : (sp ? [sp] : []);
      const allImg = imgAll.length ? imgAll : (img ? [img] : []);

      allSp.forEach((spVal) => {
        if (!spVal) return;
        const decodedPath = decodeURIComponent(spVal).replace(/^\/+/, '');
        const directUrl = toDirectUrl(decodedPath);
        if (directUrl) {
          collectedUrls.push(directUrl);
        }
      });

      if (!allSp.length) {
        allImg.forEach((imgVal) => {
          if (!imgVal) return;
          const imageUrl = imgVal.trim();
          if (imageUrl && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
            collectedUrls.push(imageUrl);
          }
        });
      }

      if (collectedUrls.length > 0) {
        // Cap to first 10 uploads to avoid overloading the UI
        dispatch(setUploadedImages(collectedUrls.slice(0, 10) as any));
      }

      if (prm) {
        dispatch(setPrompt(prm));
        // Force the visible contentEditable prompt editor to reflect the new prompt immediately.
        // This avoids cases where the editor is mid-update (isUpdatingRef=true) and would otherwise
        // ignore the prompt change, causing Remix to keep showing the old prompt.
        try {
          const el = document.querySelector('[data-prompt-editor="true"]') as HTMLElement | null;
          if (el) {
            el.textContent = prm;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 96) + 'px';
          }
        } catch { }
      }
      if (mdl) {
        const mapIncomingModel = (m: string): string => {
          if (!m) return m;
          // Normalize known backend → UI mappings
          if (m === 'bytedance/seedream-4') return 'seedream-v4';
          if (m === 'bytedance/seedream-4.5') return 'seedream-4.5';
          return m;
        };
        dispatch(setSelectedModel(mapIncomingModel(mdl)));
      }
      if (frm) {
        try { (dispatch as any)({ type: 'generation/setFrameSize', payload: frm }); } catch { }
      }
      if (sty) {
        try { (dispatch as any)({ type: 'generation/setStyle', payload: sty }); } catch { }
      }
      // Consume params once so a refresh doesn't keep re-applying Remix values.
      // IMPORTANT: Use Next router.replace (not window.history.replaceState) to avoid
      // desyncing Next.js searchParams, which can prevent subsequent Remix clicks from being detected.
      if (img || prm || sp || mdl || frm || sty || remixNonce || spAll.length || imgAll.length) {
        current.searchParams.delete('image');
        current.searchParams.delete('prompt');
        current.searchParams.delete('sp');
        current.searchParams.delete('remixNonce');
        // Also delete any repeated params
        imgAll.forEach(() => current.searchParams.delete('image'));
        spAll.forEach(() => current.searchParams.delete('sp'));
        current.searchParams.delete('model');
        current.searchParams.delete('frame');
        current.searchParams.delete('style');
        const next = current.pathname + (current.searchParams.toString() ? `?${current.searchParams.toString()}` : '');
        router.replace(next, { scroll: false });
      }
    } catch { }
  }, [dispatch, searchParams, pathname, router]);

  // Track if initial load has been attempted (to prevent guide flash on refresh)
  const hasAttemptedInitialLoadRef = useRef(false);

  // Unified initial load (single guarded request) via custom hook
  const { refresh: refreshHistoryDebounced, refreshImmediate: refreshHistoryImmediate } = useHistoryLoader({
    generationType: 'text-to-image',
    generationTypes: ['text-to-image', 'image-to-image'],
    initialLimit: 60,
    mode: 'image',
    skipBackendGenerationFilter: true,
    sortOrder,
  });

  // Ensure UI slice reflects we are on the image generation page (avoids expectedType gating issues)
  useEffect(() => {
    try { (dispatch as any)(setCurrentGenerationType('text-to-image' as any)); } catch { }
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
  const isBlobOrDataUrl = (u?: string) => !!u && (u.startsWith('blob:') || u.startsWith('data:'));

  // Helper function for frontend proxy resource URL
  // NOTE: For regenerate/remix flows we prefer direct Zata URLs instead of localhost paths,
  // so callers should usually pass storagePath via `sp` and only use this for in-app proxying.
  const toFrontendProxyResourceUrl = (urlOrPath: string | undefined): string => {
    if (!urlOrPath) return '';
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

      const qs = new URLSearchParams();

      const entryAny: any = entry as any;
      const inputImages: any[] = Array.isArray(entryAny?.inputImages) ? entryAny.inputImages : [];

      // Collect ALL user uploads (Your Upload images)
      const storagePaths: string[] = [];
      const directUrls: string[] = [];

      inputImages.forEach((img: any) => {
        try {
          let sp = img?.storagePath || '';
          if (!sp) {
            const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX || '').replace(/\/$/, '/');
            const original = img?.url || img?.originalUrl || '';
            if (original && original.startsWith(ZATA_PREFIX)) {
              sp = original.substring(ZATA_PREFIX.length);
            }
          }
          if (sp) {
            storagePaths.push(sp);
            return;
          }
          const rawUrl = img?.url || img?.originalUrl || '';
          if (rawUrl && !isBlobOrDataUrl(rawUrl)) {
            const direct = toDirectUrl(rawUrl);
            if (direct) directUrls.push(direct);
          }
        } catch { }
      });

      // Use userPrompt for remix if available, otherwise use cleanPrompt
      const cleanPrompt = getCleanPrompt(entry.prompt || '');
      const remixPrompt = (entry as any)?.userPrompt || cleanPrompt;
      if (remixPrompt) qs.set('prompt', remixPrompt);

      // Attach all uploads:
      // - Prefer storage paths via repeated sp= params
      // - Fallback direct URLs via repeated image= params
      storagePaths.forEach((spVal) => {
        if (spVal) qs.append('sp', spVal);
      });
      if (!storagePaths.length) {
        directUrls.forEach((u) => {
          if (u) qs.append('image', u);
        });
      }

      // Also pass model, frameSize and style for preselection
      if (entry.model) {
        // Map backend model ids to UI dropdown ids where needed
        const m = String(entry.model);
        const mapped = m === 'bytedance/seedream-4' ? 'seedream-v4' : (m === 'bytedance/seedream-4.5' ? 'seedream-4.5' : m);
        qs.set('model', mapped);
      }
      if (entry.frameSize) qs.set('frame', String(entry.frameSize));

      const sty = entry.style || extractStyleFromPrompt(entry.prompt || '') || '';
      if (sty && sty.toLowerCase() !== 'none') qs.set('style', String(sty));

      // Client-side navigation to avoid full page reload (and don't scroll to top)
      router.push(`/text-to-image?${qs.toString()}`, { scroll: false });
    } catch (error) {
      console.error('Error recreating image:', error);
    }
  };

  // Adjust natural language references like "image 4" -> "image 3" (zero-based)
  // Also, if combinedImages and selectedCharacters are provided, replace @Name mentions
  // with the corresponding image index (1-based) that will be sent in uploadedImages.
  const adjustPromptImageNumbers = (text: string, combinedImages?: string[], selectedCharacters?: any[]): string => {
    try {
      let t = String(text || '');

      // If we have combinedImages and selectedCharacters, replace @Name with image N (1-based)
      if (combinedImages && Array.isArray(combinedImages) && selectedCharacters && Array.isArray(selectedCharacters)) {
        const mentionRegex = /@([\w-]+)/g;
        let out = '';
        let lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = mentionRegex.exec(t))) {
          const matchIndex = m.index as number;
          const name = m[1];
          out += t.slice(lastIndex, matchIndex);
          // find matching character by name
          const char = selectedCharacters.find((c: any) => String(c.name).toLowerCase() === String(name).toLowerCase());
          if (char && char.frontImageUrl) {
            const url = String(char.frontImageUrl);
            const idx = combinedImages.findIndex((u: string) => String(u) === url);
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

  // Helper function to convert frameSize to Runway ratio format
  const convertFrameSizeToRunwayRatio = (frameSize: string): string => {
    const ratioMap: { [key: string]: string } = {
      "1:1": "1024:1024",
      "16:9": "1920:1080",
      "9:16": "1080:1920",
      "4:3": "1360:768",
      "3:4": "768:1360",
      "3:2": "1440:1080",
      "2:3": "1080:1440",
      "21:9": "1808:768",
      "9:21": "768:1808",
      "16:10": "1680:720",
      "10:16": "720:1680",
    };

    return ratioMap[frameSize] || "1024:1024"; // Default to square if no match
  };

  // Map Runway base_resp.status_code to toast message and severity; return whether to stop polling
  const mapRunwayStatus = (status: any): { shouldStop: boolean; toastType: 'success' | 'error' | 'loading' | 'blank'; message: string } | null => {
    try {
      const base = status && (status.base_resp || (status.data && status.data.base_resp));
      if (!base) return null;
      const code = typeof base.status_code === 'string' ? parseInt(base.status_code, 10) : Number(base.status_code);
      const msg = (base.status_msg as string) || 'Unknown status';
      if (Number.isNaN(code)) return null;
      if (code === 0) return { shouldStop: false, toastType: 'success', message: msg || 'Success' };
      // Non-zero → error/terminal conditions
      switch (code) {
        case 1002: return { shouldStop: true, toastType: 'error', message: 'Rate limited by Runway. Please try again shortly.' };
        case 1004:
        case 2049: return { shouldStop: true, toastType: 'error', message: 'Runway authentication failed. Check API key.' };
        case 1008: return { shouldStop: true, toastType: 'error', message: 'Runway balance insufficient. Please top up your plan.' };
        case 1026: return { shouldStop: true, toastType: 'error', message: 'Prompt blocked due to content safety.' };
        case 2013: return { shouldStop: true, toastType: 'error', message: 'Invalid parameters for Runway request.' };
        default: return { shouldStop: true, toastType: 'error', message: msg || `Runway error (${code}).` };
      }
    } catch { return null; }
  };

  // Runway model-specific allowed ratios (kept in sync with backend validator)
  const RUNWAY_RATIOS_GEN4 = new Set([
    "1920:1080", "1080:1920", "1024:1024", "1360:768", "1080:1080", "1168:880",
    "1440:1080", "1080:1440", "1808:768", "2112:912", "1280:720", "720:1280",
    "720:720", "960:720", "720:960", "1680:720"
  ]);
  const RUNWAY_RATIOS_GEMINI = new Set([
    "1344:768", "768:1344", "1024:1024", "1184:864", "864:1184", "1536:672"
  ]);

  const coerceRunwayRatio = (ratio: string, model: string): string => {
    // Ensure aspect in [0.5, 2] and membership in allowed set for model
    const [wStr, hStr] = ratio.split(":");
    const w = Number(wStr), h = Number(hStr);
    const aspectOk = w > 0 && h > 0 && w / h >= 0.5 && w / h <= 2;
    const allowed = model === "gemini_2.5_flash" ? RUNWAY_RATIOS_GEMINI : RUNWAY_RATIOS_GEN4;
    if (aspectOk && allowed.has(ratio)) return ratio;
    // Fallback to safe square
    return "1024:1024";
  };

  // Calculate dimensions for z-image-turbo based on frame size, keeping under 1MP and divisible by 16
  const convertFrameSizeToZTurboDimensions = (frameSize: string): { width: number; height: number } => {
    const MAX_PIXELS = 1000000; // 1MP = 1,000,000 pixels (under 1MP means < 1,000,000)
    const MIN_DIMENSION = 64;
    const MAX_DIMENSION = 1440;
    const MULTIPLE_OF = 16;

    // Parse aspect ratio from frameSize (e.g., "16:9" -> { widthRatio: 16, heightRatio: 9 })
    const parseAspectRatio = (ratio: string): { widthRatio: number; heightRatio: number } => {
      const parts = ratio.split(':');
      if (parts.length !== 2) return { widthRatio: 1, heightRatio: 1 };
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return { widthRatio: 1, heightRatio: 1 };
      return { widthRatio: w, heightRatio: h };
    };

    const { widthRatio, heightRatio } = parseAspectRatio(frameSize);
    const aspectRatio = widthRatio / heightRatio;

    // Calculate maximum dimensions that stay under 1MP
    // For landscape (width > height): start with max width, calculate height
    // For portrait (height > width): start with max height, calculate width
    // For square: use equal dimensions

    let width: number;
    let height: number;

    if (aspectRatio > 1) {
      // Landscape: width > height
      // Start with max width (1440), calculate height, then scale down if needed
      width = Math.min(1440, Math.floor(Math.sqrt(MAX_PIXELS * aspectRatio)));
      height = Math.round(width / aspectRatio);
    } else if (aspectRatio < 1) {
      // Portrait: height > width
      // Start with max height (1440), calculate width, then scale down if needed
      height = Math.min(1440, Math.floor(Math.sqrt(MAX_PIXELS / aspectRatio)));
      width = Math.round(height * aspectRatio);
    } else {
      // Square: 1:1
      width = Math.min(1440, Math.floor(Math.sqrt(MAX_PIXELS)));
      height = width;
    }

    // Round to nearest multiple of 16
    width = Math.round(width / MULTIPLE_OF) * MULTIPLE_OF;
    height = Math.round(height / MULTIPLE_OF) * MULTIPLE_OF;

    // Ensure we're still under 1MP after rounding
    while (width * height >= MAX_PIXELS) {
      if (aspectRatio > 1) {
        width -= MULTIPLE_OF;
        height = Math.round(width / aspectRatio / MULTIPLE_OF) * MULTIPLE_OF;
      } else if (aspectRatio < 1) {
        height -= MULTIPLE_OF;
        width = Math.round(height * aspectRatio / MULTIPLE_OF) * MULTIPLE_OF;
      } else {
        width -= MULTIPLE_OF;
        height = width;
      }
    }

    // Clamp to valid range (64-1440) and ensure divisible by 16
    const clampToLimits = (value: number): number => {
      const rounded = Math.round(value / MULTIPLE_OF) * MULTIPLE_OF;
      return Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, rounded));
    };

    width = clampToLimits(width);
    height = clampToLimits(height);

    // Final check: ensure we're still under 1MP after clamping
    if (width * height >= MAX_PIXELS) {
      // Scale down proportionally
      const scale = Math.sqrt(MAX_PIXELS / (width * height));
      width = Math.round((width * scale) / MULTIPLE_OF) * MULTIPLE_OF;
      height = Math.round((height * scale) / MULTIPLE_OF) * MULTIPLE_OF;
      width = Math.max(MIN_DIMENSION, width);
      height = Math.max(MIN_DIMENSION, height);
    }

    return { width, height };
  };

  // Helper function to convert frameSize to flux-pro-1.1 dimensions
  const convertFrameSizeToFluxProDimensions = (frameSize: string): { width: number; height: number } => {
    const dimensionMap: { [key: string]: { width: number; height: number } } = {
      "1:1": { width: 1024, height: 1024 },
      "16:9": { width: 1024, height: 576 }, // 1024 * (9/16) = 576
      "9:16": { width: 576, height: 1024 }, // 1024 * (16/9) = 576
      "4:3": { width: 1024, height: 768 }, // 1024 * (3/4) = 768
      "3:4": { width: 768, height: 1024 }, // 1024 * (4/3) = 768
      "3:2": { width: 1024, height: 672 }, // 1024 * (2/3) = 682, rounded to 672 (multiple of 32)
      "2:3": { width: 672, height: 1008 }, // 672 * (3/2) = 1008
      "21:9": { width: 1024, height: 438 }, // 1024 * (9/21) = 438, rounded to 448 (multiple of 32)
      "9:21": { width: 448, height: 1024 }, // 448 * (21/9) = 1024
      "16:10": { width: 1024, height: 640 }, // 1024 * (10/16) = 640
      "10:16": { width: 640, height: 1024 }, // 640 * (16/10) = 1024
    };

    // Ensure dimensions are within API limits and multiples of 32
    const dimensions = dimensionMap[frameSize] || { width: 1024, height: 1024 };

    // Clamp to API limits: 256 <= x <= 1440, must be multiple of 32
    const clampToLimits = (value: number): number => {
      const clamped = Math.max(256, Math.min(1440, Math.round(value / 32) * 32));
      console.log(`Dimension ${value} clamped to ${clamped} (multiple of 32, within 256-1440 range)`);
      return clamped;
    };

    const result = {
      width: clampToLimits(dimensions.width),
      height: clampToLimits(dimensions.height)
    };

    console.log(`Frame size ${frameSize} converted to dimensions:`, result);
    console.log(`API compliance check: width=${result.width} (${result.width % 32 === 0 ? '✓ multiple of 32' : '✗ not multiple of 32'}), height=${result.height} (${result.height % 32 === 0 ? '✓ multiple of 32' : '✗ not multiple of 32'})`);
    console.log(`Range check: width=${result.width} (${result.width >= 256 && result.width <= 1440 ? '✓ in range 256-1440' : '✗ out of range'}), height=${result.height} (${result.height >= 256 && result.height <= 1440 ? '✓ in range 256-1440' : '✗ out of range'})`);
    return result;
  };


  // Copy prompt to clipboard (used on hover overlay)
  const copyPrompt = async (e: React.MouseEvent, text: string) => {
    try {
      console.log("beti")
      e.stopPropagation();
      e.preventDefault();
      if (!text) return;
      await navigator.clipboard.writeText(text);
      (await import('react-hot-toast')).default.success('Prompt copied');
    } catch {
      try {
        (await import('react-hot-toast')).default.error('Failed to copy');
      } catch { }
    }
  };

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteImage = async (e: React.MouseEvent, entry: HistoryEntry, imageId?: string) => {
    try {
      e.stopPropagation();
      e.preventDefault();

      const isSingleImage = imageId && entry.images && entry.images.length > 0;
      const confirmMessage = isSingleImage
        ? 'Delete this image permanently? This cannot be undone.'
        : 'Delete this generation permanently? This cannot be undone.';

      if (!window.confirm(confirmMessage)) return;

      const response = await axiosInstance.delete(`/api/generations/${entry.id}`, {
        params: imageId ? { imageId } : undefined
      });

      const updatedItem = response.data?.data?.item;

      if (updatedItem && !updatedItem.isDeleted) {
        // Partial deletion - update entry with new images
        dispatch(updateHistoryEntry({ id: entry.id, updates: { images: updatedItem.images } as any }));
        toast.success('Image deleted');
      } else {
        // Full deletion
        try { dispatch(removeHistoryEntry(entry.id)); } catch { }
        toast.success('Generation deleted');
      }

      // Clear/reset document title when image/generation is deleted
      if (typeof document !== 'undefined') {
        document.title = 'WildMind';
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete generation');
    }
  };

  // Normalize frontend proxy URLs to absolute public URLs for provider APIs
  const toAbsoluteFromProxy = (url: string): string => {
    try {
      if (!url) return url;
      if (url.startsWith('data:')) return url;
      const ZATA_PREFIX = 'https://idr01.zata.ai/devstoragev1/';
      const RESOURCE_SEG = '/api/proxy/resource/';
      if (url.startsWith(RESOURCE_SEG)) {
        const decoded = decodeURIComponent(url.substring(RESOURCE_SEG.length));
        return `${ZATA_PREFIX}${decoded}`;
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const u = new URL(url);
        if (u.pathname.startsWith(RESOURCE_SEG)) {
          const decoded = decodeURIComponent(u.pathname.substring(RESOURCE_SEG.length));
          return `${ZATA_PREFIX}${decoded}`;
        }
      }
      return url;
    } catch { return url; }
  };

  // Fetch only first page on mount; further pages load on scroll
  // Replace legacy refresh helpers with hook-driven variants (wrapped with cooldown guard)
  // IMPORTANT: Use backend-filter-aware refresh to avoid overwriting date-filtered views.
  const rawRefreshHistory = () => { void refreshHistoryFromBackend(); };
  const refreshAllHistory = () => { void refreshHistoryFromBackend(); };
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
          const linked = activeGenerations.find((g: any) => String(g?.id || '') === String(historyId));
          const fallbackId = linked && (linked as any)?.historyId ? String((linked as any).historyId) : '';
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
        console.warn('[refreshSingleGeneration] Generation not found, falling back to full refresh');
        refreshHistory();
        return;
      }

      // Normalize the item to match HistoryEntry format
      const created = item?.createdAt || item?.updatedAt || item?.timestamp;
      const iso = typeof created === 'string' ? created : (created && created.toString ? created.toString() : new Date().toISOString());
      const normalizedEntry: HistoryEntry = {
        ...item,
        id: item.id || resolvedId || historyId,
        timestamp: iso,
        createdAt: iso,
      } as HistoryEntry;

      // Find an existing entry by any known identifier to avoid duplicates.
      const idsToMatch = Array.from(
        new Set(
          [historyId, resolvedId, normalizedEntry.id, (normalizedEntry as any)?.firebaseHistoryId]
            .filter(Boolean)
            .map((x) => String(x))
        )
      );
      const existing = existingEntries.find((e: any) => {
        const eId = String(e?.id || '');
        const eFirebaseId = String((e as any)?.firebaseHistoryId || '');
        return idsToMatch.includes(eId) || (eFirebaseId && idsToMatch.includes(eFirebaseId));
      }) as any;

      // CRITICAL: Track this entry ID in ref IMMEDIATELY before adding to Redux
      // This ensures we can check it in the same render cycle
      qlog('[DEBUG refreshSingleGeneration] Tracking entry IDs:', {
        historyId,
        normalizedEntryId: normalizedEntry.id,
        firebaseHistoryId: (normalizedEntry as any)?.firebaseHistoryId,
        currentRefSize: historyEntryIdsRef.current.size,
        currentRefContents: Array.from(historyEntryIdsRef.current)
      });

      historyEntryIdsRef.current.add(historyId);
      if (resolvedId) historyEntryIdsRef.current.add(resolvedId);
      if (normalizedEntry.id) historyEntryIdsRef.current.add(normalizedEntry.id);
      if ((normalizedEntry as any)?.firebaseHistoryId) {
        historyEntryIdsRef.current.add((normalizedEntry as any).firebaseHistoryId);
      }

      qlog('[DEBUG refreshSingleGeneration] After adding to ref:', {
        newRefSize: historyEntryIdsRef.current.size,
        newRefContents: Array.from(historyEntryIdsRef.current)
      });

      if (existing) {
        // Update existing entry - only update changed fields to avoid overwriting
        qlog('[DEBUG refreshSingleGeneration] Updating existing entry:', existing.id);
        const extraUpdates: any = {};
        if (Array.isArray((normalizedEntry as any)?.inputImages)) extraUpdates.inputImages = (normalizedEntry as any).inputImages;
        dispatch(updateHistoryEntry({
          id: existing.id,
          updates: {
            status: normalizedEntry.status,
            images: normalizedEntry.images,
            imageCount: normalizedEntry.imageCount,
            timestamp: normalizedEntry.timestamp,
            ...extraUpdates,
          }
        }));
        qlog('[refreshSingleGeneration] Updated existing generation:', existing.id);
      } else {
        // Add new entry at the beginning
        qlog('[DEBUG refreshSingleGeneration] Adding new entry to Redux:', {
          historyId: resolvedId || historyId,
          entryId: normalizedEntry.id,
          firebaseHistoryId: (normalizedEntry as any)?.firebaseHistoryId,
          status: normalizedEntry.status,
          imageCount: normalizedEntry.images?.length || 0,
          params: (normalizedEntry as any)?.params || {}
        });
        dispatch(addHistoryEntry(normalizedEntry));
        qlog('[refreshSingleGeneration] Added new generation:', resolvedId || historyId);

        // Attempt to correlate newly added history with any active generation that has a matching provider requestId
        try {
          const candidateReqIds = new Set<string>();
          const pushIf = (v: any) => { if (v) candidateReqIds.add(String(v)); };
          const ne = normalizedEntry as any;
          pushIf(ne?.params?.requestId);
          pushIf(ne?.requestId);
          pushIf(ne?.request_id);
          pushIf(ne?.idempotencyKey);
          pushIf(ne?.providerRequestId);
          pushIf((ne?.provider || {})?.requestId);

          if (candidateReqIds.size > 0) {
            activeGenerations.forEach((g: any) => {
              const gReq = String((g?.params || {})?.requestId || '');
              if (!gReq) return;
              if (candidateReqIds.has(gReq)) {
                console.log('[queue] Correlating active generation by requestId', { generationId: g.id, historyId: normalizedEntry.id, requestId: gReq });
                // Attach canonical historyId to the active generation so future syncs match by id
                dispatch(updateActiveGeneration({ id: g.id, updates: { historyId: normalizedEntry.id } }));
                // Also remove local preview entries associated with this generation
                removeLocalGeneratingEntry([g.id, normalizedEntry.id]);
              }
            });
          }

          // If we didn't find a requestId-based match, try a safe prompt+timestamp correlation
          try {
            const nePrompt = String((normalizedEntry as any)?.prompt || '').replace(/\s*\[Style:.*?\]\s*$/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
            const neModel = String((normalizedEntry as any)?.model || '');
            const createdRaw = (normalizedEntry as any)?.createdAt || (normalizedEntry as any)?.timestamp || (normalizedEntry as any)?.updatedAt;
            const neTime = typeof createdRaw === 'number' ? createdRaw : Date.parse(String(createdRaw || '')) || Date.now();
            const MAX_TIME_DIFF = 120000; // 2 minutes

            activeGenerations.forEach((g: any) => {
              try {
                const gPrompt = String(g?.prompt || '').replace(/\s*\[Style:.*?\]\s*$/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
                const gModel = String(g?.model || '');
                const gTimeRaw = g?.startedAt || g?.createdAt || 0;
                const gTime = typeof gTimeRaw === 'number' ? gTimeRaw : Date.parse(String(gTimeRaw || '')) || 0;
                const timeDiff = Math.abs(neTime - gTime);
                const promptMatch = gPrompt && nePrompt && (gPrompt === nePrompt || gPrompt.startsWith(nePrompt) || nePrompt.startsWith(gPrompt));
                const modelMatch = gModel && neModel && gModel === neModel;

                if ((promptMatch && timeDiff < MAX_TIME_DIFF) || (promptMatch && modelMatch && timeDiff < MAX_TIME_DIFF)) {
                  console.log('[queue] Correlating active generation by prompt+time', { generationId: g.id, historyId: normalizedEntry.id, promptMatch: gPrompt.slice(0, 50), timeDiff });
                  dispatch(updateActiveGeneration({ id: g.id, updates: { historyId: normalizedEntry.id } }));
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
          qerr('Failed to correlate new history entry with active generations by requestId:', e);
        }
      }

      // Clear any local preview entries that match this generation.
      removeLocalGeneratingEntry(idsToMatch);
    } catch (error) {
      qerr('[refreshSingleGeneration] Failed to fetch single generation, falling back to full refresh:', error);
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
        dispatch(updateActiveGeneration({ id, updates: { startedAt: Date.now() } }));
      }
    };
    ensureStartedAt(generationId);

    const { generationId: _gid, tempEntryId, model, prompt, requestId, startedAt = Date.now(), timeoutMs = 120000 } = opts;
    const api = axiosInstance;
    const normalize = (s = '') => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const target = normalize((prompt || '').slice(0, 100));
    const deadline = Date.now() + timeoutMs;
    let attempt = 0;

    qlog('Starting pollForMatchingHistory', { generationId: _gid, tempEntryId, model, requestId, startedAt, timeoutMs });

    while (Date.now() < deadline) {
      attempt++;
      try {
        const res = await api.get('/api/generations', { params: { limit: 30, sortBy: 'createdAt', mode: 'image' }, timeout: 10000 });
        const items: any[] = res.data?.data?.items || res.data?.items || [];
        qlog('pollForMatchingHistory: fetched items', { attempt, itemsFound: items.length });

        // Try to find exact historyId match first (if requestId looks like a history id)
        for (const it of items) {
          if (!it) continue;
          // If requestId shows up anywhere in the raw item, treat as match
          const raw = JSON.stringify(it || '');
          if (requestId && String(raw || '').includes(String(requestId))) {
            qlog('pollForMatchingHistory: matched via requestId in item', { matchedId: it.id, requestId });
            await refreshSingleGeneration(it.id);
            if (generationId) dispatch(updateActiveGeneration({ id: generationId, updates: { historyId: it.id } }));
            return it.id;
          }
        }

        // Otherwise, attempt fuzzy prompt + timestamp match
        for (const it of items) {
          try {
            if (!it || !it.prompt) continue;
            const p = normalize((it.prompt || '').slice(0, 100));
            const t = Date.parse(String(it.createdAt || it.timestamp || it.updatedAt || 0)) || 0;
            const age = Math.abs(t - (startedAt || Date.now()));
            // Accept matches created within +/- 90s and with prompt substring match
            if (target && p.includes(target) && age < 90000) {
              qlog('pollForMatchingHistory: fuzzy matched item', { matchedId: it.id, promptMatch: p.slice(0, 100), age });
              await refreshSingleGeneration(it.id);
              if (generationId) dispatch(updateActiveGeneration({ id: generationId, updates: { historyId: it.id } }));
              return it.id;
            }
          } catch (e) { /* continue */ }
        }
      } catch (err: any) {
        qwarn('pollForMatchingHistory: fetch failed', { attempt, err: err?.message || err });
      }

      // Backoff: 1s -> 2s -> 3s -> 4s up to 5s
      const delay = Math.min(5000, 500 + attempt * 500);
      await new Promise(res => setTimeout(res, delay));
    }

    qwarn('pollForMatchingHistory: timeout, no matching history found', { generationId, tempEntryId, model, requestId });
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
    (state: any) => state.generation?.selectedModel || "flux-dev"
  );
  const imageCount = useAppSelector(
    (state: any) => state.generation?.imageCount || 1
  );
  const frameSize = useAppSelector(
    (state: any) => state.generation?.frameSize || "1:1"
  );
  const style = useAppSelector(
    (state: any) => state.generation?.style || "realistic"
  );
  // Lucid Origin and Phoenix 1.0 options
  const lucidStyle = useAppSelector((state: any) => state.generation?.lucidStyle || 'none');
  const lucidContrast = useAppSelector((state: any) => state.generation?.lucidContrast || 'medium');
  const lucidMode = useAppSelector((state: any) => state.generation?.lucidMode || 'standard');
  const lucidPromptEnhance = useAppSelector((state: any) => state.generation?.lucidPromptEnhance || false);
  const phoenixStyle = useAppSelector((state: any) => state.generation?.phoenixStyle || 'none');
  const phoenixContrast = useAppSelector((state: any) => state.generation?.phoenixContrast || 'medium');
  const phoenixMode = useAppSelector((state: any) => state.generation?.phoenixMode || 'fast');
  const phoenixPromptEnhance = useAppSelector((state: any) => state.generation?.phoenixPromptEnhance || false);
  const outputFormat = useAppSelector((state: any) => state.generation?.outputFormat || 'jpeg');
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector(
    (state: any) => state.ui?.activeDropdown
  );
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore || false);
  const [page, setPage] = useState(1);

  const currentFilters = useAppSelector((state: any) => state.history?.filters || {});

  // Get current UI generation type to detect feature switches
  const currentUIGenerationType = useAppSelector((s: any) => s.ui?.currentGenerationType || 'text-to-image');
  const lastUIGenerationTypeRef = useRef<string>(currentUIGenerationType);

  // Memoize the filtered entries and group by date - optimized for performance
  const historyEntries = useAppSelector(
    (state: any) => {
      const allEntries = state.history?.entries || [];

      if (allEntries.length === 0) {
        return [];
      }

      const normalize = (t?: string) => (t ? String(t).replace(/[_-]/g, '-').toLowerCase() : '');

      const filtered = allEntries.filter((entry: any) => {
        const normalizedType = normalize(entry.generationType);
        const normalizedModel = normalize(entry.model);
        const isSeedream = normalizedModel.includes('seedream');
        const isTextToImage = normalizedType === 'text-to-image';
        const isImageToImage = normalizedType === 'image-to-image';

        // Explicitly exclude video types - video entries should NOT appear in image generation
        const isVideoType = normalizedType === 'text-to-video' ||
          normalizedType === 'image-to-video' ||
          normalizedType === 'video-to-video';

        if (isVideoType) {
          return false;
        }

        // Also check if entry has video URLs (fallback check for entries that might not have correct generationType)
        const isVideoUrl = (url: string | undefined): boolean => {
          return !!url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
        };
        const hasVideoInImages = Array.isArray(entry.images) && entry.images.some((m: any) => isVideoUrl(m?.firebaseUrl || m?.url));
        const hasVideoInVideos = entry.videos && Array.isArray(entry.videos) && entry.videos.some((v: any) => isVideoUrl(v?.firebaseUrl || v?.url || v?.originalUrl));
        if (hasVideoInImages || hasVideoInVideos) {
          return false;
        }

        // Explicitly show Seedream text-to-image generations (from Image Generation page)
        if (isSeedream && isTextToImage) {
          return true;
        }

        // Hide Seedream generations from other features (e.g. Edit Image, upscale, etc.)
        if (isSeedream && !isTextToImage) {
          return false;
        }

        // For non-Seedream entries, apply normal type filtering
        const isVectorize =
          normalizedType === 'vectorize' ||
          normalizedType === 'image-vectorize' ||
          normalizedType.includes('vector');

        return (
          normalizedType === 'text-to-image' ||
          isImageToImage ||
          normalizedType === 'image-upscale' ||
          normalizedType === 'image-to-svg' ||
          normalizedType === 'image-edit' ||
          isVectorize
        );
      });

      if (filtered.length === 0) {
        return [];
      }

      const getTs = (x: any) => {
        const raw = x?.updatedAt || x?.createdAt || x?.timestamp;
        if (!raw) return 0;
        const t = typeof raw === 'string' ? raw : (raw?.toString?.() || '');
        const ms = Date.parse(t);
        return Number.isNaN(ms) ? 0 : ms;
      };

      return filtered.slice().sort((a: any, b: any) => getTs(b) - getTs(a));
    },
    shallowEqual
  );

  // When returning from another feature (e.g., video), reset filters and reload image history
  useEffect(() => {
    const norm = (t?: string) => (t || '').replace(/[_-]/g, '-').toLowerCase();
    const normalizedCurrent = norm(currentUIGenerationType === 'image-to-image' ? 'text-to-image' : currentUIGenerationType);
    const normalizedLast = norm(lastUIGenerationTypeRef.current === 'image-to-image' ? 'text-to-image' : lastUIGenerationTypeRef.current);
    const isImagePage = normalizedCurrent === 'text-to-image';
    const switchedToImage = isImagePage && normalizedLast !== normalizedCurrent;
    const currentFilterMode = (currentFilters as any)?.mode;
    const currentFilterSort = (currentFilters as any)?.sortOrder;
    const filtersAreForImage = !currentFilterMode || currentFilterMode === 'image';
    const sortMismatch = currentFilterSort && currentFilterSort !== sortOrder;
    const hasEntries = historyEntries && historyEntries.length > 0;

    // HistoryControls dispatches `setFilters` + `loadHistory` on sort changes.
    // During that in-flight window, Redux sortOrder updates before this component's local
    // `sortOrder` state, causing a transient mismatch and an extra duplicate request.
    // Fix: if we're already on the image page and filters are for image, just sync local
    // sort state and let HistoryControls own the request.
    if (!switchedToImage && filtersAreForImage && sortMismatch) {
      setSortOrder(currentFilterSort);
      lastUIGenerationTypeRef.current = currentUIGenerationType;
      return;
    }

    const shouldReload = (switchedToImage || !filtersAreForImage) && !switchLoadInFlightRef.current;

    if (shouldReload && !loading) {
      // Avoid redundant reloads when we already have fresh entries and filters are correct
      if (switchedToImage && filtersAreForImage && !sortMismatch && hasEntries) {
        lastUIGenerationTypeRef.current = currentUIGenerationType;
        return;
      }

      switchLoadInFlightRef.current = true;
      setShowSwitchLoader(true);

      setPage(1);
      const filters: any = { mode: 'image', sortOrder };
      if (searchQuery.trim()) filters.search = searchQuery.trim();
      if (dateRange.start && dateRange.end) filters.dateRange = { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() };

      dispatch(setFilters(filters));
      (dispatch as any)(loadHistory({
        filters,
        backendFilters: { ...filters } as any,
        paginationParams: { limit: 60 },
        requestOrigin: 'page',
        expectedType: 'text-to-image',
        skipBackendGenerationFilter: true,
        forceRefresh: true,
      } as any)).finally(() => {
        switchLoadInFlightRef.current = false;
        setShowSwitchLoader(false);
      });
    }

    lastUIGenerationTypeRef.current = currentUIGenerationType;
  }, [currentUIGenerationType, currentFilters, sortOrder, dateRange, searchQuery, dispatch, loading, historyEntries]);
  // Track previously loaded entries to animate new ones
  // This ref persists across renders and is updated AFTER render, so we can check against previous render's entries
  const previousEntriesRef = useRef<Set<string>>(new Set<string>());

  // Hide loader when fresh entries arrive
  useEffect(() => {
    if (!loading && historyEntries.length > 0) {
      setShowSwitchLoader(false);
    }
  }, [loading, historyEntries.length]);

  // Seedream-specific UI state
  const [seedreamSize, setSeedreamSize] = useState<'1K' | '2K' | '4K' | 'custom'>('2K');
  const [seedreamWidth, setSeedreamWidth] = useState<number>(2048);
  const [seedreamHeight, setSeedreamHeight] = useState<number>(2048);
  // Seedream 4.5-specific UI state (FAL image_size auto_2K/auto_4K)
  const [seedream45Resolution, setSeedream45Resolution] = useState<'2K' | '4K'>('2K');
  const [nanoBananaProResolution, setNanoBananaProResolution] = useState<'1K' | '2K' | '4K'>('2K');
  const [flux2ProResolution, setFlux2ProResolution] = useState<'1K' | '2K'>('1K');
  const [zTurboOutputFormat, setZTurboOutputFormat] = useState<'png' | 'jpg' | 'webp'>('jpg');
  const [gptImage15Quality, setGptImage15Quality] = useState<'low' | 'medium' | 'high' | 'auto'>('low');
  const [gptImage15OutputFormat, setGptImage15OutputFormat] = useState<'png' | 'jpg' | 'webp'>('jpg');
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null); // retained for optional debug overlay
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false); // legacy reference (no longer used by IO, kept for compatibility)
  // Block pagination while generation finishes & initial history refresh occurs
  const postGenerationBlockRef = useRef(false);
  // Debug event storage removed; bottom scroll pagination doesn't emit IO events

  // Keep the queue panel (activeGenerations) in sync with the real history list.
  // If a generation completes/fails and is visible in the grid, update the queue item immediately
  // (and fill in images) so loader cards don't get stuck and slots free up.
  // OPTIMIZED: Debounced to prevent excessive runs on every Redux update
  useEffect(() => {
    if (!activeGenerations || activeGenerations.length === 0) {
      console.log('[queue] Sync: No active generations to sync');
      return;
    }
    if (!historyEntries || historyEntries.length === 0) {
      console.log('[queue] Sync: No history entries loaded yet, waiting...');
      return;
    }

    // OPTIMIZED: Early exit if no in-progress generations need syncing
    const hasInProgress = activeGenerations.some((gen: any) => {
      const status = String(gen?.status || '').toLowerCase();
      return status === 'pending' || status === 'generating';
    });
    if (!hasInProgress) {
      // Only sync if we have completed/failed items that need cleanup
      const hasCompleted = activeGenerations.some((gen: any) => {
        const status = String(gen?.status || '').toLowerCase();
        return status === 'completed' || status === 'failed';
      });
      if (!hasCompleted) {
        return; // Nothing to sync
      }
    }

    // OPTIMIZED: Debounce sync to avoid running on every Redux update
    const timeoutId = setTimeout(() => {
      console.log('[queue] Sync: Running with', activeGenerations.length, 'active generations and', historyEntries.length, 'history entries');

      // Build a quick lookup of history items by id (including firebaseHistoryId for matching)
      const historyMap = new Map<string, any>();
      historyEntries.forEach((e: any) => {
        const id = String(e?.id || '');
        const fbId = String((e as any)?.firebaseHistoryId || '');
        if (id) historyMap.set(id, e);
        if (fbId) historyMap.set(fbId, e);
      });

      activeGenerations.forEach((gen: any) => {
        const genId = String(gen?.id || '');
        const backendId = String(gen?.historyId || '');
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
          const genTime = typeof gen.createdAt === 'number' ? gen.createdAt : new Date(gen.createdAt).getTime();
          const now = Date.now();
          const ageInSeconds = (now - genTime) / 1000;

          // Only use fallback if generation already has historyId OR is very recent (within 10 seconds)
          // This prevents matching brand new generations to old completed ones
          const shouldUseFallback = backendId || ageInSeconds < 10;

          if (shouldUseFallback && !isNaN(genTime)) {
            console.log('[queue] No ID match found, trying prompt+timestamp fallback for:', {
              genId,
              prompt: gen.prompt.slice(0, 30),
              genCreatedAt: gen.createdAt,
              hasHistoryId: !!backendId,
              ageInSeconds: ageInSeconds.toFixed(1)
            });

            // Use a much smaller time window for fallback matching (30 seconds)
            // This is only for refresh scenarios, not for matching new generations to old ones
            const TIME_WINDOW = 30000; // 30 second window (only for refresh scenarios)

            // OPTIMIZED: Pre-normalize prompt once instead of in loop
            const normalizePrompt = (p: string) => {
              return String(p || '')
                .replace(/\s*\[Style:.*?\]\s*$/i, '') // Remove [Style: ...] suffix
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim()
                .toLowerCase();
            };
            const genPromptNormalized = normalizePrompt(gen.prompt);
            const genModel = String(gen.model || '');

            // OPTIMIZED: Filter by time window first to reduce iterations
            const recentEntries = historyEntries.filter((e: any) => {
              const eTimeRaw = e.timestamp || e.createdAt || e.created_at;
              const eTime = typeof eTimeRaw === 'number' ? eTimeRaw : new Date(eTimeRaw).getTime();
              if (isNaN(eTime)) return false;
              return Math.abs(genTime - eTime) < TIME_WINDOW;
            });

            // OPTIMIZED: Only search through recent entries (much smaller set)
            match = recentEntries.find((e: any) => {
              const eTimeRaw = e.timestamp || e.createdAt || e.created_at;
              const eTime = typeof eTimeRaw === 'number' ? eTimeRaw : new Date(eTimeRaw).getTime();
              const timeDiff = Math.abs(genTime - eTime);

              const ePromptNormalized = normalizePrompt(e.prompt);

              // Check if prompts match (exact or one contains the other for truncation cases)
              const promptMatch = genPromptNormalized === ePromptNormalized ||
                genPromptNormalized.startsWith(ePromptNormalized) ||
                ePromptNormalized.startsWith(genPromptNormalized);

              const modelMatch = String(e.model || '') === genModel;

              // Only log close matches (within time window)
              if (timeDiff < TIME_WINDOW) {
                console.log('[queue] Comparing with history entry:', {
                  historyId: e.id,
                  timeDiff,
                  promptMatch,
                  modelMatch,
                  genPrompt: genPromptNormalized.slice(0, 50),
                  historyPrompt: ePromptNormalized.slice(0, 50)
                });
              }

              return promptMatch && modelMatch;
            });

            if (match) {
              console.log('[queue] ✅ Matched by prompt+timestamp fallback:', { genId, historyId: match.id, prompt: gen.prompt.slice(0, 30) });
              // Update the active generation with the found historyId for future syncs
              dispatch(updateActiveGeneration({
                id: genId,
                updates: { historyId: match.id }
              }));
            } else {
              console.log('[queue] ❌ No match found via fallback for:', genId);
            }
          } else {
            console.log('[queue] Skipping fallback matching for new generation:', {
              genId,
              hasHistoryId: !!backendId,
              ageInSeconds: ageInSeconds.toFixed(1),
              reason: !backendId && ageInSeconds >= 10 ? 'too old for fallback' : 'other'
            });
          }
        }

        console.log('[queue] Sync check for generation:', { genId, backendId, hasMatch: !!match, matchStatus: match?.status });

        if (!match) return;

        const status = String(match?.status || '').toLowerCase();
        if (status !== 'completed' && status !== 'failed') return;

        // If queue item is still "pending/generating" or is missing media, bring it up to date.
        const queueStatus = String(gen?.status || '').toLowerCase();
        const hasImages = Array.isArray(gen?.images) && gen.images.length > 0;
        const hasVideos = Array.isArray(gen?.videos) && gen.videos.length > 0;
        const hasAudios = Array.isArray(gen?.audios) && gen.audios.length > 0;
        const historyImages = Array.isArray(match?.images) ? match.images : [];
        const historyVideos = Array.isArray(match?.videos) ? match.videos : [];
        const historyAudios = Array.isArray(match?.audios) ? match.audios : [];

        // Update if status changed or if we have new media (images/videos/audio)
        const needsUpdate = queueStatus !== status ||
          (!hasImages && historyImages.length > 0) ||
          (!hasVideos && historyVideos.length > 0) ||
          (!hasAudios && historyAudios.length > 0);

        if (needsUpdate) {
          const mediaCount = historyImages.length + historyVideos.length + historyAudios.length;
          console.log('[queue] Updating active generation:', { genId, oldStatus: queueStatus, newStatus: status, mediaCount });
          dispatch(updateActiveGeneration({
            id: genId,
            updates: {
              status: status as any,
              images: historyImages.length > 0 ? historyImages : gen.images,
              videos: historyVideos.length > 0 ? historyVideos : gen.videos,
              audios: historyAudios.length > 0 ? historyAudios : gen.audios,
              error: match?.error || gen?.error,
              historyId: backendId || match?.id || gen?.historyId,
            }
          }));
        }

        // Clear any local preview for this generation once the history item is final.
        removeLocalGeneratingEntry([genId, backendId, String(match?.id || '')].filter(Boolean) as any);

        // IMPORTANT: Don't remove from queue here - let useQueueManagement hook handle it
        // The hook will:
        // - Show success toast and remove after 5 seconds for completed
        // - Show error (already shown by error handlers) and remove after 3 seconds for failed
        console.log('[queue] Generation status synced, queue management hook will handle removal:', { genId, status });
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
        const status = String(gen?.status || '').toLowerCase();
        const backendId = String(gen?.historyId || '');
        return (status === 'pending' || status === 'generating') && backendId;
      });

      // If we have in-progress generations with historyIds, do a single batch history refresh
      // instead of individual API calls (avoids 429 rate limits)
      if (inProgressGens.length > 0) {
        console.log('[queue] Refreshing history to check', inProgressGens.length, 'in-progress generations');
        try {
          await dispatch(loadHistory({
            paginationParams: { limit: 20 },
            forceRefresh: true,
            debugTag: 'queue-check'
          })).unwrap();
        } catch (err) {
          console.log('[queue] History refresh failed:', err);
        }
      }
    };

    // OPTIMIZED: Increased from 10s to 30s to reduce API calls and improve performance
    // This still provides timely updates while significantly reducing server load
    const interval = setInterval(checkGenerations, 30000);
    // Only run immediately if we have in-progress generations
    const hasInProgress = activeGenerations.some((gen: any) => {
      const status = String(gen?.status || '').toLowerCase();
      return status === 'pending' || status === 'generating';
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
        const prompt = (entry.prompt || '').toLowerCase();
        return prompt.includes(query);
      });
    }

    return filtered;
  }, [historyEntries, searchQuery]);

  // Mark that we've attempted initial load once loading starts or completes
  useEffect(() => {
    if (loading || historyEntries.length > 0) {
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
    Object.keys(groups).forEach(date => {
      if (sortOrder === 'asc') {
        groups[date].sort((a: HistoryEntry, b: HistoryEntry) => getTs(a) - getTs(b)); // Oldest first
      } else {
        groups[date].sort((a: HistoryEntry, b: HistoryEntry) => getTs(b) - getTs(a)); // Newest first
      }
    });

    // NEW: Merge active generations from Redux (persistent parallel generations)
    // NOTE: The grid UI renders `entry.images.map(...)`. For in-flight jobs, we must provide
    // placeholder images so each concurrent generation shows its own loading tiles.
    if (imageOnlyActiveGenerations.length > 0) {
      // Use the already-filtered image-only generations
      const imageActiveGenerations = imageOnlyActiveGenerations;

      imageActiveGenerations.forEach(gen => {
        // Keep placeholder ids stable: always render under the client generation id ("gen-...").
        // Use gen.historyId only for de-dupe when the real history entry arrives.
        const displayId = String(gen.id);
        const backendId = String((gen as any)?.historyId || '');
        const idsToMatch = [displayId, backendId].filter(Boolean);

        // If backend history already contains the *final* entry (completed/failed), prefer history and skip placeholder.
        const historyAlreadyHasFinal = filteredAndSortedEntries.some((e: any) => {
          const eId = String(e?.id || '');
          if (!idsToMatch.includes(eId)) return false;
          return e?.status === 'completed' || e?.status === 'failed';
        });
        if (historyAlreadyHasFinal) return;

        const genDate = new Date(gen.createdAt);
        const genDateKey = genDate.toDateString();

        if (!groups[genDateKey]) {
          groups[genDateKey] = [];
        }

        const existsInGroup = groups[genDateKey].some((e: HistoryEntry) => {
          const eId = String((e as any)?.id || '');
          const eFirebaseId = String((e as any)?.firebaseHistoryId || '');
          return idsToMatch.includes(eId) || (eFirebaseId && idsToMatch.includes(eFirebaseId));
        });

        if (!existsInGroup) {
          const count = Math.max(1, Number(gen.params?.imageCount || 1));
          const placeholderImages = Array.from({ length: count }, (_, idx) => ({
            id: `placeholder-${gen.id}-${idx}`,
            url: '',
            originalUrl: '',
            thumbnailUrl: '',
            avifUrl: '',
          }));

          const placeholder: HistoryEntry = {
            id: String(displayId),
            status: gen.status === 'pending' ? 'generating' : gen.status,
            prompt: gen.prompt,
            model: gen.model,
            generationType: 'text-to-image' as any,
            timestamp: genDate.toISOString(),
            createdAt: genDate.toISOString(),
            // If we have real images, use them; otherwise, use placeholders so the loader tiles render.
            images: (Array.isArray(gen.images) && gen.images.length > 0) ? (gen.images as any) : (placeholderImages as any),
            imageCount: count,
            frameSize: gen.params?.frameSize,
            style: gen.params?.style,
            isPublic: gen.params?.isPublic,
            // Store the backend historyId if available for later matching
            ...(gen.historyId ? { firebaseHistoryId: gen.historyId } : {}),
          } as any;

          if (sortOrder === 'desc') groups[genDateKey].unshift(placeholder);
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
    if (sortOrder === 'asc') {
      return datesArray.sort((a: string, b: string) =>
        new Date(a).getTime() - new Date(b).getTime() // Oldest first
      );
    } else {
      return datesArray.sort((a: string, b: string) =>
        new Date(b).getTime() - new Date(a).getTime() // Newest first
      );
    }
  }, [groupedByDate, sortOrder]);

  // Track previous entries for animation - update AFTER render completes
  // This ensures that during render, previousEntriesRef still contains entries from the PREVIOUS render
  useEffect(() => {
    const currentEntryIds = new Set<string>(filteredAndSortedEntries.map((e: HistoryEntry) => e.id));
    // Also include active generation placeholders so they don't re-animate every render.
    activeGenerations.forEach((g: any) => {
      const id = String(g?.id || '');
      const hid = String(g?.historyId || '');
      if (id) currentEntryIds.add(id);
      if (hid) currentEntryIds.add(hid);
    });

    // Update ref AFTER render completes (for next render cycle comparison)
    previousEntriesRef.current = currentEntryIds;
  }, [filteredAndSortedEntries, activeGenerations]);

  // Memoize date formatter to avoid recreating on every render
  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);
  const uploadedImages = useAppSelector(
    (state: any) => state.generation?.uploadedImages || []
  );
  const selectedCharacters = useAppSelector(
    (state: any) => state.generation?.selectedCharacters || []
  );

  // ContentEditable approach for inline character tags (like Cursor)
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Function to update contentEditable with tags
  const updateContentEditable = React.useCallback(() => {
    if (!contentEditableRef.current || isUpdatingRef.current) return;

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
    div.innerHTML = '';

    // If no prompt and no characters, leave empty
    if (!prompt && selectedCharacters.length === 0) {
      isUpdatingRef.current = false;
      return;
    }

    // Parse prompt and create nodes
    let parts: Array<{ type: 'text' | 'tag'; content: string; character?: any }> = [];
    let lastIndex = 0;

    // Find all @references in the prompt
    const refMatches = Array.from(prompt.matchAll(/@(\w+)/gi)) as RegExpMatchArray[];

    refMatches.forEach((match) => {
      const matchIndex = match.index!;
      const refName = match[1];
      const character = selectedCharacters.find((char: any) =>
        char.name.toLowerCase() === refName.toLowerCase()
      );

      if (character && matchIndex >= lastIndex) {
        // Add text before reference
        if (matchIndex > lastIndex) {
          const textBefore = prompt.substring(lastIndex, matchIndex);
          if (textBefore) {
            parts.push({ type: 'text', content: textBefore });
          }
        }
        // Add reference tag
        parts.push({ type: 'tag', content: match[0], character });
        lastIndex = matchIndex + match[0].length;
      }
    });

    // Add remaining text
    if (lastIndex < prompt.length) {
      const textAfter = prompt.substring(lastIndex);
      if (textAfter) {
        parts.push({ type: 'text', content: textAfter });
      }
    }

    // If no parts and we have text, add it as text
    if (parts.length === 0 && prompt) {
      parts.push({ type: 'text', content: prompt });
    }

    // If there are selected characters but no explicit @tags in the prompt,
    // prepend the selected characters as visible tags so users always see
    // the attached characters in the contentEditable area (like Freepik).
    // This lets users type anywhere while the tags remain present.
    const hasTagParts = parts.some(p => p.type === 'tag');
    if (selectedCharacters && selectedCharacters.length > 0 && !hasTagParts) {
      const leadingTags = selectedCharacters.map((char: any) => ({ type: 'tag' as const, content: `@${char.name}`, character: char }));
      parts = [...leadingTags, ...parts];
    }

    // Build DOM nodes
    parts.forEach((part) => {
      if (part.type === 'tag' && part.character) {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'character-tag group relative inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 rounded text-blue-300 text-sm font-medium hover:bg-blue-500/30 transition-colors mx-0.5';
        tagSpan.contentEditable = 'false';
        tagSpan.style.display = 'inline-flex';
        tagSpan.style.verticalAlign = 'baseline';
        tagSpan.setAttribute('data-character-id', part.character.id);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `@${part.character.name}`;
        tagSpan.appendChild(nameSpan);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-blue-200 hover:text-white';
        removeBtn.type = 'button';
        removeBtn.contentEditable = 'false';
        removeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
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
          null
        );

        let currentPos = 0;
        let node;
        while (node = walker.nextNode()) {
          const nodeLength = node.textContent?.length || 0;
          if (currentPos + nodeLength >= cursorOffset) {
            const newRange = document.createRange();
            newRange.setStart(node, Math.min(cursorOffset - currentPos, nodeLength));
            newRange.setEnd(node, Math.min(cursorOffset - currentPos, nodeLength));
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
    div.style.height = 'auto';
    div.style.height = Math.min(div.scrollHeight, 96) + 'px';

    setTimeout(() => { isUpdatingRef.current = false; }, 50);
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
    if (!url.includes('_thumb.avif') && !url.endsWith('.avif')) {
      return url;
    }

    // Replace _thumb.avif with .jpg (default, backend should handle if it's actually png)
    // Also handle cases where the URL ends with .avif
    let converted = url.replace('_thumb.avif', '.jpg');
    if (converted.endsWith('.avif')) {
      converted = converted.replace(/\.avif$/, '.jpg');
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
      if (image.originalUrl && !image.originalUrl.includes('_thumb.avif') && !image.originalUrl.endsWith('.avif')) {
        return image.originalUrl;
      }
      if (image.url && !image.url.includes('_thumb.avif') && !image.url.endsWith('.avif')) {
        return image.url;
      }
      if (image.firebaseUrl && !image.firebaseUrl.includes('_thumb.avif') && !image.firebaseUrl.endsWith('.avif')) {
        return image.firebaseUrl;
      }
      // If we have storagePath, try to construct original URL
      if (image.storagePath && !image.storagePath.includes('_thumb.avif')) {
        // Remove _thumb.avif or .avif extension and try common extensions
        let basePath = image.storagePath.replace(/_thumb\.avif$/, '').replace(/\.avif$/, '');
        // Try to get original extension from storagePath or default to .jpg
        const zataBase = (process.env.NEXT_PUBLIC_ZATA_PREFIX || '').replace(/\/$/, '/');
        // Check if storagePath already has an extension
        if (!basePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
          basePath += '.jpg'; // Default to jpg
        }
        return `${zataBase}${basePath}`;
      }
    }

    // Priority order: original URL > firebase URL > frontImageUrl (converted if AVIF)
    // Check if character has original URL fields (from the entry structure)
    const originalUrl = char.url || char.originalUrl;
    if (originalUrl && !originalUrl.includes('_thumb.avif') && !originalUrl.endsWith('.avif')) {
      return originalUrl;
    }

    const firebaseUrl = char.firebaseUrl;
    if (firebaseUrl && !firebaseUrl.includes('_thumb.avif') && !firebaseUrl.endsWith('.avif')) {
      return firebaseUrl;
    }

    // If frontImageUrl is AVIF, try to convert it to original format
    if (char.frontImageUrl) {
      const frontUrl = String(char.frontImageUrl);
      // If it's already a non-AVIF URL, use it directly
      if (!frontUrl.includes('_thumb.avif') && !frontUrl.endsWith('.avif')) {
        return frontUrl;
      }
      // Try to convert AVIF to original format
      // Remove _thumb.avif or .avif and replace with .jpg
      let converted = frontUrl.replace(/_thumb\.avif$/, '').replace(/\.avif$/, '');
      // If it doesn't have an extension now, add .jpg
      if (!converted.match(/\.(jpg|jpeg|png|webp)$/i)) {
        converted += '.jpg';
      } else {
        // If it has an extension, ensure it's not .avif
        converted = converted.replace(/\.avif$/i, '.jpg');
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
        const char = (selectedCharacters || []).find((c: any) => String(c.name).toLowerCase() === name.toLowerCase());
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
      } catch { /* ignore */ }
    });

    return result;
  };

  const expectedCredits = useMemo(() => {
    try {
      const resolution = selectedModel === 'google/nano-banana-pro'
        ? nanoBananaProResolution
        : (selectedModel === 'flux-2-pro' ? flux2ProResolution : undefined);
      return getImageGenerationCreditCost(selectedModel, imageCount, frameSize, style, resolution, getCombinedUploadedImages());
    } catch {
      return 0;
    }
  }, [
    selectedModel,
    imageCount,
    frameSize,
    style,
    nanoBananaProResolution,
    flux2ProResolution,
    prompt,
    uploadedImages,
    selectedCharacters,
  ]);

  // Function to remove character reference (removes from selectedCharacters)
  const removeCharacterReference = (characterName: string) => {
    // Remove the character from selectedCharacters and clean up any @mentions
    try {
      const character = (selectedCharacters || []).find((char: any) => String(char.name).toLowerCase() === String(characterName).toLowerCase());
      if (character) {
        dispatch(removeSelectedCharacter(character.id));
      }

      // Helper to escape special chars for regex
      const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');

      // Remove any @characterName occurrences from the prompt (case-insensitive)
      // Be liberal in matching so we also remove trailing punctuation like commas/periods
      const nameEsc = escapeRegExp(String(characterName));
      // Match @Name followed by optional non-word punctuation (e.g. @Name, @Name.) or end of string
      const regex = new RegExp(`@${nameEsc}(?:[^\\w]|$)`, 'gi');
      if (prompt && regex.test(prompt)) {
        const newPrompt = prompt.replace(regex, ' ').trim().replace(/\s+/g, ' ');
        dispatch(setPrompt(newPrompt));
      }

      // Also remove any leftover plain-text @mentions inside the contentEditable DOM
      // (This handles cases where the DOM contains a text node like "@Name" that didn't come from prompt)
      setTimeout(() => {
        try {
          const div = contentEditableRef.current;
          if (div) {
            const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
            const nodesToRemove: Node[] = [];
            const nodesToTrim: { node: Text; value: string }[] = [];
            let node: Node | null = walker.nextNode();
            while (node) {
              // If element is a character-tag with matching data-character-id, remove it
              if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.classList && el.classList.contains('character-tag')) {
                  const dataId = el.getAttribute('data-character-id');
                  if (character && dataId && String(dataId) === String(character.id)) {
                    nodesToRemove.push(el);
                  }
                }
              }

              // If it's a text node containing the literal @name, trim/remove it
              if (node.nodeType === Node.TEXT_NODE) {
                const txt = node.nodeValue || '';
                // Liberal match inside text nodes (handle trailing punctuation)
                const re = new RegExp(`@${nameEsc}(?:[^\\w]|$)`, 'i');
                if (re.test(txt)) {
                  // If the text node is mostly the mention, remove it entirely
                  if (txt.trim().toLowerCase().replace(/[^\w@]/g, '') === `@${String(characterName).toLowerCase().replace(/[^\w]/g, '')}`) {
                    nodesToRemove.push(node);
                  } else {
                    // Otherwise remove just the mention substring
                    const newVal = txt.replace(re, ' ').replace(/\s+/g, ' ');
                    nodesToTrim.push({ node: node as Text, value: newVal });
                  }
                }
              }

              node = walker.nextNode();
            }

            nodesToRemove.forEach(n => n.parentNode?.removeChild(n));
            nodesToTrim.forEach(t => t.node.nodeValue = t.value);

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
    clearCreditsError,
  } = useGenerationCredits('image', selectedModel, {
    frameSize,
    count: imageCount,
    style,
    resolution: selectedModel === 'google/nano-banana-pro' ? nanoBananaProResolution : (selectedModel === 'flux-2-pro' ? flux2ProResolution : undefined),
    quality: selectedModel === 'openai/gpt-image-1.5' ? gptImage15Quality : undefined
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
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
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
    enabled: historyEntries.length > 0 && sortedDates.length > 0,
    loadMore: async () => {
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        // Use currentFilters from Redux to get the latest values (sync with HistoryControls)
        // This ensures consistency with search, sort, and date filters managed by HistoryControls
        const currentSortOrder = (currentFilters as any)?.sortOrder || sortOrder || 'desc';
        const currentSearch = (currentFilters as any)?.search || searchQuery?.trim() || '';
        const currentDateRange = (currentFilters as any)?.dateRange || (dateRange.start && dateRange.end ? { start: dateRange.start.toISOString(), end: dateRange.end.toISOString() } : null);

        const paginationFilters: any = { mode: 'image', sortOrder: currentSortOrder };
        if (currentSearch) paginationFilters.search = currentSearch;
        if (currentDateRange?.start && currentDateRange?.end) {
          paginationFilters.dateRange = {
            start: typeof currentDateRange.start === 'string' ? currentDateRange.start : new Date(currentDateRange.start).toISOString(),
            end: typeof currentDateRange.end === 'string' ? currentDateRange.end : new Date(currentDateRange.end).toISOString()
          };
        }

        const backendFilters: any = {
          mode: 'image',
          sortOrder: currentSortOrder,
          ...(currentSearch ? { search: currentSearch } : {}),
          ...(currentDateRange?.start && currentDateRange?.end ? {
            dateRange: {
              start: typeof currentDateRange.start === 'string' ? currentDateRange.start : new Date(currentDateRange.start).toISOString(),
              end: typeof currentDateRange.end === 'string' ? currentDateRange.end : new Date(currentDateRange.end).toISOString()
            }
          } : {})
        };

        await (dispatch as any)(loadMoreHistory({
          filters: paginationFilters,
          backendFilters: backendFilters,
          paginationParams: { limit: 50 } // Increased to 50 for better pagination coverage
        })).unwrap();
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
  });

  // IntersectionObserver removed; relying solely on bottom scroll pagination above.

  // Removed legacy proactive loaders (scroll proximity, viewport deficiency, auto-fill loop)
  // to prevent uncontrolled pagination bursts. IntersectionObserver above is now the sole
  // trigger for pagination, honoring user scroll intent and existing hasMore/loading guards.
  // If future UX requires prefetch, implement a lightweight, single-fire prefetch with strict
  // cooldown and visibility metrics rather than looping effects.

  // Helper function to handle FAL errors with structured error messages
  const handleFalError = async (error: any, context: { generationId?: string; tempEntryId: string; tempEntry?: HistoryEntry; transactionId?: string; modelName?: string }) => {
    const { extractFalErrorDetails, showFalErrorToast } = await import('@/lib/falToast');
    const errorDetails = extractFalErrorDetails(error);

    // Get user-friendly error message
    const errorMessage = errorDetails?.message ||
      (typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : undefined) ||
      'Failed to generate images';

    // Update loading entry to show failed state
    try {
      const baseEntry = context.tempEntry || {
        id: context.tempEntryId,
        prompt: '',
        model: '',
        generationType: 'text-to-image' as const,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 0,
        status: 'generating' as const,
      };
      const failedEntry: HistoryEntry = {
        ...baseEntry,
        id: context.tempEntryId,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      } as any;
      upsertLocalGeneratingEntry(failedEntry);

      if (context.generationId) {
        dispatch(updateActiveGeneration({
          id: context.generationId,
          updates: {
            status: 'failed',
            error: errorMessage,
          }
        }));
      }
    } catch { }

    // Stop generation process
    setIsGeneratingLocally(false);
    postGenerationBlockRef.current = false;

    // Handle credit failure
    if (context.transactionId) {
      await handleGenerationFailure(context.transactionId);
    }

    // Show structured error toast with user-friendly message
    await showFalErrorToast(error, errorMessage);

    // Clear failed entry after a delay to allow user to see the error
    setTimeout(() => {
      removeLocalGeneratingEntry(context.generationId || context.tempEntryId);
    }, errorDetails?.retryable ? 5000 : 3000);
  };

  // Helper function to handle Replicate errors with structured error messages
  const handleReplicateError = async (error: any, context: { generationId?: string; tempEntryId: string; tempEntry?: HistoryEntry; transactionId?: string; modelName?: string }) => {
    const { extractReplicateErrorDetails, showReplicateErrorToast } = await import('@/lib/replicateToast');
    const errorDetails = extractReplicateErrorDetails(error);

    // Get user-friendly error message
    const errorMessage = errorDetails?.message ||
      (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : undefined) ||
      'Failed to generate images';

    // Update loading entry to show failed state
    try {
      const baseEntry = context.tempEntry || {
        id: context.tempEntryId,
        prompt: '',
        model: '',
        generationType: 'text-to-image' as const,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 0,
        status: 'generating' as const,
      };
      const failedEntry: HistoryEntry = {
        ...baseEntry,
        id: context.tempEntryId,
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      } as any;
      upsertLocalGeneratingEntry(failedEntry);

      if (context.generationId) {
        dispatch(updateActiveGeneration({
          id: context.generationId,
          updates: {
            status: 'failed',
            error: errorMessage,
          }
        }));
      }
    } catch { }

    // Stop generation process
    setIsGeneratingLocally(false);
    postGenerationBlockRef.current = false;

    // Handle credit failure
    if (context.transactionId) {
      await handleGenerationFailure(context.transactionId);
    }

    // Show structured error toast with user-friendly message
    await showReplicateErrorToast(error, errorMessage);

    // Clear failed entry after a delay to allow user to see the error
    setTimeout(() => {
      removeLocalGeneratingEntry(context.generationId || context.tempEntryId);
    }, errorDetails?.retryable ? 5000 : 3000);
  };

  const handleGenerate = async (generationId?: string) => {
    if (!prompt.trim()) return;


    // CRITICAL: Set loading state IMMEDIATELY at the start, before any async operations
    // This ensures the loader shows instantly when the button is clicked
    setIsGeneratingLocally(true);

    // Engage pagination block; prevents scroll-triggered load bursts while generation runs & history updates
    postGenerationBlockRef.current = true;

    const originalPrompt = prompt;
    let finalPrompt = originalPrompt;

    // If prompt-enhance toggles are enabled for the selected model(s), call the backend enhancer first
    if ((lucidPromptEnhance || phoenixPromptEnhance) && !isEnhancing) {
      try {
        setIsEnhancing(true);
        // Explicitly pass 'image' as media type for image generation
        const res = await enhancePromptAPI(originalPrompt, 'openai/gpt-4o', 'image');
        if (res && res.ok && res.enhancedPrompt) {
          finalPrompt = res.enhancedPrompt;

          // Update Redux state - this will trigger the useEffect that calls updateContentEditable
          dispatch(setPrompt(finalPrompt));

          // Immediately update the contentEditable element for instant visual feedback
          // This bypasses any Redux state propagation delays
          const el = contentEditableRef.current as HTMLElement | null;
          if (el) {
            // Set text content directly for immediate update
            el.textContent = finalPrompt;

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
        } else {
          // Non-fatal: show an error but continue with original prompt
          if (res && res.error) toast.error(res.error || 'Failed to enhance prompt');
        }
      } catch (e: any) {
        console.error('Prompt enhancement failed:', e);
        toast.error(e?.message || 'Prompt enhancement failed. Using original prompt.');
      } finally {
        setIsEnhancing(false);
      }
    }

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
    } catch (creditError: any) {
      toast.error(creditError.message || 'Insufficient credits for generation');
      setIsGeneratingLocally(false);
      // Don't wipe other in-flight jobs; only remove this generation's local entry if present
      if (generationId) removeLocalGeneratingEntry(generationId);
      postGenerationBlockRef.current = false;

      // If we have a generation ID, marks it as failed so it doesn't get stuck in the queue
      if (generationId) {
        dispatch(updateActiveGeneration({
          id: generationId,
          updates: {
            status: 'failed',
            error: creditError.message || 'Insufficient credits'
          }
        }));
      }
      return;
    }

    // Create a local history-style loading entry.
    // Prefer the stable per-generation id (gen-...) when provided so UI updates land on the right card.
    const tempEntryId = generationId || `loading-${Date.now()}`;
    const tempEntry: HistoryEntry = {
      id: tempEntryId,
      prompt: finalPrompt,
      model: selectedModel,
      generationType: 'text-to-image',
      frameSize: frameSize || undefined,
      aspect_ratio: frameSize || undefined,
      images: Array.from({ length: imageCount }, (_, index) => ({
        id: `loading-${index}`,
        url: '',
        originalUrl: ''
      })),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageCount: imageCount,
      status: 'generating'
    } as any;

    console.log('[DEBUG handleGenerate] Creating local entry:', {
      tempEntryId,
      entry: {
        id: tempEntry.id,
        firebaseHistoryId: (tempEntry as any)?.firebaseHistoryId,
        status: tempEntry.status,
        imageCount: tempEntry.imageCount,
        prompt: tempEntry.prompt.substring(0, 50) + '...'
      },
      currentLocalEntriesCount: localGeneratingEntries.length
    });

    // Set loading entry immediately to show loading GIF
    // Use flushSync to force immediate React render (if available) or use setTimeout
    // Keep multiple concurrent generations visible (cap at 4).
    setLocalGeneratingEntries((prev) => {
      const next = [tempEntry, ...prev.filter((e: any) => String(e?.id || (e as any)?.firebaseHistoryId) !== String(tempEntryId))];
      return next.slice(0, 4);
    });

    // Force a synchronous render cycle by using requestAnimationFrame
    // This ensures the loading GIF appears immediately before any async operations
    await new Promise(resolve => {
      // Use double RAF to ensure DOM update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(undefined);
        });
      });
    });

    // No local writes to global history; backend tracks persistent history

    let firebaseHistoryId: string | undefined;
    // Read isPublic from backend policy (fallbacks handled internally)
    const isPublic = await getIsPublic();

    try {
      // Check if it's a Runway model
      const isRunwayModel = selectedModel.startsWith("gen4_image");
      // Check if it's a MiniMax model
      const isMiniMaxModel = selectedModel === "minimax-image-01";

      if (isRunwayModel) {
        console.log('🚀 ENTERING RUNWAY GENERATION SECTION');
        console.log('=== STARTING RUNWAY GENERATION ===');
        console.log('Selected model:', selectedModel);
        console.log('Image count:', imageCount);
        console.log('Frame size:', frameSize);
        console.log('Style:', style);
        console.log('Uploaded images count:', uploadedImages.length);

        // Runway provider creates history records in the backend; we capture `historyId` from provider responses
        // (see `runwayGenerate` response and `runwayStatus` payload).

        // Validate gen4_image_turbo requires at least one reference image
        console.log('🔍 ABOUT TO START VALIDATION');
        console.log('=== VALIDATING RUNWAY REQUIREMENTS ===');
        console.log('Selected model:', selectedModel);
        console.log('Uploaded images count:', uploadedImages.length);
        console.log('Uploaded images:', uploadedImages);
        console.log('Is gen4_image_turbo:', selectedModel === "gen4_image_turbo");
        console.log('Has uploaded images:', uploadedImages.length > 0);
        console.log('Validation condition:', selectedModel === "gen4_image_turbo" && uploadedImages.length === 0);

        if (
          selectedModel === "gen4_image_turbo" &&
          uploadedImages.length === 0
        ) {
          console.log('❌ VALIDATION FAILED: gen4_image_turbo requires reference image');
          console.log('Stopping generation process...');

          // Update Firebase entry to failed status
          try {
            await updateFirebaseHistory(firebaseHistoryId, {
              status: "failed",
              error: "gen4_image_turbo requires at least one reference image"
            });
            console.log('✅ Firebase entry updated to failed status');
          } catch (firebaseError) {
            console.error('❌ Failed to update Firebase entry:', firebaseError);
          }

          // Remove the loading entry since validation failed
          // dispatch(
          //   updateHistoryEntry({
          //     id: firebaseHistoryId!,
          //     updates: {
          //       status: "failed",
          //       error: "gen4_image_turbo requires at least one reference image"
          //     },
          //   })
          // );

          dispatch(
            addNotification({
              type: "error",
              message: "gen4_image_turbo requires at least one reference image",
            })
          );
          setIsGeneratingLocally(false);
          removeLocalGeneratingEntry([generationId || tempEntryId, firebaseHistoryId].filter(Boolean) as any);
          postGenerationBlockRef.current = false;
          return;
        }

        console.log('✅ VALIDATION PASSED: Proceeding with Runway generation');
        console.log('🎯 VALIDATION COMPLETED - MOVING TO NEXT STEP');

        // Additional safety check
        if (selectedModel === "gen4_image_turbo" && uploadedImages.length === 0) {
          console.error('🚨 SAFETY CHECK FAILED: This should not happen!');
          throw new Error('Validation bypassed unexpectedly');
        }

        // Convert frameSize to Runway ratio format
        let ratio = convertFrameSizeToRunwayRatio(frameSize);
        ratio = coerceRunwayRatio(ratio, selectedModel);
        console.log('Converted frame size to Runway ratio:', ratio);

        // For Runway, support multiple images by creating parallel tasks
        const totalToGenerate = Math.min(imageCount, 4);
        let currentImages = [...uploadedImages]; // Start with uploaded images
        let completedCount = 0;
        let anyFailures = false;

        console.log('Total images to generate:', totalToGenerate);
        console.log('Initial currentImages array:', currentImages);

        // Mark the active generation as 'generating' in the shared queue so the UI loader updates immediately
        if (generationId) {
          dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'generating' } }));
        }

        // Update initial progress
        // dispatch(
        //   updateHistoryEntry({
        //     id: firebaseHistoryId!,
        //     updates: {
        //       generationProgress: {
        //         current: 0,
        //         total: totalToGenerate * 100,
        //         status: `Starting Runway generation for ${totalToGenerate} image(s)...`,
        //       },
        //     },
        //   })
        // );

        // Create all generation tasks in parallel
        const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
          try {
            console.log(`Starting Runway generation for image ${index + 1}/${totalToGenerate}`);

            // Make direct API call to avoid creating multiple history entries
            console.log(`=== MAKING RUNWAY API CALL FOR IMAGE ${index + 1} ===`);
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const combinedImages = getCombinedUploadedImages();
            console.log('API payload:', {
              promptText: `${promptAdjusted} [Style: ${style}]`,
              model: selectedModel,
              ratio,
              generationType: "text-to-image",
              uploadedImagesCount: combinedImages.length,
              style
            });
            const result = await dispatch(runwayGenerate({
              promptText: `${promptAdjusted} [Style: ${style}]`,
              model: selectedModel,
              ratio,
              generationType: "text-to-image",
              uploadedImages: combinedImages,
              style,
              isPublic,
              generationId
            })).unwrap();
            console.log(`Runway API call completed for image ${index + 1}, taskId:`, result.taskId);

            // Capture backend historyId immediately (Runway returns it on task creation)
            if (!firebaseHistoryId && result?.historyId) {
              firebaseHistoryId = result.historyId;
            }

            // Poll via backend status route; stop on completion or terminal error
            let imageUrl: string | undefined;
            let terminalError: string | undefined;
            let baseRespToastShown = false;
            for (let attempts = 0; attempts < 360; attempts++) {
              const status = await dispatch(runwayStatus(result.taskId)).unwrap();
              // Capture backend historyId if frontend one wasn't created
              if (!firebaseHistoryId && status?.historyId) {
                firebaseHistoryId = status.historyId;
              }
              // If provider returned base_resp codes, handle and stop as needed
              const mapped = mapRunwayStatus(status);
              if (mapped && mapped.shouldStop) {
                terminalError = mapped.message;
                if (mapped.toastType === 'error' && !runwayBaseRespToastShownRef.current && !baseRespToastShown) {
                  toast.error(mapped.message);
                  runwayBaseRespToastShownRef.current = true;
                  baseRespToastShown = true;
                }
                // Stop loader immediately - clear ONLY this generation's local entry on error
                removeLocalGeneratingEntry([generationId || tempEntryId, firebaseHistoryId].filter(Boolean) as any);
                setIsGeneratingLocally(false);
                // Ensure shared active generation reflects the failure so UI loaders stop
                if (generationId) {
                  dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: mapped.message } }));
                }
                break;
              }
              // Also stop on explicit failure/cancelled statuses from backend/provider
              const s = String(status?.status || '').toUpperCase();
              if (s === 'FAILED' || s === 'CANCELLED' || s === 'THROTTLED') {
                terminalError = (status?.failure as string) || 'Runway task did not complete';
                if (!runwayBaseRespToastShownRef.current) toast.error(terminalError);
                removeLocalGeneratingEntry([generationId || tempEntryId, firebaseHistoryId].filter(Boolean) as any);
                setIsGeneratingLocally(false);
                // Mirror failure into activeGenerations so the shared UI reflects the error
                if (generationId) {
                  dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: terminalError } }));
                }
                break;
              }
              // Check for success statuses (completed, SUCCEEDED, succeeded, etc.)
              if ((s === 'COMPLETED' || s === 'SUCCEEDED' || s === 'SUCCEED') && Array.isArray(status?.images) && status.images.length > 0) {
                imageUrl = status.images[0]?.url || status.images[0]?.originalUrl;
                break;
              }
              await new Promise(res => setTimeout(res, 1000));
            }
            if (!imageUrl) throw new Error(terminalError || 'Runway generation did not complete in time');

            // Process the completed image
            if (imageUrl) {
              console.log(`Image ${index + 1} completed with URL:`, imageUrl);

              // Create a new array copy instead of modifying the existing one
              const newImages = [...currentImages];
              newImages[index] = {
                id: `${result.taskId}-${index}`,
                url: imageUrl,
                originalUrl: imageUrl
              };

              // Update the reference to use the new array
              currentImages = newImages;
              completedCount++;

              console.log(`Updated currentImages array:`, currentImages);
              console.log(`Completed count:`, completedCount);

              // Upload the image to Firebase Storage
              console.log(`Uploading image ${index + 1} to Firebase Storage...`);
              try {
                const uploadedImage = await uploadGeneratedImage(newImages[index]);
                console.log(`Image ${index + 1} uploaded to Firebase:`, uploadedImage);

                // Update the image with Firebase URL
                newImages[index] = uploadedImage;
                currentImages = newImages;

                // Update the history entry with the new image and Firebase URL
                // dispatch(
                //   updateHistoryEntry({
                //     id: firebaseHistoryId!,
                //     updates: {
                //       images: currentImages,
                //       frameSize: ratio,
                //       generationProgress: {
                //         current: completedCount * 100,
                //         total: totalToGenerate * 100,
                //         status: `Completed ${completedCount}/${totalToGenerate} images`,
                //       },
                //     },
                //   })
                // );

                // 🔥 CRITICAL FIX: Update Firebase with completed image
                try {
                  await updateFirebaseHistory(firebaseHistoryId!, {
                    images: currentImages,
                    frameSize: ratio,
                    generationProgress: {
                      current: completedCount * 100,
                      total: totalToGenerate * 100,
                      status: `Completed ${completedCount}/${totalToGenerate} images`,
                    },
                  });
                  console.log(`✅ Firebase updated with image ${index + 1}`);
                  // Don't refresh here - wait for final completion
                } catch (firebaseError) {
                  console.error(`❌ Failed to update Firebase with image ${index + 1}:`, firebaseError);
                }
              } catch (uploadError) {
                console.error(`Failed to upload image ${index + 1} to Firebase:`, uploadError);
                // Continue with the original URL if upload fails
                // dispatch(
                //   updateHistoryEntry({
                //     id: firebaseHistoryId!,
                //     updates: {
                //       images: currentImages,
                //       frameSize: ratio,
                //       generationProgress: {
                //         current: completedCount * 100,
                //         total: totalToGenerate * 100,
                //         status: `Completed ${completedCount}/${totalToGenerate} images (Firebase upload failed)`,
                //       },
                //     },
                //   })
                // );
              }
            } else {
              console.error(`No image URL returned for image ${index + 1}`);
            }

            return { success: true, index, imageUrl };
          } catch (error) {
            console.error(`Runway generation failed for image ${index + 1}:`, error);
            anyFailures = true;
            if (!runwayBaseRespToastShownRef.current) {
              toast.error(`Failed to generate image ${index + 1} with Runway: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            return { success: false, index, error };
          }
        });

        // Wait for all generations to complete
        console.log('Waiting for all Runway generations to complete...');
        const results = await Promise.allSettled(generationPromises);
        console.log('All Runway generations completed. Results:', results);

        // Count successful generations
        const successfulResults = results.filter(
          (result) => result.status === 'fulfilled' && result.value.success
        );
        console.log('Successful generations:', successfulResults.length);
        console.log('Failed generations:', results.length - successfulResults.length);

        // Finalize entry
        console.log('Finalizing history entry...');
        console.log('Final currentImages:', currentImages);
        console.log('Successful generations:', successfulResults.length);

        // dispatch(
        //   updateHistoryEntry({
        //     id: firebaseHistoryId!,
        //     updates: {
        //       status: successfulResults.length > 0 ? "completed" : "failed",
        //       timestamp: new Date().toISOString(),
        //       createdAt: new Date().toISOString(),
        //       imageCount: successfulResults.length,
        //       frameSize: ratio,
        //       style,
        //       generationProgress: {
        //         current: successfulResults.length * 100,
        //         total: totalToGenerate * 100,
        //         status: `Completed ${successfulResults.length}/${totalToGenerate} images`,
        //       },
        //     },
        //   })
        // );

        // 🔥 CRITICAL FIX: Update Firebase with final status
        console.log('💾 UPDATING FIREBASE WITH FINAL STATUS...');
        console.log('Final data to update:', {
          status: successfulResults.length > 0 ? "completed" : "failed",
          imageCount: successfulResults.length,
          frameSize: ratio,
          style,
          firebaseHistoryId
        });

        // `firebaseHistoryId` is optional in the new flow; providers create history records themselves.
        // If it's not available, we still complete the UI flow and rely on a full history refresh.
        if (!firebaseHistoryId) {
          console.warn('[Runway] No historyId captured; skipping PATCH update and relying on history refresh.');
        }

        console.log('🔍 DEBUG: firebaseHistoryId is valid:', firebaseHistoryId);
        console.log('🔍 DEBUG: successfulResults.length:', successfulResults.length);
        console.log('🔍 DEBUG: totalToGenerate:', totalToGenerate);

        const finalStatus = successfulResults.length > 0 ? "completed" : "failed" as "completed" | "failed";
        console.log('🔍 DEBUG: Final status to set:', finalStatus);

        const updateData = {
          status: finalStatus,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          imageCount: successfulResults.length,
          frameSize: ratio,
          style,
          generationProgress: {
            current: successfulResults.length * 100,
            total: totalToGenerate * 100,
            status: `Completed ${successfulResults.length}/${totalToGenerate} images`,
          },
        };

        console.log('🔍 DEBUG: Update data being sent to Firebase:', updateData);

        try {
          console.log('🔍 DEBUG: About to call updateFirebaseHistory...');
          console.log('🔍 DEBUG: Function parameters:', { firebaseHistoryId, updateData });

          await updateFirebaseHistory(firebaseHistoryId, updateData);

          console.log('✅ Firebase updated with final status:', finalStatus);
          console.log('🔗 Firebase document updated: generationHistory/' + firebaseHistoryId);

          // 🔍 DEBUG: Verify the update worked by checking Firebase again
          console.log('🔍 DEBUG: Firebase update completed successfully');

          // 🔍 DEBUG: Add a small delay to ensure Firebase has processed the update
          console.log('🔍 DEBUG: Waiting 1 second for Firebase to process update...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('🔍 DEBUG: Delay completed, Firebase update should be persisted');

        } catch (firebaseError) {
          console.error('❌ Failed to update Firebase with final status:', firebaseError);
          console.error('Firebase update error details:', {
            message: firebaseError instanceof Error ? firebaseError.message : 'Unknown error',
            stack: firebaseError instanceof Error ? firebaseError.stack : 'No stack trace'
          });

          // 🔍 DEBUG: Try to understand what went wrong
          console.error('🔍 DEBUG: firebaseHistoryId that failed:', firebaseHistoryId);
          console.error('🔍 DEBUG: Update data that failed:', updateData);
        }

        if (successfulResults.length > 0) {
          console.log('Runway generation completed successfully!');

          // Update local preview with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: currentImages.filter(img => img.url),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: successfulResults.length,
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              console.log('[queue] Runway generation completed, updating active generation:', { generationId, firebaseHistoryId, imageCount: completedEntry.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: completedEntry.images,
                  historyId: firebaseHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh only the single completed generation instead of reloading all
          // Use backend historyId (not client gen-...) because that's what /api/generations/:id expects
          const refreshId = firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { refreshId, firebaseHistoryId, generationId });
          if (refreshId) {
            await refreshSingleGeneration(refreshId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } else {
          console.log('All Runway generations failed');

          // Update local preview to failed status
          setLocalGeneratingEntries((prev) => prev.map((e) => ({
            ...e,
            status: 'failed'
          })));

          if (generationId) {
            dispatch(updateActiveGeneration({
              id: generationId,
              updates: { status: 'failed', error: 'Runway generation failed' }
            }));
          }
        }

        console.log('=== RUNWAY GENERATION COMPLETED ===');
      } else if (isMiniMaxModel) {
        // Use MiniMax generation
        const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
        const result = await dispatch(
          generateMiniMaxImages({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            aspect_ratio: frameSize,
            imageCount,
            generationType: "text-to-image",
            uploadedImages,
            style
          })
        ).unwrap();

        // MiniMax now returns images directly with Firebase URLs
        // Update the loading entry with completed data
        // dispatch(
        //   updateHistoryEntry({
        //     id: loadingEntry.id,
        //     updates: {
        //       status: 'completed',
        //       images: result.images,
        //       imageCount: result.images.length,
        //       frameSize: result.aspect_ratio || frameSize,
        //       style,
        //       timestamp: new Date().toISOString(),
        //       createdAt: new Date().toISOString()
        //     },
        //   })
        // );

        // Update the local loading entry with completed images
        try {
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          const completedEntry: HistoryEntry = {
            ...tempEntry,
            // Use the backend historyId when available so the local card matches the real entry.
            id: resultHistoryId || tempEntryId,
            // Also store firebaseHistoryId for duplicate-detection helpers
            ...(resultHistoryId ? { firebaseHistoryId: resultHistoryId } : {}),
            images: result.images,
            status: 'completed',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: result.images.length,
          } as any;
          upsertLocalGeneratingEntry(completedEntry);

          if (generationId) {
            console.log('[queue] MiniMax generation completed, updating active generation:', { generationId, historyId: (result as any)?.historyId, imageCount: completedEntry.images?.length });
            dispatch(updateActiveGeneration({
              id: generationId,
              updates: {
                status: 'completed',
                images: completedEntry.images,
                historyId: (result as any)?.historyId
              }
            }));
          }
        } catch { }

        // Toast removed - useQueueManagement handles success toasts
        clearInputs();

        // Refresh only the single completed generation instead of reloading all
        // Use backend historyId (not client gen-...) because that's what /api/generations/:id expects
        const historyIdToRefresh = (result as any)?.historyId || firebaseHistoryId || generationId;
        console.log('[queue] Refreshing generation:', { historyIdToRefresh, resultHistoryId: (result as any)?.historyId, generationId });
        if (historyIdToRefresh) {
          await refreshSingleGeneration(historyIdToRefresh);
        } else {
          await refreshHistory();
        }

        // Handle credit success
        if (transactionId) {
          await handleGenerationSuccess(transactionId);
        }
      } else if (selectedModel === 'flux-2-pro') {
        // FAL Flux 2 Pro immediate generate flow
        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(falGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            userPrompt: prompt, // Store original user-entered prompt
            model: selectedModel,
            // New schema: num_images + aspect_ratio + resolution
            num_images: imageCount,
            aspect_ratio: frameSize as any,
            resolution: flux2ProResolution, // 1K or 2K
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
            output_format: 'jpeg',
            generationType: 'text-to-image',
            isPublic,
          })).unwrap();

          // Handle queued submission fallback (FAL may return requestId + submitted)
          if ((!result.images || result.images.length === 0) && (result.status === 'submitted' || (result as any)?.requestId)) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog('FAL queued submission detected', { model: result.model, reqId, generationId });

            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: 'generating',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: 'generating',
                    startedAt,
                    historyId: (result as any)?.historyId || generationId,
                    params: {
                      ...(activeGenerations.find(g => g.id === generationId)?.params || {}),
                      requestId: reqId
                    }
                  }
                }));

                // Start polling for server history to attach canonical historyId
                void pollForMatchingHistory({ generationId, tempEntryId, model: result.model, prompt: finalPrompt, requestId: reqId, startedAt });
              }
            } catch { }

            // Poll FAL queue for completion
            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) {
                try {
                  const statusRes = await api.get('/api/fal/queue/status', {
                    params: { model: result.model, requestId: reqId },
                    timeout: 15000
                  });
                  const status = statusRes.data?.data || statusRes.data;
                  qlog('FAL poll status (flux-2-pro)', { model: result.model, requestId: reqId, attempt: attempts + 1, status: status?.status, statusObj: status });
                  consecutiveErrors = 0;
                  const s = String(status?.status || '').toLowerCase();

                  if (s === 'completed' || s === 'success' || s === 'succeeded') {
                    const resultRes = await api.get('/api/fal/queue/result', {
                      params: { model: result.model, requestId: reqId },
                      timeout: 15000
                    });
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: (finalResult.images || []),
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: (finalResult.images?.length || imageCount),
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: 'completed',
                            images: finalResult.images || [],
                            historyId: finalResult.historyId || (result as any)?.historyId
                          }
                        }));
                      }
                    } catch { }

                    const resultHistoryId = (finalResult as any)?.historyId || (result as any)?.historyId || firebaseHistoryId || generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === 'failed' || s === 'error') {
                    throw new Error('Flux 2 Pro generation failed (queue)');
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = statusError?.message || String(statusError);
                  const isNetworkError = errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND');

                  if (isNetworkError) {
                    qwarn(`Flux 2 Pro - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS})`, errorMsg);
                  } else {
                    qerr(`Flux 2 Pro - Error (${attempts + 1}/360)`, errorMsg);
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    if (generationId) {
                      dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: `Flux 2 Pro queue polling failed: ${errorMsg}` } }));
                    }
                    throw new Error(`Flux 2 Pro: Too many network errors. ${errorMsg}`);
                  }
                  if (attempts === 359) throw new Error(`Flux 2 Pro: Timeout after 360 attempts. ${errorMsg}`);
                }
                await new Promise(res => setTimeout(res, 1000));
              }

              return;
            } catch (queueErr) {
              qerr('Flux 2 Pro queue polling failed', queueErr);
              if (generationId) dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: (queueErr as any)?.message || 'Flux 2 Pro generation failed' } }));
              await handleFalError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: 'Flux 2 Pro',
              });
              return;
            }
          }

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              console.log('[queue] Generation completed, updating active generation:', { generationId, historyId: (result as any)?.historyId, imageCount: completedEntry.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: completedEntry.images,
                  historyId: (result as any)?.historyId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Flux 2 Pro',
          });
          return;
        }
      } else if (selectedModel === 'gemini-25-flash-image') {
        // FAL Gemini (Nano Banana) immediate generate flow (align with BFL)
        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(falGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            userPrompt: prompt, // Store original user-entered prompt
            model: selectedModel,
            // New schema: num_images + aspect_ratio
            num_images: imageCount,
            aspect_ratio: frameSize as any,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
            output_format: 'jpeg',
            generationType: 'text-to-image',
            isPublic,
          })).unwrap();

          // If server returned a queued submission (requestId) instead of images, poll the FAL queue
          if ((!result.images || result.images.length === 0) && (result.status === 'submitted' || (result as any)?.requestId)) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog('FAL queued submission detected (Gemini/Nano Banana)', { model: result.model, reqId, generationId });

            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: 'generating',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: 'generating',
                    startedAt,
                    historyId: (result as any)?.historyId || generationId,
                    params: {
                      ...(activeGenerations.find(g => g.id === generationId)?.params || {}),
                      requestId: reqId
                    }
                  }
                }));

                void pollForMatchingHistory({ generationId, tempEntryId, model: result.model, prompt: finalPrompt, requestId: reqId, startedAt });
              }
            } catch { }

            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) {
                try {
                  const statusRes = await api.get('/api/fal/queue/status', {
                    params: { model: result.model, requestId: reqId },
                    timeout: 15000
                  });
                  const status = statusRes.data?.data || statusRes.data;
                  consecutiveErrors = 0;
                  const s = String(status?.status || '').toLowerCase();

                  if (s === 'completed' || s === 'success' || s === 'succeeded') {
                    const resultRes = await api.get('/api/fal/queue/result', {
                      params: { model: result.model, requestId: reqId },
                      timeout: 15000
                    });
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: (finalResult.images || []),
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: (finalResult.images?.length || imageCount),
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: 'completed',
                            images: finalResult.images || [],
                            historyId: finalResult.historyId || (result as any)?.historyId
                          }
                        }));
                      }
                    } catch { }

                    const resultHistoryId = (finalResult as any)?.historyId || (result as any)?.historyId || firebaseHistoryId || generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === 'failed' || s === 'error') {
                    throw new Error('Gemini generation failed (queue)');
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = statusError?.message || String(statusError);
                  const isNetworkError = errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND');

                  if (isNetworkError) {
                    console.warn(`[queue] Gemini/Nano Banana - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, errorMsg);
                  } else {
                    console.error(`[queue] Gemini/Nano Banana - Error (${attempts + 1}/360):`, errorMsg);
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    if (generationId) {
                      dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: `Gemini queue polling failed: ${errorMsg}` } }));
                    }
                    throw new Error(`Gemini: Too many network errors. ${errorMsg}`);
                  }
                  if (attempts === 359) throw new Error(`Gemini: Timeout after 360 attempts. ${errorMsg}`);
                }
                await new Promise(res => setTimeout(res, 1000));
              }

              return;
            } catch (queueErr) {
              console.error('[queue] Gemini queue polling failed:', queueErr);
              if (generationId) dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: (queueErr as any)?.message || 'Gemini generation failed' } }));
              await handleFalError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: 'Google Nano Banana',
              });
              return;
            }
          }

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              console.log('[queue] Generation completed, updating active generation:', { generationId, historyId: (result as any)?.historyId, imageCount: completedEntry.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: completedEntry.images,
                  historyId: (result as any)?.historyId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          console.error('FAL generate failed:', error);
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Google Nano Banana',
          });
          return;
        }
      } else if (selectedModel === 'imagen-4-ultra' || selectedModel === 'imagen-4' || selectedModel === 'imagen-4-fast') {
        // Imagen 4 models via FAL generate endpoint
        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(falGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            userPrompt: prompt, // Store original user-entered prompt
            model: selectedModel,
            aspect_ratio: frameSize as any,
            num_images: imageCount,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
            output_format: outputFormat,
            generationType: 'text-to-image',
            isPublic,
          })).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            if (generationId) {
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: completedEntry.images,
                  historyId: (result as any)?.historyId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Imagen 4',
          });
          return;
        }
      } else if (selectedModel === 'seedream-v4') {
        // Replicate Seedream v4 (supports T2I and I2I with multi-image input)
        try {
          // Build Seedream payload per new schema
          const seedreamAllowedAspect = new Set([
            'match_input_image', '1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3', '21:9'
          ]);
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: 'bytedance/seedream-4',
            size: seedreamSize,
            aspect_ratio: seedreamAllowedAspect.has(frameSize) ? frameSize : 'match_input_image',
            sequential_image_generation: 'disabled',
            max_images: Math.min(imageCount, 4),
            isPublic,
          };
          if (seedreamSize === 'custom') {
            payload.width = Math.max(1024, Math.min(4096, Number(seedreamWidth) || 2048));
            payload.height = Math.max(1024, Math.min(4096, Number(seedreamHeight) || 2048));
          }
          // Filter out SVG files - Seedream doesn't support SVG as input
          if (uploadedImages && uploadedImages.length > 0) {
            const validImages = uploadedImages
              .slice(0, 10)
              .map((u: string) => toAbsoluteFromProxy(u))
              .filter((url: string) => {
                // Exclude SVG files (vectorized images)
                const lowerUrl = url.toLowerCase();
                return !lowerUrl.includes('.svg') && !lowerUrl.includes('vectorized');
              });
            if (validImages.length > 0) {
              payload.image_input = validImages;
            }
          }
          const result = await dispatch(replicateGenerate(payload)).unwrap();

          // If provider returned a queued submission (requestId) instead of immediate images,
          // fall back to queue polling behavior used by video flows.
          if ((!result.images || result.images.length === 0) && (result.status === 'submitted' || (result.requestId || (result as any)?.requestId))) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog('Seedream v4 queued submission detected', { model: result.model, reqId, generationId });

            // Keep local card visible as a 'generating' entry
            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: 'generating',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: 'generating',
                    startedAt,
                    historyId: (result as any)?.historyId || generationId,
                    // store requestId on params for diagnostics
                    params: {
                      ...(activeGenerations.find(g => g.id === generationId)?.params || {}),
                      requestId: reqId
                    }
                  }
                }));

                // Start history matching poll
                void pollForMatchingHistory({ generationId, tempEntryId, model: result.model, prompt: finalPrompt, requestId: reqId, startedAt });
              }
            } catch { }

            // Poll for completion using Replicate queue endpoints
            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) { // up to 6 minutes
                try {
                  const statusRes = await api.get('/api/replicate/queue/status', {
                    params: { requestId: reqId },
                    timeout: 15000
                  });
                  const status = statusRes.data?.data || statusRes.data;
                  consecutiveErrors = 0;
                  const s = String(status?.status || '').toLowerCase();

                  if (s === 'completed' || s === 'success' || s === 'succeeded') {
                    const resultRes = await api.get('/api/replicate/queue/result', {
                      params: { requestId: reqId },
                      timeout: 15000
                    });
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: (finalResult.images || []),
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: (finalResult.images?.length || imageCount),
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: 'completed',
                            images: finalResult.images || [],
                            historyId: finalResult.historyId || (result as any)?.historyId
                          }
                        }));
                      }
                    } catch { }

                    // Refresh and handle credits/transaction if present
                    const resultHistoryId = (finalResult as any)?.historyId || (result as any)?.historyId || firebaseHistoryId || generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === 'failed' || s === 'error') {
                    throw new Error('Seedream generation failed (queue)');
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = statusError?.message || String(statusError);
                  const isNetworkError = errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND');

                  if (isNetworkError) {
                    console.warn(`[queue] Seedream v4 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, errorMsg);
                  } else {
                    console.error(`[queue] Seedream v4 - Error (${attempts + 1}/360):`, errorMsg);
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    // Mark generation as failed in UI
                    if (generationId) {
                      dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: `Seedream queue polling failed: ${errorMsg}` } }));
                    }
                    throw new Error(`Seedream v4: Too many network errors. ${errorMsg}`);
                  }
                  if (attempts === 359) throw new Error(`Seedream v4: Timeout after 360 attempts. ${errorMsg}`);
                }
                await new Promise(res => setTimeout(res, 1000));
              }

              return; // Exit the normal flow since queue result handled
            } catch (queueErr) {
              console.error('[queue] Seedream v4 queue polling failed:', queueErr);
              // Mirror failure into activeGenerations so the shared UI reflects the error
              if (generationId) dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: (queueErr as any)?.message || 'Seedream generation failed' } }));
              await handleReplicateError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: 'Seedream v4',
              });
              return;
            }
          }

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log('[queue] Seedream v4 generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: result.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: result.images || [],
                  historyId: resultHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          // Don't reset isGeneratingLocally here - let the useEffect handle it when status changes
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Seedream v4',
          });
          return;
        }
      } else if (selectedModel === 'seedream-4.5') {
        // FAL Seedream 4.5 (v45) text-to-image - map frame size to proper enum values
        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();

          // Map frame size to Seedream 4.5 enum values (square_hd, portrait_4_3, landscape_16_9, etc.)
          const frameSizeToEnum: Record<string, string> = {
            '1:1': 'square_hd',
            'square': 'square_hd',
            '4:3': 'landscape_4_3',
            '3:4': 'portrait_4_3',
            '16:9': 'landscape_16_9',
            '9:16': 'portrait_16_9',
          };

          // Always use the proper frame size enum based on selected aspect ratio
          const imageSizeEnum = frameSizeToEnum[frameSize] || 'square_hd';

          const result = await dispatch(falGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            userPrompt: prompt,
            model: 'seedream-4.5',
            generationType: 'text-to-image',
            // Pass selected frame size and aspect ratio for backend reference
            frameSize,
            aspect_ratio: frameSize as any,
            // Send proper frame size enum (square_hd, portrait_4_3, landscape_16_9, etc.)
            // Backend will use this directly, respecting the selected frame size
            image_size: imageSizeEnum,
            resolution: seedream45Resolution, // Send resolution for backend reference (2K/4K)
            num_images: imageCount,
            max_images: imageCount,
            enable_safety_checker: true,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
            isPublic,
          })).unwrap();

          // Fallback: if backend returned a queued submission instead of images
          if ((!result.images || result.images.length === 0) && (result.status === 'submitted' || (result as any)?.requestId)) {
            const reqId = result.requestId || (result as any)?.requestId;
            qlog('Seedream 4.5 queued submission detected', { model: result.model, reqId, generationId });

            try {
              const queuedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: [],
                status: 'generating',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: imageCount,
              } as any;
              const startedAt = Date.now();
              upsertLocalGeneratingEntry(queuedEntry);

              if (generationId) {
                dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'generating', startedAt, historyId: (result as any)?.historyId || generationId, params: { ...(activeGenerations.find(g => g.id === generationId)?.params || {}), requestId: reqId } } }));

                // Begin matching server history for canonical attach
                void pollForMatchingHistory({ generationId, tempEntryId, model: result.model, prompt: finalPrompt, requestId: reqId, startedAt });
              }

              if (generationId) {
                dispatch(updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: 'generating',
                    historyId: (result as any)?.historyId || generationId,
                    params: {
                      ...(activeGenerations.find(g => g.id === generationId)?.params || {}),
                      requestId: reqId
                    }
                  }
                }));
              }
            } catch { }

            try {
              const api = getApiClient();
              let finalResult: any;
              let consecutiveErrors = 0;
              const MAX_CONSECUTIVE_ERRORS = 5;

              for (let attempts = 0; attempts < 360; attempts++) {
                try {
                  const statusRes = await api.get('/api/fal/queue/status', {
                    params: { model: 'seedream-4.5', requestId: reqId },
                    timeout: 15000
                  });
                  const status = statusRes.data?.data || statusRes.data;
                  consecutiveErrors = 0;
                  const s = String(status?.status || '').toLowerCase();

                  if (s === 'completed' || s === 'success' || s === 'succeeded') {
                    const resultRes = await api.get('/api/fal/queue/result', {
                      params: { model: 'seedream-4.5', requestId: reqId },
                      timeout: 15000
                    });
                    finalResult = resultRes.data?.data || resultRes.data;

                    // Mark completed
                    try {
                      const completedEntry: HistoryEntry = {
                        ...tempEntry,
                        id: tempEntryId,
                        images: (finalResult.images || []),
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: (finalResult.images?.length || imageCount),
                      } as any;
                      upsertLocalGeneratingEntry(completedEntry);

                      if (generationId) {
                        dispatch(updateActiveGeneration({
                          id: generationId,
                          updates: {
                            status: 'completed',
                            images: finalResult.images || [],
                            historyId: finalResult.historyId || (result as any)?.historyId
                          }
                        }));
                      }
                    } catch { }

                    const resultHistoryId = (finalResult as any)?.historyId || (result as any)?.historyId || firebaseHistoryId || generationId;
                    if (resultHistoryId) {
                      await refreshSingleGeneration(resultHistoryId);
                    } else {
                      await refreshHistory();
                    }

                    if (transactionId) {
                      await handleGenerationSuccess(transactionId);
                    }

                    break;
                  }

                  if (s === 'failed' || s === 'error') {
                    throw new Error('Seedream 4.5 generation failed (queue)');
                  }
                } catch (statusError: any) {
                  consecutiveErrors++;
                  const errorMsg = statusError?.message || String(statusError);
                  const isNetworkError = errorMsg.includes('timeout') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND');

                  if (isNetworkError) {
                    console.warn(`[queue] Seedream 4.5 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, errorMsg);
                  } else {
                    console.error(`[queue] Seedream 4.5 - Error (${attempts + 1}/360):`, errorMsg);
                  }

                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    if (generationId) {
                      dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: `Seedream 4.5 queue polling failed: ${errorMsg}` } }));
                    }
                    throw new Error(`Seedream 4.5: Too many network errors. ${errorMsg}`);
                  }
                  if (attempts === 359) throw new Error(`Seedream 4.5: Timeout after 360 attempts. ${errorMsg}`);
                }
                await new Promise(res => setTimeout(res, 1000));
              }

              return;
            } catch (queueErr) {
              console.error('[queue] Seedream 4.5 queue polling failed:', queueErr);
              if (generationId) dispatch(updateActiveGeneration({ id: generationId, updates: { status: 'failed', error: (queueErr as any)?.message || 'Seedream 4.5 generation failed' } }));
              await handleReplicateError(queueErr, {
                generationId,
                tempEntryId,
                tempEntry,
                transactionId,
                modelName: 'Seedream 4.5',
              });
              return;
            }
          }

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log('[queue] Seedream 4.5 generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: result.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: result.images || [],
                  historyId: resultHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Seedream 4.5',
          });
          return;
        }
      } else if (selectedModel === 'ideogram-ai/ideogram-v3') {
        // Ideogram v3 via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for ideogram (validator list)
          const allowedAspect = new Set([
            '1:3', '3:1', '1:2', '2:1', '9:16', '16:9', '10:16', '16:10', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '1:1'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Ideogram v3 doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            // Sensible defaults (can be expanded to UI later)
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'ideogram-ai/ideogram-v3-turbo',
              aspect_ratio: aspect,
              // Provide safe defaults accepted by backend validator/model
              resolution: 'None',
              style_type: 'Auto',
              magic_prompt_option: 'Auto',
            };

            // If user provided a reference image, pass a single image (v3 supports I2I prompt image)
            if (uploadedImages && uploadedImages.length > 0) {
              payload.image = toAbsoluteFromProxy(uploadedImages[0]);
            }

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (combinedResult as any)?.historyId;
              console.log('[queue] Generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: combinedResult.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: combinedResult.images || [],
                  historyId: resultHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (combinedResult as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (combinedResult as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Ideogram v3',
          });
          return;
        }
      } else if (selectedModel === 'ideogram-ai/ideogram-v3-quality') {
        // Ideogram v3 Quality via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for ideogram (validator list)
          const allowedAspect = new Set([
            '1:3', '3:1', '1:2', '2:1', '9:16', '16:9', '10:16', '16:10', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '1:1'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Ideogram v3 Quality doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            // Sensible defaults (can be expanded to UI later)
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'ideogram-ai/ideogram-v3-quality',
              aspect_ratio: aspect,
              // Provide safe defaults accepted by backend validator/model
              resolution: 'None',
              style_type: 'Auto',
              magic_prompt_option: 'Auto',
            };

            // If user provided a reference image, pass a single image (v3 supports I2I prompt image)
            if (uploadedImages && uploadedImages.length > 0) {
              payload.image = toAbsoluteFromProxy(uploadedImages[0]);
            }

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (combinedResult as any)?.historyId;
              console.log('[queue] Generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: combinedResult.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: combinedResult.images || [],
                  historyId: resultHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (combinedResult as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (combinedResult as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          // Stop generation process immediately on error (don't wipe other in-flight jobs)
          removeLocalGeneratingEntry(generationId || tempEntryId);
          setIsGeneratingLocally(false);
          postGenerationBlockRef.current = false;

          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Ideogram v3 Quality');
          return;
        }
      } else if (selectedModel === 'leonardoai/lucid-origin') {
        // Lucid Origin via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Lucid Origin
          const allowedAspect = new Set([
            '1:1', '16:9', '9:16', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '2:1', '1:2', '3:1', '1:3'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Lucid Origin doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'leonardoai/lucid-origin',
              aspect_ratio: aspect,
              // Use Redux state values for Lucid Origin
              style: lucidStyle,
              contrast: lucidContrast,
              generation_mode: lucidMode,
              prompt_enhance: lucidPromptEnhance,
              num_images: 1
            };

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (combinedResult as any)?.historyId;
              console.log('[queue] Generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: combinedResult.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: combinedResult.images || [],
                  historyId: resultHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing (don't wipe other in-flight jobs)
          setTimeout(() => {
            removeLocalGeneratingEntry(generationId || tempEntryId);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (combinedResult as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (combinedResult as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Lucid Origin',
          });
          return;
        }
      } else if (selectedModel === 'leonardoai/phoenix-1.0') {
        // Phoenix 1.0 via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Phoenix 1.0
          const allowedAspect = new Set([
            '1:1', '16:9', '9:16', '3:2', '2:3', '4:5', '5:4', '3:4', '4:3', '2:1', '1:2', '3:1', '1:3'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Phoenix 1.0 doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            const payload: any = {
              prompt: `${prompt} [Style: ${style}]`,
              model: 'leonardoai/phoenix-1.0',
              aspect_ratio: aspect,
              // Use Redux state values for Phoenix 1.0
              style: phoenixStyle,
              contrast: phoenixContrast,
              generation_mode: phoenixMode,
              prompt_enhance: phoenixPromptEnhance,
              num_images: 1
            };

            const result = await dispatch(replicateGenerate(payload)).unwrap();
            return result;
          });

          // Wait for all generations to complete
          const results = await Promise.all(generationPromises);

          // Combine all images from all results
          const allImages = results.flatMap(result => result.images || []);
          const combinedResult = {
            ...results[0], // Use first result as base
            images: allImages
          };

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (combinedResult as any)?.historyId || firebaseHistoryId;
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          // Stop generation process immediately on error
          setLocalGeneratingEntries([]);
          setIsGeneratingLocally(false);
          postGenerationBlockRef.current = false;

          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Phoenix 1.0',
          });
          return;
        }
      } else if (selectedModel === 'google/nano-banana-pro') {
        // Google Nano Banana Pro via FAL generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for Nano Banana Pro
          const allowedAspect = new Set([
            'match_input_image', '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Use the selected resolution from state
          const resolution = nanoBananaProResolution;

          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();

          const result = await dispatch(falGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            userPrompt: prompt, // Store original user-entered prompt
            model: 'google/nano-banana-pro',
            num_images: imageCount,
            aspect_ratio: aspect as any,
            resolution: resolution,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
            output_format: 'jpeg',
            generationType: 'text-to-image',
            isPublic,
          })).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // CRITICAL: Update active generation with backend historyId for queue sync
            if (generationId) {
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: result.images || [],
                  historyId: (result as any)?.historyId || firebaseHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Keep local entries visible for a moment before refreshing
          setTimeout(() => {
            setLocalGeneratingEntries([]);
          }, 1000);

          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId;
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          await handleFalError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'Nano Banana Pro',
          });
          return;
        }
      } else if (selectedModel === 'prunaai/p-image-edit') {
        // P-Image-Edit (Replicate) - requires at least one input image
        const combinedImages = getCombinedUploadedImages().map((u: string) => toAbsoluteFromProxy(u));
        if (combinedImages.length === 0) {
          toast.error('Please upload at least one image for P-Image-Edit (image-to-image)');
          setIsGeneratingLocally(false);
          postGenerationBlockRef.current = false;
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          return;
        }

        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, combinedImages, selectedCharacters);
          const allowedAspect = new Set(['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3']);
          const aspect = allowedAspect.has(frameSize) ? frameSize : 'match_input_image';
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: 'prunaai/p-image-edit',
            images: combinedImages,
            aspect_ratio: aspect,
            turbo: true,
            disable_safety_checker: false,
            isPublic,
            num_images: Math.min(Math.max(imageCount, 1), 4),
          };
          const result = await dispatch(replicateGenerate(payload)).unwrap();

          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log('[queue] P-Image-Edit standalone generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: result.images?.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: result.images || [],
                  historyId: resultHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error: any) {
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'P-Image-Edit',
          });
          return;
        }
      } else if (selectedModel === 'prunaai/p-image') {
        // P-Image combined behavior: T2I when no uploads, I2I via p-image-edit when uploads exist
        const combinedImages = getCombinedUploadedImages().map((u: string) => toAbsoluteFromProxy(u));
        const hasUploads = combinedImages.length > 0;

        if (hasUploads) {
          // Route to p-image-edit with tighter resolution (max 1024, ~1MP)
          try {
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, combinedImages, selectedCharacters);
            const allowedAspect = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3']);
            const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';
            const computeEditDims = (ratio: string) => {
              const [wStr, hStr] = ratio.split(':');
              const w = Number(wStr) || 1;
              const h = Number(hStr) || 1;
              const aspectVal = w / h;
              const round16 = (v: number) => Math.round(v / 16) * 16;
              const clamp = (v: number) => Math.max(256, Math.min(1024, round16(v)));
              let width: number;
              let height: number;
              if (aspectVal >= 1) {
                width = 1024;
                height = round16(1024 / aspectVal);
              } else {
                height = 1024;
                width = round16(1024 * aspectVal);
              }
              // ensure ~1MP cap
              while (width * height > 1048576) {
                width = clamp(width - 16);
                height = clamp(Math.round(width / aspectVal));
              }
              return { width: clamp(width), height: clamp(height) };
            };
            const dims = computeEditDims(aspect);

            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'prunaai/p-image-edit',
              images: combinedImages,
              aspect_ratio: aspect,
              width: dims.width,
              height: dims.height,
              turbo: true,
              disable_safety_checker: false,
              isPublic,
              num_images: Math.min(Math.max(imageCount, 1), 4),
            };

            const result = await dispatch(replicateGenerate(payload)).unwrap();

            try {
              const completedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: (result.images || []),
                status: 'completed',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: (result.images?.length || imageCount),
              } as any;
              upsertLocalGeneratingEntry(completedEntry);

              // Update active generation with backend historyId for proper sync
              if (generationId) {
                const resultHistoryId = (result as any)?.historyId;
                console.log('[queue] P-Image-Edit generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: result.images?.length });
                dispatch(updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: 'completed',
                    images: result.images || [],
                    historyId: resultHistoryId
                  }
                }));
              }
            } catch { }

            // Suppress explicit success toast here — centralized queue manager will show a single success toast
            console.log('[image] Generation completed; success toast suppressed (queue will show a single toast)');
            clearInputs();

            const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
            console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
            if (resultHistoryId) {
              await refreshSingleGeneration(resultHistoryId);
            } else {
              await refreshHistory();
            }

            if (transactionId) {
              await handleGenerationSuccess(transactionId);
            }
          } catch (error: any) {
            setLocalGeneratingEntries([]);
            setIsGeneratingLocally(false);
            postGenerationBlockRef.current = false;

            if (transactionId) {
              await handleGenerationFailure(transactionId);
            }
            const errorMessage = error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to generate images with P-Image');
            toast.error(errorMessage, { duration: 5000 });
            return;
          }
        } else {
          // Standard p-image T2I flow (max edge 1440)
          try {
            const promptAdjusted = adjustPromptImageNumbers(finalPrompt, combinedImages, selectedCharacters);
            const allowedAspect = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', 'custom']);
            const aspect = allowedAspect.has(frameSize) ? frameSize : '16:9';
            const computePImageDims = (ratio: string) => {
              const [wStr, hStr] = ratio.split(':');
              const w = Number(wStr) || 1;
              const h = Number(hStr) || 1;
              const aspectVal = w / h;
              const round16 = (v: number) => Math.round(v / 16) * 16;
              const clamp = (v: number) => Math.max(256, Math.min(1440, round16(v)));
              let width: number;
              let height: number;
              if (aspectVal >= 1) {
                width = 1440;
                height = round16(1440 / aspectVal);
              } else {
                height = 1440;
                width = round16(1440 * aspectVal);
              }
              return { width: clamp(width), height: clamp(height) };
            };
            const dims = computePImageDims(aspect === 'custom' ? '1:1' : (frameSize || '16:9'));
            const payload: any = {
              prompt: `${promptAdjusted} [Style: ${style}]`,
              model: 'prunaai/p-image',
              aspect_ratio: aspect,
              width: Math.min(1440, dims.width),
              height: Math.min(1440, dims.height),
              prompt_upsampling: false,
              disable_safety_checker: false,
              isPublic,
              num_images: Math.min(Math.max(imageCount, 1), 4),
            };
            if (aspect === 'custom') {
              payload.width = 1440;
              payload.height = 1440;
            }

            const result = await dispatch(replicateGenerate(payload)).unwrap();

            try {
              const completedEntry: HistoryEntry = {
                ...tempEntry,
                id: tempEntryId,
                images: (result.images || []),
                status: 'completed',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                imageCount: (result.images?.length || imageCount),
              } as any;
              upsertLocalGeneratingEntry(completedEntry);

              // Update active generation with backend historyId for proper sync
              if (generationId) {
                const resultHistoryId = (result as any)?.historyId;
                console.log('[queue] P-Image T2I generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: result.images?.length });
                dispatch(updateActiveGeneration({
                  id: generationId,
                  updates: {
                    status: 'completed',
                    images: result.images || [],
                    historyId: resultHistoryId
                  }
                }));
              }
            } catch { }

            // Suppress explicit success toast here — centralized queue manager will show a single success toast
            console.log('[image] Generation completed; success toast suppressed (queue will show a single toast)');
            clearInputs();

            const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
            console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
            if (resultHistoryId) {
              await refreshSingleGeneration(resultHistoryId);
            } else {
              await refreshHistory();
            }

            if (transactionId) {
              await handleGenerationSuccess(transactionId);
            }
          } catch (error: any) {
            setLocalGeneratingEntries([]);
            setIsGeneratingLocally(false);
            postGenerationBlockRef.current = false;

            if (transactionId) {
              await handleGenerationFailure(transactionId);
            }
            const errorMessage = error?.response?.data?.message || (error instanceof Error ? error.message : 'Failed to generate images with P-Image');
            toast.error(errorMessage, { duration: 5000 });
            return;
          }
        }
      } else if (selectedModel === 'new-turbo-model') {
        // New Turbo Model via replicate generate endpoint - single request with num_images
        try {
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);

          // Calculate dimensions based on frame size, keeping under 1MP and divisible by 16
          const dimensions = convertFrameSizeToZTurboDimensions(frameSize || '1:1');
          const width = dimensions.width;
          const height = dimensions.height;

          // Send single request with num_images parameter (backend handles multiple calls internally)
          const payload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: 'new-turbo-model',
            width: width,
            height: height,
            num_inference_steps: 8, // Schema default
            guidance_scale: 0, // Schema default (should be 0 for Turbo models)
            output_format: zTurboOutputFormat, // Use selected output format
            output_quality: 80, // Schema default
            num_images: Math.min(imageCount, 4), // Cap at 4 like other models
          };

          const result = await dispatch(replicateGenerate(payload)).unwrap();

          // All images should be in the result.images array from single request
          const allImages = result.images || [];

          // Keep status as 'generating' until images are loaded and visible
          // This ensures the loading animation stays until images are actually displayed
          try {
            const entryWithImages: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: allImages,
              status: 'generating', // Keep as 'generating' to show loading animation
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: allImages.length,
            } as any;
            upsertLocalGeneratingEntry(entryWithImages);

            // Wait for images to load before marking as completed
            // This ensures the loading animation stays visible until images are rendered
            if (allImages.length > 0) {
              // Wait a bit for React to render the images
              await new Promise(resolve => setTimeout(resolve, 500));

              // Wait for all images to actually load in the browser
              const imageLoadPromises = allImages.map((img: any) => {
                return new Promise<void>((resolve: () => void) => {
                  const imageUrl = img?.thumbnailUrl || img?.avifUrl || img?.url || img?.originalUrl;
                  if (!imageUrl) {
                    resolve();
                    return;
                  }

                  const imgElement = document.createElement('img');
                  imgElement.onload = () => resolve();
                  imgElement.onerror = () => resolve(); // Resolve even on error to not block
                  imgElement.src = imageUrl;

                  // Timeout after 5 seconds to prevent infinite waiting
                  setTimeout(() => resolve(), 5000);
                });
              });

              await Promise.all(imageLoadPromises);

              // Additional small delay to ensure images are rendered in DOM
              await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Now mark as completed after images are loaded
            const completedEntry: HistoryEntry = {
              ...entryWithImages,
              status: 'completed',
            } as any;
            upsertLocalGeneratingEntry(completedEntry);

            // Update active generation with backend historyId for proper sync
            if (generationId) {
              const resultHistoryId = (result as any)?.historyId;
              console.log('[queue] New Turbo Model generation completed, updating active generation:', { generationId, historyId: resultHistoryId, imageCount: allImages.length });
              dispatch(updateActiveGeneration({
                id: generationId,
                updates: {
                  status: 'completed',
                  images: allImages,
                  historyId: resultHistoryId
                }
              }));
            }
          } catch { }

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();

          // Refresh the history entry that contains all images
          const resultHistoryId = (result as any)?.historyId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }

          // Reset local generation state on success
          setIsGeneratingLocally(false);
        } catch (error: any) {
          console.error('New Turbo Model generation error:', error);
          await handleReplicateError(error, {
            generationId,
            tempEntryId,
            tempEntry,
            transactionId,
            modelName: 'New Turbo Model',
          });
          return;
        }
      } else {
        // Use regular BFL generation OR local models
        const localModels = [
          // Previously integrated local models
          'flux-schnell',
          'stable-medium',
          'stable-large',
          'stable-turbo',
          'stable-xl',
          // Newly added local models
          'flux-krea',
          'playground',
        ];
        const isLocalImageModel = localModels.includes(selectedModel);

        if (isLocalImageModel) {
          // Create Firebase history entry for local models (generating)
          try {
            firebaseHistoryId = await saveHistoryEntry({
              prompt: prompt,
              model: selectedModel,
              generationType: 'text-to-image',
              images: [],
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount,
              status: 'generating',
              frameSize,
              style,
            });
            // Point the temporary loading entry to the Firebase document id
            // dispatch(updateHistoryEntry({ id: loadingEntry.id, updates: { id: firebaseHistoryId } }));
          } catch (e) {
            console.error('Failed to create Firebase history for local model:', e);
          }

          // Call local image generation proxy (server uploads to Firebase)
          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          const result = await dispatch(bflGenerate({
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            n: imageCount,
            frameSize,
            style,
            isPublic,
            uploadedImages: combinedImages.map((u: string) => toAbsoluteFromProxy(u)),
          })).unwrap();

          // History is persisted by backend; no local completed entry needed
          // Ensure the parallel queue entry transitions to completed (this thunk doesn't touch generationSlice).
          if (generationId) {
            dispatch(updateActiveGeneration({
              id: generationId,
              updates: {
                status: 'completed',
                images: (result as any)?.images || [],
                historyId: (result as any)?.historyId,
              }
            }));
          }

          // Update the loading entry with completed data
          // dispatch(
          //   updateHistoryEntry({
          //     id: firebaseHistoryId || loadingEntry.id,
          //     updates: completedEntry,
          //   })
          // );

          // Server already finalized Firebase when historyId is provided

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();
          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } else {
          // Use regular BFL generation
          // Check if this is a flux-pro model that needs width/height conversion
          // Note: flux-pro, flux-pro-1.1, and flux-pro-1.1-ultra use width/height
          // flux-dev uses frameSize conversion (handled in API route)
          const isFluxProModel = selectedModel === "flux-pro-1.1" || selectedModel === "flux-pro-1.1-ultra" || selectedModel === "flux-pro";

          const promptAdjusted = adjustPromptImageNumbers(finalPrompt, getCombinedUploadedImages(), selectedCharacters);
          const combinedImages = getCombinedUploadedImages();
          let generationPayload: any = {
            prompt: `${promptAdjusted} [Style: ${style}]`,
            model: selectedModel,
            imageCount,
            frameSize,
            style,
            generationType: "text-to-image",
            uploadedImages: combinedImages,
            generationId,
          };

          // For GPT Image 1.5, add quality and output_format parameters
          if (selectedModel === 'openai/gpt-image-1.5') {
            generationPayload.quality = gptImage15Quality;
            // Map 'jpg' to 'jpeg' for API (GPT Image 1.5 uses 'jpeg' in schema)
            generationPayload.output_format = gptImage15OutputFormat === 'jpg' ? 'jpeg' : gptImage15OutputFormat;
          }

          // For flux-pro models, convert frameSize to width/height dimensions (but keep frameSize for history)
          if (isFluxProModel) {
            const dimensions = convertFrameSizeToFluxProDimensions(frameSize);
            generationPayload.width = dimensions.width;
            generationPayload.height = dimensions.height;
            console.log(`Flux Pro model detected: ${selectedModel}, using dimensions:`, dimensions);
            console.log(`Original frameSize: ${frameSize}, converted to: ${dimensions.width}x${dimensions.height}`);
            console.log(`Model type: ${selectedModel} - using width/height parameters for BFL API`);
          }

          const isQwenImageEdit = selectedModel === 'qwen-image-edit-2511' || selectedModel === 'qwen-image-edit';

          // Qwen image-edit specific parameters
          if (isQwenImageEdit) {
            generationPayload.aspect_ratio = frameSize;
            // FileTypeDropdown stores 'jpeg' but Qwen schema uses 'jpg'
            generationPayload.output_format = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
          }

          const result = await dispatch(
            generateImages(generationPayload)
          ).unwrap();

          // Persist source uploads for Qwen image-edit so the Preview Modal can show the input image(s)
          try {
            const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
            if (isQwenImageEdit && resultHistoryId && Array.isArray(combinedImages) && combinedImages.length > 0) {
              const inputImages = combinedImages.map((u: string, idx: number) => {
                const p = toZataPath(u);
                if (p) return { id: `input-${idx + 1}`, storagePath: p, url: toDirectUrl(p) };
                return { id: `input-${idx + 1}`, url: u };
              });
              await updateFirebaseHistory(resultHistoryId, { inputImages });
            }
          } catch {
            // best-effort only
          }

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...tempEntry,
              id: tempEntryId,
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            upsertLocalGeneratingEntry(completedEntry);
          } catch { }

          // History is persisted by backend; no local completed entry needed

          // Update the loading entry with completed data
          // dispatch(
          //   updateHistoryEntry({
          //     id: loadingEntry.id,
          //     updates: {
          //       ...completedEntry,
          //       frameSize: isFluxProModel ? `${generationPayload.width}x${generationPayload.height}` : frameSize,
          //     },
          //   })
          // );

          // Toast removed - useQueueManagement handles success toasts
          clearInputs();
          // Refresh only the single completed generation instead of reloading all
          const resultHistoryId = (result as any)?.historyId || firebaseHistoryId || generationId;
          console.log('[queue] Refreshing generation:', { resultHistoryId, resultHistoryIdFromAPI: (result as any)?.historyId, generationId });
          if (resultHistoryId) {
            await refreshSingleGeneration(resultHistoryId);
          } else {
            await refreshHistory();
          }

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        }

        // Reset local generation state on success
        setIsGeneratingLocally(false);
      }
    } catch (error) {
      console.error("Error generating images:", error);

      // Check if this is a FAL or Replicate error (has structured error details)
      const { extractFalErrorDetails } = await import('@/lib/falToast');
      const { extractReplicateErrorDetails } = await import('@/lib/replicateToast');
      const falErrorDetails = extractFalErrorDetails(error);
      const replicateErrorDetails = extractReplicateErrorDetails(error);
      const isFalError = falErrorDetails !== null;
      const isReplicateError = replicateErrorDetails !== null;

      // Get error message
      const errorMessage = falErrorDetails?.message ||
        replicateErrorDetails?.message ||
        (error && typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string' ? error.message : undefined) ||
        (error instanceof Error ? error.message : 'Failed to generate images');

      // Clear ONLY this generation's local entry on error (don't wipe other in-flight jobs)
      removeLocalGeneratingEntry(generationId || tempEntryId);
      setIsGeneratingLocally(false);
      postGenerationBlockRef.current = false;

      // If we have a Firebase ID, also update it there
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, {
            status: "failed",
            error: errorMessage,
          });
          console.log('✅ Firebase entry updated to failed status due to error');
        } catch (firebaseError) {
          console.error('❌ Failed to update Firebase entry to failed status:', firebaseError);
        }
      }

      // Handle credit failure
      if (transactionId) {
        await handleGenerationFailure(transactionId);
      }

      // Show error notification (skip if a Runway base_resp toast already shown)
      if (!runwayBaseRespToastShownRef.current) {
        if (isFalError) {
          // Use structured FAL error toast
          const { showFalErrorToast } = await import('@/lib/falToast');
          await showFalErrorToast(error, errorMessage);
        } else if (isReplicateError) {
          // Use structured Replicate error toast
          const { showReplicateErrorToast } = await import('@/lib/replicateToast');
          await showReplicateErrorToast(error, errorMessage);
        } else {
          // Use simple error toast for other errors
          toast.error(errorMessage);
        }
      }

      // Update active generation status on failure
      if (generationId) {
        dispatch(updateActiveGeneration({
          id: generationId,
          updates: {
            status: 'failed',
            error: errorMessage,
          }
        }));
      }

      // Reset local generation state immediately on error
      setIsGeneratingLocally(false);
      postGenerationBlockRef.current = false;
    } finally {
      // Release pagination block after short cooldown so compressed refreshes don't trigger immediate loadMore
      // Note: isGeneratingLocally and localGeneratingEntries are reset in catch block, so we don't need to reset here
      setTimeout(() => { postGenerationBlockRef.current = false; }, 2500);
      // Reset the base_resp toast guard for next run
      runwayBaseRespToastShownRef.current = false;
    }
  };

  // Handle manual prompt enhancement (button)
  const handleEnhancePrompt = async () => {
    if (isEnhancing) return;
    if (!prompt || !prompt.trim()) {
      toast('Please enter a prompt to enhance');
      return;
    }

    try {
      setIsEnhancing(true);
      // Explicitly pass 'image' as media type for image generation
      const res = await enhancePromptAPI(prompt, 'openai/gpt-4o', 'image');
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

        toast.success('Prompt enhanced');
      } else {
        toast.error(res.error || 'Failed to enhance prompt');
      }
    } catch (e: any) {
      console.error('Prompt enhancement error:', e);
      toast.error(e?.message || 'Failed to enhance prompt. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        !(event.target as HTMLElement).closest(".dropdown-container")
      ) {
        dispatch(toggleDropdown(""));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown, dispatch]);

  return (
    <>
      {/* Enhanced spell check styles and animations */}
      <style jsx global>{`
        /* Remove underline from placeholder across browsers */
        textarea::placeholder { text-decoration: none !important; }
        textarea::-webkit-input-placeholder { text-decoration: none !important; }
        textarea:-ms-input-placeholder { text-decoration: none !important; }
        textarea::-ms-input-placeholder { text-decoration: none !important; }
        
        /* Keep default browser spellcheck underlines without forcing decoration */
        textarea[spellcheck="true"] { text-decoration: none; }
        
        /* Placeholder for contentEditable */
        [contenteditable][data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.5);
          pointer-events: none;
        }
        
        /* Smooth fade-in-up animation for new generations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        /* Prevent layout shift - ensure flex items don't shrink or grow */
        .flex.flex-wrap > * {
          flex-shrink: 0 !important;
          flex-grow: 0 !important;
        }
        
        /* Simple fixed-size image containers */
        .image-item {
          width: 100%;
          aspect-ratio: 1;
          min-height: 165px;
          position: relative;
        }
        
        @media (min-width: 768px) {
          .image-item {
            width: 100%;
            aspect-ratio: 1;
          }
        }
        
        /* Simple grid layout - stable to prevent reflow */
        .image-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
          grid-auto-rows: auto;
        }
        
        @media (min-width: 768px) {
          .image-grid {
            grid-template-columns: repeat(5, 1fr);
            grid-auto-rows: auto;
            gap: 12px;
          }
        }
        
        @media (min-width: 1024px) {
          .image-grid {
            grid-template-columns: repeat(6, 1fr);
            grid-auto-rows: auto;
            gap: 4px;
          }
        }
        
        /* Allow dropdowns to overflow scrollable containers */
        .dropdown-container {
          overflow: visible !important;
          position: relative;
        }
        
        .dropdown-container > div[class*="absolute"] {
          position: absolute !important;
          z-index: 9999 !important;
        }
      `}</style>

      <div ref={scrollRootRef} className="inset-0 pl-0 md:pr-6   pb-6 overflow-y-auto no-scrollbar z-0">
        <div className="md:py-0  py-0 md:pl-4  ">
          {/* History Header - Fixed during scroll */}
          <div className="fixed top-0 left-0 right-0 z-30 md:py-0 py-2 md:ml-20 mr-1 backdrop-blur-lg shadow-xl md:pl-6 pl-12">
            <div className="flex items-center justify-between md:mb-2 mb-0">
              <div className="flex items-center gap-2">
                <h2 className="md:text-2xl text-md font-semibold text-white">Image Generation</h2>

                {/* Edit Button - Styled like Recent/Oldest */}

                {/* Info button - only show when there are generations */}
                {historyEntries.length > 0 && sortedDates.length > 0 && (
                  <button
                    onClick={() => setIsGuideModalOpen(true)}
                    className="relative group w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Show guide"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.9199 10.4384C10.9199 9.84191 11.4034 9.3584 11.9999 9.3584C12.5963 9.3584 13.0798 9.84191 13.0798 10.4384C13.0798 10.804 12.8988 11.1275 12.6181 11.3241C12.3474 11.5136 12.0203 11.7667 11.757 12.0846C11.4909 12.406 11.2499 12.8431 11.2499 13.3846C11.2499 13.7988 11.5857 14.1346 11.9999 14.1346C12.4141 14.1346 12.7499 13.7988 12.7499 13.3846C12.7499 13.3096 12.7806 13.2004 12.9123 13.0413C13.047 12.8786 13.2441 12.7169 13.4784 12.5528C14.1428 12.0876 14.5798 11.3141 14.5798 10.4384C14.5798 9.01348 13.4247 7.8584 11.9999 7.8584C10.575 7.8584 9.41992 9.01348 9.41992 10.4384C9.41992 10.8526 9.75571 11.1884 10.1699 11.1884C10.5841 11.1884 10.9199 10.8526 10.9199 10.4384Z" fill="#ffffff" />
                      <path d="M11.9991 14.6426C11.5849 14.6426 11.2491 14.9783 11.2491 15.3926C11.2491 15.8068 11.5849 16.1426 11.9991 16.1426C12.4134 16.1426 12.7499 15.8068 12.7499 15.3926C12.7499 14.9783 12.4134 14.6426 11.9991 14.6426Z" fill="#ffffff" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 4C7.58172 4 4 7.58172 4 12V20H12C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12C21.5 17.2467 17.2467 21.5 12 21.5H3.25C2.83579 21.5 2.5 21.1642 2.5 20.75V12Z" fill="#ffffff" />
                    </svg>
                    <div className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white/80 text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity z-50">
                      How To Use
                    </div>
                  </button>
                )}

                <button
                  onClick={() => router.push('/edit-image')}
                  className="flex items-center gap-1.5 px-2 py-1 md:py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border  border-white/10 text-white/100 transition-all"
                  aria-label="Edit Image"
                >
                  <Edit3 size={16} className="text-white fill-black" />
                  <span className="hidden md:block">Edit</span>
                </button>
              </div>

              {/* Desktop: Search, Sort, and Date controls - positioned at right end of Image Generation text */}
              <div className="hidden md:flex items-center pt-4 pr-4">
                <HistoryControls mode="image" />
              </div>
            </div>

          </div>

          {/* Mobile: Search, Sort, and Date controls */}
          <div className="flex md:hidden items-center justify-start px-2 gap-2 pb-0 mt-0">
            <HistoryControls mode="image" />
          </div>
        </div>

        {/* <div className="hidden md:flex items-center justify-end gap-2 md:mt-5 -mb-4">
              Search Input
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by prompt..."
                  className={`px-4 py-2 rounded-lg text-sm bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/10 focus:border-white/10 text-white placeholder-white/70 w-48 md:w-64 ${searchQuery ? 'pr-10' : ''}`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              Sort buttons
              <button
                onClick={() => setSortOrder('desc')}
                className={`relative group px-1 py-1 rounded-lg text-sm ${sortOrder === 'desc' && !dateRange.start ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
                aria-label="Newest"
              >
                <img src="/icons/upload-square-2 (1).svg" alt="Newest" className={`${(sortOrder === 'desc' && !dateRange.start) ? '' : 'invert'} w-6 h-6`} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Newest</span>
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`relative group px-1 py-1 rounded-lg text-sm ${sortOrder === 'asc' && !dateRange.start ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
                aria-label="Oldest"
              >
                <img src="/icons/download-square-2.svg" alt="Oldest" className={`${(sortOrder === 'asc' && !dateRange.start) ? '' : 'invert'} w-6 h-6`} />
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Oldest</span>
              </button>

              Date picker
              <div className="relative ml-0 flex items-center gap-2">
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={dateInput}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setDateInput(value);
                      if (!value) {
                        await refreshHistoryFromBackend({ dateRange: { start: null, end: null } });
                        return;
                      }
                      const d = new Date(value + 'T00:00:00');
                      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
                      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
                      await refreshHistoryFromBackend({ dateRange: { start, end } });
                    }}
                    style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0 }}
                  />
                  <button
                    onClick={() => {
                      const base = dateRange.start ? new Date(dateRange.start) : new Date();
                      setCalendarMonth(base.getMonth());
                      setCalendarYear(base.getFullYear());
                      setShowCalendar((v) => !v);
                    }}
                    className={`relative group px-1 py-1 rounded-lg text-sm ${(showCalendar || dateRange.start) ? 'bg-white ring-1 ring-white/5 text-black' : 'bg-white/10 hover:bg-white/20 text-white/80'}`}
                    aria-label="Date"
                  >
                    <img src="/icons/calendar-days.svg" alt="Date" className={`${(showCalendar || dateRange.start) ? '' : 'invert'} w-6 h-6`} />
                    <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Date</span>
                  </button>

                  {showCalendar && (
                    <div ref={calendarRef} className="absolute right-0 top-full mt-2 z-40 w-[280px] select-none bg-white/5 backdrop-blur-3xl rounded-xl ring-1 ring-white/20 shadow-2xl p-3">
                      <div className="flex items-center justify-between mb-2 text-white">
                        <button 
                          className="px-2 py-1 rounded hover:bg-white/10" 
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const prev = new Date(calendarYear, calendarMonth - 1, 1);
                            setCalendarYear(prev.getFullYear());
                            setCalendarMonth(prev.getMonth());
                          }}
                        >‹</button>
                        <div className="text-sm font-semibold">
                          {new Date(calendarYear, calendarMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                        <button 
                          className="px-2 py-1 rounded hover:bg-white/10" 
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            const next = new Date(calendarYear, calendarMonth + 1, 1);
                            setCalendarYear(next.getFullYear());
                            setCalendarMonth(next.getMonth());
                          }}
                        >›</button>
                      </div>
                      <div className="grid grid-cols-7 text-[11px] text-white/70 mb-1">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (<div key={d} className="text-center py-1">{d}</div>))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: calendarFirstWeekday }).map((_, i) => (
                          <div key={`pad-${i}`} className="h-8" />
                        ))}
                        {Array.from({ length: calendarDaysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const thisDate = new Date(calendarYear, calendarMonth, day);
                          const isSelected = !!dateRange.start && new Date(dateRange.start).toDateString() === thisDate.toDateString();
                          return (
                            <button
                              key={day}
                              className={`h-8 rounded text-sm text-center text-white hover:bg-white/15 ${isSelected ? 'bg-white/25 ring-1 ring-white/40' : 'bg-white/5'}`}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const start = new Date(thisDate.getFullYear(), thisDate.getMonth(), thisDate.getDate(), 0, 0, 0);
                                const end = new Date(thisDate.getFullYear(), thisDate.getMonth(), thisDate.getDate(), 23, 59, 59, 999);
                                setDateInput(thisDate.toISOString().slice(0, 10));
                                refreshHistoryFromBackend({ dateRange: { start, end } });
                                setShowCalendar(false);
                              }}
                            >{day}</button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <button className="text-white/80 text-sm px-2 py-1 rounded hover:bg-white/10" onClick={() => {
                          setDateInput('');
                          refreshHistoryFromBackend({ dateRange: { start: null, end: null } });
                          setShowCalendar(false);
                        }}>Clear</button>
                        <button className="text-white/90 text-sm px-2 py-1 rounded hover:bg-white/10" onClick={() => {
                          const now = new Date();
                          setCalendarMonth(now.getMonth());
                          setCalendarYear(now.getFullYear());
                        }}>Today</button>
                      </div>
                    </div>
                  )}
                  {dateRange.start && (
                    <button
                      className="px-1 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-md"
                      onClick={() => {
                        setDateInput('');
                        setDateRange({ start: null, end: null });
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div> */}

        {/* Spacer to keep content below fixed header */}

        {/* Initial loading overlay - show when loading OR before initial load attempt */}
        {/* CRITICAL FIX: Don't show full screen loader if we have active generations to show */}
        {(loading || !hasAttemptedInitialLoadRef.current) && historyEntries.length === 0 && activeGenerations.length === 0 && (
          <div className="fixed top-[64px] md:top-[64px]  left-0 right-0 md:left-[4.5rem] bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 px-4">
              <GifLoader size={72} alt="Loading" />
              <div className="text-white text-lg text-center">Loading generations...</div>
            </div>
          </div>
        )}

        {/* Filtering overlay - show when filtering/searching */}
        {isFiltering && (
          <div className="fixed top-[64px] left-0 right-0 md:left-[4.5rem] bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 px-4">
              <GifLoader size={72} alt="Filtering" />
              <div className="text-white text-lg text-center">Filtering generations...</div>
            </div>
          </div>
        )}

        {/* Sorting overlay - show when sorting changes */}
        {isSorting && (
          <div className="fixed top-[64px] left-0 right-0 md:left-[4.5rem] bottom-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 px-4">
              <GifLoader size={72} alt="Sorting" />
              <div className="text-white text-lg text-center">Loading {sortOrder === 'asc' ? 'oldest' : 'recent'} generations...</div>
            </div>
          </div>
        )}

        <div>
          {/* Show guide when no generations exist - ONLY after initial load attempt AND loading completes */}
          {hasAttemptedInitialLoadRef.current && !loading && !isFiltering && historyEntries.length === 0 && sortedDates.length === 0 && activeGenerations.length === 0 && (
            <ImageGenerationGuide />
          )}

          {/* Local preview: if no row for today yet, render a dated block so preview shows immediately */}
          {/* REMOVED: This section is now handled in the groupedByDate loop below to prevent duplicates */}

          {/* History Entries - Grouped by Date */}
          {sortedDates.length > 0 && (
            <div className=" space-y-4 md:px-0 px-2 md:mt-18 ">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-2 md:-mt-2">
                  {/* Date Header */}
                  <div className="flex items-center md:mx-8  md:gap-2 gap-2">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-white/60"
                      >
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-white/70">
                      {formatDate(date)}
                    </h3>
                  </div>

                  {/* All Images for this Date - Simple Grid with stable layout */}
                  <div className="image-grid md:ml-9 ml-0" key={`grid-${date}`}>
                    {/* Local entries are now merged into history entries below, so we don't render them separately here */}
                    {/* This prevents the "two frames" issue where local and history entries both render */}

                    {/* Render all entries for this date - includes both history and merged local entries */}
                    {(() => {
                      // Since local entries are now merged into groupedByDate, just render all entries
                      const allEntries = (groupedByDate as { [key: string]: HistoryEntry[] })[date] || [];

                      return allEntries.flatMap((entry: HistoryEntry) => {
                        const entryImages: any[] = Array.isArray((entry as any)?.images) ? ((entry as any).images as any[]) : [];
                        // Check if entry has ready images
                        const hasImages = entryImages.length > 0;
                        const hasReadyImages = hasImages && entry.images.some((img: any) =>
                          img?.url || img?.thumbnailUrl || img?.avifUrl || img?.originalUrl
                        );

                        return entryImages.map((image: any, imgIdx: number) => {
                          // Generate unique key: use image.id if available, otherwise use index
                          // This prevents duplicate keys when image.id is undefined
                          const uniqueImageKey = image?.id ? `${entry.id}-${image.id}` : `${entry.id}-img-${imgIdx}`;
                          const uniqueImageId = image?.id || `${entry.id}-img-${imgIdx}`;
                          const isImageLoaded = loadedImages.has(uniqueImageKey);

                          // CRITICAL FIX: Keep loading visible until image is actually loaded in browser
                          // This prevents the frame from disappearing during the transition
                          // For images that have URLs, check if they're loaded
                          const hasImageUrl = image?.thumbnailUrl || image?.avifUrl || image?.url;
                          // Show loading if:
                          // 1. Status is generating (always show loader)
                          // 2. Status is completed but image hasn't loaded yet (show shimmer/loader)
                          // 3. No image URL exists (placeholder from activeGenerations - show loader)
                          const isGeneratingStatus = (entry.status as string) === "generating" || (entry.status as string) === "pending";
                          const shouldShowLoading = isGeneratingStatus ||
                            (entry.status === "completed" && hasImageUrl && !isImageLoaded) ||
                            (!hasImageUrl && isGeneratingStatus);

                          // Check if this is a newly loaded entry for animation
                          // previousEntriesRef contains entries from PREVIOUS render (updated in useEffect after render)
                          // So if entry.id is NOT in previousEntriesRef, it's a new entry that should animate
                          const isNewEntry = !previousEntriesRef.current.has(entry.id);

                          return (
                            <div
                              key={uniqueImageKey}
                              data-image-id={uniqueImageId}
                              onClick={() => setPreview({ entry, image })}
                              className={`image-item rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 cursor-pointer group ${isNewEntry ? 'animate-fade-in-up' : ''
                                }`}
                              style={{
                                ...(isNewEntry ? {
                                  animation: 'fadeInUp 0.6s ease-out forwards',
                                  opacity: 0,
                                } : {}),
                              }}
                              onAnimationEnd={(e) => {
                                if (isNewEntry) {
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                            >
                              {/* Always render the image so onLoad can fire, but show loading overlay on top if needed */}
                              {entry.status === "failed" ? (
                                // Error frame
                                <div className="absolute inset-0 flex items-center justify-center bg-black/90" style={{ width: '100%', height: '100%' }}>
                                  <div className="flex flex-col items-center gap-2">
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="text-red-400"
                                    >
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>
                                    <div className="text-xs text-red-400">Failed</div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Image - always render so onLoad fires */}
                                  {hasImageUrl && (
                                    <div className="absolute inset-0 group">
                                      <img
                                        src={image.thumbnailUrl || image.avifUrl || image.url}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        onLoad={() => {
                                          setLoadedImages(prev => new Set(prev).add(uniqueImageKey));
                                        }}
                                      />
                                      {/* Shimmer loading effect - only show if image hasn't loaded yet */}
                                      {!isImageLoaded && (
                                        <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                      )}
                                      {/* Hover buttons overlay - Recreate on left, Copy/Delete on right */}
                                      <div className="pointer-events-none absolute bottom-1.5 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <button
                                          aria-label="Recreate image"
                                          className="pointer-events-auto p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                          onClick={(e) => handleRecreate(e, entry)}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          <Image src="/icons/recreate.svg" alt="Recreate" width={18} height={18} className="w-5 h-5" />
                                        </button>

                                      </div>
                                      <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-2">
                                        <button
                                          aria-label="Copy prompt"
                                          className="pointer-events-auto p-1 px-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                          onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                        </button>
                                        <button
                                          aria-label="Delete image"
                                          className="pointer-events-auto p-1.5 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                          onClick={(e) => handleDeleteImage(e, entry)}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Shimmer background for placeholders without images (persists on refresh) */}
                                  {!hasImageUrl && isGeneratingStatus && (
                                    <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                  )}

                                  {/* Loading overlay - show on top of image while loading */}
                                  {shouldShowLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10" style={{ width: '100%', height: '100%' }}>
                                      <div className="flex flex-col items-center gap-2">
                                        <GifLoader size={64} alt="Generating" />
                                        <div className="text-xs text-white/60 text-center">
                                          {isGeneratingStatus ? "Generating..." : "Loading..."}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                          );
                        });
                      });
                    })()}
                  </div>
                </div>
              ))}

              {/* Scroll pagination loading indicator */}
              {loading && historyEntries.length > 0 && (
                <div className="flex items-center justify-center pt-8 pb-48 md:pb-48">
                  <div className="flex flex-col items-center md:gap-3 gap-2">
                    <GifLoader size={80} alt="Loading more" />
                    <div className="text-white/70 md:text-lg text-sm">Loading more generations...</div>
                  </div>
                </div>
              )}


            </div>
          )}
          {/* Infinite scroll sentinel inside scroll container */}
          <div ref={sentinelRef} style={{ height: 24 }} />
        </div>
      </div>

      {/* Mobile-only: Selected images/characters grid above input box */}
      {(uploadedImages.length > 0 || selectedCharacters.length > 0) && (
        <div className="md:hidden fixed bottom-[200px] left-1/2 -translate-x-1/2 w-[97%] max-w-[97%] z-[49] px-2 pb-2">
          <div className="grid grid-cols-5 gap-1 max-h-[140px] overflow-y-auto">
            {/* Combine characters and images for display */}
            {[...selectedCharacters.map((char: any, idx: number) => ({ type: 'character', data: char, index: idx })), ...uploadedImages.map((img: string, idx: number) => ({ type: 'image', data: img, index: idx }))].slice(0, 10).map((item: any, idx: number) => {
              if (item.type === 'character') {
                return (
                  <div
                    key={`char-${item.data.id}`}
                    className="relative aspect-square rounded-md overflow-hidden ring-1 ring-white/20 group transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110"
                    title={`Character: ${item.data.name}`}
                  >
                    <img
                      src={item.data.frontImageUrl}
                      alt={item.data.name}
                      aria-hidden="true"
                      decoding="async"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                    />
                    <div className="pointer-events-none absolute -top-1 -left-1 z-10">
                      <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                        C
                      </div>
                    </div>
                    <button
                      aria-label={`Remove character ${item.data.name}`}
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(removeSelectedCharacter(item.data.id));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              } else {
                return (
                  <div
                    key={`img-${item.index}`}
                    data-image-index={item.index}
                    title={`Image ${item.index + 1}`}
                    className="relative aspect-square rounded-md overflow-hidden ring-1 ring-white/20 group transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110 cursor-pointer"
                    onClick={() => {
                      setAssetViewer({
                        isOpen: true,
                        assetUrl: item.data,
                        assetType: 'image',
                        title: `Uploaded Image ${item.index + 1}`
                      });
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.data}
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                    />
                    <div className="pointer-events-none absolute -top-1 -left-1 z-10">
                      <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                        {item.index + 1}
                      </div>
                    </div>
                    <button
                      aria-label="Remove reference"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = uploadedImages.filter(
                          (_: string, idx: number) => idx !== item.index
                        );
                        dispatch(setUploadedImages(next));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
      <div className="fixed md:bottom-6 bottom-1 left-1/2 -translate-x-1/2 md:w-[90%] w-[97%] md:max-w-[900px] max-w-[97%] z-[50] h-auto">
        <div
          className="relative rounded-lg md:rounded-b-lg bg-black/20 backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl md:p-3 md:pb-5 p-2 space-y-4 hover:ring-[#60a5fa]/40 hover:shadow-[0_0_50px_-12px_rgba(96,165,250,0.2)] transition-all duration-300"
          onMouseEnter={() => setIsInputBoxHovered(true)}
          onMouseLeave={() => setIsInputBoxHovered(false)}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsInputBoxHovered(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsInputBoxHovered(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsInputBoxHovered(false);

            // Handle Files (dragged from desktop/OS)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
              if (files.length === 0) return;

              const newUrls: string[] = [];
              for (const file of files) {
                const reader = new FileReader();
                const dataUrl: string = await new Promise((resolve) => {
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
                newUrls.push(dataUrl);
              }

              if (newUrls.length > 0) {
                dispatch(setUploadedImages([...uploadedImages, ...newUrls].slice(0, 4)));
                // Open assets viewer if needed or just show toast
                toast.success(`added ${newUrls.length} image(s)`);
              }
              return;
            }

            // Handle dragged logical items (URLs from within the app)
            const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
            if (url && (url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) || url.startsWith('data:image/'))) {
              dispatch(setUploadedImages([...uploadedImages, url].slice(0, 4)));
              toast.success('Image added');
            }
          }}
        >
          {/* Outline Glow Effect - shows on hover or when typing */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 transition-opacity duration-700 blur-xl pointer-events-none rounded-lg"
            style={{
              opacity: (prompt.trim() || isInputBoxHovered) ? 0.2 : 0
            }}
          ></div>
          {/* Top row: prompt + actions */}
          <div className="flex items-stretch md:gap-0 gap-0 relative z-10">
            <div className="flex-1 flex items-start md:gap-3 gap-0 bg-transparent rounded-lg  w-full relative md:min-h-[90px]">
              {/* ContentEditable with inline character tags - allows typing anywhere */}
              <div
                ref={contentEditableRef}
                contentEditable
                suppressContentEditableWarning
                data-prompt-editor="true"
                onInput={(e) => {
                  if (isUpdatingRef.current) return;

                  const div = e.currentTarget;

                  // Extract text content (including from tags)
                  let text = '';
                  const walker = document.createTreeWalker(
                    div,
                    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                    null
                  );

                  let node;
                  while (node = walker.nextNode()) {
                    if (node.nodeType === Node.TEXT_NODE) {
                      text += node.textContent || '';
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                      const el = node as Element;
                      if (el.classList.contains('character-tag')) {
                        const nameSpan = el.querySelector('span');
                        if (nameSpan) {
                          text += nameSpan.textContent || '';
                        }
                      } else {
                        // For other elements, get text content
                        text += el.textContent || '';
                      }
                    }
                  }

                  // Clean duplicates
                  const cleanedText = text.replace(/(@\w+)(\s*\1)+/g, '$1');

                  // Update state
                  isUpdatingRef.current = true;
                  dispatch(setPrompt(cleanedText));

                  // Adjust height
                  div.style.height = 'auto';
                  div.style.height = Math.min(div.scrollHeight, 96) + 'px';

                  // Re-render tags after a short delay to ensure they're visible
                  setTimeout(() => {
                    isUpdatingRef.current = false;
                    // Check if tags need to be re-rendered
                    const hasTags = div.querySelector('.character-tag');
                    const shouldHaveTags = selectedCharacters.length > 0 && cleanedText.match(/@\w+/);
                    if (!hasTags && shouldHaveTags) {
                      updateContentEditable();
                    }
                  }, 100);
                }}
                onKeyDown={(e) => {
                  // Allow normal typing, but prevent deleting tags directly
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    const div = e.currentTarget;
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      let node: Node | null = range.startContainer;

                      while (node && node !== div) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const el = node as Element;
                          if (el.classList.contains('character-tag')) {
                            // If cursor is at start of tag, move before it
                            if (e.key === 'Backspace') {
                              e.preventDefault();
                              const textNode = document.createTextNode('');
                              div.insertBefore(textNode, el);
                              range.setStartBefore(textNode);
                              range.collapse(true);
                              selection.removeAllRanges();
                              selection.addRange(range);
                              return;
                            }
                            // If cursor is at end of tag, move after it
                            if (e.key === 'Delete') {
                              e.preventDefault();
                              const textNode = document.createTextNode('');
                              div.insertBefore(textNode, el.nextSibling);
                              range.setStartAfter(textNode);
                              range.collapse(true);
                              selection.removeAllRanges();
                              selection.addRange(range);
                              return;
                            }
                          }
                        }
                        node = node.parentNode;
                      }
                    }
                  }
                }}
                onPaste={async (e) => {
                  // Check for files first
                  if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                    const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
                    if (files.length > 0) {
                      e.preventDefault();
                      const newUrls: string[] = [];
                      for (const file of files) {
                        const reader = new FileReader();
                        const dataUrl: string = await new Promise((resolve) => {
                          reader.onload = () => resolve(reader.result as string);
                          reader.readAsDataURL(file);
                        });
                        newUrls.push(dataUrl);
                      }
                      if (newUrls.length > 0) {
                        dispatch(setUploadedImages([...uploadedImages, ...newUrls].slice(0, 4)));
                        toast.success(`Pasted ${newUrls.length} image(s)`);
                      }
                      return;
                    }
                  }

                  e.preventDefault();
                  const text = e.clipboardData.getData('text/plain');
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(text);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  // Trigger input event
                  const inputEvent = new Event('input', { bubbles: true });
                  e.currentTarget.dispatchEvent(inputEvent);
                }}
                className={`flex-1 -mb-4 md:pr-0 pr-1 md:min-w-[200px] min-w-[150px] bg-transparent text-white placeholder-white/50 outline-none md:text-[13px] font-thin text-[11px] leading-relaxed overflow-y-auto transition-all duration-200 ${!prompt && selectedCharacters.length === 0 ? 'text-white/70' : 'text-white'} ${isEnhancing ? 'animate-text-shine' : ''}
                  }`}
                style={{
                  minHeight: '100px',
                  maxHeight: '96px',
                  lineHeight: '1.2',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
                data-placeholder={!prompt && selectedCharacters.length === 0 ? "Type your prompt..." : ""}
              />
              {/* Enhancement overlay removed - text shines instead */}
              {/* Fixed position buttons container */}
              <div className="flex md:flex-row flex-row -mb-6  md:items-center items-start md:gap-2  gap-1 flex-shrink-0">
                {/* Clear prompt button - only show when there's text */}
                {prompt.trim() && (
                  <div className="relative group">
                    <button
                      onClick={() => {
                        // Clear prompt when user explicitly clicks the clear button
                        dispatch(setPrompt(''));
                        // Also clear the contentEditable element
                        if (contentEditableRef.current) {
                          contentEditableRef.current.textContent = '';
                        }
                        // Focus the input after clearing
                        if (inputEl.current) {
                          inputEl.current.focus();
                        }
                      }}
                      className="px-1 py-1 md:-mt-5 mt-1 md:mx-0 ml-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors duration-200 flex items-center gap-1.5"
                      aria-label="Clear prompt"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white/80"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-6 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20  text-white/100 backdrop-blur-3xl shadow-3xl text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Clear Prompt</div>
                  </div>
                )}
                {/* Desktop-only: Previews just to the left of upload */}

                {/* Mobile: Single column on right | Desktop: Horizontal row */}
                <div className="relative flex flex-col md:flex-row items-end md:items-center gap-2 self-start pt-1 pb-4 pr-1">
                  {/* Enhance prompt button (manual trigger) */}
                  <div className="relative">
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing || !prompt.trim()}
                      type="button"
                      className="p-1.25 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-0 peer"
                      aria-pressed={isEnhancing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <path d="M12 2l1.9 4.2L18 8l-4.1 1.8L12 14l-1.9-4.2L6 8l4.1-1.8L12 2z" fill="currentColor" opacity="0.95" />
                        <path d="M3 13l2 1-2 1 1 2-1 2 2-1 1 2 0-2 2 0-1-2 2-1-2-1 1-2-2 1-1-2-1 2z" fill="currentColor" opacity="0.6" />
                      </svg>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Enhance Prompt</div>
                  </div>

                  <div className="relative">
                    <button
                      className="p-0.75 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-0 peer"
                      onClick={() => setIsCharacterModalOpen(true)}
                      type="button"
                      aria-label="Upload character"
                    >
                      <Image src="/icons/character.svg" alt="Attach" width={16} height={16} className="opacity-100 w-6 h-6" />
                      <span className="text-white text-sm"> </span>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Upload Character</div>
                  </div>

                  <div className="relative">
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-0 peer"
                      onClick={() => setIsUploadOpen(true)}
                      type="button"
                      aria-label="Upload image"
                    >
                      <Image src="/icons/fileupload.svg" alt="Attach" width={18} height={18} className="opacity-100" />
                      <span className="text-white text-sm"> </span>
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">Upload Image</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed position Generate button - Desktop only */}
            <div className="absolute bottom-[-50px] right-0 hidden md:flex flex-col items-end gap-2 z-20">
              {error && <div className="text-red-500 text-xs">{error}</div>}
              {expectedCredits > 0 && (
                <div className="text-[11px] text-white/70">
                  Cost: {formatCredits(expectedCredits)} credits
                </div>
              )}
              <button
                onClick={async () => {
                  try {
                    // Check parallel generation limit (only counting running ones)
                    if (runningGenerationsCount >= 4) {
                      toast.error('Queue full (4/4 active). Please wait for a generation to complete.');
                      return;
                    }

                    // Create tracking ID (visual only for now as handleGenerate manages internal state)
                    // This allows us to show the card immediately in the panel
                    const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;

                    // Add to active generations queue immediately
                    console.log('[queue] Adding new generation to queue:', { generationId, model: selectedModel, prompt: prompt.slice(0, 50) });
                    dispatch(addActiveGeneration({
                      id: generationId,
                      prompt: prompt,
                      model: selectedModel,
                      status: 'pending',
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      params: {
                        imageCount,
                        frameSize,
                        style,
                        uploadedImages: getCombinedUploadedImages()
                      }
                    }));

                    // Trigger the actual generation logic (fire and forget to not block button)
                    handleGenerate(generationId);
                  } catch (e) {
                    console.error('Failed to start generation:', e);
                  }
                }}
                disabled={!prompt.trim() || runningGenerationsCount >= 4 || isEnhancing}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white px-4 py-2 rounded-lg text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
                aria-busy={isEnhancing}
              >
                {isEnhancing ? 'Enhancing...' : runningGenerationsCount >= 4 ? 'Queue Full' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Bottom row: pill options */}
          {(uploadedImages.length > 0 || selectedCharacters.length > 0) && (
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto overflow-y-hidden max-w-[100vw] md:max-w-none pr-1 no-scrollbar mb-1">
              {/* Selected Characters Preview */}
              {selectedCharacters.map((character: any) => (
                <div
                  key={character.id}
                  className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group flex-shrink-0 transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110"
                  title={`Character: ${character.name}`}
                >
                  <img
                    src={character.frontImageUrl}
                    alt={character.name}
                    aria-hidden="true"
                    decoding="async"
                    className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                  />
                  <div className="pointer-events-none absolute -top-1 -left-1 z-10">
                    <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                      C
                    </div>
                  </div>
                  <button
                    aria-label={`Remove character ${character.name}`}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(removeSelectedCharacter(character.id));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {/* Uploaded Images Preview */}
              {uploadedImages.map((u: string, i: number) => {
                const count = uploadedImages.length;
                const sizeClass = count >= 9 ? 'w-12 h-12' : count >= 6 ? 'w-12 h-12' : 'w-12 h-12';
                return (
                  <div
                    key={i}
                    data-image-index={i}
                    title={`Image ${i + 1} (index ${i})`}
                    className={`relative ${sizeClass} rounded-md overflow-hidden ring-1 ring-white/20 group flex-shrink-0 transition-transform duration-200 hover:z-20 group-hover:z-20 hover:scale-110 cursor-pointer`}
                    onClick={() => {
                      setAssetViewer({
                        isOpen: true,
                        assetUrl: u,
                        assetType: 'image',
                        title: `Uploaded Image ${i + 1}`
                      });
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u}
                      alt=""
                      aria-hidden="true"
                      decoding="async"
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                    />
                    {/* Number badge (1-based display, zero-based in payload order) */}
                    <div className="pointer-events-none absolute -top-1 -left-1 z-10">
                      <div className="px-1 pl-1.5 pt-1 pb-0.5 rounded-md text-[8px] font-semibold bg-white/90 text-black shadow">
                        {i + 1}
                      </div>
                    </div>
                    <button
                      aria-label="Remove reference"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 drop-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = uploadedImages.filter(
                          (_: string, idx: number) => idx !== i
                        );
                        dispatch(setUploadedImages(next));
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-1 pt-0">
            {/* Mobile/Tablet: First row - Model dropdown and Generate button */}

            <div className="flex items-center justify-between gap-3 md:hidden w-full">
              <div className="flex-1">
                <ModelsDropdown />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              {expectedCredits > 0 && (
                <div className="text-[11px] text-white/70 whitespace-nowrap">
                  {formatCredits(expectedCredits)} credits
                </div>
              )}
              <button
                onClick={async () => {
                  try {
                    // Check parallel generation limit (only counting running ones)
                    if (runningGenerationsCount >= 4) {
                      toast.error('Queue full (4/4 active). Please wait.');
                      return;
                    }

                    const generationId = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;

                    dispatch(addActiveGeneration({
                      id: generationId,
                      prompt: prompt,
                      model: selectedModel,
                      status: 'pending',
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      params: {
                        imageCount,
                        frameSize,
                        style,
                        uploadedImages: getCombinedUploadedImages()
                      }
                    }));

                    handleGenerate(generationId);
                  } catch (e) {
                    console.error('Failed to start generation:', e);
                  }
                }}
                disabled={!prompt.trim() || runningGenerationsCount >= 4 || isEnhancing}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white md:px-6 px-4 md:py-2.5 py-1.5 rounded-lg md:text-[15px] text-[13px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)] flex-shrink-0"
                aria-busy={isEnhancing}
              >
                {isEnhancing ? 'Enhancing...' : runningGenerationsCount >= 4 ? 'Queue Full' : runningGenerationsCount > 0 ? `Generate (${runningGenerationsCount}/4)` : 'Generate'}
              </button>
            </div>

            {/* Mobile/Tablet: Second row - Other dropdowns */}
            <div className="flex flex-nowrap items-center gap-2 md:hidden w-full overflow-x-auto no-scrollbar relative" style={{ zIndex: 70 }}>
              <ImageCountDropdown />
              <FrameSizeDropdown />
              <StyleSelector />
              <LucidOriginOptions />
              <PhoenixOptions />
              <FileTypeDropdown />
              {selectedModel === 'google/nano-banana-pro' && (
                <div className="flex items-center gap-2 relative">
                  <ResolutionDropdown
                    resolution={nanoBananaProResolution}
                    onResolutionChange={(val) => setNanoBananaProResolution(val as '1K' | '2K' | '4K')}
                    options={['1K', '2K', '4K']}
                    dropdownId="nanoBananaProResolution"
                  />
                </div>
              )}
              {selectedModel === 'flux-2-pro' && (
                <div className="flex items-center gap-2 relative">
                  <ResolutionDropdown
                    resolution={flux2ProResolution}
                    onResolutionChange={(val) => setFlux2ProResolution(val as '1K' | '2K')}
                    options={['1K', '2K']}
                    dropdownId="flux2ProResolution"
                  />
                </div>
              )}
              {selectedModel === 'seedream-4.5' && (
                <div className="flex items-center gap-2 relative">
                  <ResolutionDropdown
                    resolution={seedream45Resolution}
                    onResolutionChange={(val) => setSeedream45Resolution(val as '2K' | '4K')}
                    options={['2K', '4K']}
                    dropdownId="seedream45Resolution"
                  />
                </div>
              )}
              {selectedModel === 'seedream-v4' && (
                <div className="flex items-center gap-2 relative">
                  <ResolutionDropdown
                    resolution={seedreamSize}
                    onResolutionChange={(val) => setSeedreamSize(val as '1K' | '2K' | '4K' | 'custom')}
                    options={['1K', '2K', '4K', 'custom']}
                    dropdownId="seedreamSize"
                  />
                  {seedreamSize === 'custom' && (
                    <>
                      <input
                        type="number"
                        min={1024}
                        max={4096}
                        value={seedreamWidth}
                        onChange={(e) => setSeedreamWidth(Number(e.target.value) || 2048)}
                        placeholder="Width"
                        className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                      />
                      <input
                        type="number"
                        min={1024}
                        max={4096}
                        value={seedreamHeight}
                        onChange={(e) => setSeedreamHeight(Number(e.target.value) || 2048)}
                        placeholder="Height"
                        className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                      />
                    </>
                  )}
                </div>
              )}
              {selectedModel === 'new-turbo-model' && (
                <div className="flex items-center gap-2 relative">
                  <ZTurboOutputFormatDropdown
                    outputFormat={zTurboOutputFormat}
                    onOutputFormatChange={(val) => setZTurboOutputFormat(val)}
                    dropdownId="zTurboOutputFormat"
                  />
                </div>
              )}
              {selectedModel === 'openai/gpt-image-1.5' && (
                <>
                  <div className="flex items-center gap-2 relative">
                    <QualityDropdown
                      quality={gptImage15Quality}
                      onQualityChange={(val) => setGptImage15Quality(val as 'low' | 'medium' | 'high' | 'auto')}
                      dropdownId="gptImage15Quality"
                    />
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <ZTurboOutputFormatDropdown
                      outputFormat={gptImage15OutputFormat}
                      onOutputFormatChange={(val) => setGptImage15OutputFormat(val)}
                      dropdownId="gptImage15OutputFormat"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Desktop: All dropdowns in one row */}
            <div className="hidden md:flex flex-wrap items-center gap-3 flex-1 min-w-0 justify-between">
              <div className="flex items-center gap-3 -mb-2">
                <ModelsDropdown />
                <ImageCountDropdown />
                <FrameSizeDropdown />
                <StyleSelector />
                <LucidOriginOptions />
                <PhoenixOptions />
                <FileTypeDropdown />
                {selectedModel === 'google/nano-banana-pro' && (
                  <div className="flex items-center gap-2 relative">
                    <ResolutionDropdown
                      resolution={nanoBananaProResolution}
                      onResolutionChange={(val) => setNanoBananaProResolution(val as '1K' | '2K' | '4K')}
                      options={['1K', '2K', '4K']}
                      dropdownId="nanoBananaProResolution"
                    />
                  </div>
                )}
                {selectedModel === 'flux-2-pro' && (
                  <div className="flex items-center gap-2 relative">
                    <ResolutionDropdown
                      resolution={flux2ProResolution}
                      onResolutionChange={(val) => setFlux2ProResolution(val as '1K' | '2K')}
                      options={['1K', '2K']}
                      dropdownId="flux2ProResolution"
                    />
                  </div>
                )}
                {selectedModel === 'seedream-4.5' && (
                  <div className="flex items-center gap-2 relative">
                    <ResolutionDropdown
                      resolution={seedream45Resolution}
                      onResolutionChange={(val) => setSeedream45Resolution(val as '2K' | '4K')}
                      options={['2K', '4K']}
                      dropdownId="seedream45Resolution"
                    />
                  </div>
                )}
                {selectedModel === 'seedream-v4' && (
                  <div className="flex items-center gap-2 relative">
                    <ResolutionDropdown
                      resolution={seedreamSize}
                      onResolutionChange={(val) => setSeedreamSize(val as '1K' | '2K' | '4K' | 'custom')}
                      options={['1K', '2K', '4K', 'custom']}
                      dropdownId="seedreamSize"
                    />
                    {seedreamSize === 'custom' && (
                      <>
                        <input
                          type="number"
                          min={1024}
                          max={4096}
                          value={seedreamWidth}
                          onChange={(e) => setSeedreamWidth(Number(e.target.value) || 2048)}
                          placeholder="Width"
                          className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                        />
                        <input
                          type="number"
                          min={1024}
                          max={4096}
                          value={seedreamHeight}
                          onChange={(e) => setSeedreamHeight(Number(e.target.value) || 2048)}
                          placeholder="Height"
                          className="h-[32px] w-24 px-3 rounded-lg text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                        />
                      </>
                    )}
                  </div>
                )}
                {selectedModel === 'new-turbo-model' && (
                  <div className="flex items-center gap-2 relative">
                    <ZTurboOutputFormatDropdown
                      outputFormat={zTurboOutputFormat}
                      onOutputFormatChange={(val) => setZTurboOutputFormat(val)}
                      dropdownId="zTurboOutputFormat"
                    />
                  </div>
                )}
                {selectedModel === 'openai/gpt-image-1.5' && (
                  <>
                    <div className="flex items-center gap-2 relative">
                      <QualityDropdown
                        quality={gptImage15Quality}
                        onQualityChange={(val) => setGptImage15Quality(val as 'low' | 'medium' | 'high' | 'auto')}
                        dropdownId="gptImage15Quality"
                      />
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <ZTurboOutputFormatDropdown
                        outputFormat={gptImage15OutputFormat}
                        onOutputFormatChange={(val) => setGptImage15OutputFormat(val)}
                        dropdownId="gptImage15OutputFormat"
                      />
                    </div>
                  </>
                )}
                {/* Qwen Image Edit: no extra advanced controls */}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* sentinel moved inside scroll container */}
      {/* Lazy loaded modals - only render when needed for better performance */}
      {preview && <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />}

      {/* Asset Viewer Modal for uploaded assets */}
      <AssetViewerModal
        isOpen={assetViewer.isOpen}
        onClose={() => setAssetViewer(prev => ({ ...prev, isOpen: false }))}
        assetUrl={assetViewer.assetUrl}
        assetType={assetViewer.assetType}
        title={assetViewer.title}
      />
      {isUpscaleOpen && <UpscalePopup isOpen={isUpscaleOpen} onClose={() => setIsUpscaleOpen(false)} defaultImage={uploadedImages[0] || null} onCompleted={refreshAllHistory} />}
      {isRemoveBgOpen && <RemoveBgPopup isOpen={isRemoveBgOpen} onClose={() => setIsRemoveBgOpen(false)} defaultImage={uploadedImages[0] || null} onCompleted={refreshAllHistory} />}
      {isEditOpen && (
        <EditPopup
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onUpscale={() => setIsUpscaleOpen(true)}
          onRemoveBg={() => setIsRemoveBgOpen(true)}
          onResize={() => {
            // Open frame size dropdown programmatically (optional improvement)
            const dropdown = document.querySelector('[data-frame-size-dropdown]') as HTMLElement | null;
            if (dropdown) dropdown.click();
          }}
        />
      )}

      {/* Upload Modal - Lazy loaded */}
      {isUploadOpen && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          remainingSlots={Math.max(0, 10 - (uploadedImages?.length || 0))}
          onAdd={(urls: string[]) => {
            try {
              const next = [...(uploadedImages || []), ...urls];
              dispatch(setUploadedImages(next.slice(0, 10)));
            } catch { }
          }}
        />
      )}

      {/* Character Modal - Lazy loaded */}
      {isCharacterModalOpen && (
        <CharacterModal
          isOpen={isCharacterModalOpen}
          onClose={() => setIsCharacterModalOpen(false)}
          onAdd={(character: Character) => {
            try {
              dispatch(addSelectedCharacter(character));
            } catch { }
          }}
          onRemove={(characterId: string) => {
            try {
              dispatch(removeSelectedCharacter(characterId));
            } catch { }
          }}
          selectedCharacters={selectedCharacters}
          maxCharacters={10}
        />
      )}

      {/* Guide Modal - shows when info button is clicked */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={() => setIsGuideModalOpen(false)}
          />
          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-[1500px]  max-h-[90vh] overflow-y-auto bg-transparent rounded-xl">
            {/* Close Button */}
            <button
              onClick={() => setIsGuideModalOpen(false)}
              className="absolute md:top-4 top-0 md:right-4 right-2 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close guide"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            {/* Guide Content */}
            <ImageGenerationGuide />
          </div>
        </div>
      )}
    </>
  );
};

export default InputBox;