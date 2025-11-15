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

  const imageHistoryEntries = useAppSelector((state: any) => {
    const entries = state.history?.entries || [];
    return entries.filter((entry: HistoryEntry) => 
      entry.generationType === 'text-to-image'
    );
  }, shallowEqual);

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
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

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
        originalPrompt: prompt.trim() || '',
      };

      console.log(`Submitting WAN 2.2 Animate ${isAnimationModel ? 'Animation' : 'Replace'} request:`, requestBody);

      const { data } = await api.post(apiEndpoint, requestBody);
      const result = data?.data || data;

      if (result?.requestId) {
        toast.success("Generation started! Polling for results...");
        
        // Create local preview entry (history-style) to show generating tile in today's row
        setLocalVideoPreview({
          id: `animate-loading-${Date.now()}`,
          prompt: prompt.trim(),
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
                        prompt: historyData.prompt || prompt.trim(),
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
                        prompt: prompt.trim(),
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
                      prompt: prompt.trim(),
                      model: "wan-video/wan-2.2-animate-replace",
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
                    prompt: prompt.trim(),
                    model: "wan-video/wan-2.2-animate-replace",
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
                
                setPrompt("");
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
                            // Completed video thumbnail with shimmer loading
                            <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center relative group">
                              {(video.firebaseUrl || video.url) ? (
                                <div className="relative w-full h-full">
                                  {(() => {
                                    const raw = (video.firebaseUrl || video.url) as string;
                                    const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX as string) || 'https://idr01.zata.ai/devstoragev1/';
                                    const path = raw?.startsWith(ZATA_PREFIX) ? raw.substring(ZATA_PREFIX.length) : raw;
                                    const proxied = `/api/proxy/media/${encodeURIComponent(path)}`;
                                    return (
                                      <video
                                        src={proxied}
                                        className="w-full h-full object-cover transition-opacity duration-200"
                                        crossOrigin="anonymous"
                                        muted
                                        playsInline
                                        loop
                                        preload="metadata"
                                        poster={toThumbUrl(raw, { w: 640, q: 60 }) || undefined}
                                        onLoadedData={(e) => {
                                          // Create a thumbnail poster if none available (non-Zata sources)
                                          const videoElement = e.target as HTMLVideoElement;
                                          try {
                                            const needsPoster = !videoElement.poster || videoElement.poster.trim() === '';
                                            if (needsPoster) {
                                              const capture = () => {
                                                if (!videoElement.videoWidth || !videoElement.videoHeight) return;
                                                const canvas = document.createElement('canvas');
                                                canvas.width = videoElement.videoWidth;
                                                canvas.height = videoElement.videoHeight;
                                                const ctx = canvas.getContext('2d');
                                                if (ctx) {
                                                  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                                                  try {
                                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                                    if (dataUrl) videoElement.poster = dataUrl;
                                                  } catch { }
                                                }
                                              };
                                              if (videoElement.readyState >= 2) {
                                                // Seek a tiny offset to ensure frame is decodable on some browsers
                                                const target = Math.min(0.1, Math.max(0.01, (videoElement.duration || 0.2) / 20));
                                                const onSeeked = () => { videoElement.removeEventListener('seeked', onSeeked); capture(); };
                                                videoElement.addEventListener('seeked', onSeeked, { once: true });
                                                try { videoElement.currentTime = target; } catch { capture(); }
                                              } else {
                                                const onLoaded = () => { videoElement.removeEventListener('loadedmetadata', onLoaded); capture(); };
                                                videoElement.addEventListener('loadedmetadata', onLoaded, { once: true });
                                              }
                                            }
                                          } catch { }

                                          // Remove shimmer when video loads
                                          setTimeout(() => {
                                            const shimmer = document.querySelector(`[data-video-id="${entry.id}-${video.id}"] .shimmer`) as HTMLElement;
                                            if (shimmer) {
                                              shimmer.style.opacity = '0';
                                            }
                                          }, 100);
                                        }}
                                      />
                                    );
                                  })()}
                                  {/* Shimmer loading effect */}
                                  <div className="shimmer absolute inset-0 opacity-100 transition-opacity duration-300" />
                                </div>
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
        {/* Top row: textarea and upload buttons */}
        <div className="flex items-start gap-3 mb-3">
          <textarea
            ref={inputEl}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-h-[120px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleGenerate();
              }
            }}
          />

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
                  setUploadModalType('image');
                  setIsUploadModalOpen(true);
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
              disabled={isGenerating || !prompt.trim() || !uploadedVideo || !uploadedCharacterImage}
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
      {uploadModalType === 'image' && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAdd={handleCharacterImageUploadFromModal}
          historyEntries={imageHistoryEntries}
          remainingSlots={1}
          onLoadMore={async () => {}}
          hasMore={false}
          loading={false}
        />
      )}

      {/* VideoUploadModal for video uploads */}
      {uploadModalType === 'video' && (
        <VideoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAdd={handleVideoUploadFromModal}
          historyEntries={allVideoHistoryEntries}
          remainingSlots={1}
          onLoadMore={async () => {}}
          hasMore={false}
          loading={false}
        />
      )}
    </React.Fragment>
  );
};

export default AnimateInputBox;

