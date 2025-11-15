"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { HistoryEntry } from "@/types/history";
import { FilePlay, FilePlus2 } from 'lucide-react';
import { getApiClient } from "@/lib/axiosInstance";
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
    const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || 'https://idr01.zata.ai/devstoragev1/';
    if (urlOrPath.startsWith(ZATA_PREFIX)) return urlOrPath.substring(ZATA_PREFIX.length);
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
  const [selectedModel, setSelectedModel] = useState("wan-2.2-animate-replace");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string>("");
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

  // Upload modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<'image' | 'video'>('video');

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
    const isAnimateEntry = (entry: any): boolean => {
      const model = String(entry?.model || '').toLowerCase();
      
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

    // Sort by timestamp (newest first)
    const sortedEntries = filteredEntries.sort((a: any, b: any) => {
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
      if (!initial && libraryImageNextCursorRef.current) {
        params.cursor = libraryImageNextCursorRef.current;
      }
      params.sortBy = 'createdAt';
      
      // PAGINATION DEBUG: Log request details
      const cursorStr = params.cursor ? (typeof params.cursor === 'string' ? `${params.cursor.substring(0, 30)}...` : String(params.cursor)) : 'none';
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
      const requestedCursorStr = params.cursor ? (typeof params.cursor === 'string' ? `${params.cursor.substring(0, 30)}...` : String(params.cursor)) : 'none';
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
      
      // Update cursor and hasMore after state update
      const previousCursor = libraryImageNextCursorRef.current;
      // Convert cursor to string if it's a number (API might return number cursor)
      libraryImageNextCursorRef.current = nextCursor ? String(nextCursor) : undefined;
      const hasMoreItems = Boolean(nextCursor);
      
      // PAGINATION DEBUG: Log cursor update
      const prevCursorStr = previousCursor ? (typeof previousCursor === 'string' ? `${previousCursor.substring(0, 30)}...` : String(previousCursor)) : 'none';
      const newCursorStr = nextCursor ? (typeof nextCursor === 'string' ? `${nextCursor.substring(0, 30)}...` : String(nextCursor)) : 'null';
      console.log('[PAGINATION] Cursor Update:', {
        previousCursor: prevCursorStr,
        previousCursorType: typeof previousCursor,
        newCursor: newCursorStr,
        newCursorType: typeof nextCursor,
        cursorChanged: previousCursor !== nextCursor,
        hasMore: hasMoreItems
      });
      
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
        params.cursor = libraryVideoNextCursorRef.current;
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
  const estimatedDuration = 5; // Default estimate
  const liveCreditCost = useMemo(() => {
    // Use the selected model for credit calculation
    return getVideoCreditCost(selectedModel, undefined, estimatedDuration);
  }, [selectedModel, estimatedDuration]);

  // Handle model change
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  // Handle video upload from modal
  const handleVideoUploadFromModal = useCallback((urls: string[]) => {
    setUploadedVideo(urls[0] || "");
    setIsUploadModalOpen(false);
    toast.success("Video uploaded successfully");
  }, []);

  // Handle character image upload from modal
  const handleCharacterImageUploadFromModal = useCallback((urls: string[]) => {
    setUploadedCharacterImage(urls[0] || "");
    setIsUploadModalOpen(false);
    toast.success("Character image uploaded successfully");
  }, []);

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

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!uploadedVideo) {
      toast.error("Video upload is mandatory");
      return;
    }

    if (!uploadedCharacterImage) {
      toast.error("Character image upload is mandatory");
      return;
    }

    if (credits < liveCreditCost) {
      toast.error(`Insufficient credits. Required: ${liveCreditCost}, Available: ${credits}`);
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const api = getApiClient();
      
      // Determine API endpoint and model name based on selected model
      const isAnimationModel = selectedModel === 'wan-2.2-animate-animation';
      const apiEndpoint = isAnimationModel 
        ? '/api/replicate/wan-2-2-animate-animation/submit'
        : '/api/replicate/wan-2-2-animate-replace/submit';
      const modelName = isAnimationModel
        ? 'wan-video/wan-2.2-animate-animation'
        : 'wan-video/wan-2.2-animate-replace';

      // Build request body exactly as in InputBox
      const requestBody = {
        model: modelName,
        video: uploadedVideo,
        character_image: uploadedCharacterImage,
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

        const pollForResult = async () => {
          try {
            const statusRes = await api.get('/api/replicate/queue/status', {
              params: { requestId: result.requestId }
            });
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || '').toLowerCase();

            if (statusValue === 'completed' || statusValue === 'success' || statusValue === 'succeeded') {
              const resultRes = await api.get('/api/replicate/queue/result', {
                params: { requestId: result.requestId }
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
                    const historyRes = await api.get(`/api/generations/${result.historyId}`);
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
  ]);

  return (
    <React.Fragment>
      {/* History Section - Videos displayed above input box */}
      {showHistory && (
        <div className="mb-6 inset-0 pl-[0] pr-6 overflow-y-auto no-scrollbar z-0 pb-96">
          <div className="space-y-8">
            {/* If there's a local preview and no row for today, render a dated block for today */}
            {localVideoPreview && !groupedByDate[todayKey] && (
              <div className="space-y-4">
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
                <div className="flex flex-wrap gap-3 ml-0">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                    {localVideoPreview.status === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/90">
                        <div className="flex flex-col items-center gap-2">
                          <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
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
                    <h3 className="text-sm font-medium text-white/70">{date}</h3>
                  </div>

                  {/* Videos for this Date */}
                  <div className="flex flex-wrap gap-3 ml-0">
                    {/* Prepend local video preview to today's row to push existing items right */}
                    {date === todayKey && localVideoPreview && (
                      <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                        {localVideoPreview.status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/90">
                            <div className="flex flex-col items-center gap-2">
                              <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
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
                            className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10"
                          >
                            {entry.status === "generating" ? (
                              <div className="w-full h-full flex items-center justify-center bg-black/90">
                                <div className="flex flex-col items-center gap-2">
                                  <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
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
                          className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                        >
                          {effectiveStatus === "generating" ? (
                            // Loading frame
                            <div className="w-full h-full flex items-center justify-center bg-black/90">
                              <div className="flex flex-col items-center gap-2">
                                <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[0] rounded-2xl bg-gradient-to-b from-white/5 to-white/5 border border-white/10 backdrop-blur-xl p-4">
        {/* Top row: upload buttons */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col gap-2">
            {/* Video Upload Button */}
            <div className="relative">
              <button
                className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                onClick={() => {
                  setUploadModalType('video');
                  setIsUploadModalOpen(true);
                }}
              >
                <div className="relative">
                  <FilePlay
                    size={30}
                    className="rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-purple-300 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                    Upload video (mandatory)
                  </div>
                </div>
              </button>
            </div>

            {/* Character Image Upload Button */}
            <div className="relative">
              <button
                className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                onClick={() => {
                  console.log('[AnimateInputBox] 🖼️ Upload character image button clicked');
                  setUploadModalType('image');
                  setIsUploadModalOpen(true);
                  console.log('[AnimateInputBox] 🖼️ Modal state updated:', { type: 'image', open: true });
                }}
              >
                <div className="relative">
                  <FilePlus2
                    size={30}
                    className="rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110"
                  />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                    Upload character
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Uploaded Content Display */}
        <div className="px-3 pb-3">
          {/* Uploaded Video */}
          {uploadedVideo && (
            <div className="mb-3">
              <div className="text-xs text-white/60 mb-2">Uploaded Video</div>
              <div className="relative group">
                <div
                  className="w-32 h-20 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                  onClick={() => {
                    const previewEntry: HistoryEntry = {
                      id: "preview-video",
                      prompt: "Uploaded Video",
                      model: "preview",
                      frameSize: "16:9",
                      images: [{ id: "video-1", url: uploadedVideo, originalUrl: uploadedVideo, firebaseUrl: uploadedVideo }],
                      status: "completed",
                      timestamp: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                      imageCount: 1,
                      generationType: "text-to-video",
                    };
                    setPreview({ entry: previewEntry, video: uploadedVideo });
                  }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <button
                    aria-label="Remove video"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 text-xl font-extrabold drop-shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedVideo("");
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Character Image */}
          {uploadedCharacterImage && (
            <div className="mb-3">
              <div className="text-xs text-white/60 mb-2">Character Image</div>
              <div className="relative group">
                <div
                  className="w-32 h-32 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                  onClick={() => {
                    const previewEntry: HistoryEntry = {
                      id: "preview-character",
                      prompt: "Character Image",
                      model: "preview",
                      frameSize: "1:1",
                      images: [{ id: "char-1", url: uploadedCharacterImage, originalUrl: uploadedCharacterImage, firebaseUrl: uploadedCharacterImage }],
                      status: "completed",
                      timestamp: new Date().toISOString(),
                      createdAt: new Date().toISOString(),
                      imageCount: 1,
                      generationType: "text-to-image",
                    };
                    setPreview({ entry: previewEntry, video: uploadedCharacterImage });
                  }}
                >
                  <img
                    src={uploadedCharacterImage}
                    alt="Character"
                    className="w-full h-full object-cover"
                  />
                  <button
                    aria-label="Remove character image"
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 text-xl font-extrabold drop-shadow bg-black/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedCharacterImage("");
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom row: model selector, parameters, and generate button */}
        <div className="flex justify-between items-center gap-2 px-3 pb-3">
          <div className="flex flex-col gap-3 flex-wrap">
            {/* Model selector - Only WAN Animate Replace */}
            <VideoModelsDropdown
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              generationMode="video_to_video"
              selectedDuration="5s"
              activeFeature="Animate"
              onCloseOtherDropdowns={() => {}}
            />

            {/* WAN 2.2 Animate Replace Parameters */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-row gap-2 flex-wrap">
                {/* Resolution Dropdown - 480 or 720 ONLY */}
                <div className="relative">
                  <select
                    value={wanAnimateResolution}
                    onChange={(e) => setWanAnimateResolution(e.target.value as "720" | "480")}
                    className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors appearance-none cursor-pointer pr-8"
                  >
                    <option value="720">720p</option>
                    <option value="480">480p</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/60">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
                {/* Refert Num - 1 or 5 */}
                <div className="relative">
                  <select
                    value={wanAnimateRefertNum}
                    onChange={(e) => setWanAnimateRefertNum(Number(e.target.value) as 1 | 5)}
                    className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors appearance-none cursor-pointer pr-8"
                  >
                    <option value="1">Ref Frames: 1</option>
                    <option value="5">Ref Frames: 5</option>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/60">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
                {/* Seed Input (Optional) */}
                <div className="relative">
                  <input
                    type="number"
                    value={wanAnimateSeed || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      if (val === undefined || (!isNaN(val) && Number.isInteger(val))) {
                        setWanAnimateSeed(val);
                      }
                    }}
                    placeholder="Seed (optional)"
                    className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 placeholder-white/40 w-32"
                  />
                </div>
              </div>
              <div className="flex flex-row gap-4 items-center">
                {/* Go Fast Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={wanAnimateGoFast}
                    onChange={(e) => setWanAnimateGoFast(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-2 focus:ring-white/50 cursor-pointer"
                  />
                  <span className="text-sm text-white/80">Go fast</span>
                  <span className="text-xs text-white/50">(Default: true)</span>
                </label>
                {/* Merge Audio Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={wanAnimateMergeAudio}
                    onChange={(e) => setWanAnimateMergeAudio(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-2 focus:ring-white/50 cursor-pointer"
                  />
                  <span className="text-sm text-white/80">Merge audio</span>
                  <span className="text-xs text-white/50">(Default: true)</span>
                </label>
              </div>
              {/* FPS Input with Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-white/80">Frames per second:</label>
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
                    className="h-[32px] px-3 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 w-20 text-center"
                  />
                  <span className="text-xs text-white/50">(min: 5, max: 60)</span>
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
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 mt-2">
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="text-white/80 text-sm pr-1">
              Total credits: <span className="font-semibold">{liveCreditCost}</span>
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

      {/* UploadModal for character image uploads */}
      {uploadModalType === 'image' && (() => {
        // When modal is open, always use libraryImageEntries (even if empty initially)
        // This ensures we show the fetched data once it loads
        // Only fall back to imageHistoryEntries if modal is closed (shouldn't happen, but safety check)
        const modalHistoryEntries = isUploadModalOpen 
          ? [...libraryImageEntries] 
          : (libraryImageEntries.length > 0 ? [...libraryImageEntries] : [...imageHistoryEntries]);
        
        
        return (
          <UploadModal
            key={`upload-modal-${libraryImageEntries.length}-${isUploadModalOpen}`}
            isOpen={isUploadModalOpen}
            onClose={() => {
              setIsUploadModalOpen(false);
            }}
            onAdd={handleCharacterImageUploadFromModal}
            historyEntries={modalHistoryEntries}
            remainingSlots={1}
            onLoadMore={async () => {
              // Always use fetchLibraryImages for pagination - it uses local state and doesn't affect Redux
              // This ensures video history remains intact
              // Only check loading state - fetchLibraryImages will handle hasMore check internally
              if (!libraryImageLoading && isUploadModalOpen && uploadModalType === 'image') {
                try {
                  await fetchLibraryImages(false);
                } catch (error) {
                  console.error('[AnimateInputBox] Error in onLoadMore:', error);
                }
              } else {
                console.log('[AnimateInputBox] onLoadMore blocked:', { libraryImageLoading, isUploadModalOpen, uploadModalType });
              }
            }}
            hasMore={isUploadModalOpen && uploadModalType === 'image' ? libraryImageHasMore : false}
            loading={isUploadModalOpen && uploadModalType === 'image' ? libraryImageLoading : false}
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
            key={`video-upload-modal-${libraryVideoEntries.length}`}
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onAdd={handleVideoUploadFromModal}
            historyEntries={modalHistoryEntries}
            remainingSlots={1}
            onLoadMore={async () => {
              // Always use fetchLibraryVideos for pagination - it uses local state and doesn't affect Redux
              // This ensures video history remains intact
              console.log('[AnimateInputBox] onLoadMore called for videos:', { 
                libraryVideoLoading, 
                libraryVideoHasMore, 
                isUploadModalOpen, 
                uploadModalType,
                entriesCount: libraryVideoEntries.length,
                nextCursor: libraryVideoNextCursorRef.current ? 'present' : 'null'
              });
              // Only check loading state - fetchLibraryVideos will handle hasMore check internally
              if (!libraryVideoLoading && isUploadModalOpen && uploadModalType === 'video') {
                console.log('[AnimateInputBox] Fetching more library videos...');
                await fetchLibraryVideos(false);
              } else {
                console.log('[AnimateInputBox] onLoadMore blocked for videos:', { libraryVideoLoading, isUploadModalOpen, uploadModalType });
              }
            }}
            hasMore={isUploadModalOpen && uploadModalType === 'video' ? libraryVideoHasMore : false}
            loading={isUploadModalOpen && uploadModalType === 'video' ? libraryVideoLoading : false}
          />
        );
      })()}
    </React.Fragment>
  );
};

export default AnimateInputBox;

