"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
import { addHistoryEntry, loadMoreHistory, loadHistory, updateHistoryEntry, clearFilters } from "@/store/slices/historySlice";
import { addNotification } from "@/store/slices/uiSlice";
// historyService removed; backend owns history persistence
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
const getHistoryEntries = async (_filters?: any, _pag?: any) => ({ data: [] } as any);
import { waitForRunwayVideoCompletion } from "@/lib/runwayVideoService";
import { buildImageToVideoBody, buildVideoToVideoBody } from "@/lib/videoGenerationBuilders";
import { uploadGeneratedVideo } from "@/lib/videoUpload";
import { VideoGenerationState, GenMode } from "@/types/videoGeneration";
import { FilePlay, FileSliders, Crop, Clock, TvMinimalPlay } from 'lucide-react';
import { MINIMAX_MODELS, MiniMaxModelType } from "@/lib/minimaxTypes";
import { getApiClient } from "@/lib/axiosInstance";
import { useGenerationCredits } from "@/hooks/useCredits";

// Extend window interface for temporary video data storage
declare global {
  interface Window {
    miniMaxVideoData?: any;
  }
}

// Import the video-specific components
import VideoModelsDropdown from "./VideoModelsDropdown";
import VideoFrameSizeDropdown from "./VideoFrameSizeDropdown";
import VideoDurationDropdown from "./VideoDurationDropdown";
import VideoPreviewModal from "./VideoPreviewModal";


