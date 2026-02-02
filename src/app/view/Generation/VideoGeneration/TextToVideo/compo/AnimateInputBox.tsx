"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { HistoryEntry } from "@/types/history";
import { FilePlay, FilePlus2, Trash2, ChevronUp, Monitor } from 'lucide-react';
import { getApiClient } from "@/lib/axiosInstance";
import { uploadLocalVideoFile } from "@/lib/videoUpload";
import { useGenerationCredits } from "@/hooks/useCredits";
import UploadModal from "@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal";
import VideoUploadModal from "./VideoUploadModal";
import { getVideoCreditCost } from "@/utils/creditValidation";
import VideoModelsDropdown from "./VideoModelsDropdown";
import VideoPreviewModal from "./VideoPreviewModal";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addHistoryEntry, loadHistory, loadMoreHistory } from "@/store/slices/historySlice";
import { shallowEqual } from "react-redux";
import Image from "next/image";
import { toThumbUrl } from '@/lib/thumb';
import useHistoryLoader from '@/hooks/useHistoryLoader';

interface AnimateInputBoxProps {
  placeholder?: string;
  showHistory?: boolean;
}

const AnimateInputBox = (props: AnimateInputBoxProps = {}) => {
  const { placeholder = "Type your video prompt...", showHistory = true } = props;
  const dispatch = useAppDispatch();
  const inputEl = useRef<HTMLTextAreaElement>(null);
  
  // Helper functions for proxy URLs (same as History.tsx)
  const toProxyPath = (urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || '';
    // If ZATA_PREFIX is empty, startsWith('') is true for all strings (including blob:)
    // which would incorrectly proxy local/object URLs.
    if (ZATA_PREFIX && urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length);
    // Allow direct storagePath-like values (users/...)
    if (/^users\//.test(urlOrPath)) return urlOrPath;
    // For external URLs (fal.media, etc.), do not proxy
    return '';
  };

  const toFrontendProxyMediaUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    return path ? `/api/proxy/media/${encodeURIComponent(path)}` : '';
  };

  // State
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering history
  const [selectedModel, setSelectedModel] = useState("wan-2.2-animate-replace");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string>("");
  const [uploadedVideoDurationSec, setUploadedVideoDurationSec] = useState<number | null>(null);
  const [localVideoFilesByUrl, setLocalVideoFilesByUrl] = useState<Record<string, File>>({});
  const [uploadedUrlByLocalUrl, setUploadedUrlByLocalUrl] = useState<Record<string, string>>({});
  const [uploadedCharacterImage, setUploadedCharacterImage] = useState<string>("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    video: any;
  } | null>(null);
  
  // Local, ephemeral preview entry for video generations (shows generating state)
  const [localVideoPreview, setLocalVideoPreview] = useState<HistoryEntry | null>(null);

  // WAN 2.2 Animate Replace parameters
  const [wanAnimateResolution, setWanAnimateResolution] = useState<"720" | "480">("720");
  const [wanAnimateRefertNum, setWanAnimateRefertNum] = useState<1 | 5>(1);
  const [wanAnimateGoFast, setWanAnimateGoFast] = useState<boolean>(true);
  const [wanAnimateMergeAudio, setWanAnimateMergeAudio] = useState<boolean>(true);
  const [wanAnimateFps, setWanAnimateFps] = useState<number>(24);
  const [wanAnimateSeed, setWanAnimateSeed] = useState<number | undefined>(undefined);
  
  // Runway Act-Two (act_two) parameters
  const [runwayActTwoRatio, setRunwayActTwoRatio] = useState<"1280:720" | "720:1280" | "960:960" | "1104:832" | "832:1104" | "1584:672">("1280:720");
  const [runwayActTwoCharacterType, setRunwayActTwoCharacterType] = useState<"image" | "video">("image");
  const [runwayActTwoSeed, setRunwayActTwoSeed] = useState<number | undefined>(undefined);
  const [runwayActTwoBodyControl, setRunwayActTwoBodyControl] = useState<boolean>(false);
  const [runwayActTwoExpressionIntensity, setRunwayActTwoExpressionIntensity] = useState<number>(3);
  
  // Dropdown states
  const [resolutionDropdownOpen, setResolutionDropdownOpen] = useState(false);
  const [refFramesDropdownOpen, setRefFramesDropdownOpen] = useState(false);
  const [runwayRatioDropdownOpen, setRunwayRatioDropdownOpen] = useState(false);
  const [runwayCharacterTypeDropdownOpen, setRunwayCharacterTypeDropdownOpen] = useState(false);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
  const refFramesDropdownRef = useRef<HTMLDivElement>(null);
  const runwayRatioDropdownRef = useRef<HTMLDivElement>(null);
  const runwayCharacterTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Upload modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<'image' | 'video'>('video');
  const [isVideoModalForCharacter, setIsVideoModalForCharacter] = useState(false);

  // Local state for image library (to avoid affecting video history in Redux)
  const [libraryImageEntries, setLibraryImageEntries] = useState<any[]>([]);
  const [libraryImageHasMore, setLibraryImageHasMore] = useState<boolean>(true);
  const [libraryImageLoading, setLibraryImageLoading] = useState<boolean>(false);
  const libraryImageNextCursorRef = useRef<string | undefined>(undefined);
  const libraryImageInitRef = useRef<boolean>(false);
  const libraryImageLoadingRef = useRef<boolean>(false);

  // Local state for video library (to avoid affecting video history in Redux)
  const [libraryVideoEntries, setLibraryVideoEntries] = useState<any[]>([]);
  const [libraryVideoHasMore, setLibraryVideoHasMore] = useState<boolean>(true);
  const [libraryVideoLoading, setLibraryVideoLoading] = useState<boolean>(false);
  const libraryVideoNextCursorRef = useRef<string | undefined>(undefined);
  const libraryVideoInitRef = useRef<boolean>(false);

  // History - ALL video entries (for VideoUploadModal)
  const allVideoHistoryEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];
    
    // Helper function to normalize generationType (handle both underscore and hyphen patterns)
    const normalizeGenerationType = (generationType: string | undefined): string => {
      if (!generationType) return '';
      return generationType.replace(/[_-]/g, '-').toLowerCase();
    };

    // Helper function to check if an entry is a video type
    const isVideoType = (entry: any): boolean => {
      const normalizedType = normalizeGenerationType(entry?.generationType);
      return normalizedType === 'text-to-video' ||
        normalizedType === 'image-to-video' ||
        normalizedType === 'video-to-video';
    };

    // Helper function to check if an entry has video URLs
    const isVideoUrl = (url: string | undefined): boolean => {
      return !!url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
    };

    // Get entries that are explicitly declared as video types
    const declaredVideoTypes = allEntries.filter(isVideoType);

    // Get entries that have video URLs (fallback for entries that might not have correct generationType)
    const urlVideoTypes = allEntries.filter((entry: any) =>
      Array.isArray(entry.images) && entry.images.some((m: any) => isVideoUrl(m?.firebaseUrl || m?.url))
    );

    // Merge both sets, removing duplicates by ID
    const byId: Record<string, any> = {};
    [...declaredVideoTypes, ...urlVideoTypes].forEach((e: any) => {
      byId[e.id] = e;
    });

    const mergedEntries = Object.values(byId);

    // Filter out entries that are stuck in "generating" status without a valid video URL
    const filteredEntries = mergedEntries.filter((entry: any) => {
      // If status is "generating", check if it has a valid video URL
      if (entry.status === "generating") {
        const hasValidVideo = (entry.images && Array.isArray(entry.images) && entry.images.some((m: any) => {
          const url = m?.firebaseUrl || m?.url || m?.originalUrl;
          return url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
        })) || (entry.videos && Array.isArray(entry.videos) && entry.videos.some((v: any) => {
          const url = v?.firebaseUrl || v?.url || v?.originalUrl;
          return url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
        }));
        // Only show if it has a valid video URL (treat as completed)
        return hasValidVideo;
      }
      // Show all other entries (completed, failed, or no status)
      return true;
    });

    // Sort by timestamp (newest first)
    const sortedEntries = filteredEntries.sort((a: any, b: any) => {
      const timestampA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timestampB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timestampB - timestampA; // Descending order (newest first)
    });

    return sortedEntries;
  }, shallowEqual);

  // History - Show ONLY animate-related video entries (for history display on page)
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];
    
    // Debug: Log total entries count and show some sample entries
    console.log('[AnimateInputBox] Total entries in Redux:', allEntries.length);
    if (allEntries.length > 0) {
      // Log first few entries to see what we're working with
      const sampleEntries = allEntries.slice(0, 3).map((e: any) => ({
        id: e.id,
        model: e.model,
        generationType: e.generationType,
        status: e.status,
        hasImages: !!(e.images?.length),
        hasVideos: !!(e.videos?.length)
      }));
      console.log('[AnimateInputBox] Sample entries from Redux:', sampleEntries);
    }
    
    // Helper function to normalize generationType (handle both underscore and hyphen patterns)
    const normalizeGenerationType = (generationType: string | undefined): string => {
      if (!generationType) return '';
      return generationType.replace(/[_-]/g, '-').toLowerCase();
    };

    // Helper function to check if an entry is a video type
    const isVideoType = (entry: any): boolean => {
      const normalizedType = normalizeGenerationType(entry?.generationType);
      return normalizedType === 'text-to-video' ||
        normalizedType === 'image-to-video' ||
        normalizedType === 'video-to-video';
    };

    // Helper function to check if an entry has video URLs
    const isVideoUrl = (url: string | undefined): boolean => {
      return !!url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
    };

    // Check if entry is related to animate feature - match exact model from dropdown
    // The dropdown shows "wan-2.2-animate-replace" but backend saves as "wan-video/wan-2.2-animate-replace"
    // Also includes Runway Act-Two (act_two) model
    const isAnimateEntry = (entry: any): boolean => {
      const model = String(entry?.model || '').toLowerCase();
      
      // Check for Runway Act-Two (act_two) model
      const isRunwayActTwo = 
        model === 'act_two' ||
        model === 'runway_act_two' ||
        model === 'runway-act-two' ||
        model.includes('act_two') ||
        model.includes('act-two') ||
        model.includes('character-performance') ||
        model.includes('character_performance');
      
      if (isRunwayActTwo) {
        console.log('[AnimateInputBox] ✅ Runway act_two match found:', { id: entry.id, model: entry.model });
        return true;
      }
      
      // Primary check: exact matches for the animate models (backend saves as "wan-video/wan-2.2-animate-replace" or "wan-video/wan-2.2-animate-animation")
      const exactMatches = 
        model === 'wan-2.2-animate-replace' ||
        model === 'wan-video/wan-2.2-animate-replace' ||
        model.includes('wan-2.2-animate-replace') ||
        model.includes('wan-video/wan-2.2-animate-replace') ||
        model === 'wan-2.2-animate-animation' ||
        model === 'wan-video/wan-2.2-animate-animation' ||
        model.includes('wan-2.2-animate-animation') ||
        model.includes('wan-video/wan-2.2-animate-animation');
      
      if (exactMatches) {
        console.log('[AnimateInputBox] ✅ Exact match found:', { id: entry.id, model: entry.model });
        return true;
      }
      
      // Secondary check: partial matches that indicate animate model
      const hasAnimateModel = 
        (model.includes('wan-2.2') && (model.includes('animate') || model.includes('replace') || model.includes('animation'))) ||
        (model.includes('wan-video') && model.includes('wan-2.2') && (model.includes('animate') || model.includes('replace') || model.includes('animation')));
      
      // Also check if it's a video-to-video entry with wan-2.2 and animate/replace/animation
      const isVideoToVideo = normalizeGenerationType(entry?.generationType) === 'video-to-video';
      const hasWan22AndAnimate = model.includes('wan-2.2') && (model.includes('animate') || model.includes('replace') || model.includes('animation'));
      
      // Also check: if model contains "wan" and "animate" or "replace" or "animation" (very lenient)
      const hasWanAndAnimate = model.includes('wan') && (model.includes('animate') || model.includes('replace') || model.includes('animation'));
      
      const result = exactMatches || hasAnimateModel || (isVideoToVideo && hasWan22AndAnimate) || (isVideoToVideo && hasWanAndAnimate);
      
      if (result && entry?.model) {
        console.log('[AnimateInputBox] ✅ Animate entry matched:', { 
          id: entry.id, 
          model: entry.model,
          generationType: entry.generationType,
          matchReason: exactMatches ? 'exact' : hasAnimateModel ? 'partial' : isVideoToVideo ? 'video-to-video' : 'lenient'
        });
      }
      
      return result;
    };

    // Get entries that are explicitly declared as video types
    const declaredVideoTypes = allEntries.filter(isVideoType);

    // Get entries that have video URLs (fallback for entries that might not have correct generationType)
    const urlVideoTypes = allEntries.filter((entry: any) =>
      Array.isArray(entry.images) && entry.images.some((m: any) => isVideoUrl(m?.firebaseUrl || m?.url))
    );

    // Get entries that are animate-related (check ALL entries, not just video types)
    // This ensures we catch animate entries even if they don't have the right generationType
    // Be lenient - if it's an animate model, include it even if video structure is unclear
    const animateEntriesDirect = allEntries.filter((entry: any) => {
      const isAnimate = isAnimateEntry(entry);
      if (!isAnimate) return false;
      
      // If it's clearly an animate entry, include it regardless of video structure
      // (the video might be in images, videos, or other fields)
      const hasVideoInImages = entry.images && Array.isArray(entry.images) && entry.images.some((m: any) => isVideoUrl(m?.firebaseUrl || m?.url));
      const hasVideoInVideos = entry.videos && Array.isArray(entry.videos) && entry.videos.some((v: any) => isVideoUrl(v?.firebaseUrl || v?.url || v?.originalUrl));
      const isVideoTypeEntry = isVideoType(entry);
      const hasVideo = isVideoTypeEntry || hasVideoInImages || hasVideoInVideos;
      
      // Include if it's an animate entry AND (has video OR is a video type OR has any media)
      // This is very lenient to catch all animate entries
      return hasVideo || isVideoTypeEntry || (entry.images && entry.images.length > 0) || (entry.videos && entry.videos.length > 0);
    });

    // Merge all sets, removing duplicates by ID
    const byId: Record<string, any> = {};
    [...declaredVideoTypes, ...urlVideoTypes, ...animateEntriesDirect].forEach((e: any) => {
      byId[e.id] = e;
    });

    const mergedEntries = Object.values(byId);

      // Filter to only show animate-related entries (double-check)
      // IMPORTANT: Check ALL entries, not just mergedEntries, to catch entries that might have been filtered out earlier
      const allAnimateEntries = allEntries.filter((entry: any) => {
        const isAnimate = isAnimateEntry(entry);
        return isAnimate;
      });
      
      // Also check mergedEntries for animate entries
      const animateEntriesFromMerged = mergedEntries.filter((entry: any) => {
        const isAnimate = isAnimateEntry(entry);
        return isAnimate;
      });
      
      // Merge both sets (allAnimateEntries and animateEntriesFromMerged) to ensure we don't miss any
      const animateById: Record<string, any> = {};
      [...allAnimateEntries, ...animateEntriesFromMerged].forEach((e: any) => {
        animateById[e.id] = e;
      });
      
      const animateEntries = Object.values(animateById);
      
      // Debug: Log what we found
      if (allAnimateEntries.length > 0 || animateEntriesFromMerged.length > 0) {
        console.log('[AnimateInputBox] Animate entries found:', {
          fromAllEntries: allAnimateEntries.length,
          fromMergedEntries: animateEntriesFromMerged.length,
          finalCount: animateEntries.length,
          sample: animateEntries.slice(0, 2).map((e: any) => ({
            id: e.id,
            model: e.model,
            generationType: e.generationType,
            status: e.status
          }))
        });
      }

    // Filter out entries that are stuck in "generating" status without a valid video URL
    const filteredEntries = animateEntries.filter((entry: any) => {
      // If status is "generating", check if it has a valid video URL
      if (entry.status === "generating") {
        const hasValidVideo = (entry.images && Array.isArray(entry.images) && entry.images.some((m: any) => {
          const url = m?.firebaseUrl || m?.url || m?.originalUrl;
          return url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
        })) || (entry.videos && Array.isArray(entry.videos) && entry.videos.some((v: any) => {
          const url = v?.firebaseUrl || v?.url || v?.originalUrl;
          return url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
        }));
        // Only show if it has a valid video URL (treat as completed)
        return hasValidVideo;
      }
      // Show all other entries (completed, failed, or no status)
      return true;
    });

    // Apply search query filter if provided
    const searchFilteredEntries = searchQuery.trim() 
      ? filteredEntries.filter((entry: any) => {
          const query = searchQuery.toLowerCase();
          const promptMatch = entry.prompt?.toLowerCase().includes(query);
          const modelMatch = entry.model?.toLowerCase().includes(query);
          return promptMatch || modelMatch;
        })
      : filteredEntries;

    // Sort by timestamp (newest first)
    const sortedEntries = searchFilteredEntries.sort((a: any, b: any) => {
      const timestampA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timestampB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timestampB - timestampA; // Descending order (newest first)
    });

    // Debug: Log final count and latest entry
    if (sortedEntries.length > 0) {
      console.log('[AnimateInputBox] ✅ Final animate entries count:', sortedEntries.length);
      console.log('[AnimateInputBox] Latest entry:', {
        id: sortedEntries[0].id,
        model: sortedEntries[0].model,
        generationType: sortedEntries[0].generationType,
        status: sortedEntries[0].status,
        timestamp: sortedEntries[0].timestamp,
        hasImages: !!(sortedEntries[0].images?.length),
        hasVideos: !!(sortedEntries[0].videos?.length)
      });
    } else {
      console.log('[AnimateInputBox] ⚠️ No animate entries found after filtering');
    }

    return sortedEntries;
  }, shallowEqual);

  // Clear local preview after completion/failure, but only if the entry is in Redux
  // This must be after historyEntries declaration
  useEffect(() => {
    if (!localVideoPreview) return;
    if (localVideoPreview.status === 'completed' || localVideoPreview.status === 'failed') {
      // Check if the entry is now in Redux before clearing
      const entryInRedux = historyEntries.some((e: any) => e.id === localVideoPreview.id);
      if (entryInRedux) {
        // Entry is in Redux, clear local preview after a short delay
        const t = setTimeout(() => setLocalVideoPreview(null), 2000); // Increased delay to 2 seconds
        return () => clearTimeout(t);
      }
      // If not in Redux yet, keep showing it (will be cleared when entry appears in Redux)
    }
  }, [localVideoPreview, historyEntries]);

  // Get image history entries from Redux (fallback only - we use local state for modal)
  const imageHistoryEntries = useAppSelector((state: any) => {
    const entries = state.history?.entries || [];
    return entries.filter((entry: HistoryEntry) => 
      entry.generationType === 'text-to-image'
    );
  }, shallowEqual);

  // Fetch user's text-to-image history for the UploadModal when needed (local pagination/state)
  // This uses local state to avoid affecting video history in Redux
  const fetchLibraryImages = useCallback(async (initial: boolean = false) => {
    try {
      // Use ref to check loading state to avoid stale closure issues
      if (libraryImageLoadingRef.current) {
        return;
      }
      // For non-initial loads, check if we have a cursor (hasMore) and modal is open
      if (!initial) {
        if (!libraryImageNextCursorRef.current) {
          setLibraryImageHasMore(false);
          return;
        }
        if (!isUploadModalOpen || uploadModalType !== 'image') {
          return;
        }
      }
      libraryImageLoadingRef.current = true;
      setLibraryImageLoading(true);
      
      const api = getApiClient();
      const params: any = { generationType: 'text-to-image', limit: 30, sortBy: 'createdAt' };
      // IMPORTANT: Read cursor from ref at the time of request to ensure we have the latest value
      const currentCursor = libraryImageNextCursorRef.current;
      if (!initial && currentCursor) {
        // Use correct backend pagination parameter
        params.nextCursor = currentCursor;
        console.log('[AnimateInputBox] 🔄 Pagination request with cursor:', {
          cursor: currentCursor ? `${String(currentCursor).substring(0, 30)}...` : 'none',
          cursorType: typeof currentCursor,
          isInitial: initial,
          currentEntriesCount: libraryImageEntries.length
        });
      } else if (initial) {
        console.log('[AnimateInputBox] 🆕 Initial load (no cursor)', {
          currentCursor: currentCursor ? 'present but ignored' : 'none'
        });
      } else {
        console.warn('[AnimateInputBox] ⚠️ Pagination requested but no cursor available!', {
          currentCursor,
          hasMore: libraryImageHasMore
        });
      }
      params.sortBy = 'createdAt';
      
      // PAGINATION DEBUG: Log request details
      const reqCursorVal: any = (params as any).nextCursor ?? (params as any).cursor;
      const cursorStr = reqCursorVal ? (typeof reqCursorVal === 'string' ? `${reqCursorVal.substring(0, 30)}...` : String(reqCursorVal)) : 'none';
      console.log('[PAGINATION] Request:', {
        initial,
        cursor: cursorStr,
        currentEntriesCount: libraryImageEntries.length
      });
      
      const res = await api.get('/api/generations', { params });
      const payload = res.data?.data || res.data || {};
      const items: any[] = Array.isArray(payload.items) ? payload.items : [];
      const nextCursor: string | number | undefined = payload.nextCursor;
      
      // PAGINATION DEBUG: Log response details
      const nextCursorStr = nextCursor ? (typeof nextCursor === 'string' ? `${nextCursor.substring(0, 30)}...` : String(nextCursor)) : 'null';
      const reqCur: any = (params as any).nextCursor ?? (params as any).cursor;
      const requestedCursorStr = reqCur ? (typeof reqCur === 'string' ? `${reqCur.substring(0, 30)}...` : String(reqCur)) : 'none';
      console.log('[PAGINATION] Response:', {
        itemsCount: items.length,
        firstItemId: items[0]?.id,
        lastItemId: items[items.length - 1]?.id,
        allItemIds: items.map((item: any) => item?.id),
        nextCursor: nextCursorStr,
        nextCursorType: typeof nextCursor,
        requestedCursor: requestedCursorStr
      });

      // Ensure all items have the images array properly structured
      const normalizedItems = items.map((item: any) => {
        // Clone the item to avoid mutating the original
        const normalized = { ...item };
        
        // If item doesn't have images array, try to extract from other properties
        if (!Array.isArray(normalized.images) || normalized.images.length === 0) {
          // Some APIs might return images in a different structure
          if (normalized.media && Array.isArray(normalized.media)) {
            normalized.images = normalized.media.filter((m: any) => m.type === 'image' || !m.type);
          }
        }
        // Ensure images is always an array (even if empty)
        if (!Array.isArray(normalized.images)) {
          normalized.images = [];
        }
        
        // Ensure each image has required properties
        // Match InputBox.tsx implementation - don't filter out images, let UploadModal handle it
        if (Array.isArray(normalized.images)) {
          normalized.images = normalized.images.map((img: any) => {
            if (typeof img === 'string') {
              // If image is just a URL string, convert to object
              return { url: img, id: img };
            }
            // Return image as-is - UploadModal will handle missing URLs
            return img;
          });
        }
        
        return normalized;
      });

      // Merge uniquely by id using functional update to avoid stale closure
      // Always create a new array reference to ensure React detects the change
      setLibraryImageEntries((prevEntries) => {
        // If this is an initial load, replace all entries (don't merge with old data)
        if (initial) {
          const sorted = normalizedItems.sort((a: any, b: any) => {
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return timeB - timeA; // Descending (newest first)
          });
          return [...sorted];
        }
        
        // For pagination loads, merge with existing entries
        // IMPORTANT: Check if items are actually new by comparing IDs
        const existingIds = new Set(prevEntries.map((e: any) => e?.id).filter(Boolean));
        const newItems = normalizedItems.filter((item: any) => item?.id && !existingIds.has(item.id));
        const existingItems = normalizedItems.filter((item: any) => item?.id && existingIds.has(item.id));
        
        // PAGINATION DEBUG: Check if we're getting duplicates
        console.log('[PAGINATION] Duplicate Check:', {
          previousCount: prevEntries.length,
          newItemsReceived: normalizedItems.length,
          actuallyNew: newItems.length,
          duplicates: existingItems.length,
          existingItemIds: Array.from(existingIds).slice(0, 5),
          newItemIds: newItems.slice(0, 5).map((e: any) => e.id),
          duplicateItemIds: existingItems.slice(0, 5).map((e: any) => e.id),
          isSameItems: existingItems.length === normalizedItems.length && normalizedItems.length > 0
        });
        
        if (newItems.length === 0) {
          console.warn('[PAGINATION] ⚠️ ALL ITEMS ARE DUPLICATES! API is returning same items. Cursor might not be working.');
          return [...prevEntries];
        }
        
        const existingById: Record<string, any> = {};
        // Add existing entries first
        prevEntries.forEach((e: any) => { 
          if (e?.id) {
            existingById[e.id] = e; 
          }
        });
        // Then add only NEW entries (avoid unnecessary updates)
        newItems.forEach((e: any) => { 
          if (e?.id) {
            existingById[e.id] = e; 
          }
        });
        // Create a new array and sort by createdAt (newest first)
        const merged = Object.values(existingById).sort((a: any, b: any) => {
          const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
          const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
          return timeB - timeA; // Descending (newest first)
        });

        // PAGINATION DEBUG: Log merge result
        console.log('[PAGINATION] Merge Result:', {
          previousCount: prevEntries.length,
          newItemsAdded: newItems.length,
          finalCount: merged.length
        });

        return [...merged];
      });
      
      // Update cursor and hasMore IMMEDIATELY after getting response (before state update)
      // This ensures the cursor is available for the next pagination request
      const previousCursor = libraryImageNextCursorRef.current;
      // Convert cursor to string if it's a number (API might return number cursor)
      // Handle both string and number cursors from API
      // IMPORTANT: Store the cursor immediately so it's available for the next request
      const newCursor = nextCursor ? (typeof nextCursor === 'string' ? nextCursor : String(nextCursor)) : undefined;
      libraryImageNextCursorRef.current = newCursor;
      
      // Log cursor update immediately
      console.log('[AnimateInputBox] 📥 Cursor updated in ref:', {
        previousCursor: previousCursor ? `${String(previousCursor).substring(0, 20)}...` : 'none',
        newCursor: newCursor ? `${String(newCursor).substring(0, 20)}...` : 'none',
        cursorChanged: previousCursor !== newCursor,
        itemsReceived: items.length
      });
      const hasMoreItems = Boolean(nextCursor);
      
      // PAGINATION DEBUG: Log cursor update
      const prevCursorStr = previousCursor ? (typeof previousCursor === 'string' ? `${previousCursor.substring(0, 30)}...` : String(previousCursor)) : 'none';
      const newCursorStr = newCursor ? (typeof newCursor === 'string' ? `${newCursor.substring(0, 30)}...` : String(newCursor)) : 'null';
      console.log('[PAGINATION] 📥 Response received - Cursor Update:', {
        previousCursor: prevCursorStr,
        previousCursorType: typeof previousCursor,
        newCursor: newCursorStr,
        newCursorType: typeof nextCursor,
        newCursorFull: newCursor,
        cursorChanged: previousCursor !== newCursor,
        hasMore: hasMoreItems,
        itemsReceived: items.length
      });
      
      // If cursor didn't change and we got items, it means we're getting duplicates
      if (!initial && previousCursor === newCursor && items.length > 0) {
        console.warn('[AnimateInputBox] ⚠️ WARNING: Cursor did not change but got items! API might be returning same page.');
      }
      
      setLibraryImageHasMore(hasMoreItems);
    } catch (e) {
      console.error('[AnimateInputBox] Failed to fetch library images:', e);
    } finally {
      libraryImageLoadingRef.current = false;
      setLibraryImageLoading(false);
    }
  }, [isUploadModalOpen, uploadModalType]);

  // When opening the UploadModal for images, ensure initial image library is loaded
  // IMPORTANT: Always fetch fresh data when modal opens to show newly generated images
  useEffect(() => {
    const needsLibrary = isUploadModalOpen && uploadModalType === 'image';
    if (needsLibrary) {
      // Always fetch images when modal opens to ensure we get the latest images
      // Use fetchLibraryImages which uses local state and doesn't affect Redux video history
      // Reset pagination state when opening modal to ensure fresh load
      libraryImageNextCursorRef.current = undefined;
      libraryImageLoadingRef.current = false; // Reset loading ref
      setLibraryImageHasMore(true);
      setLibraryImageEntries([]); // Clear previous entries for fresh load
      setLibraryImageLoading(false); // Ensure loading state is reset
      // Call fetchLibraryImages and handle any errors
      // Use setTimeout to ensure state updates are processed first
      const fetchPromise = fetchLibraryImages(true);
      fetchPromise
        .then(() => {
          console.log('[AnimateInputBox] ✅ Successfully fetched library images');
        })
        .catch((error) => {
          console.error('[AnimateInputBox] ❌ Error fetching library images on modal open:', error);
          toast.error('Failed to load image library. Please try again.');
          libraryImageLoadingRef.current = false;
          setLibraryImageLoading(false);
        });
      // Don't call loadHistory here - it would replace all Redux entries and clear video history!
      // Instead, rely on fetchLibraryImages (local state) and imageHistoryEntries (already in Redux)
    } else {
      // When modal closes, reset the guard so it can fetch fresh next time
      libraryImageInitRef.current = false;
    }
    // Deliberately not depending on fetchLibraryImages to avoid re-running when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploadModalOpen, uploadModalType]);


  // Fetch user's video history for the VideoUploadModal when needed (local pagination/state)
  // This uses local state to avoid affecting video history in Redux
  const fetchLibraryVideos = useCallback(async (initial: boolean = false) => {
    try {
      if (libraryVideoLoading) {
        console.log('[AnimateInputBox] fetchLibraryVideos: Already loading, skipping');
        return;
      }
      // For non-initial loads, check if we have a cursor (hasMore) and modal is open
      if (!initial) {
        if (!libraryVideoNextCursorRef.current) {
          console.log('[AnimateInputBox] fetchLibraryVideos: No nextCursor, no more items');
          setLibraryVideoHasMore(false);
          return;
        }
        if (!isUploadModalOpen || uploadModalType !== 'video') {
          console.log('[AnimateInputBox] fetchLibraryVideos: Modal not open or not video type, skipping');
          return;
        }
      }
      setLibraryVideoLoading(true);
      const api = getApiClient();
      // Fetch all video types: text-to-video, image-to-video, video-to-video
      const params: any = { 
        mode: 'video', // Backend converts this to ['text-to-video', 'image-to-video', 'video-to-video']
        limit: 30, 
        sortBy: 'createdAt' 
      };
      if (!initial && libraryVideoNextCursorRef.current) {
        // Use correct backend pagination parameter
        params.nextCursor = libraryVideoNextCursorRef.current;
      }
      // Ensure createdAt ordering always requested
      params.sortBy = 'createdAt';
      const res = await api.get('/api/generations', { params });
      const payload = res.data?.data || res.data || {};
      const items: any[] = Array.isArray(payload.items) ? payload.items : [];
      const nextCursor: string | undefined = payload.nextCursor;

      // Filter and normalize video entries
      const normalizedItems = items
        .filter((item: any) => {
          // Check if entry has videos
          if (item.videos && Array.isArray(item.videos) && item.videos.length > 0) {
            return true;
          }
          // Check if entry has video URLs in images array (fallback)
          if (item.images && Array.isArray(item.images)) {
            return item.images.some((img: any) => {
              const url = img.url || img.firebaseUrl || img.originalUrl;
              return url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
            });
          }
          return false;
        })
        .map((item: any) => {
          // Clone the item to avoid mutating the original
          const normalized = { ...item };
          
          // Ensure videos array exists
          if (!Array.isArray(normalized.videos)) {
            normalized.videos = [];
          }
          
          // Collect all videos from both videos and images arrays
          const allVideos: any[] = [];
          
          // First, add videos from videos array (if exists)
          if (normalized.videos && Array.isArray(normalized.videos)) {
            normalized.videos.forEach((video: any) => {
              if (video) {
                // Preserve all properties from the video object
                allVideos.push({
                  ...video,
                  // Ensure we have at least one URL property
                  url: video.url || video.firebaseUrl || video.originalUrl,
                  firebaseUrl: video.firebaseUrl || video.url,
                  originalUrl: video.originalUrl || video.url || video.firebaseUrl,
                  // Preserve thumbnail properties
                  thumbnailUrl: video.thumbnailUrl,
                  avifUrl: video.avifUrl,
                  // Ensure id exists
                  id: video.id || video.url || video.firebaseUrl || video.originalUrl
                });
              }
            });
          }
          
          // Then, add videos from images array (if they're actually videos)
          if (normalized.images && Array.isArray(normalized.images)) {
            normalized.images.forEach((img: any) => {
              if (img) {
                const url = img.url || img.firebaseUrl || img.originalUrl;
                // Check if this is a video
                if (url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url))) {
                  // Check if we already have this video (avoid duplicates)
                  const existingVideo = allVideos.find((v: any) => 
                    (v.url === url) || (v.firebaseUrl === url) || (v.originalUrl === url)
                  );
                  if (!existingVideo) {
                    // Convert image object to video object, preserving all properties
                    allVideos.push({
                      ...img,
                      // Ensure we have at least one URL property
                      url: img.url || img.firebaseUrl || img.originalUrl,
                      firebaseUrl: img.firebaseUrl || img.url,
                      originalUrl: img.originalUrl || img.url || img.firebaseUrl,
                      // Preserve thumbnail properties
                      thumbnailUrl: img.thumbnailUrl,
                      avifUrl: img.avifUrl,
                      // Ensure id exists
                      id: img.id || img.url || img.firebaseUrl || img.originalUrl
                    });
                  }
                }
              }
            });
          }
          
          // Update normalized entry with all collected videos
          normalized.videos = allVideos;
          
          // Also preserve images array for backward compatibility (but filter out videos)
          if (normalized.images && Array.isArray(normalized.images)) {
            normalized.images = normalized.images.filter((img: any) => {
              const url = img.url || img.firebaseUrl || img.originalUrl;
              // Keep only non-video images
              return !url || (!url.startsWith('data:video') && !/(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
            });
          }
          
          return normalized;
        });

      console.log('[AnimateInputBox] fetchLibraryVideos API response:', {
        payloadKeys: Object.keys(payload),
        itemsCount: items.length,
        normalizedItemsCount: normalizedItems.length,
        itemsSample: normalizedItems.slice(0, 2).map((item: any) => ({
          id: item.id,
          generationType: item.generationType,
          videosCount: item.videos?.length || 0,
          hasVideosArray: Array.isArray(item.videos),
          videos: item.videos?.slice(0, 1).map((video: any) => ({
            id: video.id,
            url: video.url?.substring(0, 50) + '...',
            firebaseUrl: video.firebaseUrl?.substring(0, 50) + '...' || 'missing',
            originalUrl: video.originalUrl?.substring(0, 50) + '...' || 'missing',
            thumbnailUrl: video.thumbnailUrl ? (video.thumbnailUrl.substring(0, 50) + '...') : 'missing',
            avifUrl: video.avifUrl ? (video.avifUrl.substring(0, 50) + '...') : 'missing'
          }))
        })),
        nextCursor: nextCursor ? 'present' : 'null'
      });

      // Merge uniquely by id using functional update to avoid stale closure
      // Always create a new array reference to ensure React detects the change
      setLibraryVideoEntries((prevEntries) => {
        const existingById: Record<string, any> = {};
        // Add existing entries first
        prevEntries.forEach((e: any) => { 
          if (e?.id) {
            existingById[e.id] = e; 
          }
        });
        // Add/update with new items
        normalizedItems.forEach((e: any) => { 
          if (e?.id) {
            existingById[e.id] = e; 
          }
        });
        // Create a new array and sort by createdAt (newest first)
        const merged = Object.values(existingById).sort((a: any, b: any) => {
          const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
          const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
          return timeB - timeA; // Descending (newest first)
        });

        console.log('[AnimateInputBox] fetchLibraryVideos after merge:', {
          previousCount: prevEntries.length,
          newItemsCount: normalizedItems.length,
          mergedCount: merged.length,
          actuallyNew: normalizedItems.filter((item: any) => !prevEntries.some((prev: any) => prev.id === item.id)).length,
          mergedSample: merged.slice(0, 2).map((e: any) => ({
            id: e.id,
            generationType: e.generationType,
            videosCount: e.videos?.length || 0,
            hasVideos: Array.isArray(e.videos) && e.videos.length > 0,
            videos: e.videos?.slice(0, 1).map((video: any) => ({
              id: video.id,
              url: video.url?.substring(0, 50) + '...',
              thumbnailUrl: video.thumbnailUrl ? 'present' : 'missing',
              avifUrl: video.avifUrl ? 'present' : 'missing'
            }))
          }))
        });

        // Always return a new array reference (even if contents are the same)
        return [...merged];
      });
      
      // Update cursor and hasMore after state update
      libraryVideoNextCursorRef.current = nextCursor;
      // Set hasMore: if there's a nextCursor, we definitely have more items to load
      // The presence of nextCursor is the definitive indicator from the backend
      const hasMoreItems = Boolean(nextCursor);
      console.log('[AnimateInputBox] fetchLibraryVideos result:', { 
        itemsCount: items.length, 
        requested: params.limit || 30, 
        nextCursor: nextCursor ? 'present' : 'null', 
        hasMoreItems
      });
      setLibraryVideoHasMore(hasMoreItems);
    } catch (e) {
      console.error('[AnimateInputBox] Failed to fetch library videos:', e);
    } finally {
      setLibraryVideoLoading(false);
    }
  }, [libraryVideoLoading, isUploadModalOpen, uploadModalType]);

  // When opening the VideoUploadModal, ensure initial video library is loaded
  // IMPORTANT: Videos are ONLY loaded when the modal opens, not before
  useEffect(() => {
    const needsLibrary = isUploadModalOpen && uploadModalType === 'video';
    if (needsLibrary) {
      // Always fetch videos when modal opens
      // Use fetchLibraryVideos which uses local state and doesn't affect Redux video history
      if (!libraryVideoInitRef.current) {
        console.log('[AnimateInputBox] Video upload modal opened - fetching videos...');
        libraryVideoInitRef.current = true;
        // Reset pagination state when opening modal to ensure fresh load
        libraryVideoNextCursorRef.current = undefined;
        setLibraryVideoHasMore(true);
        setLibraryVideoEntries([]); // Clear previous entries for fresh load
        setLibraryVideoLoading(false); // Ensure loading state is reset
        fetchLibraryVideos(true);
      }
      // Don't call loadHistory here - it would replace all Redux entries and clear video history!
      // Instead, rely on fetchLibraryVideos (local state) and allVideoHistoryEntries (already in Redux)
    } else {
      // Reset guard when modal closes or type changes so it can fetch fresh next time
      if (libraryVideoInitRef.current) {
        console.log('[AnimateInputBox] Video upload modal closed - resetting state');
      }
      libraryVideoInitRef.current = false;
    }
    // Deliberately not depending on fetchLibraryVideos or entries length to avoid re-running
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploadModalOpen, uploadModalType]);

  // Credits
  const credits = useAppSelector((state: any) => state.credits?.credits || 0);
  const liveCreditCost = useMemo(() => {
    // WAN 2.2 Animate is time-based (provider runtime). Frontend does NOT estimate.
    if (selectedModel === 'wan-2.2-animate-replace' || selectedModel === 'wan-2.2-animate-animation') {
      return 0;
    }

    // Other models can use their own internal defaults/estimates.
    return getVideoCreditCost(selectedModel, undefined, uploadedVideoDurationSec ?? undefined);
  }, [selectedModel, uploadedVideoDurationSec]);

  const loadVideoDurationSeconds = useCallback(async (url: string): Promise<number> => {
    return await new Promise((resolve, reject) => {
      if (!url) return resolve(0);

      const video = document.createElement('video');
      let done = false;

      const cleanup = () => {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch { }
      };

      const finish = (value: number, err?: any) => {
        if (done) return;
        done = true;
        cleanup();
        if (err) reject(err);
        else resolve(value);
      };

      const t = window.setTimeout(() => finish(0, new Error('Timed out loading video metadata')), 15000);

      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.clearTimeout(t);
        const d = Number(video.duration);
        if (Number.isFinite(d) && d > 0) return finish(d);
        return finish(0, new Error('Invalid video duration'));
      };
      video.onerror = () => {
        window.clearTimeout(t);
        finish(0, new Error('Failed to load video metadata'));
      };
      try {
        video.src = url;
      } catch (e) {
        window.clearTimeout(t);
        finish(0, e);
      }
    });
  }, []);

  // Handle model change
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  // Handle video upload from modal
  const handleVideoUploadFromModal = useCallback((urls: string[], _entries?: any[], filesByUrl?: Record<string, File>) => {
    const url = urls[0] || "";
    setUploadedVideo(url);
    setUploadedVideoDurationSec(null);
    if (filesByUrl && Object.keys(filesByUrl).length) {
      setLocalVideoFilesByUrl(prev => ({ ...prev, ...filesByUrl }));
    }
    if (url) {
      (async () => {
        try {
          const d = await loadVideoDurationSeconds(url);
          setUploadedVideoDurationSec(d);
        } catch (e) {
          console.warn('[AnimateInputBox] Failed to read video duration', e);
          setUploadedVideoDurationSec(null);
        }
      })();
    }
    setIsUploadModalOpen(false);
    toast.success("Video selected");
  }, [loadVideoDurationSeconds]);

  // Handle character image upload from modal
  const handleCharacterImageUploadFromModal = useCallback((urls: string[]) => {
    setUploadedCharacterImage(urls[0] || "");
    setIsUploadModalOpen(false);
    toast.success("Character image uploaded successfully");
  }, []);

  // Handle character video upload from modal (for Runway model when character type is video)
  const handleCharacterVideoUploadFromModal = useCallback((urls: string[], _entries?: any[], filesByUrl?: Record<string, File>) => {
    setUploadedCharacterImage(urls[0] || "");
    if (filesByUrl && Object.keys(filesByUrl).length) {
      setLocalVideoFilesByUrl(prev => ({ ...prev, ...filesByUrl }));
    }
    setIsUploadModalOpen(false);
    toast.success("Character video selected");
  }, []);

  const resolveVideoUrlForGenerate = useCallback(async (url: string): Promise<string> => {
    if (!url) return url;
    if (!url.startsWith('blob:')) return url;

    const cached = uploadedUrlByLocalUrl[url];
    if (cached) return cached;

    const file = localVideoFilesByUrl[url];
    if (!file) return url;

    const uploaded = await uploadLocalVideoFile(file);
    const remoteUrl = uploaded?.url || url;
    setUploadedUrlByLocalUrl(prev => ({ ...prev, [url]: remoteUrl }));
    try { URL.revokeObjectURL(url); } catch {}
    return remoteUrl;
  }, [localVideoFilesByUrl, uploadedUrlByLocalUrl]);

  // Group history by date
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    historyEntries.forEach((entry: HistoryEntry) => {
      const date = new Date(entry.timestamp || entry.createdAt || Date.now()).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    return groups;
  }, [historyEntries]);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Get today's date key for local preview display
  const todayKey = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Load history on mount using mode: 'video' (same as InputBox and History.tsx)
  // This ensures we get ALL video types including video-to-video (animate entries)
  const didInitialLoadRef = useRef(false);
  
  useEffect(() => {
    if (didInitialLoadRef.current) return;
    // Use mode: 'video' which backend converts to ['text-to-video', 'image-to-video', 'video-to-video']
    didInitialLoadRef.current = true;
    try {
      dispatch(loadHistory({ 
        filters: { mode: 'video' } as any, 
        paginationParams: { limit: 50 },
        requestOrigin: 'page',
        expectedType: 'video-to-video',
        debugTag: `AnimateInputBox:video-mode:${Date.now()}`
      } as any));
    } catch (e) {
      // swallow
    }
  }, [dispatch]);
  
  // Also refresh when component becomes visible (e.g., after tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh history using mode: 'video'
        setTimeout(() => {
          try {
            dispatch(loadHistory({ 
              filters: { mode: 'video' } as any, 
              paginationParams: { limit: 50 },
              requestOrigin: 'page',
              expectedType: 'video-to-video',
              debugTag: `AnimateInputBox:refresh:video-mode:${Date.now()}`
            } as any));
          } catch (e) {
            // swallow
          }
        }, 500);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as Element;
      
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(target)) {
        setResolutionDropdownOpen(false);
      }
      
      if (refFramesDropdownRef.current && !refFramesDropdownRef.current.contains(target)) {
        setRefFramesDropdownOpen(false);
      }
      
      if (runwayRatioDropdownRef.current && !runwayRatioDropdownRef.current.contains(target)) {
        setRunwayRatioDropdownOpen(false);
      }
      
      if (runwayCharacterTypeDropdownRef.current && !runwayCharacterTypeDropdownRef.current.contains(target)) {
        setRunwayCharacterTypeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!uploadedVideo) {
      toast.error("Video upload is mandatory");
      return;
    }

    const isRunwayModel = selectedModel === 'runway-act-two';
    
    // For Runway Act-Two, character can be image or video
    if (isRunwayModel) {
      if (runwayActTwoCharacterType === 'image' && !uploadedCharacterImage) {
        toast.error("Character image upload is mandatory");
        return;
      }
      if (runwayActTwoCharacterType === 'video' && !uploadedCharacterImage) {
        toast.error("Character video upload is mandatory (use character upload button)");
        return;
      }
      // Reference video is always required for Runway
      if (!uploadedVideo) {
        toast.error("Reference video upload is mandatory");
        return;
      }
    } else {
      // For WAN models, character image is always required
      if (!uploadedCharacterImage) {
        toast.error("Character image upload is mandatory");
        return;
      }
    }

    if (credits < liveCreditCost) {
      toast.error(`Insufficient credits. Required: ${liveCreditCost}, Available: ${credits}`);
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const api = getApiClient();

      // Defer local-file upload until Generate is clicked
      const resolvedUploadedVideo = await resolveVideoUrlForGenerate(uploadedVideo);
      if (resolvedUploadedVideo !== uploadedVideo) {
        setUploadedVideo(resolvedUploadedVideo);
      }

      let resolvedCharacterUri = uploadedCharacterImage;
      if (runwayActTwoCharacterType === 'video') {
        resolvedCharacterUri = await resolveVideoUrlForGenerate(uploadedCharacterImage);
        if (resolvedCharacterUri !== uploadedCharacterImage) {
          setUploadedCharacterImage(resolvedCharacterUri);
        }
      }
      
      // Handle Runway Act-Two model
      if (isRunwayModel) {
        const requestBody = {
          model: 'act_two',
          character: {
            type: runwayActTwoCharacterType,
            uri: resolvedCharacterUri,
          },
          reference: {
            type: 'video',
            uri: resolvedUploadedVideo,
          },
          ratio: runwayActTwoRatio,
          ...(runwayActTwoSeed !== undefined && { seed: runwayActTwoSeed }),
          ...(runwayActTwoBodyControl !== undefined && { bodyControl: runwayActTwoBodyControl }),
          ...(runwayActTwoExpressionIntensity !== undefined && { expressionIntensity: runwayActTwoExpressionIntensity }),
          generationType: 'video-to-video',
          isPublic: false,
          promptText: 'Act-Two generation',
        };

        console.log('Submitting Runway Act-Two request:', requestBody);

        const { data } = await api.post('/api/runway/character-performance', requestBody);
        const result = data?.data || data;

        if (result?.taskId) {
          toast.success("Generation started! Polling for results...");
          
          // Create local preview entry
          setLocalVideoPreview({
            id: `runway-act-two-loading-${Date.now()}`,
            prompt: "Act-Two generation",
            model: 'runway_act_two',
            generationType: "video-to-video" as any,
            images: [{ id: 'video-loading', url: '', originalUrl: '' }] as any,
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            imageCount: 1,
            status: 'generating',
          } as any);
          
          // Poll for results using Runway status endpoint
          let pollCount = 0;
          const maxPolls = 900; // 15 minutes max
          const pollInterval = 2000; // 2 seconds for Runway

          const pollForResult = async () => {
            try {
              const statusRes = await api.get(`/api/runway/status/${result.taskId}`);
              const status = statusRes.data?.data || statusRes.data;
              const statusValue = String(status?.status || '').toUpperCase();

              if (statusValue === 'SUCCEEDED') {
                // Get the result from status response
                // Check for videos array first (from history), then outputs/output (from task)
                let outputs = status?.videos || status?.outputs || status?.output || [];
                let videoUrl = '';
                
                // If outputs is an array of objects, extract the URL
                if (Array.isArray(outputs) && outputs.length > 0) {
                  const firstOutput = outputs[0];
                  if (typeof firstOutput === 'string') {
                    videoUrl = firstOutput;
                  } else if (firstOutput?.url) {
                    videoUrl = firstOutput.url;
                  } else if (firstOutput?.originalUrl) {
                    videoUrl = firstOutput.originalUrl;
                  } else if (firstOutput?.firebaseUrl) {
                    videoUrl = firstOutput.firebaseUrl;
                  }
                } else if (typeof outputs === 'string') {
                  videoUrl = outputs;
                }

                if (videoUrl) {
                  setIsGenerating(false);
                  toast.success("Generation completed!");
                  
                  // Update local preview to completed state
                  setLocalVideoPreview(prev => prev ? ({
                    ...prev,
                    status: 'completed',
                    images: [{ id: 'video-thumb', url: videoUrl, originalUrl: videoUrl, firebaseUrl: videoUrl }] as any,
                    timestamp: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                  } as any) : prev);
                  
                  // Fetch the actual entry from backend
                  if (result.historyId) {
                    try {
                      const historyRes = await api.get(`/api/generations/${result.historyId}`);
                      const historyData = historyRes.data?.data || historyRes.data;
                      
                      if (historyData) {
                        const backendEntry: HistoryEntry = {
                          ...historyData,
                          id: historyData.id || result.historyId,
                          prompt: historyData.prompt || "Act-Two generation",
                          model: historyData.model || 'runway_act_two',
                          frameSize: historyData.frameSize || "16:9",
                          images: historyData.images || historyData.videos || [{ 
                            id: `video-${Date.now()}`, 
                            url: videoUrl, 
                            originalUrl: videoUrl, 
                            firebaseUrl: videoUrl 
                          }],
                          videos: historyData.videos || [],
                          status: historyData.status || "completed",
                          timestamp: historyData.timestamp || historyData.createdAt || new Date().toISOString(),
                          createdAt: historyData.createdAt || new Date().toISOString(),
                          imageCount: historyData.imageCount || (historyData.images?.length || historyData.videos?.length || 1),
                          generationType: historyData.generationType || "video-to-video",
                        } as any;
                        
                        dispatch(addHistoryEntry(backendEntry));
                        
                        // Refresh history
                        setTimeout(() => {
                          try {
                            dispatch(loadHistory({ 
                              filters: { mode: 'video' } as any, 
                              paginationParams: { limit: 50 },
                              requestOrigin: 'page',
                              expectedType: 'video-to-video',
                              debugTag: `AnimateInputBox:post-gen:runway:${Date.now()}`
                            } as any));
                          } catch (e) {
                            // swallow
                          }
                        }, 500);
                      }
                    } catch (fetchError) {
                      console.error("Failed to fetch history entry from backend:", fetchError);
                    }
                  }
                  
                  setUploadedVideo("");
                  setUploadedCharacterImage("");
                  return;
                }
              } else if (statusValue === 'FAILED' || statusValue === 'CANCELLED') {
                setIsGenerating(false);
                toast.error(status?.error || "Generation failed");
                setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);
                return;
              }

              pollCount++;
              if (pollCount < maxPolls) {
                setTimeout(pollForResult, pollInterval);
              } else {
                setIsGenerating(false);
                toast.error("Generation timed out. Please check your history.");
                setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);
              }
            } catch (pollError: any) {
              console.error("Polling error:", pollError);
              pollCount++;
              if (pollCount < maxPolls) {
                setTimeout(pollForResult, pollInterval);
              } else {
                setIsGenerating(false);
                toast.error("Failed to check generation status");
                setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);
              }
            }
          };

          setTimeout(pollForResult, pollInterval);
        } else {
          throw new Error("Invalid response from server");
        }
        return;
      }
      
      // Handle WAN models (existing logic)
      // Determine API endpoint and model name based on selected model
      const isAnimationModel = selectedModel === 'wan-2.2-animate-animation';
      const apiEndpoint = isAnimationModel 
        ? '/api/replicate/wan-2-2-animate-animation/submit'
        : '/api/replicate/wan-2-2-animate-replace/submit';
      const modelName = isAnimationModel
        ? 'wan-video/wan-2.2-animate-animation'
        : 'wan-video/wan-2.2-animate-replace';

      // Build request body exactly as in InputBox
      if (!uploadedVideoDurationSec || uploadedVideoDurationSec <= 0) {
        toast.error('Could not determine input video duration. Please re-upload the video.');
        setIsGenerating(false);
        return;
      }

      // Credits are billed on the backend based on provider processing time.

      const requestBody = {
        model: modelName,
        video: uploadedVideo,
        character_image: uploadedCharacterImage,
        video_duration: uploadedVideoDurationSec,
        resolution: wanAnimateResolution,
        refert_num: wanAnimateRefertNum,
        go_fast: wanAnimateGoFast,
        merge_audio: wanAnimateMergeAudio,
        frames_per_second: wanAnimateFps,
        ...(wanAnimateSeed !== undefined && { seed: wanAnimateSeed }),
        generationType: 'video-to-video',
        isPublic: false,
        originalPrompt: '',
        prompt: isAnimationModel ? "Animate Animation generation" : "Animate Replace generation",
      };

      console.log(`Submitting WAN 2.2 Animate ${isAnimationModel ? 'Animation' : 'Replace'} request:`, requestBody);

      const { data } = await api.post(apiEndpoint, requestBody);
      const result = data?.data || data;

      if (result?.requestId) {
        toast.success("Generation started! Polling for results...");
        
        // Create local preview entry (history-style) to show generating tile in today's row
        setLocalVideoPreview({
          id: `animate-loading-${Date.now()}`,
          prompt: isAnimationModel ? "Animate Animation generation" : "Animate Replace generation",
          model: modelName,
          generationType: "text-to-video" as any,
          images: [{ id: 'video-loading', url: '', originalUrl: '' }] as any,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          imageCount: 1,
          status: 'generating',
        } as any);
        
        // Poll for results (same logic as InputBox)
        let pollCount = 0;
        const maxPolls = 900; // 15 minutes max
        const pollInterval = 1000; // 1 second
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        const pollForResult = async () => {
          try {
            const statusRes = await api.get('/api/replicate/queue/status', {
              params: { requestId: result.requestId },
              timeout: 20000
            });
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || '').toLowerCase();
            consecutiveErrors = 0;

            if (statusValue === 'completed' || statusValue === 'success' || statusValue === 'succeeded') {
              const resultRes = await api.get('/api/replicate/queue/result', {
                params: { requestId: result.requestId },
                timeout: 20000
              });
              const videoResult = resultRes.data?.data || resultRes.data;
              
              let videoUrl = '';
              if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
                videoUrl = videoResult.videos[0].url;
              } else if (videoResult?.video && videoResult.video?.url) {
                videoUrl = videoResult.video.url;
              } else if (typeof videoResult?.output === 'string' && videoResult.output.startsWith('http')) {
                videoUrl = videoResult.output;
              } else if (Array.isArray(videoResult?.output) && videoResult.output[0] && typeof videoResult.output[0] === 'string') {
                videoUrl = videoResult.output[0];
              }

              if (videoUrl) {
                setIsGenerating(false);
                toast.success("Generation completed!");
                
                // Update local preview to completed state
                setLocalVideoPreview(prev => prev ? ({
                  ...prev,
                  status: 'completed',
                  images: [{ id: 'video-thumb', url: videoUrl, originalUrl: videoUrl, firebaseUrl: videoUrl }] as any,
                  timestamp: new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                } as any) : prev);
                
                // Fetch the actual entry from backend to ensure it matches backend structure
                if (result.historyId) {
                  try {
                    const historyRes = await api.get(`/api/generations/${result.historyId}`, { timeout: 20000 });
                    const historyData = historyRes.data?.data || historyRes.data;
                    
                    if (historyData) {
                      // Use the backend's version of the entry (it has the correct structure)
                      // Preserve all fields from backend, especially generationType which might be "video-to-video"
                      const backendEntry: HistoryEntry = {
                        ...historyData,
                        id: historyData.id || result.historyId,
                        prompt: historyData.prompt || (isAnimationModel ? "Animate Animation generation" : "Animate Replace generation"),
                        model: historyData.model || modelName,
                        frameSize: historyData.frameSize || "16:9",
                        images: historyData.images || historyData.videos || [{ 
                          id: `video-${Date.now()}`, 
                          url: videoUrl, 
                          originalUrl: videoUrl, 
                          firebaseUrl: videoUrl 
                        }],
                        videos: historyData.videos || [],
                        status: historyData.status || "completed",
                        timestamp: historyData.timestamp || historyData.createdAt || new Date().toISOString(),
                        createdAt: historyData.createdAt || new Date().toISOString(),
                        imageCount: historyData.imageCount || (historyData.images?.length || historyData.videos?.length || 1),
                        // Preserve backend's generationType (might be "video-to-video" or "text-to-video")
                        generationType: historyData.generationType || "text-to-video",
                      } as any;
                      
                      dispatch(addHistoryEntry(backendEntry));
                      
                      // Refresh history using mode: 'video' to ensure the new entry appears
                      setTimeout(() => {
                        try {
                          dispatch(loadHistory({ 
                            filters: { mode: 'video' } as any, 
                            paginationParams: { limit: 50 },
                            requestOrigin: 'page',
                            expectedType: 'video-to-video',
                            debugTag: `AnimateInputBox:post-gen:video-mode:${Date.now()}`
                          } as any));
                        } catch (e) {
                          // swallow
                        }
                      }, 500);
                    } else {
                      // Fallback to local entry if backend fetch fails
                      const historyEntry: HistoryEntry = {
                        id: result.historyId,
                        prompt: isAnimationModel ? "Animate Animation generation" : "Animate Replace generation",
                        model: modelName,
                        frameSize: "16:9",
                        images: [{ 
                          id: `video-${Date.now()}`, 
                          url: videoUrl, 
                          originalUrl: videoUrl, 
                          firebaseUrl: videoUrl 
                        }],
                        status: "completed",
                        timestamp: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        imageCount: 1,
                        generationType: "text-to-video",
                      } as any;
                      dispatch(addHistoryEntry(historyEntry));
                    }
                  } catch (fetchError) {
                    console.error("Failed to fetch history entry from backend:", fetchError);
                    // Fallback to local entry
                    const historyEntry: HistoryEntry = {
                      id: result.historyId,
                      prompt: isAnimationModel ? "Animate Animation generation" : "Animate Replace generation",
                      model: modelName,
                      frameSize: "16:9",
                      images: [{ 
                        id: `video-${Date.now()}`, 
                        url: videoUrl, 
                        originalUrl: videoUrl, 
                        firebaseUrl: videoUrl 
                      }],
                      status: "completed",
                      timestamp: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                      imageCount: 1,
                      generationType: "text-to-video",
                    } as any;
                    dispatch(addHistoryEntry(historyEntry));
                  }
                } else {
                  // No historyId, create local entry
                  const historyEntry: HistoryEntry = {
                    id: `animate-${Date.now()}`,
                    prompt: isAnimationModel ? "Animate Animation generation" : "Animate Replace generation",
                    model: modelName,
                    frameSize: "16:9",
                    images: [{ 
                      id: `video-${Date.now()}`, 
                      url: videoUrl, 
                      originalUrl: videoUrl, 
                      firebaseUrl: videoUrl 
                    }],
                    status: "completed",
                    timestamp: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    imageCount: 1,
                    generationType: "text-to-video",
                  } as any;
                  dispatch(addHistoryEntry(historyEntry));
                }
                
                setUploadedVideo("");
                setUploadedCharacterImage("");
                return;
              }
            } else if (statusValue === 'failed' || statusValue === 'error') {
              setIsGenerating(false);
              toast.error(status?.error || "Generation failed");
              
              // Update local preview to failed state
              setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);
              
              return;
            }

            pollCount++;
            if (pollCount < maxPolls) {
              setTimeout(pollForResult, pollInterval);
            } else {
              setIsGenerating(false);
              toast.error("Generation timed out. Please check your history.");
              
              // Update local preview to failed state
              setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);
            }
          } catch (pollError: any) {
            console.error("Polling error:", pollError);
            pollCount++;
            if (pollCount < maxPolls) {
              setTimeout(pollForResult, pollInterval);
            } else {
              setIsGenerating(false);
              toast.error("Failed to check generation status");
              
              // Update local preview to failed state
              setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);
            }
          }
        };

        setTimeout(pollForResult, pollInterval);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setIsGenerating(false);
      const errorMessage = err?.response?.data?.message || err?.message || "Generation failed";
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Update local preview to failed state
      setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);
    }
  }, [
    prompt,
    uploadedVideo,
    uploadedCharacterImage,
    wanAnimateResolution,
    wanAnimateRefertNum,
    wanAnimateGoFast,
    wanAnimateMergeAudio,
    wanAnimateFps,
    wanAnimateSeed,
    credits,
    liveCreditCost,
    dispatch,
    selectedModel,
    runwayActTwoRatio,
    runwayActTwoCharacterType,
    runwayActTwoSeed,
    runwayActTwoBodyControl,
    runwayActTwoExpressionIntensity,
  ]);

  return (
    <React.Fragment>
      {/* History Section - Videos displayed above input box */}
      {showHistory && (
        <div className="mb-6 inset-0 pl-[0] pr-6 overflow-y-auto no-scrollbar z-0 pb-96">
          {/* Search Input */}
          {/* <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search videos by prompt or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          </div> */}
          <div className="space-y-2 md:space-y-8">
            {/* If there's a local preview and no row for today, render a dated block for today */}
            {localVideoPreview && !groupedByDate[todayKey] && (
              <div className="space-y-1 md:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white/70">
                    {todayKey}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-3 ml-2">
                  <div className={`relative ${localVideoPreview.status === 'generating' ? 'w-auto h-auto max-w-[200px] max-h-[200px] md:w-64 md:h-auto md:max-h-80' : 'w-auto h-auto max-w-[200px] max-h-[200px] md:w-auto md:h-auto md:max-w-80'} rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10`}>
                    {localVideoPreview.status === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/90">
                        <div className="flex flex-col items-center gap-2">
                          <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" unoptimized />
                          <div className="text-xs text-white/60">Generating...</div>
                        </div>
                      </div>
                    ) : localVideoPreview.status === 'failed' ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                        <div className="flex flex-col items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                          </svg>
                          <div className="text-xs text-red-400">Failed</div>
                        </div>
                      </div>
                    ) : (localVideoPreview.images && localVideoPreview.images[0]?.url) ? (
                      <div className="relative w-full h-full">
                        <Image src={localVideoPreview.images[0].url} alt="Video preview" fill className="object-cover" sizes="192px" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                        <div className="text-xs text-white/60">No preview</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {sortedDates.length > 0 ? (
              sortedDates.map((date) => (
                <div key={date} className="space-y-1 md:space-y-4">
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
                    <h3 className="text-sm font-medium text-white/70">{date}</h3>
                  </div>

                  {/* Videos for this Date */}
                  <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-3 ml-0">
                    {/* Prepend local video preview to today's row to push existing items right */}
                    {date === todayKey && localVideoPreview && (
                      <div className={`relative ${localVideoPreview.status === 'generating' ? 'w-auto h-auto max-w-[200px] max-h-[200px] md:w-full md:h-auto md:max-h-64' : 'w-auto h-auto max-w-[200px] max-h-[200px] md:w-auto md:h-auto md:max-w-120'} rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10`}>
                        {localVideoPreview.status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/90">
                            <div className="flex flex-col items-center gap-2">
                              <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" unoptimized />
                              <div className="text-xs text-white/60 text-center">Generating...</div>
                            </div>
                          </div>
                        ) : localVideoPreview.status === 'failed' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                            <div className="flex flex-col items-center gap-2">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                              <div className="text-xs text-red-400">Failed</div>
                            </div>
                          </div>
                        ) : (localVideoPreview.images && localVideoPreview.images[0]?.url) ? (
                          <div className="relative w-full h-full">
                            <Image src={localVideoPreview.images[0].url} alt="Video preview" fill className="object-cover" sizes="192px" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                            <div className="text-xs text-white/60">No preview</div>
                          </div>
                        )}
                      </div>
                    )}
                    {groupedByDate[date].map((entry: HistoryEntry) => {
                      // Get media items (videos or images) - same logic as InputBox
                      let mediaItems: any[] = [];
                      if (entry.images && Array.isArray(entry.images) && entry.images.length > 0) {
                        mediaItems = entry.images;
                      } else if (entry.videos && Array.isArray(entry.videos) && entry.videos.length > 0) {
                        mediaItems = entry.videos;
                      }

                      // If no media items, render a single placeholder
                      if (mediaItems.length === 0) {
                        return (
                          <div
                            key={entry.id}
                            className="relative w-auto h-auto max-w-[200px] max-h-[200px] md:w-auto md:h-auto md:max-w-64 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10"
                          >
                            {entry.status === "generating" ? (
                              <div className="w-full h-full flex items-center justify-center bg-black/90">
                                <div className="flex flex-col items-center gap-2">
                                  <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" unoptimized />
                                  <div className="text-xs text-white/60 text-center">Generating...</div>
                                </div>
                              </div>
                            ) : entry.status === "failed" ? (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/20 to-red-800/20">
                                <div className="flex flex-col items-center gap-2">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-400">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                  </svg>
                                  <div className="text-xs text-red-400">Failed</div>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-800/20 to-gray-900/20 flex items-center justify-center">
                                <div className="text-xs text-white/60">No video</div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Map over media items (same as InputBox)
                      return mediaItems.map((video: any) => {
                        // Check if video has a valid URL
                        const hasVideoUrl = !!(video.firebaseUrl || video.url);
                        // If video has URL but status is "generating", treat as completed (old entries might not have status updated)
                        const effectiveStatus = hasVideoUrl && entry.status === "generating" ? "completed" : entry.status;
                        
                        return (
                        <div
                          key={`${entry.id}-${video.id}`}
                          data-video-id={`${entry.id}-${video.id}`}
                          onClick={(e) => {
                            // Don't open preview if clicking on copy button
                            if ((e.target as HTMLElement).closest('button[aria-label="Copy prompt"]')) {
                              return;
                            }
                            setPreview({ entry, video });
                          }}
                          className="relative w-auto h-auto max-w-[200px] max-h-[200px] md:w-auto md:h-auto md:max-w-64 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                        >
                          {effectiveStatus === "generating" ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-black/90">
                              <div className="flex flex-col items-center gap-2">
                                <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" unoptimized />
                                <div className="text-xs text-white/60 text-center">
                                  Generating...
                                </div>
                              </div>
                            </div>
                          ) : effectiveStatus === "failed" ? (
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
                            // Completed video thumbnail (exact same as History.tsx)
                            <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center relative group">
                              {(video.firebaseUrl || video.url) ? (
                                (() => {
                                  const mediaUrl = video.firebaseUrl || video.url;
                                  const proxied = toFrontendProxyMediaUrl(mediaUrl);
                                  const vsrc = proxied || mediaUrl;
                                  return (
                                    <video 
                                      src={vsrc} 
                                      className="w-full h-full object-cover transition-opacity duration-200" 
                                      muted 
                                      playsInline 
                                      loop 
                                      preload="metadata"
                                      poster={(video as any).thumbnailUrl || (video as any).avifUrl || undefined}
                                      onMouseEnter={async (e) => { 
                                        try { 
                                          await (e.currentTarget as HTMLVideoElement).play();
                                        } catch { } 
                                      }}
                                      onMouseLeave={(e) => { 
                                        const v = e.currentTarget as HTMLVideoElement; 
                                        try { v.pause(); v.currentTime = 0 } catch { }
                                      }}
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const videoEl = e.currentTarget;
                                        
                                        if (videoEl.paused) {
                                          try {
                                            await videoEl.play();
                                          } catch (error) {
                                            // silent
                                          }
                                        } else {
                                          videoEl.pause();
                                          videoEl.currentTime = 0;
                                        }
                                      }}
                                      onLoadStart={() => { /* silent */ }}
                                      onLoadedData={() => { /* silent */ }}
                                      onCanPlay={() => { /* silent */ }}
                                    />
                                  );
                                })()
                              ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">Video not available</span>
                                </div>
                              )}
                              {/* Video play icon overlay */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                              {/* Hover buttons overlay */}
                              <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                                <button
                                  aria-label="Copy prompt"
                                  className="pointer-events-auto p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white/90 backdrop-blur-3xl"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    const cleanPrompt = entry.prompt?.replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim() || '';
                                    navigator.clipboard.writeText(cleanPrompt);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                </button>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                        );
                      });
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-white/60 text-sm text-center py-8">
                No generated videos yet. Create your first video below!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Box - Fixed at bottom like original InputBox */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:w-[45%] w-[90%]  z-[0] rounded-lg bg-gradient-to-b from-white/5 to-white/5 border border-white/10 backdrop-blur-xl p-0 px-2 md:py-4 py-2">
        {/* Top row: upload buttons */}
        <div className="flex items-start gap-3 mb-0">
          <div className="flex flex-row gap-0">
            {/* Video Upload Button */}
            <div className="relative">
              <button
                className="p-0 md:pl-2 rounded-lg transition-all duration-200 cursor-pointer group relative"
                onClick={() => {
                  setIsVideoModalForCharacter(false);
                  setUploadModalType('video');
                  setIsUploadModalOpen(true);
                }}
              >
                <div className="relative">
                  <FilePlay
                    size={30}
                    className="rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-purple-300 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                    Upload video (mandatory)
                  </div>
                </div>
              </button>
            </div>

            {/* Character Upload Button - Image or Video based on model and character type */}
            <div className="relative">
              <button
                className="p-0 pl-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                onClick={() => {
                  // For Runway model, check character type to determine modal type
                  if (selectedModel === 'runway-act-two' && runwayActTwoCharacterType === 'video') {
                    console.log('[AnimateInputBox] 🎥 Upload character video button clicked');
                    setIsVideoModalForCharacter(true);
                    setUploadModalType('video');
                    setIsUploadModalOpen(true);
                    console.log('[AnimateInputBox] 🎥 Modal state updated:', { type: 'video', open: true, forCharacter: true });
                  } else {
                    console.log('[AnimateInputBox] 🖼️ Upload character image button clicked');
                    setIsVideoModalForCharacter(false);
                    setUploadModalType('image');
                    setIsUploadModalOpen(true);
                    console.log('[AnimateInputBox] 🖼️ Modal state updated:', { type: 'image', open: true });
                  }
                }}
              >
                <div className="relative">
                  <FilePlus2
                    size={30}
                    className="rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                    {selectedModel === 'runway-act-two' && runwayActTwoCharacterType === 'video' 
                      ? 'Upload character video' 
                      : 'Upload character'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Uploaded Content Display */}
        <div className="md:px-3 px-0 md:pb-3 pb-0">
          {/* Uploaded Video and Character Image - Side by Side */}
          {(uploadedVideo || uploadedCharacterImage) && (
            <div className="md:mb-3 mb-0 flex items-start gap-3">
              {/* Uploaded Video */}
              {uploadedVideo && (
                <div className="flex-shrink-0">
                  <div className="text-xs text-white/60 md:mb-2 mb-1">Uploaded Video</div>
                  <div className="relative group">
                    <div
                      className="w-auto  h-18 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer relative"
                      // onClick={() => {
                      //   const previewEntry: HistoryEntry = {
                      //     id: "preview-video",
                      //     prompt: "Uploaded Video",
                      //     model: "preview",
                      //     frameSize: "16:9",
                      //     images: [{ id: "video-1", url: uploadedVideo, originalUrl: uploadedVideo, firebaseUrl: uploadedVideo }],
                      //     status: "completed",
                      //     timestamp: new Date().toISOString(),
                      //     createdAt: new Date().toISOString(),
                      //     imageCount: 1,
                      //     generationType: "text-to-video",
                      //   };
                      //   setPreview({ entry: previewEntry, video: uploadedVideo });
                      // }}
                    >
                      {/* Video element with hover play */}
                      {(() => {
                        // Use proxy URL if it's a storage path, otherwise use the URL directly
                        const proxied = toFrontendProxyMediaUrl(uploadedVideo);
                        const videoSrc = proxied || (uploadedVideo && (uploadedVideo.startsWith('http://') || uploadedVideo.startsWith('https://')) ? uploadedVideo : uploadedVideo);
                        
                        return (
                          <video
                            src={videoSrc}
                            className="w-full h-full object-cover transition-opacity duration-200"
                            muted
                            playsInline
                            loop
                            preload="metadata"
                            onMouseEnter={async (e) => {
                              try {
                                await (e.currentTarget as HTMLVideoElement).play();
                              } catch (err) {
                                // Silent fail
                              }
                            }}
                            onMouseLeave={(e) => {
                              const v = e.currentTarget as HTMLVideoElement;
                              try {
                                v.pause();
                                v.currentTime = 0;
                              } catch (err) {
                                // Silent fail
                              }
                            }}
                            onError={(e) => {
                              console.error('[AnimateInputBox] Video load error:', {
                                src: videoSrc,
                                originalUrl: uploadedVideo,
                                proxied,
                                error: e
                              });
                            }}
                          />
                        );
                      })()}
                      {/* Remove button */}
                      <button
                        aria-label="Remove video"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white backdrop-blur-sm z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedVideo("");
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Character Image or Video */}
              {uploadedCharacterImage && (
                <div className="flex-shrink-0">
                  <div className="text-xs text-white/60 md:mb-2 mb-1">
                    {selectedModel === 'runway-act-two' && runwayActTwoCharacterType === 'video' 
                      ? 'Character Video' 
                      : 'Character Image'}
                  </div>
                  <div className="relative group">
                    {selectedModel === 'runway-act-two' && runwayActTwoCharacterType === 'video' ? (
                      // Show video player for character video
                      <div className="w-auto h-18 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer relative">
                        <video
                          src={uploadedCharacterImage}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => {
                            const video = e.currentTarget;
                            video.play();
                          }}
                          onMouseLeave={(e) => {
                            const video = e.currentTarget;
                            video.pause();
                            video.currentTime = 0;
                          }}
                        />
                        {/* Remove button */}
                        <button
                          aria-label="Remove character video"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white backdrop-blur-sm z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedCharacterImage("");
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      // Show image for character image
                      <div className="w-auto h-18 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer relative">
                        <img
                          src={uploadedCharacterImage}
                          alt="Character"
                          className="w-full h-full object-cover"
                        />
                        {/* Remove button */}
                        <button
                          aria-label="Remove character image"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white backdrop-blur-sm z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedCharacterImage("");
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom row: model selector, parameters, and generate button */}
        {/* Mobile: 3 rows - First: model + generate, Second: dropdowns, Third: FPS + checkboxes */}
        {/* Desktop: Original layout */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 md:px-3 px-0">
          {/* Mobile First Row: Model Dropdown and Generate Button */}
          <div className="flex flex-row items-center justify-between gap-2 md:hidden md:mb-0 ">
            
            <div className="w-full md:mb-0  -mb-10">
            <VideoModelsDropdown
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              generationMode="video_to_video"
              selectedDuration="5s"
              activeFeature="Animate"
              onCloseOtherDropdowns={() => {}}
            /></div>
            <div className="flex flex-col items-end gap-2 ">
              <div className="text-white/80 text-xs">
                Total credits:{' '}
                <span className="font-semibold">
                  {(selectedModel === 'wan-2.2-animate-replace' || selectedModel === 'wan-2.2-animate-animation')
                    ? 'Credits will be calculated based on processing time'
                    : liveCreditCost}
                </span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !uploadedVideo || !uploadedCharacterImage}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white md:px-4 px-2 md:py-2 py-1.5 rounded-lg md:text-sm text-[11px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>

          {/* Desktop: Left side with all controls */}
          <div className="hidden md:flex md:flex-col md:gap-3 md:flex-wrap">
            {/* Model Parameters - Conditional based on selected model */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-row gap-2 flex-wrap">
                <VideoModelsDropdown
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  generationMode="video_to_video"
                  selectedDuration="5s"
                  activeFeature="Animate"
                  onCloseOtherDropdowns={() => {}}
                />
                
                {/* WAN 2.2 Animate Parameters - Only show for WAN models */}
                {selectedModel !== 'runway-act-two' && (
                  <>
                    {/* Resolution Dropdown - 480 or 720 ONLY */}
                    <div className="relative" ref={resolutionDropdownRef}>
                  <button
                    onClick={() => setResolutionDropdownOpen(!resolutionDropdownOpen)}
                    className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                  >
                    <Monitor className="w-4 h-4 mr-1" />
                    {wanAnimateResolution}p
                    <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${resolutionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {resolutionDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 md:w-32 w-28 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 md:pt-2 pt-1 z-50">
                      <button
                        onClick={() => {
                          setWanAnimateResolution("720");
                          setResolutionDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                          wanAnimateResolution === "720" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>720p</span>
                        {wanAnimateResolution === "720" && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                      <button
                        onClick={() => {
                          setWanAnimateResolution("480");
                          setResolutionDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                          wanAnimateResolution === "480" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>480p</span>
                        {wanAnimateResolution === "480" && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                    </div>
                  )}
                </div>
                {/* Refert Num - 1 or 5 */}
                <div className="relative" ref={refFramesDropdownRef}>
                  <button
                    onClick={() => setRefFramesDropdownOpen(!refFramesDropdownOpen)}
                    className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                  >
                    <span>Ref Frames: {wanAnimateRefertNum}</span>
                    <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${refFramesDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {refFramesDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
                      <button
                        onClick={() => {
                          setWanAnimateRefertNum(1);
                          setRefFramesDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                          wanAnimateRefertNum === 1 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>Ref Frames: 1</span>
                        {wanAnimateRefertNum === 1 && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                      <button
                        onClick={() => {
                          setWanAnimateRefertNum(5);
                          setRefFramesDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                          wanAnimateRefertNum === 5 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>Ref Frames: 5</span>
                        {wanAnimateRefertNum === 5 && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                    </div>
                  )}
                </div>
                  </>
                )}
                
                {/* Runway Act-Two Parameters - Only show for Runway model */}
                {selectedModel === 'runway-act-two' && (
                  <>
                    {/* Ratio Dropdown */}
                    <div className="relative" ref={runwayRatioDropdownRef}>
                      <button
                        onClick={() => setRunwayRatioDropdownOpen(!runwayRatioDropdownOpen)}
                        className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                      >
                        <span>{runwayActTwoRatio}</span>
                        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${runwayRatioDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {runwayRatioDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-2 md:w-48 w-32 bg-black/80 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-0 pt-0 z-50">
                          {([
                            { value: '1280:720', label: '720P', description: 'HD Quality (1280x720)' },
                            { value: '720:1280', label: '1080P', description: 'HD Quality (720x1280)' },
                            { value: '960:960', label: '640P', description: 'Square Quality (960x960)' },
                            { value: '1104:832', label: '720P', description: 'HD Quality (1104x832)' },
                            { value: '832:1104', label: '720P', description: 'HD Quality (832x1104)' },
                            { value: '1584:672', label: '1080P', description: 'Full HD Quality (1584x672)' },
                          ] as const).map((ratio) => (
                            <button
                              key={ratio.value}
                              onClick={() => {
                                setRunwayActTwoRatio(ratio.value as any);
                                setRunwayRatioDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2 text-left transition-all duration-200  flex items-center justify-between ${
                                runwayActTwoRatio === ratio.value
                                  ? 'bg-white'
                                  : 'hover:bg-white/10'
                              }`}
                            >
                              <div className="flex flex-col items-start">
                                <span className={`font-medium md:text-sm text-[11px] ${runwayActTwoRatio === ratio.value ? 'text-black' : 'text-white/90'}`}>{ratio.label}</span>
                                <span className={`md:text-xs text-[9px] ${runwayActTwoRatio === ratio.value ? 'text-black/80' : 'text-white/60'}`}>{ratio.description}</span>
                              </div>
                              {runwayActTwoRatio === ratio.value && (
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Character Type Dropdown */}
                    <div className="relative" ref={runwayCharacterTypeDropdownRef}>
                      <button
                        onClick={() => setRunwayCharacterTypeDropdownOpen(!runwayCharacterTypeDropdownOpen)}
                        className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                      >
                        <span>Character: {runwayActTwoCharacterType === 'image' ? 'Image' : 'Video'}</span>
                        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${runwayCharacterTypeDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {runwayCharacterTypeDropdownOpen && (
                        <div className="absolute bottom-full left-0 mb-2 md:w-48 w-32 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30  z-50">
                          {(['image', 'video'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                // Clear uploaded character when switching types
                                if (runwayActTwoCharacterType !== type) {
                                  setUploadedCharacterImage("");
                                }
                                setRunwayActTwoCharacterType(type);
                                setRunwayCharacterTypeDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                                runwayActTwoCharacterType === type ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                              }`}
                            >
                              <span>{type === 'image' ? 'Image' : 'Video'}</span>
                              {runwayActTwoCharacterType === type && <div className="w-2 h-2 bg-black rounded-full"></div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* WAN 2.2 Animate Checkboxes and FPS - Only show for WAN models */}
              {selectedModel !== 'runway-act-two' && (
                <>
                 <div className="flex flex-row gap-2">
                  {/* FPS Input with Slider */}
                  <div className="flex flex-col gap-2  mb-2">
                    <div className="flex items-center gap-2">
                      <label className="md:text-sm text-xs text-white/80">Frames per second:</label>
                       <input
                         type="number"
                         min={5}
                         max={60}
                         value={wanAnimateFps}
                         onChange={(e) => {
                           const val = parseInt(e.target.value, 10);
                           if (!isNaN(val) && val >= 5 && val <= 60) {
                             setWanAnimateFps(val);
                           }
                         }}
                         className="md:h-[28px] h-[24px] rounded-lg md:text-[13px] text-[11px] font-medium border border-white/10 bg-transparwnr text-white/80 w-16 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                       />
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={60}
                      value={wanAnimateFps}
                      onChange={(e) => setWanAnimateFps(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                      style={{
                        background: `linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${((wanAnimateFps - 5) / (60 - 5)) * 100}%, rgba(255,255,255,0.1) ${((wanAnimateFps - 5) / (60 - 5)) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                  {/* Go Fast Checkbox */}
                  <div className="flex flex-row gap-4 pt-6">
                  <label className="flex items-center gap-1 cursor-pointer group hover:opacity-90 transition-opacity">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={wanAnimateGoFast}
                          onChange={(e) => setWanAnimateGoFast(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 text-white cursor-pointer appearance-none checked:bg-white checked:border-white transition-all duration-200"
                        />
                        {wanAnimateGoFast && (
                          <svg
                            className="absolute w-3 h-3 text-black pointer-events-none"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="md:text-sm text-[11px] font-medium text-white/90 group-hover:text-white transition-colors">Go fast </span>
                      </div>
                    </label>
                    {/* Merge Audio Checkbox */}
                    <label className="flex items-center gap-1 cursor-pointer group hover:opacity-90 transition-opacity">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={wanAnimateMergeAudio}
                          onChange={(e) => setWanAnimateMergeAudio(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 text-white cursor-pointer appearance-none checked:bg-white checked:border-white transition-all duration-200"
                        />
                        {wanAnimateMergeAudio && (
                          <svg
                            className="absolute w-3 h-3 text-black pointer-events-none"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="md:text-sm text-[11px] font-medium text-white/90 group-hover:text-white transition-colors">Merge audio </span>
                      </div>
                    </label>
                    </div>
                    </div>
                </>
              )}
              
              {/* Runway Act-Two Checkboxes and Slider - Only show for Runway model */}
              {selectedModel === 'runway-act-two' && (
                <>
                  <div className="flex flex-row gap-5">
                  {/* Expression Intensity Slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="md:text-sm text-[11px] text-white/80">Expression Intensity:</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={runwayActTwoExpressionIntensity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            setRunwayActTwoExpressionIntensity(val);
                          }
                        }}
                        className="md:h-[28px] h-[24px] rounded-lg md:text-[13px] text-[11px] font-medium border border-white/10 bg-transparent text-white/80 w-14 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={runwayActTwoExpressionIntensity}
                      onChange={(e) => setRunwayActTwoExpressionIntensity(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                      style={{
                        background: `linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${((runwayActTwoExpressionIntensity - 1) / (5 - 1)) * 100}%, rgba(255,255,255,0.1) ${((runwayActTwoExpressionIntensity - 1) / (5 - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>

                   {/* Body Control Checkbox */}
                   <label className="flex items-center gap-1 cursor-pointer group hover:opacity-90 transition-opacity pt-7">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={runwayActTwoBodyControl}
                          onChange={(e) => setRunwayActTwoBodyControl(e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 text-white cursor-pointer appearance-none checked:bg-white checked:border-white transition-all duration-200"
                        />
                        {runwayActTwoBodyControl && (
                          <svg
                            className="absolute w-3 h-3 text-black pointer-events-none"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="md:text-sm text-[11px] font-medium text-white/90 group-hover:text-white transition-colors">Body control  <span className="md:text-xs text-[9px] text-white/50">(Enable body movements)</span> </span>

                      </div>
                    </label>
                    </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Second Row: Other Dropdowns */}
          <div className="flex flex-row gap-2 flex-wrap md:hidden">
            {/* WAN 2.2 Animate Parameters - Only show for WAN models */}
            {selectedModel !== 'runway-act-two' && (
              <>
                {/* Resolution Dropdown - 480 or 720 ONLY */}
                <div className="relative" ref={resolutionDropdownRef}>
                  <button
                    onClick={() => setResolutionDropdownOpen(!resolutionDropdownOpen)}
                    className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                  >
                    <Monitor className="w-4 h-4 mr-1" />
                    {wanAnimateResolution}p
                    <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${resolutionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {resolutionDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 md:w-32 w-28 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
                      <button
                        onClick={() => {
                          setWanAnimateResolution("720");
                          setResolutionDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                          wanAnimateResolution === "720" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>720p</span>
                        {wanAnimateResolution === "720" && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                      <button
                        onClick={() => {
                          setWanAnimateResolution("480");
                          setResolutionDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                          wanAnimateResolution === "480" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>480p</span>
                        {wanAnimateResolution === "480" && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                    </div>
                  )}
                </div>
                {/* Refert Num - 1 or 5 */}
                <div className="relative" ref={refFramesDropdownRef}>
                  <button
                    onClick={() => setRefFramesDropdownOpen(!refFramesDropdownOpen)}
                    className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                  >
                    <span>Ref Frames: {wanAnimateRefertNum}</span>
                    <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${refFramesDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {refFramesDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-50">
                      <button
                        onClick={() => {
                          setWanAnimateRefertNum(1);
                          setRefFramesDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                          wanAnimateRefertNum === 1 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>Ref Frames: 1</span>
                        {wanAnimateRefertNum === 1 && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                      <button
                        onClick={() => {
                          setWanAnimateRefertNum(5);
                          setRefFramesDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                          wanAnimateRefertNum === 5 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <span>Ref Frames: 5</span>
                        {wanAnimateRefertNum === 5 && <div className="w-2 h-2 bg-black rounded-full"></div>}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Runway Act-Two Parameters - Only show for Runway model */}
            {selectedModel === 'runway-act-two' && (
              <>
                {/* Ratio Dropdown */}
                <div className="relative" ref={runwayRatioDropdownRef}>
                  <button
                    onClick={() => setRunwayRatioDropdownOpen(!runwayRatioDropdownOpen)}
                    className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                  >
                    <span>{runwayActTwoRatio}</span>
                    <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${runwayRatioDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {runwayRatioDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 md:w-48 w-32 bg-black/80 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-0 pt-0 z-50">
                      {([
                        { value: '1280:720', label: '720P', description: 'HD Quality (1280x720)' },
                        { value: '720:1280', label: '1080P', description: 'HD Quality (720x1280)' },
                        { value: '960:960', label: '640P', description: 'Square Quality (960x960)' },
                        { value: '1104:832', label: '720P', description: 'HD Quality (1104x832)' },
                        { value: '832:1104', label: '720P', description: 'HD Quality (832x1104)' },
                        { value: '1584:672', label: '1080P', description: 'Full HD Quality (1584x672)' },
                      ] as const).map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() => {
                            setRunwayActTwoRatio(ratio.value as any);
                            setRunwayRatioDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left transition-all duration-200  flex items-center justify-between ${
                            runwayActTwoRatio === ratio.value
                              ? 'bg-white'
                              : 'hover:bg-white/10'
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span className={`font-medium text-sm ${runwayActTwoRatio === ratio.value ? 'text-black' : 'text-white/90'}`}>{ratio.label}</span>
                            <span className={`text-xs ${runwayActTwoRatio === ratio.value ? 'text-black/80' : 'text-white/60'}`}>{ratio.description}</span>
                          </div>
                          {runwayActTwoRatio === ratio.value && (
                            <div className="w-2 h-2 bg-black rounded-full"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Character Type Dropdown */}
                <div className="relative" ref={runwayCharacterTypeDropdownRef}>
                  <button
                    onClick={() => setRunwayCharacterTypeDropdownOpen(!runwayCharacterTypeDropdownOpen)}
                    className="md:h-[32px] h-[28px] px-4 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent backdrop-blur-3xl text-white cursor-pointer"
                  >
                    <span>Character: {runwayActTwoCharacterType === 'image' ? 'Image' : 'Video'}</span>
                    <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${runwayCharacterTypeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {runwayCharacterTypeDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30  z-50">
                      {(['image', 'video'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            // Clear uploaded character when switching types
                            if (runwayActTwoCharacterType !== type) {
                              setUploadedCharacterImage("");
                            }
                            setRunwayActTwoCharacterType(type);
                            setRunwayCharacterTypeDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                            runwayActTwoCharacterType === type ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                          }`}
                        >
                          <span>{type === 'image' ? 'Image' : 'Video'}</span>
                          {runwayActTwoCharacterType === type && <div className="w-2 h-2 bg-black rounded-full"></div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Third Row: FPS, Go Fast, Merge Audio, Expression Intensity, Body Control */}
          <div className="flex flex-col gap-2 md:hidden">
            {/* WAN 2.2 Animate Checkboxes and FPS - Only show for WAN models */}
            {selectedModel !== 'runway-act-two' && (
              <>
                {/* FPS Input with Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="md:text-sm text-[11px] text-white/80">Frames per second:</label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={wanAnimateFps}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 5 && val <= 60) {
                          setWanAnimateFps(val);
                        }
                      }}
                      className="md:h-[28px] h-[20px] rounded-lg md:text-[13px] text-[11px] font-medium border border-white/10 bg-transparent text-white/80 md:w-16 w-12 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={wanAnimateFps}
                    onChange={(e) => setWanAnimateFps(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${((wanAnimateFps - 5) / (60 - 5)) * 100}%, rgba(255,255,255,0.1) ${((wanAnimateFps - 5) / (60 - 5)) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>
                {/* Go Fast and Merge Audio Checkboxes */}
                <div className="flex flex-row md:gap-4 gap-2">
                  <label className="flex items-center gap-1 cursor-pointer group hover:opacity-90 transition-opacity">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={wanAnimateGoFast}
                        onChange={(e) => setWanAnimateGoFast(e.target.checked)}
                        className="md:w-5 md:h-5 w-4 h-4 rounded border-2 border-white/30 bg-white/10 text-white cursor-pointer appearance-none checked:bg-white checked:border-white transition-all duration-200"
                      />
                      {wanAnimateGoFast && (
                        <svg
                          className="absolute w-3 h-3 text-black pointer-events-none"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="md:text-sm text-[11px] font-medium text-white/90 group-hover:text-white transition-colors">Go fast </span>
                    </div>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer group hover:opacity-90 transition-opacity">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={wanAnimateMergeAudio}
                        onChange={(e) => setWanAnimateMergeAudio(e.target.checked)}
                        className="md:w-5 md:h-5 w-4 h-4 rounded border-2 border-white/30 bg-white/10 text-white cursor-pointer appearance-none checked:bg-white checked:border-white transition-all duration-200"
                      />
                      {wanAnimateMergeAudio && (
                        <svg
                          className="absolute w-3 h-3 text-black pointer-events-none"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="md:text-sm text-[11px] font-medium text-white/90 group-hover:text-white transition-colors">Merge audio </span>
                    </div>
                  </label>
                </div>
              </>
            )}
            
            {/* Runway Act-Two Checkboxes and Slider - Only show for Runway model */}
            {selectedModel === 'runway-act-two' && (
              <>
                {/* Expression Intensity Slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="md:text-sm text-[11px] text-white/80">Expression Intensity:</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={runwayActTwoExpressionIntensity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= 5) {
                          setRunwayActTwoExpressionIntensity(val);
                        }
                      }}
                      className="md:h-[28px] h-[24px] rounded-lg md:text-[13px] text-[11px] font-medium border border-white/10 bg-transparent text-white/80 w-14 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={runwayActTwoExpressionIntensity}
                    onChange={(e) => setRunwayActTwoExpressionIntensity(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${((runwayActTwoExpressionIntensity - 1) / (5 - 1)) * 100}%, rgba(255,255,255,0.1) ${((runwayActTwoExpressionIntensity - 1) / (5 - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
                    }}
                  />
                </div>

                {/* Body Control Checkbox */}
                <label className="flex items-center gap-1 cursor-pointer group hover:opacity-90 transition-opacity">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={runwayActTwoBodyControl}
                      onChange={(e) => setRunwayActTwoBodyControl(e.target.checked)}
                      className="md:w-5 md:h-5 w-4 h-4 rounded border-2 border-white/30 bg-white/10 text-white cursor-pointer appearance-none checked:bg-white checked:border-white transition-all duration-200"
                    />
                    {runwayActTwoBodyControl && (
                      <svg
                        className="absolute w-3 h-3 text-black pointer-events-none"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="md:text-sm text-[11px] font-medium text-white/90 group-hover:text-white transition-colors">Body control  <span className="md:text-xs text-[9px] text-white/50">(Enable body movements)</span> </span>
                  </div>
                </label>
              </>
            )}
          </div>

          {/* Desktop: Right side with generate button */}
          <div className="hidden md:flex md:flex-col md:items-end md:gap-2 md:mt-2">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="text-white/80 text-sm pr-1">
              Total credits:{' '}
              <span className="font-semibold">
                {(selectedModel === 'wan-2.2-animate-replace' || selectedModel === 'wan-2.2-animate-animation')
                  ? 'Credits will be calculated based on processing time'
                  : liveCreditCost}
              </span>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !uploadedVideo || !uploadedCharacterImage}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-lg text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
            >
              {isGenerating ? "Generating..." : "Generate Video"}
            </button>
          </div>
        </div>
      </div>

      {preview && (
        <VideoPreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
        />
      )}

      {/* UploadModal for character image uploads - only show when character type is image for Runway model */}
      {uploadModalType === 'image' && 
       !(selectedModel === 'runway-act-two' && runwayActTwoCharacterType === 'video') && 
       (() => {
        // When modal is open, always use libraryImageEntries (even if empty initially)
        // This ensures we show the fetched data once it loads
        // Only fall back to imageHistoryEntries if modal is closed (shouldn't happen, but safety check)
        const modalHistoryEntries = isUploadModalOpen 
          ? [...libraryImageEntries] 
          : (libraryImageEntries.length > 0 ? [...libraryImageEntries] : [...imageHistoryEntries]);
        
        
        return (
          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => {
              setIsUploadModalOpen(false);
            }}
            onAdd={handleCharacterImageUploadFromModal}
            remainingSlots={1}
          />
        );
      })()}

      {/* VideoUploadModal for video uploads */}
      {uploadModalType === 'video' && (() => {
        // Use libraryVideoEntries if available, otherwise fall back to allVideoHistoryEntries
        // Create a new array reference to ensure React detects changes
        const modalHistoryEntries = libraryVideoEntries.length > 0 
          ? [...libraryVideoEntries] 
          : [...allVideoHistoryEntries];
        
        // Log what's being passed to the modal (only when modal is open to avoid spam)
        if (isUploadModalOpen && libraryVideoEntries.length > 0) {
          console.log('[AnimateInputBox] VideoUploadModal historyEntries prop:', {
            source: 'libraryVideoEntries',
            count: modalHistoryEntries.length,
            libraryVideoEntriesCount: libraryVideoEntries.length,
            allVideoHistoryEntriesCount: allVideoHistoryEntries.length,
            entriesWithVideos: modalHistoryEntries.filter((e: any) => {
              const hasVideos = e.videos && Array.isArray(e.videos) && e.videos.length > 0;
              const hasVideoImages = e.images && Array.isArray(e.images) && e.images.some((img: any) => {
                const url = img.url || img.firebaseUrl || img.originalUrl;
                return url && (url.startsWith('data:video') || /(\.mp4|\.webm|\.ogg)(\?|$)/i.test(url));
              });
              return hasVideos || hasVideoImages;
            }).length,
            sample: modalHistoryEntries.slice(0, 3).map((e: any) => ({
              id: e.id,
              videosCount: e.videos?.length || 0,
              hasVideos: Array.isArray(e.videos) && e.videos.length > 0,
              firstVideoUrl: e.videos?.[0]?.url?.substring(0, 50) + '...'
            }))
          });
        }
        
        return (
          <VideoUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => {
              setIsUploadModalOpen(false);
              setIsVideoModalForCharacter(false);
            }}
            onAdd={
              // Use character video handler if this modal was opened for character video upload
              isVideoModalForCharacter && selectedModel === 'runway-act-two' && runwayActTwoCharacterType === 'video'
                ? handleCharacterVideoUploadFromModal
                : handleVideoUploadFromModal
            }
            remainingSlots={1}
          />
        );
      })()}
    </React.Fragment>
  );
};

export default AnimateInputBox;

