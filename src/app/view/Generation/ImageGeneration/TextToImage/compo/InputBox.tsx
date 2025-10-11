"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import Image from "next/image";
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
import RemoveBgPopup from "./RemoveBgPopup";
import EditPopup from "./EditPopup";

import {
  setPrompt,
  generateImages,
  generateMiniMaxImages,
  setUploadedImages,
  setSelectedModel,
} from "@/store/slices/generationSlice";
import { runwayGenerate, runwayStatus, bflGenerate, falGenerate, replicateGenerate } from "@/store/slices/generationsApi";
import { toggleDropdown, addNotification } from "@/store/slices/uiSlice";
import {
  loadMoreHistory,
  loadHistory,
} from "@/store/slices/historySlice";
import toast from 'react-hot-toast';
// Frontend history writes removed; rely on backend history service
const updateFirebaseHistory = async (_id: string, _updates: any) => { };
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
// No-op action creators to satisfy existing dispatch calls without affecting store
const updateHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);
const addHistoryEntry = (_: any) => ({ type: 'history/noop' } as any);

// Import the new components
import ModelsDropdown from "./ModelsDropdown";
import ImageCountDropdown from "./ImageCountDropdown";
import FrameSizeDropdown from "./FrameSizeDropdown";
import StyleSelector from "./StyleSelector";
import ImagePreviewModal from "./ImagePreviewModal";
import UpscalePopup from "./UpscalePopup";
import { waitForRunwayCompletion } from "@/lib/runwayService";
import { uploadGeneratedImage } from "@/lib/imageUpload";
import { getIsPublic } from '@/lib/publicFlag';
import { Button } from "@/components/ui/Button";
import { useGenerationCredits } from "@/hooks/useCredits";
import axiosInstance from "@/lib/axiosInstance";

