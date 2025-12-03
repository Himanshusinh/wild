"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
import { addHistoryEntry, loadHistory, loadMoreHistory, updateHistoryEntry, clearFilters, removeHistoryEntry } from "@/store/slices/historySlice";
import useHistoryLoader from '@/hooks/useHistoryLoader';
import axiosInstance from "@/lib/axiosInstance";
import { Trash2 } from 'lucide-react';
import { addNotification } from "@/store/slices/uiSlice";
import { useSearchParams } from "next/navigation";
// historyService removed; backend owns history persistence
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => { };
const getHistoryEntries = async (_filters?: any, _pag?: any) => ({ data: [] } as any);
import { waitForRunwayVideoCompletion } from "@/lib/runwayVideoService";
import { buildImageToVideoBody, buildVideoToVideoBody } from "@/lib/videoGenerationBuilders";
import { uploadGeneratedVideo } from "@/lib/videoUpload";
import { VideoGenerationState, GenMode } from "@/types/videoGeneration";
import { FilePlay, FileSliders, Crop, Clock, TvMinimalPlay, ChevronUp, FilePlus2, Music, X, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { MINIMAX_MODELS, MiniMaxModelType } from "@/lib/minimaxTypes";
import WildMindLogoGenerating from '@/app/components/WildMindLogoGenerating';
import { getApiClient } from "@/lib/axiosInstance";
import { useGenerationCredits } from "@/hooks/useCredits";
import UploadModal from "@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal";
import VideoUploadModal from "./VideoUploadModal";
import { getVideoCreditCost } from "@/utils/creditValidation";
import { enhancePromptAPI } from '@/lib/api/geminiApi';

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
import QualityDropdown from "./QualityDropdown";
import KlingModeDropdown from "./KlingModeDropdown";
import ResolutionDropdown from "./ResolutionDropdown";
import VideoPreviewModal from "./VideoPreviewModal";
import { toThumbUrl } from '@/lib/thumb';
import { useBottomScrollPagination } from '@/hooks/useBottomScrollPagination';
import { usePersistedGenerationState } from '@/hooks/usePersistedGenerationState';
import AssetViewerModal from '@/components/AssetViewerModal';


interface InputBoxProps {
  placeholder?: string;
  activeFeature?: 'Video' | 'Lipsync' | 'Animate';
  showHistory?: boolean; // Control whether to show the history section
}

const InputBox = (props: InputBoxProps = {}) => {
  const { placeholder = " video prompt...", activeFeature = 'Video', showHistory = true } = props;
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    video: any;
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
  const inputEl = useRef<HTMLTextAreaElement>(null);

  // Helper functions for proxy URLs (same as History.tsx)
  const toProxyPath = (urlOrPath: string | undefined) => {
    if (!urlOrPath) return '';
    const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || '';
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

  // Video generation state - persisted in localStorage
  const [prompt, setPrompt] = usePersistedGenerationState("prompt", "", "text-to-video");
  const [selectedModel, setSelectedModel] = usePersistedGenerationState("selectedModel", "seedance-1.0-lite-t2v", "text-to-video");
  const [frameSize, setFrameSize] = usePersistedGenerationState("frameSize", "16:9", "text-to-video");
  const [duration, setDuration] = usePersistedGenerationState("duration", 6, "text-to-video");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImages, setUploadedImages] = usePersistedGenerationState<string[]>("uploadedImages", [], "text-to-video");

  // Debug uploadedImages changes
  useEffect(() => {
    console.log('Video generation - uploadedImages changed:', uploadedImages);
  }, [uploadedImages]);
  const [uploadedVideo, setUploadedVideo] = usePersistedGenerationState("uploadedVideo", "", "text-to-video");
  // Backup of uploaded video specifically for Gen-4 Aleph (V2V)
  const [alephVideoBackup, setAlephVideoBackup] = usePersistedGenerationState("alephVideoBackup", "", "text-to-video");
  const [uploadedAudio, setUploadedAudio] = usePersistedGenerationState("uploadedAudio", "", "text-to-video"); // For WAN models audio file
  const [uploadedCharacterImage, setUploadedCharacterImage] = usePersistedGenerationState("uploadedCharacterImage", "", "text-to-video"); // For WAN 2.2 Animate Replace character image
  const [sourceHistoryEntryId, setSourceHistoryEntryId] = useState<string>(""); // For Sora 2 Remix source video
  const [references, setReferences] = usePersistedGenerationState<string[]>("references", [], "text-to-video");
  const [generationMode, setGenerationMode] = usePersistedGenerationState<"text_to_video" | "image_to_video" | "video_to_video">("generationMode", "text_to_video", "text-to-video");
  const [error, setError] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Handle image parameter from URL for image-to-video mode
  useEffect(() => {
    console.log('Video generation - useEffect triggered, searchParams changed');
    const imageUrl = searchParams.get('image');
    console.log('Video generation - checking for image parameter:', imageUrl);
    console.log('Video generation - all search params:', Object.fromEntries(searchParams.entries()));
    console.log('Video generation - current uploadedImages:', uploadedImages);
    console.log('Video generation - current generationMode:', generationMode);

    if (imageUrl) {
      // Decode the URL-encoded image parameter
      let decodedImageUrl = decodeURIComponent(imageUrl);

      // Convert proxy URL to full Zata URL if needed
      if (decodedImageUrl.startsWith('/api/proxy/resource/')) {
        const ZATA_PREFIX = (process.env.NEXT_PUBLIC_ZATA_PREFIX as string) || '';
        const path = decodedImageUrl.replace('/api/proxy/resource/', '');
        decodedImageUrl = `${ZATA_PREFIX}${decodeURIComponent(path)}`;
        console.log('Video generation - converted proxy URL to full Zata URL:', decodedImageUrl);
      }

      console.log('Loading image from URL parameter for video generation:', decodedImageUrl);

      // Set generation mode to image-to-video
      setGenerationMode("image_to_video");

      // Set the image in uploaded images
      setUploadedImages([decodedImageUrl]);

      console.log('Video generation - set mode to image_to_video and loaded image');
    } else {
      console.log('Video generation - no image parameter found');
    }
  }, [searchParams]);

  // UploadModal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<'image' | 'reference' | 'video'>('image');
  const [uploadModalTarget, setUploadModalTarget] = useState<'first_frame' | 'last_frame'>('first_frame');

  // Local image library state for UploadModal (avoids interfering with global Redux history)
  const [libraryImageEntries, setLibraryImageEntries] = useState<any[]>([]);
  const [libraryImageHasMore, setLibraryImageHasMore] = useState<boolean>(true);
  const [libraryImageLoading, setLibraryImageLoading] = useState<boolean>(false);
  const libraryImageNextCursorRef = useRef<string | undefined>(undefined);
  const libraryImageLoadingRef = useRef<boolean>(false);
  const libraryImageInitRef = useRef<boolean>(false);

  // MiniMax specific state - persisted
  const [selectedResolution, setSelectedResolution] = usePersistedGenerationState("selectedResolution", "1080P", "text-to-video");
  const [selectedMiniMaxDuration, setSelectedMiniMaxDuration] = usePersistedGenerationState("selectedMiniMaxDuration", 6, "text-to-video");
  const [resolutionDropdownOpen, setResolutionDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);
  const [cameraMovementPopupOpen, setCameraMovementPopupOpen] = useState(false);
  const [selectedCameraMovements, setSelectedCameraMovements] = usePersistedGenerationState<string[]>("selectedCameraMovements", [], "text-to-video");
  const [lastFrameImage, setLastFrameImage] = usePersistedGenerationState("lastFrameImage", "", "text-to-video"); // For MiniMax-Hailuo-02 last frame
  const [selectedQuality, setSelectedQuality] = usePersistedGenerationState("selectedQuality", "720p", "text-to-video"); // For Veo3 quality
  // Kling specific state (v2.1 mode determines resolution): 'standard'->720p, 'pro'->1080p
  const [klingMode, setKlingMode] = usePersistedGenerationState<'standard' | 'pro'>("klingMode", 'standard', "text-to-video");
  // Seedance specific state
  const [seedanceResolution, setSeedanceResolution] = usePersistedGenerationState("seedanceResolution", "1080p", "text-to-video"); // For Seedance resolution (480p/720p/1080p)
  // PixVerse specific state
  const [pixverseQuality, setPixverseQuality] = usePersistedGenerationState("pixverseQuality", "720p", "text-to-video"); // For PixVerse quality (360p/540p/720p/1080p)
  // WAN 2.2 Animate Replace specific state
  const [wanAnimateResolution, setWanAnimateResolution] = usePersistedGenerationState<"720" | "480">("wanAnimateResolution", "720", "text-to-video"); // For WAN Animate Replace resolution
  const [wanAnimateRefertNum, setWanAnimateRefertNum] = usePersistedGenerationState<1 | 5>("wanAnimateRefertNum", 1, "text-to-video"); // For WAN Animate Replace reference frames
  const [wanAnimateGoFast, setWanAnimateGoFast] = usePersistedGenerationState("wanAnimateGoFast", true, "text-to-video"); // For WAN Animate Replace go_fast
  const [wanAnimateMergeAudio, setWanAnimateMergeAudio] = usePersistedGenerationState("wanAnimateMergeAudio", true, "text-to-video"); // For WAN Animate Replace merge_audio
  const [wanAnimateFps, setWanAnimateFps] = usePersistedGenerationState("wanAnimateFps", 24, "text-to-video"); // For WAN Animate Replace frames_per_second
  const [wanAnimateSeed, setWanAnimateSeed] = usePersistedGenerationState<number | undefined>("wanAnimateSeed", undefined, "text-to-video"); // For WAN Animate Replace seed (optional)
  // LTX and audio controls
  const [fps, setFps] = usePersistedGenerationState<25 | 50>("fps", 25, "text-to-video");
  const [generateAudio, setGenerateAudio] = usePersistedGenerationState("generateAudio", true, "text-to-video");

  // Timeout refs for auto-close dropdowns
  const resolutionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State to trigger closing of models dropdown
  const [closeModelsDropdown, setCloseModelsDropdown] = useState(false);

  // State to trigger closing of frame size dropdown
  const [closeFrameSizeDropdown, setCloseFrameSizeDropdown] = useState(false);

  // State to trigger closing of duration dropdown
  const [closeDurationDropdown, setCloseDurationDropdown] = useState(false);

  // Helpers: clean prompt and copy
  const getCleanPrompt = (text: string): string => {
    try { return (text || '').replace(/\[\s*Style:\s*[^\]]+\]/i, '').trim(); } catch { return text; }
  };
  const copyPrompt = async (e: React.MouseEvent, text: string) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      await navigator.clipboard.writeText(text);
      (await import('react-hot-toast')).default.success('Prompt copied');
    } catch {
      try {
        (await import('react-hot-toast')).default.error('Failed to copy');
      } catch { }
    }
  };

  // Handle manual prompt enhancement
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast('Please enter a prompt to enhance');
      return;
    }

    if (isEnhancing) return;

    try {
      setIsEnhancing(true);
      // Explicitly pass 'video' as media type for video generation
      const res = await enhancePromptAPI(prompt, 'openai/gpt-4o', 'video');
      if (res.ok && res.enhancedPrompt) {
        const enhancedPrompt = res.enhancedPrompt;

        // Update state
        setPrompt(enhancedPrompt);

        // Update textarea directly if ref exists
        if (inputEl.current) {
          inputEl.current.value = enhancedPrompt;
          // Trigger height adjustment
          adjustTextareaHeight(inputEl.current);
        }

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

  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteVideo = async (e: React.MouseEvent, entry: HistoryEntry) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (!window.confirm('Delete this generation permanently? This cannot be undone.')) return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try { dispatch(removeHistoryEntry(entry.id)); } catch { }
      toast.success('Video deleted');
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete generation');
    }
  };

  // Credits management - after all state declarations
  const normalizedSelectedRes = typeof selectedResolution === 'string' ? selectedResolution.toLowerCase() : '1080p';
  const creditsResolution = (
    selectedModel.includes("MiniMax") ? selectedResolution :
      (selectedModel.includes("wan-2.5") ? (frameSize.includes("480") ? "480p" : (frameSize.includes("720") ? "720p" : "1080p")) :
        (selectedModel.startsWith('kling-') ? (klingMode === 'pro' ? '1080p' : '720p') :
          (selectedModel.includes('seedance') ? seedanceResolution :
            (selectedModel.includes('ltx2') ? normalizedSelectedRes :
              (selectedModel.includes('pixverse') ? pixverseQuality : undefined)))))
  );
  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits('video', selectedModel, {
    resolution: creditsResolution,
    duration: selectedModel.includes("MiniMax") ? selectedMiniMaxDuration : duration,
  });

  // Live credit preview for current selections
  const liveCreditCost = useMemo(() => {
    try {
      const dur = selectedModel.includes("MiniMax") ? selectedMiniMaxDuration : duration;
      const res = typeof creditsResolution === 'string' ? creditsResolution : undefined;

      // Normalize Kling 2.1/2.1 Master to i2v variant when in image_to_video mode
      // to ensure credit lookup recognizes the model and avoids warnings.
      const normalizedModelForCredits = (() => {
        if (generationMode === 'image_to_video' && selectedModel.startsWith('kling-') && selectedModel.includes('v2.1')) {
          // Replace t2v suffix with i2v for v2.1 variants
          if (/-t2v$/.test(selectedModel)) {
            return selectedModel.replace(/-t2v$/, '-i2v');
          }
        }
        return selectedModel;
      })();

      return Math.max(0, Number(getVideoCreditCost(normalizedModelForCredits, res, dur)) || 0);
    } catch {
      return 0;
    }
  }, [selectedModel, creditsResolution, duration, selectedMiniMaxDuration, generationMode]);

  // Helper function to determine model capabilities
  const getModelCapabilities = (model: string) => {
    const capabilities = {
      supportsTextToVideo: false,
      supportsImageToVideo: false,
      supportsVideoToVideo: false,
      requiresImage: false,
      requiresFirstFrame: false,
      requiresLastFrame: false,
      requiresReferenceImage: false,
      requiresVideo: false,
    };

    // Models that support both text-to-video and image-to-video
    if (model.includes("veo3.1") && !model.includes("i2v")) {
      // Veo 3.1 supports both T2V and I2V (when not explicitly i2v variant)
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    } else if (model.includes("veo3") && !model.includes("veo3.1") && !model.includes("i2v")) {
      // Veo3 supports both T2V and I2V (when not explicitly i2v variant)
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    } else if (model.includes("wan-2.5") && !model.includes("i2v")) {
      // WAN 2.5 supports both T2V and I2V
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    } else if (model.startsWith('kling-') && model.includes('v2.5')) {
      // Kling 2.5 Turbo Pro supports both T2V and I2V
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    } else if (model.startsWith('kling-') && (model.includes('v2.1') || model.includes('master'))) {
      // Kling 2.1 and 2.1 Master are I2V-only (require start_image)
      capabilities.supportsImageToVideo = true;
      capabilities.requiresImage = true;
    } else if (model === 'gen4_turbo' || model === 'gen3a_turbo') {
      // Gen-4 Turbo and Gen-3a Turbo are I2V-only (require image)
      capabilities.supportsImageToVideo = true;
      capabilities.requiresImage = true;
    } else if (model.includes('seedance') && !model.includes('i2v')) {
      // Seedance supports both T2V and I2V
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    } else if (model.includes('pixverse') && !model.includes('i2v')) {
      // PixVerse supports both T2V and I2V
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    } else if (model.includes('sora2') && !model.includes('i2v') && !model.includes('v2v')) {
      // Sora 2 supports both T2V and I2V
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    } else if (model.includes('ltx2') && !model.includes('i2v')) {
      // LTX V2 supports both T2V and I2V
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
    }

    // Text-to-video only models
    if (model === "T2V-01-Director") {
      capabilities.supportsTextToVideo = true;
    }

    // Image-to-video only models (explicit i2v variants or image-only models)
    if (model === "I2V-01-Director" ||
      model === "S2V-01" ||
      model === "gen4_turbo" ||
      model === "gen3a_turbo" ||
      (model.includes("veo3") && model.includes("i2v")) ||
      (model.includes("wan-2.5") && model.includes("i2v")) ||
      (model.startsWith('kling-') && model.includes('i2v')) ||
      (model.includes('seedance') && model.includes('i2v')) ||
      (model.includes('pixverse') && model.includes('i2v')) ||
      (model.includes('sora2') && model.includes('i2v'))) {
      capabilities.supportsImageToVideo = true;
      capabilities.requiresImage = true;
    }

    // Video-to-video models
    if (model === "kling-lip-sync") {
      capabilities.supportsVideoToVideo = true;
      capabilities.requiresVideo = true;
      capabilities.supportsTextToVideo = false;
      capabilities.supportsImageToVideo = false;
    }
    if (model === "wan-2.2-animate-replace") {
      capabilities.supportsVideoToVideo = true;
      capabilities.requiresVideo = true;
      capabilities.requiresImage = true; // Requires character_image
      capabilities.supportsTextToVideo = false;
      capabilities.supportsImageToVideo = false;
    }
    if (model === "gen4_aleph" || model.includes('sora2-v2v')) {
      capabilities.supportsVideoToVideo = true;
      capabilities.requiresVideo = true;
    }

    // Models that support both text and image
    if (model === "MiniMax-Hailuo-02") {
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
      // Image is optional for text-to-video, required for 512P resolution
    }
    if (model === "MiniMax-Hailuo-2.3") {
      capabilities.supportsTextToVideo = true;
      capabilities.supportsImageToVideo = true;
      // Image is optional for text-to-video
    }
    if (model === "MiniMax-Hailuo-2.3-Fast") {
      capabilities.supportsImageToVideo = true;
      capabilities.requiresImage = true;
      // Fast model is I2V only, requires first_frame_image
      capabilities.requiresFirstFrame = true;
    }

    // Specific requirements
    if (model === "I2V-01-Director") {
      capabilities.requiresFirstFrame = true;
    }
    if (model === "S2V-01") {
      capabilities.requiresReferenceImage = true;
    }

    return capabilities;
  };

  // Memoize current model capabilities to prevent recalculations during render
  const currentModelCapabilities = useMemo(() => {
    const caps = getModelCapabilities(selectedModel);
    // MiniMax-Hailuo-02 requires first frame for 512P resolution
    if (selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P") {
      caps.requiresFirstFrame = true;
    }
    // MiniMax-Hailuo-2.3-Fast always requires first frame (I2V only)
    if (selectedModel === "MiniMax-Hailuo-2.3-Fast") {
      caps.requiresFirstFrame = true;
    }
    return caps;
  }, [selectedModel, selectedResolution]);

  // Extract primitive values for stable dependencies
  const supportsTextToVideo = currentModelCapabilities.supportsTextToVideo;
  const supportsImageToVideo = currentModelCapabilities.supportsImageToVideo;
  const supportsVideoToVideo = currentModelCapabilities.supportsVideoToVideo;

  // Memoize the computed mode to prevent unnecessary recalculations
  const computedMode = useMemo(() => {
    if (supportsVideoToVideo && uploadedVideo) {
      return "video_to_video";
    } else if (supportsImageToVideo && (uploadedImages.length > 0 || references.length > 0)) {
      return "image_to_video";
    } else if (supportsTextToVideo) {
      return "text_to_video";
    } else if (supportsImageToVideo) {
      return "image_to_video";
    } else if (supportsVideoToVideo) {
      return "video_to_video";
    }
    return null;
  }, [supportsTextToVideo, supportsImageToVideo, supportsVideoToVideo, uploadedImages.length, references.length, uploadedVideo]);

  // Auto-determine generation mode based on model selection only (not content changes to prevent loops)
  // Only update generation mode when model changes, not when content is uploaded
  const prevModelForModeRef = useRef(selectedModel);
  useEffect(() => {
    // Only run if model actually changed
    if (prevModelForModeRef.current === selectedModel) {
      return;
    }
    prevModelForModeRef.current = selectedModel;

    const caps = getModelCapabilities(selectedModel);

    // Determine appropriate generation mode based on model capabilities only
    let newMode: "text_to_video" | "image_to_video" | "video_to_video" | null = null;

    // Special handling for I2V-only models - they require image (Kling 2.1, Gen-4 Turbo, Gen-3a Turbo)
    if ((selectedModel.startsWith('kling-') && (selectedModel.includes('v2.1') || selectedModel.includes('master'))) ||
      selectedModel === 'gen4_turbo' || selectedModel === 'gen3a_turbo') {
      // These models require image, so force image-to-video mode
      newMode = "image_to_video";
    } else if (caps.supportsTextToVideo) {
      // Prefer text-to-video if model supports it (most models do)
      newMode = "text_to_video";
    } else if (caps.supportsImageToVideo) {
      newMode = "image_to_video";
    } else if (caps.supportsVideoToVideo) {
      newMode = "video_to_video";
    }

    // Only update if mode actually changed
    if (newMode) {
      setGenerationMode(prevMode => {
        if (newMode !== prevMode) {
          console.log(`🔄 Mode changed from ${prevMode} to ${newMode} for model ${selectedModel}`);
          return newMode;
        }
        return prevMode;
      });
    }
  }, [selectedModel]);

  // Hide uploaded video when leaving Gen-4 Aleph, and restore when returning
  useEffect(() => {
    const isAleph = selectedModel === 'gen4_aleph';
    if (isAleph) {
      // Restore if we have a backup and nothing currently shown
      if (!uploadedVideo && alephVideoBackup) {
        setUploadedVideo(alephVideoBackup);
      }
    } else {
      // If a video is currently uploaded under Aleph, back it up and hide
      if (uploadedVideo) {
        setAlephVideoBackup(uploadedVideo);
        setUploadedVideo("");
      }
    }
  }, [selectedModel]);

  // Auto-convert LTX V2, WAN 2.5, and Kling models between t2v and i2v variants when switching modes
  useEffect(() => {
    // Convert LTX V2 models
    if (selectedModel.includes('ltx2')) {
      const isI2V = selectedModel.includes('i2v');
      const isPro = selectedModel.includes('pro');
      const isFast = selectedModel.includes('fast');

      if (generationMode === 'text_to_video' && isI2V) {
        // Switch from i2v to t2v variant
        const newModel = isPro ? 'ltx2-pro-t2v' : (isFast ? 'ltx2-fast-t2v' : 'ltx2-pro-t2v');
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      } else if (generationMode === 'image_to_video' && !isI2V) {
        // Switch from t2v to i2v variant
        const newModel = isPro ? 'ltx2-pro-i2v' : (isFast ? 'ltx2-fast-i2v' : 'ltx2-pro-i2v');
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      }
    }

    // Convert WAN 2.5 models
    if (selectedModel.includes('wan-2.5') && !selectedModel.includes('v2v')) {
      const isI2V = selectedModel.includes('i2v');
      const isFast = selectedModel.includes('fast');

      if (generationMode === 'text_to_video' && isI2V) {
        // Switch from i2v to t2v variant
        const newModel = isFast ? 'wan-2.5-t2v-fast' : 'wan-2.5-t2v';
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      } else if (generationMode === 'image_to_video' && !isI2V) {
        // Switch from t2v to i2v variant
        const newModel = isFast ? 'wan-2.5-i2v-fast' : 'wan-2.5-i2v';
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      }
    }

    // Convert Kling models (except v2.5 which supports both without conversion)
    if (selectedModel.startsWith('kling-') && !selectedModel.includes('v2.5')) {
      const isI2V = selectedModel.includes('i2v');
      const isV21 = selectedModel.includes('v2.1');
      const isMaster = selectedModel.includes('master');

      // Kling 2.1 and 2.1 Master require image (I2V only), so always use i2v variant
      if (isV21 && !isI2V) {
        // Switch from t2v to i2v variant for v2.1 models
        const newModel = isMaster ? 'kling-v2.1-master-i2v' : 'kling-v2.1-i2v';
        if (newModel !== selectedModel) {
          console.log('🔄 Auto-converting Kling 2.1 from T2V to I2V variant:', newModel);
          setSelectedModel(newModel);
        }
      } else if (generationMode === 'text_to_video' && isI2V && isV21) {
        // If somehow in T2V mode with I2V variant, this shouldn't happen for v2.1, but handle it
        // Actually, v2.1 can't do T2V, so don't convert back
      } else if (generationMode === 'image_to_video' && !isI2V && isV21) {
        // Ensure v2.1 uses i2v variant in image-to-video mode
        const newModel = isMaster ? 'kling-v2.1-master-i2v' : 'kling-v2.1-i2v';
        if (newModel !== selectedModel) {
          console.log('🔄 Auto-converting Kling 2.1 to I2V variant for image-to-video mode:', newModel);
          setSelectedModel(newModel);
        }
      }
    }
  }, [generationMode, selectedModel]);

  // Clear camera movements when model changes (separate effect to avoid loop)
  useEffect(() => {
    setSelectedCameraMovements([]);
  }, [selectedModel]);


  // Reset fps/audio defaults when model changes
  useEffect(() => {
    if (selectedModel.includes('ltx2')) {
      setFps(25);
      setGenerateAudio(true);
    } else if (selectedModel.includes('veo3')) {
      // Veo 3 and 3.1 support generate_audio, keep fps unused
      setGenerateAudio(true);
    } else if (selectedModel.includes('sora2')) {
      setGenerateAudio(true);
    }
  }, [selectedModel]);

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
    } else if (selectedModel === "MiniMax-Hailuo-2.3" || selectedModel === "MiniMax-Hailuo-2.3-Fast") {
      // MiniMax-Hailuo-2.3: Set default resolution based on duration (768P/1080P only, no 512P)
      // 1080P only supports 6s, so if duration is 10s, force 768P
      if (selectedMiniMaxDuration === 10) {
        setSelectedResolution("768P"); // 10s only supports 768P
      } else if (selectedMiniMaxDuration === 6) {
        // Keep current resolution if it's valid (768P or 1080P), otherwise default to 768P
        if (selectedResolution !== "768P" && selectedResolution !== "1080P") {
          setSelectedResolution("768P"); // Default for 6s
        }
      }
    }
  }, [selectedModel, selectedMiniMaxDuration]);

  // Auto-adjust resolution when switching to text-to-video mode (512P not supported)
  // Use ref to track previous generationMode to prevent loops
  const prevGenerationModeRef = useRef(generationMode);
  useEffect(() => {
    // Only run if generationMode actually changed
    if (prevGenerationModeRef.current === generationMode) {
      return;
    }
    prevGenerationModeRef.current = generationMode;

    // Only adjust if switching to text-to-video and resolution is 512P (not supported for Hailuo 2.3)
    if (generationMode === "text_to_video" && (selectedModel === "MiniMax-Hailuo-02" || selectedModel === "MiniMax-Hailuo-2.3")) {
      setSelectedResolution(prev => {
        if (prev === "512P") {
          return "768P"; // Switch to 768P for text-to-video (512P not supported for 2.3)
        }
        return prev; // Keep current resolution if not 512P
      });
    }
  }, [generationMode, selectedModel]); // Removed selectedResolution from deps to prevent loop

  // Auto-adjust resolution when duration changes for MiniMax models
  // Only update if resolution actually needs to change to prevent loops
  useEffect(() => {
    if ((selectedModel === "MiniMax-Hailuo-02" || selectedModel === "MiniMax-Hailuo-2.3" || selectedModel === "MiniMax-Hailuo-2.3-Fast") && selectedMiniMaxDuration === 10) {
      setSelectedResolution(prev => prev === "1080P" ? "768P" : prev); // Only update if still 1080P (1080P only supports 6s)
    }
  }, [selectedMiniMaxDuration, selectedModel]); // Removed selectedResolution from deps to prevent loop

  // Reset controls when switching between MiniMax and Runway models
  // Use ref to track previous model to prevent unnecessary updates
  const prevModelForResetRef = useRef(selectedModel);
  useEffect(() => {
    // Only run if model actually changed
    if (prevModelForResetRef.current === selectedModel) {
      return;
    }
    prevModelForResetRef.current = selectedModel;

    if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
      // Reset Runway-specific controls when switching to MiniMax
      // Note: MiniMax models don't support custom aspect ratios - they use fixed resolutions
      setFrameSize("16:9"); // Default aspect ratio (not used for MiniMax)
      setDuration(5); // Default duration (not used for MiniMax)

      // Set appropriate MiniMax defaults based on model
      if (selectedModel === "MiniMax-Hailuo-02") {
        setSelectedResolution(prev => prev !== "1080P" ? "1080P" : prev);
        setSelectedMiniMaxDuration(6);
      } else if (selectedModel === "MiniMax-Hailuo-2.3" || selectedModel === "MiniMax-Hailuo-2.3-Fast") {
        // Hailuo 2.3: Default to 768P (no 512P support)
        setSelectedResolution(prev => (prev !== "768P" && prev !== "1080P") ? "768P" : prev);
        setSelectedMiniMaxDuration(6);
        // Clear last_frame_image as these models don't support it
        if (lastFrameImage) {
          setLastFrameImage("");
        }
      } else {
        // T2V-01, I2V-01, S2V-01 have fixed settings
        setSelectedResolution(prev => prev !== "720P" ? "720P" : prev);
        setSelectedMiniMaxDuration(6);
      }
    } else {
      // Reset MiniMax-specific controls when switching to Runway
      setSelectedResolution(prev => prev !== "1080P" ? "1080P" : prev); // Only update if different
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

  // Auto-close resolution dropdown after 5 seconds
  useEffect(() => {
    if (resolutionDropdownOpen) {
      // Clear any existing timeout
      if (resolutionTimeoutRef.current) {
        clearTimeout(resolutionTimeoutRef.current);
      }

      // Set new timeout for 5 seconds
      resolutionTimeoutRef.current = setTimeout(() => {
        setResolutionDropdownOpen(false);
      }, 5000);
    } else {
      // Clear timeout if dropdown is closed
      if (resolutionTimeoutRef.current) {
        clearTimeout(resolutionTimeoutRef.current);
        resolutionTimeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (resolutionTimeoutRef.current) {
        clearTimeout(resolutionTimeoutRef.current);
      }
    };
  }, [resolutionDropdownOpen]);

  // Auto-close duration dropdown after 5 seconds
  useEffect(() => {
    if (durationDropdownOpen) {
      // Clear any existing timeout
      if (durationTimeoutRef.current) {
        clearTimeout(durationTimeoutRef.current);
      }

      // Set new timeout for 5 seconds
      durationTimeoutRef.current = setTimeout(() => {
        setDurationDropdownOpen(false);
      }, 5000);
    } else {
      // Clear timeout if dropdown is closed
      if (durationTimeoutRef.current) {
        clearTimeout(durationTimeoutRef.current);
        durationTimeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (durationTimeoutRef.current) {
        clearTimeout(durationTimeoutRef.current);
      }
    };
  }, [durationDropdownOpen]);

  // Handle model change with validation
  const handleModelChange = (newModel: string) => {
    console.log('🔄 Model change requested:');
    console.log('🔄 - From:', selectedModel);
    console.log('🔄 - To:', newModel);
    console.log('🔄 - Generation mode:', generationMode);

    // Determine desired generation mode for the requested model so we can
    // automatically switch modes when the user selects a model that requires
    // a different mode (e.g., selecting a T2V model while in video_to_video).
    const desiredMode: "text_to_video" | "image_to_video" | "video_to_video" = ((): "text_to_video" | "image_to_video" | "video_to_video" => {
      if (newModel === 'gen4_aleph' || newModel.includes('v2v') || newModel.includes('remix')) return 'video_to_video';
      // I2V / image→video candidates
      // MiniMax-Hailuo-2.3-Fast is I2V only, others can do both T2V and I2V
      if (newModel === 'I2V-01-Director' || newModel === 'S2V-01' || newModel === 'MiniMax-Hailuo-2.3-Fast' || (newModel.includes('MiniMax') && newModel !== 'MiniMax-Hailuo-02' && newModel !== 'MiniMax-Hailuo-2.3') || newModel.startsWith('kling-') || newModel.includes('veo3') || newModel.includes('ltx2') || newModel === 'gen4_turbo' || newModel === 'gen3a_turbo') return 'image_to_video';
      // Default to text→video for other models
      return 'text_to_video';
    })();

    const mode = desiredMode;
    if (desiredMode !== generationMode) {
      // Switch generation mode to the desired one so downstream logic and UI
      // reflect the user's intent.
      setGenerationMode(desiredMode);
    }

    // Validate that the selected model is compatible with the current generation mode
    if (desiredMode === "text_to_video") {
      // Text→Video: MiniMax, Veo3, Veo 3.1, WAN, Kling (except v2.1/master), Seedance, PixVerse, Sora 2, and LTX models support this
      // Note: gen4_turbo, gen3a_turbo, MiniMax-Hailuo-2.3-Fast, and Kling 2.1/master are I2V-only and will auto-switch to image-to-video mode
      if (newModel === "MiniMax-Hailuo-02" || newModel === "MiniMax-Hailuo-2.3" || newModel === "T2V-01-Director" || newModel.includes("veo3") || newModel.includes("wan-2.5") || (newModel.startsWith('kling-') && !newModel.includes('v2.1') && !newModel.includes('master')) || newModel.includes('seedance') || newModel.includes('pixverse') || newModel.includes('sora2') || newModel.includes('ltx2')) {
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
        } else if (newModel === "MiniMax-Hailuo-2.3" || newModel === "MiniMax-Hailuo-2.3-Fast") {
          // MiniMax-Hailuo-2.3: Set default resolution and duration (768P/1080P only, no 512P)
          setSelectedMiniMaxDuration(6); // Default duration
          setSelectedResolution("768P"); // Default resolution for 6s
        } else if (newModel.includes("veo3.1")) {
          // Veo 3.1 models: Set default duration and frame size
          setDuration(8); // Default 8s for Veo 3.1
          setFrameSize("16:9"); // Default aspect ratio
          setSelectedQuality("720p"); // Default quality
        } else if (newModel.includes("veo3") && !newModel.includes("veo3.1")) {
          // Veo3 models: Set default duration and frame size
          setDuration(8); // Default 8s for Veo3
          setFrameSize("16:9"); // Default aspect ratio
          setSelectedQuality("720p"); // Default quality
        } else if (newModel.includes("wan-2.5")) {
          // WAN 2.5 models: Set default duration and frame size
          setDuration(5); // Default 5s for WAN
          setFrameSize("1280*720"); // Default 720p for WAN
          // Keep audio if switching between WAN models
        } else if (newModel.startsWith('kling-')) {
          // Kling models: duration default 5s; aspect via frame dropdown not used (we use separate aspect for kling)
          setDuration(5);
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes('seedance')) {
          // Seedance models: duration default 5s, resolution default 1080p, aspect ratio default 16:9
          setDuration(5);
          setSeedanceResolution("1080p");
          setFrameSize("16:9"); // For T2V aspect ratio
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes('pixverse')) {
          // PixVerse models: duration default 5s, quality default 720p, aspect ratio default 16:9
          setDuration(5);
          setPixverseQuality("720p");
          setFrameSize("16:9");
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes('sora2')) {
          // Sora 2 models: duration default 8s, aspect ratio default 16:9, quality default 720p (or 1080p for Pro)
          setDuration(8); // Default 8s for Sora 2
          setFrameSize("16:9"); // Default aspect ratio
          setSelectedQuality(newModel.includes('pro') ? "1080p" : "720p"); // Pro defaults to 1080p, Standard to 720p
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes('ltx2')) {
          // LTX V2 T2V: default resolution 1080p, duration 6s, 16:9 fixed
          setDuration(6);
          setFrameSize("16:9");
          setSelectedResolution("1080p" as any);
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else {
          // Clear audio when switching away from WAN models to any other model
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        }
        // Clear camera movements when switching models
        setSelectedCameraMovements([]);
      } else if (newModel === "gen4_turbo" || newModel === "gen3a_turbo") {
        // Gen-4 Turbo and Gen-3a Turbo are I2V-only, so switch to image-to-video mode
        setGenerationMode("image_to_video");
        setSelectedModel(newModel);
        setDuration(5);
        setFrameSize("16:9");
        setSelectedCameraMovements([]);
      } else if (newModel === "I2V-01-Director" || newModel === "S2V-01") {
        // I2V-01-Director and S2V-01 are I2V-only, so switch to image-to-video mode
        setGenerationMode("image_to_video");
        setSelectedModel(newModel);
        setSelectedResolution("720P");
        setSelectedMiniMaxDuration(6);
        setFrameSize("16:9");
        setSelectedCameraMovements([]);
      } else {
        // Model not supported for text-to-video
        console.warn(`Model ${newModel} cannot be used for text-to-video generation`);
        return; // Don't change the model
      }
    } else if (desiredMode === "image_to_video") {
      // Image→Video: gen4_turbo, gen3a_turbo, MiniMax-Hailuo-02, MiniMax-Hailuo-2.3, MiniMax-Hailuo-2.3-Fast, I2V-01-Director, S2V-01, Veo3, Veo 3.1, WAN, Kling, Seedance, PixVerse, Sora 2
      if (newModel === "gen4_turbo" || newModel === "gen3a_turbo" || newModel === "MiniMax-Hailuo-02" || newModel === "MiniMax-Hailuo-2.3" || newModel === "MiniMax-Hailuo-2.3-Fast" || newModel === "I2V-01-Director" || newModel === "S2V-01" || newModel.includes("veo3") || newModel.includes("wan-2.5") || newModel.startsWith('kling-') || newModel.includes('seedance') || newModel.includes('pixverse') || newModel.includes('sora2') || newModel.includes('ltx2')) {
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
        } else if (newModel === "MiniMax-Hailuo-2.3" || newModel === "MiniMax-Hailuo-2.3-Fast") {
          // MiniMax-Hailuo-2.3: Set default resolution and duration (768P/1080P only, no 512P)
          setSelectedMiniMaxDuration(6); // Default duration
          setSelectedResolution("768P"); // Default resolution for 6s
        } else if (newModel.includes("veo3.1")) {
          // Veo 3.1 models: Set default duration and frame size
          if (generationMode === "image_to_video") {
            setDuration(8); // Veo 3.1 I2V only supports 8s
            setFrameSize("auto"); // Default to auto for Veo 3.1 I2V
          } else {
            setDuration(8); // Default 8s for Veo 3.1 T2V
            setFrameSize("16:9"); // Default aspect ratio for Veo 3.1 T2V
          }
          setSelectedQuality("720p"); // Default quality
        } else if (newModel.includes("veo3") && !newModel.includes("veo3.1")) {
          // Veo3 models: Set default duration and frame size
          if (generationMode === "image_to_video") {
            setDuration(8); // Veo3 I2V only supports 8s
            setFrameSize("auto"); // Default to auto for Veo3 I2V
          } else {
            setDuration(8); // Default 8s for Veo3 T2V
            setFrameSize("16:9"); // Default aspect ratio for Veo3 T2V
          }
          setSelectedQuality("720p"); // Default quality
        } else if (newModel.includes("wan-2.5")) {
          // WAN 2.5 models: Set default duration and frame size
          setDuration(5); // Default 5s for WAN
          setFrameSize("1280*720"); // Default 720p for WAN
          // Keep audio if switching between WAN models
        } else if (newModel.startsWith('kling-')) {
          setDuration(5);
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel === "gen4_turbo" || newModel === "gen3a_turbo") {
          // Gen-4 Turbo and Gen-3a Turbo: default duration 5s (only supports 5s and 10s)
          setDuration(5);
          setFrameSize("16:9");
        } else if (newModel.includes('seedance')) {
          // Seedance models: duration default 5s, resolution default 1080p
          setDuration(5);
          setSeedanceResolution("1080p");
          // Note: aspect_ratio is ignored for I2V, but we still set it for consistency
          setFrameSize("16:9");
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes('pixverse')) {
          // PixVerse models: duration default 5s, quality default 720p
          setDuration(5);
          setPixverseQuality("720p");
          setFrameSize("16:9");
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes('sora2')) {
          // Sora 2 models: duration default 8s, aspect ratio default auto (for I2V) or 16:9 (for T2V), quality default 720p (or 1080p for Pro)
          if (generationMode === "image_to_video") {
            setDuration(8); // Sora 2 I2V supports 4s/8s/12s
            setFrameSize("auto"); // Default to auto for Sora 2 I2V
          } else {
            setDuration(8); // Default 8s for Sora 2 T2V
            setFrameSize("16:9"); // Default aspect ratio for Sora 2 T2V
          }
          setSelectedQuality(newModel.includes('pro') ? "1080p" : "720p"); // Pro defaults to 1080p, Standard to 720p
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes('ltx2')) {
          // LTX V2 I2V: default resolution 1080p, duration 6s, aspect ratio 16:9 (can change)
          setDuration(6);
          setFrameSize("16:9");
          setSelectedResolution("1080p" as any);
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else {
          // Clear audio when switching away from WAN models to any other model
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        }
        // Clear camera movements when switching models
        setSelectedCameraMovements([]);
      }
    } else if (desiredMode === "video_to_video") {
      // Video→Video: Runway and Sora 2 models support this
      if (newModel === "gen4_aleph" || newModel.includes('sora2-v2v')) {
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

    // Also get entries that have videos array with video URLs
    const videosArrayTypes = allEntries.filter((entry: any) =>
      entry.videos && Array.isArray(entry.videos) && entry.videos.some((v: any) => isVideoUrl(v?.firebaseUrl || v?.url || v?.originalUrl))
    );

    // Merge all sets, removing duplicates by ID
    const byId: Record<string, any> = {};
    [...declaredVideoTypes, ...urlVideoTypes, ...videosArrayTypes].forEach((e: any) => {
      byId[e.id] = e;
    });

    const mergedEntries = Object.values(byId);

    // Debug: Log all video entries and specifically animate entries
    const animateEntries = mergedEntries.filter((e: any) => {
      const model = String(e?.model || '').toLowerCase();
      return model.includes('wan-2.2-animate') || model.includes('wan-video/wan-2.2-animate');
    });
    if (animateEntries.length > 0) {
      console.log('[InputBox] ✅ Found animate entries in video history:', animateEntries.length, animateEntries.map((e: any) => ({
        id: e.id,
        model: e.model,
        generationType: e.generationType,
        status: e.status
      })));
    }

    // Debug: Log video-to-video entries to ensure they're being included
    const videoToVideoEntries = mergedEntries.filter((e: any) => {
      const normalizedType = normalizeGenerationType(e?.generationType);
      return normalizedType === 'video-to-video';
    });
    const videoToVideoInAll = allEntries.filter((e: any) => {
      const normalizedType = normalizeGenerationType(e?.generationType);
      return normalizedType === 'video-to-video';
    });
    console.log('[InputBox] Video-to-video entries:', {
      inAllEntries: videoToVideoInAll.length,
      inMergedEntries: videoToVideoEntries.length,
      sample: videoToVideoInAll.slice(0, 2).map((e: any) => ({
        id: e.id,
        model: e.model,
        generationType: e.generationType,
        hasImages: !!(e.images?.length),
        hasVideos: !!(e.videos?.length)
      }))
    });

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

    // Debug: Log history totals to diagnose missing entries
    console.log('[InputBox] History totals:', {
      all: allEntries.length,
      textToVideo: countsAll['text-to-video'] || 0,
      imageToVideo: countsAll['image-to-video'] || 0,
      videoToVideo: countsAll['video-to-video'] || 0,
      filtered: mergedEntries.length,
      declaredVideoTypes: declaredVideoTypes.length,
      urlVideoTypes: urlVideoTypes.length,
      videosArrayTypes: videosArrayTypes.length,
      rawGenerationTypes,
      normalizedCounts: countsAll,
    });

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

  // Get image history entries for image upload modal
  const imageHistoryEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];

    // Filter for text-to-image entries (same as image generation component)
    const filteredEntries = allEntries.filter((entry: any) =>
      entry.generationType === 'text-to-image'
    );

    // Debug: Log image entries for troubleshooting
    console.log('[VideoPage] Image history entries:', {
      total: filteredEntries.length,
      allEntries: allEntries.length,
      entries: filteredEntries.slice(0, 3).map((entry: any) => ({
        id: entry.id,
        generationType: entry.generationType,
        images: entry.images?.length || 0,
        timestamp: entry.timestamp
      }))
    });

    return filteredEntries;
  }, shallowEqual);

  // Fetch user's text-to-image history for the UploadModal when needed (local pagination/state)
  const fetchLibraryImages = useCallback(async (initial: boolean = false) => {
    try {
      // Use ref to check loading state to avoid stale closure issues
      if (libraryImageLoadingRef.current) {
        console.log('[VideoPage] fetchLibraryImages: Already loading, skipping');
        return;
      }
      // For non-initial loads, check if we have a cursor (hasMore) and modal is open
      if (!initial) {
        if (!libraryImageNextCursorRef.current) {
          console.log('[VideoPage] fetchLibraryImages: No nextCursor, no more items');
          setLibraryImageHasMore(false);
          return;
        }
        if (!isUploadModalOpen) {
          console.log('[VideoPage] fetchLibraryImages: Modal not open, skipping');
          return;
        }
      }
      libraryImageLoadingRef.current = true;
      setLibraryImageLoading(true);
      const api = getApiClient();
      const params: any = { generationType: 'text-to-image', limit: 30, sortBy: 'createdAt' };
      // For pagination, use the cursor from the previous response
      // IMPORTANT: Read cursor from ref at the time of request to ensure we have the latest value
      const currentCursor = libraryImageNextCursorRef.current;
      if (!initial && currentCursor) {
        // Backend expects `nextCursor` for pagination; using `cursor` causes first page to repeat
        params.nextCursor = currentCursor;
        console.log('[VideoPage] 🔄 Pagination request with cursor:', {
          cursor: currentCursor,
          cursorType: typeof currentCursor,
          cursorLength: String(currentCursor).length,
          isInitial: initial,
          currentEntriesCount: libraryImageEntries.length
        });
      } else if (initial) {
        // Ensure no cursor is sent for initial load
        console.log('[VideoPage] 🆕 Initial load (no cursor)', {
          currentCursor: currentCursor ? 'present but ignored' : 'none',
          currentEntriesCount: libraryImageEntries.length
        });
      } else {
        console.warn('[VideoPage] ⚠️ Pagination requested but no cursor available!', {
          currentCursor,
          hasMore: libraryImageHasMore,
          currentEntriesCount: libraryImageEntries.length
        });
      }
      // Ensure createdAt ordering always requested
      params.sortBy = 'createdAt';
      const res = await api.get('/api/generations', { params });
      const payload = res.data?.data || res.data || {};
      const items: any[] = Array.isArray(payload.items) ? payload.items : [];
      const nextCursor: string | number | undefined = payload.nextCursor;

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
        // Ensure images is always an array (even if empty) - don't filter out items
        // The UploadModal will handle empty arrays gracefully
        if (!Array.isArray(normalized.images)) {
          normalized.images = [];
        }

        // Ensure each image has required properties
        if (Array.isArray(normalized.images)) {
          normalized.images = normalized.images.map((img: any) => {
            if (typeof img === 'string') {
              // If image is just a URL string, convert to object
              return { url: img, id: img };
            }
            return img;
          });
        }

        return normalized;
      });

      console.log('[VideoPage] fetchLibraryImages API response:', {
        payloadKeys: Object.keys(payload),
        itemsCount: items.length,
        normalizedItemsCount: normalizedItems.length,
        itemsSample: normalizedItems.slice(0, 2).map((item: any) => ({
          id: item.id,
          generationType: item.generationType,
          imagesCount: item.images?.length || 0,
          hasImagesArray: Array.isArray(item.images),
          images: item.images?.slice(0, 1).map((img: any) => ({
            id: img.id,
            url: img.url?.substring(0, 50) + '...',
            thumbnailUrl: img.thumbnailUrl ? 'present' : 'missing',
            avifUrl: img.avifUrl ? 'present' : 'missing'
          }))
        })),
        nextCursor: nextCursor ? 'present' : 'null'
      });

      // Merge uniquely by id using functional update to avoid stale closure
      // Always create a new array reference to ensure React detects the change
      setLibraryImageEntries((prevEntries) => {
        // If this is an initial load, replace all entries (don't merge with old data)
        if (initial) {
          console.log('[VideoPage] fetchLibraryImages initial load - replacing all entries');
          const sorted = normalizedItems.sort((a: any, b: any) => {
            const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
            const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
            return timeB - timeA; // Descending (newest first)
          });
          console.log('[VideoPage] fetchLibraryImages initial load result:', {
            itemsCount: normalizedItems.length,
            sortedCount: sorted.length,
            sample: sorted.slice(0, 2).map((e: any) => ({
              id: e.id,
              generationType: e.generationType,
              imagesCount: e.images?.length || 0,
              hasImages: Array.isArray(e.images) && e.images.length > 0
            }))
          });
          // Always return a new array reference
          return [...sorted];
        }

        // For pagination loads, merge with existing entries
        // IMPORTANT: Check if items are actually new by comparing IDs
        const existingIds = new Set(prevEntries.map((e: any) => e?.id).filter(Boolean));
        const newItems = normalizedItems.filter((item: any) => item?.id && !existingIds.has(item.id));
        const existingItems = normalizedItems.filter((item: any) => item?.id && existingIds.has(item.id));

        console.log('[VideoPage] fetchLibraryImages pagination merge:', {
          previousCount: prevEntries.length,
          newItemsReceived: normalizedItems.length,
          actuallyNew: newItems.length,
          duplicates: existingItems.length,
          newItemIds: newItems.slice(0, 5).map((e: any) => e.id),
          newItemsWithImages: newItems.filter((e: any) => Array.isArray(e.images) && e.images.length > 0).length
        });

        if (newItems.length === 0) {
          console.warn('[VideoPage] ⚠️ ALL ITEMS ARE DUPLICATES! API is returning same items. Cursor might not be working.');
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

        console.log('[VideoPage] fetchLibraryImages after merge:', {
          previousCount: prevEntries.length,
          newItemsCount: normalizedItems.length,
          newItemsAdded: newItems.length,
          mergedCount: merged.length,
          mergedEntriesWithImages: merged.filter((e: any) => Array.isArray(e.images) && e.images.length > 0).length,
          mergedSample: merged.slice(0, 3).map((e: any) => ({
            id: e.id,
            generationType: e.generationType,
            imagesCount: e.images?.length || 0,
            hasImages: Array.isArray(e.images) && e.images.length > 0,
            firstImageUrl: e.images?.[0]?.url?.substring(0, 50) + '...',
            firstImageThumbnail: e.images?.[0]?.thumbnailUrl ? 'present' : 'missing'
          }))
        });

        // Always return a new array reference (even if contents are the same)
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
      console.log('[VideoPage] 📥 Cursor updated in ref:', {
        previousCursor: previousCursor ? `${String(previousCursor).substring(0, 20)}...` : 'none',
        newCursor: newCursor ? `${String(newCursor).substring(0, 20)}...` : 'none',
        cursorChanged: previousCursor !== newCursor,
        itemsReceived: items.length
      });

      // Set hasMore: if there's a nextCursor, we definitely have more items to load
      // The presence of nextCursor is the definitive indicator from the backend
      const hasMoreItems = Boolean(nextCursor);

      console.log('[VideoPage] 📥 fetchLibraryImages response received:', {
        itemsCount: items.length,
        requested: params.limit || 30,
        previousCursor: previousCursor ? `${String(previousCursor).substring(0, 20)}...` : 'none',
        newCursor: newCursor ? `${String(newCursor).substring(0, 20)}...` : 'null',
        newCursorType: typeof nextCursor,
        newCursorFull: newCursor,
        cursorChanged: previousCursor !== newCursor,
        hasMoreItems,
        currentEntriesCount: libraryImageEntries.length
      });

      // If cursor didn't change and we got items, it means we're getting duplicates
      if (!initial && previousCursor === newCursor && items.length > 0) {
        console.warn('[VideoPage] ⚠️ WARNING: Cursor did not change but got items! API might be returning same page.');
      }

      setLibraryImageHasMore(hasMoreItems);
    } catch (e) {
      console.error('[VideoPage] Failed to fetch library images:', e);
    } finally {
      libraryImageLoadingRef.current = false;
      setLibraryImageLoading(false);
    }
  }, [isUploadModalOpen]);

  // Debug: Log when libraryImageEntries changes to verify state updates
  useEffect(() => {
    if (isUploadModalOpen) {
      console.log('[VideoPage] libraryImageEntries state updated:', {
        count: libraryImageEntries.length,
        sampleEntries: libraryImageEntries.slice(0, 3).map((e: any) => ({
          id: e.id,
          generationType: e.generationType,
          imagesCount: e.images?.length || 0,
          hasImages: Array.isArray(e.images) && e.images.length > 0,
          firstImage: e.images?.[0] ? {
            id: e.images[0].id,
            url: e.images[0].url?.substring(0, 50) + '...',
            thumbnailUrl: e.images[0].thumbnailUrl ? 'present' : 'missing'
          } : null
        })),
        allEntriesWithImages: libraryImageEntries.filter((e: any) => Array.isArray(e.images) && e.images.length > 0).length
      });
    }
  }, [libraryImageEntries, isUploadModalOpen]);

  // When opening the UploadModal for images/references, ensure initial image library is loaded
  // IMPORTANT: Always fetch fresh data when modal opens to show newly generated images
  // Load ALL images by fetching pages until there's no more cursor (like image generation)
  useEffect(() => {
    const needsLibrary = isUploadModalOpen && (uploadModalType === 'image' || uploadModalType === 'reference');
    if (needsLibrary) {
      // Reset pagination state when opening modal to ensure fresh load
      libraryImageNextCursorRef.current = undefined;
      libraryImageLoadingRef.current = false; // Reset loading ref
      setLibraryImageHasMore(true);
      setLibraryImageEntries([]); // Clear previous entries for fresh load
      setLibraryImageLoading(false); // Ensure loading state is reset

      // Only load the first page when modal opens - pagination will happen on scroll
      const fetchPromise = fetchLibraryImages(true);
      fetchPromise
        .then(() => {
          console.log('[VideoPage] ✅ Successfully fetched initial library images');
        })
        .catch((error) => {
          console.error('[VideoPage] ❌ Error fetching library images:', error);
          libraryImageLoadingRef.current = false;
          setLibraryImageLoading(false);
        });
    } else {
      // When modal closes, reset the guard so it can fetch fresh next time
      libraryImageInitRef.current = false;
    }
    // Deliberately not depending on fetchLibraryImages or entries length to avoid re-running
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploadModalOpen, uploadModalType]);

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

  // Track which videos have loaded to hide loading effects
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());

  // Track entries that have been added to history to prevent duplicate rendering
  const historyEntryIdsRef = useRef<Set<string>>(new Set());

  // Get current entries from Redux
  const existingEntries = useAppSelector((state: any) => state.history?.entries || []);

  useEffect(() => {
    if (!localVideoPreview) return;

    // Check if this entry already exists in Redux history
    const entryId = localVideoPreview.id;
    const entryFirebaseId = (localVideoPreview as any)?.firebaseHistoryId;

    // FIRST: Check ref (updated immediately when entry is added to history)
    const existsInRef = (entryId && historyEntryIdsRef.current.has(entryId)) ||
      (entryFirebaseId && historyEntryIdsRef.current.has(entryFirebaseId));

    // SECOND: Check Redux state
    const existsInHistory = existingEntries.some((e: HistoryEntry) => {
      const eId = e.id;
      const eFirebaseId = (e as any)?.firebaseHistoryId;
      if (entryId && (eId === entryId || eFirebaseId === entryId)) return true;
      if (entryFirebaseId && (eId === entryFirebaseId || eFirebaseId === entryFirebaseId)) return true;
      return false;
    });

    // CRITICAL: If entry exists in ref OR history, immediately clear local preview
    if (existsInRef || existsInHistory) {
      setLocalVideoPreview(null);
      return;
    }

    // If entry completes/fails but not in history yet, clear after delay
    if (localVideoPreview.status === 'completed' || localVideoPreview.status === 'failed') {
      const t = setTimeout(() => setLocalVideoPreview(null), 1500);
      return () => clearTimeout(t);
    }
  }, [localVideoPreview, existingEntries]);

  // Function to fetch and add/update a single generation instead of reloading all
  const refreshSingleGeneration = async (historyId: string) => {
    try {
      const client = axiosInstance;
      const res = await client.get(`/api/generations/${historyId}`);
      const item = res.data?.data?.item;
      if (!item) {
        console.warn('[refreshSingleGeneration] Generation not found, falling back to full refresh');
        dispatch(loadHistory({
          filters: { mode: 'video' } as any,
          paginationParams: { limit: 50 },
          requestOrigin: 'page',
          expectedType: 'text-to-video',
          debugTag: `InputBox:refresh:video-mode:${Date.now()}`
        } as any));
        return;
      }

      // Normalize the item to match HistoryEntry format
      const created = item?.createdAt || item?.updatedAt || item?.timestamp;
      const iso = typeof created === 'string' ? created : (created && created.toString ? created.toString() : new Date().toISOString());
      const normalizedEntry: HistoryEntry = {
        ...item,
        id: item.id || historyId,
        timestamp: iso,
        createdAt: iso,
      } as HistoryEntry;

      // Check if entry already exists in current Redux state
      const exists = existingEntries.some((e: HistoryEntry) => e.id === historyId);

      // CRITICAL: Track this entry ID in ref IMMEDIATELY before adding to Redux
      historyEntryIdsRef.current.add(historyId);
      if (normalizedEntry.id) historyEntryIdsRef.current.add(normalizedEntry.id);
      if ((normalizedEntry as any)?.firebaseHistoryId) {
        historyEntryIdsRef.current.add((normalizedEntry as any).firebaseHistoryId);
      }

      if (exists) {
        dispatch(updateHistoryEntry({
          id: historyId,
          updates: {
            status: normalizedEntry.status,
            images: normalizedEntry.images,
            videos: normalizedEntry.videos,
            timestamp: normalizedEntry.timestamp,
          }
        }));
      } else {
        dispatch(addHistoryEntry(normalizedEntry));
      }

      // CRITICAL: Immediately clear local preview when history entry is added/updated
      setLocalVideoPreview((prev) => {
        if (!prev) return null;

        const prevId = prev.id;
        const prevFirebaseId = (prev as any)?.firebaseHistoryId;

        // Check if IDs match
        if (prevId === historyId || prevFirebaseId === historyId) return null;
        if (normalizedEntry.id && (prevId === normalizedEntry.id || prevFirebaseId === normalizedEntry.id)) return null;
        const normalizedFirebaseId = (normalizedEntry as any)?.firebaseHistoryId;
        if (normalizedFirebaseId && (prevId === normalizedFirebaseId || prevFirebaseId === normalizedFirebaseId)) return null;

        // If local preview is completed and we just added a completed history entry, clear it
        if (prev.status === 'completed' && normalizedEntry.status === 'completed') return null;

        return prev;
      });
    } catch (error) {
      console.error('[refreshSingleGeneration] Failed to fetch single generation, falling back to full refresh:', error);
      dispatch(loadHistory({
        filters: { mode: 'video' } as any,
        paginationParams: { limit: 50 },
        requestOrigin: 'page',
        expectedType: 'text-to-video',
        debugTag: `InputBox:refresh:video-mode:${Date.now()}`
      } as any));
    }
  };

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

  // Initial history is loaded centrally by PageRouter. This component only manages pagination.
  // However, if central load doesn't run (e.g., direct navigation), trigger an initial page-origin load for videos.
  const didInitialLoadRef = useRef(false);
  // Use mode: 'video' to load ALL video types at once (same as History.tsx)
  // This ensures we get text-to-video, image-to-video, AND video-to-video (including animate entries)
  useEffect(() => {
    if (didInitialLoadRef.current) return;
    // Load all video types using mode: 'video' (backend handles this correctly)
    didInitialLoadRef.current = true;
    try {
      // Use mode: 'video' which backend converts to ['text-to-video', 'image-to-video', 'video-to-video']
      // This is the same approach History.tsx uses and ensures all video types are loaded
      dispatch(loadHistory({
        filters: { mode: 'video' } as any,
        paginationParams: { limit: 50 },
        requestOrigin: 'page',
        expectedType: 'text-to-video',
        debugTag: `InputBox:video-mode:${Date.now()}`
      } as any));
    } catch (e) {
      // swallow
    }
  }, [dispatch]);

  // Mark user scroll inside the scrollable history container
  useEffect(() => {
    const container = historyScrollElement;
    if (!container) return;
    const onScroll = () => { hasUserScrolledRef.current = true; };
    container.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => { container.removeEventListener('scroll', onScroll as any); };
  }, [historyScrollElement]);

  // Standardized intersection observer for video history
  // Replace IntersectionObserver with History-style bottom scroll pagination
  useBottomScrollPagination({
    containerRef: historyScrollElement ? { current: historyScrollElement } as any : undefined,
    hasMore,
    loading,
    requireUserScroll: true,
    bottomOffset: 800,
    throttleMs: 200,
    loadMore: async () => {
      const nextPage = page + 1;
      setPage(nextPage);
      try {
        // Use mode: 'video' which backend converts to all video types including video-to-video
        await (dispatch as any)(loadMoreHistory({ filters: { mode: 'video' } as any, paginationParams: { limit: 10 } })).unwrap();
      } catch {/* swallow */ }
    }
  });

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

  // Handle image/video upload from UploadModal
  const handleImageUploadFromModal = (urls: string[], entries?: any[]) => {
    if (uploadModalType === 'image') {
      if (uploadModalTarget === 'last_frame') {
        setLastFrameImage(urls[0] || "");
      } else {
        // For WAN 2.2 Animate Replace, set character image instead of uploaded images
        if (selectedModel === "wan-2.2-animate-replace" || (activeFeature === 'Animate' && selectedModel.includes("wan-2.2"))) {
          setUploadedCharacterImage(urls[0] || "");
        } else {
          // Replace existing images instead of appending
          setUploadedImages(urls);
        }
      }
    } else if (uploadModalType === 'reference') {
      setReferences(prev => [...prev, ...urls]);
    } else if (uploadModalType === 'video') {
      setUploadedVideo(urls[0] || "");
      // For Sora 2 Remix, use the entry ID from the modal if provided
      if (urls[0] && selectedModel.includes('sora2-v2v')) {
        if (entries && entries.length > 0 && entries[0]?.id) {
          // Use the entry ID directly from the modal
          setSourceHistoryEntryId(entries[0].id);
        } else {
          // Fallback: Try to find the matching history entry by URL
          const matchingEntry = historyEntries.find((entry: any) => {
            const entryVideos = entry?.images || [];
            return entryVideos.some((img: any) =>
              img?.url === urls[0] || img?.firebaseUrl === urls[0] || img?.originalUrl === urls[0]
            );
          });
          if (matchingEntry?.id) {
            setSourceHistoryEntryId(matchingEntry.id);
          }
        }
      }
    }
    setIsUploadModalOpen(false);
  };

  // Handle image upload (legacy - keeping for compatibility)
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    let firstImageUrl: string | null = null;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setUploadedImages(prev => [...prev, result]);

            // Store the first image URL for aspect ratio detection
            if (!firstImageUrl) {
              firstImageUrl = result;
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });


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

  // Handle audio upload for WAN models
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    // Validate file type and size (wav/mp3, ≤15MB, 3-30s)
    const allowedMimes = new Set([
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mpeg3',
      'audio/x-mpeg-3',
    ]);

    const maxBytes = 15 * 1024 * 1024; // 15MB max
    if (!allowedMimes.has(file.type) && !file.name.match(/\.(wav|mp3)$/i)) {
      toast.error('Unsupported audio type. Use WAV or MP3 format');
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      toast.error('Audio file too large. Please upload an audio file ≤ 15MB');
      event.target.value = '';
      return;
    }

    if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3)$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setUploadedAudio(result);
          toast.success('Audio file uploaded successfully');
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
  };

  // Handle character image upload for WAN 2.2 Animate Replace
  const handleCharacterImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    // Validate file type and size
    const allowedMimes = new Set([
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ]);

    const maxBytes = 10 * 1024 * 1024; // 10MB max
    if (!allowedMimes.has(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      toast.error('Unsupported image type. Use JPG, PNG, or WebP format');
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      toast.error('Image file too large. Please upload an image ≤ 10MB');
      event.target.value = '';
      return;
    }

    if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setUploadedCharacterImage(result);
          toast.success('Character image uploaded successfully');
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = '';
  };

  // Helper function to get the prompt for API (with hardcoded prefix for Lipsync)
  const getApiPrompt = (originalPrompt: string): string => {
    // For Lipsync feature with uploaded image, add hardcoded prefix
    if (activeFeature === 'Lipsync' && uploadedImages.length > 0) {
      return `The model or person in the uploaded image will speak this: ${originalPrompt}`;
    }
    return originalPrompt;
  };

  // Clear all inputs and configurations after successful generation
  // DISABLED: User wants to preserve all inputs after generation
  const clearInputs = () => {
    // PRESERVE INPUTS: All inputs are now preserved after generation
    // Users can continue generating with the same settings or modify them as needed
    // No clearing of prompt, uploaded assets, or configurations
    return;

    // OLD CODE (disabled):
    // setPrompt("");
    // setUploadedImages([]);
    // setUploadedVideo("");
    // setUploadedAudio("");
    // setUploadedCharacterImage("");
    // setSourceHistoryEntryId("");
    // setReferences([]);
    // setLastFrameImage("");
    // setGenerationMode("text_to_video");
    // setSelectedModel("seedance-1.0-lite-t2v");
    // setFrameSize("16:9");
    // setDuration(6);
    // setSelectedResolution("1080P");
    // setSelectedMiniMaxDuration(6);
    // setSelectedQuality("720p");
    // setKlingMode('standard');
    // setSeedanceResolution("1080p");
    // setPixverseQuality("720p");
    // setWanAnimateResolution("720");
    // setWanAnimateRefertNum(1);
    // setWanAnimateGoFast(true);
    // setWanAnimateMergeAudio(true);
    // setWanAnimateFps(24);
    // setWanAnimateSeed(undefined);
    // setFps(25);
    // setGenerateAudio(true);
    // setSelectedCameraMovements([]);
    // setError("");
  };

  // Handle video generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    // Validate prompt for profanity before proceeding
    try {
      const { validatePrompt } = await import('@/utils/profanityFilter');
      const profanityCheck = validatePrompt(prompt.trim());
      if (!profanityCheck.isValid) {
        toast.error(profanityCheck.error || 'Your prompt contains inappropriate language. Please revise and try again.', { duration: 5000 });
        return;
      }
    } catch (error) {
      console.error('Error validating prompt:', error);
      // Continue if validation fails (non-blocking)
    }

    console.log('🚀 Starting video generation with:');
    console.log('🚀 - Selected model:', selectedModel);
    console.log('🚀 - Generation mode:', generationMode);
    console.log('🚀 - Is MiniMax model?', selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01");
    console.log('🚀 - Is Runway model?', !(selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01"));

    // Get current model capabilities
    const caps = currentModelCapabilities;

    // Validate I2V-only models require image (Kling 2.1, Gen-4 Turbo, Gen-3a Turbo)
    if ((selectedModel.startsWith('kling-') && (selectedModel.includes('v2.1') || selectedModel.includes('master'))) ||
      selectedModel === 'gen4_turbo' || selectedModel === 'gen3a_turbo') {
      if (uploadedImages.length === 0 && references.length === 0) {
        // Get model display name
        let modelName = '';
        if (selectedModel.startsWith('kling-')) {
          if (selectedModel.includes('master')) {
            modelName = 'Kling 2.1 Master';
          } else if (selectedModel.includes('v2.1')) {
            modelName = 'Kling 2.1';
          }
        } else if (selectedModel === 'gen4_turbo') {
          modelName = 'Gen-4 Turbo';
        } else if (selectedModel === 'gen3a_turbo') {
          modelName = 'Gen-3a Turbo';
        }
        // Show toast with custom styling
        toast.error(
          <div className="flex items-start gap-3">
            {/* <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg> */}
            <div>
              <p className="font-semibold text-white">{modelName} needs one image as input to generate video.</p>
              <p className="text-sm text-white/70 mt-1">Please upload an image to continue.</p>
            </div>
          </div>,
          {
            duration: 8000, // 8 seconds
            style: {
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              backdropFilter: 'blur(10px)',
            },
          } as any
        );
        setIsGenerating(false);
        return;
      }
    }

    // Validate model requirements
    // Check if model requires image (like Runway models)
    // Note: I2V-only models (Kling 2.1, Gen-4 Turbo, Gen-3a Turbo) are already handled above
    if (caps.requiresImage && uploadedImages.length === 0 && references.length === 0) {
      if (selectedModel === "S2V-01") {
        // Show toast with custom styling for S2V-01
        toast.error(
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold text-white">S2V-01 needs one image as input to generate video.</p>
              <p className="text-sm text-white/70 mt-1">Please upload a character reference image to continue.</p>
            </div>
          </div>,
          {
            duration: 8000, // 8 seconds
            style: {
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              backdropFilter: 'blur(10px)',
            },
          } as any
        );
      } else if (selectedModel === "I2V-01-Director") {
        // Show toast with custom styling for I2V-01-Director
        toast.error(
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold text-white">I2V-01-Director needs one image as input to generate video.</p>
              <p className="text-sm text-white/70 mt-1">Please upload a first frame image to continue.</p>
            </div>
          </div>,
          {
            duration: 8000, // 8 seconds
            style: {
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              backdropFilter: 'blur(10px)',
            },
          } as any
        );
      } else if (selectedModel.includes("veo3.1") && selectedModel.includes("i2v")) {
        toast.error('An input image is required to use Veo 3.1 image-to-video model. Please upload an image.');
      } else if (selectedModel.includes("veo3") && selectedModel.includes("i2v")) {
        toast.error('An input image is required to use Veo 3 image-to-video model. Please upload an image.');
      } else if (selectedModel.includes("wan-2.5") && selectedModel.includes("i2v")) {
        toast.error('An input image is required to use WAN 2.5 image-to-video model. Please upload an image.');
      } else if (selectedModel.startsWith('kling-') && selectedModel.includes('i2v')) {
        toast.error('An input image is required to use Kling image-to-video model. Please upload an image.');
      } else if (selectedModel.includes('seedance') && selectedModel.includes('i2v')) {
        toast.error('An input image is required to use Seedance image-to-video model. Please upload an image.');
      } else if (selectedModel.includes('pixverse') && selectedModel.includes('i2v')) {
        toast.error('An input image is required to use PixVerse image-to-video model. Please upload an image.');
      } else if (selectedModel.includes('sora2') && selectedModel.includes('i2v')) {
        toast.error('An input image is required to use Sora 2 image-to-video model. Please upload an image.');
      } else if (selectedModel === "gen4_turbo" || selectedModel === "gen3a_turbo") {
        toast.error('An input image is required to use this Runway model. Please upload an image.');
      } else {
        toast.error('An input image is required to use this model. Please upload an image.');
      }
      return;
    }

    if (caps.requiresReferenceImage && references.length === 0) {
      toast.error('A reference image is required to use this model. Please upload a character reference image.');
      return;
    }

    if (caps.requiresVideo && !uploadedVideo) {
      toast.error('A source video is required to use this model. Please upload a video.');
      return;
    }

    // Validate model compatibility with generation mode
    if (generationMode === "text_to_video" && !caps.supportsTextToVideo) {
      toast.error('This model does not support text-to-video generation. An input image is required. Please upload an image or select a different model.');
      return;
    }

    setIsGenerating(true);
    setError("");
    clearCreditsError();

    // Validate and reserve credits before generation
    let transactionId: string;
    try {
      const provider = selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01" ? 'minimax' :
        (selectedModel.includes("veo3") || selectedModel.includes('sora2') || selectedModel.includes('ltx2')) ? 'fal' :
          (selectedModel.includes("wan-2.5") || selectedModel.startsWith('kling-') || selectedModel.includes('seedance') || selectedModel.includes('pixverse')) ? 'replicate' : 'runway';
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
      // Resolve isPublic from backend policy so completed videos appear in the public feed when enabled
      const { getIsPublic } = await import('@/lib/publicFlag');
      const isPublic = await getIsPublic();
      let requestBody;
      let generationType: string;
      let apiEndpoint: string;

      // Auto-determine mode based on model capabilities and user input
      // Priority: If image is uploaded and model supports I2V, use I2V
      // If only text is provided and model supports T2V, use T2V
      let actualGenerationMode = generationMode;

      const hasImage = uploadedImages.length > 0 || references.length > 0;
      const hasText = prompt.trim().length > 0;

      // Smart mode detection:
      // 1. If image is uploaded and model supports I2V -> use I2V
      // 2. If only text and model supports T2V -> use T2V
      // 3. If model only supports I2V (like Runway) -> use I2V (will validate image requirement)
      // 4. If model supports both -> choose based on input

      if (hasImage && caps.supportsImageToVideo) {
        // Image uploaded and model supports I2V -> use image-to-video
        actualGenerationMode = "image_to_video";
        console.log('🖼️ Image detected, switching to image-to-video mode');
      } else if (hasText && !hasImage && caps.supportsTextToVideo) {
        // Only text provided and model supports T2V -> use text-to-video
        // But check if model requires image (like Kling 2.1)
        if (caps.requiresImage && !caps.supportsTextToVideo) {
          // Model requires image but user only provided text
          toast.error('This model requires an input image. Please upload an image to use this model.');
          setIsGenerating(false);
          return;
        }
        actualGenerationMode = "text_to_video";
        console.log('📝 Text only, using text-to-video mode');
      } else if (caps.supportsTextToVideo && caps.supportsImageToVideo) {
        // Model supports both - check if image is uploaded
        if (hasImage) {
          actualGenerationMode = "image_to_video";
          console.log('🖼️ Model supports both, image provided -> using image-to-video');
        } else {
          actualGenerationMode = "text_to_video";
          console.log('📝 Model supports both, no image -> using text-to-video');
        }
      } else if (caps.supportsImageToVideo && !caps.supportsTextToVideo) {
        // Model only supports I2V (like Runway models: gen4_turbo, gen3a_turbo)
        actualGenerationMode = "image_to_video";
        console.log('🎬 Model only supports I2V -> using image-to-video mode');
        // Image requirement will be validated below
      }

      if (actualGenerationMode === "text_to_video") {
        // Text to video generation (MiniMax, Veo3, and WAN models)
        if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director") {
          // Text-to-video: No image requirements (pure text generation)

          requestBody = {
            model: selectedModel,
            prompt: prompt,
            // MiniMax models: Include duration and resolution only (no images for text-to-video)
            ...((selectedModel === "MiniMax-Hailuo-02" || selectedModel === "MiniMax-Hailuo-2.3") && {
              duration: selectedMiniMaxDuration,
              resolution: selectedResolution
            }),
            generationType: "text-to-video",
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = '/api/minimax/video';
        } else if (selectedModel.includes("veo3.1") && !selectedModel.includes("i2v")) {
          // Veo 3.1 text-to-video generation (only if not i2v variant)
          const isFast = selectedModel.includes("fast");
          const modelDuration = duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            aspect_ratio: frameSize === "16:9" ? "16:9" : frameSize === "9:16" ? "9:16" : "1:1",
            duration: modelDuration,
            resolution: selectedQuality, // Use selected quality (720p or 1080p)
            generate_audio: true,
            auto_fix: true,
            isPublic
          };
          generationType = "text-to-video";
          apiEndpoint = isFast ? '/api/fal/veo3_1/text-to-video/fast/submit' : '/api/fal/veo3_1/text-to-video/submit';
        } else if (selectedModel.includes("veo3") && !selectedModel.includes("veo3.1") && !selectedModel.includes("i2v")) {
          // Veo3 text-to-video generation
          const isFast = selectedModel.includes("fast");
          const modelDuration = duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            aspect_ratio: frameSize === "16:9" ? "16:9" : frameSize === "9:16" ? "9:16" : "1:1",
            duration: modelDuration,
            resolution: selectedQuality, // Use selected quality
            generate_audio: true,
            auto_fix: true,
            isPublic
          };
          generationType = "text-to-video";
          apiEndpoint = isFast ? '/api/fal/veo3/text-to-video/fast/submit' : '/api/fal/veo3/text-to-video/submit';
        } else if (selectedModel.includes("wan-2.5") && !selectedModel.includes("i2v")) {
          // WAN 2.5 text-to-video generation (only if not i2v variant)
          const isFast = selectedModel.includes("fast");
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: isFast ? "wan-video/wan-2.5-t2v-fast" : "wan-video/wan-2.5-t2v",
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            duration: duration, // 5 or 10 seconds
            size: frameSize, // WAN uses specific size format like "1280*720"
            ...(uploadedAudio && { audio: uploadedAudio }), // Include audio if uploaded
            generationType: "text-to-video",
            isPublic,
          };
          generationType = "text-to-video";
          // Use fast alias route when selected fast model
          apiEndpoint = isFast ? '/api/replicate/wan-2-5-t2v/fast/submit' : '/api/replicate/wan-2-5-t2v/submit';
        } else if (selectedModel.startsWith('kling-') && !selectedModel.includes('i2v')) {
          // Kling T2V - only v2.5-turbo-pro supports pure T2V
          // Kling v2.1 and v2.1-master require start_image (I2V only)
          const isV25 = selectedModel.includes('v2.5');
          const isV21 = selectedModel.includes('v2.1');

          if (isV21) {
            // Kling 2.1 and 2.1 Master require an image (start_image is required)
            toast.error('Kling 2.1 and Kling 2.1 Master require an input image. Please upload an image to use these models.');
            setIsGenerating(false);
            return;
          }

          // Only v2.5 supports pure T2V
          if (!isV25) {
            toast.error('This Kling model requires an input image. Please upload an image or select Kling 2.5 Turbo Pro for text-to-video.');
            setIsGenerating(false);
            return;
          }

          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: 'kwaivgi/kling-v2.5-turbo-pro',
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            duration,
            aspect_ratio: frameSize === '9:16' ? '9:16' : (frameSize === '1:1' ? '1:1' : '16:9'),
            generationType: 'text-to-video',
            isPublic
          };
          generationType = 'text-to-video';
          apiEndpoint = '/api/replicate/kling-t2v/submit';
        } else if (selectedModel.includes('seedance') && !selectedModel.includes('i2v')) {
          // Seedance T2V
          const isLite = selectedModel.includes('lite');
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: isLite ? 'bytedance/seedance-1-lite' : 'bytedance/seedance-1-pro',
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            duration,
            resolution: seedanceResolution,
            aspect_ratio: frameSize, // Seedance supports multiple aspect ratios for T2V
            generationType: 'text-to-video',
            isPublic,
          };
          generationType = 'text-to-video';
          apiEndpoint = '/api/replicate/seedance-t2v/submit';
        } else if (selectedModel.includes('pixverse') && !selectedModel.includes('i2v')) {
          // PixVerse T2V
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: 'pixverse/pixverse-v5',
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            duration,
            quality: pixverseQuality,
            aspect_ratio: frameSize, // PixVerse supports 16:9, 9:16, 1:1
            generationType: 'text-to-video',
            isPublic,
          };
          generationType = 'text-to-video';
          apiEndpoint = '/api/replicate/pixverse-v5-t2v/submit';
        } else if (selectedModel.includes('sora2') && !selectedModel.includes('i2v') && !selectedModel.includes('v2v')) {
          // Sora 2 T2V
          const isPro = selectedModel.includes('pro');
          const apiPrompt = getApiPrompt(prompt);

          // Ensure duration is a number and one of [4, 8, 12]
          let soraDuration = duration;
          if (typeof duration !== 'number') {
            soraDuration = parseInt(String(duration), 10) || 8;
          }
          // Clamp to valid values: 4, 8, or 12
          if (![4, 8, 12].includes(soraDuration)) {
            // Round to nearest valid value
            if (soraDuration < 6) soraDuration = 4;
            else if (soraDuration < 10) soraDuration = 8;
            else soraDuration = 12;
          }

          // Ensure resolution is valid
          let soraResolution = selectedQuality || '720p';
          if (isPro) {
            // Pro supports 720p or 1080p
            if (soraResolution !== '720p' && soraResolution !== '1080p') {
              soraResolution = '1080p'; // Default to 1080p for Pro
            }
          } else {
            // Standard only supports 720p
            soraResolution = '720p';
          }

          // Ensure aspect_ratio is valid
          const soraAspectRatio = frameSize === "16:9" ? "16:9" : (frameSize === "9:16" ? "9:16" : "16:9");

          // Sora 2 supports generate_audio parameter
          requestBody = {
            prompt: apiPrompt,
            resolution: soraResolution,
            aspect_ratio: soraAspectRatio,
            duration: soraDuration,
            generate_audio: generateAudio,
            originalPrompt: prompt, // Backend uses this for history display
            isPublic, // Backend uses this for history
          };
          generationType = 'text-to-video';
          apiEndpoint = isPro ? '/api/fal/sora2/text-to-video/pro/submit' : '/api/fal/sora2/text-to-video/submit';
        } else if (selectedModel.includes('ltx2') && !selectedModel.includes('i2v')) {
          // LTX V2 Text-to-Video (Pro/Fast)
          const isPro = selectedModel.includes('pro');
          const normalizedRes = (selectedResolution || '1080p').toLowerCase();
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            resolution: normalizedRes,
            aspect_ratio: '16:9',
            duration,
            fps: fps,
            generate_audio: generateAudio,
            generationType: 'text-to-video',
            isPublic,
          } as any;
          generationType = 'text-to-video';
          apiEndpoint = isPro ? '/api/fal/ltx2/text-to-video/pro/submit' : '/api/fal/ltx2/text-to-video/fast/submit';
        } else {
          // Runway models don't support text-to-video (they require an image)
          setError("Runway models don't support text-to-video generation. Please use Image→Video mode or select a MiniMax/Veo3/Veo 3.1/WAN/Kling/Seedance/PixVerse/Sora 2 model.");
          return;
        }
      } else if (actualGenerationMode === "image_to_video") {
        // Check if we need uploaded images
        // S2V-01 uses references, others need uploadedImages
        const needsImage = selectedModel !== "S2V-01" &&
          !selectedModel.includes("veo3") &&
          !selectedModel.includes("wan-2.5") &&
          !selectedModel.includes('seedance') &&
          !selectedModel.includes('pixverse') &&
          !selectedModel.includes('sora2') &&
          !selectedModel.includes('ltx2') &&
          !selectedModel.includes('kling-');

        if (needsImage && uploadedImages.length === 0) {
          setError("Please upload at least one image");
          return;
        }

        // Validation: Ensure image is provided for I2V mode
        // This should have been caught by mode detection, but double-check for safety
        if (uploadedImages.length === 0 && references.length === 0) {
          // If model supports both, we could fall back to T2V, but for I2V-only models we must error
          if (!caps.supportsTextToVideo) {
            setError("An input image is required for image-to-video generation with this model");
            return;
          } else {
            // Model supports both but no image - should not happen due to mode detection, but handle gracefully
            console.warn('⚠️ Image-to-video mode selected but no image provided, this should not happen');
            setError("Please upload an image for image-to-video generation, or switch to text-to-video mode");
            return;
          }
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

          // MiniMax-Hailuo-2.3-Fast: Always requires first_frame_image (I2V only)
          if (selectedModel === "MiniMax-Hailuo-2.3-Fast" && uploadedImages.length === 0) {
            setError("MiniMax-Hailuo-2.3-Fast requires a first frame image");
            return;
          }

          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: selectedModel,
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
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
            // MiniMax-Hailuo-2.3: Include duration and resolution, first_frame_image only (no last_frame_image support)
            ...((selectedModel === "MiniMax-Hailuo-2.3" || selectedModel === "MiniMax-Hailuo-2.3-Fast") && {
              duration: selectedMiniMaxDuration,
              resolution: selectedResolution,
              // first_frame_image is required for Fast model, optional for standard 2.3
              // Note: These models do NOT support last_frame_image (First-and-Last-Frame-Video mode)
              ...(uploadedImages.length > 0 && {
                first_frame_image: uploadedImages[0]
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
            generationType: "image-to-video",
            isPublic,
          };
          generationType = "image-to-video";
          apiEndpoint = '/api/minimax/video';
        } else if (selectedModel.includes("veo3.1") && (selectedModel.includes("i2v") || uploadedImages.length > 0 || references.length > 0)) {
          // Veo 3.1 image-to-video generation (i2v variant or when image is uploaded)
          if (uploadedImages.length === 0 && references.length === 0) {
            setError("Veo 3.1 image-to-video requires an input image");
            return;
          }
          const isFast = selectedModel.includes("fast");
          // Use uploaded image or reference image
          const imageUrl = uploadedImages.length > 0 ? uploadedImages[0] : references[0];
          const apiPrompt = getApiPrompt(prompt);
          const modelDuration = duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image_url: imageUrl, // Veo 3.1 expects a single image URL
            aspect_ratio: frameSize === "16:9" ? "16:9" : frameSize === "9:16" ? "9:16" : "auto",
            duration: modelDuration, // Use selected duration (4s, 6s, or 8s)
            resolution: selectedQuality, // Use selected quality (720p or 1080p)
            generate_audio: true,
            isPublic
          };
          generationType = "image-to-video";
          apiEndpoint = isFast ? '/api/fal/veo3_1/image-to-video/fast/submit' : '/api/fal/veo3_1/image-to-video/submit';
        } else if (selectedModel.includes("veo3") && !selectedModel.includes("veo3.1") && (selectedModel.includes("i2v") || uploadedImages.length > 0 || references.length > 0)) {
          // Veo3 image-to-video generation (i2v variant or when image is uploaded)
          if (uploadedImages.length === 0 && references.length === 0) {
            setError("Veo3 image-to-video requires an input image");
            return;
          }
          const isFast = selectedModel.includes("fast");
          const apiPrompt = getApiPrompt(prompt);
          const modelDuration = duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image_url: uploadedImages[0], // Veo3 expects a single image URL
            aspect_ratio: frameSize === "16:9" ? "16:9" : frameSize === "9:16" ? "9:16" : "auto",
            duration: modelDuration, // Use selected duration (4s, 6s, or 8s)
            resolution: selectedQuality, // Use selected quality
            generate_audio: true,
            isPublic
          };
          generationType = "image-to-video";
          apiEndpoint = isFast ? '/api/fal/veo3/image-to-video/fast/submit' : '/api/fal/veo3/image-to-video/submit';
        } else if (selectedModel.includes("wan-2.5")) {
          // WAN 2.5 image-to-video generation
          if (uploadedImages.length === 0) {
            setError("WAN 2.5 image-to-video requires an input image");
            return;
          }
          const isFast = selectedModel.includes("fast");
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: isFast ? "wan-video/wan-2.5-i2v-fast" : "wan-video/wan-2.5-i2v",
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image: uploadedImages[0], // WAN expects image URL
            duration: duration, // 5 or 10 seconds
            resolution: frameSize.includes("480") ? "480p" : frameSize.includes("720") ? "720p" : "1080p",
            ...(uploadedAudio && { audio: uploadedAudio }), // Include audio if uploaded
            generationType: "image-to-video",
            isPublic,
          };
          generationType = "image-to-video";
          // Use fast alias route when selected fast model
          apiEndpoint = isFast ? '/api/replicate/wan-2-5-i2v/fast/submit' : '/api/replicate/wan-2-5-i2v/submit';
        } else if (selectedModel.startsWith('kling-')) {
          // Kling I2V - supports both t2v and i2v variants, use I2V when image is uploaded
          // Kling v2.1 and v2.1-master REQUIRE start_image (cannot do pure T2V)
          if (uploadedImages.length === 0) {
            const isV21 = selectedModel.includes('v2.1');
            if (isV21) {
              toast.error('Kling 2.1 and Kling 2.1 Master require an input image. Please upload an image to use these models.');
            } else {
              toast.error('Kling image-to-video requires an input image. Please upload an image.');
            }
            setIsGenerating(false);
            return;
          }
          const isV25 = selectedModel.includes('v2.5');
          if (isV25) {
            // Kling 2.5 Turbo Pro - uses 'image' parameter for I2V
            const apiPrompt = getApiPrompt(prompt);
            requestBody = {
              model: 'kwaivgi/kling-v2.5-turbo-pro',
              prompt: apiPrompt,
              originalPrompt: prompt, // Store original prompt for display
              image: uploadedImages[0],
              duration,
              aspect_ratio: frameSize === '9:16' ? '9:16' : (frameSize === '1:1' ? '1:1' : '16:9'),
              generationType: 'image-to-video',
              isPublic
            };
          } else {
            // Kling v2.1 and v2.1-master - use 'start_image' parameter (required)
            const isMaster = selectedModel.includes('master');
            const modelName = isMaster ? 'kwaivgi/kling-v2.1-master' : 'kwaivgi/kling-v2.1';
            const apiPrompt = getApiPrompt(prompt);
            requestBody = {
              model: modelName,
              prompt: apiPrompt,
              originalPrompt: prompt, // Store original prompt for display
              start_image: uploadedImages[0], // Required for v2.1
              duration,
              aspect_ratio: frameSize === '9:16' ? '9:16' : (frameSize === '1:1' ? '1:1' : '16:9'),
              mode: isMaster ? undefined : klingMode, // Only send mode for base v2.1, not master
              generationType: 'image-to-video',
              isPublic
            };
          }
          generationType = 'image-to-video';
          apiEndpoint = '/api/replicate/kling-i2v/submit';
        } else if (selectedModel.includes('seedance')) {
          // Seedance I2V - supports both t2v and i2v variants, use I2V when image is uploaded
          if (uploadedImages.length === 0) {
            setError("Seedance image-to-video requires an input image");
            return;
          }
          const isLite = selectedModel.includes('lite');
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: isLite ? 'bytedance/seedance-1-lite' : 'bytedance/seedance-1-pro',
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image: uploadedImages[0],
            duration,
            resolution: seedanceResolution,
            // aspect_ratio is ignored for I2V, but we can include it for consistency
            generationType: 'image-to-video',
            isPublic,
            // Optional: Add last_frame_image if provided (similar to MiniMax)
            ...(lastFrameImage && lastFrameImage.trim() !== '' ? { last_frame_image: lastFrameImage } : {}),
          } as any;
          generationType = 'image-to-video';
          apiEndpoint = '/api/replicate/seedance-i2v/submit';
        } else if (selectedModel.includes('pixverse')) {
          // PixVerse I2V - supports both t2v and i2v variants, use I2V when image is uploaded
          if (uploadedImages.length === 0) {
            setError("PixVerse image-to-video requires an input image");
            return;
          }
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: 'pixverse/pixverse-v5',
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image: uploadedImages[0],
            duration,
            quality: pixverseQuality,
            aspect_ratio: frameSize, // PixVerse supports 16:9, 9:16, 1:1
            generationType: 'image-to-video',
            isPublic,
          };
          generationType = 'image-to-video';
          apiEndpoint = '/api/replicate/pixverse-v5-i2v/submit';
        } else if (selectedModel.includes('sora2') && !selectedModel.includes('v2v')) {
          // Sora 2 I2V - supports both t2v and i2v variants, use I2V when image is uploaded
          if (uploadedImages.length === 0) {
            setError("Sora 2 image-to-video requires an input image");
            return;
          }
          const isPro = selectedModel.includes('pro');
          const apiPrompt = getApiPrompt(prompt);

          // Ensure duration is a number and one of [4, 8, 12]
          let soraDuration = duration;
          if (typeof duration !== 'number') {
            soraDuration = parseInt(String(duration), 10) || 8;
          }
          // Clamp to valid values: 4, 8, or 12
          if (![4, 8, 12].includes(soraDuration)) {
            // Round to nearest valid value
            if (soraDuration < 6) soraDuration = 4;
            else if (soraDuration < 10) soraDuration = 8;
            else soraDuration = 12;
          }

          // Ensure resolution is valid for I2V
          let soraResolution = selectedQuality || 'auto';
          if (isPro) {
            // Pro supports auto, 720p, or 1080p
            if (soraResolution !== 'auto' && soraResolution !== '720p' && soraResolution !== '1080p') {
              soraResolution = 'auto'; // Default to auto for Pro I2V
            }
          } else {
            // Standard supports auto or 720p
            if (soraResolution !== 'auto' && soraResolution !== '720p') {
              soraResolution = 'auto'; // Default to auto for Standard I2V
            }
          }

          // Ensure aspect_ratio is valid
          let soraAspectRatio = frameSize === "16:9" ? "16:9" : (frameSize === "9:16" ? "9:16" : "auto");

          requestBody = {
            prompt: apiPrompt,
            image_url: uploadedImages[0], // Sora 2 expects image_url
            resolution: soraResolution,
            aspect_ratio: soraAspectRatio,
            duration: soraDuration,
            generate_audio: generateAudio,
            originalPrompt: prompt, // Backend uses this for history display
            isPublic, // Backend uses this for history
          };
          generationType = 'image-to-video';
          apiEndpoint = isPro ? '/api/fal/sora2/image-to-video/pro/submit' : '/api/fal/sora2/image-to-video/submit';
        } else if (selectedModel.includes('ltx2')) {
          // LTX V2 Image-to-Video (Pro/Fast) - supports both t2v and i2v variants, use I2V when image is uploaded
          const isPro = selectedModel.includes('pro');
          const normalizedRes = (selectedResolution || '1080p').toLowerCase();
          const ratio = frameSize === '9:16' ? '9:16' : (frameSize === '16:9' ? '16:9' : 'auto');
          if (uploadedImages.length === 0) {
            setError('LTX V2 image-to-video requires an input image');
            return;
          }
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image_url: uploadedImages[0],
            resolution: normalizedRes,
            aspect_ratio: ratio,
            duration,
            fps: fps,
            generate_audio: generateAudio,
            generationType: 'image-to-video',
            isPublic,
          } as any;
          generationType = 'image-to-video';
          apiEndpoint = isPro ? '/api/fal/ltx2/image-to-video/pro/submit' : '/api/fal/ltx2/image-to-video/fast/submit';
        } else if (selectedModel === 'gen4_turbo' || selectedModel === 'gen3a_turbo') {
          // Runway image to video - only for gen4_turbo and gen3a_turbo
          // Ensure image is provided
          if (uploadedImages.length === 0) {
            setError("An input image is required for Runway image-to-video generation");
            return;
          }

          const runwaySku = selectedModel === 'gen4_turbo' ? `Gen-4  Turbo ${duration}s` : `Gen-3a  Turbo ${duration}s`;
          const apiPrompt = getApiPrompt(prompt);
          const imageToVideoBody = buildImageToVideoBody({
            model: selectedModel as "gen4_turbo" | "gen3a_turbo",
            ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
            promptText: apiPrompt,
            duration: duration as 5 | 10,
            promptImage: uploadedImages[0]
          });

          console.log('🎬 Runway I2V payload:', {
            mode: "image_to_video",
            sku: runwaySku,
            imageToVideo: {
              ...imageToVideoBody,
              promptImage: imageToVideoBody.promptImage ? 'provided' : 'missing'
            }
          });

          requestBody = {
            mode: "image_to_video",
            sku: runwaySku,
            imageToVideo: imageToVideoBody,
            originalPrompt: prompt, // Store original prompt for display
            generationType: "image-to-video",
            isPublic,
          };
          apiEndpoint = '/api/runway/video';
        } else {
          // Unknown model for image-to-video mode
          setError(`Model "${selectedModel}" does not support image-to-video generation. Please select a different model.`);
          return;
        }
        generationType = "image-to-video";
      } else {
        // Video to video generation
        if (selectedModel.includes('sora2-v2v')) {
          // Sora 2 V2V Remix - requires source_history_id pointing to a Sora 2 video
          // The source video must be from a previous Sora 2 generation (T2V or I2V)
          if (!sourceHistoryEntryId && !uploadedVideo) {
            setError("Sora 2 Remix requires selecting a source video from history. Please upload or select a Sora 2 video from your history.");
            return;
          }

          // If we have a history entry ID, use it (preferred)
          // Otherwise, try to find the entry by video URL
          let sourceHistoryId = sourceHistoryEntryId;
          let sourceEntry: any = null;

          if (sourceHistoryId) {
            // Find the entry by ID
            sourceEntry = historyEntries.find((entry: any) => entry.id === sourceHistoryId);
          } else if (uploadedVideo) {
            // Find the matching history entry by video URL
            const matchingEntry = historyEntries.find((entry: any) => {
              const entryVideos = entry?.images || entry?.videos || [];
              return entryVideos.some((img: any) =>
                img?.url === uploadedVideo || img?.firebaseUrl === uploadedVideo || img?.originalUrl === uploadedVideo
              );
            });
            if (matchingEntry?.id) {
              sourceHistoryId = matchingEntry.id;
              sourceEntry = matchingEntry;
            }
          }

          if (!sourceHistoryId || !sourceEntry) {
            setError("Could not find source video in history. Please select a Sora 2 video from your history for remix.");
            return;
          }

          // Validate that the source video is from a Sora 2 generation
          const entryModel = String(sourceEntry?.model || '').toLowerCase();
          const hasSoraVideoId = !!(sourceEntry?.soraVideoId || (Array.isArray(sourceEntry?.videos) && sourceEntry?.videos[0]?.soraVideoId));
          const isSoraModel = entryModel.includes('sora-2') || entryModel.includes('sora2');

          if (!isSoraModel && !hasSoraVideoId) {
            setError("The selected video is not from a Sora 2 generation. Please select a video generated with Sora 2 (T2V or I2V).");
            return;
          }

          // Extract soraVideoId if available (preferred by backend)
          const soraVideoId = sourceEntry?.soraVideoId || (Array.isArray(sourceEntry?.videos) && sourceEntry?.videos[0]?.soraVideoId);

          requestBody = {
            prompt,
            // Prefer video_id if available, otherwise use source_history_id
            ...(soraVideoId ? { video_id: soraVideoId } : { source_history_id: sourceHistoryId }),
            generationType: 'video-to-video',
            isPublic,
          };
          generationType = 'video-to-video';
          apiEndpoint = '/api/fal/sora2/video-to-video/remix/submit';
        } else if (selectedModel === "kling-lip-sync") {
          // Kling Lipsync - requires video_url or video_id, and text or audio_file
          if (!uploadedVideo && !sourceHistoryEntryId) {
            setError("Kling Lip Sync requires a video input. Please upload a video or select a source video.");
            setIsGenerating(false);
            return;
          }
          if (!prompt.trim() && !uploadedAudio) {
            setError("Kling Lip Sync requires either text or audio file input.");
            setIsGenerating(false);
            return;
          }

          requestBody = {
            model: 'kwaivgi/kling-lip-sync',
            video_url: uploadedVideo || undefined, // Use video_url if uploaded
            video_id: sourceHistoryEntryId || undefined, // Use video_id if from history
            text: prompt.trim() || undefined, // Text for lip sync
            audio_file: uploadedAudio || undefined, // Audio file if uploaded
            voice_id: 'en_AOT', // Default voice_id (can be made configurable later)
            voice_speed: 1, // Default voice speed (can be made configurable later)
            generationType: 'video-to-video',
            isPublic,
            originalPrompt: prompt.trim() || '', // Store original prompt for display
          };
          generationType = 'video-to-video';
          apiEndpoint = '/api/replicate/kling-lipsync/submit';
        } else if (selectedModel === "wan-2.2-animate-replace") {
          // WAN 2.2 Animate Replace - requires video and character_image
          if (!uploadedVideo) {
            toast.error("Video upload is mandatory");
            setIsGenerating(false);
            return;
          }
          if (!uploadedCharacterImage && uploadedImages.length === 0) {
            toast.error("Character image upload is mandatory");
            setIsGenerating(false);
            return;
          }

          const characterImage = uploadedCharacterImage || uploadedImages[0];

          requestBody = {
            model: 'wan-video/wan-2.2-animate-replace',
            video: uploadedVideo,
            character_image: characterImage,
            resolution: wanAnimateResolution,
            refert_num: wanAnimateRefertNum,
            go_fast: wanAnimateGoFast,
            merge_audio: wanAnimateMergeAudio,
            frames_per_second: wanAnimateFps,
            ...(wanAnimateSeed !== undefined && { seed: wanAnimateSeed }),
            generationType: 'video-to-video',
            isPublic,
            originalPrompt: prompt.trim() || '', // Store original prompt for display
          };
          generationType = 'video-to-video';
          apiEndpoint = '/api/replicate/wan-2-2-animate-replace/submit';
        } else if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01" || selectedModel.includes("wan-2.5")) {
          // MiniMax and WAN models don't support video to video
          setError("MiniMax and WAN models don't support video to video generation");
          return;
        } else {
          // Runway video to video
          if (!uploadedVideo) {
            setError("Please upload a video");
            return;
          }
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
            generationType: "video-to-video",
            isPublic,
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
        images: [{ id: 'video-loading', url: '', originalUrl: '' }] as any,
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
        const rb: any = requestBody as any;
        console.log('📤 - Duration:', rb?.duration);
        console.log('📤 - Resolution:', rb?.resolution);
        console.log('📤 - First frame image:', !!rb?.first_frame_image);
        console.log('📤 - Subject reference:', rb?.subject_reference);
        console.log('📤 - Prompt length:', rb?.prompt?.length || 0);

        if (selectedModel === "S2V-01") {
          console.log('📤 S2V-01 specific debug:');
          const rb2: any = requestBody as any;
          console.log('📤 - References array length:', references.length);
          console.log('📤 - Subject reference structure:', JSON.stringify(rb2?.subject_reference, null, 2));
        }
      }

      const api = getApiClient();
      let result: any;
      try {
        const { data } = await api.post(apiEndpoint, requestBody);
        result = data?.data || data;
      } catch (e: any) {
        // Check if this is a network error (no response from server)
        const isNetworkError = !e?.response && (e?.code === 'ECONNABORTED' || e?.code === 'ERR_NETWORK' || e?.code === 'ETIMEDOUT' || e?.message?.includes('Network Error') || e?.message?.includes('Failed to fetch') || e?.message?.includes('timeout'));

        if (isNetworkError) {
          const baseUrl = api.defaults.baseURL || 'the server';
          const errorMsg = `Network error: Unable to connect to ${baseUrl}. Please check your internet connection and try again.`;
          console.error('❌ Network error details:', {
            code: e?.code,
            message: e?.message,
            endpoint: apiEndpoint,
            baseURL: baseUrl,
            stack: e?.stack
          });
          throw new Error(errorMsg);
        }

        // Some providers may return 5xx while the task actually got queued; try to salvage known success fields
        const statusCode = e?.response?.status;
        const body = e?.response?.data;
        const msg = body?.message || e?.message || 'Request failed';
        const queuedRequestId = body?.data?.requestId || body?.requestId;

        if (String(statusCode) === '413' || /request entity too large/i.test(String(msg))) {
          toast.error('Video too large for provider. Max 16MB. Please upload ≤ 14MB');
          console.error('❌ API 413 payload too large');
          throw new Error(`HTTP ${statusCode || 500}: ${msg}`);
        }

        // If a requestId is present despite error status, proceed as submitted
        if (queuedRequestId) {
          console.warn('⚠️ Provider returned error but included requestId; proceeding as submitted', { statusCode, msg, queuedRequestId });
          result = { requestId: queuedRequestId, historyId: body?.data?.historyId || body?.historyId, status: 'submitted' };
        } else {
          // Provide more detailed error information
          const errorDetails = {
            statusCode: statusCode || 'No status',
            message: msg,
            endpoint: apiEndpoint,
            baseURL: api.defaults.baseURL,
            responseData: body,
            originalError: e?.message
          };
          console.error('❌ API response not ok:', errorDetails);

          // Create a more helpful error message
          let userFriendlyMsg = msg;
          if (statusCode === 401) {
            userFriendlyMsg = 'Authentication failed. Please try logging out and back in.';
          } else if (statusCode === 403) {
            userFriendlyMsg = 'Access denied. You may not have permission to perform this action.';
          } else if (statusCode === 404) {
            userFriendlyMsg = `API endpoint not found: ${apiEndpoint}. Please contact support.`;
          } else if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
            userFriendlyMsg = 'Server error. The service may be temporarily unavailable. Please try again in a few moments.';
          } else if (!statusCode) {
            userFriendlyMsg = `Request failed: ${msg}. Please check your connection and try again.`;
          }

          throw new Error(userFriendlyMsg);
        }
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

      // Validate that we have a requestId for WAN models
      if (selectedModel.includes("wan-2.5") && !result.requestId) {
        console.error('❌ WAN API response missing requestId:', result);
        throw new Error('WAN API response missing requestId');
      }

      // Validate that we have a requestId for Seedance models
      if (selectedModel.includes('seedance') && !result.requestId) {
        console.error('❌ Seedance API response missing requestId:', result);
        throw new Error('Seedance API response missing requestId');
      }

      // Validate that we have a requestId for PixVerse models
      if (selectedModel.includes('pixverse') && !result.requestId) {
        console.error('❌ PixVerse API response missing requestId:', result);
        throw new Error('PixVerse API response missing requestId');
      }

      // Validate that we have a requestId for Kling models
      if (selectedModel.startsWith('kling-') && !result.requestId) {
        console.error('❌ Kling API response missing requestId:', result);
        throw new Error('Kling API response missing requestId');
      }

      // Validate that we have a requestId for WAN 2.2 Animate Replace
      if (selectedModel === "wan-2.2-animate-replace" && !result.requestId) {
        console.error('❌ WAN Animate Replace API response missing requestId:', result);
        throw new Error('WAN Animate Replace API response missing requestId');
      }

      // Validate that we have a requestId for Sora 2 models
      if (selectedModel.includes('sora2') && !result.requestId) {
        console.error('❌ Sora 2 API response missing requestId:', result);
        throw new Error('Sora 2 API response missing requestId');
      }

      let videoUrl: string | undefined;

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
      } else if (selectedModel.includes("veo3.1")) {
        // Veo 3.1 flow - queue-based polling
        console.log('🎬 Veo 3.1 video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        // Poll for completion using FAL queue status
        let videoResult: any;
        for (let attempts = 0; attempts < 360; attempts++) { // 6 minutes max
          try {
            const statusRes = await api.get('/api/fal/queue/status', {
              params: { model: result.model, requestId: result.requestId }
            });
            const status = statusRes.data?.data || statusRes.data;

            if (status?.status === 'COMPLETED' || status?.status === 'completed') {
              // Get the result
              const resultRes = await api.get('/api/fal/queue/result', {
                params: { model: result.model, requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              break;
            }
            if (status?.status === 'FAILED' || status?.status === 'failed') {
              throw new Error('Veo 3.1 video generation failed');
            }
          } catch (statusError) {
            console.error('Status check failed:', statusError);
            if (attempts === 359) throw statusError;
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ Veo 3.1 video completed with URL:', videoUrl);
        } else {
          console.error('❌ Veo 3.1 video generation did not complete properly');
          throw new Error('Veo 3.1 video generation did not complete in time');
        }
      } else if (selectedModel.includes('ltx2')) {
        // LTX V2 flow - queue-based polling (same pattern as Veo 3.1)
        console.log('🎬 LTX V2 video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        let videoResult: any;
        for (let attempts = 0; attempts < 360; attempts++) { // up to 6 minutes
          try {
            const statusRes = await api.get('/api/fal/queue/status', {
              params: { model: result.model, requestId: result.requestId }
            });
            const status = statusRes.data?.data || statusRes.data;
            const s = String(status?.status || '').toLowerCase();
            if (s === 'completed' || s === 'success' || s === 'succeeded') {
              const resultRes = await api.get('/api/fal/queue/result', {
                params: { model: result.model, requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              break;
            }
            if (s === 'failed' || s === 'error') {
              throw new Error('LTX V2 video generation failed');
            }
          } catch (statusError) {
            console.error('Status check failed:', statusError);
            if (attempts === 359) throw statusError;
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        // Parse LTX result shapes: { video: { url } } or { videos: [{url}]} or output fields
        if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
          console.log('✅ LTX V2 video completed with URL (video.url):', videoUrl);
        } else if (Array.isArray(videoResult?.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ LTX V2 video completed with URL (videos[0].url):', videoUrl);
        } else if (typeof videoResult?.output === 'string' && videoResult.output.startsWith('http')) {
          videoUrl = videoResult.output;
          console.log('✅ LTX V2 video completed with URL (output string):', videoUrl);
        } else if (Array.isArray(videoResult?.output) && typeof videoResult.output[0] === 'string') {
          videoUrl = videoResult.output[0];
          console.log('✅ LTX V2 video completed with URL (output array):', videoUrl);
        } else {
          console.error('❌ LTX V2 video generation did not complete properly');
          console.error('❌ Video result structure:', JSON.stringify(videoResult, null, 2));
          throw new Error('LTX V2 video generation did not complete in time');
        }
      } else if (selectedModel.includes("veo3") && !selectedModel.includes("veo3.1")) {
        // Veo3 flow - queue-based polling
        console.log('🎬 Veo3 video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        // Poll for completion using FAL queue status
        let videoResult: any;
        for (let attempts = 0; attempts < 360; attempts++) { // 6 minutes max
          try {
            const statusRes = await api.get('/api/fal/queue/status', {
              params: { model: result.model, requestId: result.requestId }
            });
            const status = statusRes.data?.data || statusRes.data;

            if (status?.status === 'COMPLETED' || status?.status === 'completed') {
              // Get the result
              const resultRes = await api.get('/api/fal/queue/result', {
                params: { model: result.model, requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              break;
            }
            if (status?.status === 'FAILED' || status?.status === 'failed') {
              throw new Error('Veo3 video generation failed');
            }
          } catch (statusError) {
            console.error('Status check failed:', statusError);
            if (attempts === 359) throw statusError;
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ Veo3 video completed with URL:', videoUrl);
        } else {
          console.error('❌ Veo3 video generation did not complete properly');
          throw new Error('Veo3 video generation did not complete in time');
        }
      } else if (selectedModel.includes('sora2')) {
        // Sora 2 flow - queue-based polling (same as Veo3/Veo 3.1)
        console.log('🎬 Sora 2 video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        // Poll for completion using FAL queue status
        let videoResult: any;
        for (let attempts = 0; attempts < 360; attempts++) { // 6 minutes max
          try {
            const statusRes = await api.get('/api/fal/queue/status', {
              params: { model: result.model, requestId: result.requestId }
            });
            const status = statusRes.data?.data || statusRes.data;

            if (status?.status === 'COMPLETED' || status?.status === 'completed') {
              // Get the result
              const resultRes = await api.get('/api/fal/queue/result', {
                params: { model: result.model, requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              break;
            }
            if (status?.status === 'FAILED' || status?.status === 'failed') {
              throw new Error('Sora 2 video generation failed');
            }
          } catch (statusError) {
            console.error('Status check failed:', statusError);
            if (attempts === 359) throw statusError;
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ Sora 2 video completed with URL:', videoUrl);
        } else {
          console.error('❌ Sora 2 video generation did not complete properly');
          throw new Error('Sora 2 video generation did not complete in time');
        }
      } else if (selectedModel.includes("wan-2.5")) {
        // WAN 2.5 flow - queue-based polling
        console.log('🎬 WAN 2.5 video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        // Poll for completion using Replicate queue status
        let videoResult: any;
        const maxAttempts = 900; // 15 minutes max for WAN models (they can take longer)
        console.log(`🎬 Starting WAN 2.5 polling with ${maxAttempts} attempts (15 minutes max)`);

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
          try {
            console.log(`🎬 WAN 2.5 polling attempt ${attempts + 1}/${maxAttempts}`);
            console.log(`🎬 Checking status for requestId: ${result.requestId}`);
            const statusRes = await api.get('/api/replicate/queue/status', {
              params: { requestId: result.requestId }
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;

            console.log(`🎬 WAN 2.5 status check result:`, status);
            // Normalize status for robust comparisons
            const statusValue = String(status?.status || '').toLowerCase();
            if (statusValue === 'completed' || statusValue === 'success' || statusValue === 'succeeded') {
              console.log('✅ WAN 2.5 generation completed, fetching result...');
              // Get the result
              const resultRes = await api.get('/api/replicate/queue/result', {
                params: { requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log('✅ WAN 2.5 result fetched:', videoResult);
              break;
            }
            if (statusValue === 'failed' || statusValue === 'error') {
              console.error('❌ WAN 2.5 generation failed with status:', status);
              throw new Error('WAN 2.5 video generation failed');
            }

            // Handle other possible statuses
            if (statusValue === 'processing' || statusValue === 'pending') {
              console.log(`🎬 WAN 2.5 status: ${status.status} - continuing to poll...`);
            } else if (statusValue) {
              console.log(`🎬 WAN 2.5 unknown status: ${status.status} - continuing to poll...`);
            } else {
              console.log('🎬 WAN 2.5 no status returned - continuing to poll...');
            }

            // Log progress every 30 seconds
            if (attempts % 30 === 0 && attempts > 0) {
              console.log(`🎬 WAN 2.5 still processing... (${Math.floor(attempts / 60)} minutes elapsed)`);

              // Fallback: Check if video is available in history after 2 minutes
              if (attempts >= 120 && result.historyId) {
                try {
                  console.log(`🎬 Fallback: Checking history entry for completed video...`);
                  const historyRes = await api.get(`/api/generations/${result.historyId}`);
                  const historyData = historyRes.data?.data || historyRes.data;

                  if (historyData?.videos && Array.isArray(historyData.videos) && historyData.videos.length > 0) {
                    const completedVideo = historyData.videos.find((v: any) => v.status === 'completed' || v.url);
                    if (completedVideo?.url) {
                      console.log('✅ WAN 2.5 video found in history:', completedVideo);
                      videoResult = { videos: [completedVideo] };
                      break;
                    }
                  }
                } catch (historyError) {
                  console.log('🎬 Fallback history check failed:', historyError);
                }
              }
            }
          } catch (statusError) {
            console.error('❌ WAN 2.5 status check failed:', statusError);
            if (attempts === maxAttempts - 1) {
              console.error('❌ WAN 2.5 polling exhausted all attempts');
              throw statusError;
            }
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ WAN 2.5 video completed with URL:', videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          // Fallback: check for single video object
          videoUrl = videoResult.video.url;
          console.log('✅ WAN 2.5 video completed with URL (fallback):', videoUrl);
        } else if (typeof videoResult?.output === 'string' && videoResult.output.startsWith('http')) {
          // Replicate-like payload where 'output' is a direct URL
          videoUrl = videoResult.output;
          console.log('✅ WAN 2.5 video completed with URL (output string):', videoUrl);
        } else if (Array.isArray(videoResult?.output) && videoResult.output[0] && typeof videoResult.output[0] === 'string') {
          // Replicate-like payload where 'output' is an array of URLs
          videoUrl = videoResult.output[0];
          console.log('✅ WAN 2.5 video completed with URL (output array):', videoUrl);
        } else {
          console.error('❌ WAN 2.5 video generation did not complete properly');
          console.error('❌ Video result structure:', JSON.stringify(videoResult, null, 2));
          console.error('❌ Expected videos array or video object with URL');
          throw new Error('WAN 2.5 video generation did not complete in time');
        }
      } else if (selectedModel === "wan-2.2-animate-replace") {
        // WAN 2.2 Animate Replace flow - queue-based polling (same as WAN 2.5)
        console.log('🎬 WAN 2.2 Animate Replace video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        // Poll for completion using Replicate queue status
        let videoResult: any;
        const maxAttempts = 900; // 15 minutes max for WAN models
        console.log(`🎬 Starting WAN 2.2 Animate Replace polling with ${maxAttempts} attempts (15 minutes max)`);

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
          try {
            console.log(`🎬 WAN 2.2 Animate Replace polling attempt ${attempts + 1}/${maxAttempts}`);
            console.log(`🎬 Checking status for requestId: ${result.requestId}`);
            const statusRes = await api.get('/api/replicate/queue/status', {
              params: { requestId: result.requestId }
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;

            console.log(`🎬 WAN 2.2 Animate Replace status check result:`, status);
            // Normalize status for robust comparisons
            const statusValue = String(status?.status || '').toLowerCase();
            if (statusValue === 'completed' || statusValue === 'success' || statusValue === 'succeeded') {
              console.log('✅ WAN 2.2 Animate Replace generation completed, fetching result...');
              // Get the result
              const resultRes = await api.get('/api/replicate/queue/result', {
                params: { requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log('✅ WAN 2.2 Animate Replace result fetched:', videoResult);
              break;
            }
            if (statusValue === 'failed' || statusValue === 'error') {
              console.error('❌ WAN 2.2 Animate Replace generation failed with status:', status);
              throw new Error('WAN 2.2 Animate Replace video generation failed');
            }

            // Handle other possible statuses
            if (statusValue === 'processing' || statusValue === 'pending') {
              console.log(`🎬 WAN 2.2 Animate Replace status: ${status.status} - continuing to poll...`);
            } else if (statusValue) {
              console.log(`🎬 WAN 2.2 Animate Replace unknown status: ${status.status} - continuing to poll...`);
            } else {
              console.log('🎬 WAN 2.2 Animate Replace no status returned - continuing to poll...');
            }

            // Log progress every 30 seconds
            if (attempts % 30 === 0 && attempts > 0) {
              console.log(`🎬 WAN 2.2 Animate Replace still processing... (${Math.floor(attempts / 60)} minutes elapsed)`);

              // Fallback: Check if video is available in history after 2 minutes
              if (attempts >= 120 && result.historyId) {
                try {
                  console.log(`🎬 Fallback: Checking history entry for completed video...`);
                  const historyRes = await api.get(`/api/generations/${result.historyId}`);
                  const historyData = historyRes.data?.data || historyRes.data;

                  if (historyData?.videos && Array.isArray(historyData.videos) && historyData.videos.length > 0) {
                    const completedVideo = historyData.videos.find((v: any) => v.status === 'completed' || v.url);
                    if (completedVideo?.url) {
                      console.log('✅ WAN 2.2 Animate Replace video found in history:', completedVideo);
                      videoResult = { videos: [completedVideo] };
                      break;
                    }
                  }
                } catch (historyError) {
                  console.log('🎬 Fallback history check failed:', historyError);
                }
              }
            }
          } catch (statusError) {
            console.error('❌ WAN 2.2 Animate Replace status check failed:', statusError);
            if (attempts === maxAttempts - 1) {
              console.error('❌ WAN 2.2 Animate Replace polling exhausted all attempts');
              throw statusError;
            }
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ WAN 2.2 Animate Replace video completed with URL:', videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          // Fallback: check for single video object
          videoUrl = videoResult.video.url;
          console.log('✅ WAN 2.2 Animate Replace video completed with URL (fallback):', videoUrl);
        } else if (typeof videoResult?.output === 'string' && videoResult.output.startsWith('http')) {
          // Replicate-like payload where 'output' is a direct URL
          videoUrl = videoResult.output;
          console.log('✅ WAN 2.2 Animate Replace video completed with URL (output string):', videoUrl);
        } else if (Array.isArray(videoResult?.output) && videoResult.output[0] && typeof videoResult.output[0] === 'string') {
          // Replicate-like payload where 'output' is an array of URLs
          videoUrl = videoResult.output[0];
          console.log('✅ WAN 2.2 Animate Replace video completed with URL (output array):', videoUrl);
        } else {
          console.error('❌ WAN 2.2 Animate Replace video generation did not complete properly');
          console.error('❌ Video result structure:', JSON.stringify(videoResult, null, 2));
          console.error('❌ Expected videos array or video object with URL');
          throw new Error('WAN 2.2 Animate Replace video generation did not complete in time');
        }
      } else if (selectedModel.startsWith('kling-')) {
        // Kling flow - queue-based polling via replicate queue endpoints
        console.log('🎬 Kling video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        let videoResult: any;
        const maxAttemptsK = 900; // up to 15 minutes
        for (let attempts = 0; attempts < maxAttemptsK; attempts++) {
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
              videoResult = resultRes.data?.data || resultRes.data;
              break;
            }
            if (statusValue === 'failed' || statusValue === 'error') {
              throw new Error('Kling video generation failed');
            }
          } catch (e) {
            if (attempts === maxAttemptsK - 1) throw e;
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ Kling video completed with URL:', videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          videoUrl = videoResult.video.url;
          console.log('✅ Kling video completed with URL (fallback):', videoUrl);
        } else if (typeof videoResult?.output === 'string' && videoResult.output.startsWith('http')) {
          videoUrl = videoResult.output;
          console.log('✅ Kling video completed with URL (output string):', videoUrl);
        } else if (Array.isArray(videoResult?.output) && videoResult.output[0] && typeof videoResult.output[0] === 'string') {
          videoUrl = videoResult.output[0];
          console.log('✅ Kling video completed with URL (output array):', videoUrl);
        } else {
          console.error('❌ Kling video generation did not complete properly');
          console.error('❌ Video result structure:', JSON.stringify(videoResult, null, 2));
          throw new Error('Kling video generation did not complete in time');
        }
      } else if (selectedModel.includes('seedance')) {
        // Seedance flow - queue-based polling via replicate queue endpoints (same as WAN/Kling)
        console.log('🎬 Seedance video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        let videoResult: any;
        const maxAttemptsSeedance = 900; // up to 15 minutes (same as WAN/Kling)
        console.log(`🎬 Starting Seedance polling with ${maxAttemptsSeedance} attempts (15 minutes max)`);

        for (let attempts = 0; attempts < maxAttemptsSeedance; attempts++) {
          try {
            console.log(`🎬 Seedance polling attempt ${attempts + 1}/${maxAttemptsSeedance}`);
            console.log(`🎬 Checking status for requestId: ${result.requestId}`);
            const statusRes = await api.get('/api/replicate/queue/status', {
              params: { requestId: result.requestId }
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || '').toLowerCase();

            console.log(`🎬 Seedance status check result:`, status);
            if (statusValue === 'completed' || statusValue === 'success' || statusValue === 'succeeded') {
              console.log('✅ Seedance generation completed, fetching result...');
              // Get the result
              const resultRes = await api.get('/api/replicate/queue/result', {
                params: { requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log('✅ Seedance result fetched:', videoResult);
              break;
            }
            if (statusValue === 'failed' || statusValue === 'error') {
              console.error('❌ Seedance generation failed with status:', status);
              throw new Error('Seedance video generation failed');
            }

            // Log progress every 30 seconds
            if (attempts % 30 === 0 && attempts > 0) {
              console.log(`🎬 Seedance still processing... (${Math.floor(attempts / 60)} minutes elapsed)`);
            }
          } catch (e) {
            console.error('❌ Seedance status check failed:', e);
            if (attempts === maxAttemptsSeedance - 1) throw e;
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ Seedance video completed with URL:', videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          videoUrl = videoResult.video.url;
          console.log('✅ Seedance video completed with URL (fallback):', videoUrl);
        } else if (typeof videoResult?.output === 'string' && videoResult.output.startsWith('http')) {
          videoUrl = videoResult.output;
          console.log('✅ Seedance video completed with URL (output string):', videoUrl);
        } else if (Array.isArray(videoResult?.output) && videoResult.output[0] && typeof videoResult.output[0] === 'string') {
          videoUrl = videoResult.output[0];
          console.log('✅ Seedance video completed with URL (output array):', videoUrl);
        } else {
          console.error('❌ Seedance video generation did not complete properly');
          console.error('❌ Video result structure:', JSON.stringify(videoResult, null, 2));
          throw new Error('Seedance video generation did not complete in time');
        }
      } else if (selectedModel.includes('pixverse')) {
        // PixVerse flow - queue-based polling via replicate queue endpoints (same as WAN/Kling/Seedance)
        console.log('🎬 PixVerse video generation started, request ID:', result.requestId);
        console.log('🎬 Model:', result.model);
        console.log('🎬 History ID:', result.historyId);

        let videoResult: any;
        const maxAttemptsPixverse = 900; // up to 15 minutes (same as WAN/Kling/Seedance)
        console.log(`🎬 Starting PixVerse polling with ${maxAttemptsPixverse} attempts (15 minutes max)`);

        for (let attempts = 0; attempts < maxAttemptsPixverse; attempts++) {
          try {
            console.log(`🎬 PixVerse polling attempt ${attempts + 1}/${maxAttemptsPixverse}`);
            console.log(`🎬 Checking status for requestId: ${result.requestId}`);
            const statusRes = await api.get('/api/replicate/queue/status', {
              params: { requestId: result.requestId }
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || '').toLowerCase();

            console.log(`🎬 PixVerse status check result:`, status);
            if (statusValue === 'completed' || statusValue === 'success' || statusValue === 'succeeded') {
              console.log('✅ PixVerse generation completed, fetching result...');
              // Get the result
              const resultRes = await api.get('/api/replicate/queue/result', {
                params: { requestId: result.requestId }
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log('✅ PixVerse result fetched:', videoResult);
              break;
            }
            if (statusValue === 'failed' || statusValue === 'error') {
              console.error('❌ PixVerse generation failed with status:', status);
              throw new Error('PixVerse video generation failed');
            }

            // Log progress every 30 seconds
            if (attempts % 30 === 0 && attempts > 0) {
              console.log(`🎬 PixVerse still processing... (${Math.floor(attempts / 60)} minutes elapsed)`);
            }
          } catch (e) {
            console.error('❌ PixVerse status check failed:', e);
            if (attempts === maxAttemptsPixverse - 1) throw e;
          }
          await new Promise(res => setTimeout(res, 1000));
        }

        if (videoResult?.videos && Array.isArray(videoResult.videos) && videoResult.videos[0]?.url) {
          videoUrl = videoResult.videos[0].url;
          console.log('✅ PixVerse video completed with URL:', videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          videoUrl = videoResult.video.url;
          console.log('✅ PixVerse video completed with URL (fallback):', videoUrl);
        } else if (typeof videoResult?.output === 'string' && videoResult.output.startsWith('http')) {
          videoUrl = videoResult.output;
          console.log('✅ PixVerse video completed with URL (output string):', videoUrl);
        } else if (Array.isArray(videoResult?.output) && videoResult.output[0] && typeof videoResult.output[0] === 'string') {
          videoUrl = videoResult.output[0];
          console.log('✅ PixVerse video completed with URL (output array):', videoUrl);
        } else {
          console.error('❌ PixVerse video generation did not complete properly');
          console.error('❌ Video result structure:', JSON.stringify(videoResult, null, 2));
          throw new Error('PixVerse video generation did not complete in time');
        }
      } else if (apiEndpoint === '/api/runway/video') {
        // Runway video completion (only when using Runway endpoint)
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
      } else {
        // Non-Runway providers (FAL/Replicate/MiniMax) handle completion via backend/history.
        // If backend returned an immediate URL within result, prefer it.
        try {
          const maybeUrl = (result?.video?.url) || (Array.isArray(result?.videos) && result.videos[0]?.url) || result?.output || result?.url;
          if (typeof maybeUrl === 'string' && maybeUrl.startsWith('http')) {
            videoUrl = maybeUrl;
            console.log('✅ Non-Runway provider returned video URL immediately:', videoUrl);
          } else {
            console.log('ℹ️ Non-Runway provider; awaiting history refresh for final URL');
          }
        } catch { }
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
      } catch { }

      // Confirm credit transaction as successful
      await handleGenerationSuccess(transactionId);
      console.log('✅ Credits confirmed for successful generation');

      // Clear all inputs and configurations
      clearInputs();

      // Refresh only the single completed generation instead of reloading all
      if (result.historyId) {
        await refreshSingleGeneration(result.historyId);
      } else {
        // Fallback to full refresh if no historyId
        dispatch(clearFilters());
        dispatch(loadHistory({
          filters: { mode: 'video' } as any,
          paginationParams: { limit: 50 },
          requestOrigin: 'page',
          expectedType: 'text-to-video',
          debugTag: `InputBox:refresh:video-mode:${Date.now()}`
        } as any));
      }

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

      try { const toast = (await import('react-hot-toast')).default; toast.success('Video generated successfully!'); } catch { }

      // Clear form
      setPrompt("");
      setUploadedImages([]);
      setUploadedVideo("");
      setSourceHistoryEntryId(""); // Clear source history entry when clearing video
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

      try {
        const toast = (await import('react-hot-toast')).default;
        const errorMessage = (error as any)?.payload || (error instanceof Error ? error.message : 'Video generation failed');
        toast.error(errorMessage, { duration: 5000 });
      } catch { }
    } finally {
      setIsGenerating(false);
    }
  };

  const newLocal = "pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50";
  // (Removed duplicate hook declaration; initial load handled earlier)

  return (
    <React.Fragment>
      {showHistory && (
        <div ref={(el) => { historyScrollRef.current = el; setHistoryScrollElement(el); }} className=" inset-0  pl-[0] pr-0   overflow-y-auto no-scrollbar z-0 ">
          <div className="md:space-y-8 space-y-2">
            {/* If there's a local preview and no row for today, render a dated block for today */}
            {localVideoPreview && !groupedByDate[todayKey] && (
              <div className="md:space-y-4 space-y-2">
                <div className="flex items-center md:gap-3 gap-2">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-white/70">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </h3>
                </div>
                <div className="flex flex-wrap md:gap-3 gap-2 ml-0">
                  <div className="relative w-[165px] h-[165px] md:w-64 md:h-64 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                    {localVideoPreview.status === 'generating' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/90">
                        <div className="flex flex-col items-center gap-2">
                          <img src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
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
              <div key={date} className="md:space-y-4 space-y-1">
                {/* Date Header */}
                <div className="flex items-center md:gap-3 gap-2">
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

                {/* All Videos for this Date - Grid Layout (2 columns on mobile, flex on desktop) */}
                <div className="grid grid-cols-2 gap-2 md:gap-3 ml-0 md:mb-0 mb-4 md:flex md:flex-wrap">
                  {/* Prepend local video preview to today's row to push existing items right */}
                  {date === todayKey && localVideoPreview && (() => {
                    const localEntryId = localVideoPreview.id;
                    const localFirebaseId = (localVideoPreview as any)?.firebaseHistoryId;

                    // Check if this local preview already exists in history
                    const existsInRef = (localEntryId && historyEntryIdsRef.current.has(localEntryId)) ||
                      (localFirebaseId && historyEntryIdsRef.current.has(localFirebaseId));
                    const existsInHistory = historyEntries.some((e: HistoryEntry) => {
                      const eId = e.id;
                      const eFirebaseId = (e as any)?.firebaseHistoryId;
                      if (localEntryId && (eId === localEntryId || eFirebaseId === localEntryId)) return true;
                      if (localFirebaseId && (eId === localFirebaseId || eFirebaseId === localFirebaseId)) return true;
                      return false;
                    });
                    const existsInGrouped = groupedByDate[date]?.some((e: HistoryEntry) => {
                      const eId = e.id;
                      const eFirebaseId = (e as any)?.firebaseHistoryId;
                      if (localEntryId && (eId === localEntryId || eFirebaseId === localEntryId)) return true;
                      if (localFirebaseId && (eId === localFirebaseId || eFirebaseId === localFirebaseId)) return true;
                      return false;
                    });

                    // If entry exists anywhere, don't render local preview
                    if (existsInRef || existsInHistory || existsInGrouped) {
                      return null;
                    }

                    // Safety check: if local preview is completed and history exists, don't show it
                    if (localVideoPreview.status === 'completed' && (historyEntries.length > 0 || (groupedByDate[date]?.length || 0) > 0)) {
                      return null;
                    }

                    return (
                      <div className="relative w-auto h-auto max-w-[200px] max-h-[200px] md:w-64 md:h-64 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10">
                        {localVideoPreview.status === 'generating' ? (
                          <div className="w-full h-full flex items-center justify-center bg-black/90">
                            <div className="flex flex-col items-center gap-2">
                              <img src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
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
                    );
                  })()}
                  {(() => {
                    // Create a set of all local preview IDs for fast lookup
                    const localPreviewIds = new Set<string>();
                    if (date === todayKey && localVideoPreview) {
                      const localEntryId = localVideoPreview.id;
                      const localFirebaseId = (localVideoPreview as any)?.firebaseHistoryId;
                      if (localEntryId) localPreviewIds.add(localEntryId);
                      if (localFirebaseId) localPreviewIds.add(localFirebaseId);
                    }

                    // Filter out history entries that match local preview
                    const filteredHistoryEntries = (groupedByDate[date] || []).filter((entry: HistoryEntry) => {
                      if (localPreviewIds.size === 0) return true;
                      const entryId = entry.id;
                      const entryFirebaseId = (entry as any)?.firebaseHistoryId;
                      if (entryId && localPreviewIds.has(entryId)) return false;
                      if (entryFirebaseId && localPreviewIds.has(entryFirebaseId)) return false;
                      return true;
                    });

                    return filteredHistoryEntries.flatMap((entry: HistoryEntry) => {
                      // More defensive approach to get media items
                      let mediaItems: any[] = [];
                      if (entry.images && Array.isArray(entry.images) && entry.images.length > 0) {
                        mediaItems = entry.images;
                      } else if (entry.videos && Array.isArray(entry.videos) && entry.videos.length > 0) {
                        mediaItems = entry.videos;
                      }

                      return mediaItems.map((video: any, videoIdx: number) => {
                        const uniqueVideoKey = video?.id ? `${entry.id}-${video.id}` : `${entry.id}-video-${videoIdx}`;
                        const isVideoLoaded = loadedVideos.has(uniqueVideoKey);

                        return (
                          <div
                            key={uniqueVideoKey}
                            data-video-id={uniqueVideoKey}
                            onClick={(e) => {
                              // Don't open preview if clicking on copy button
                              if ((e.target as HTMLElement).closest('button[aria-label="Copy prompt"]')) {
                                return;
                              }
                              setPreview({ entry, video });
                            }}
                            className="relative w-auto h-auto max-w-[200px] max-h-[200px] md:w-auto md:h-auto md:max-w-64 md:max-h-64 rounded-lg overflow-hidden bg-black/40 backdrop-blur-xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200 cursor-pointer group flex-shrink-0"
                          >
                            {entry.status === "generating" ? (
                              // Loading frame
                              <div className="w-full h-full flex items-center justify-center bg-black/90">
                                <div className="flex flex-col items-center gap-2">
                                  <img src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" />
                                  <div className="text-xs text-white/60 text-center">
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
                                        onLoadStart={() => {
                                          setLoadedVideos(prev => new Set(prev).add(uniqueVideoKey));
                                        }}
                                        onLoadedData={() => {
                                          setLoadedVideos(prev => new Set(prev).add(uniqueVideoKey));
                                        }}
                                        onCanPlay={() => {
                                          setLoadedVideos(prev => new Set(prev).add(uniqueVideoKey));
                                        }}
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
                                    onClick={(e) => { e.stopPropagation(); copyPrompt(e, getCleanPrompt(entry.prompt)); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                  </button>
                                  <button
                                    aria-label="Delete video"
                                    className="pointer-events-auto p-1 rounded-lg bg-red-500/60 hover:bg-red-500/90 text-white backdrop-blur-3xl"
                                    onClick={(e) => handleDeleteVideo(e, entry)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                {/* Video duration or other info */}
                                {/* <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                                <span className="text-xs text-white">Video</span>
                              </div> */}
                              </div>
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

            {/* Loader for scroll loading */}
            {hasMore && loading && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <Image src="/styles/Logo.gif" alt="Generating" width={56} height={56} className="mx-auto" unoptimized />
                  <div className="text-sm text-white/60">Loading more generations...</div>
                </div>
              </div>
            )}
            {/* Sentinel for IO-based infinite scroll */}
            <div ref={(el) => { sentinelRef.current = el; setSentinelElement(el); }} style={{ height: 1 }} />
          </div>
        </div>
      )}

      {/* Main Input Box with a sticky tabs row above it */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[90%] max-w-[840px] z-[0]">
        {/* Toggle buttons removed - model selection determines input requirements */}
        <div
          className={`rounded-lg bg-black/20 backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl transition-all duration-300 ${(selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") ? 'max-w-[1100px]' : 'max-w-[900px]'
            }`}
          onClick={(e) => {
            // Close all dropdowns when clicking on the input box container
            if (e.target === e.currentTarget) {
              setCloseModelsDropdown(true);
              setTimeout(() => setCloseModelsDropdown(false), 0);
              setCloseFrameSizeDropdown(true);
              setTimeout(() => setCloseFrameSizeDropdown(false), 0);
              setCloseDurationDropdown(true);
              setTimeout(() => setCloseDurationDropdown(false), 0);
            }
          }}
        >
          {/* Input Row: prompt + actions */}
          <div className="flex items-start md:gap-3 gap-0 md:p-3 p-2 md:pt-2 pt-0 
          ">
            <div className="flex-1 flex items-start  gap-2 bg-transparent md:rounded-lg rounded-md pr-0 md:p-0 p-0">
              <textarea
                ref={inputEl}
                placeholder={placeholder}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                spellCheck={true}
                lang="en"
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="on"
                className={`flex-1 mt-2  bg-transparent md:h-[4rem] h-[3rem] text-white placeholder-white/50 outline-none md:text-[15px] text-[12px] leading-relaxed resize-none overflow-y-auto transition-all duration-200 ${prompt ? 'text-white' : 'text-white/70'} ${isEnhancing ? 'animate-text-shine' : ''}
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
              {/* Fixed position buttons container */}
              <div className="flex items-center md:gap-0 gap-0 flex-shrink-0 md:p-0 p-0">
                {prompt.trim() && (
                  <div className="relative group">
                    <button
                      onClick={() => {
                        setPrompt("");
                        if (inputEl.current) {
                          inputEl.current.focus();
                        }
                      }}
                      className="md:px-2 px-1.5 md:py-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white md:text-sm text-[11px] font-medium transition-colors duration-200 flex items-center gap-1.5"
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
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">Clear Prompt</div>
                  </div>
                )}
                {/* Enhance Prompt Button */}
                {prompt.trim() && (
                  <div className="relative group ml-1">
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing}
                      className={`md:px-2 px-1.5 md:py-1.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white md:text-sm text-[11px] font-medium transition-colors duration-200 flex items-center gap-1.5 ${isEnhancing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label="Enhance prompt"
                    >
                      {isEnhancing ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles size={14} className="text-yellow-300" />
                      )}
                    </button>
                    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50">Enhance Prompt</div>
                  </div>
                )}
                <div className="flex items-center gap-1 h-[40px]">
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
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
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
                                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedCameraMovements.includes(movement)
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
                  {(currentModelCapabilities.requiresReferenceImage) && (
                    <div className="relative">
                      <button
                        className={`p-2 rounded-xl transition-all duration-200 cursor-pointer group relative ${(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                          (generationMode === "video_to_video" && references.length >= 4)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                          }`}
                        onClick={() => {
                          setUploadModalType('reference');
                          setIsUploadModalOpen(true);
                        }}
                        disabled={(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                          (generationMode === "video_to_video" && references.length >= 4)}
                      >
                        <FilePlus2
                          size={22}
                          className={`transition-all duration-200 ${(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                            (generationMode === "video_to_video" && references.length >= 4)
                            ? 'text-gray-400'
                            : 'text-green-400 hover:text-green-300 hover:scale-110'
                            }`}
                        />
                        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/80 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                          {generationMode === "image_to_video" && selectedModel === "S2V-01" ? 'Upload character reference (1 max)' : 'Upload references'}
                        </div>

                        {/* References Count Badge */}
                        {references.length > 0 && (
                          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${(generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length >= 1) ||
                            (generationMode === "video_to_video" && references.length >= 4)
                            ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                            <span className="text-xs text-white font-bold">{references.length}</span>
                          </div>
                        )}
                      </button>

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

                  {/* Image Upload for models that support image-to-video (but not MiniMax/S2V-01 which have separate handlers) */}
                  {currentModelCapabilities.supportsImageToVideo &&
                    !selectedModel.includes("MiniMax") &&
                    selectedModel !== "I2V-01-Director" &&
                    selectedModel !== "S2V-01" && (
                      <div className="relative">
                        <button
                          className="md:p-2  pt-2 pl-1 rounded-xl transition-all duration-200 cursor-pointer group relative"
                          onClick={() => {
                            setUploadModalType('image');
                            setUploadModalTarget('first_frame');
                            setIsUploadModalOpen(true);
                          }}
                        >
                          <div className=" relative ">
                            <FilePlus2 size={30} className={`rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110 ${uploadedImages.length > 0 ? 'text-blue-300 bg-white/20' : ''}`} />
                            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50"> First Frame </div>
                          </div>
                        </button>
                      </div>
                    )}

                  {/* MiniMax/I2V-01-Director Image Uploads - Show when model requires first frame */}
                  {((selectedModel.includes("MiniMax") || selectedModel === "I2V-01-Director") &&
                    (currentModelCapabilities.requiresFirstFrame || currentModelCapabilities.supportsImageToVideo)) && (
                      <div className="relative">
                        <button
                          className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                          onClick={() => {
                            setUploadModalType('image');
                            setUploadModalTarget('first_frame');
                            setIsUploadModalOpen(true);
                          }}
                        >
                          <div className="relative">
                            <FilePlus2 size={30} className={`rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110 ${uploadedImages.length > 0 ? 'text-blue-300 bg-white/20' : ''}`} />
                            <div className={newLocal}> First Frame </div>
                          </div>
                        </button>

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

                  {/* Arrow icon between first and last frame uploads */}
                  {selectedModel === "MiniMax-Hailuo-02" &&
                    (selectedResolution === "768P" || selectedResolution === "1080P") &&
                    currentModelCapabilities.supportsImageToVideo && (
                      <div className="flex items-center justify-center">
                        <Image
                          src="/icons/arrow-right-left.svg"
                          alt="Arrow"
                          width={16}
                          height={16}
                          className="opacity-80 mr-1 -ml-1  "
                        />
                      </div>
                    )}

                  {/* Last Frame Image Upload for MiniMax-Hailuo-02 (768P/1080P) */}
                  {selectedModel === "MiniMax-Hailuo-02" &&
                    (selectedResolution === "768P" || selectedResolution === "1080P") &&
                    currentModelCapabilities.supportsImageToVideo && (
                      <div className="relative ">
                        <button
                          className="p-2 rounded-xl transition-all duration-200 cursor-pointer group relative"
                          onClick={() => {
                            setUploadModalType('image');
                            setUploadModalTarget('last_frame');
                            setIsUploadModalOpen(true);
                          }}
                        >
                          <div className="relative">
                            <FilePlus2 size={30} className={`rounded-md p-1.5 text-white transition-all bg-white/10 duration-200 group-hover:text-blue-300 group-hover:scale-110 ${lastFrameImage ? 'text-blue-300 bg-white/20' : ''}`} />
                            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50"> Last Frame (optional)</div>
                          </div>
                        </button>
                      </div>
                    )}

                  {/* Video Upload (for video-to-video models) */}
                  {(currentModelCapabilities.supportsVideoToVideo || selectedModel === "wan-2.2-animate-replace") && (
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
                            {selectedModel === "wan-2.2-animate-replace" && activeFeature === 'Animate' ? 'Upload video (mandatory)' : 'Upload video'}
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Character Image Upload (for WAN 2.2 Animate Replace) */}
                  {(selectedModel === "wan-2.2-animate-replace" || (activeFeature === 'Animate' && selectedModel.includes("wan-2.2"))) && (
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
                  )}

                </div>
              </div>

            </div>


          </div>

          {/* Uploaded Content Display */}
          <div className="px-3 md:pb-3 pb-0">
            {/* Uploaded Images */}
            {(uploadedImages.length > 0 || (!!lastFrameImage && selectedModel === "MiniMax-Hailuo-02" && ["768P", "1080P"].includes(selectedResolution) && currentModelCapabilities.supportsImageToVideo)) && (
              <div className="md:mb-3 -mb-6">
                <div className="text-xs text-white/60 mb-2">Uploaded Images ({uploadedImages.length + (!!lastFrameImage && selectedModel === "MiniMax-Hailuo-02" && ["768P", "1080P"].includes(selectedResolution) && currentModelCapabilities.supportsImageToVideo ? 1 : 0)})</div>
                <div className="flex gap-2 flex-wrap">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                        onClick={() => {
                          setAssetViewer({
                            isOpen: true,
                            assetUrl: image,
                            assetType: 'image',
                            title: `Uploaded Image ${index + 1}`
                          });
                        }}
                      >
                        <img
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-full object-cover"
                          onLoad={() => console.log('Video generation - image loaded successfully:', image)}
                          onError={(e) => console.error('Video generation - image failed to load:', image, e)}
                        />
                        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50">
                          {index === 0 ? 'First Frame' : `Image ${index + 1}`}
                        </div>
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

                  {/* Last Frame Image Display */}
                  {!!lastFrameImage && selectedModel === "MiniMax-Hailuo-02" && ["768P", "1080P"].includes(selectedResolution) && currentModelCapabilities.supportsImageToVideo && (
                    <div className="relative group">
                      <div
                        className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                        onClick={() => {
                          setAssetViewer({
                            isOpen: true,
                            assetUrl: lastFrameImage,
                            assetType: 'image',
                            title: 'Last Frame Image'
                          });
                        }}
                      >
                        <img
                          src={lastFrameImage}
                          alt="Last Frame"
                          className="w-full h-full object-cover"
                        />
                        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50">Last Frame</div>
                      </div>
                      <button
                        aria-label="Remove last frame"
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        onClick={() => {
                          setLastFrameImage("");
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Uploaded Video */}
            {uploadedVideo && (
              <div className="md:mb-3 mb-0">
                <div className="text-xs text-white/60 mb-2">Uploaded Video</div>
                <div className="relative group w-fit">
                  <div
                    className="w-32 h-20 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer bg-white/5"
                    onClick={() => {
                      setAssetViewer({
                        isOpen: true,
                        assetUrl: uploadedVideo,
                        assetType: 'video',
                        title: 'Uploaded Video'
                      });
                    }}
                  >
                    {(() => {
                      // Handle blob URLs directly, otherwise use proxy
                      const isBlob = uploadedVideo.startsWith('blob:') || uploadedVideo.startsWith('data:');
                      const videoSrc = isBlob ? uploadedVideo : toFrontendProxyMediaUrl(uploadedVideo);

                      return (
                        <video
                          src={videoSrc}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                          preload="metadata"
                          onMouseEnter={(e) => {
                            const video = e.currentTarget;
                            video.play().catch(err => console.error('Video preview play failed:', err));
                          }}
                          onMouseLeave={(e) => {
                            const video = e.currentTarget;
                            video.pause();
                            video.currentTime = 0;
                          }}
                        />
                      );
                    })()}
                  </div>

                  {/* Tooltip - Positioned outside overflow-hidden container */}
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50">
                    Uploaded Video
                  </div>

                  {/* Delete Button - Positioned at corner */}
                  <button
                    aria-label="Remove video"
                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-50 shadow-md hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedVideo("");
                      setSourceHistoryEntryId(""); // Clear source history entry when clearing video
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Uploaded Character Image (for WAN 2.2 Animate Replace) */}
            {uploadedCharacterImage && (
              <div className="mb-3">
                <div className="text-xs text-white/60 mb-2">Character Image</div>
                <div className="relative group">
                  <div
                    className="w-32 h-32 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                    onClick={() => {
                      setAssetViewer({
                        isOpen: true,
                        assetUrl: uploadedCharacterImage,
                        assetType: 'image',
                        title: 'Character Image'
                      });
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

          {/* Bottom row: pill options */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 px-3 pb-3">
            {/* Mobile: First row - Model dropdown and Generate button */}
            <div className="flex md:hidden justify-between items-center gap-2 w-full">
              <div className="flex-1 flex items-center gap-2 mt-10">
                <VideoModelsDropdown
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  generationMode={generationMode}
                  selectedDuration={selectedModel.includes("MiniMax") ? `${selectedMiniMaxDuration}s` : `${duration}s`}
                  selectedResolution={(creditsResolution as any) ? String(creditsResolution).toLowerCase() : undefined}
                  activeFeature={activeFeature}
                  onCloseOtherDropdowns={() => {
                    setCloseFrameSizeDropdown(true);
                    setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                    setCloseDurationDropdown(true);
                    setTimeout(() => setCloseDurationDropdown(false), 0);
                  }}
                  onCloseThisDropdown={closeModelsDropdown ? () => { } : undefined}
                />
                {/* Audio toggle button for models that support it (mobile only) */}
                {((selectedModel.includes("sora2") && !selectedModel.includes("v2v")) ||
                  selectedModel.includes('ltx2') ||
                  (selectedModel.includes("veo3.1") && !(activeFeature === 'Lipsync' && selectedModel.includes("veo3.1"))) ||
                  (selectedModel.includes("veo3") && !selectedModel.includes("veo3.1"))) && (
                    <button
                      onClick={() => setGenerateAudio(v => !v)}
                      className={`group md:h-[32px] h-[28px] md:w-[32px] w-[28px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative flex-shrink-0 ${generateAudio
                        ? 'bg-transparent text-white '
                        : 'bg-transparent text-white hover:bg-white/20 hover:text-white/80'
                        }`}
                    >
                      <div className="relative">
                        {generateAudio ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
                        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-7 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                          {generateAudio ? 'Audio: On' : 'Audio: Off'}
                        </div>
                      </div>
                    </button>
                  )}
                {/* Audio upload button for WAN 2.5 models (mobile only) */}
                {selectedModel.includes("wan-2.5") && selectedModel !== "wan-2.2-animate-replace" && !selectedModel.includes("wan-2.2") && (
                  <div className="relative flex-shrink-0">
                    <input
                      type="file"
                      accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                      onChange={handleAudioUpload}
                      className="hidden"
                      id="audio-upload-wan-mobile"
                    />
                    <label
                      htmlFor="audio-upload-wan-mobile"
                      className="md:h-[32px] h-[28px] md:px-3 px-2 rounded-lg md:text-[12px] text-[10px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Music className="md:w-3.5 w-3 h-3 md:h-3.5" />
                      {uploadedAudio ? 'Uploaded' : 'Audio'}
                    </label>
                    {uploadedAudio && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedAudio("");
                          toast.success('Audio file removed');
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-xs"
                        title="Remove audio"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 pt-4">
                <div className="text-white/80 md:text-sm text-xs">
                  Total credits: <span className="font-semibold">{liveCreditCost}</span>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={(() => {
                    const disabled = isGenerating || !prompt.trim() ||
                      (generationMode === "image_to_video" && selectedModel !== "S2V-01" && !selectedModel.includes("wan-2.5") && !selectedModel.startsWith('kling-') && selectedModel !== "gen4_turbo" && selectedModel !== "gen3a_turbo" && uploadedImages.length === 0) ||
                      (generationMode === "video_to_video" && !uploadedVideo) ||
                      (generationMode === "image_to_video" && selectedModel === "I2V-01-Director" && uploadedImages.length === 0) ||
                      (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length === 0) ||
                      (generationMode === "image_to_video" && selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && uploadedImages.length === 0) ||
                      (generationMode === "image_to_video" && selectedModel.includes("wan-2.5") && uploadedImages.length === 0);
                    return disabled;
                  })()}
                  className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white md:px-4 px-2 md:py-2.5 py-1.5 rounded-lg md:text-sm text-[11px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>

            {/* Desktop: Original layout */}
            <div className="hidden md:flex flex-col gap-3 flex-wrap">
              {/* Model selector */}
              <VideoModelsDropdown
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                generationMode={generationMode}
                selectedDuration={selectedModel.includes("MiniMax") ? `${selectedMiniMaxDuration}s` : `${duration}s`}
                selectedResolution={(creditsResolution as any) ? String(creditsResolution).toLowerCase() : undefined}
                activeFeature={activeFeature}
                onCloseOtherDropdowns={() => {
                  // Close frame size dropdown
                  setCloseFrameSizeDropdown(true);
                  setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                  // Close duration dropdown
                  setCloseDurationDropdown(true);
                  setTimeout(() => setCloseDurationDropdown(false), 0);
                }}
                onCloseThisDropdown={closeModelsDropdown ? () => { } : undefined}
              />


              {/* Dynamic Controls Based on Model Capabilities */}
              {(() => {
                // WAN 2.2 Animate Replace: Resolution, Refert Num, Go Fast, Merge Audio, FPS, Seed
                // MUST BE FIRST CHECK to prevent other controls from showing
                const isWanAnimateReplace = selectedModel === "wan-2.2-animate-replace" ||
                  (activeFeature === 'Animate' && selectedModel &&
                    (selectedModel.includes("wan-2.2") || selectedModel.includes("animate-replace")));

                if (isWanAnimateReplace) {
                  return (
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
                  );
                }

                // Fixed Models: T2V-01, I2V-01, S2V-01 - No dropdowns, fixed 720P, 6s
                if (selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
                  return (
                    <div className="flex flex-row gap-2">
                      {/* Fixed Resolution Display */}
                      <div className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                        <TvMinimalPlay className="w-4 h-4 mr-1" />
                        720P (Fixed)
                      </div>
                      {/* Fixed Duration Display */}
                      <div className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                        <Clock className="w-4 h-4 mr-1" />
                        6s (Fixed)
                      </div>
                    </div>
                  );
                }

                // Sora 2 Models: Full customization (check before Veo 3.1)
                if (selectedModel.includes("sora2") && !selectedModel.includes("v2v")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for Sora 2 models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Resolution - Use unified ResolutionDropdown for Sora 2 */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close frame size dropdown
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                      {/* Audio toggle for Sora 2 */}
                      <button
                        onClick={() => setGenerateAudio(v => !v)}
                        className={`group h-[32px] w-[32px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative ${generateAudio
                          ? 'bg-transparent text-white '
                          : 'bg-transparent text-white hover:bg-white/20 hover:text-white/80'
                          }`}
                      >
                        <div className="relative">
                          {generateAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-7 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                            {generateAudio ? 'Audio: On' : 'Audio: Off'}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // LTX V2 Models: Resolution + Duration (T2V fixed 16:9)
                if (selectedModel.includes('ltx2')) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - For I2V allow user selection; for T2V, fixed 16:9 */}
                      {generationMode === 'image_to_video' ? (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={setFrameSize}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true); setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseDurationDropdown(true); setTimeout(() => setCloseDurationDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                        />
                      ) : (
                        <div className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          16:9 (Fixed)
                        </div>
                      )}
                      {/* Resolution - LTX V2 supports 1080p/1440p/2160p */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={(selectedResolution.toLowerCase?.() || '1080p')}
                        onResolutionChange={setSelectedResolution as any}
                      />
                      {/* Duration - 6/8/10s */}
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true); setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true); setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                      {/* FPS selector for LTX V2 */}
                      <div className="relative">
                        <button
                          onClick={() => {/* simple toggle between 25 and 50 */ setFps(prev => prev === 25 ? 50 : 25); }}
                          className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-transparent  text-white"
                        >
                          FPS: {fps}
                        </button>
                      </div>
                      {/* Audio toggle for LTX V2 */}
                      <button
                        onClick={() => setGenerateAudio(v => !v)}
                        className={`group h-[32px] w-[32px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative ${generateAudio
                          ? 'bg-transparent text-white '
                          : 'bg-transparent text-white hover:bg-white/20 hover:text-white/80'
                          }`}
                      >
                        <div className="relative">
                          {generateAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-7 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                            {generateAudio ? 'Audio: On' : 'Audio: Off'}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // Veo 3.1 Models: Full customization (check before Veo3)
                if (selectedModel.includes("veo3.1")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for Veo 3.1 models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Resolution - Veo 3.1 uses 720p/1080p */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close frame size dropdown
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                      {/* Audio toggle for Veo 3.1 - Hide in Lipsync feature */}
                      {!(activeFeature === 'Lipsync' && selectedModel.includes("veo3.1")) && (
                        <button
                          onClick={() => setGenerateAudio(v => !v)}
                          className={`group h-[32px] w-[32px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative ${generateAudio
                            ? 'bg-transparent text-white '
                            : 'bg-transparent text-white hover:bg-white/20 hover:text-white/80'
                            }`}
                        >
                          <div className="relative">
                            {generateAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-7 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                              {generateAudio ? 'Audio: On' : 'Audio: Off'}
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  );
                }

                // Veo3 Models: Full customization (check after Veo 3.1)
                if (selectedModel.includes("veo3") && !selectedModel.includes("veo3.1")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for Veo3 models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Resolution - Veo3 uses 720p/1080p */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close frame size dropdown
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                      {/* Audio toggle for Veo 3 */}
                      <button
                        onClick={() => setGenerateAudio(v => !v)}
                        className={`group h-[32px] w-[32px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative ${generateAudio
                          ? 'bg-transparent text-white '
                          : 'bg-transparent text-white hover:bg-white/20 hover:text-white/80'
                          }`}
                      >
                        <div className="relative">
                          {generateAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-7 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                            {generateAudio ? 'Audio: On' : 'Audio: Off'}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // Kling Models: Full customization
                if (selectedModel.startsWith('kling-')) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for Kling models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Mode - Only for Kling v2.1 base (standard/pro), not master variant */}
                      {selectedModel.includes('kling-v2.1') && !selectedModel.includes('master') && (
                        <KlingModeDropdown
                          value={klingMode}
                          onChange={setKlingMode}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close frame size dropdown
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                            // Close duration dropdown
                            setCloseDurationDropdown(true);
                            setTimeout(() => setCloseDurationDropdown(false), 0);
                          }}
                        />
                      )}
                      {/* Duration - Always shown for Kling models */}
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close frame size dropdown
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                // WAN 2.5 Models: Full customization (exclude wan-2.2-animate-replace)
                if (selectedModel.includes("wan-2.5") && selectedModel !== "wan-2.2-animate-replace" && !selectedModel.includes("wan-2.2")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for WAN models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Duration - Always shown for WAN models */}
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close frame size dropdown
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                      {/* Audio Upload - Only for WAN models */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                          onChange={handleAudioUpload}
                          className="hidden"
                          id="audio-upload-wan"
                        />
                        <label
                          htmlFor="audio-upload-wan"
                          className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-2 transition-all"
                        >
                          <Music className="w-4 h-4" />
                          {uploadedAudio ? 'Audio: Uploaded' : 'Upload Audio'}
                        </label>
                        {uploadedAudio && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedAudio("");
                              toast.success('Audio file removed');
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-xs"
                            title="Remove audio"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // Seedance Models: Full customization
                if (selectedModel.includes("seedance")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Only shown for T2V (ignored for I2V) */}
                      {generationMode === "text_to_video" && (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={setFrameSize}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close duration dropdown
                            setCloseDurationDropdown(true);
                            setTimeout(() => setCloseDurationDropdown(false), 0);
                            // Close quality dropdown (for Seedance)
                            // QualityDropdown handles its own state
                          }}
                          onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                        />
                      )}
                      {/* Quality - Always shown for Seedance models */}
                      <QualityDropdown
                        selectedModel={selectedModel}
                        selectedQuality={seedanceResolution}
                        onQualityChange={setSeedanceResolution}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close frame size dropdown
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={undefined}
                      />
                      {/* Duration - Always shown for Seedance models */}
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close frame size dropdown
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          // Close quality dropdown (for Seedance)
                          // QualityDropdown handles its own state
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                // PixVerse Models: Full customization
                if (selectedModel.includes("pixverse")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for PixVerse models (both T2V and I2V) */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                          // Close quality dropdown
                          // QualityDropdown handles its own state
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Quality - Always shown for PixVerse models */}
                      <QualityDropdown
                        selectedModel={selectedModel}
                        selectedQuality={pixverseQuality}
                        onQualityChange={setPixverseQuality}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close frame size dropdown
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={undefined}
                      />
                      {/* Duration - Always shown for PixVerse models */}
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close frame size dropdown
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          // Close quality dropdown
                          // QualityDropdown handles its own state
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                // Runway Models: Full customization (exclude wan-2.2-animate-replace)
                if ((selectedModel.includes("gen4") || selectedModel.includes("gen3a")) &&
                  selectedModel !== "wan-2.2-animate-replace" &&
                  !selectedModel.includes("wan-2.2-animate")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for Runway models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close frame size dropdown
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                    </div>
                  );
                }

                // MiniMax & Director Models
                if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Resolution - For MiniMax models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={selectedResolution}
                        onFrameSizeChange={setSelectedResolution}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        miniMaxDuration={selectedMiniMaxDuration}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close duration dropdown
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {/* Duration - For MiniMax models */}
                      <VideoDurationDropdown
                        selectedDuration={selectedMiniMaxDuration}
                        onDurationChange={setSelectedMiniMaxDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          // Close models dropdown
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          // Close frame size dropdown
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {/* Mobile: Second row - All other dropdowns */}
            <div className="flex md:hidden flex-wrap gap-2 w-full">
              {/* Use the same dynamic controls logic as desktop - extract it to avoid duplication */}
              {(() => {
                // WAN 2.2 Animate Replace: Resolution, Refert Num, Go Fast, Merge Audio, FPS, Seed
                const isWanAnimateReplace = selectedModel === "wan-2.2-animate-replace" ||
                  (activeFeature === 'Animate' && selectedModel &&
                    (selectedModel.includes("wan-2.2") || selectedModel.includes("animate-replace")));

                if (isWanAnimateReplace) {
                  return (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex flex-row gap-2 flex-wrap">
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
                      </div>
                    </div>
                  );
                }

                if (selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
                  return (
                    <div className="flex flex-row gap-2">
                      <div className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                        <TvMinimalPlay className="w-4 h-4 mr-1" />
                        720P (Fixed)
                      </div>
                      <div className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                        <Clock className="w-4 h-4 mr-1" />
                        6s (Fixed)
                      </div>
                    </div>
                  );
                }

                if (selectedModel.includes("sora2") && !selectedModel.includes("v2v")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                    </div>
                  );
                }

                if (selectedModel.includes('ltx2')) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {generationMode === 'image_to_video' ? (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={setFrameSize}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true); setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseDurationDropdown(true); setTimeout(() => setCloseDurationDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                        />
                      ) : (
                        <div className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          16:9 (Fixed)
                        </div>
                      )}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={(selectedResolution.toLowerCase?.() || '1080p')}
                        onResolutionChange={setSelectedResolution as any}
                      />
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true); setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true); setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                      {/* Audio toggle for LTX V2 */}
                      <button
                        onClick={() => setGenerateAudio(v => !v)}
                        className={`group h-[32px] w-[32px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative ${generateAudio
                          ? 'bg-transparent text-white '
                          : 'bg-transparent text-white hover:bg-white/20 hover:text-white/80'
                          }`}
                      >
                        <div className="relative">
                          {generateAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-7 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                            {generateAudio ? 'Audio: On' : 'Audio: Off'}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                if (selectedModel.includes("veo3.1")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                    </div>
                  );
                }

                if (selectedModel.includes("veo3") && !selectedModel.includes("veo3.1")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                      {/* Audio toggle for Veo 3 */}
                      <button
                        onClick={() => setGenerateAudio(v => !v)}
                        className={`group h-[32px] w-[32px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative ${generateAudio
                          ? 'bg-transparent text-white '
                          : 'bg-transparent text-white hover:bg-white/20 hover:text-white/80'
                          }`}
                      >
                        <div className="relative">
                          {generateAudio ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-7 mt-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                            {generateAudio ? 'Audio: On' : 'Audio: Off'}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                if (selectedModel.startsWith('kling-')) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {selectedModel.includes('kling-v2.1') && !selectedModel.includes('master') && (
                        <KlingModeDropdown
                          value={klingMode}
                          onChange={setKlingMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                            setCloseDurationDropdown(true);
                            setTimeout(() => setCloseDurationDropdown(false), 0);
                          }}
                        />
                      )}
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                if (selectedModel.includes("wan-2.5") && selectedModel !== "wan-2.2-animate-replace" && !selectedModel.includes("wan-2.2")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                if (selectedModel.includes("seedance")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {generationMode === "text_to_video" && (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={setFrameSize}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseDurationDropdown(true);
                            setTimeout(() => setCloseDurationDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                        />
                      )}
                      <QualityDropdown
                        selectedModel={selectedModel}
                        selectedQuality={seedanceResolution}
                        onQualityChange={setSeedanceResolution}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={undefined}
                      />
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                if (selectedModel.includes("pixverse")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      <QualityDropdown
                        selectedModel={selectedModel}
                        selectedQuality={pixverseQuality}
                        onQualityChange={setPixverseQuality}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={undefined}
                      />
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                if ((selectedModel.includes("gen4") || selectedModel.includes("gen3a")) &&
                  selectedModel !== "wan-2.2-animate-replace" &&
                  !selectedModel.includes("wan-2.2-animate")) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={setFrameSize}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      {(generationMode === "image_to_video" || generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                          }}
                          onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                        />
                      )}
                    </div>
                  );
                }

                if (selectedModel.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={selectedResolution}
                        onFrameSizeChange={setSelectedResolution}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        miniMaxDuration={selectedMiniMaxDuration}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseDurationDropdown(true);
                          setTimeout(() => setCloseDurationDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeFrameSizeDropdown ? () => { } : undefined}
                      />
                      <VideoDurationDropdown
                        selectedDuration={selectedMiniMaxDuration}
                        onDurationChange={setSelectedMiniMaxDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={closeDurationDropdown ? () => { } : undefined}
                      />
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {/* Desktop: Generate button section */}
            <div className="hidden md:flex flex-col items-end gap-2 mt-2">
              {error && <div className="text-red-500 text-sm">{error}</div>}

              <div className="text-white/80 text-sm pr-1">
                Total credits: <span className="font-semibold">{liveCreditCost}</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={(() => {
                  const disabled = isGenerating || !prompt.trim() ||
                    (generationMode === "image_to_video" && selectedModel !== "S2V-01" && !selectedModel.includes("wan-2.5") && !selectedModel.startsWith('kling-') && selectedModel !== "gen4_turbo" && selectedModel !== "gen3a_turbo" && uploadedImages.length === 0) ||
                    (generationMode === "video_to_video" && !uploadedVideo) ||
                    (generationMode === "image_to_video" && selectedModel === "I2V-01-Director" && uploadedImages.length === 0) ||
                    (generationMode === "image_to_video" && selectedModel === "S2V-01" && references.length === 0) ||
                    (generationMode === "image_to_video" && selectedModel === "MiniMax-Hailuo-02" && selectedResolution === "512P" && uploadedImages.length === 0) ||
                    (generationMode === "image_to_video" && selectedModel.includes("wan-2.5") && uploadedImages.length === 0);

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
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2.5 rounded-lg text-[15px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
              >
                {isGenerating ? "Generating..." : "Generate Video"}
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

      {/* Asset Viewer Modal for uploaded assets */}
      <AssetViewerModal
        isOpen={assetViewer.isOpen}
        onClose={() => setAssetViewer(prev => ({ ...prev, isOpen: false }))}
        assetUrl={assetViewer.assetUrl}
        assetType={assetViewer.assetType}
        title={assetViewer.title}
      />

      {/* UploadModal for image and reference uploads */}
      {uploadModalType !== 'video' && (() => {
        // Use libraryImageEntries if available, otherwise fall back to imageHistoryEntries
        // Always create a new array reference to ensure React detects changes
        // When modal is open, always use libraryImageEntries (even if empty initially)
        // This ensures we show the fetched data once it loads
        const modalHistoryEntries = isUploadModalOpen
          ? [...libraryImageEntries]
          : (libraryImageEntries.length > 0 ? [...libraryImageEntries] : [...imageHistoryEntries]);

        // Log what's being passed to the modal (only when modal is open to avoid spam)
        if (isUploadModalOpen && libraryImageEntries.length > 0) {
          console.log('[VideoPage] UploadModal historyEntries prop:', {
            source: 'libraryImageEntries',
            count: modalHistoryEntries.length,
            libraryImageEntriesCount: libraryImageEntries.length,
            imageHistoryEntriesCount: imageHistoryEntries.length,
            entriesWithImages: modalHistoryEntries.filter((e: any) => Array.isArray(e.images) && e.images.length > 0).length,
            sample: modalHistoryEntries.slice(0, 3).map((e: any) => ({
              id: e.id,
              imagesCount: e.images?.length || 0,
              hasImages: Array.isArray(e.images) && e.images.length > 0,
              firstImageUrl: e.images?.[0]?.url?.substring(0, 50) + '...'
            }))
          });
        }

        return (
          <UploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onAdd={handleImageUploadFromModal}
            remainingSlots={uploadModalType === 'image' ?
              // For WAN 2.2 Animate Replace character image, only 1 slot
              ((selectedModel === "wan-2.2-animate-replace" || (activeFeature === 'Animate' && selectedModel.includes("wan-2.2"))) ? 1 :
                (selectedModel === "S2V-01" ? 0 : 1)) : // S2V-01 doesn't use uploadedImages
              (generationMode === "image_to_video" && selectedModel === "S2V-01" ? 1 : 4) // S2V-01 needs 1 reference, video-to-video needs up to 4
            }
          />
        );
      })()}

      {/* VideoUploadModal for video uploads */}
      {uploadModalType === 'video' && (
        <VideoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAdd={handleImageUploadFromModal}
          remainingSlots={1} // Only 1 video for video-to-video
        />
      )}
    </React.Fragment>
  );
};

export default InputBox;