const InputBox = () => {
  const dispatch = useAppDispatch();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    video: any;
  } | null>(null);
  const inputEl = useRef<HTMLTextAreaElement>(null);

  // Video generation state
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gen4_turbo");
  const [frameSize, setFrameSize] = useState("16:9");
  const [duration, setDuration] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<string>("");
  const [references, setReferences] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<"text_to_video" | "image_to_video" | "video_to_video">("text_to_video");
  const [error, setError] = useState("");

  // MiniMax specific state
  const [selectedResolution, setSelectedResolution] = useState("1080P");
  const [selectedMiniMaxDuration, setSelectedMiniMaxDuration] = useState(6);
  const [resolutionDropdownOpen, setResolutionDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [cameraMovementPopupOpen, setCameraMovementPopupOpen] = useState(false);
  const [selectedCameraMovements, setSelectedCameraMovements] = useState<string[]>([]);
  const [lastFrameImage, setLastFrameImage] = useState<string>(""); // For MiniMax-Hailuo-02 last frame

  // Credits management - after all state declarations
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits('video', selectedModel, {
    resolution: selectedModel.includes("MiniMax") ? selectedResolution : undefined,
    duration: selectedModel.includes("MiniMax") ? selectedMiniMaxDuration : duration,
  });

  // Auto-select model based onf generation mode (but preserve user's choice when possible)
  useEffect(() => {
    if (generationMode === "text_to_video") {
      // Text→Video: Only MiniMax models support this
      if (!(selectedModel === "MiniMax-Hailuo-02" || selectedModel === "T2V-01-Director")) {
        setSelectedModel("MiniMax-Hailuo-02"); // Default to MiniMax-Hailuo-02 for text→video
      }
    } else if (generationMode === "image_to_video") {
      // Image→Video: Both MiniMax and Runway models support this
      if (!(selectedModel === "gen4_turbo" || selectedModel === "gen3a_turbo" || selectedModel === "MiniMax-Hailuo-02" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01")) {
        setSelectedModel("gen4_turbo"); // Default to gen4_turbo for image→video (Runway model)
      }
    } else if (generationMode === "video_to_video") {
      // Video→Video: Only Runway models support this
      if (selectedModel !== "gen4_aleph") {
        setSelectedModel("gen4_aleph"); // Runway model for video→video
      }
    }
   
    // Clear camera movements when generation mode changes
    setSelectedCameraMovements([]);
  }, [generationMode, selectedModel]);

  // Auto-set fixed settings for models that don't support customization
  useEffect(() => {
    if (selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
      setSelectedResolution("720P");
      setSelectedMiniMaxDuration(6);
      // These models have fixed settings: 6s duration, 720P resolution
    } else if (selectedModel === "MiniMax-Hailuo-02") {
      // MiniMax-Hailuo-02: Set default resolution based on duration
      if (selectedMiniMaxDuration === 6) {
        setSelectedResolution("768P"); // Default for 6s
      } else if (selectedMiniMaxDuration === 10) {
        setSelectedResolution("768P"); // Default for 10s
      }
    }
  }, [selectedModel, selectedMiniMaxDuration]);

  // Auto-adjust resolution when duration changes for MiniMax-Hailuo-02
  useEffect(() => {
    if (selectedModel === "MiniMax-Hailuo-02") {
      if (selectedMiniMaxDuration === 10 && selectedResolution === "1080P") {
        // 10s doesn't support 1080P, switch to 768P
        setSelectedResolution("768P");
      }
    }
  }, [selectedMiniMaxDuration, selectedModel, selectedResolution]);

  // Reset controls when switching between MiniMax and Runway models
  useEffect(() => {
    if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
      // Reset Runway-specific controls when switching to MiniMax
      // Note: MiniMax models don't support custom aspect ratios - they use fixed resolutions
      setFrameSize("16:9"); // Default aspect ratio (not used for MiniMax)
      setDuration(5); // Default duration (not used for MiniMax)
     
      // Set appropriate MiniMax defaults based on model
      if (selectedModel === "MiniMax-Hailuo-02") {
        setSelectedResolution("1080P");
        setSelectedMiniMaxDuration(6);
      } else {
        // T2V-01, I2V-01, S2V-01 have fixed settings
        setSelectedResolution("720P");
        setSelectedMiniMaxDuration(6);
      }
    } else {
      // Reset MiniMax-specific controls when switching to Runway
      setSelectedResolution("1080P"); // Default resolution
      setSelectedMiniMaxDuration(6); // Default duration
    }
  }, [selectedModel]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
     
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setResolutionDropdownOpen(false);
        setDurationDropdownOpen(false);
      }
     
      // Close camera movement popup
      if (cameraMovementPopupOpen && !target.closest('.camera-movement-container')) {
        setCameraMovementPopupOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cameraMovementPopupOpen]);

  // Handle model change with validation
  const handleModelChange = (newModel: string) => {
    console.log('🔄 Model change requested:');
    console.log('🔄 - From:', selectedModel);
    console.log('🔄 - To:', newModel);
    console.log('🔄 - Generation mode:', generationMode);
   
    // Validate that the selected model is compatible with the current generation mode
    if (generationMode === "text_to_video") {
      // Text→Video: Only MiniMax models support this
      if (newModel === "MiniMax-Hailuo-02" || newModel === "T2V-01-Director") {
        setSelectedModel(newModel);
        // Reset aspect ratio for MiniMax models (they don't support custom aspect ratios)
        if (newModel.includes("MiniMax") || newModel === "T2V-01-Director") {
          setFrameSize("16:9"); // Default, but won't be used for MiniMax
        }
        // Set appropriate settings based on model
        if (newModel === "T2V-01-Director") {
          setSelectedResolution("720P");
          setSelectedMiniMaxDuration(6);
        } else if (newModel === "MiniMax-Hailuo-02") {
          // MiniMax-Hailuo-02: Set default resolution based on duration
          setSelectedMiniMaxDuration(6); // Default duration
          setSelectedResolution("768P"); // Default resolution for 6s
        }
        // Clear camera movements when switching models
        setSelectedCameraMovements([]);
      } else {
        // Runway models don't support text-to-video
        console.warn('Runway models cannot be used for text-to-video generation');
        return; // Don't change the model
      }
    } else if (generationMode === "image_to_video") {
      // Image→Video: gen4_turbo, gen3a_turbo, MiniMax-Hailuo-02, I2V-01-Director, S2V-01
      if (newModel === "gen4_turbo" || newModel === "gen3a_turbo" || newModel === "MiniMax-Hailuo-02" || newModel === "I2V-01-Director" || newModel === "S2V-01") {
        setSelectedModel(newModel);
        // Reset aspect ratio for MiniMax models (they don't support custom aspect ratios)
        if (newModel.includes("MiniMax") || newModel === "I2V-01-Director" || newModel === "S2V-01") {
          setFrameSize("16:9"); // Default, but won't be used for MiniMax
        }
        // Set appropriate settings based on model
        if (newModel === "I2V-01-Director" || newModel === "S2V-01") {
          setSelectedResolution("720P");
          setSelectedMiniMaxDuration(6);
        } else if (newModel === "MiniMax-Hailuo-02") {
          // MiniMax-Hailuo-02: Set default resolution based on duration
          setSelectedMiniMaxDuration(6); // Default duration
          setSelectedResolution("768P"); // Default resolution for 6s
        }
        // Clear camera movements when switching models
        setSelectedCameraMovements([]);
      }
    } else if (generationMode === "video_to_video") {
      // Video→Video: Only Runway models support this
      if (newModel === "gen4_aleph") {
        setSelectedModel(newModel);
        // Clear camera movements when switching to non-MiniMax model
        setSelectedCameraMovements([]);
      }
    }
  };

  const loading = useAppSelector((state: any) => state.history?.loading || false);
  const hasMore = useAppSelector((state: any) => state.history?.hasMore || false);
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sentinelElement, setSentinelElement] = useState<HTMLDivElement | null>(null);
  const historyScrollRef = useRef<HTMLDivElement | null>(null);
  const [historyScrollElement, setHistoryScrollElement] = useState<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasUserScrolledRef = useRef(false);
  const [extraVideoEntries, setExtraVideoEntries] = useState<any[]>([]);

  // Get history entries for video generation
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];
   
    // Helper function to normalize generationType (handle both underscore and hyphen patterns)
    const normalizeGenerationType = (generationType: string | undefined): string => {
      if (!generationType) return '';
      // Convert both underscore and hyphen to a standard format for comparison
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

    // Count entries by normalized generationType for debugging
    const countsAll = allEntries.reduce((acc: any, e: any) => {
      const normalized = normalizeGenerationType(e.generationType);
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Debug: Show raw generationType values to identify any inconsistencies
    const rawGenerationTypes = allEntries.reduce((acc: any, e: any) => {
      const rawType = e.generationType || 'undefined';
      acc[rawType] = (acc[rawType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    /* Debug removed for cleanliness
    console.log('[VideoPage] history totals:', {
      all: allEntries.length,
      textToVideo: countsAll['text-to-video'] || 0,
      imageToVideo: countsAll['image-to-video'] || 0,
      videoToVideo: countsAll['video-to-video'] || 0,
      filtered: mergedEntries.length,
      declaredVideoTypes: declaredVideoTypes.length,
      urlVideoTypes: urlVideoTypes.length,
      rawGenerationTypes,
      normalizedCounts: countsAll,
    });*/
   
    // Debug: Show which entries are being filtered and why
    if (mergedEntries.length < allEntries.length) {
      const filteredOut = allEntries.filter((entry: any) => !mergedEntries.some((merged: any) => merged.id === entry.id));
      /*console.log('[VideoPage] Filtered out entries:', filteredOut.map((entry: any) => ({
        id: entry.id,
        generationType: entry.generationType,
        normalizedType: normalizeGenerationType(entry.generationType),
        hasVideoUrls: Array.isArray(entry.images) && entry.images.some((m: any) => isVideoUrl(m?.firebaseUrl || m?.url)),
        prompt: entry.prompt?.substring(0, 50) + '...'
      })));*/
    }
   
    // Sort by timestamp (newest first) to ensure consistent ordering
    const sortedMergedEntries = mergedEntries.sort((a: any, b: any) => {
      const timestampA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timestampB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timestampB - timestampA; // Descending order (newest first)
    });
   
    // Debug: Show the order of entries after sorting
    if (sortedMergedEntries.length > 0) {
      /*console.log('[VideoPage] Entry order after sorting:', sortedMergedEntries.slice(0, 3).map((entry: any, index: number) => ({
        position: index + 1,
        id: entry.id,
        timestamp: entry.timestamp,
        generationType: entry.generationType,
        prompt: entry.prompt?.substring(0, 30) + '...'
      })));*/
    }
   
    return sortedMergedEntries;
  }, shallowEqual);

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
  // Today key for injecting local preview into today's row
  const todayKey = new Date().toDateString();

  // Local, ephemeral preview entry for video generations
  const [localVideoPreview, setLocalVideoPreview] = useState<HistoryEntry | null>(null);
  useEffect(() => {
    if (!localVideoPreview) return;
    if (localVideoPreview.status === 'completed' || localVideoPreview.status === 'failed') {
      const t = setTimeout(() => setLocalVideoPreview(null), 1500);
      return () => clearTimeout(t);
    }
  }, [localVideoPreview]);

  // Fetch missing video categories directly from Firestore (image_to_video, video_to_video)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Fetch entries with both underscore and hyphen patterns to ensure we get all video types
        const [textToVideo, imageToVideoHyphen, imageToVideoUnderscore, videoToVideoHyphen, videoToVideoUnderscore] = await Promise.all([
          getHistoryEntries({ generationType: 'text-to-video' as any }, { limit: 20 }),
          getHistoryEntries({ generationType: 'image-to-video' as any }, { limit: 20 }),
          getHistoryEntries({ generationType: 'image_to_video' as any }, { limit: 20 }),
          getHistoryEntries({ generationType: 'video-to-video' as any }, { limit: 20 }),
          getHistoryEntries({ generationType: 'video_to_video' as any }, { limit: 20 })
        ]);
       
        if (!isMounted) return;
       
        // Combine all results and remove duplicates by ID
        const allResults = [
          ...(textToVideo.data || []),
          ...(imageToVideoHyphen.data || []),
          ...(imageToVideoUnderscore.data || []),
          ...(videoToVideoHyphen.data || []),
          ...(videoToVideoUnderscore.data || [])
        ];
       
        const byId: Record<string, any> = {};
        allResults.forEach((entry: any) => {
          byId[entry.id] = entry;
        });
       
        const combined = Object.values(byId);
       
        // Sort by timestamp (newest first) to ensure proper ordering
        const sortedCombined = combined.sort((a: any, b: any) => {
          const timestampA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const timestampB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return timestampB - timestampA; // Descending order (newest first)
        });
       
        setExtraVideoEntries(sortedCombined);
        console.log('[VideoPage] fetched extra video entries:', {
          total: sortedCombined.length,
          textToVideo: textToVideo.data?.length || 0,
          imageToVideoHyphen: imageToVideoHyphen.data?.length || 0,
          imageToVideoUnderscore: imageToVideoUnderscore.data?.length || 0,
          videoToVideoHyphen: videoToVideoHyphen.data?.length || 0,
          videoToVideoUnderscore: videoToVideoUnderscore.data?.length || 0,
          unique: sortedCombined.length,
          firstTimestamp: sortedCombined[0]?.timestamp || 'none',
          lastTimestamp: sortedCombined[sortedCombined.length - 1]?.timestamp || 'none'
        });
      } catch (e) {
        console.error('[VideoPage] extra fetch failed:', e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Combine redux video entries with extra fetched ones
  const historyEntriesForDisplay = React.useMemo(() => {
    const byId: Record<string, any> = {};
    historyEntries.forEach((e: any) => { byId[e.id] = e; });
    extraVideoEntries.forEach((e: any) => { byId[e.id] = e; });
    const list = Object.values(byId);
   
    // Sort by timestamp (newest first) to match global history behavior
    const sortedList = list.sort((a: any, b: any) => {
      const timestampA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timestampB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timestampB - timestampA; // Descending order (newest first)
    });
   
    /*console.log('[VideoPage] display entries count:', sortedList.length);
    console.log('[VideoPage] first entry timestamp:', sortedList[0]?.timestamp || 'none');
    console.log('[VideoPage] last entry timestamp:', sortedList[sortedList.length - 1]?.timestamp || 'none');*/
   
    // Debug: Show the complete order of display entries
    if (sortedList.length > 0) {
      console.log('[VideoPage] Complete display order:', sortedList.map((entry: any, index: number) => ({
        position: index + 1,
        id: entry.id,
        timestamp: entry.timestamp,
        generationType: entry.generationType,
        source: historyEntries.some(h => h.id === entry.id) ? 'Redux' : 'Extra',
        prompt: entry.prompt?.substring(0, 30) + '...',
        status: entry.status,
        images: entry.images?.length || 0,
        videos: entry.videos?.length || 0,
        hasImages: !!entry.images,
        hasVideos: !!entry.videos
      })));
     
      // Debug: Check each entry's video/image structure
      sortedList.forEach((entry: any, index: number) => {
        console.log(`[VideoPage] Entry ${index + 1} detailed structure:`, {
          id: entry.id,
          generationType: entry.generationType,
          status: entry.status,
          images: entry.images,
          videos: entry.videos,
          videosType: typeof entry.videos,
          videosIsArray: Array.isArray(entry.videos),
          videosLength: entry.videos?.length,
          imageCount: entry.imageCount,
          fullEntry: entry
        });
      });
    }
   
    return sortedList as any[];
  }, [historyEntries, extraVideoEntries]);


  // Auto-load more history pages until we find non-text video types (bounded attempts)
  const autoLoadAttemptsRef = useRef(0);
  useEffect(() => {
    const normalizeGenerationType = (generationType: string | undefined): string => {
      if (!generationType) return '';
      return generationType.replace(/[_-]/g, '-').toLowerCase();
    };
   
    const counts = (historyEntries || []).reduce((acc: any, e: any) => {
      const normalized = normalizeGenerationType(e.generationType);
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
   
    const hasNonTextVideos = (counts['image-to-video'] || 0) + (counts['video-to-video'] || 0) > 0;
    if (!hasNonTextVideos && hasMore && !loading && autoLoadAttemptsRef.current < 10) {
      autoLoadAttemptsRef.current += 1;
      dispatch(loadMoreHistory({ filters: { mode: 'video' } as any, paginationParams: { limit: 10 } }));
    }
  }, [historyEntries, hasMore, loading, dispatch]);


  // Helper function to convert frameSize to Runway ratio format
  const convertFrameSizeToRunwayRatio = (frameSize: string): string => {
    const ratioMap: { [key: string]: string } = {
      "16:9": "1280:720",
      "9:16": "720:1280",
      "4:3": "1104:832",
      "3:4": "832:1104",
      "1:1": "960:960",
      "21:9": "1584:672",
      "16:10": "1280:768", // gen3a_turbo specific
      "10:16": "768:1280", // gen3a_turbo specific
    };

    return ratioMap[frameSize] || "1280:720"; // Default to 16:9 if no match
  };

  // Helper function to convert frameSize to MiniMax resolution
  const convertFrameSizeToMiniMaxResolution = (frameSize: string): string => {
    const resolutionMap: { [key: string]: string } = {
      "16:9": "1080P",
      "9:16": "1080P",
      "4:3": "1080P",
      "3:4": "1080P",
      "1:1": "1080P",
      "21:9": "1080P",
    };

    return resolutionMap[frameSize] || "1080P";
  };

  // Helper function to wait for MiniMax video completion (same pattern as Runway)
  const waitForMiniMaxVideoCompletion = async (taskId: string, opts?: { historyId?: string }) => {
    if (!taskId || taskId.trim() === '') {
      throw new Error('Invalid taskId provided to waitForMiniMaxVideoCompletion');
    }
   
    console.log('⏳ Starting MiniMax video completion polling for task:', taskId);
   
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;
   
    const api = getApiClient();
    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 MiniMax polling attempt ${attempts + 1}/${maxAttempts}`);
        const { data: statusEnvelope } = await api.get('/api/minimax/video/status', { params: { task_id: taskId } });
        console.log('📊 MiniMax status check result:', statusEnvelope);

        const statusData = statusEnvelope?.data || statusEnvelope;
        const status = statusData?.result?.status || statusData?.status;
        const fileId = statusData?.result?.file_id || statusData?.file_id;

        if (status === 'Success' && fileId) {
          console.log('✅ MiniMax video completed, retrieving file...');

          try {
            // Get the actual download URL (pass history_id if we have it later at callsite)
            const { data: fileEnvelope } = await api.get('/api/minimax/video/file', { params: { file_id: fileId, ...(opts?.historyId ? { history_id: opts.historyId } : {}) } });
            console.log('📁 MiniMax file result:', fileEnvelope);

            const fileData = fileEnvelope?.data || fileEnvelope;
            if (fileData?.file && (fileData.file.download_url || fileData.file.backup_download_url)) {
              return {
                status: 'Success',
                download_url: fileData.file.download_url || fileData.file.backup_download_url,
                videos: fileData.videos
              };
            }
            if (Array.isArray(fileData?.videos) && fileData.videos[0]?.url) {
              return { status: 'Success', download_url: fileData.videos[0].url, videos: fileData.videos };
            }
            throw new Error('No download URL found in file response');
          } catch (fileError) {
            console.warn('⚠️ File retrieval failed, but video generation was successful. Video should be available in database.');
            // Return success status even if file retrieval fails - the video is already in the database
            return {
              status: 'Success',
              download_url: null,
              videos: null,
              note: 'Video generated successfully and stored in database'
            };
          }
        } else if (status === 'Fail') {
          console.error('❌ MiniMax video generation failed:', statusData);
          return { status: 'Fail', error: statusData?.base_resp?.status_msg || 'Generation failed' };
        } else if (status === 'Queueing' || status === 'Preparing' || status === 'Processing' || status === 'Running') {
          console.log(`⏳ MiniMax still processing: ${status}`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
        } else if (status) {
          console.log(`⏳ MiniMax status: ${status}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        } else {
          console.warn('⚠️ Empty MiniMax status response, retrying...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
        }
      } catch (error) {
        console.error('❌ MiniMax status check error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
   
    console.error('⏰ MiniMax video completion timeout after', maxAttempts, 'attempts');
    throw new Error('MiniMax video generation timeout');
  };

  // Auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  };

  // PageRouter already loads initial history, so we just set up pagination state
  useEffect(() => {
    setPage(1);
  }, []);

  // Ensure only video history is loaded for this page
  useEffect(() => {
    dispatch(clearFilters());
    // Initial load: 50 entries of all video types (mode=video groups T2V/I2V/V2V)
    dispatch(loadHistory({ filters: { mode: 'video' } as any, paginationParams: { limit: 50 } }));
  }, [dispatch]);

  // Mark user scroll inside the scrollable history container
  useEffect(() => {
    const container = historyScrollElement;
    if (!container) return;
    const onScroll = () => { hasUserScrolledRef.current = true; };
    container.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => { container.removeEventListener('scroll', onScroll as any); };
  }, [historyScrollElement]);

  // IntersectionObserver-based load more for video history, using viewport as root
  useEffect(() => {
    if (!sentinelElement) return;
    const el = sentinelElement;
    const observer = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (!hasUserScrolledRef.current) return;
      if (!hasMore || loading || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        await (dispatch as any)(loadMoreHistory({
          filters: { mode: 'video' } as any,
          paginationParams: { limit: 10 }
        })).unwrap();
      } catch (e) {
        console.error('[Video] IO loadMore error', e);
      } finally {
        loadingMoreRef.current = false;
      }
    }, { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, dispatch, sentinelElement]);

  // Also mark user scroll on window in case container isn't scroll root
  useEffect(() => {
    const onWindowScroll = () => { hasUserScrolledRef.current = true; };
    window.addEventListener('scroll', onWindowScroll, { passive: true } as any);
    return () => window.removeEventListener('scroll', onWindowScroll as any);
  }, []);

  // Auto-fill viewport if content is short (load more until we have enough content)
  useEffect(() => {
    const container = historyScrollElement || document.documentElement;
    if (!container) return;
    const viewportHeight = window.innerHeight || 0;
    const contentHeight = container.scrollHeight || 0;
    if (contentHeight < viewportHeight + 200 && hasMore && !loading && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      (dispatch as any)(loadMoreHistory({ filters: { mode: 'video' } as any, paginationParams: { limit: 10 } }))
        .finally(() => { loadingMoreRef.current = false; });
    }
  }, [historyEntries, hasMore, loading, dispatch, historyScrollElement]);

  // Handle references upload
  const handleReferencesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newReferences: string[] = [];
    const maxReferences = 4;

    Array.from(files).forEach((file) => {
      if (newReferences.length >= maxReferences) return;
     
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setReferences(prev => {
              const updated = [...prev, result];
              if (updated.length > maxReferences) {
                return updated.slice(0, maxReferences);
              }
              console.log('📸 References updated:', updated.length, 'for S2V-01');
              return updated;
            });
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    event.target.value = '';
  };

  // Remove reference
  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setUploadedImages(prev => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Reset input
    event.target.value = '';
  };

  // Handle last frame image upload for MiniMax-Hailuo-02
  const handleLastFrameImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setLastFrameImage(result);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
  };

  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    // Validate file type and size (≤14MB client-side; service hard limit is 16MB)
    const allowedMimes = new Set([
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/mov',
      'video/h264',
    ]);

    const maxBytes = 14 * 1024 * 1024;
    if (!allowedMimes.has(file.type)) {
      toast.error('Unsupported video type. Use MP4, WebM, MOV, OGG, or H.264');
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      toast.error('Video too large. Please upload a video ≤ 14MB');
      event.target.value = '';
      return;
    }

    if (file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setUploadedVideo(result);
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
  };

  // Handle video generation
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    console.log('🚀 Starting video generation with:');
    console.log('🚀 - Selected model:', selectedModel);
    console.log('🚀 - Generation mode:', generationMode);
    console.log('🚀 - Is MiniMax model?', selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01");
    console.log('🚀 - Is Runway model?', !(selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01"));

    // Validate model compatibility with generation mode
    if (generationMode === "text_to_video" && !(selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director")) {
      setError("Text→Video mode only supports MiniMax models. Please select a MiniMax model or switch to Image→Video mode.");
      return;
    }

    setIsGenerating(true);
    setError("");
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const provider = selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01" ? 'minimax' : 'runway';
      const creditResult = await validateAndReserveCredits(provider);
      transactionId = creditResult.transactionId;
      console.log('✅ Credits validated and reserved:', creditResult.requiredCredits);
    } catch (creditError: any) {
      console.error('❌ Credit validation failed:', creditError);
      setError(creditError.message || 'Insufficient credits for generation');
      setIsGenerating(false);
      return;
    }

    // Backend handles history creation - no frontend history ID needed

    try {
      let requestBody;
      let generationType: string;
      let apiEndpoint: string;

      if (generationMode === "text_to_video") {
        // Text to video generation (MiniMax models)
        if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director") {
          // Text-to-video: No image requirements (pure text generation)
         
          requestBody = {
            model: selectedModel,
            prompt: prompt,
            // MiniMax-Hailuo-02: Include duration and resolution only (no images for text-to-video)
            ...(selectedModel === "MiniMax-Hailuo-02" && {
              duration: selectedMiniMaxDuration,
              resolution: selectedResolution
            }),
            generationType: "text-to-video"
          };
          generationType = "text-to-video";
          apiEndpoint = '/api/minimax/video';
        } else {
          // Runway models don't support text-to-video (they require an image)
          setError("Runway models don't support text-to-video generation. Please use Image→Video mode or select a MiniMax model.");
          return;
        }
      } else if (generationMode === "image_to_video") {
        // Check if we need uploaded images (exclude S2V-01 which only needs references)
        if (selectedModel !== "S2V-01" && uploadedImages.length === 0) {
          setError("Please upload at least one image");
          return;
        }
       
        if (selectedModel.includes("MiniMax") || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
          // MiniMax image to video - validate specific requirements
         
          // I2V-01-Director: Always requires first frame image
          if (selectedModel === "I2V-01-Director" && uploadedImages.length === 0) {
            setError("I2V-01-Director requires a first frame image");
            return;
          }
         
          // S2V-01: Requires subject reference image (character image)
          if (selectedModel === "S2V-01" && references.length === 0) {
            setError("S2V-01 requires a subject reference image (character image)");
            return;
          }
         
          // MiniMax-Hailuo-02: first_frame_image required for 512P, optional for 768P/1080P
          if (selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && uploadedImages.length === 0) {
            setError("MiniMax-Hailuo-02 requires a first frame image for 512P resolution");
            return;
          }
         
          requestBody = {
            model: selectedModel,
            prompt: prompt,
            // MiniMax-Hailuo-02: Include duration and resolution, first_frame_image based on requirements
            ...(selectedModel === "MiniMax-Hailuo-02" && {
              duration: selectedMiniMaxDuration,
              resolution: selectedResolution,
              // first_frame_image is required for 512P, optional for 768P/1080P
              ...(uploadedImages.length > 0 && {
                first_frame_image: uploadedImages[0]
              }),
              // last_frame_image is optional for supported resolutions
              ...(lastFrameImage && (selectedResolution === "768P" || selectedResolution === "1080P") && {
                last_frame_image: lastFrameImage
              })
            }),
            // I2V-01-Director: Always requires first_frame_image
            ...(selectedModel === "I2V-01-Director" && {
              first_frame_image: uploadedImages[0]
            }),
            // S2V-01: Uses subject_reference instead of first_frame_image
            ...(selectedModel === "S2V-01" && {
              subject_reference: [{
                type: "character",
                image: [references[0]]
              }]
            }),
            generationType: "image-to-video"
          };
          generationType = "image-to-video";
          apiEndpoint = '/api/minimax/video';
        } else {
          // Runway image to video
          const runwaySku = selectedModel === 'gen4_turbo' ? `Gen-4  Turbo ${duration}s` : `Gen-3a  Turbo ${duration}s`;
          requestBody = {
            mode: "image_to_video",
            sku: runwaySku,
            imageToVideo: buildImageToVideoBody({
              model: selectedModel as "gen4_turbo" | "gen3a_turbo",
              ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
              promptText: prompt,
              duration: duration as 5 | 10,
              promptImage: uploadedImages[0]
            }),
            generationType: "image-to-video"
          };
          apiEndpoint = '/api/runway/video';
        }
        generationType = "image-to-video";
      } else {
        // Video to video generation
        if (!uploadedVideo) {
          setError("Please upload a video");
          return;
        }
       
        if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
          // MiniMax models don't support video to video
          setError("MiniMax models don't support video to video generation");
          return;
        } else {
          // Runway video to video
          const runwayAlephSku = 'Gen-4 Aleph 10s';
          requestBody = {
            mode: "video_to_video",
            sku: runwayAlephSku,
            videoToVideo: buildVideoToVideoBody({
              model: "gen4_aleph",
              ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
              promptText: prompt,
              videoUri: uploadedVideo,
              references: references.length > 0 ? references.map(ref => ({
                type: "image",
                uri: ref
              })) : undefined,
            }),
            generationType: "video-to-video"
          };
          apiEndpoint = '/api/runway/video';
        }
        generationType = "video-to-video";
      }

      // Create local preview entry (history-style) to show generating tile in today's row
      setLocalVideoPreview({
        id: `video-loading-${Date.now()}`,
        prompt,
        model: selectedModel,
        generationType: generationType as any,
        images: [ { id: 'video-loading', url: '', originalUrl: '' } ] as any,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        status: 'generating'
      } as any);

      // Backend will handle history creation - no frontend history creation needed

      // Make API call
      console.log('🚀 Making API call to:', apiEndpoint);
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('📤 Selected model:', selectedModel);
      console.log('📤 Generation mode:', generationMode);
      console.log('📤 API Endpoint being used:', apiEndpoint);
      console.log('📤 Is this a MiniMax model?', selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01");
      console.log('📤 Is this a Runway model?', !(selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01"));
     
      // Debug MiniMax specific fields
      if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
        console.log('📤 MiniMax Debug Info:');
        console.log('📤 - Model:', selectedModel);
        console.log('📤 - Duration:', requestBody.duration);
        console.log('📤 - Resolution:', requestBody.resolution);
        console.log('📤 - First frame image:', !!requestBody.first_frame_image);
        console.log('📤 - Subject reference:', requestBody.subject_reference);
        console.log('📤 - Prompt length:', requestBody.prompt?.length || 0);
       
        if (selectedModel === "S2V-01") {
          console.log('📤 S2V-01 specific debug:');
          console.log('📤 - References array length:', references.length);
          console.log('📤 - Subject reference structure:', JSON.stringify(requestBody.subject_reference, null, 2));
        }
      }
     
      const api = getApiClient();
      let result: any;
      try {
        const { data } = await api.post(apiEndpoint, requestBody);
        result = data?.data || data;
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Request failed';
        if (String(e?.response?.status) === '413' || /request entity too large/i.test(String(msg))) {
          toast.error('Video too large for provider. Max 16MB. Please upload ≤ 14MB');
        }
        console.error('❌ API response not ok:', e?.response?.status || '-', msg);
        throw new Error(`HTTP ${e?.response?.status || 500}: ${msg}`);
      }
      console.log('📥 API response:', result);
     
      // Debug MiniMax response structure
      if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
        console.log('📥 MiniMax Response Debug:');
        console.log('📥 - Response type:', typeof result);
        console.log('📥 - Response keys:', Object.keys(result));
        console.log('📥 - Success field:', result.success);
        console.log('📥 - TaskId field:', result.taskId);
        console.log('📥 - TaskId type:', typeof result.taskId);
        console.log('📥 - Error field:', result.error);
        console.log('📥 - Full response structure:', JSON.stringify(result, null, 2));
      }

      if (result.error) {
        console.error('❌ API returned error:', result.error);
        throw new Error(result.error);
      }

      // Validate that we have a taskId for MiniMax models
      console.log('🔍 Validation Debug:');
      console.log('🔍 - Selected model:', selectedModel);
      console.log('🔍 - Is MiniMax model?', selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01");
      console.log('🔍 - Has taskId?', !!result.taskId);
      console.log('🔍 - Result object:', result);
     
      if ((selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") && !result.taskId) {
        console.error('❌ MiniMax API response missing taskId:', result);
        throw new Error('MiniMax API response missing taskId');
      }

      let videoUrl: string;

      if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
        // MiniMax flow - same as Runway with polling
        console.log('🎬 MiniMax video generation started, task ID:', result.taskId);
        console.log('🎬 TaskId type:', typeof result.taskId);
        console.log('🎬 TaskId length:', result.taskId ? result.taskId.length : 'undefined');
        console.log('🎬 Using MiniMax status checking for model:', selectedModel);
        console.log('🎬 Model type:', selectedModel);
       
        // Poll for completion like Runway
        const videoResult = await waitForMiniMaxVideoCompletion(result.taskId, { historyId: result.historyId });
        console.log('🎬 MiniMax video result received:', videoResult);
       
        if (videoResult.status === 'Success') {
          // Video generation completed successfully
          if (videoResult.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
            // File retrieval succeeded - use Zata URL
            videoUrl = videoResult.videos[0].url;
            console.log('✅ MiniMax video completed with Zata URL:', videoUrl);
            console.log('📹 Video storage path:', videoResult.videos[0].storagePath);
            console.log('📹 Original URL:', videoResult.videos[0].originalUrl);
           
            // Store video data for later use
            window.miniMaxVideoData = videoResult.videos[0];
          } else if (videoResult.download_url) {
            // Fallback to download_url if videos array is not available
            videoUrl = videoResult.download_url;
            console.log('✅ MiniMax video completed with download URL:', videoUrl);
          } else {
            // File retrieval failed, but video generation succeeded - video should be in database
            console.log('✅ MiniMax video generation completed successfully. Video stored in database.');
            videoUrl = ''; // We'll rely on the video being in the database
          }
        } else if (videoResult.status === 'Fail') {
          console.error('❌ MiniMax video generation failed:', videoResult);
          throw new Error('MiniMax video generation failed');
        } else {
          console.error('❌ Unexpected MiniMax status:', videoResult);
          throw new Error('Unexpected MiniMax video generation status');
        }
      } else {
        // Runway video completion
        console.log('🎬 Runway video generation started, task ID:', result.taskId);
        console.log('🎬 Using Runway status checking for model:', selectedModel);
        const videoResult = await waitForRunwayVideoCompletion(result.taskId);

        if (videoResult.status === 'SUCCEEDED' && videoResult.output && videoResult.output.length > 0) {
          videoUrl = videoResult.output[0];
          console.log('✅ Runway video completed, URL:', videoUrl);
        } else if (videoResult.status === 'FAILED') {
          console.error('❌ Runway video generation failed:', videoResult);
          throw new Error('Video generation failed');
        } else {
          console.error('❌ Unexpected Runway status:', videoResult);
          throw new Error('Unexpected video generation status');
        }
      }

      // Handle video data from backend response
      let firebaseVideo;
     
      // Check if we have video data from MiniMax response (prefer this over videoUrl)
      if ((window as any).miniMaxVideoData) {
        const videoData = (window as any).miniMaxVideoData;
        console.log('🎬 Using video data from backend response:', videoData);
       
        firebaseVideo = {
          id: videoData.id,
          url: videoData.url, // This is the Zata URL
          firebaseUrl: videoData.url, // Same as URL since it's already in our storage
          originalUrl: videoData.originalUrl
        };
       
        console.log('✅ Video data processed from backend:', firebaseVideo);
       
        // Clean up the temporary storage
        delete (window as any).miniMaxVideoData;
      } else if (videoUrl) {
        // Fallback: We have a video URL but no structured data
        console.log('🎬 Using fallback video URL processing...');
        const videoToUpload = {
          id: Date.now().toString(),
          url: videoUrl,
          originalUrl: videoUrl
        };
       
        // IMPORTANT: Avoid browser-side fetch of third-party URL (CORS).
        // If URL already points to our storage (returned from backend with history_id), use it directly.
        const isOurStorage = /zata\.ai\//i.test(videoUrl) || /firebasestorage\.googleapis\.com/i.test(videoUrl);
        try {
          if (isOurStorage) {
            firebaseVideo = {
              id: videoToUpload.id,
              url: videoUrl,
              firebaseUrl: videoUrl,
              originalUrl: videoUrl
            };
          } else {
            // Fallback to client upload utility (may CORS-fail; we catch and keep provider URL)
            firebaseVideo = await uploadGeneratedVideo(videoToUpload);
          }
          console.log('✅ Video processed via fallback:', firebaseVideo);
        } catch (uploadError) {
          console.error('❌ Video upload to Firebase failed:', uploadError);
          // Continue with original URL if Firebase upload fails
          firebaseVideo = {
            id: videoToUpload.id,
            url: videoUrl,
            firebaseUrl: videoUrl,
            originalUrl: videoUrl
          };
        }
      } else {
        // No videoUrl - video generation succeeded but file retrieval failed
        // The video should already be stored in the database by the backend
        console.log('✅ Video generation completed. Video should be available in database.');
        firebaseVideo = {
          id: result.taskId || Date.now().toString(),
          url: '', // Will be populated from database
          firebaseUrl: '', // Will be populated from database
          originalUrl: '' // Will be populated from database
        };
      }

      // Backend handles all history updates - no frontend Redux update needed
      console.log('🎬 Video generation completed successfully');
      console.log('🎬 History ID:', result.historyId);
      console.log('🎬 Model:', selectedModel);
      console.log('🎬 Video data processed:', firebaseVideo);

      // Update local preview to completed with a thumbnail frame if available
      try {
        const previewImageUrl = firebaseVideo?.url || firebaseVideo?.firebaseUrl || '';
        setLocalVideoPreview(prev => prev ? ({
          ...prev,
          status: 'completed',
          images: [{ id: 'video-thumb', url: previewImageUrl, originalUrl: previewImageUrl }] as any,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        } as any) : prev);
      } catch {}

      // Confirm credit transaction as successful
      await handleGenerationSuccess(transactionId);
      console.log('✅ Credits confirmed for successful generation');
     
      // Refresh history to show the new video
      dispatch(clearFilters());
      dispatch(loadHistory({ filters: { mode: 'video' } as any, paginationParams: { limit: 50 } }));
     
      // Also refresh the extra video entries to ensure text-to-video entries appear
      setTimeout(async () => {
        try {
          const [textToVideo, imageToVideoHyphen, imageToVideoUnderscore, videoToVideoHyphen, videoToVideoUnderscore] = await Promise.all([
            getHistoryEntries({ generationType: 'text-to-video' as any }, { limit: 20 }),
            getHistoryEntries({ generationType: 'image-to-video' as any }, { limit: 20 }),
            getHistoryEntries({ generationType: 'image_to_video' as any }, { limit: 20 }),
            getHistoryEntries({ generationType: 'video-to-video' as any }, { limit: 20 }),
            getHistoryEntries({ generationType: 'video_to_video' as any }, { limit: 20 })
          ]);
         
          const allResults = [
            ...(textToVideo.data || []),
            ...(imageToVideoHyphen.data || []),
            ...(imageToVideoUnderscore.data || []),
            ...(videoToVideoHyphen.data || []),
            ...(videoToVideoUnderscore.data || [])
          ];
         
          const byId: Record<string, any> = {};
          allResults.forEach((entry: any) => {
            byId[entry.id] = entry;
          });
         
          const combined = Object.values(byId);
          const sortedCombined = combined.sort((a: any, b: any) => {
            const timestampA = new Date(a.timestamp || a.createdAt || 0).getTime();
            const timestampB = new Date(b.timestamp || b.createdAt || 0).getTime();
            return timestampB - timestampA;
          });
         
          setExtraVideoEntries(sortedCombined);
          console.log('[VideoPage] refreshed extra video entries after generation:', sortedCombined.length);
        } catch (e) {
          console.error('[VideoPage] failed to refresh extra video entries:', e);
        }
      }, 1000); // Small delay to ensure backend has updated

      dispatch(
        addNotification({
          type: "success",
          message: "Video generated successfully!",
        })
      );

      // Clear form
      setPrompt("");
      setUploadedImages([]);
      setUploadedVideo("");
      setReferences([]);

    } catch (error) {
      console.error('❌ Video generation failed:', error);
      setError(error instanceof Error ? error.message : 'Video generation failed');
      setLocalVideoPreview(prev => prev ? ({ ...prev, status: 'failed' } as any) : prev);

      // Handle credit transaction failure
      try {
        await handleGenerationFailure(transactionId);
        console.log('✅ Credits rolled back for failed generation');
      } catch (creditError) {
        console.error('❌ Failed to rollback credits:', creditError);
      }

      dispatch(
        addNotification({
          type: "error",
          message: error instanceof Error ? error.message : 'Video generation failed',
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
     {(historyEntries.length > 0 || localVideoPreview) && (
        <div ref={(el) => { historyScrollRef.current = el; setHistoryScrollElement(el); }} className=" inset-0  pl-[0] pr-6 pb-6 overflow-y-auto no-scrollbar z-0 ">
          <div className="py-6 pl-4 ">
          {/* History Header - Fixed during scroll */}
          <div className="fixed top-0 mt-1 left-0 right-0 z-30 py-5 ml-18 mr-1 bg-white/10 backdrop-blur-xl shadow-xl pl-6 border border-white/10 rounded-2xl ">
            <h2 className="text-xl font-semibold text-white pl-0 ">Video Generation History</h2>
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

              {/* Local preview block for today when no row exists yet */}
              {localVideoPreview && !groupedByDate[todayKey] && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-white/70">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3 ml-9">
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                      {localVideoPreview.status === 'generating' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
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

              {/* History Entries - Grouped by Date */}
              <div className="space-y-8">
              {/* If there's a local preview and no row for today, render a dated block for today */}
              {localVideoPreview && !groupedByDate[todayKey] && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-white/70">
                      {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3 ml-9">
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                      {localVideoPreview.status === 'generating' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
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
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
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

                  {/* All Videos for this Date - Horizontal Layout */}
                  <div className="flex flex-wrap gap-3 ml-9">
                    {/* Prepend local video preview to today's row to push existing items right */}
                    {date === todayKey && localVideoPreview && (
                      <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                        {localVideoPreview.status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
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
                    )}
                    {groupedByDate[date].map((entry: HistoryEntry) => {
                      // More defensive approach to get media items
                      let mediaItems: any[] = [];
                      if (entry.images && Array.isArray(entry.images) && entry.images.length > 0) {
                        mediaItems = entry.images;
                      } else if (entry.videos && Array.isArray(entry.videos) && entry.videos.length > 0) {
                        mediaItems = entry.videos;
                      } else {
                        // Fallback: check if videos are stored in a different structure
                        console.log(`[VideoPage] No valid media found for entry ${entry.id}, checking structure:`, {
                          images: entry.images,
                          videos: entry.videos,
                          videosType: typeof entry.videos,
                          videosIsArray: Array.isArray(entry.videos),
                          videosContent: entry.videos,
                          allKeys: Object.keys(entry)
                        });
                      }
                      console.log(`[VideoPage] Rendering entry ${entry.id}:`, {
                        generationType: entry.generationType,
                        status: entry.status,
                        imagesCount: entry.images?.length || 0,
                        videosCount: entry.videos?.length || 0,
                        mediaItemsCount: mediaItems.length,
                        images: entry.images,
                        videos: entry.videos,
                        videosType: typeof entry.videos,
                        videosIsArray: Array.isArray(entry.videos),
                        videosContent: entry.videos
                      });
                     
                      return mediaItems.map((video: any) => (
                        <div
                          key={`${entry.id}-${video.id}`}
                          data-video-id={`${entry.id}-${video.id}`}
                          onClick={() => setPreview({ entry, video })}
                          className="relative w-48 h-48 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
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
                            // Completed video thumbnail with shimmer loading
                            <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center relative">
                              {(video.firebaseUrl || video.url) ? (
                                <div className="relative w-full h-full">
                                  <video
                                    src={video.firebaseUrl || video.url}
                                    className="w-full h-full object-cover"
                                    muted
                                    onLoadedData={(e) => {
                                      // Create thumbnail from video
                                      const videoElement = e.target as HTMLVideoElement;
                                      const canvas = document.createElement('canvas');
                                      canvas.width = videoElement.videoWidth;
                                      canvas.height = videoElement.videoHeight;
                                      const ctx = canvas.getContext('2d');
                                      if (ctx) {
                                        ctx.drawImage(videoElement, 0, 0);
                                        // You could use this canvas as thumbnail if needed
                                      }
                                     
                                      // Remove shimmer when video loads
                                      setTimeout(() => {
                                        const shimmer = document.querySelector(`[data-video-id="${entry.id}-${video.id}"] .shimmer`) as HTMLElement;
                                        if (shimmer) {
                                          shimmer.style.opacity = '0';
                                        }
                                      }, 100);
                                    }}
                                  />
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
                              {/* Video duration or other info */}
                              {/* <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                                <span className="text-xs text-white">Video</span>
                              </div> */}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </div>
                      ));
                    })}
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
              {/* Sentinel for IO-based infinite scroll */}
              <div ref={(el) => { sentinelRef.current = el; setSentinelElement(el); }} style={{ height: 1 }} />
            </div>
          </div>
        </div>
      )}
     
      {/* Main Input Box */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[60]">
        <div className={`rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl transition-all duration-300 ${
          (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") ? 'max-w-[1100px]' : 'max-w-[900px]'
        }`}>
          {/* Top row: prompt + actions */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center gap-2 bg-transparent rounded-xl px-4 py-2.5">
              <textarea
                ref={inputEl}
                placeholder="Type your video prompt..."
              value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                className={`flex-1 bg-transparent text-white placeholder-white/50 outline-none text-[15px] leading-relaxed resize-none overflow-y-auto transition-all duration-200 ${
                  prompt ? 'text-white' : 'text-white/70'
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
              <div className="flex items-center gap-2 h-[40px]">
                {/* Camera Movements - unified button for supported models and modes */}
                {(
                  (generationMode === "text_to_video" && selectedModel === "T2V-01-Director") ||
                  (generationMode === "image_to_video" && selectedModel === "I2V-01-Director")
                ) && (
                  <div className="relative camera-movement-container">
            <button
                      onClick={() => setCameraMovementPopupOpen(!cameraMovementPopupOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-white/80 hover:text-white"
                      title="Camera Movement Options"
                    >
                      <span>Camera Movements</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      {selectedCameraMovements.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                          1
                        </span>
                      )}
                    </button>

                    {cameraMovementPopupOpen && (
                      <div className="absolute bottom-full left-0 mb-2 p-4 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[280px]">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-white">Select One Camera Movement</h3>
                          <button
                            onClick={() => setCameraMovementPopupOpen(false)}
                            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                       
                        <div className="text-xs text-white/60 mb-3 text-center">
                          Click a movement to select it, then add to your prompt
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {[
                            "Tilt up", "Tilt down", "Pan left", "Pan right",
                            "Zoom in", "Zoom out", "Push in", "Push out",
                            "Rotate left", "Rotate right", "Dolly in", "Dolly out"
                          ].map((movement) => (
                            <button
                              key={movement}
                              onClick={() => {
                                // Single selection: only one movement at a time
                                setSelectedCameraMovements([movement]);
                              }}
                              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                selectedCameraMovements.includes(movement)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                              }`}
                            >
                              {movement}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (selectedCameraMovements.length > 0) {
                                const movementText = `[${selectedCameraMovements[0]}]`;
                                setPrompt(prev => prev + (prev.endsWith(' ') ? '' : ' ') + movementText);
                                // Reset selection after adding to prompt
                                setSelectedCameraMovements([]);
                                setCameraMovementPopupOpen(false);
                              }
                            }}
                            disabled={selectedCameraMovements.length === 0}
                            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Add Movement to Prompt
                          </button>
                          <button
                            onClick={() => setSelectedCameraMovements([])}
                            className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
                          >
                            Clear
                          </button>
                        </div>

                        <div className="mt-3 text-xs text-white/60">This model responds accurately to camera movement instructions for shot control</div>
                      </div>
                    )}
                  </div>
                )}

                {/* References Upload (for video-to-video and S2V-01 character reference) */}
              {(generationMode === "video_to_video" || (generationMode === "image_to_video" && selectedModel === "S2V-01")) && (
                <div className="relative">
                  <label
                    className={`p-2 rounded-xl transition-all duration-200 cursor-pointer group relative ${
                      (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                      (generationMode === "video_to_video" && references.length >= 4)
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    title={generationMode === "image_to_video" && selectedModel === "S2V-01"
                      ? `Character Reference (${references.length}/1)`
                      : `References (${references.length}/4)`
                    }
                  >
                    <FileSliders
                      size={22}
                      className={`transition-all duration-200 ${
                        (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                        (generationMode === "video_to_video" && references.length >= 4)
                          ? 'text-gray-400'
                          : 'text-green-400 hover:text-green-300 hover:scale-110'
                      }`}
                    />
                   
                    {/* References Count Badge */}
                    {references.length > 0 && (
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                        (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                        (generationMode === "video_to_video" && references.length >= 4)
                          ? 'bg-red-500' : 'bg-green-500'
                      }`}>
                        <span className="text-xs text-white font-bold">{references.length}</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple={generationMode === "video_to_video"}
                      className="hidden"
                      onChange={handleReferencesUpload}
                      disabled={(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                               (generationMode === "video_to_video" && references.length >= 4)}
                    />
                  </label>
                 
                  {/* References Preview Popup */}
                  {references.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[200px]">
                      <div className="text-xs text-white/60 mb-2">
                        {generationMode === "image_to_video" && selectedModel === "S2V-01"
                          ? `Character Reference (${references.length}/1)`
                          : `References (${references.length}/4)`
                        }
                      </div>
                      <div className="space-y-2">
                        {references.map((ref, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                              <img
                                src={ref}
                                alt={`Reference ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-white/80 flex-1">Reference {index + 1}</span>
                            <button
                              onClick={() => removeReference(index)}
                              className="w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
            </button>
          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Upload for Runway Models (image-to-video only) */}
              {generationMode === "image_to_video" &&
               !(selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") && (
                <div className="relative">
                  <label
                    className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                    title="Upload Image"
                  >
                    <Image
                      src="/icons/imagegenerationwhite.svg"
                      alt="Upload Image"
                      width={22}
                      height={22}
                      className="text-white transition-all duration-200 hover:text-blue-300 hover:scale-110"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              )}

              {/* MiniMax Image Uploads - Consolidated (Image-to-Video only) */}
              {generationMode === "image_to_video" && (selectedModel.includes("MiniMax") || selectedModel === "I2V-01-Director" || selectedModel === "I2V-01-Director") && (
                <div className="relative">
                  <label
                    className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                    title={selectedModel === "MiniMax-Hailuo-02" ? "Upload First Frame Image" : "Upload First Frame Image (Required)"}
                  >
                    <Image
                      src="/icons/imagegenerationwhite.svg"
                      alt="Upload First Frame Image"
                      width={22}
                      height={22}
                      className="text-white transition-all duration-200 hover:text-blue-300 hover:scale-110"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                 
                  {/* Model Requirements Helper */}
                  {/* <div className="absolute bottom-full left-0 mb-2 p-3 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[250px]">
                    <div className="text-xs text-white/80 mb-2 font-medium">Model Requirements:</div>
                    {selectedModel === "I2V-01-Director" && (
                      <div className="text-xs text-white/60">• Requires first frame image</div>
                    )}
                    {selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && (
                      <div className="text-xs text-white/60">• Requires first frame image for 512P resolution</div>
                    )}
                    {selectedModel === "MiniMax-Hailuo-02" && (selectedResolution === "768P" || selectedResolution === "1080P") && (
                      <div className="text-xs text-white/60">• First frame image is optional</div>
                    )}
                  </div> */}
                </div>
              )}



              {/* Last Frame Image Upload for MiniMax-Hailuo-02 (768P/1080P) - Image-to-Video only */}
              {generationMode === "image_to_video" && selectedModel === "MiniMax-Hailuo-02" && (selectedResolution === "768P" || selectedResolution === "1080P") && (
                <div className="relative">
                  <label
                    className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                    title="Upload Last Frame Image (Optional)"
                  >
                    <Image
                      src="/icons/imagegenerationwhite.svg"
                      alt="Upload Last Frame Image"
                      width={22}
                      height={22}
                      className={`transition-all duration-200 ${
                        lastFrameImage
                          ? 'text-green-400 hover:text-green-300 hover:scale-110'
                          : 'text-white/60 hover:text-white/80 hover:scale-110'
                      }`}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLastFrameImageUpload}
                    />
                  </label>
                 
                  {/* Last Frame Image Preview */}
                  {lastFrameImage && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[200px]">
                      <div className="text-xs text-white/60 mb-2">Last Frame Image</div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                          <img
                            src={lastFrameImage}
                            alt="Last Frame"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-white/80 flex-1">Last Frame</span>
                        <button
                          onClick={() => setLastFrameImage("")}
                          className="w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video Upload (only for video-to-video) */}
              {generationMode === "video_to_video" && (
                <div className="relative">
                  <label
                    className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                    title="Upload Video"
                  >
                    <FilePlay
                      size={22}
                      className="text-white transition-all duration-200 hover:text-purple-300 hover:scale-110"
                    />
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                </div>
              )}

              </div>

             
            </div>

            <div className="flex flex-col items-end gap-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              onClick={handleGenerate}
                disabled={(() => {
                  const disabled = isGenerating || !prompt.trim() ||
                    // Mode-specific validations
                    (generationMode === "image_to_video" && selectedModel !== "S2V-01" && uploadedImages.length === 0) ||
                    (generationMode === "video_to_video" && !uploadedVideo) ||
                    // Model-specific validations (only for image-to-video)
                    (generationMode === "image_to_video" && selectedModel === "I2V-01-Director" && uploadedImages.length === 0) ||
                    (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length === 0) ||
                    (generationMode === "image_to_video" && selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && uploadedImages.length === 0);
                 
                  // Debug logging for S2V-01
                  if (selectedModel === "S2V-01") {
                    console.log('🔍 S2V-01 Validation Debug:', {
                      isGenerating,
                      hasPrompt: !!prompt.trim(),
                      referencesLength: references.length,
                      generationMode,
                      disabled
                    });
                  }
                 
                  return disabled;
                })()}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-full text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
            >
                {isGenerating ? "Generating..." : "Generate Video"}
            </button>
          </div>
        </div>

          {/* Uploaded Content Display */}
          <div className="px-3 pb-3">
            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-white/60 mb-2">Uploaded Images ({uploadedImages.length})</div>
                <div className="flex gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                        onClick={() => {
                          const previewEntry: HistoryEntry = {
                            id: `preview-${index}`,
                            prompt: "Uploaded Image",
                            model: "preview",
                            frameSize: "1:1",
                            images: [{ id: `img-${index}`, url: image, originalUrl: image, firebaseUrl: image }],
                            status: "completed",
                            timestamp: new Date().toISOString(),
                            createdAt: new Date().toISOString(),
                            imageCount: 1,
                            generationType: "text-to-video" as const,
                            style: undefined
                          };
                          setPreview({ entry: previewEntry, video: image });
                        }}
                      >
                        <img
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
        </div>
                      <button
                        aria-label="Remove image"
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        onClick={() => {
                          setUploadedImages(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        ×
                      </button>
      </div>
                  ))}
                </div>
              </div>
            )}

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
                        generationType: "text-to-video" as const,
                        style: undefined
                      };
                      setPreview({ entry: previewEntry, video: uploadedVideo });
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-blue-400"
                      >
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
          </div>

          {/* Bottom row: pill options */}
          <div className="flex justify-between items-center gap-2 px-3 pb-3">
            <div className="flex flex-col gap-2">
              {/* Mode and Model Info */}
              {/* <div className="flex items-center gap-3 text-xs text-white/60">
                <span className="px-2 py-1 bg-white/10 rounded-md">
                  {generationMode === "image_to_video" ? "Image → Video" : "Video → Video"}
                </span>
                <span className="px-2 py-1 bg-white/10 rounded-md">
                  Model: {selectedModel === "gen4_turbo" ? "Gen-4 Turbo" :
                          selectedModel === "gen3a_turbo" ? "Gen-3a Turbo" :
                          selectedModel === "gen4_aleph" ? "Gen-4 Aleph" : selectedModel}
                </span>
              </div> */}
             


              {/* Dropdowns */}
              <div className="flex items-center gap-2">
                <VideoModelsDropdown
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  generationMode={generationMode}
                  selectedDuration={selectedModel.includes("MiniMax") ? `${selectedMiniMaxDuration}s` : `${duration}s`}
                  selectedResolution={selectedModel.includes("MiniMax") ? selectedResolution : undefined}
                />

                {/* Dynamic Controls Based on Model Capabilities */}
                {(() => {
                  // Fixed Models: T2V-01, I2V-01, S2V-01 - No dropdowns, fixed 720P, 6s
                  if (selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
                    return (
                      <>
                        {/* Fixed Resolution Display */}
                        <div className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          <TvMinimalPlay className="w-4 h-4 mr-1" />
                          720P (Fixed)
                        </div>
                        {/* Fixed Duration Display */}
                        <div className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          <Clock className="w-4 h-4 mr-1" />
                          6s (Fixed)
      </div>
                      </>
                    );
                  }
                 
                  // Runway Models: Full customization
                  if (!(selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01")) {
                    return (
                      <>
                        {/* Aspect Ratio - Always shown for Runway models */}
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={setFrameSize}
                          selectedModel={selectedModel}
                        />
                        {/* Duration - For image→video and text→video modes */}
                        {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                          <VideoDurationDropdown
                            selectedDuration={duration}
                            onDurationChange={setDuration}
                          />
                        )}
                      </>
                    );
                  }
                 
                  // MiniMax-Hailuo-02: Configurable resolution and duration
                  if (selectedModel === "MiniMax-Hailuo-02") {
                    return (
                      <>
                        {/* MiniMax-Hailuo-02: Configurable resolution and duration */}
                        {selectedModel === "MiniMax-Hailuo-02" && (
                          <>
                            {/* Resolution Control */}
                            <div className="relative dropdown-container">
                              <button
                                onClick={() => setResolutionDropdownOpen(!resolutionDropdownOpen)}
                                className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
                                  selectedResolution !== '1080P'
                                    ? 'bg-white text-black'
                                    : 'bg-transparent text-white/90 hover:bg-white/5'
                                }`}
                              >
                                <TvMinimalPlay className="w-4 h-4 mr-1" />
                                {selectedResolution}
                              </button>
                              {resolutionDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                                  {/* Available resolutions based on duration */}
                                  {selectedMiniMaxDuration === 6 && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setSelectedResolution("512P");
                                          setResolutionDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                          selectedResolution === "512P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                        }`}
                                      >
                                        512P
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedResolution("768P");
                                          setResolutionDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                          selectedResolution === "768P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                        }`}
                                      >
                                        768P
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedResolution("1080P");
                                          setResolutionDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                          selectedResolution === "1080P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                        }`}
                                      >
                                        1080P
                                      </button>
                                    </>
                                  )}
                                  {selectedMiniMaxDuration === 10 && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setSelectedResolution("512P");
                                          setResolutionDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                          selectedResolution === "512P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                        }`}
                                      >
                                        512P
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedResolution("768P");
                                          setResolutionDropdownOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                          selectedResolution === "768P" ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                        }`}
                                      >
                                        768P
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Duration Control */}
                            <div className="relative dropdown-container">
                              <button
                                onClick={() => setDurationDropdownOpen(!durationDropdownOpen)}
                                className={`h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
                                  selectedMiniMaxDuration !== 6
                                    ? 'bg-white text-black'
                                    : 'bg-transparent text-white/90 hover:bg-white/5'
                                }`}
                              >
                                <Clock className="w-4 h-4 mr-1" />
                                {selectedMiniMaxDuration}s
                              </button>
                              {durationDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/30 pb-2 pt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedMiniMaxDuration(6);
                                      setDurationDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                      selectedMiniMaxDuration === 6 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                    }`}
                                  >
                                    6s
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedMiniMaxDuration(10);
                                      setDurationDropdownOpen(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left transition text-[13px] ${
                                      selectedMiniMaxDuration === 10 ? 'bg-white text-black' : 'text-white/90 hover:bg-white/10'
                                    }`}
                                  >
                                    10s
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}


                      </>
                    );
                  }
                 
                  return null;
                })()}


              </div>


            </div>

            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setGenerationMode("text_to_video")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  generationMode === "text_to_video"
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Text→Video
              </button>
              <button
                onClick={() => setGenerationMode("image_to_video")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  generationMode === "image_to_video"
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Image→Video
              </button>
              <button
                onClick={() => setGenerationMode("video_to_video")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  generationMode === "video_to_video"
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Video→Video
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <VideoPreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
};

export default InputBox;