const InputBox = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    image: any;
  } | null>(null);
  const [isUpscaleOpen, setIsUpscaleOpen] = useState(false);
  const [isRemoveBgOpen, setIsRemoveBgOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const inputEl = useRef<HTMLTextAreaElement>(null);
  // Local, ephemeral entry to mimic history-style preview while generating
  const [localGeneratingEntries, setLocalGeneratingEntries] = useState<HistoryEntry[]>([]);
  
  // Local state to track generation status for button text
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);
  // Track if we've already shown a Runway base_resp toast to avoid duplicates
  const runwayBaseRespToastShownRef = useRef(false);

  // Auto-clear local preview after it has completed/failed and backend history refresh kicks in
  useEffect(() => {
    const entry = localGeneratingEntries[0] as any;
    if (!entry) return;
    if (entry.status === 'completed' || entry.status === 'failed') {
      const timer = setTimeout(() => setLocalGeneratingEntries([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [localGeneratingEntries]);

  // Prefill uploaded image and prompt from query params (?image=, ?prompt=, ?sp=, ?model=, ?frame=, ?style=)
  useEffect(() => {
    try {
      const current = new URL(window.location.href);
      const img = current.searchParams.get('image');
      const sp = current.searchParams.get('sp');
      const prm = current.searchParams.get('prompt');
      const mdl = current.searchParams.get('model');
      const frm = current.searchParams.get('frame');
      const sty = current.searchParams.get('style');
      if (sp) {
        const proxied = `/api/proxy/resource/${encodeURIComponent(sp)}`;
        dispatch(setUploadedImages([proxied] as any));
      } else if (img) {
        dispatch(setUploadedImages([img] as any));
      }
      if (prm) dispatch(setPrompt(prm));
      if (mdl) {
        const mapIncomingModel = (m: string): string => {
          if (!m) return m;
          // Normalize known backend → UI mappings
          if (m === 'bytedance/seedream-4') return 'seedream-v4';
          return m;
        };
        dispatch(setSelectedModel(mapIncomingModel(mdl)));
      }
      if (frm) {
        try { (dispatch as any)({ type: 'generation/setFrameSize', payload: frm }); } catch {}
      }
      if (sty) {
        try { (dispatch as any)({ type: 'generation/setStyle', payload: sty }); } catch {}
      }
      // Consume params once so a refresh doesn't keep the image selected
      if (img || prm || sp || mdl || frm || sty) {
        current.searchParams.delete('image');
        current.searchParams.delete('prompt');
        current.searchParams.delete('sp');
        current.searchParams.delete('model');
        current.searchParams.delete('frame');
        current.searchParams.delete('style');
        window.history.replaceState({}, '', current.toString());
      }
    } catch {}
  }, [dispatch, searchParams]);

  // Helper function to get clean prompt without style
  const getCleanPrompt = (promptText: string): string => {
    return promptText.replace(/\[\s*Style:\s*[^\]]+\]/i, "").trim();
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
  const downloadImage = async (url: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "generated-image.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      // Fallback to direct download
      const a = document.createElement("a");
      a.href = url;
      a.download = "generated-image.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
      } catch {}
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
  const refreshAllHistory = async () => {
    try {
      await (dispatch as any)(loadHistory({ filters: { generationType: 'text-to-image' }, paginationParams: { limit: 50 } })).unwrap();
    } catch { }
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
  const isGenerating = useAppSelector(
    (state: any) => state.generation?.isGenerating || false
  );
  const error = useAppSelector((state: any) => state.generation?.error);
  const activeDropdown = useAppSelector(
    (state: any) => state.ui?.activeDropdown
  );
  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore || false);
  const [page, setPage] = useState(1);

  // Seedream-specific UI state
  const [seedreamSize, setSeedreamSize] = useState<'1K' | '2K' | '4K' | 'custom'>('2K');
  const [seedreamWidth, setSeedreamWidth] = useState<number>(2048);
  const [seedreamHeight, setSeedreamHeight] = useState<number>(2048);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false);

  // Memoize the filtered entries and group by date
  const historyEntries = useAppSelector(
    (state: any) => {
      const allEntries = state.history?.entries || [];
      // Show all text-to-image generations. Avoid filtering by prompt keywords
      // so valid text-to-image generations (that happen to mention logo/sticker/product)
      // are not accidentally hidden.
      const filteredEntries = allEntries.filter((entry: any) =>
        entry.generationType === 'text-to-image'
      );
      console.log('🖼️ Image Generation - All entries:', allEntries.length);
      console.log('🖼️ Image Generation - Filtered entries:', filteredEntries.length);
      console.log('🖼️ Image Generation - Current page:', page);
      console.log('🖼️ Image Generation - Has more:', hasMore);
      return filteredEntries;
    },
    // Use shallowEqual to prevent unnecessary rerenders
    shallowEqual
  );

  // Sentinel element at bottom of list (place near end of render)

  // Group entries by date
  const groupedByDate = historyEntries.reduce((groups: { [key: string]: HistoryEntry[] }, entry: HistoryEntry) => {
    const date = new Date(entry.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );
  // Today key in the same format used for grouping
  const todayKey = new Date().toDateString();
  const theme = useAppSelector((state: any) => state.ui?.theme || "dark");
  const uploadedImages = useAppSelector(
    (state: any) => state.generation?.uploadedImages || []
  );

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
  });

  // Function to clear input after successful generation
  const clearInputs = () => {
    setUploadedImages([]);
    // Reset file input
    if (inputEl.current) {
      inputEl.current.value = "";
    }
  };

  // Function to auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Auto-adjust height when prompt changes
  useEffect(() => {
    if (inputEl.current) {
      adjustTextareaHeight(inputEl.current);
    }
  }, [prompt]);



  // Mark when the user has actually scrolled (to avoid auto-draining pages on initial mount)
  useEffect(() => {
    const onAnyScroll = () => {
      hasUserScrolledRef.current = true;
    };
    const historyContainer = document.querySelector('.overflow-y-auto');
    window.addEventListener('scroll', onAnyScroll, { passive: true });
    if (historyContainer) historyContainer.addEventListener('scroll', onAnyScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onAnyScroll as any);
      if (historyContainer) historyContainer.removeEventListener('scroll', onAnyScroll as any);
    };
  }, []);

  // IntersectionObserver-based infinite scroll (prevents repeated triggers)
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      // Require a user scroll before we begin auto-paginating
      if (!hasUserScrolledRef.current) {
        console.log('🖼️ IO: skip loadMore until user scrolls');
        return;
      }
      if (!hasMore || loading || loadingMoreRef.current) {
        console.log('🖼️ IO: skip loadMore', { hasMore, loading, busy: loadingMoreRef.current });
        return;
      }
      loadingMoreRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      console.log('🖼️ IO: loadMore start', { nextPage });
      try {
        await (dispatch as any)(loadMoreHistory({
          filters: { generationType: 'text-to-image' },
          paginationParams: { limit: 10 }
        })).unwrap();
      } catch (e) {
        console.error('🖼️ IO: loadMore error', e);
      } finally {
        loadingMoreRef.current = false;
      }
    }, { root: null, rootMargin: '0px', threshold: 0.1 });
    observer.observe(el);
    console.log('🖼️ IO: observer attached');
    return () => {
      observer.disconnect();
      console.log('🖼️ IO: observer disconnected');
    };
  }, [hasMore, loading, page, dispatch]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    // Set local generation state immediately
    setIsGeneratingLocally(true);

    // Clear any previous credit errors
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const creditResult = await validateAndReserveCredits();
      transactionId = creditResult.transactionId;
      console.log('✅ Credits reserved for image generation:', creditResult);
    } catch (creditError: any) {
      console.error('❌ Credit validation failed:', creditError);
      toast.error(creditError.message || 'Insufficient credits for generation');
      return;
    }

    // Create a local history-style loading entry that mirrors the Logo flow
    const tempEntryId = `loading-${Date.now()}`;
    const tempEntry: HistoryEntry = {
      id: tempEntryId,
      prompt,
      model: selectedModel,
      generationType: 'text-to-image',
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
    setLocalGeneratingEntries([tempEntry]);

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

        // 🔥 FIREBASE SAVE FLOW FOR RUNWAY MODELS:
        // 1. Create initial Firebase entry with 'generating' status
        // 2. Update Firebase with progress as images complete
        // 3. Update Firebase with final 'completed' or 'failed' status
        // 4. All updates include images, metadata, and status
        // 5. Error handling updates both Redux and Firebase
        // 6. Firebase ID is used consistently throughout the process

        try {
          firebaseHistoryId = await saveHistoryEntry({
            prompt: prompt,
            model: selectedModel,
            generationType: "text-to-image",
            images: [],
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: imageCount,
            status: 'generating',
            frameSize,
            style
          });
          console.log('✅ Firebase history entry created with ID:', firebaseHistoryId);
          console.log('🔗 Firebase document path: generationHistory/' + firebaseHistoryId);

          // Update the local entry with the Firebase ID
          // dispatch(updateHistoryEntry({
          //   id: loadingEntry.id,
          //   updates: { id: firebaseHistoryId }
          // }));

          // Don't modify the loadingEntry object - use firebaseHistoryId directly
          console.log('Using Firebase ID for all operations:', firebaseHistoryId);
        } catch (firebaseError) {
          console.error('❌ Failed to save to Firebase:', firebaseError);
          console.error('Firebase error details:', {
            message: firebaseError instanceof Error ? firebaseError.message : 'Unknown error',
            stack: firebaseError instanceof Error ? firebaseError.stack : 'No stack trace'
          });
          toast.error('Failed to save generation to history');
          return;
        }

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
            await updateFirebaseHistory(firebaseHistoryId!, {
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
            console.log('API payload:', {
              promptText: `${prompt} [Style: ${style}]`,
              model: selectedModel,
              ratio,
              generationType: "text-to-image",
              uploadedImagesCount: uploadedImages.length,
              style,
              existingHistoryId: firebaseHistoryId
            });

            const result = await dispatch(runwayGenerate({
              promptText: `${prompt} [Style: ${style}]`,
              model: selectedModel,
              ratio,
              generationType: "text-to-image",
              uploadedImages,
              style,
              existingHistoryId: firebaseHistoryId,
              isPublic
            })).unwrap();
            console.log(`Runway API call completed for image ${index + 1}, taskId:`, result.taskId);

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
                // Stop loader immediately
                setLocalGeneratingEntries(prev => prev.map(e => ({ ...e, status: 'failed' as any })));
                setIsGeneratingLocally(false);
                break;
              }
              // Also stop on explicit failure/cancelled statuses from backend/provider
              const s = String(status?.status || '').toUpperCase();
              if (s === 'FAILED' || s === 'CANCELLED' || s === 'THROTTLED') {
                terminalError = (status?.failure as string) || 'Runway task did not complete';
                if (!runwayBaseRespToastShownRef.current) toast.error(terminalError);
                setLocalGeneratingEntries(prev => prev.map(e => ({ ...e, status: 'failed' as any })));
                setIsGeneratingLocally(false);
                break;
              }
              if (status?.status === 'completed' && Array.isArray(status?.images) && status.images.length > 0) {
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
                  await refreshAllHistory();
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

        // 🔍 DEBUG: Check if firebaseHistoryId is valid
        if (!firebaseHistoryId) {
          console.error('❌ CRITICAL ERROR: firebaseHistoryId is undefined!!');
          console.error('This means the Firebase save failed at the beginning');
          return;
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
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: currentImages.filter(img => img.url),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: successfulResults.length,
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}
          
          toast.success(`Runway generation completed! Generated ${successfulResults.length}/${totalToGenerate} image(s) successfully`);
          clearInputs();
          await refreshAllHistory();

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
        }

        console.log('=== RUNWAY GENERATION COMPLETED ===');
      } else if (isMiniMaxModel) {
        // Use MiniMax generation
          const result = await dispatch(
            generateMiniMaxImages({
            prompt: `${prompt} [Style: ${style}]`,
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
          const completedEntry: HistoryEntry = {
            ...(localGeneratingEntries[0] || tempEntry),
            id: (localGeneratingEntries[0]?.id || tempEntryId),
            images: result.images,
            status: 'completed',
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: result.images.length,
          } as any;
          setLocalGeneratingEntries([completedEntry]);
        } catch {}

        // Show success notification
        toast.success(`MiniMax generation completed! Generated ${result.images.length} image(s)`);
        clearInputs();
        await refreshAllHistory();

        // Handle credit success
        if (transactionId) {
          await handleGenerationSuccess(transactionId);
        }
      } else if (selectedModel === 'gemini-25-flash-image') {
        // FAL Gemini (Nano Banana) immediate generate flow (align with BFL)
        try {
          const result = await dispatch(falGenerate({
            prompt: `${prompt} [Style: ${style}]`,
            model: selectedModel,
            // New schema: num_images + aspect_ratio
            num_images: imageCount,
            aspect_ratio: frameSize as any,
            uploadedImages: (uploadedImages || []).map((u: string) => toAbsoluteFromProxy(u)),
            output_format: 'jpeg',
            generationType: 'text-to-image',
            isPublic,
          })).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          toast.success(`Generated ${result.images?.length || 1} image(s) successfully!`);
          clearInputs();
          await refreshAllHistory();

          // Handle credit success
          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          console.error('FAL generate failed:', error);

          // Handle credit failure
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }

          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Google Nano Banana');
          return;
        }
      } else if (selectedModel === 'seedream-v4') {
        // Replicate Seedream v4 (supports T2I and I2I with multi-image input)
        try {
          // Build Seedream payload per new schema
          const payload: any = {
            prompt: `${prompt} [Style: ${style}]`,
            model: 'bytedance/seedream-4',
            size: seedreamSize,
            aspect_ratio: frameSize,
            sequential_image_generation: 'disabled',
            max_images: Math.min(imageCount, 4),
            isPublic,
          };
          if (seedreamSize === 'custom') {
            payload.width = Math.max(1024, Math.min(4096, Number(seedreamWidth) || 2048));
            payload.height = Math.max(1024, Math.min(4096, Number(seedreamHeight) || 2048));
          }
          if (uploadedImages && uploadedImages.length > 0) payload.image_input = uploadedImages.slice(0, 10).map((u: string) => toAbsoluteFromProxy(u));
          const result = await dispatch(replicateGenerate(payload)).unwrap();

          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          toast.success(`Generated ${result.images?.length || 1} image(s) successfully!`);
          clearInputs();
          await refreshAllHistory();

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Seedream');
          return;
        }
      } else if (selectedModel === 'ideogram-ai/ideogram-v3') {
        // Ideogram v3 via replicate generate endpoint
        try {
          // Map our frameSize to allowed aspect ratios for ideogram (validator list)
          const allowedAspect = new Set([
            '1:3','3:1','1:2','2:1','9:16','16:9','10:16','16:10','2:3','3:2','3:4','4:3','4:5','5:4','1:1'
          ]);
          const aspect = allowedAspect.has(frameSize) ? frameSize : '1:1';

          // Ideogram v3 doesn't support multiple images in single request, so we make parallel requests
          const totalToGenerate = Math.min(imageCount, 4); // Cap at 4 like other models
          const generationPromises = Array.from({ length: totalToGenerate }, async (_, index) => {
            // Sensible defaults (can be expanded to UI later)
            const payload: any = {
              prompt: `${prompt} [Style: ${style}]`,
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
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (combinedResult.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (combinedResult.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

          toast.success(`Generated ${combinedResult.images?.length || 1} image(s) successfully!`);
          clearInputs();
          await refreshAllHistory();

          if (transactionId) {
            await handleGenerationSuccess(transactionId);
          }
        } catch (error) {
          if (transactionId) {
            await handleGenerationFailure(transactionId);
          }
          toast.error(error instanceof Error ? error.message : 'Failed to generate images with Ideogram v3');
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
          const result = await dispatch(bflGenerate({
            prompt: `${prompt} [Style: ${style}]`,
            model: selectedModel,
            n: imageCount,
            frameSize,
            style,
            isPublic,
          })).unwrap();

          // History is persisted by backend; no local completed entry needed

          // Update the loading entry with completed data
          // dispatch(
          //   updateHistoryEntry({
          //     id: firebaseHistoryId || loadingEntry.id,
          //     updates: completedEntry,
          //   })
          // );

          // Server already finalized Firebase when historyId is provided

          // Show success notification
          toast.success(`Generated ${result.images.length} image${result.images.length > 1 ? 's' : ''} successfully!`);
          clearInputs();
          await refreshAllHistory();

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

          let generationPayload: any = {
            prompt: `${prompt} [Style: ${style}]`,
            model: selectedModel,
            imageCount,
            frameSize,
            style,
            generationType: "text-to-image",
            uploadedImages,
          };

          // For flux-pro models, convert frameSize to width/height dimensions (but keep frameSize for history)
          if (isFluxProModel) {
            const dimensions = convertFrameSizeToFluxProDimensions(frameSize);
            generationPayload.width = dimensions.width;
            generationPayload.height = dimensions.height;
            console.log(`Flux Pro model detected: ${selectedModel}, using dimensions:`, dimensions);
            console.log(`Original frameSize: ${frameSize}, converted to: ${dimensions.width}x${dimensions.height}`);
            console.log(`Model type: ${selectedModel} - using width/height parameters for BFL API`);
          }

          const result = await dispatch(
            generateImages(generationPayload)
          ).unwrap();

          // Update the local loading entry with completed images
          try {
            const completedEntry: HistoryEntry = {
              ...(localGeneratingEntries[0] || tempEntry),
              id: (localGeneratingEntries[0]?.id || tempEntryId),
              images: (result.images || []),
              status: 'completed',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              imageCount: (result.images?.length || imageCount),
            } as any;
            setLocalGeneratingEntries([completedEntry]);
          } catch {}

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

          // Show success notification
          toast.success(`Generated ${result.images.length} image${result.images.length > 1 ? "s" : ""
            } successfully!`);
          clearInputs();
          await refreshAllHistory();

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
      // Mark local preview as failed
      setLocalGeneratingEntries((prev) => prev.map((e) => ({
        ...e,
        status: 'failed'
      })));

      // Update loading entry to failed status
      // Use firebaseHistoryId if available, otherwise fall back to loadingEntry.id
      // const entryIdToUpdate = firebaseHistoryId || loadingEntry.id;

      // dispatch(
      //   updateHistoryEntry({
      //     id: entryIdToUpdate,
      //     updates: {
      //         status: "failed",
      //         error:
      //           error instanceof Error
      //             ? error.message
      //             : "Failed to generate images",
      //       },
      //     })
      // );

      // If we have a Firebase ID, also update it there
      if (firebaseHistoryId) {
        try {
          await updateFirebaseHistory(firebaseHistoryId, {
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to generate images",
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
        toast.error(error instanceof Error ? error.message : 'Failed to generate images');
      }
    } finally {
      // Always reset local generation state
      setIsGeneratingLocally(false);
      // Reset the base_resp toast guard for next run
      runwayBaseRespToastShownRef.current = false;
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
      {(historyEntries.length > 0 || localGeneratingEntries.length > 0) && (
        <div className=" inset-0  pl-[0] pr-6 pb-6 overflow-y-auto no-scrollbar z-0">
          <div className="md:py-6 py-0 md:pl-4 pl-2 ">
            {/* History Header - Fixed during scroll */}
            <div className="fixed top-0 mt-1 left-0 right-0 z-30 md:py-5 py-2 md:ml-18 ml-13 mr-1 bg-white/10 backdrop-blur-lg shadow-xl md:pl-6 pl-4 border border-white/10 rounded-2xl ">
              <h2 className="md:text-xl text-md font-semibold text-white pl-0 ">Image Generation </h2>
            </div>
            {/* Spacer to keep content below fixed header */}
            <div className="h-0"></div>

            {/* Main Loader */}
            {loading && historyEntries.length === 0 && (
              <div className="flex items-center justify-center ">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <div className="text-white text-lg">Loading your generation history...</div>
                </div>
              </div>
            )}

            {/* Local preview: if no row for today yet, render a dated block so preview shows immediately */}
            {localGeneratingEntries.length > 0 && !groupedByDate[todayKey] && (
              <div className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                  </div>
                  <h3 className="text-sm font-medium text-white/70">{new Date(todayKey).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</h3>
                </div>
                <div className="flex flex-wrap md:gap-3 gap-1 md:ml-9 ml-0">
                  {localGeneratingEntries[0].images.map((image: any, idx: number) => (
                    <div key={`local-only-${idx}`} className="relative md:w-68 md:h-68 md:max-w-[300px] md:max-h-[300px] w-[140px] h-[130px] max-w-[130px] max-h-[180px] rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                      {localGeneratingEntries[0].status === 'generating' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                            <div className="text-xs text-white/60">Generating...</div>
                          </div>
                        </div>
                      ) : localGeneratingEntries[0].status === 'failed' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                          <div className="flex flex-col items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                            <div className="text-xs text-red-400">Failed</div>
                          </div>
                        </div>
                      ) : image.url ? (
                        <div className="relative w-full h-full">
                          <Image src={image.url} alt={`Generated image ${idx + 1}`} fill className="object-cover" sizes="192px" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                          <div className="text-xs text-white/60">No image</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Entries - Grouped by Date */}
            <div className=" space-y-8  ">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-4">
                  {/* Date Header */}
                  <div className="flex items-center gap-3">
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
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>

                  {/* All Images for this Date - Horizontal Layout */}
                  <div className="flex flex-wrap gap-3 md:ml-9 ml-0">
                    {/* Prepend local preview tiles at the start of today's row to push images right */}
                    {date === todayKey && localGeneratingEntries.length > 0 && (
                      <>
                        {localGeneratingEntries[0].images.map((image: any, idx: number) => (
                          <div key={`local-${idx}`} className="relative md:w-68 md:h-68 md:max-w-[300px] md:max-h-[300px] w-[140px] h-[130px] max-w-[130px] max-h-[180px] rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                            {localGeneratingEntries[0].status === 'generating' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                  <div className="text-xs text-white/60">Generating...</div>
                                </div>
                              </div>
                            ) : localGeneratingEntries[0].status === 'failed' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                                <div className="flex flex-col items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                  </svg>
                                  <div className="text-xs text-red-400">Failed</div>
                                </div>
                              </div>
                      ) : image.url ? (
                        <div className="relative w-full h-full group">
                          <Image src={image.url} alt={`Generated image ${idx + 1}`} fill className="object-contain" sizes="192px" />
                          {/* Hover prompt overlay */}
                          <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity px-2 py-2 flex items-center gap-2 min-h-[44px] z-20">
                            <span
                              title={getCleanPrompt(prompt)}
                              className="text-xs text-white flex-1 leading-snug"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3 as any,
                                WebkitBoxOrient: 'vertical' as any,
                                overflow: 'hidden'
                              }}
                            >
                              {getCleanPrompt(prompt)}
                            </span>
                            <button
                              aria-label="Copy prompt"
                              className="pointer-events-auto p-1 rounded hover:bg-white/10 text-white/90"
                              onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(prompt)); }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                            </button>
                          </div>
                        </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/20 flex items-center justify-center text-white/60">
                                <div className="text-xs text-white/60">No image</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    {groupedByDate[date].map((entry: HistoryEntry) =>
                      entry.images.map((image: any) => (
                        <div
                          key={`${entry.id}-${image.id}`}
                          data-image-id={`${entry.id}-${image.id}`}
                          onClick={() => setPreview({ entry, image })}
                          className="relative md:w-68 md:h-68 md:max-w-[300px] md:max-h-[300px] w-[140px] h-[130px] max-w-[130px] max-h-[180px] rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                        >
                          {entry.status === "generating" ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                                <div className="text-xs text-white/60">
                                  Generating...
                                </div>
                              </div>
                            </div>
                          ) : entry.status === "failed" ? (
                            // Error frame
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
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
                            // Completed image with shimmer loading
                            <div className="relative w-full h-full group">
                              <Image
                                src={image.url}
                                alt={entry.prompt}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200 "
                                sizes="192px"
                                onLoad={() => {
                                  // Remove shimmer when image loads
                                  setTimeout(() => {
                                    const shimmer = document.querySelector(`[data-image-id="${entry.id}-${image.id}"] .shimmer`) as HTMLElement;
                                    if (shimmer) {
                                      shimmer.style.opacity = '0';
                                    }
                                  }, 100);
                                }}
                              />
                              {/* Shimmer loading effect */}
                              <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                              {/* Hover prompt overlay */}
                              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity px-2 py-2 flex items-center gap-2 min-h-[44px] z-20">
                                <span
                                  title={getCleanPrompt(entry.prompt)}
                                  className="text-xs text-white flex-1 leading-snug"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3 as any,
                                    WebkitBoxOrient: 'vertical' as any,
                                    overflow: 'hidden'
                                  }}
                                >
                                  {getCleanPrompt(entry.prompt)}
                                </span>
                                <button
                                  aria-label="Copy prompt"
                                  className="pointer-events-auto p-1 rounded hover:bg-white/10 text-white/90"
                                  onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* Loader for scroll loading */}
              {hasMore && loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                    <div className="text-sm text-white/60">Loading more generations...</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:w-[90%] w-[90%] md:max-w-[900px] max-w-[95%] z-[60] h-auto">
        <div className="rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl">
          {/* Top row: prompt + actions */}
          <div className="flex items-center gap-0 p-3">
            <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5 w-full">
              <textarea
                ref={inputEl}
                placeholder="Type your prompt..."
                value={prompt}
                onChange={(e) => {
                  dispatch(setPrompt(e.target.value));
                  adjustTextareaHeight(e.target);
                }}
                className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-relaxed resize-none overflow-y-auto transition-all duration-200 ${prompt ? 'text-white' : 'text-white/70'
                  }`}
                rows={1}
                style={{
                  minHeight: '24px',
                  maxHeight: '96px',
                  lineHeight: '1.2',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
                }}
              />
              {/* Previews just to the left of upload */}
              {uploadedImages.length > 0 && (
                <div className="flex items-center gap-1.5 pr-1">
                  {uploadedImages.map((u: string, i: number) => (
                    <div
                      key={i}
                      className="relative w-12 h-12 rounded-md overflow-hidden ring-1 ring-white/20 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u}
                        alt={`ref-${i}`}
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-30"
                      />
                      <button
                        aria-label="Remove reference"
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 text-xl font-extrabold drop-shadow"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = uploadedImages.filter(
                            (_: string, idx: number) => idx !== i
                          );
                          dispatch(setUploadedImages(next));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="p-1.5 rounded-lg bg-white/10 hover:bg-white/10 transition cursor-pointer flex items-center gap-0">
                <Image
                  src="/icons/fileupload.svg"
                  alt="Attach"
                  width={18}
                  height={18}
                  className="opacity-90"
                />
                <span className="text-white text-sm"> </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const inputEl = e.currentTarget as HTMLInputElement;
                    const files = Array.from(inputEl.files || []).slice(0, 4);
                    const urls: string[] = [];

                    // Check file sizes (2MB limit per file)
                    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
                    const oversizedFiles = files.filter(file => file.size > maxSize);

                    if (oversizedFiles.length > 0) {
                      toast.error(`Image(s) too large. Maximum size is 2MB per image. ${oversizedFiles.length} file(s) exceed the limit.`);
                      // Clear the input
                      if (inputEl) inputEl.value = "";
                      return;
                    }

                    for (const file of files) {
                      const reader = new FileReader();
                      const asDataUrl: string = await new Promise((res) => {
                        reader.onload = () => res(reader.result as string);
                        reader.readAsDataURL(file);
                      });
                      urls.push(asDataUrl);
                    }
                    // append to existing stack (max 4)
                    const next = [...uploadedImages, ...urls].slice(0, 4);
                    dispatch(setUploadedImages(next));

                    // Only auto-switch models if this is the first upload AND we're not using an image-to-image model
                    if (uploadedImages.length === 0 && next.length > 0) {
                      // Check if current model is an image-to-image model
                      const isImageToImageModel = selectedModel === "gen4_image_turbo" || selectedModel === "gen4_image" || selectedModel === 'gemini-25-flash-image';

                      if (!isImageToImageModel) {
                        // Only auto-switch for text-to-image models
                        console.log('Auto-switching model for text-to-image generation');
                        if (next.length > 1) {
                          dispatch(setSelectedModel("flux-kontext-pro"));
                        } else {
                          // Single image - could use MiniMax or Kontext Pro
                          dispatch(setSelectedModel("flux-kontext-pro"));
                        }
                      } else {
                        console.log('Keeping current image-to-image model:', selectedModel);
                      }
                    }
                    // clear input so the same file can be reselected
                    if (inputEl) inputEl.value = "";
                  }}
                />
              </label>
            </div>

            {/* Small + button (between attach and Generate in the mock) */}

            <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                onClick={handleGenerate}
                disabled={isGeneratingLocally || !prompt.trim()}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                {isGeneratingLocally ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>

          {/* Bottom row: pill options */}
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3">
            {/* Selection Summary */}
            {/* <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-300">
            <span>Selected:</span>
            <span className="text-white/80 font-medium flex flex-wrap gap-1">
              {selectedModel !== 'flux-dev' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {selectedModel.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              )}
              {imageCount !== 1 && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {imageCount} Image{imageCount > 1 ? 's' : ''}
                </span>
              )}
              {frameSize !== '1:1' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded mr-2 animate-pulse">
                  {frameSize}
                </span>
              )}
              {style !== 'realistic' && (
                <span className="bg-white/20 text-white px-2 py-0.5 rounded animate-pulse">
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </span>
              )}
              {(selectedModel === 'flux-dev' && imageCount === 1 && frameSize === '1:1' && style === 'realistic') && (
                <span className="text-white/40">Default settings</span>
              )}
            </span>
          </div> */}

            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <ModelsDropdown />
              <ImageCountDropdown />
              <FrameSizeDropdown />
              <StyleSelector />
              {selectedModel === 'seedream-v4' && (
                <div className="flex items-center gap-2">
                  <select
                    value={seedreamSize}
                    onChange={(e)=>setSeedreamSize(e.target.value as any)}
                    className="h-[32px] px-3 rounded-full text-[13px] font-medium ring-1 ring-white/20 bg-transparent text-white/90 hover:bg-white/5 transition"
                  >
                    <option className="bg-black" value="1K">1K</option>
                    <option className="bg-black" value="2K">2K</option>
                    <option className="bg-black" value="4K">4K</option>
                    <option className="bg-black" value="custom">Custom</option>
                  </select>
                  {seedreamSize === 'custom' && (
                    <>
                      <input
                        type="number"
                        min={1024}
                        max={4096}
                        value={seedreamWidth}
                        onChange={(e)=>setSeedreamWidth(Number(e.target.value)||2048)}
                        placeholder="Width"
                        className="h-[32px] w-24 px-3 rounded-full text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                      />
                      <input
                        type="number"
                        min={1024}
                        max={4096}
                        value={seedreamHeight}
                        onChange={(e)=>setSeedreamHeight(Number(e.target.value)||2048)}
                        placeholder="Height"
                        className="h-[32px] w-24 px-3 rounded-full text-[13px] ring-1 ring-white/20 bg-transparent text-white/90 placeholder-white/40"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
            {/* moved previews near upload above */}
            {!(pathname && pathname.includes('/wildmindskit/LiveChat')) && (
              <div className="flex items-center gap-2 ml-auto mt-2 md:mt-0 shrink-0 ">
                <button
                  aria-label="Edit"
                  title="Edit"
                  // borderRadius="1.5rem"
                  // containerClassName="h-10 w-auto"
                  className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white px-7 py-2 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
                  onClick={() => router.push('/edit-image')}
                >
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white/80">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                    <span className="text-sm text-white">Edit</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
      <ImagePreviewModal preview={preview} onClose={() => setPreview(null)} />
      <UpscalePopup isOpen={isUpscaleOpen} onClose={() => setIsUpscaleOpen(false)} defaultImage={uploadedImages[0] || null} onCompleted={refreshAllHistory} />
      <RemoveBgPopup isOpen={isRemoveBgOpen} onClose={() => setIsRemoveBgOpen(false)} defaultImage={uploadedImages[0] || null} onCompleted={refreshAllHistory} />
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
    </>
  );
};

export default InputBox;
