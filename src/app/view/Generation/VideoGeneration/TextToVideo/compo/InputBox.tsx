"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import Link from "next/link";
import CameraMovementButton from "./CameraMovementButton";
import PromptInput from "./PromptInput";
import InputActions from "./InputActions";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { HistoryEntry } from "@/types/history";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { shallowEqual } from "react-redux";
import {
  addHistoryEntry,
  loadHistory,
  loadMoreHistory,
  updateHistoryEntry,
  clearFilters,
  removeHistoryEntry,
  clearHistory,
  setFilters,
} from "@/store/slices/historySlice";
import {
  addActiveGeneration,
  updateActiveGeneration,
  removeActiveGeneration,
} from "@/store/slices/generationSlice";
import useHistoryLoader from "@/hooks/useHistoryLoader";
import axiosInstance from "@/lib/axiosInstance";
import { Trash2 } from "lucide-react";
import { addNotification } from "@/store/slices/uiSlice";
import ActiveGenerationsPanel from "@/app/view/Generation/ImageGeneration/TextToImage/compo/ActiveGenerationsPanel";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { getSignInUrl } from "@/routes/routes";
// historyService removed; backend owns history persistence
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateFirebaseHistory = async (_id: string, _updates: any) => {};
const getHistoryEntries = async (_filters?: any, _pag?: any) =>
  ({ data: [] }) as any;
import { waitForRunwayVideoCompletion } from "@/lib/runwayVideoService";
import {
  buildImageToVideoBody,
  buildVideoToVideoBody,
} from "@/lib/videoGenerationBuilders";
import { uploadGeneratedVideo, uploadLocalVideoFile } from "@/lib/videoUpload";
import { saveUpload } from "@/lib/libraryApi";
import { VideoGenerationState, GenMode } from "@/types/videoGeneration";
import {
  FilePlay,
  FileSliders,
  Crop,
  Clock,
  TvMinimalPlay,
  ChevronUp,
  FilePlus2,
  Music,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Scan,
} from "lucide-react";
import { MINIMAX_MODELS, MiniMaxModelType } from "@/lib/minimaxTypes";
import { getApiClient } from "@/lib/axiosInstance";
import { extractFalErrorDetails, extractFalErrorMessage } from "@/lib/falToast";
import { useGenerationCredits } from "@/hooks/useCredits";
import UploadModal from "@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal";
import VideoUploadModal from "./VideoUploadModal";
import { getVideoCreditCost } from "@/utils/creditValidation";
import { enhancePromptAPI } from "@/lib/api/geminiApi";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";

// Extend window interface for temporary video data storage
declare global {
  interface Window {
    miniMaxVideoData?: any;
  }
}

// Import the video-specific components
import VideoModelsDropdown from "./VideoModelsDropdown";
import SeedanceFamilyVariantDropdown from "./SeedanceFamilyVariantDropdown";
import VeoFamilyVariantDropdown from "./VeoFamilyVariantDropdown";
import KlingFamilyVariantDropdown from "./KlingFamilyVariantDropdown";
import HailuoFamilyVariantDropdown from "./HailuoFamilyVariantDropdown";
import SoraFamilyVariantDropdown from "./SoraFamilyVariantDropdown";
import LtxFamilyVariantDropdown from "./LtxFamilyVariantDropdown";
import WanFamilyVariantDropdown from "./WanFamilyVariantDropdown";
import PixverseFamilyVariantDropdown from "./PixverseFamilyVariantDropdown";
import PixverseV6StyleDropdown from "./PixverseV6StyleDropdown";
import PortalHoverTooltip from "./PortalHoverTooltip";
import ResolutionDropdown from "./ResolutionDropdown";
import CameraMotionDropdown from "./CameraMotionDropdown";
import VideoFrameSizeDropdown from "./VideoFrameSizeDropdown";
import VideoDurationDropdown from "./VideoDurationDropdown";
import QualityDropdown from "./QualityDropdown";
import VideoGenerationGuide from "./VideoGenerationGuide";
import KlingModeDropdown from "./KlingModeDropdown";
import VideoPreviewModal from "./VideoPreviewModal";
import { toThumbUrl } from "@/lib/thumb";
import { usePersistedGenerationState } from "@/hooks/usePersistedGenerationState";
import { useQueueManagement } from "@/hooks/useQueueManagement";
import AssetViewerModal from "@/components/AssetViewerModal";
import {
  toProxyPath,
  toFrontendProxyMediaUrl,
  normalizeGenerationType,
  isVideoType,
  isVideoUrl,
  convertFrameSizeToRunwayRatio,
  convertFrameSizeToMiniMaxResolution,
  waitForMiniMaxVideoCompletion,
  getCleanPrompt,
  copyPrompt,
  getModelCapabilities,
} from "../utils/videoUtils";
import HistorySection from "./HistorySection";
import { useFileHandler } from "../hooks/useFileHandler";
import { useUrlParamsSync } from "../hooks/useUrlParamsSync";

interface InputBoxProps {
  placeholder?: string;
  activeFeature?: "Video" | "Lipsync" | "Animate" | "Edit" | "Video editor";
  showHistory?: boolean; // Control whether to show the history section
}

type VideoDurationValue = number | "auto";

const VEO_31_STANDARD_MODEL = "veo3.1-t2v-8s";
const VEO_31_LITE_MODEL = "veo3.1-lite-t2v-8s";
const VEO_31_FAST_MODEL = "veo3.1-fast-t2v-8s";
const HAPPY_HORSE_MODEL = "alibaba/happy-horse";
const HAPPY_HORSE_T2V_MODEL = "alibaba/happy-horse/text-to-video";
const HAPPY_HORSE_I2V_MODEL = "alibaba/happy-horse/image-to-video";
const HAPPY_HORSE_R2V_MODEL = "alibaba/happy-horse/reference-to-video";
const HAPPY_HORSE_EDIT_MODEL = "alibaba/happy-horse/edit-video";
const KLING_O1_MODEL = "kling-o1";
const KLING_3_STANDARD_MODEL = "kling-v3-standard";
const KLING_3_PRO_MODEL = "kling-v3-pro";
const KLING_26_PRO_MODEL = "kling-2.6-pro";
const KLING_25_TURBO_PRO_MODEL = "kling-v2.5-turbo-pro-t2v";
const HAILUO_23_MODEL = "MiniMax-Hailuo-2.3";
const HAILUO_23_FAST_MODEL = "MiniMax-Hailuo-2.3-Fast";
const SORA_2_MODEL = "sora2-t2v";
const SORA_2_PRO_MODEL = "sora2-pro-t2v";
const LTX_23_PRO_MODEL = "ltx-2.3-pro-t2v";
const LTX_23_FAST_MODEL = "ltx-2.3-fast-t2v";
const WAN_25_MODEL = "wan-2.5-t2v";
const WAN_25_FAST_MODEL = "wan-2.5-t2v-fast";
const PIXVERSE_V6_T2V_MODEL = "pixverse-v6-t2v";
const PIXVERSE_V6_I2V_MODEL = "pixverse-v6-i2v";
const PIXVERSE_V5_T2V_MODEL = "pixverse-v5-t2v";
const PIXVERSE_V5_I2V_MODEL = "pixverse-v5-i2v";
const SEEDANCE_2_MODEL = "seedance-2.0-t2v";
const SEEDANCE_2_REFERENCE_MODEL = "seedance-2.0-r2v";
const SEEDANCE_2_FAST_MODEL = "seedance-2.0-fast";
const SEEDANCE_2_FAST_T2V_MODEL = "seedance-2.0-fast-t2v";
const SEEDANCE_2_FAST_I2V_MODEL = "seedance-2.0-fast-i2v";
const SEEDANCE_2_FAST_REFERENCE_MODEL = "seedance-2.0-fast-r2v";

const isSeedance2ReferenceModel = (model: string) =>
  model === SEEDANCE_2_REFERENCE_MODEL ||
  model === SEEDANCE_2_FAST_REFERENCE_MODEL;

const isSeedance2FastReferenceModel = (model: string) =>
  model === SEEDANCE_2_FAST_REFERENCE_MODEL;

const isSeedance2FastModel = (model: string) =>
  model === SEEDANCE_2_FAST_MODEL ||
  model === SEEDANCE_2_FAST_T2V_MODEL ||
  model === SEEDANCE_2_FAST_I2V_MODEL;

const isSeedance2FamilyModel = (model: string) =>
  model === SEEDANCE_2_MODEL ||
  model === SEEDANCE_2_REFERENCE_MODEL ||
  isSeedance2FastModel(model) ||
  isSeedance2FastReferenceModel(model);

const isSeedanceFamilyModel = (model: string) => model.includes("seedance");
const isVeo31FamilyModel = (model: string) => model.includes("veo3.1");
const isKlingFamilyModel = (model: string) =>
  model === KLING_O1_MODEL ||
  model === KLING_3_STANDARD_MODEL ||
  model === KLING_3_PRO_MODEL ||
  model === KLING_26_PRO_MODEL ||
  model === KLING_25_TURBO_PRO_MODEL;
const isHailuoFamilyModel = (model: string) =>
  model === HAILUO_23_MODEL || model === HAILUO_23_FAST_MODEL;
const isSoraFamilyModel = (model: string) =>
  model === SORA_2_MODEL || model === SORA_2_PRO_MODEL;
const isLtxFamilyModel = (model: string) =>
  model === LTX_23_PRO_MODEL || model === LTX_23_FAST_MODEL;
const isWanFamilyModel = (model: string) =>
  model === WAN_25_MODEL || model === WAN_25_FAST_MODEL;
const isHappyHorseFamilyModel = (model: string) =>
  model === HAPPY_HORSE_MODEL || model.startsWith("alibaba/happy-horse/");

const isPixverseFamilyModel = (model: string) =>
  model === PIXVERSE_V6_T2V_MODEL ||
  model === PIXVERSE_V6_I2V_MODEL ||
  model === PIXVERSE_V5_T2V_MODEL ||
  model === PIXVERSE_V5_I2V_MODEL;

const shouldShowSecondaryFamilySelector = (model: string) =>
  isSeedanceFamilyModel(model) ||
  isVeo31FamilyModel(model) ||
  isKlingFamilyModel(model) ||
  isHailuoFamilyModel(model) ||
  isSoraFamilyModel(model) ||
  isLtxFamilyModel(model) ||
  isWanFamilyModel(model) ||
  isHappyHorseFamilyModel(model) ||
  isPixverseFamilyModel(model);

const isSeedance2TextModel = (model: string) =>
  model === SEEDANCE_2_MODEL ||
  model === SEEDANCE_2_REFERENCE_MODEL ||
  model === SEEDANCE_2_FAST_MODEL ||
  model === SEEDANCE_2_FAST_T2V_MODEL ||
  isSeedance2FastReferenceModel(model);

const getMaxVideoSize = (model: string) => {
  if (isSeedance2FamilyModel(model)) {
    return 50 * 1024 * 1024; // FAL enforces 50MB for Seedance
  }
  return 500 * 1024 * 1024; // Others up to 500MB as requested
};

const formatDurationForCreditLookup = (value: VideoDurationValue): string =>
  value === "auto" ? "auto" : `${value}s`;

const SEEDANCE_VARIANT_OPTIONS = [
  {
    value: "seedance-1.0-lite-t2v",
    label: "1.0 Lite",
    info: "Image, Text, FFLF to video",
  },
  {
    value: "seedance-1.0-pro-t2v",
    label: "1.0 Pro",
    info: "Image, Text, FFLF to video",
  },
  {
    value: "seedance-1.0-pro-fast-t2v",
    label: "1.0 Pro Fast",
    info: "Image, Text to video",
  },
  {
    value: "seedance-1.5-pro-t2v",
    label: "1.5 Pro",
    info: "Image, Text to video",
  },
  {
    value: SEEDANCE_2_MODEL,
    label: "2.0 Standard",
    info: "Image, Text, FFLF to video",
  },
  {
    value: SEEDANCE_2_FAST_MODEL,
    label: "2.0 Fast",
    info: "Image, Text, FFLF to video",
  },
  {
    value: SEEDANCE_2_REFERENCE_MODEL,
    label: "2.0 Reference",
    info: "Ref Img/Video/Audio to video",
  },
  {
    value: SEEDANCE_2_FAST_REFERENCE_MODEL,
    label: "2.0 Reference Fast",
    info: "Ref Img/Video/Audio to video",
  },
];

const VEO_31_VARIANT_OPTIONS = [
  {
    value: VEO_31_STANDARD_MODEL,
    label: "3.1 Standard",
    info: "Image, Text, FFLF to video",
  },
  {
    value: VEO_31_LITE_MODEL,
    label: "3.1 Lite",
    info: "Image, Text, FFLF to video",
  },
  {
    value: VEO_31_FAST_MODEL,
    label: "3.1 Fast",
    info: "Image, Text, FFLF to video",
  },
];

const KLING_VARIANT_OPTIONS = [
  {
    value: KLING_O1_MODEL,
    label: "o1",
    info: "Image, FFLF to video",
  },
  {
    value: KLING_3_STANDARD_MODEL,
    label: "3.0 Standard",
    info: "Image, Text to video",
  },
  {
    value: KLING_3_PRO_MODEL,
    label: "3.0 Pro",
    info: "Image, Text to video",
  },
  {
    value: KLING_26_PRO_MODEL,
    label: "2.6 Pro",
    info: "Image, Text to video",
  },
  {
    value: KLING_25_TURBO_PRO_MODEL,
    label: "2.5 Turbo Pro",
    info: "Image, Text to video",
  },
];

const HAILUO_VARIANT_OPTIONS = [
  {
    value: HAILUO_23_MODEL,
    label: "2.3",
    info: "Image, Text to video",
  },
  {
    value: HAILUO_23_FAST_MODEL,
    label: "2.3 Fast",
    info: "Image to video",
  },
];

const SORA_VARIANT_OPTIONS = [
  { value: SORA_2_MODEL, label: "2", info: "Image, Text to video" },
  { value: SORA_2_PRO_MODEL, label: "2 Pro", info: "Image, Text to video" },
];

const LTX_VARIANT_OPTIONS = [
  {
    value: LTX_23_PRO_MODEL,
    label: "2.3 Pro",
    info: "Image, Text, FFLF to video",
  },
  {
    value: LTX_23_FAST_MODEL,
    label: "2.3 Fast",
    info: "Image, Text, FFLF to video",
  },
];

const WAN_VARIANT_OPTIONS = [
  { value: WAN_25_MODEL, label: "2.5", info: "Image, Text to video" },
  { value: WAN_25_FAST_MODEL, label: "2.5 Fast", info: "Image, Text to video" },
];

const PIXVERSE_VARIANT_OPTIONS = [
  {
    value: PIXVERSE_V6_T2V_MODEL,
    label: "V6",
    info: "Text or first-frame video, 5–15s, styles, audio, multi-angle",
  },
  {
    value: PIXVERSE_V5_T2V_MODEL,
    label: "V5 T2V",
    info: "Text-to-video",
  },
  {
    value: PIXVERSE_V5_I2V_MODEL,
    label: "V5 I2V",
    info: "Image-to-video",
  },
];

const HAPPY_HORSE_VARIANT_OPTIONS = [
  {
    value: HAPPY_HORSE_T2V_MODEL,
    label: "Text to Video",
    info: "Prompt-only generation",
  },
  {
    value: HAPPY_HORSE_I2V_MODEL,
    label: "Image to Video",
    info: "Uses uploaded first-frame image",
  },
  {
    value: HAPPY_HORSE_R2V_MODEL,
    label: "Reference to Video",
    info: "Uses 1-9 reference images",
  },
  {
    value: HAPPY_HORSE_EDIT_MODEL,
    label: "Edit Video",
    info: "Edits uploaded source video",
  },
];

const InputBox = (props: InputBoxProps = {}) => {
  const {
    placeholder = " video prompt...",
    activeFeature = "Video",
    showHistory = true,
  } = props;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAppSelector((state: any) => state.auth?.user);
  const authLoading = useAppSelector(
    (state: any) => state.auth?.loading ?? true,
  );
  const [preview, setPreview] = useState<{
    entry: HistoryEntry;
    video: any;
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
  const inputEl = useRef<HTMLTextAreaElement>(null);

  // Video generation state - persisted in localStorage
  const [prompt, setPrompt] = usePersistedGenerationState(
    "prompt",
    "",
    "text-to-video",
  );
  const [selectedModel, setSelectedModel] = usePersistedGenerationState(
    "selectedModel",
    "seedance-1.0-lite-t2v",
    "text-to-video",
  );
  const [frameSize, setFrameSize] = usePersistedGenerationState(
    "frameSize",
    "16:9",
    "text-to-video",
  );
  const [hasUserSetFrameSize, setHasUserSetFrameSize] = useState(false);
  const [duration, setDuration] =
    usePersistedGenerationState<VideoDurationValue>(
      "duration",
      6,
      "text-to-video",
    );
  const [isGenerating, setIsGenerating] = useState(false);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);
  const [uploadedImages, setUploadedImages] = usePersistedGenerationState<
    string[]
  >("uploadedImages", [], "text-to-video");
  const [isInputBoxHovered, setIsInputBoxHovered] = useState(false);

  // Reset scroll to top when entering Video Generation (prevents landing mid-feed on tab switch)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // State restoration for auto-resume (e.g. from Home Page)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const intent = getAutoResumeIntent();
    console.log(
      "[Video InputBox] Checking for auto-resume intent...",
      !!intent,
    );
    // Handle both 'video' (Animate) and general prompt intents
    if (intent && (intent.type === "video" || intent.type === "image")) {
      console.log("[Video InputBox] Found intent, restoring state:", intent);
      const data = intent.data;
      if (data.prompt) {
        console.log("[Video InputBox] Restoring prompt:", data.prompt);
        setPrompt(data.prompt);
      }
      if (data.selectedModel) {
        console.log("[Video InputBox] Restoring model:", data.selectedModel);
        setSelectedModel(data.selectedModel);
      }

      // Clear intent and trigger generation after a short delay
      clearAutoResumeIntent();
      console.log(
        "[Video InputBox] Intent cleared, scheduling auto-generation...",
      );
      setTimeout(() => {
        console.log(
          "[Video InputBox] Timer expired, setting shouldAutoGenerate=true",
        );
        setShouldAutoGenerate(true);
      }, 1000);
    }
  }, [user]);

  // Handle auto-triggering generation
  useEffect(() => {
    console.log("[Video InputBox] Auto-trigger watchdog:", {
      shouldAutoGenerate,
      isGenerating,
      promptLength: prompt?.length,
    });
    if (shouldAutoGenerate && !isGenerating && prompt) {
      console.log(
        "[Video InputBox] CONDITIONS MET: Auto-triggering handleGenerate()",
      );
      setShouldAutoGenerate(false);
      handleGenerate();
    } else if (shouldAutoGenerate) {
      console.log("[Video InputBox] CONDITIONS NOT MET for auto-trigger:", {
        isGenerating,
        hasPrompt: !!prompt,
        reason: !prompt
          ? "Missing prompt"
          : isGenerating
            ? "Already generating"
            : "Unknown",
      });
    }
  }, [shouldAutoGenerate, isGenerating, prompt]);

  // Debug uploadedImages changes
  useEffect(() => {
    console.log("Video generation - uploadedImages changed:", uploadedImages);
  }, [uploadedImages]);
  const [uploadedVideo, setUploadedVideo] = usePersistedGenerationState(
    "uploadedVideo",
    "",
    "text-to-video",
  );
  // Seedance 2.0 Reference supports multiple reference videos (up to 3).
  // Keep `uploadedVideo` as the first video for backward-compatible UI preview logic.
  const [uploadedVideos, setUploadedVideos] = usePersistedGenerationState<
    string[]
  >("uploadedVideos", [], "text-to-video");
  const [uploadedVideoDurationSec, setUploadedVideoDurationSec] =
    usePersistedGenerationState<number>(
      "uploadedVideoDurationSec",
      0,
      "text-to-video",
    );
  // Local device-selected videos (blob: URL -> File). Used to upload at Generate-time.
  const [localVideoFilesByUrl, setLocalVideoFilesByUrl] = useState<
    Record<string, File>
  >({});
  const [uploadedUrlByLocalUrl, setUploadedUrlByLocalUrl] = useState<
    Record<string, string>
  >({});
  const trackedVideoUrlsRef = useRef<string[]>([]);
  // Backup of uploaded video specifically for Gen-4 Aleph (V2V)
  const [alephVideoBackup, setAlephVideoBackup] = usePersistedGenerationState(
    "alephVideoBackup",
    "",
    "text-to-video",
  );
  const [uploadedAudio, setUploadedAudio] = usePersistedGenerationState(
    "uploadedAudio",
    "",
    "text-to-video",
  ); // For WAN models audio file
  const [uploadedCharacterImage, setUploadedCharacterImage] =
    usePersistedGenerationState("uploadedCharacterImage", "", "text-to-video"); // For WAN 2.2 Animate Replace character image
  const [sourceHistoryEntryId, setSourceHistoryEntryId] = useState<string>(""); // For Sora 2 Remix source video
  const [references, setReferences] = usePersistedGenerationState<string[]>(
    "references",
    [],
    "text-to-video",
  );
  const [generationMode, setGenerationMode] = usePersistedGenerationState<
    "text_to_video" | "image_to_video" | "video_to_video"
  >("generationMode", "text_to_video", "text-to-video");
  const [error, setError] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const isNormalizingLocalImagesRef = useRef(false);

  // Backward-compat: if we have a single uploadedVideo but no uploadedVideos array yet,
  // treat it as the first (and only) element.
  useEffect(() => {
    if (uploadedVideos.length === 0 && uploadedVideo) {
      setUploadedVideos([uploadedVideo]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedVideo]);

  const clearTrackedVideoUrl = useCallback((url: string) => {
    if (!url) return;
    setLocalVideoFilesByUrl((prev) => {
      if (!(url in prev)) return prev;
      const next = { ...prev };
      delete next[url];
      return next;
    });
    setUploadedUrlByLocalUrl((prev) => {
      if (!(url in prev)) return prev;
      const next = { ...prev };
      delete next[url];
      return next;
    });
  }, []);

  useEffect(() => {
    const currentTracked = Array.from(
      new Set(
        [uploadedVideo, ...(Array.isArray(uploadedVideos) ? uploadedVideos : [])].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    );
    const previousTracked = trackedVideoUrlsRef.current;
    const removedBlobUrls = previousTracked.filter(
      (value) => value.startsWith("blob:") && !currentTracked.includes(value),
    );

    if (removedBlobUrls.length > 0) {
      removedBlobUrls.forEach((value) => {
        try {
          URL.revokeObjectURL(value);
        } catch {}
        clearTrackedVideoUrl(value);
      });
    }

    trackedVideoUrlsRef.current = currentTracked;
  }, [uploadedVideo, uploadedVideos, clearTrackedVideoUrl]);

  useEffect(() => {
    return () => {
      trackedVideoUrlsRef.current.forEach((value) => {
        if (!value?.startsWith("blob:")) return;
        try {
          URL.revokeObjectURL(value);
        } catch {}
      });
    };
  }, []);

  const isLocalImageUrl = useCallback((value?: string | null): boolean => {
    const url = String(value || "").trim();
    return Boolean(url) && (url.startsWith("data:image/") || url.startsWith("blob:"));
  }, []);

  // Auto-detect aspect ratio for uploaded images (only until user manually changes it)
  useEffect(() => {
    if (uploadedImages.length > 0 && !hasUserSetFrameSize) {
      const firstImage = uploadedImages[0];
      // Only auto-detect if frameSize is at its default or "auto"
      // to avoid overriding intentional user choices
      if (frameSize === "16:9" || frameSize === "auto") {
        const img = new window.Image();
        img.onload = () => {
          const { width, height } = img;
          const ratio = height / width;

          const isVeo31Lite = selectedModel.includes("veo3.1-lite");
          const isVeoI2VMode =
            generationMode === "image_to_video" &&
            (selectedModel.includes("veo3.1") ||
              (selectedModel.includes("veo3") &&
                !selectedModel.includes("veo3.1")));

          // Veo 3.1 Lite and Veo image-to-video modes do not support 1:1.
          // Without this guard, auto-detection can bounce between 1:1 and 16:9.
          const supportsSquare = !isVeo31Lite && !isVeoI2VMode;

          if (ratio > 1.2) {
            // Strong portrait - suggest 9:16
            console.log("Detecting portrait image, suggesting 9:16");
            setFrameSize("9:16");
          } else if (ratio < 0.8) {
            // Strong landscape - stay at 16:9 (already default)
          } else if (ratio >= 0.9 && ratio <= 1.1 && supportsSquare) {
            // Square-ish - suggest 1:1 if supported
            console.log("Detecting square image, suggesting 1:1");
            setFrameSize("1:1");
          }
        };
        img.src = firstImage;
      }
    }
  }, [
    uploadedImages,
    frameSize,
    setFrameSize,
    hasUserSetFrameSize,
    selectedModel,
    generationMode,
  ]);

  const handleFrameSizeChange = (value: string) => {
    setHasUserSetFrameSize(true);
    setFrameSize(value);
  };

  // UploadModal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalType, setUploadModalType] = useState<
    "image" | "reference" | "video"
  >("image");
  const [uploadModalTarget, setUploadModalTarget] = useState<
    "first_frame" | "last_frame"
  >("first_frame");

  // Local image library state for UploadModal (avoids interfering with global Redux history)
  const [libraryImageEntries, setLibraryImageEntries] = useState<any[]>([]);
  const [libraryImageHasMore, setLibraryImageHasMore] = useState<boolean>(true);
  const [libraryImageLoading, setLibraryImageLoading] =
    useState<boolean>(false);
  const libraryImageNextCursorRef = useRef<string | undefined>(undefined);
  const libraryImageLoadingRef = useRef<boolean>(false);
  const libraryImageInitRef = useRef<boolean>(false);

  // MiniMax specific state - persisted
  const [selectedResolution, setSelectedResolution] =
    usePersistedGenerationState("selectedResolution", "1080P", "text-to-video");
  const [selectedMiniMaxDuration, setSelectedMiniMaxDuration] =
    usePersistedGenerationState("selectedMiniMaxDuration", 6, "text-to-video");
  const [resolutionDropdownOpen, setResolutionDropdownOpen] = useState(false);
  const [durationDropdownOpen, setDurationDropdownOpen] = useState(false);

  const [selectedCameraMovements, setSelectedCameraMovements] =
    usePersistedGenerationState<string[]>(
      "selectedCameraMovements",
      [],
      "text-to-video",
    );
  const [lastFrameImage, setLastFrameImage] = usePersistedGenerationState(
    "lastFrameImage",
    "",
    "text-to-video",
  ); // For MiniMax-Hailuo-02 last frame
  const canSwapFirstAndLastFrame =
    uploadedImages.length > 0 && Boolean(lastFrameImage || uploadedImages[1]);

  const handleSwapFirstAndLastFrame = useCallback(() => {
    const firstFrame = uploadedImages[0];
    if (!firstFrame) return;

    if (lastFrameImage) {
      setUploadedImages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        next[0] = lastFrameImage;
        return next;
      });
      setLastFrameImage(firstFrame);
      return;
    }

    if (uploadedImages[1]) {
      setUploadedImages((prev) => {
        if (prev.length < 2) return prev;
        const next = [...prev];
        [next[0], next[1]] = [next[1], next[0]];
        return next;
      });
    }
  }, [lastFrameImage, setLastFrameImage, setUploadedImages, uploadedImages]);

  // Staging proxies can reject large inline base64 payloads (413).
  // Normalize any local image URLs to uploaded remote URLs before submit.
  useEffect(() => {
    const hasLocalImages =
      uploadedImages.some((u) => isLocalImageUrl(u)) ||
      references.some((u) => isLocalImageUrl(u)) ||
      isLocalImageUrl(lastFrameImage) ||
      isLocalImageUrl(uploadedCharacterImage);

    if (!hasLocalImages || isNormalizingLocalImagesRef.current) return;

    let isCancelled = false;
    isNormalizingLocalImagesRef.current = true;

    const normalize = async () => {
      try {
        const cache = new Map<string, string>();
        const resolveUrl = async (url: string): Promise<string> => {
          const raw = String(url || "").trim();
          if (!isLocalImageUrl(raw)) return raw;
          if (cache.has(raw)) return cache.get(raw)!;
          const resp = await saveUpload({ url: raw, type: "image" });
          if (resp.responseStatus === "success" && resp.data?.url) {
            cache.set(raw, resp.data.url);
            return resp.data.url;
          }
          throw new Error(resp.message || "Failed to upload local image");
        };

        const nextUploadedImages = await Promise.all(uploadedImages.map(resolveUrl));
        const nextReferences = await Promise.all(references.map(resolveUrl));
        const nextLastFrameImage = await resolveUrl(lastFrameImage || "");
        const nextCharacterImage = await resolveUrl(uploadedCharacterImage || "");

        if (isCancelled) return;

        if (JSON.stringify(nextUploadedImages) !== JSON.stringify(uploadedImages)) {
          setUploadedImages(nextUploadedImages);
        }
        if (JSON.stringify(nextReferences) !== JSON.stringify(references)) {
          setReferences(nextReferences);
        }
        if ((nextLastFrameImage || "") !== (lastFrameImage || "")) {
          setLastFrameImage(nextLastFrameImage);
        }
        if ((nextCharacterImage || "") !== (uploadedCharacterImage || "")) {
          setUploadedCharacterImage(nextCharacterImage);
        }
      } catch (error) {
        console.error("[Video] Failed to normalize local image URLs:", error);
      } finally {
        isNormalizingLocalImagesRef.current = false;
      }
    };

    void normalize();
    return () => {
      isCancelled = true;
    };
  }, [
    uploadedImages,
    references,
    lastFrameImage,
    uploadedCharacterImage,
    isLocalImageUrl,
    setUploadedImages,
    setReferences,
    setLastFrameImage,
    setUploadedCharacterImage,
  ]);

  const [selectedQuality, setSelectedQuality] = usePersistedGenerationState(
    "selectedQuality",
    "720p",
    "text-to-video",
  ); // For Veo3 quality
  // Kling specific state (v2.1 mode determines resolution): 'standard'->720p, 'pro'->1080p
  const [klingMode, setKlingMode] = usePersistedGenerationState<
    "standard" | "pro"
  >("klingMode", "standard", "text-to-video");
  // Seedance specific state
  const [seedanceResolution, setSeedanceResolution] =
    usePersistedGenerationState("seedanceResolution", "1080p", "text-to-video"); // For Seedance resolution (480p/720p/1080p)
  const [seedanceFirstFrameImage, setSeedanceFirstFrameImage] =
    usePersistedGenerationState("seedanceFirstFrameImage", "", "text-to-video"); // For Seedance first frame image
  const [seedanceLastFrameImage, setSeedanceLastFrameImage] =
    usePersistedGenerationState("seedanceLastFrameImage", "", "text-to-video"); // For Seedance last frame image
  // Commented out per request:
  // const [happyHorseSeedInput, setHappyHorseSeedInput] =
  //   usePersistedGenerationState("happyHorseSeedInput", "", "text-to-video");
  // const [happyHorseSafetyChecker, setHappyHorseSafetyChecker] =
  //   usePersistedGenerationState("happyHorseSafetyChecker", true, "text-to-video");
  const [happyHorseAudioSetting, setHappyHorseAudioSetting] =
    usePersistedGenerationState<"default" | "auto" | "origin">(
      "happyHorseAudioSetting",
      "default",
      "text-to-video",
    );
  // PixVerse specific state
  const [pixverseQuality, setPixverseQuality] = usePersistedGenerationState(
    "pixverseQuality",
    "720p",
    "text-to-video",
  ); // For PixVerse quality (360p/540p/720p/1080p)
  const [pixverseV6GenerateAudio, setPixverseV6GenerateAudio] =
    usePersistedGenerationState(
      "pixverseV6GenerateAudio",
      false,
      "text-to-video",
    );
  const [pixverseV6MultiClip, setPixverseV6MultiClip] =
    usePersistedGenerationState(
      "pixverseV6MultiClip",
      false,
      "text-to-video",
    );
  const [pixverseV6Style, setPixverseV6Style] = usePersistedGenerationState<
    | ""
    | "anime"
    | "3d_animation"
    | "clay"
    | "comic"
    | "cyberpunk"
  >("pixverseV6Style", "", "text-to-video");
  // WAN 2.2 Animate Replace specific state
  const [wanAnimateResolution, setWanAnimateResolution] =
    usePersistedGenerationState<"720" | "480">(
      "wanAnimateResolution",
      "720",
      "text-to-video",
    ); // For WAN Animate Replace resolution
  const [wanAnimateRefertNum, setWanAnimateRefertNum] =
    usePersistedGenerationState<1 | 5>(
      "wanAnimateRefertNum",
      1,
      "text-to-video",
    ); // For WAN Animate Replace reference frames
  const [wanAnimateGoFast, setWanAnimateGoFast] = usePersistedGenerationState(
    "wanAnimateGoFast",
    true,
    "text-to-video",
  ); // For WAN Animate Replace go_fast
  const [wanAnimateMergeAudio, setWanAnimateMergeAudio] =
    usePersistedGenerationState("wanAnimateMergeAudio", true, "text-to-video"); // For WAN Animate Replace merge_audio
  const [wanAnimateFps, setWanAnimateFps] = usePersistedGenerationState(
    "wanAnimateFps",
    24,
    "text-to-video",
  ); // For WAN Animate Replace frames_per_second
  const [wanAnimateSeed, setWanAnimateSeed] = usePersistedGenerationState<
    number | undefined
  >("wanAnimateSeed", undefined, "text-to-video"); // For WAN Animate Replace seed (optional)
  // LTX and audio controls
  const [fps, setFps] = usePersistedGenerationState<25 | 50>(
    "fps",
    25,
    "text-to-video",
  );
  const [generateAudio, setGenerateAudio] = usePersistedGenerationState(
    "generateAudio",
    true,
    "text-to-video",
  );

  useEffect(() => {
    if (
      selectedModel.includes("veo3.1-lite") &&
      selectedQuality === "1080p" &&
      duration !== 8
    ) {
      setSelectedQuality("720p");
    }
  }, [selectedModel, selectedQuality, duration, setSelectedQuality]);

  // Timeout refs for auto-close dropdowns
  const resolutionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State to trigger closing of models dropdown
  const [closeModelsDropdown, setCloseModelsDropdown] = useState(false);

  // State to trigger closing of frame size dropdown
  const [closeFrameSizeDropdown, setCloseFrameSizeDropdown] = useState(false);

  // State to trigger closing of duration dropdown
  const [closeDurationDropdown, setCloseDurationDropdown] = useState(false);

  // State to trigger closing of camera motion dropdown
  const [closeCameraMotionDropdown, setCloseCameraMotionDropdown] =
    useState(false);

  // Helpers: clean prompt and copy

  // Handle image parameter from URL for image-to-video mode (Syncs URL params with state)
  useUrlParamsSync({
    searchParams,
    setPrompt,
    setSelectedModel,
    setFrameSize,
    setDuration,
    setSelectedQuality,
    setSelectedResolution,
    setGenerationMode,
    setUploadedImages,
  });

  // Handle manual prompt enhancement
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      toast("Please enter a prompt to enhance");
      return;
    }

    if (isEnhancing) return;

    try {
      setIsEnhancing(true);
      // Explicitly pass 'video' as media type for video generation
      const res = await enhancePromptAPI(prompt, "openai/gpt-4o", "video");
      if (res.ok && res.enhancedPrompt) {
        const enhancedPrompt = res.enhancedPrompt;

        // Update state
        setPrompt(enhancedPrompt);

        // Update textarea directly if ref exists
        if (inputEl.current) {
          inputEl.current.value = enhancedPrompt;
          // Trigger height adjustment
        }

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

  // Delete handler - same logic as ImagePreviewModal
  // Delete handler - same logic as ImagePreviewModal
  const handleDeleteVideo = async (
    e: React.MouseEvent,
    entry: HistoryEntry,
  ) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      if (
        !window.confirm(
          "Delete this generation permanently? This cannot be undone.",
        )
      )
        return;
      await axiosInstance.delete(`/api/generations/${entry.id}`);
      try {
        dispatch(removeHistoryEntry(entry.id));
      } catch {}
      toast.success("Video deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete generation");
    }
  };

  const { processFiles } = useFileHandler({
    setUploadedImages,
    setUploadedVideo,
    setLocalVideoFilesByUrl,
    currentUploadedVideo: uploadedVideo,
    clearTrackedVideoUrl,
  });

  // Credits management - after all state declarations
  const normalizedSelectedRes =
    typeof selectedResolution === "string"
      ? selectedResolution.toLowerCase()
      : "1080p";
  const creditsResolution = selectedModel.includes("MiniMax")
    ? selectedResolution
    : selectedModel.includes("veo3")
      ? selectedQuality
      : selectedModel.startsWith("alibaba/happy-horse")
        ? selectedQuality
      : selectedModel.includes("wan-2.5")
        ? frameSize.includes("480")
          ? "480p"
          : frameSize.includes("720")
            ? "720p"
            : "1080p"
        : selectedModel.startsWith("kling-")
          ? klingMode === "pro"
            ? "1080p"
            : "720p"
          : selectedModel.includes("seedance-1.5")
            ? undefined
            : selectedModel.includes("seedance")
              ? seedanceResolution
              : selectedModel.includes("ltx2") ||
                  selectedModel.startsWith("ltx-2.3-fast") ||
                  selectedModel.startsWith("ltx-2.3-pro")
                ? normalizedSelectedRes
                : selectedModel.includes("pixverse")
                  ? pixverseQuality
                  : undefined;

  const seedance2AspectRatio = isSeedance2FamilyModel(selectedModel)
    ? frameSize || "auto"
    : undefined;

  const hasVeo31LiteFirstFrame = Boolean(uploadedImages[0] || references[0]);
  const hasVeo31LiteLastFrame = Boolean(
    uploadedImages[1] || lastFrameImage || references[1],
  );
  const hasVeo31LiteFirstLastFrames =
    selectedModel.includes("veo3.1-lite") &&
    hasVeo31LiteFirstFrame &&
    hasVeo31LiteLastFrame;
  const happyHorseInputImage = uploadedImages[0] || "";
  const happyHorseHasVideoInput = Boolean(uploadedVideo);
  const happyHorseHasReferenceInput = references.length > 0;
  const happyHorseVariantModel =
    selectedModel.startsWith("alibaba/happy-horse")
      ? happyHorseHasVideoInput
        ? HAPPY_HORSE_EDIT_MODEL
        : happyHorseHasReferenceInput
          ? HAPPY_HORSE_R2V_MODEL
          : happyHorseInputImage
            ? HAPPY_HORSE_I2V_MODEL
            : HAPPY_HORSE_T2V_MODEL
      : selectedModel;

  const creditsModel = hasVeo31LiteFirstLastFrames
    ? "veo3.1-lite-flf2v-8s"
    : happyHorseVariantModel;
  const hasSeedanceReferenceVideoInput =
    isSeedance2ReferenceModel(selectedModel) && uploadedVideos.length > 0;
  const seedanceReferenceInputDurationForCredits = isSeedance2ReferenceModel(
    selectedModel,
  )
    ? uploadedVideos.length > 0
      ? uploadedVideoDurationSec || 0
      : 0
    : undefined;

  const {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    clearCreditsError,
  } = useGenerationCredits("video", creditsModel, {
    resolution: creditsResolution,
    duration: hasVeo31LiteFirstLastFrames
      ? 8
      : selectedModel.includes("MiniMax")
        ? selectedMiniMaxDuration
        : selectedModel === "wan-2.2-animate-replace"
          ? uploadedVideoDurationSec || 0
          : duration,
    frameSize: isSeedance2FamilyModel(selectedModel)
      ? seedance2AspectRatio
      : undefined,
    inputVideoDurationSec: seedanceReferenceInputDurationForCredits,
    hasReferenceVideoInput: hasSeedanceReferenceVideoInput,
  });

  const loadVideoDurationSeconds = useCallback(
    async (url: string): Promise<number> => {
      return await new Promise((resolve, reject) => {
        if (!url) return resolve(0);
        const video = document.createElement("video");
        let done = false;

        const cleanup = () => {
          try {
            video.pause();
            video.removeAttribute("src");
            video.load();
          } catch {}
        };

        const finish = (value: number, err?: any) => {
          if (done) return;
          done = true;
          cleanup();
          if (err) reject(err);
          else resolve(value);
        };

        const t = window.setTimeout(
          () => finish(0, new Error("Timed out loading video metadata")),
          15000,
        );
        video.preload = "metadata";
        (video as any).crossOrigin = "anonymous";
        video.onloadedmetadata = () => {
          window.clearTimeout(t);
          const d = Number(video.duration);
          if (Number.isFinite(d) && d > 0) return finish(d);
          return finish(0, new Error("Invalid video duration"));
        };
        video.onerror = () => {
          window.clearTimeout(t);
          finish(0, new Error("Failed to load video metadata"));
        };
        try {
          video.src = url;
        } catch (e) {
          window.clearTimeout(t);
          finish(0, e);
        }
      });
    },
    [],
  );

  // Veo 3.1 Lite first-last mode only supports 8 seconds.
  useEffect(() => {
    if (hasVeo31LiteFirstLastFrames && duration !== 8) {
      setDuration(8);
    }
  }, [hasVeo31LiteFirstLastFrames, duration, setDuration]);

  // Live credit preview for current selections
  const liveCreditCost = useMemo(() => {
    try {
      const dur = selectedModel.includes("MiniMax")
        ? selectedMiniMaxDuration
        : selectedModel === "wan-2.2-animate-replace"
          ? uploadedVideoDurationSec || 0
          : duration;
      const res =
        typeof creditsResolution === "string" ? creditsResolution : undefined;

      // Normalize Kling 2.1/2.1 Master to i2v variant when in image_to_video mode
      // to ensure credit lookup recognizes the model and avoids warnings.
      const normalizedModelForCredits = (() => {
        if (
          generationMode === "image_to_video" &&
          selectedModel.includes("veo3.1-lite")
        ) {
          const firstFrame = uploadedImages[0] || references[0];
          const lastFrame =
            uploadedImages[1] || lastFrameImage || references[1] || null;

          if (firstFrame && lastFrame) {
            return "veo3.1-lite-flf2v-8s";
          }

          if ((firstFrame || lastFrame) && /-t2v$/.test(selectedModel)) {
            return selectedModel.replace(/-t2v$/, "-i2v");
          }
        }

        if (
          generationMode === "image_to_video" &&
          selectedModel.startsWith("kling-") &&
          selectedModel.includes("v2.1")
        ) {
          // Replace t2v suffix with i2v for v2.1 variants
          if (/-t2v$/.test(selectedModel)) {
            return selectedModel.replace(/-t2v$/, "-i2v");
          }
        }
        return selectedModel;
      })();

      // Pass generateAudio only for models whose pricing depends on it
      const audioParam =
        normalizedModelForCredits === "pixverse-v6-t2v" ||
        normalizedModelForCredits === "pixverse-v6-i2v"
          ? pixverseV6GenerateAudio
          : normalizedModelForCredits === "kling-2.6-pro" ||
              normalizedModelForCredits.startsWith("kling-v3") ||
              normalizedModelForCredits.includes("seedance-1.5")
            ? generateAudio
            : undefined;
      return Math.max(
        0,
        Number(
          getVideoCreditCost(
            normalizedModelForCredits,
            res,
            dur,
            audioParam,
            isSeedance2FamilyModel(normalizedModelForCredits)
              ? seedance2AspectRatio
              : undefined,
            isSeedance2ReferenceModel(normalizedModelForCredits)
              ? uploadedVideos.length > 0
                ? uploadedVideoDurationSec || 0
                : 0
              : undefined,
            isSeedance2ReferenceModel(normalizedModelForCredits)
              ? uploadedVideos.length > 0
              : undefined,
          ),
        ) || 0,
      );
    } catch {
      return 0;
    }
  }, [
    selectedModel,
    creditsResolution,
    duration,
    selectedMiniMaxDuration,
    generationMode,
    generateAudio,
    pixverseV6GenerateAudio,
    frameSize,
    uploadedImages,
    uploadedVideos,
    uploadedVideoDurationSec,
    references,
    lastFrameImage,
  ]);

  // Memoize current model capabilities to prevent recalculations during render
  const currentModelCapabilities = useMemo(() => {
    const caps = getModelCapabilities(selectedModel);
    // MiniMax-Hailuo-02 requires first frame for 512P resolution
    if (
      selectedModel === "MiniMax-Hailuo-02" &&
      selectedResolution === "512P"
    ) {
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

  /** PixVerse V6: first-frame pipeline when an image (or reference) is present */
  const pixverseV6HasFirstFrameImage = useMemo(
    () =>
      (selectedModel === PIXVERSE_V6_T2V_MODEL ||
        selectedModel === PIXVERSE_V6_I2V_MODEL) &&
      (uploadedImages.length > 0 || Boolean(references[0])),
    [
      selectedModel,
      uploadedImages.length,
      references.length,
      references[0],
    ],
  );
  const hidePixverseV6AspectRatio = useMemo(
    () =>
      selectedModel === PIXVERSE_V6_I2V_MODEL ||
      (selectedModel === PIXVERSE_V6_T2V_MODEL && pixverseV6HasFirstFrameImage),
    [selectedModel, pixverseV6HasFirstFrameImage],
  );

  // Memoize the computed mode to prevent unnecessary recalculations
  const computedMode = useMemo(() => {
    if (supportsVideoToVideo && uploadedVideo) {
      return "video_to_video";
    } else if (
      supportsImageToVideo &&
      (uploadedImages.length > 0 ||
        references.length > 0 ||
        (selectedModel.includes("veo3.1-lite") && !!lastFrameImage))
    ) {
      return "image_to_video";
    } else if (supportsTextToVideo) {
      return "text_to_video";
    } else if (supportsImageToVideo) {
      return "image_to_video";
    } else if (supportsVideoToVideo) {
      return "video_to_video";
    }
    return null;
  }, [
    supportsTextToVideo,
    supportsImageToVideo,
    supportsVideoToVideo,
    uploadedVideo,
    uploadedImages.length,
    references.length,
    selectedModel,
    lastFrameImage,
  ]);

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
    let newMode: "text_to_video" | "image_to_video" | "video_to_video" | null =
      null;

    // Special handling for I2V-only models - they require image (Kling 2.1, Gen-4 Turbo, Gen-3a Turbo)
    if (
      (selectedModel.startsWith("kling-") &&
        (selectedModel.includes("v2.1") || selectedModel.includes("master"))) ||
      selectedModel === "gen4_turbo" ||
      selectedModel === "gen3a_turbo"
    ) {
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
      setGenerationMode((prevMode) => {
        if (newMode !== prevMode) {
          console.log(
            `🔄 Mode changed from ${prevMode} to ${newMode} for model ${selectedModel}`,
          );
          return newMode;
        }
        return prevMode;
      });
    }
  }, [selectedModel]);

  // Hide uploaded video when leaving Gen-4 Aleph, and restore when returning
  useEffect(() => {
    const isAleph = selectedModel === "gen4_aleph";
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
    if (selectedModel.includes("ltx2")) {
      const isI2V = selectedModel.includes("i2v");
      const isPro = selectedModel.includes("pro");
      const isFast = selectedModel.includes("fast");

      if (generationMode === "text_to_video" && isI2V) {
        // Switch from i2v to t2v variant
        const newModel = isPro
          ? "ltx2-pro-t2v"
          : isFast
            ? "ltx2-fast-t2v"
            : "ltx2-pro-t2v";
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      } else if (generationMode === "image_to_video" && !isI2V) {
        // Switch from t2v to i2v variant
        const newModel = isPro
          ? "ltx2-pro-i2v"
          : isFast
            ? "ltx2-fast-i2v"
            : "ltx2-pro-i2v";
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      }
    }

    // Convert WAN 2.5 models
    if (selectedModel.includes("wan-2.5") && !selectedModel.includes("v2v")) {
      const isI2V = selectedModel.includes("i2v");
      const isFast = selectedModel.includes("fast");

      if (generationMode === "text_to_video" && isI2V) {
        // Switch from i2v to t2v variant
        const newModel = isFast ? "wan-2.5-t2v-fast" : "wan-2.5-t2v";
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      } else if (generationMode === "image_to_video" && !isI2V) {
        // Switch from t2v to i2v variant
        const newModel = isFast ? "wan-2.5-i2v-fast" : "wan-2.5-i2v";
        if (newModel !== selectedModel) {
          setSelectedModel(newModel);
        }
      }
    }

    // Kling v2.1 conversions: allow Master to stay T2V; non-master stays I2V-only
    if (
      selectedModel.startsWith("kling-") &&
      selectedModel.includes("v2.1") &&
      !selectedModel.includes("v2.5")
    ) {
      const isI2V = selectedModel.includes("i2v");
      const isMaster = selectedModel.includes("master");

      // For non-master v2.1, force I2V; for master, leave as-is (supports T2V)
      if (!isMaster && !isI2V) {
        const newModel = "kling-v2.1-i2v";
        if (newModel !== selectedModel) {
          console.log("🔄 Auto-converting Kling 2.1 to I2V variant:", newModel);
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
    if (selectedModel.includes("ltx2")) {
      setFps(25);
      setGenerateAudio(true);
    } else if (selectedModel.includes("veo3")) {
      // Veo 3 and 3.1 support generate_audio, keep fps unused
      setGenerateAudio(true);
    } else if (selectedModel.includes("sora2")) {
      setGenerateAudio(true);
    }
  }, [selectedModel]);

  // Auto-set fixed settings for models that don't support customization
  useEffect(() => {
    if (
      selectedModel === "T2V-01-Director" ||
      selectedModel === "I2V-01-Director" ||
      selectedModel === "S2V-01"
    ) {
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
    } else if (
      selectedModel === "MiniMax-Hailuo-2.3" ||
      selectedModel === "MiniMax-Hailuo-2.3-Fast"
    ) {
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
    if (
      generationMode === "text_to_video" &&
      (selectedModel === "MiniMax-Hailuo-02" ||
        selectedModel === "MiniMax-Hailuo-2.3")
    ) {
      setSelectedResolution((prev) => {
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
    if (
      (selectedModel === "MiniMax-Hailuo-02" ||
        selectedModel === "MiniMax-Hailuo-2.3" ||
        selectedModel === "MiniMax-Hailuo-2.3-Fast") &&
      selectedMiniMaxDuration === 10
    ) {
      setSelectedResolution((prev) => (prev === "1080P" ? "768P" : prev)); // Only update if still 1080P (1080P only supports 6s)
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

    if (
      selectedModel.includes("MiniMax") ||
      selectedModel === "T2V-01-Director" ||
      selectedModel === "I2V-01-Director" ||
      selectedModel === "S2V-01"
    ) {
      // Reset Runway-specific controls when switching to MiniMax
      // Note: MiniMax models don't support custom aspect ratios - they use fixed resolutions
      setFrameSize("16:9"); // Default aspect ratio (not used for MiniMax)
      setDuration(5); // Default duration (not used for MiniMax)

      // Set appropriate MiniMax defaults based on model
      if (selectedModel === "MiniMax-Hailuo-02") {
        setSelectedResolution((prev) => (prev !== "1080P" ? "1080P" : prev));
        setSelectedMiniMaxDuration(6);
      } else if (
        selectedModel === "MiniMax-Hailuo-2.3" ||
        selectedModel === "MiniMax-Hailuo-2.3-Fast"
      ) {
        // Hailuo 2.3: Default to 768P (no 512P support)
        setSelectedResolution((prev) =>
          prev !== "768P" && prev !== "1080P" ? "768P" : prev,
        );
        setSelectedMiniMaxDuration(6);
        // Clear last_frame_image as these models don't support it
        if (lastFrameImage) {
          setLastFrameImage("");
        }
      } else {
        // T2V-01, I2V-01, S2V-01 have fixed settings
        setSelectedResolution((prev) => (prev !== "720P" ? "720P" : prev));
        setSelectedMiniMaxDuration(6);
      }
    } else {
      // Reset MiniMax-specific controls when switching to Runway
      setSelectedResolution((prev) => (prev !== "1080P" ? "1080P" : prev)); // Only update if different
      setSelectedMiniMaxDuration(6); // Default duration
    }
  }, [selectedModel]);

  // Close dropdowns when clicking outside
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;

      const target = event.target as Element;
      if (!target.closest(".dropdown-container")) {
        setResolutionDropdownOpen(false);
        setDurationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    console.log("🔄 Model change requested:");
    console.log("🔄 - From:", selectedModel);
    console.log("🔄 - To:", newModel);
    console.log("🔄 - Generation mode:", generationMode);

    // Determine desired generation mode for the requested model so we can
    // automatically switch modes when the user selects a model that requires
    // a different mode (e.g., selecting a T2V model while in video_to_video).
    const desiredMode: "text_to_video" | "image_to_video" | "video_to_video" =
      ((): "text_to_video" | "image_to_video" | "video_to_video" => {
        if (
          newModel === "gen4_aleph" ||
          newModel.includes("v2v") ||
          newModel.includes("remix")
        )
          return "video_to_video";
        // I2V / image→video candidates
        // MiniMax-Hailuo-2.3-Fast is I2V only, others can do both T2V and I2V
        if (
          newModel === "I2V-01-Director" ||
          newModel === "S2V-01" ||
          newModel === "MiniMax-Hailuo-2.3-Fast" ||
          (newModel.includes("MiniMax") &&
            newModel !== "MiniMax-Hailuo-02" &&
            newModel !== "MiniMax-Hailuo-2.3") ||
          newModel.startsWith("kling-") ||
          newModel === "kling-o1" ||
          newModel.includes("veo3") ||
          newModel.includes("ltx2") ||
          newModel.startsWith("ltx-2.3-pro") ||
          newModel === "gen4_turbo" ||
          newModel === "gen3a_turbo"
        )
          return "image_to_video";
        // Default to text→video for other models
        return "text_to_video";
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
      if (
        newModel === "MiniMax-Hailuo-02" ||
        newModel === "MiniMax-Hailuo-2.3" ||
        newModel === "T2V-01-Director" ||
        newModel.includes("veo3") ||
        newModel.includes("wan-2.5") ||
        (newModel.startsWith("kling-") &&
          !newModel.includes("v2.1") &&
          !newModel.includes("master")) ||
        newModel === "kling-o1" ||
        newModel.startsWith("alibaba/happy-horse") ||
        newModel === SEEDANCE_2_MODEL ||
        newModel.includes("seedance") ||
        newModel.includes("pixverse") ||
        newModel.includes("sora2") ||
        newModel.includes("ltx2") ||
        newModel.startsWith("ltx-2.3-fast") ||
        newModel.startsWith("ltx-2.3-pro")
      ) {
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
        } else if (
          newModel === "MiniMax-Hailuo-2.3" ||
          newModel === "MiniMax-Hailuo-2.3-Fast"
        ) {
          // MiniMax-Hailuo-2.3: Set default resolution and duration (768P/1080P only, no 512P)
          setSelectedMiniMaxDuration(6); // Default duration
          setSelectedResolution("768P"); // Default resolution for 6s
        } else if (newModel.includes("veo3.1-lite")) {
          setDuration(8);
          setFrameSize("16:9");
          setSelectedQuality("720p");
          setGenerateAudio(true);
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
        } else if (newModel.startsWith("alibaba/happy-horse")) {
          setDuration(5);
          setFrameSize("16:9");
          setSelectedQuality("1080p");
        } else if (newModel.includes("wan-2.5")) {
          // WAN 2.5 models: Set default duration and frame size
          setDuration(5); // Default 5s for WAN
          setFrameSize("1280*720"); // Default 720p for WAN
          // Keep audio if switching between WAN models
        } else if (newModel.startsWith("kling-")) {
          // Kling models: duration default 5s; aspect via frame dropdown not used (we use separate aspect for kling)
          setDuration(5);
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel === "kling-o1") {
          // Kling o1: duration default 5s, image-to-video only
          setDuration(5);
          setFrameSize("16:9");
        } else if (isSeedance2TextModel(newModel)) {
          setDuration("auto");
          setSeedanceResolution("720p");
          setFrameSize("auto");
          setGenerateAudio(true);
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("seedance")) {
          // Seedance models
          if (newModel.includes("seedance-1.5")) {
            setDuration(4);
            setFrameSize("16:9");
            setGenerateAudio(false);
          } else {
            // Seedance 1.0: frontend pricing uses 5s/10s buckets and resolution
            setDuration(5);
            setSeedanceResolution("1080p");
            setFrameSize("16:9");
          }
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("pixverse")) {
          setPixverseQuality("720p");
          setFrameSize("16:9");
          if (newModel === PIXVERSE_V6_T2V_MODEL) {
            setDuration((prev) => {
              if (prev === "auto") return 5;
              const num =
                typeof prev === "number"
                  ? prev
                  : parseInt(String(prev).replace(/s$/i, ""), 10);
              if (!Number.isFinite(num)) return 5;
              return Math.min(15, Math.max(5, num));
            });
          } else if (newModel === PIXVERSE_V6_I2V_MODEL) {
            setDuration((prev) => {
              if (prev === "auto") return 5;
              const num =
                typeof prev === "number"
                  ? prev
                  : parseInt(String(prev).replace(/s$/i, ""), 10);
              if (!Number.isFinite(num)) return 5;
              return Math.min(15, Math.max(5, num));
            });
          } else {
            setDuration(5);
          }
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("sora2")) {
          // Sora 2 models: duration default 8s, aspect ratio default 16:9, quality default 720p (or 1080p for Pro)
          setDuration(8); // Default 8s for Sora 2
          setFrameSize("16:9"); // Default aspect ratio
          setSelectedQuality(newModel.includes("pro") ? "1080p" : "720p"); // Pro defaults to 1080p, Standard to 720p
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("ltx2")) {
          // LTX V2 T2V: default resolution 1080p, duration 6s, 16:9 fixed
          setDuration(6);
          setFrameSize("16:9");
          setSelectedResolution("1080p" as any);
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (
          newModel.startsWith("ltx-2.3-fast") ||
          newModel.startsWith("ltx-2.3-pro")
        ) {
          // LTX 2.3 Fast/Pro: default 1080p, 6s
          setSelectedResolution("1080p" as any);
          setDuration(6);
          setFrameSize("16:9");
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
      } else if (
        newModel === "gen4_turbo" ||
        newModel === "gen3a_turbo" ||
        newModel === SEEDANCE_2_FAST_I2V_MODEL
      ) {
        // Gen-4 Turbo and Gen-3a Turbo are I2V-only, so switch to image-to-video mode
        setGenerationMode("image_to_video");
        setSelectedModel(newModel);
        if (newModel === SEEDANCE_2_FAST_I2V_MODEL) {
          setDuration("auto");
          setSeedanceResolution("720p");
          setFrameSize("auto");
          setGenerateAudio(true);
        } else {
          setDuration(5);
          setFrameSize("16:9");
        }
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
        console.warn(
          `Model ${newModel} cannot be used for text-to-video generation`,
        );
        return; // Don't change the model
      }
    } else if (desiredMode === "image_to_video") {
      // Image→Video: gen4_turbo, gen3a_turbo, MiniMax-Hailuo-02, MiniMax-Hailuo-2.3, MiniMax-Hailuo-2.3-Fast, I2V-01-Director, S2V-01, Veo3, Veo 3.1, WAN, Kling, Seedance, PixVerse, Sora 2
      if (
        newModel === "gen4_turbo" ||
        newModel === "gen3a_turbo" ||
        newModel === "MiniMax-Hailuo-02" ||
        newModel === "MiniMax-Hailuo-2.3" ||
        newModel === "MiniMax-Hailuo-2.3-Fast" ||
        newModel === "I2V-01-Director" ||
        newModel === "S2V-01" ||
        newModel.startsWith("alibaba/happy-horse") ||
        newModel.includes("veo3") ||
        newModel.includes("wan-2.5") ||
        newModel.startsWith("kling-") ||
        newModel.includes("seedance") ||
        newModel.includes("pixverse") ||
        newModel.includes("sora2") ||
        newModel.includes("ltx2") ||
        newModel.startsWith("ltx-2.3-fast") ||
        newModel.startsWith("ltx-2.3-pro")
      ) {
        setSelectedModel(newModel);
        if (newModel.startsWith("alibaba/happy-horse")) {
          setDuration(5);
          setFrameSize("16:9");
          setSelectedQuality("1080p");
          setSelectedCameraMovements([]);
        }
        // Reset aspect ratio for MiniMax models (they don't support custom aspect ratios)
        if (
          newModel.includes("MiniMax") ||
          newModel === "I2V-01-Director" ||
          newModel === "S2V-01"
        ) {
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
        } else if (
          newModel === "MiniMax-Hailuo-2.3" ||
          newModel === "MiniMax-Hailuo-2.3-Fast"
        ) {
          // MiniMax-Hailuo-2.3: Set default resolution and duration (768P/1080P only, no 512P)
          setSelectedMiniMaxDuration(6); // Default duration
          setSelectedResolution("768P"); // Default resolution for 6s
        } else if (newModel.includes("veo3.1-lite")) {
          setDuration(8);
          setFrameSize("auto");
          setSelectedQuality("720p");
          setGenerateAudio(true);
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
        } else if (newModel.startsWith("kling-")) {
          setDuration(5);
          if (newModel === "kling-v3-pro") {
            setFrameSize("");
          }
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel === "gen4_turbo" || newModel === "gen3a_turbo") {
          // Gen-4 Turbo and Gen-3a Turbo: default duration 5s (only supports 5s and 10s)
          setDuration(5);
          setFrameSize("16:9");
        } else if (isSeedance2FamilyModel(newModel)) {
          setDuration("auto");
          setSeedanceResolution("720p");
          setFrameSize("auto");
          setGenerateAudio(true);
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("seedance")) {
          // Seedance models
          if (newModel.includes("seedance-1.5")) {
            setDuration(4);
            setGenerateAudio(false);
            setFrameSize("16:9");
          } else {
            setDuration(5);
            setSeedanceResolution("1080p");
            // Note: aspect_ratio is ignored for I2V, but we still set it for consistency
            setFrameSize("16:9");
          }
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("pixverse")) {
          setPixverseQuality("720p");
          setFrameSize("16:9");
          if (
            newModel === PIXVERSE_V6_T2V_MODEL ||
            newModel === PIXVERSE_V6_I2V_MODEL
          ) {
            setDuration((prev) => {
              if (prev === "auto") return 5;
              const num =
                typeof prev === "number"
                  ? prev
                  : parseInt(String(prev).replace(/s$/i, ""), 10);
              if (!Number.isFinite(num)) return 5;
              return Math.min(15, Math.max(5, num));
            });
          } else {
            setDuration(5);
          }
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("sora2")) {
          // Sora 2 models: duration default 8s, aspect ratio default auto (for I2V) or 16:9 (for T2V), quality default 720p (or 1080p for Pro)
          if (generationMode === "image_to_video") {
            setDuration(8); // Sora 2 I2V supports 4s/8s/12s
            setFrameSize("auto"); // Default to auto for Sora 2 I2V
          } else {
            setDuration(8); // Default 8s for Sora 2 T2V
            setFrameSize("16:9"); // Default aspect ratio for Sora 2 T2V
          }
          setSelectedQuality(newModel.includes("pro") ? "1080p" : "720p"); // Pro defaults to 1080p, Standard to 720p
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (newModel.includes("ltx2")) {
          // LTX V2 I2V: default resolution 1080p, duration 6s, aspect ratio 16:9 (can change)
          setDuration(6);
          setFrameSize("16:9");
          setSelectedResolution("1080p" as any);
          // Clear audio when switching away from WAN models
          if (selectedModel.includes("wan-2.5")) {
            setUploadedAudio("");
          }
        } else if (
          newModel.startsWith("ltx-2.3-fast") ||
          newModel.startsWith("ltx-2.3-pro")
        ) {
          // LTX 2.3 Fast/Pro: default 1080p, 6s
          setSelectedResolution("1080p" as any);
          setDuration(6);
          setFrameSize("16:9");
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
      if (newModel === "gen4_aleph" || newModel.includes("sora2-v2v")) {
        setSelectedModel(newModel);
        // Clear camera movements when switching to non-MiniMax model
        setSelectedCameraMovements([]);
      }
    }
  };

  useEffect(() => {
    if (selectedModel !== PIXVERSE_V6_I2V_MODEL) return;
    setSelectedModel(PIXVERSE_V6_T2V_MODEL);
  }, [selectedModel, setSelectedModel]);

  useEffect(() => {
    if (generationMode !== "image_to_video") return;
    if (selectedModel === PIXVERSE_V5_T2V_MODEL) {
      handleModelChange(PIXVERSE_V5_I2V_MODEL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync variant when mode changes
  }, [generationMode, selectedModel]);

  useEffect(() => {
    if (generationMode !== "text_to_video") return;
    if (selectedModel === PIXVERSE_V5_I2V_MODEL) {
      handleModelChange(PIXVERSE_V6_T2V_MODEL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationMode, selectedModel]);

  useEffect(() => {
    if (selectedModel !== PIXVERSE_V6_T2V_MODEL) return;
    if (duration === "auto") return;
    const n =
      typeof duration === "number"
        ? duration
        : parseInt(String(duration).replace(/s$/i, ""), 10);
    if (!Number.isFinite(n)) return;
    if (n < 5) setDuration(5);
    else if (n > 15) setDuration(15);
  }, [selectedModel, duration, setDuration]);

  useEffect(() => {
    if (selectedModel !== PIXVERSE_V6_I2V_MODEL) return;
    if (duration === "auto") return;
    const n =
      typeof duration === "number"
        ? duration
        : parseInt(String(duration).replace(/s$/i, ""), 10);
    if (!Number.isFinite(n)) return;
    if (n < 5) setDuration(5);
    else if (n > 15) setDuration(15);
  }, [selectedModel, duration, setDuration]);

  const loading = useAppSelector(
    (state: any) => state.history?.loading || false,
  );
  const hasMore = useAppSelector(
    (state: any) => state.history?.hasMore || false,
  );
  const [page, setPage] = useState(1);

  // Redux & Filter State
  const activeGenerations = useAppSelector(
    (state: any) => state.generation?.activeGenerations || [],
  );
  const runningGenerationsCount = activeGenerations.filter(
    (g: any) => g.status === "pending" || g.status === "generating",
  ).length;

  useQueueManagement({
    showSuccessToast: false,
    showErrorToast: false,
  });

  console.log(
    "[InputBox DEBUG] activeGenerations:",
    activeGenerations.length,
    activeGenerations,
  );

  // Read search, sort, and date filters from Redux (managed by HistoryControls)
  const currentFilters = useAppSelector(
    (state: any) => state.history?.filters || {},
  );
  const sortOrder = currentFilters.sortOrder || "desc";
  const searchQuery = currentFilters.search || "";
  const dateRange = currentFilters.dateRange
    ? {
        start: currentFilters.dateRange.start
          ? new Date(currentFilters.dateRange.start)
          : null,
        end: currentFilters.dateRange.end
          ? new Date(currentFilters.dateRange.end)
          : null,
      }
    : { start: null, end: null };

  // Track if initial load has been attempted (to prevent guide flash on refresh)
  const hasAttemptedInitialLoadRef = useRef(false);
  const [hasCompletedInitialHistoryLoad, setHasCompletedInitialHistoryLoad] =
    useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sentinelElement, setSentinelElement] = useState<HTMLDivElement | null>(
    null,
  );
  const historyScrollRef = useRef<HTMLDivElement | null>(null);
  const desktopToolbarControlsRef = useRef<HTMLDivElement | null>(null);
  const isDraggingDesktopToolbarRef = useRef(false);
  const desktopToolbarDragStartXRef = useRef(0);
  const desktopToolbarScrollLeftRef = useRef(0);
  const [historyScrollElement, setHistoryScrollElement] =
    useState<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const hasUserScrolledRef = useRef(false);
  const [extraVideoEntries, setExtraVideoEntries] = useState<any[]>([]);
  const staleFalPlaceholderChecksRef = useRef<Set<string>>(new Set());

  const handleDesktopToolbarWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const container = desktopToolbarControlsRef.current;
      if (!container) return;

      const canScrollHorizontally =
        container.scrollWidth > container.clientWidth + 1;
      if (!canScrollHorizontally) return;

      // Prevent the parent container from vertically scrolling (which makes
      // the toolbar feel like it "slides up/down") and map wheel intent to horizontal scroll.
      event.stopPropagation();
      event.preventDefault();
      const primaryDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      container.scrollLeft += primaryDelta;
    },
    [],
  );

  const handleDesktopToolbarPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const container = desktopToolbarControlsRef.current;
      if (!container) return;
      if (container.scrollWidth <= container.clientWidth + 1) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "button, input, select, textarea, label, a, [role='button'], [data-dropdown]",
        )
      ) {
        return;
      }

      isDraggingDesktopToolbarRef.current = true;
      desktopToolbarDragStartXRef.current = event.clientX;
      desktopToolbarScrollLeftRef.current = container.scrollLeft;
      container.setPointerCapture?.(event.pointerId);
      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
    },
    [],
  );

  const handleDesktopToolbarPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const container = desktopToolbarControlsRef.current;
      if (!container || !isDraggingDesktopToolbarRef.current) return;

      const deltaX = event.clientX - desktopToolbarDragStartXRef.current;
      container.scrollLeft = desktopToolbarScrollLeftRef.current - deltaX;
    },
    [],
  );

  const endDesktopToolbarDrag = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      const container = desktopToolbarControlsRef.current;
      isDraggingDesktopToolbarRef.current = false;
      if (!container) return;
      if (event) {
        container.releasePointerCapture?.(event.pointerId);
      }
      container.style.cursor = "";
      container.style.userSelect = "";
    },
    [],
  );

  // Get history entries for video generation
  const historyEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];
    const hasRenderableVideoMedia = (entry: any) => {
      const hasVideoInImages =
        Array.isArray(entry?.images) &&
        entry.images.some((m: any) =>
          isVideoUrl(m?.firebaseUrl || m?.url || m?.originalUrl),
        );
      const hasVideoInVideos =
        Array.isArray(entry?.videos) &&
        entry.videos.some((v: any) =>
          isVideoUrl(v?.firebaseUrl || v?.url || v?.originalUrl),
        );
      return hasVideoInImages || hasVideoInVideos;
    };
    const isPendingVideoEntry = (entry: any) =>
      isVideoType(entry) &&
      (entry?.status === "generating" || entry?.status === "pending");

    // Helper functions now imported from videoUtils

    // Get entries that are explicitly declared as video types
    const declaredVideoTypes = allEntries.filter(isVideoType);

    // Get entries that have video URLs (fallback for entries that might not have correct generationType)
    const urlVideoTypes = allEntries.filter((entry: any) =>
      hasRenderableVideoMedia(entry),
    );

    // Also get entries that have videos array with video URLs
    const videosArrayTypes = allEntries.filter(
      (entry: any) =>
        entry.videos &&
        Array.isArray(entry.videos) &&
        entry.videos.some((v: any) =>
          isVideoUrl(v?.firebaseUrl || v?.url || v?.originalUrl),
        ),
    );

    // IMPORTANT: Preserve backend order (do NOT sort on the frontend).
    // Iterate in original order and include any entry that is a video type OR contains video URLs.
    const mergedEntries: any[] = [];
    const seen = new Set<string>();
    for (const entry of allEntries) {
      const id = String(entry?.id || "");
      if (!id || seen.has(id)) continue;
      const hasMedia = hasRenderableVideoMedia(entry);
      if (hasMedia || isPendingVideoEntry(entry)) {
        mergedEntries.push(entry);
        seen.add(id);
      }
    }

    // Debug: Log all video entries and specifically animate entries
    const animateEntries = mergedEntries.filter((e: any) => {
      const model = String(e?.model || "").toLowerCase();
      return (
        model.includes("wan-2.2-animate") ||
        model.includes("wan-video/wan-2.2-animate")
      );
    });
    if (animateEntries.length > 0) {
      console.log(
        "[InputBox] ✅ Found animate entries in video history:",
        animateEntries.length,
        animateEntries.map((e: any) => ({
          id: e.id,
          model: e.model,
          generationType: e.generationType,
          status: e.status,
        })),
      );
    }

    // Debug: Log video-to-video entries to ensure they're being included
    const videoToVideoEntries = mergedEntries.filter((e: any) => {
      const normalizedType = normalizeGenerationType(e?.generationType);
      return normalizedType === "video-to-video";
    });
    const videoToVideoInAll = allEntries.filter((e: any) => {
      const normalizedType = normalizeGenerationType(e?.generationType);
      return normalizedType === "video-to-video";
    });
    console.log("[InputBox] Video-to-video entries:", {
      inAllEntries: videoToVideoInAll.length,
      inMergedEntries: videoToVideoEntries.length,
      sample: videoToVideoInAll.slice(0, 2).map((e: any) => ({
        id: e.id,
        model: e.model,
        generationType: e.generationType,
        hasImages: !!e.images?.length,
        hasVideos: !!e.videos?.length,
      })),
    });

    // Count entries by normalized generationType for debugging
    const countsAll = allEntries.reduce(
      (acc: any, e: any) => {
        const normalized = normalizeGenerationType(e.generationType);
        acc[normalized] = (acc[normalized] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Debug: Show raw generationType values to identify any inconsistencies
    const rawGenerationTypes = allEntries.reduce(
      (acc: any, e: any) => {
        const rawType = e.generationType || "undefined";
        acc[rawType] = (acc[rawType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Debug: Log history totals to diagnose missing entries
    console.log("[InputBox] History totals:", {
      all: allEntries.length,
      textToVideo: countsAll["text-to-video"] || 0,
      imageToVideo: countsAll["image-to-video"] || 0,
      videoToVideo: countsAll["video-to-video"] || 0,
      filtered: mergedEntries.length,
      declaredVideoTypes: declaredVideoTypes.length,
      urlVideoTypes: urlVideoTypes.length,
      videosArrayTypes: videosArrayTypes.length,
      rawGenerationTypes,
      normalizedCounts: countsAll,
    });

    // Debug: Show which entries are being filtered and why
    if (mergedEntries.length < allEntries.length) {
      const filteredOut = allEntries.filter(
        (entry: any) =>
          !mergedEntries.some((merged: any) => merged.id === entry.id),
      );
      /*console.log('[VideoPage] Filtered out entries:', filteredOut.map((entry: any) => ({
        id: entry.id,
        generationType: entry.generationType,
        normalizedType: normalizeGenerationType(entry.generationType),
        hasVideoUrls: Array.isArray(entry.images) && entry.images.some((m: any) => isVideoUrl(m?.firebaseUrl || m?.url)),
        prompt: entry.prompt?.substring(0, 50) + '...'
      })));*/
    }

    // Debug: Show the order of entries after backend ordering (no frontend sort)
    if (mergedEntries.length > 0) {
      /*console.log('[VideoPage] Entry order after sorting:', sortedMergedEntries.slice(0, 3).map((entry: any, index: number) => ({
        position: index + 1,
        id: entry.id,
        timestamp: entry.timestamp,
        generationType: entry.generationType,
        prompt: entry.prompt?.substring(0, 30) + '...'
      })));*/
    }

    return mergedEntries;
  }, shallowEqual);

  // Mark that we've attempted initial load once loading starts or completes
  useEffect(() => {
    if (loading || historyEntries.length > 0) {
      hasAttemptedInitialLoadRef.current = true;
    }

    if (hasAttemptedInitialLoadRef.current && !loading) {
      setHasCompletedInitialHistoryLoad(true);
    }
  }, [loading, historyEntries.length]);

  // Get image history entries for image upload modal
  const imageHistoryEntries = useAppSelector((state: any) => {
    const allEntries = state.history?.entries || [];

    // Filter for text-to-image entries (same as image generation component)
    const filteredEntries = allEntries.filter(
      (entry: any) => entry.generationType === "text-to-image",
    );

    // Debug: Log image entries for troubleshooting
    console.log("[VideoPage] Image history entries:", {
      total: filteredEntries.length,
      allEntries: allEntries.length,
      entries: filteredEntries.slice(0, 3).map((entry: any) => ({
        id: entry.id,
        generationType: entry.generationType,
        images: entry.images?.length || 0,
        timestamp: entry.timestamp,
      })),
    });

    return filteredEntries;
  }, shallowEqual);

  // Fetch user's text-to-image history for the UploadModal when needed (local pagination/state)
  const fetchLibraryImages = useCallback(
    async (initial: boolean = false) => {
      try {
        // Use ref to check loading state to avoid stale closure issues
        if (libraryImageLoadingRef.current) {
          console.log(
            "[VideoPage] fetchLibraryImages: Already loading, skipping",
          );
          return;
        }
        // For non-initial loads, check if we have a cursor (hasMore) and modal is open
        if (!initial) {
          if (!libraryImageNextCursorRef.current) {
            console.log(
              "[VideoPage] fetchLibraryImages: No nextCursor, no more items",
            );
            setLibraryImageHasMore(false);
            return;
          }
          if (!isUploadModalOpen) {
            console.log(
              "[VideoPage] fetchLibraryImages: Modal not open, skipping",
            );
            return;
          }
        }
        libraryImageLoadingRef.current = true;
        setLibraryImageLoading(true);
        const api = getApiClient();
        const params: any = {
          generationType: "text-to-image",
          limit: 30,
          sortBy: "createdAt",
        };
        // For pagination, use the cursor from the previous response
        // IMPORTANT: Read cursor from ref at the time of request to ensure we have the latest value
        const currentCursor = libraryImageNextCursorRef.current;
        if (!initial && currentCursor) {
          // Backend expects `nextCursor` for pagination; using `cursor` causes first page to repeat
          params.nextCursor = currentCursor;
          console.log("[VideoPage] 🔄 Pagination request with cursor:", {
            cursor: currentCursor,
            cursorType: typeof currentCursor,
            cursorLength: String(currentCursor).length,
            isInitial: initial,
            currentEntriesCount: libraryImageEntries.length,
          });
        } else if (initial) {
          // Ensure no cursor is sent for initial load
          console.log("[VideoPage] 🆕 Initial load (no cursor)", {
            currentCursor: currentCursor ? "present but ignored" : "none",
            currentEntriesCount: libraryImageEntries.length,
          });
        } else {
          console.warn(
            "[VideoPage] ⚠️ Pagination requested but no cursor available!",
            {
              currentCursor,
              hasMore: libraryImageHasMore,
              currentEntriesCount: libraryImageEntries.length,
            },
          );
        }
        // Ensure createdAt ordering always requested
        params.sortBy = "createdAt";
        const res = await api.get("/api/generations", { params });
        const payload = res.data?.data || res.data || {};
        const items: any[] = Array.isArray(payload.items) ? payload.items : [];
        const nextCursor: string | number | undefined = payload.nextCursor;

        // Ensure all items have the images array properly structured
        const normalizedItems = items.map((item: any) => {
          // Clone the item to avoid mutating the original
          const normalized = { ...item };

          // If item doesn't have images array, try to extract from other properties
          if (
            !Array.isArray(normalized.images) ||
            normalized.images.length === 0
          ) {
            // Some APIs might return images in a different structure
            if (normalized.media && Array.isArray(normalized.media)) {
              normalized.images = normalized.media.filter(
                (m: any) => m.type === "image" || !m.type,
              );
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
              if (typeof img === "string") {
                // If image is just a URL string, convert to object
                return { url: img, id: img };
              }
              return img;
            });
          }

          return normalized;
        });

        console.log("[VideoPage] fetchLibraryImages API response:", {
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
              url: img.url?.substring(0, 50) + "...",
              thumbnailUrl: img.thumbnailUrl ? "present" : "missing",
              avifUrl: img.avifUrl ? "present" : "missing",
            })),
          })),
          nextCursor: nextCursor ? "present" : "null",
        });

        // Merge uniquely by id using functional update to avoid stale closure
        // Always create a new array reference to ensure React detects the change
        setLibraryImageEntries((prevEntries) => {
          // If this is an initial load, replace all entries (don't merge with old data)
          if (initial) {
            console.log(
              "[VideoPage] fetchLibraryImages initial load - replacing all entries",
            );
            const sorted = normalizedItems.sort((a: any, b: any) => {
              const timeA = new Date(a.createdAt || a.timestamp || 0).getTime();
              const timeB = new Date(b.createdAt || b.timestamp || 0).getTime();
              return timeB - timeA; // Descending (newest first)
            });
            console.log("[VideoPage] fetchLibraryImages initial load result:", {
              itemsCount: normalizedItems.length,
              sortedCount: sorted.length,
              sample: sorted.slice(0, 2).map((e: any) => ({
                id: e.id,
                generationType: e.generationType,
                imagesCount: e.images?.length || 0,
                hasImages: Array.isArray(e.images) && e.images.length > 0,
              })),
            });
            // Always return a new array reference
            return [...sorted];
          }

          // For pagination loads, merge with existing entries
          // IMPORTANT: Check if items are actually new by comparing IDs
          const existingIds = new Set(
            prevEntries.map((e: any) => e?.id).filter(Boolean),
          );
          const newItems = normalizedItems.filter(
            (item: any) => item?.id && !existingIds.has(item.id),
          );
          const existingItems = normalizedItems.filter(
            (item: any) => item?.id && existingIds.has(item.id),
          );

          console.log("[VideoPage] fetchLibraryImages pagination merge:", {
            previousCount: prevEntries.length,
            newItemsReceived: normalizedItems.length,
            actuallyNew: newItems.length,
            duplicates: existingItems.length,
            newItemIds: newItems.slice(0, 5).map((e: any) => e.id),
            newItemsWithImages: newItems.filter(
              (e: any) => Array.isArray(e.images) && e.images.length > 0,
            ).length,
          });

          if (newItems.length === 0) {
            console.warn(
              "[VideoPage] ⚠️ ALL ITEMS ARE DUPLICATES! API is returning same items. Cursor might not be working.",
            );
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

          console.log("[VideoPage] fetchLibraryImages after merge:", {
            previousCount: prevEntries.length,
            newItemsCount: normalizedItems.length,
            newItemsAdded: newItems.length,
            mergedCount: merged.length,
            mergedEntriesWithImages: merged.filter(
              (e: any) => Array.isArray(e.images) && e.images.length > 0,
            ).length,
            mergedSample: merged.slice(0, 3).map((e: any) => ({
              id: e.id,
              generationType: e.generationType,
              imagesCount: e.images?.length || 0,
              hasImages: Array.isArray(e.images) && e.images.length > 0,
              firstImageUrl: e.images?.[0]?.url?.substring(0, 50) + "...",
              firstImageThumbnail: e.images?.[0]?.thumbnailUrl
                ? "present"
                : "missing",
            })),
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
        const newCursor = nextCursor
          ? typeof nextCursor === "string"
            ? nextCursor
            : String(nextCursor)
          : undefined;
        libraryImageNextCursorRef.current = newCursor;

        // Log cursor update immediately
        console.log("[VideoPage] 📥 Cursor updated in ref:", {
          previousCursor: previousCursor
            ? `${String(previousCursor).substring(0, 20)}...`
            : "none",
          newCursor: newCursor
            ? `${String(newCursor).substring(0, 20)}...`
            : "none",
          cursorChanged: previousCursor !== newCursor,
          itemsReceived: items.length,
        });

        // Set hasMore: if there's a nextCursor, we definitely have more items to load
        // The presence of nextCursor is the definitive indicator from the backend
        const hasMoreItems = Boolean(nextCursor);

        console.log("[VideoPage] 📥 fetchLibraryImages response received:", {
          itemsCount: items.length,
          requested: params.limit || 30,
          previousCursor: previousCursor
            ? `${String(previousCursor).substring(0, 20)}...`
            : "none",
          newCursor: newCursor
            ? `${String(newCursor).substring(0, 20)}...`
            : "null",
          newCursorType: typeof nextCursor,
          newCursorFull: newCursor,
          cursorChanged: previousCursor !== newCursor,
          hasMoreItems,
          currentEntriesCount: libraryImageEntries.length,
        });

        // If cursor didn't change and we got items, it means we're getting duplicates
        if (!initial && previousCursor === newCursor && items.length > 0) {
          console.warn(
            "[VideoPage] ⚠️ WARNING: Cursor did not change but got items! API might be returning same page.",
          );
        }

        setLibraryImageHasMore(hasMoreItems);
      } catch (e) {
        console.error("[VideoPage] Failed to fetch library images:", e);
      } finally {
        libraryImageLoadingRef.current = false;
        setLibraryImageLoading(false);
      }
    },
    [isUploadModalOpen],
  );

  // Debug: Log when libraryImageEntries changes to verify state updates
  useEffect(() => {
    if (isUploadModalOpen) {
      console.log("[VideoPage] libraryImageEntries state updated:", {
        count: libraryImageEntries.length,
        sampleEntries: libraryImageEntries.slice(0, 3).map((e: any) => ({
          id: e.id,
          generationType: e.generationType,
          imagesCount: e.images?.length || 0,
          hasImages: Array.isArray(e.images) && e.images.length > 0,
          firstImage: e.images?.[0]
            ? {
                id: e.images[0].id,
                url: e.images[0].url?.substring(0, 50) + "...",
                thumbnailUrl: e.images[0].thumbnailUrl ? "present" : "missing",
              }
            : null,
        })),
        allEntriesWithImages: libraryImageEntries.filter(
          (e: any) => Array.isArray(e.images) && e.images.length > 0,
        ).length,
      });
    }
  }, [libraryImageEntries, isUploadModalOpen]);

  // UploadModal now owns its own library loading via the shared library API.
  // Keep local state reset only so stale debug state does not persist across modal sessions.
  useEffect(() => {
    if (!isUploadModalOpen) {
      libraryImageNextCursorRef.current = undefined;
      libraryImageLoadingRef.current = false;
      libraryImageInitRef.current = false;
      setLibraryImageHasMore(true);
      setLibraryImageEntries([]);
      setLibraryImageLoading(false);
    }
  }, [isUploadModalOpen]);

  // Group entries by date while PRESERVING backend order (do not sort dates in frontend).
  const visibleHistoryEntries = useMemo(() => {
    if (!(dateRange.start && dateRange.end)) return historyEntries;
    const startMs = dateRange.start.getTime();
    const endMs = dateRange.end.getTime();
    return historyEntries.filter((entry: HistoryEntry) => {
      try {
        const raw =
          entry.timestamp || entry.createdAt || (entry as any).updatedAt;
        const ms = new Date(raw as any).getTime();
        return !Number.isNaN(ms) && ms >= startMs && ms <= endMs;
      } catch {
        return false;
      }
    });
  }, [historyEntries, dateRange]);

  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: HistoryEntry[] } = {};
    const dateOrder: string[] = [];
    for (const entry of visibleHistoryEntries) {
      const date = new Date(entry.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
        dateOrder.push(date);
      }
      groups[date].push(entry);
    }
    return { groups, dateOrder };
  }, [visibleHistoryEntries]);

  const sortedDates = groupedByDate.dateOrder;
  // Today key for injecting local preview into today's row
  const todayKey = new Date().toDateString();

  // Local, ephemeral preview entry for video generations
  const [localVideoPreview, setLocalVideoPreview] =
    useState<HistoryEntry | null>(null);

  // Track which videos have loaded to hide loading effects
  const [loadedVideos, setLoadedVideos] = useState<Set<string>>(new Set());

  // Track entries that have been added to history to prevent duplicate rendering
  const historyEntryIdsRef = useRef<Set<string>>(new Set());

  // Get current entries from Redux
  const existingEntries = useAppSelector(
    (state: any) => state.history?.entries || [],
  );

  useEffect(() => {
    if (!localVideoPreview) return;

    // Check if this entry already exists in Redux history
    const entryId = localVideoPreview.id;
    const entryFirebaseId = (localVideoPreview as any)?.firebaseHistoryId;

    // FIRST: Check ref (updated immediately when entry is added to history)
    const existsInRef =
      (entryId && historyEntryIdsRef.current.has(entryId)) ||
      (entryFirebaseId && historyEntryIdsRef.current.has(entryFirebaseId));

    // SECOND: Check Redux state
    const existsInHistory = existingEntries.some((e: HistoryEntry) => {
      const eId = e.id;
      const eFirebaseId = (e as any)?.firebaseHistoryId;
      if (entryId && (eId === entryId || eFirebaseId === entryId)) return true;
      if (
        entryFirebaseId &&
        (eId === entryFirebaseId || eFirebaseId === entryFirebaseId)
      )
        return true;
      return false;
    });

    // CRITICAL: If entry exists in ref OR history, immediately clear local preview
    if (existsInRef || existsInHistory) {
      setLocalVideoPreview(null);
      return;
    }

    // If entry completes/fails but not in history yet, clear after delay
    if (
      localVideoPreview.status === "completed" ||
      localVideoPreview.status === "failed"
    ) {
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
        console.warn(
          "[refreshSingleGeneration] Generation not found, falling back to full refresh",
        );
        const refreshFilters: any = { mode: "video" };
        dispatch(setFilters(refreshFilters));
        dispatch(
          loadHistory({
            filters: refreshFilters as any,
            backendFilters: refreshFilters as any,
            paginationParams: { limit: 20 },
            requestOrigin: "page",
            expectedType: "video",
            debugTag: `InputBox:refresh:video-mode:${Date.now()}`,
          } as any),
        );
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
        id: item.id || historyId,
        timestamp: iso,
        createdAt: iso,
      } as HistoryEntry;

      setExtraVideoEntries((prev) =>
        prev.filter((entry: any) => {
          const entryId = String(entry?.id || "");
          const entryFirebaseId = String((entry as any)?.firebaseHistoryId || "");
          const normalizedId = String(normalizedEntry.id || historyId);
          const normalizedFirebaseId = String(
            (normalizedEntry as any)?.firebaseHistoryId || "",
          );

          return ![
            String(historyId || ""),
            normalizedId,
            normalizedFirebaseId,
          ]
            .filter(Boolean)
            .includes(entryId || entryFirebaseId);
        }),
      );

      // Check if entry already exists in current Redux state
      const exists = existingEntries.some(
        (e: HistoryEntry) => e.id === historyId,
      );

      // CRITICAL: Track this entry ID in ref IMMEDIATELY before adding to Redux
      historyEntryIdsRef.current.add(historyId);
      if (normalizedEntry.id)
        historyEntryIdsRef.current.add(normalizedEntry.id);
      if ((normalizedEntry as any)?.firebaseHistoryId) {
        historyEntryIdsRef.current.add(
          (normalizedEntry as any).firebaseHistoryId,
        );
      }

      if (exists) {
        dispatch(
          updateHistoryEntry({
            id: historyId,
            updates: {
              status: normalizedEntry.status,
              images: normalizedEntry.images,
              videos: normalizedEntry.videos,
              timestamp: normalizedEntry.timestamp,
            },
          }),
        );
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
        if (
          normalizedEntry.id &&
          (prevId === normalizedEntry.id ||
            prevFirebaseId === normalizedEntry.id)
        )
          return null;
        const normalizedFirebaseId = (normalizedEntry as any)
          ?.firebaseHistoryId;
        if (
          normalizedFirebaseId &&
          (prevId === normalizedFirebaseId ||
            prevFirebaseId === normalizedFirebaseId)
        )
          return null;

        // If local preview is completed and we just added a completed history entry, clear it
        if (
          prev.status === "completed" &&
          normalizedEntry.status === "completed"
        )
          return null;

        return prev;
      });
    } catch (error) {
      console.error(
        "[refreshSingleGeneration] Failed to fetch single generation, falling back to full refresh:",
        error,
      );
      const refreshFilters: any = { mode: "video" };
      dispatch(setFilters(refreshFilters));
      dispatch(
        loadHistory({
          filters: refreshFilters as any,
          backendFilters: refreshFilters as any,
          paginationParams: { limit: 20 },
          requestOrigin: "page",
          expectedType: "video",
          debugTag: `InputBox:refresh:video-mode:${Date.now()}`,
        } as any),
      );
    }
  };

  // Fetch missing video categories directly from Firestore (image_to_video, video_to_video).
  // Run after the first real history payload arrives so the initial "Recent" view is complete.
  useEffect(() => {
    const hasActiveFilters = Boolean(
      searchQuery.trim() || (dateRange.start && dateRange.end),
    );

    // When search/date filters are active, keep backend results as the source of truth.
    if (hasActiveFilters) {
      setExtraVideoEntries([]);
      return;
    }

    // Skip until initial video history has actually loaded.
    if (historyEntries.length === 0) {
      setExtraVideoEntries([]);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        // Fetch entries with both underscore and hyphen patterns to ensure we get all video types
        const [
          textToVideo,
          imageToVideoHyphen,
          imageToVideoUnderscore,
          videoToVideoHyphen,
          videoToVideoUnderscore,
        ] = await Promise.all([
          getHistoryEntries(
            { generationType: "text-to-video" as any },
            { limit: 20 },
          ),
          getHistoryEntries(
            { generationType: "image-to-video" as any },
            { limit: 20 },
          ),
          getHistoryEntries(
            { generationType: "image_to_video" as any },
            { limit: 20 },
          ),
          getHistoryEntries(
            { generationType: "video-to-video" as any },
            { limit: 20 },
          ),
          getHistoryEntries(
            { generationType: "video_to_video" as any },
            { limit: 20 },
          ),
        ]);

        if (!isMounted) return;

        // Combine all results and remove duplicates by ID
        const allResults = [
          ...(textToVideo.data || []),
          ...(imageToVideoHyphen.data || []),
          ...(imageToVideoUnderscore.data || []),
          ...(videoToVideoHyphen.data || []),
          ...(videoToVideoUnderscore.data || []),
        ];

        const byId: Record<string, any> = {};
        allResults.forEach((entry: any) => {
          byId[entry.id] = entry;
        });

        const combined = Object.values(byId);

        // Keep the merged fallback entries aligned with the active sort selection.
        const sortedCombined = combined.sort((a: any, b: any) => {
          const timestampA = new Date(
            a.timestamp || a.createdAt || 0,
          ).getTime();
          const timestampB = new Date(
            b.timestamp || b.createdAt || 0,
          ).getTime();
          return sortOrder === "asc"
            ? timestampA - timestampB
            : timestampB - timestampA;
        });

        setExtraVideoEntries(sortedCombined);
        console.log("[VideoPage] fetched extra video entries:", {
          total: sortedCombined.length,
          textToVideo: textToVideo.data?.length || 0,
          imageToVideoHyphen: imageToVideoHyphen.data?.length || 0,
          imageToVideoUnderscore: imageToVideoUnderscore.data?.length || 0,
          videoToVideoHyphen: videoToVideoHyphen.data?.length || 0,
          videoToVideoUnderscore: videoToVideoUnderscore.data?.length || 0,
          unique: sortedCombined.length,
          firstTimestamp: sortedCombined[0]?.timestamp || "none",
          lastTimestamp:
            sortedCombined[sortedCombined.length - 1]?.timestamp || "none",
        });
      } catch (e) {
        console.error("[VideoPage] extra fetch failed:", e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [
    historyEntries.length,
    sortOrder,
    searchQuery,
    dateRange.start,
    dateRange.end,
  ]);

  // Combine redux video entries with extra fetched ones
  const historyEntriesForDisplay = React.useMemo(() => {
    const byId: Record<string, any> = {};
    historyEntries.forEach((e: any) => {
      byId[e.id] = e;
    });
    extraVideoEntries.forEach((e: any) => {
      byId[e.id] = e;
    });
    const list = Object.values(byId).filter((entry: any) => {
      const hasVideoInImages =
        Array.isArray(entry?.images) &&
        entry.images.some((m: any) =>
          isVideoUrl(m?.firebaseUrl || m?.url || m?.originalUrl),
        );
      const hasVideoInVideos =
        Array.isArray(entry?.videos) &&
        entry.videos.some((v: any) =>
          isVideoUrl(v?.firebaseUrl || v?.url || v?.originalUrl),
        );
      const isPending =
        entry?.status === "generating" || entry?.status === "pending";
      return (
        hasVideoInImages ||
        hasVideoInVideos ||
        (isVideoType(entry) && isPending)
      );
    });

    // Match the current history sort order so Recent/Oldest stays stable without a toggle.
    const sortedList = list.sort((a: any, b: any) => {
      const timestampA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timestampB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return sortOrder === "asc"
        ? timestampA - timestampB
        : timestampB - timestampA;
    });

    /*console.log('[VideoPage] display entries count:', sortedList.length);
    console.log('[VideoPage] first entry timestamp:', sortedList[0]?.timestamp || 'none');
    console.log('[VideoPage] last entry timestamp:', sortedList[sortedList.length - 1]?.timestamp || 'none');*/

    // Debug: Show the complete order of display entries
    if (sortedList.length > 0) {
      console.log(
        "[VideoPage] Complete display order:",
        sortedList.map((entry: any, index: number) => ({
          position: index + 1,
          id: entry.id,
          timestamp: entry.timestamp,
          generationType: entry.generationType,
          source: historyEntries.some((h) => h.id === entry.id)
            ? "Redux"
            : "Extra",
          prompt: entry.prompt?.substring(0, 30) + "...",
          status: entry.status,
          images: entry.images?.length || 0,
          videos: entry.videos?.length || 0,
          hasImages: !!entry.images,
          hasVideos: !!entry.videos,
        })),
      );

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
          fullEntry: entry,
        });
      });
    }

    return sortedList as any[];
  }, [historyEntries, extraVideoEntries, sortOrder]);

  useEffect(() => {
    const activeIds = new Set<string>();
    activeGenerations.forEach((gen: any) => {
      if (gen?.id) activeIds.add(String(gen.id));
      if (gen?.historyId) activeIds.add(String(gen.historyId));
    });

    const candidates = historyEntriesForDisplay
      .filter((entry: any) => {
        const entryId = String(entry?.id || "");
        const providerTaskId = String((entry as any)?.providerTaskId || "");
        const status = String(entry?.status || "").toLowerCase();
        const provider = String((entry as any)?.provider || "").toLowerCase();

        if (!entryId || !providerTaskId) return false;
        if (activeIds.has(entryId)) return false;
        if (provider !== "fal") return false;
        if (status !== "generating" && status !== "pending") return false;
        if (!isVideoType(entry)) return false;
        if (staleFalPlaceholderChecksRef.current.has(entryId)) return false;

        return true;
      })
      .slice(0, 4);

    if (candidates.length === 0) return;

    let cancelled = false;

    candidates.forEach((entry: any) => {
      const entryId = String(entry.id);
      staleFalPlaceholderChecksRef.current.add(entryId);

      void (async () => {
        try {
          const res = await axiosInstance.get("/api/fal/queue/status", {
            params: {
              model: entry.model,
              requestId: (entry as any).providerTaskId,
            },
            timeout: 15000,
          });
          if (cancelled) return;

          const status = res.data?.data || res.data;
          const statusValue = String(status?.status || "").toLowerCase();
          if (
            statusValue === "completed" ||
            statusValue === "success" ||
            statusValue === "succeeded" ||
            statusValue === "failed" ||
            statusValue === "error" ||
            statusValue === "cancelled" ||
            statusValue === "canceled"
          ) {
            await refreshSingleGeneration(entryId);
            return;
          }

          setTimeout(() => {
            staleFalPlaceholderChecksRef.current.delete(entryId);
          }, 15000);
        } catch (err: any) {
          if (cancelled) return;

          const terminalMessage = getTerminalFalErrorMessage(err);
          const statusCode = Number(
            err?.response?.status || err?.status || 0,
          );

          if (
            terminalMessage ||
            (statusCode >= 400 && statusCode !== 408 && statusCode !== 429)
          ) {
            await refreshSingleGeneration(entryId);
            return;
          }

          staleFalPlaceholderChecksRef.current.delete(entryId);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [historyEntriesForDisplay, activeGenerations]);

  // Auto-load more history pages until we find non-text video types (bounded attempts)
  // IMPORTANT: Only run after initial load is complete to prevent duplicate requests
  const autoLoadAttemptsRef = useRef(0);
  useEffect(() => {
    // Don't run autofill until initial load has completed AND we have entries
    // This prevents duplicate requests on page load
    if (
      !hasAttemptedInitialLoadRef.current ||
      loading ||
      historyEntries.length === 0
    ) {
      return;
    }

    // Check if we have ANY video types (including T2V, I2V, etc.)
    // We use the inclusive isVideoType helper to prevent infinite loading references
    const hasVideos = (historyEntries || []).some(isVideoType);

    if (!hasVideos && hasMore && !loading && autoLoadAttemptsRef.current < 10) {
      autoLoadAttemptsRef.current += 1;
      // Use consistent limit of 20 for all requests
      dispatch(
        loadMoreHistory({
          filters: {
            mode: "video",
            sortOrder,
            ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
          } as any,
          backendFilters: {
            mode: "video",
            sortOrder,
            ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
          } as any,
          paginationParams: { limit: 20 },
        }) as any,
      );
    }
  }, [historyEntries, hasMore, loading, dispatch, sortOrder, searchQuery]);

  // Helpers imported from videoUtils

  // Auto-adjust textarea height

  // PageRouter already loads initial history, so we just set up pagination state
  useEffect(() => {
    setPage(1);
  }, []);

  // Get current UI generation type to detect feature switches
  const currentUIGenerationType = useAppSelector(
    (s: any) => s.ui?.currentGenerationType || "text-to-image",
  );
  const lastUIGenerationTypeRef = useRef<string>(currentUIGenerationType);
  const isVideoRouteContext = Boolean(
    pathname?.startsWith("/text-to-video") ||
    pathname?.startsWith("/image-to-video"),
  );

  // Initial history is loaded centrally by PageRouter. This component only manages pagination.
  // However, if central load doesn't run (e.g., direct navigation), trigger an initial page-origin load for videos.
  const didInitialLoadRef = useRef(false);

  // Note: onSortChange and onDateChange are now handled by HistoryControls component
  // Use mode: 'video' to load ALL video types at once (same as History.tsx)
  // This ensures we get text-to-video, image-to-video, AND video-to-video (including animate entries)
  useEffect(() => {
    const norm = (t: string) => t.replace(/[_-]/g, "-").toLowerCase();
    const normalizedCurrentUI = norm(
      currentUIGenerationType === "image-to-image"
        ? "text-to-image"
        : currentUIGenerationType,
    );
    const normalizedLastUI = norm(
      lastUIGenerationTypeRef.current === "image-to-image"
        ? "text-to-image"
        : lastUIGenerationTypeRef.current,
    );
    const isVideoType =
      isVideoRouteContext ||
      ["text-to-video", "image-to-video", "video-to-video"].includes(
        normalizedCurrentUI,
      );

    // Check if user switched to video generation from another feature
    const switchedToVideo =
      isVideoType && normalizedLastUI !== normalizedCurrentUI;

    // Check if filters are for a different type (e.g., image filters when we're on video page)
    const currentFilterMode = currentFilters?.mode;
    const currentFilterSort = (currentFilters as any)?.sortOrder;
    const filtersAreForVideo = currentFilterMode === "video";
    const filtersAreForDifferentType =
      currentFilterMode && currentFilterMode !== "video";
    const sortMismatch = currentFilterSort && currentFilterSort !== sortOrder;

    // Reset initial load flag if user switched to video generation or filters don't match
    if (
      switchedToVideo ||
      (isVideoType && filtersAreForDifferentType) ||
      (isVideoType && sortMismatch)
    ) {
      console.log(
        "[VideoInputBox] User switched to video generation or filters mismatch, resetting load flag",
        {
          switchedToVideo,
          filtersAreForDifferentType,
          currentFilterMode,
          sortMismatch,
          currentFilterSort,
          desiredSortOrder: sortOrder,
          currentUIGenerationType,
        },
      );
      didInitialLoadRef.current = false;
    }

    // Always update the last UI type ref to track changes
    lastUIGenerationTypeRef.current = currentUIGenerationType;

    // Only load if we haven't loaded yet, or if user just switched to video, or filters don't match
    if (
      didInitialLoadRef.current &&
      !switchedToVideo &&
      !filtersAreForDifferentType &&
      !sortMismatch
    ) {
      return;
    }

    // Only proceed if we're on a video generation page
    if (!isVideoType) {
      return;
    }

    // Load all video types using mode: 'video' (backend handles this correctly)
    didInitialLoadRef.current = true;

    try {
      console.log("[VideoInputBox] Loading video history", {
        switchedToVideo,
        filtersAreForDifferentType,
        currentUIGenerationType,
        currentFilterMode,
      });
      // Use mode: 'video' which backend converts to ['text-to-video', 'image-to-video', 'video-to-video']
      // This is the same approach History.tsx uses and ensures all video types are loaded
      const videoFilters: any = {
        mode: "video",
        sortOrder,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(dateRange.start && dateRange.end
          ? {
              dateRange: {
                start: dateRange.start.toISOString(),
                end: dateRange.end.toISOString(),
              },
            }
          : {}),
      };

      // Keep selected filters in sync before loadHistory so stale-response protection
      // in historySlice does not drop this response and cause retry loops.
      dispatch(setFilters(videoFilters));

      dispatch(
        loadHistory({
          filters: videoFilters as any,
          backendFilters: videoFilters as any,
          paginationParams: { limit: 20 },
          requestOrigin: "page",
          expectedType: "video",
          debugTag: `InputBox:video-mode:${Date.now()}`,
          forceRefresh: true, // keep backend as source of truth
        } as any),
      );
    } catch (e) {
      console.error("[VideoInputBox] Error loading history:", e);
    }
  }, [
    dispatch,
    currentUIGenerationType,
    currentFilters,
    sortOrder,
    dateRange,
    searchQuery,
    isVideoRouteContext,
  ]);

  // Mark user scroll inside the scrollable history container
  useEffect(() => {
    const container = historyScrollElement;
    if (!container) return;
    const onScroll = () => {
      hasUserScrolledRef.current = true;
    };
    container.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => {
      container.removeEventListener("scroll", onScroll as any);
    };
  }, [historyScrollElement]);

  // Standardized intersection observer for video history
  // Replace IntersectionObserver with History-style bottom scroll pagination
  // Only enable pagination when there are entries to paginate (not when showing guide)
  // Extracted loadMore for HistorySection
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !user) return;
    // Use functional update to avoid 'page' dependency
    setPage((prev) => prev + 1);
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

      // Use mode: 'video' which backend converts to all video types including video-to-video
      // Use consistent limit of 10 for all requests
      const filters: any = { mode: "video", sortOrder: currentSortOrder };
      if (currentSearch) filters.search = currentSearch;
      if (currentDateRange?.start && currentDateRange?.end) {
        filters.dateRange = {
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
        mode: "video",
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
          filters: filters,
          backendFilters: backendFilters,
          paginationParams: { limit: 30 }, // Increased from 10 to 30 to load more items per page and reduce pagination gaps
        }),
      ).unwrap();
    } catch {
      /* swallow */
    }
  }, [
    loading,
    hasMore,
    user,
    currentFilters,
    sortOrder,
    searchQuery,
    dateRange,
    dispatch,
  ]);

  const handleVideoClick = useCallback((entry: HistoryEntry, video: any) => {
    setPreview({ entry, video });
  }, []);

  const getSeedanceReferenceLimits = useCallback(() => {
    const isSeedanceRef = isSeedance2ReferenceModel(selectedModel);
    return {
      maxTotalFiles: isSeedanceRef ? 12 : Infinity,
      maxReferenceImages: isSeedanceRef ? 9 : 4,
      maxImageBytes: isSeedanceRef ? 30 * 1024 * 1024 : Infinity,
    };
  }, [selectedModel]);

  const getCurrentModalityFileCount = useCallback(() => {
    // Total files across modalities for Seedance reference models:
    // - reference images: references[]
    // - reference videos: uploadedVideos[]
    // - reference audio: uploadedAudio (single)
    const videoCount = uploadedVideos?.length || (uploadedVideo ? 1 : 0);
    const audioCount = uploadedAudio ? 1 : 0;
    return (references?.length || 0) + videoCount + audioCount;
  }, [references, uploadedAudio, uploadedVideo, uploadedVideos]);

  // Handle references upload
  const handleReferencesUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    const { maxTotalFiles, maxReferenceImages, maxImageBytes } =
      getSeedanceReferenceLimits();
    const currentTotal = getCurrentModalityFileCount();
    const remainingTotalSlots = Math.max(0, maxTotalFiles - currentTotal);
    const remainingImageSlots = Math.max(0, maxReferenceImages - references.length);
    const slotsLeft = Math.min(remainingTotalSlots, remainingImageSlots);

    if (slotsLeft <= 0) {
      if (isSeedance2ReferenceModel(selectedModel)) {
        toast.error("Reference limit reached (max 9 images, max 12 total files).");
      }
      event.target.value = "";
      return;
    }

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (isSeedance2ReferenceModel(selectedModel) && file.size > maxImageBytes) {
        toast.error(`"${file.name}" is too large. Max 30MB per image.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return;
        setReferences((prev) => {
          const next = [...prev, result];
          // Enforce max counts deterministically.
          const limitedByImages = next.slice(0, maxReferenceImages);
          const totalBefore = (prev?.length || 0) + (uploadedVideo ? 1 : 0) + (uploadedAudio ? 1 : 0);
          const remaining = Math.max(0, maxTotalFiles - totalBefore);
          const limitedByTotal = limitedByImages.slice(0, remaining);
          if (limitedByTotal.length < next.length && isSeedance2ReferenceModel(selectedModel)) {
            toast.error("Some files were not added (max 9 images, max 12 total files).");
          }
          return limitedByTotal;
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = "";
  };

  // Remove reference
  const removeReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle image/video upload from UploadModal
  const handleImageUploadFromModal = (
    urls: string[],
    entries?: any[],
    filesByUrl?: Record<string, File>,
  ) => {
    if (uploadModalType === "image") {
      if (uploadModalTarget === "last_frame") {
        // Handle last frame image
        setLastFrameImage(urls[0] || "");
      } else {
        // For WAN 2.2 Animate Replace, set character image instead of uploaded images
        if (
          selectedModel === "wan-2.2-animate-replace" ||
          (activeFeature === "Animate" && selectedModel.includes("wan-2.2"))
        ) {
          setUploadedCharacterImage(urls[0] || "");
        } else {
          // Replace existing images instead of appending
          // Seedance I2V uses this regular uploadedImages array
          setUploadedImages(urls);
        }
      }
    } else if (uploadModalType === "reference") {
      const { maxTotalFiles, maxReferenceImages } = getSeedanceReferenceLimits();
      const totalBefore = getCurrentModalityFileCount();
      const remainingTotalSlots = Math.max(0, maxTotalFiles - totalBefore);
      const remainingImageSlots = Math.max(0, maxReferenceImages - references.length);
      const canAdd = Math.min(remainingTotalSlots, remainingImageSlots);

      if (isSeedance2ReferenceModel(selectedModel) && canAdd <= 0) {
        toast.error("Reference limit reached (max 9 images, max 12 total files).");
      } else {
        const toAdd = urls.slice(0, canAdd);
        const dropped = urls.length - toAdd.length;
        if (dropped > 0 && isSeedance2ReferenceModel(selectedModel)) {
          toast.error("Some files were not added (max 9 images, max 12 total files).");
        }
        if (toAdd.length) {
          setReferences((prev) => [...prev, ...toAdd].slice(0, maxReferenceImages));
        }
      }
    } else if (uploadModalType === "video") {
      const maxVideos = isSeedance2ReferenceModel(selectedModel) ? 3 : 1;
      const nextVideos = (urls || []).slice(0, maxVideos);
      const first = nextVideos[0] || "";
      setUploadedVideos(nextVideos);
      setUploadedVideo(first);
      setUploadedVideoDurationSec(0);
      if (filesByUrl && Object.keys(filesByUrl).length) {
        setLocalVideoFilesByUrl((prev) => ({ ...prev, ...filesByUrl }));
      }
      if (first) {
        (async () => {
          try {
            const d = await loadVideoDurationSeconds(first);
            setUploadedVideoDurationSec(d);
          } catch (e) {
            console.warn("[VideoInputBox] Failed to read video duration", e);
            setUploadedVideoDurationSec(0);
          }
        })();
      }
      // For Sora 2 Remix, use the entry ID from the modal if provided
      if (first && selectedModel.includes("sora2-v2v")) {
        if (entries && entries.length > 0 && entries[0]?.id) {
          // Use the entry ID directly from the modal
          setSourceHistoryEntryId(entries[0].id);
        } else {
          // Fallback: Try to find the matching history entry by URL
          const matchingEntry = historyEntries.find((entry: any) => {
            const entryVideos = entry?.images || [];
            return entryVideos.some(
              (img: any) =>
                img?.url === first ||
                img?.firebaseUrl === first ||
                img?.originalUrl === first,
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
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            setUploadedImages((prev) => [...prev, result]);

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
    event.target.value = "";
  };

  // Handle video upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    const allowedMimes = new Set([
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/mov",
      "video/h264",
    ]);

    const maxBytes = getMaxVideoSize(selectedModel);
    if (!allowedMimes.has(file.type)) {
      toast.error("Unsupported video type. Use MP4, WebM, MOV, OGG, or H.264");
      event.target.value = "";
      return;
    }
    if (file.size > maxBytes) {
      const mbLimit = Math.floor(maxBytes / (1024 * 1024));
      toast.error(
        `Video too large for this model (Max ${mbLimit}MB). This limit is enforced by the AI provider.`
      );
      event.target.value = "";
      return;
    }

    if (file.type.startsWith("video/")) {
      // Use Blob URL instead of Data URL for better performance and memory management
      const url = URL.createObjectURL(file);
      setUploadedVideo(url);
      
      // Track the File object so it can be uploaded to Zata later
      setLocalVideoFilesByUrl(prev => ({ ...prev, [url]: file }));
      
      toast.success("Video added");
    }

    // Reset input
    event.target.value = "";
  };

  // Handle audio upload for WAN models
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    // Validate file type and size (wav/mp3, ≤15MB, 3-30s)
    const allowedMimes = new Set([
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/mpeg3",
      "audio/x-mpeg-3",
    ]);

    const maxBytes = isSeedance2ReferenceModel(selectedModel)
      ? 15 * 1024 * 1024 // Seedance schema: 15MB per file
      : 30 * 1024 * 1024; // 30MB max (legacy WAN)
    if (!allowedMimes.has(file.type) && !file.name.match(/\.(wav|mp3)$/i)) {
      toast.error("Unsupported audio type. Use WAV or MP3 format");
      event.target.value = "";
      return;
    }
    if (file.size > maxBytes) {
      const mb = Math.floor(maxBytes / (1024 * 1024));
      toast.error(`Audio file too large. Please upload an audio file ≤ ${mb}MB`);
      event.target.value = "";
      return;
    }

    if (file.type.startsWith("audio/") || file.name.match(/\.(wav|mp3)$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          if (isSeedance2ReferenceModel(selectedModel)) {
            const nextTotal = getCurrentModalityFileCount() + 1; // adding audio
            if (nextTotal > 12) {
              toast.error("Too many reference files (max 12 total). Remove something and try again.");
              event.target.value = "";
              return;
            }
          }
          setUploadedAudio(result);
          toast.success("Audio file uploaded successfully");
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = "";
  };

  // Handle character image upload for WAN 2.2 Animate Replace
  const handleCharacterImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    // Validate file type and size
    const allowedMimes = new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]);

    const maxBytes = 20 * 1024 * 1024; // 20MB max
    if (
      !allowedMimes.has(file.type) &&
      !file.name.match(/\.(jpg|jpeg|png|webp)$/i)
    ) {
      toast.error("Unsupported image type. Use JPG, PNG, or WebP format");
      event.target.value = "";
      return;
    }
    if (file.size > maxBytes) {
      toast.error("Image file too large. Please upload an image ≤ 20MB");
      event.target.value = "";
      return;
    }

    if (
      file.type.startsWith("image/") ||
      file.name.match(/\.(jpg|jpeg|png|webp)$/i)
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setUploadedCharacterImage(result);
          toast.success("Character image uploaded successfully");
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    event.target.value = "";
  };

  // Helper function to get the prompt for API (with hardcoded prefix for Lipsync)
  const getApiPrompt = (originalPrompt: string): string => {
    // For Lipsync feature with uploaded image, add hardcoded prefix
    if (activeFeature === "Lipsync" && uploadedImages.length > 0) {
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

  // Filter Handlers for HistorySection
  const onSearchChange = (query: string) => {
    // Local state removed, relying on Redux
    dispatch(
      setFilters({
        ...currentFilters,
        search: query,
        mode: "video",
      }),
    );
  };

  const onSortOrderChange = (sort: any) => {
    const order = typeof sort === "string" ? sort : sort?.value || "desc";
    dispatch(
      setFilters({
        ...currentFilters,
        sortOrder: order,
        mode: "video",
      }),
    );

    dispatch(
      loadHistory({
        filters: {
          mode: "video",
          sortOrder: order,
          ...(searchQuery ? { search: searchQuery } : {}),
        } as any,
        paginationParams: { limit: 20 },
        requestOrigin: "sort_change",
        expectedType: "video",
      } as any),
    );
  };

  const onDateRangeChange = (range: any) => {
    // Local state removed, relying on Redux
    const dateFilter =
      range?.start && range?.end
        ? {
            start: range.start.toISOString(),
            end: range.end.toISOString(),
          }
        : undefined;

    dispatch(
      setFilters({
        ...currentFilters,
        dateRange: dateFilter,
        mode: "video",
      }),
    );

    dispatch(
      loadHistory({
        filters: {
          mode: "video",
          sortOrder: currentFilters?.sortOrder || "desc",
          ...(dateFilter ? { dateRange: dateFilter } : {}),
          ...(searchQuery ? { search: searchQuery } : {}),
        } as any,
        paginationParams: { limit: 20 },
        requestOrigin: "date_change",
        expectedType: "video",
      } as any),
    );
  };

  const getTerminalFalErrorMessage = (error: any): string | null => {
    const details = extractFalErrorDetails(error);
    const type = details?.type || details?.detail?.[0]?.type;
    const message = extractFalErrorMessage(error, "").toLowerCase();
    const status = Number(error?.response?.status || error?.status || 0);

    if (
      type === "downstream_service_unavailable" ||
      type === "downstream_service_error" ||
      message.includes("downstream service is currently unavailable") ||
      message.includes("downstream_service_unavailable")
    ) {
      return "Try again later";
    }

    // Queue polling should stop once the backend/provider has already returned a concrete error.
    // Keep retries only for transport-level failures with no response.
    if (status >= 400 && status !== 408 && status !== 429) {
      if (status >= 500) {
        return "Try again later";
      }
      return extractFalErrorMessage(error, "Request failed");
    }

    return null;
  };

  const stopActiveGeneration = (
    id?: string,
    errorMessage: string = "Try again later",
  ) => {
    if (!id) return;
    dispatch(
      updateActiveGeneration({
        id,
        updates: { status: "failed", error: errorMessage },
      }),
    );
    dispatch(removeActiveGeneration(id));
  };

  // Handle video generation

  const handleGenerate = async () => {
    console.log("[DEBUG VideoGeneration InputBox] handleGenerate triggered");
    // CRITICAL: Check authentication FIRST before any other validation
    if (!user) {
      console.log(
        "[VideoGeneration] User not authenticated, saving intent and redirecting to sign-in",
      );
      saveAutoResumeIntent("video", {
        isTextToVideo: true,
        prompt,
        model: selectedModel,
        aspectRatio: frameSize,
      });
      router.push("/login?redirect=/text-to-video");
      return;
    }

    // Ensure local data/blob image inputs are uploaded before submit.
    // This prevents staging 413 errors where submit fires before upload completes.
    const hasLocalImageInputs =
      uploadedImages.some((u) => isLocalImageUrl(u)) ||
      references.some((u) => isLocalImageUrl(u)) ||
      isLocalImageUrl(lastFrameImage) ||
      isLocalImageUrl(uploadedCharacterImage);

    if (hasLocalImageInputs) {
      if (isNormalizingLocalImagesRef.current) {
        setError("Preparing uploaded image. Please wait a moment and try again.");
        return;
      }

      try {
        isNormalizingLocalImagesRef.current = true;
        const cache = new Map<string, string>();
        const resolveUrl = async (url: string): Promise<string> => {
          const raw = String(url || "").trim();
          if (!isLocalImageUrl(raw)) return raw;
          if (cache.has(raw)) return cache.get(raw)!;
          const resp = await saveUpload({ url: raw, type: "image" });
          if (resp.responseStatus === "success" && resp.data?.url) {
            cache.set(raw, resp.data.url);
            return resp.data.url;
          }
          throw new Error(resp.message || "Failed to upload local image");
        };

        const nextUploadedImages = await Promise.all(
          uploadedImages.map(resolveUrl),
        );
        const nextReferences = await Promise.all(references.map(resolveUrl));
        const nextLastFrameImage = await resolveUrl(lastFrameImage || "");
        const nextCharacterImage = await resolveUrl(uploadedCharacterImage || "");

        if (
          JSON.stringify(nextUploadedImages) !== JSON.stringify(uploadedImages)
        ) {
          setUploadedImages(nextUploadedImages);
        }
        if (JSON.stringify(nextReferences) !== JSON.stringify(references)) {
          setReferences(nextReferences);
        }
        if ((nextLastFrameImage || "") !== (lastFrameImage || "")) {
          setLastFrameImage(nextLastFrameImage);
        }
        if ((nextCharacterImage || "") !== (uploadedCharacterImage || "")) {
          setUploadedCharacterImage(nextCharacterImage);
        }

        const stillHasLocalInputs =
          nextUploadedImages.some((u) => isLocalImageUrl(u)) ||
          nextReferences.some((u) => isLocalImageUrl(u)) ||
          isLocalImageUrl(nextLastFrameImage) ||
          isLocalImageUrl(nextCharacterImage);

        if (stillHasLocalInputs) {
          setError("Failed to prepare uploaded image. Please re-upload and try again.");
          return;
        }

        // State updates are async; retry once with normalized URLs.
        setTimeout(() => {
          void handleGenerate();
        }, 0);
        return;
      } catch (error: any) {
        console.error("[Video] Failed to normalize local images before submit:", error);
        setError(error?.message || "Failed to prepare uploaded image");
        return;
      } finally {
        isNormalizingLocalImagesRef.current = false;
      }
    }

    const hhModelForPromptGate = selectedModel.startsWith("alibaba/happy-horse")
      ? selectedModel === HAPPY_HORSE_MODEL
        ? uploadedVideo
          ? HAPPY_HORSE_EDIT_MODEL
          : references.length > 0
            ? HAPPY_HORSE_R2V_MODEL
            : uploadedImages[0]
              ? HAPPY_HORSE_I2V_MODEL
              : HAPPY_HORSE_T2V_MODEL
        : selectedModel
      : null;
    const isHappyHorseI2vPromptOptional =
      hhModelForPromptGate === HAPPY_HORSE_I2V_MODEL && !!uploadedImages[0];
    if (!prompt.trim() && !isHappyHorseI2vPromptOptional) {
      setError("Please enter a prompt");
      return;
    }

    // Check if we already have too many running generations
    if (runningGenerationsCount >= 3) {
      setError(
        "You have reached the maximum number of concurrent generations (3). Please wait for one to finish.",
      );
      return;
    }

    setIsGenerating(true);
    setError("");

    const optimisticId = `gen-${Date.now()}`;
    let generationId = optimisticId;
    // Optimistic active generation
    dispatch(
      addActiveGeneration({
        id: optimisticId,
        prompt: prompt.trim(),
        model: selectedModel,
        status: "pending",
        generationType: "text-to-video",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        params: {
          generationType: "text-to-video",
          aspectRatio: frameSize,
          duration: typeof duration === "number" ? duration : 8,
          resolution: selectedQuality,
          quality: selectedQuality,
        },
      }),
    );

    // Variables for generation logic
    let apiEndpoint = "";
    let requestBody: any = {};
    let generationType: any = "text-to-video";
    let failedHistoryIdForRefresh: string | undefined;

    // Continue with validation and API call logic...
    const caps = currentModelCapabilities;

    // Validate I2V-only models require image (Kling 2.1 non-master, Gen-4 Turbo, Gen-3a Turbo)
    if (
      (selectedModel.startsWith("kling-") &&
        selectedModel.includes("v2.1") &&
        !selectedModel.includes("master")) ||
      selectedModel === "gen4_turbo" ||
      selectedModel === "gen3a_turbo"
    ) {
      if (uploadedImages.length === 0 && references.length === 0) {
        // Get model display name
        let modelName = "";
        if (selectedModel.startsWith("kling-")) {
          if (selectedModel.includes("v2.1")) {
            modelName = "Kling 2.1";
          }
        } else if (selectedModel === "gen4_turbo") {
          modelName = "Gen-4 Turbo";
        } else if (selectedModel === "gen3a_turbo") {
          modelName = "Gen-3a Turbo";
        }
        // Show toast with custom styling
        toast.error(
          <div className="flex items-start gap-3">
            {/* <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg> */}
            <div>
              <p className="font-semibold text-white">
                {modelName} needs one image as input to generate video.
              </p>
              <p className="text-sm text-white/70 mt-1">
                Please upload an image to continue.
              </p>
            </div>
          </div>,
          {
            duration: 8000, // 8 seconds
            style: {
              background:
                "linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              backdropFilter: "blur(10px)",
            },
          } as any,
        );
        setIsGenerating(false);
        return;
      }
    }

    // Validate model requirements
    // Check if model requires image (like Runway models)
    // Note: I2V-only models (Kling 2.1, Gen-4 Turbo, Gen-3a Turbo) are already handled above
    if (
      caps.requiresImage &&
      uploadedImages.length === 0 &&
      references.length === 0 &&
      !(selectedModel.includes("veo3.1-lite") && !!lastFrameImage)
    ) {
      if (selectedModel === "S2V-01") {
        // Show toast with custom styling for S2V-01
        toast.error(
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold text-white">
                S2V-01 needs one image as input to generate video.
              </p>
              <p className="text-sm text-white/70 mt-1">
                Please upload a character reference image to continue.
              </p>
            </div>
          </div>,
          {
            duration: 8000, // 8 seconds
            style: {
              background:
                "linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              backdropFilter: "blur(10px)",
            },
          } as any,
        );
      } else if (selectedModel === "I2V-01-Director") {
        // Show toast with custom styling for I2V-01-Director
        toast.error(
          <div className="flex items-start gap-3">
            <div>
              <p className="font-semibold text-white">
                I2V-01-Director needs one image as input to generate video.
              </p>
              <p className="text-sm text-white/70 mt-1">
                Please upload a first frame image to continue.
              </p>
            </div>
          </div>,
          {
            duration: 8000, // 8 seconds
            style: {
              background:
                "linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              backdropFilter: "blur(10px)",
            },
          } as any,
        );
      } else if (
        selectedModel.includes("veo3.1-lite") &&
        selectedModel.includes("i2v") &&
        !lastFrameImage
      ) {
        toast.error(
          "An input image is required to use Veo 3.1 Lite image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel.includes("veo3.1") &&
        selectedModel.includes("i2v")
      ) {
        toast.error(
          "An input image is required to use Veo 3.1 image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel.includes("veo3") &&
        selectedModel.includes("i2v")
      ) {
        toast.error(
          "An input image is required to use Veo 3 image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel.includes("wan-2.5") &&
        selectedModel.includes("i2v")
      ) {
        toast.error(
          "An input image is required to use WAN 2.5 image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel.startsWith("kling-") &&
        selectedModel.includes("i2v")
      ) {
        toast.error(
          "An input image is required to use Kling image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel.includes("seedance") &&
        selectedModel.includes("i2v")
      ) {
        toast.error(
          "An input image is required to use Seedance image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel.includes("pixverse") &&
        selectedModel.includes("i2v")
      ) {
        toast.error(
          "An input image is required to use PixVerse image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel.includes("sora2") &&
        selectedModel.includes("i2v")
      ) {
        toast.error(
          "An input image is required to use Sora 2 image-to-video model. Please upload an image.",
        );
      } else if (
        selectedModel === "gen4_turbo" ||
        selectedModel === "gen3a_turbo"
      ) {
        toast.error(
          "An input image is required to use this Runway model. Please upload an image.",
        );
      } else {
        toast.error(
          "An input image is required to use this model. Please upload an image.",
        );
      }
      return;
    }

    if (isSeedance2ReferenceModel(selectedModel)) {
      const hasReferenceImage = references.length > 0;
      const hasReferenceVideo = Boolean(uploadedVideo);

      if (!hasReferenceImage && !hasReferenceVideo) {
        toast.error(
          `${isSeedance2FastReferenceModel(selectedModel) ? "Seedance 2.0 Fast Reference" : "Seedance 2.0 Reference"} requires at least one reference image or video.`,
        );
        setIsGenerating(false);
        return;
      }

      if (uploadedAudio && !hasReferenceImage && !hasReferenceVideo) {
        toast.error(
          "Audio references need at least one image or video reference.",
        );
        setIsGenerating(false);
        return;
      }
    }

    if (caps.requiresReferenceImage && references.length === 0) {
      toast.error(
        "A reference image is required to use this model. Please upload a character reference image.",
      );
      return;
    }

    if (caps.requiresVideo && !uploadedVideo) {
      toast.error(
        "A source video is required to use this model. Please upload a video.",
      );
      return;
    }

    // Validate model compatibility with generation mode
    if (generationMode === "text_to_video" && !caps.supportsTextToVideo) {
      toast.error(
        "This model does not support text-to-video generation. An input image is required. Please upload an image or select a different model.",
      );
      return;
    }

    setIsGenerating(true);
    setError("");
    clearCreditsError();

    // Update queue status to generating
    if (generationId) {
      dispatch(
        updateActiveGeneration({
          id: generationId,
          updates: { status: "generating" },
        }),
      );
    }

    // Validate credits before generation
    // NOTE: WAN 2.2 Animate models are debited by backend only after successful completion.
    // Avoid any frontend reservation to prevent double-charging.
    let transactionId: string | null = null;
    try {
      const provider =
        selectedModel.includes("MiniMax") ||
        selectedModel === "T2V-01-Director" ||
        selectedModel === "I2V-01-Director" ||
        selectedModel === "S2V-01"
          ? "minimax"
          : selectedModel.includes("veo3") ||
              isSeedance2TextModel(selectedModel) ||
              selectedModel.includes("sora2") ||
              selectedModel.includes("ltx2") ||
              selectedModel === "kling-o1" ||
              selectedModel === "kling-2.6-pro" ||
              selectedModel.startsWith("kling-v3") ||
              selectedModel === PIXVERSE_V6_T2V_MODEL ||
              selectedModel === PIXVERSE_V6_I2V_MODEL
            ? "fal"
            : selectedModel.includes("wan-2.5") ||
                (selectedModel.startsWith("kling-") &&
                  selectedModel !== "kling-2.6-pro" &&
                  !selectedModel.startsWith("kling-v3")) ||
                (selectedModel.includes("seedance") &&
                  !isSeedance2TextModel(selectedModel)) ||
                (selectedModel.includes("pixverse") &&
                  !selectedModel.includes("v6")) ||
                selectedModel.includes("ltx-2.3-fast") ||
                selectedModel.includes("ltx-2.3-pro") ||
                selectedModel === "wan-2.2-animate-replace"
              ? "replicate"
              : "runway";

      if (selectedModel === "wan-2.2-animate-replace") {
        if (!uploadedVideoDurationSec || uploadedVideoDurationSec <= 0) {
          throw new Error(
            "Could not determine input video duration. Please re-upload the video.",
          );
        }
        const required = Math.ceil(uploadedVideoDurationSec * 8);
        if (Number(creditBalance) < required) {
          throw new Error(
            `Insufficient credits. You need ${required} credits but have ${creditBalance}.`,
          );
        }
        console.log("✅ Credits validated (no reservation):", required);
      } else {
        const creditResult = await validateAndReserveCredits(provider);
        transactionId = creditResult.transactionId;
        console.log(
          "✅ Credits validated and reserved:",
          creditResult.requiredCredits,
        );
      }
    } catch (creditError: any) {
      console.error("❌ Credit validation failed:", creditError);
      setError(creditError.message || "Insufficient credits for generation");
      setIsGenerating(false);
      return;
    }

    // Backend handles history creation - no frontend history ID needed

    try {
      // Resolve isPublic from backend policy so completed videos appear in the public feed when enabled
      const { getIsPublic } = await import("@/lib/publicFlag");
      const isPublic = await getIsPublic();
      let requestBody;
      let generationType: string;
      let apiEndpoint: string;

      // Auto-determine mode based on model capabilities and user input
      // Priority: If image is uploaded and model supports I2V, use I2V
      // If only text is provided and model supports T2V, use T2V
      let actualGenerationMode = generationMode;

      const hasImage =
        uploadedImages.length > 0 || references.length > 0 || !!lastFrameImage;
      const hasText = prompt.trim().length > 0;

      // Smart mode detection:
      // 1. If image is uploaded and model supports I2V -> use I2V
      // 2. If only text and model supports T2V -> use T2V
      // 3. If model only supports I2V (like Runway) -> use I2V (will validate image requirement)
      // 4. If model supports both -> choose based on input

      if (selectedModel.startsWith("alibaba/happy-horse")) {
        // Keep Happy Horse request routing in one place below.
        actualGenerationMode = "text_to_video";
      } else if (hasImage && caps.supportsImageToVideo) {
        // Image uploaded and model supports I2V -> use image-to-video
        actualGenerationMode = "image_to_video";
        console.log("🖼️ Image detected, switching to image-to-video mode");
      } else if (hasText && !hasImage && caps.supportsTextToVideo) {
        // Only text provided and model supports T2V -> use text-to-video
        // But check if model requires image (like Kling 2.1)
        if (caps.requiresImage && !caps.supportsTextToVideo) {
          // Model requires image but user only provided text
          toast.error(
            "This model requires an input image. Please upload an image to use this model.",
          );
          setIsGenerating(false);
          return;
        }
        actualGenerationMode = "text_to_video";
        console.log("📝 Text only, using text-to-video mode");
      } else if (caps.supportsTextToVideo && caps.supportsImageToVideo) {
        // Model supports both - check if image is uploaded
        if (hasImage) {
          actualGenerationMode = "image_to_video";
          console.log(
            "🖼️ Model supports both, image provided -> using image-to-video",
          );
        } else {
          actualGenerationMode = "text_to_video";
          console.log(
            "📝 Model supports both, no image -> using text-to-video",
          );
        }
      } else if (caps.supportsTextToVideo && !caps.supportsImageToVideo) {
        actualGenerationMode = "text_to_video";
        console.log("📝 Model only supports T2V -> using text-to-video mode");
      } else if (caps.supportsImageToVideo && !caps.supportsTextToVideo) {
        // Model only supports I2V (like Runway models: gen4_turbo, gen3a_turbo)
        actualGenerationMode = "image_to_video";
        console.log("🎬 Model only supports I2V -> using image-to-video mode");
        // Image requirement will be validated below
      }

      if (actualGenerationMode === "text_to_video") {
        // Text to video generation (MiniMax, Veo3, and WAN models)
        if (
          selectedModel.includes("MiniMax") ||
          selectedModel === "T2V-01-Director"
        ) {
          // Text-to-video: No image requirements (pure text generation)

          requestBody = {
            model: selectedModel,
            prompt: prompt,
            // MiniMax models: Include duration and resolution only (no images for text-to-video)
            ...((selectedModel === "MiniMax-Hailuo-02" ||
              selectedModel === "MiniMax-Hailuo-2.3") && {
              duration: selectedMiniMaxDuration,
              resolution: selectedResolution,
            }),
            generationType: "text-to-video",
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = "/api/minimax/video";
        } else if (
          selectedModel.includes("veo3.1-lite") &&
          !selectedModel.includes("i2v")
        ) {
          const modelDuration =
            duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt,
            aspect_ratio: frameSize === "9:16" ? "9:16" : "16:9",
            duration: modelDuration,
            resolution:
              selectedQuality === "1080p" && modelDuration === "8s"
                ? "1080p"
                : "720p",
            auto_fix: true,
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = "/api/fal/veo3_1/lite/text-to-video/submit";
        } else if (
          selectedModel.includes("veo3.1") &&
          !selectedModel.includes("i2v")
        ) {
          // Veo 3.1 text-to-video generation (only if not i2v variant)
          const isFast = selectedModel.includes("fast");
          const modelDuration =
            duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            aspect_ratio:
              frameSize === "16:9"
                ? "16:9"
                : frameSize === "9:16"
                  ? "9:16"
                  : "1:1",
            duration: modelDuration,
            resolution: selectedQuality, // Use selected quality (720p or 1080p)
            generate_audio: true,
            auto_fix: true,
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = isFast
            ? "/api/fal/veo3_1/text-to-video/fast/submit"
            : "/api/fal/veo3_1/text-to-video/submit";
        } else if (
          selectedModel.includes("veo3") &&
          !selectedModel.includes("veo3.1") &&
          !selectedModel.includes("i2v")
        ) {
          // Veo3 text-to-video generation
          const isFast = selectedModel.includes("fast");
          const modelDuration =
            duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            aspect_ratio:
              frameSize === "16:9"
                ? "16:9"
                : frameSize === "9:16"
                  ? "9:16"
                  : "1:1",
            duration: modelDuration,
            resolution: selectedQuality, // Use selected quality
            generate_audio: true,
            auto_fix: true,
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = isFast
            ? "/api/fal/veo3/text-to-video/fast/submit"
            : "/api/fal/veo3/text-to-video/submit";
        } else if (selectedModel.startsWith("alibaba/happy-horse")) {
          const apiPrompt = getApiPrompt(prompt);
          const modelDuration =
            typeof duration === "number"
              ? Math.min(15, Math.max(3, duration))
              : Math.min(
                  15,
                  Math.max(
                    3,
                    parseInt(String(duration || 5).replace(/s$/i, ""), 10) || 5,
                  ),
                );
          const resolution = String(selectedQuality).toLowerCase().includes("720")
            ? "720p"
            : "1080p";
          // Commented out per request:
          // const parsedHappyHorseSeed = (() => {
          //   const raw = String(happyHorseSeedInput || "").trim();
          //   if (!raw) return undefined;
          //   const value = parseInt(raw, 10);
          //   if (!Number.isFinite(value) || value < 0 || value > 2147483647) {
          //     throw new Error(
          //       "Happy Horse seed must be an integer between 0 and 2147483647.",
          //     );
          //   }
          //   return value;
          // })();
          const effectiveHappyHorseModel =
            selectedModel === HAPPY_HORSE_MODEL
              ? uploadedVideo
                ? HAPPY_HORSE_EDIT_MODEL
                : references.length > 0
                  ? HAPPY_HORSE_R2V_MODEL
                  : uploadedImages[0]
                    ? HAPPY_HORSE_I2V_MODEL
                    : HAPPY_HORSE_T2V_MODEL
              : selectedModel;
          if (effectiveHappyHorseModel === HAPPY_HORSE_EDIT_MODEL) {
            if (!uploadedVideo) {
              throw new Error("Happy Horse Edit Video requires source video.");
            }
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              video_url: uploadedVideo,
              reference_image_urls: references.slice(0, 5),
              resolution,
              ...(happyHorseAudioSetting !== "default"
                ? { audio_setting: happyHorseAudioSetting }
                : {}),
              // enable_safety_checker: happyHorseSafetyChecker, // commented out per request
              generationType: "video-to-video",
              isPublic,
              // ...(parsedHappyHorseSeed !== undefined
              //   ? { seed: parsedHappyHorseSeed }
              //   : {}), // commented out per request
            };
            generationType = "video-to-video";
            apiEndpoint = "/api/fal/happy-horse/edit-video/submit";
          } else if (effectiveHappyHorseModel === HAPPY_HORSE_R2V_MODEL) {
            if (references.length === 0) {
              throw new Error(
                "Happy Horse Reference to Video requires at least one reference image.",
              );
            }
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              image_urls: references.slice(0, 9),
              aspect_ratio: ["16:9", "9:16", "1:1", "4:3", "3:4"].includes(
                frameSize,
              )
                ? frameSize
                : "16:9",
              duration: modelDuration,
              resolution,
              // enable_safety_checker: happyHorseSafetyChecker, // commented out per request
              generationType: "text-to-video",
              isPublic,
              // ...(parsedHappyHorseSeed !== undefined
              //   ? { seed: parsedHappyHorseSeed }
              //   : {}), // commented out per request
            };
            generationType = "text-to-video";
            apiEndpoint = "/api/fal/happy-horse/reference-to-video/submit";
          } else if (effectiveHappyHorseModel === HAPPY_HORSE_I2V_MODEL) {
            if (!uploadedImages[0]) {
              throw new Error(
                "Happy Horse Image to Video requires an input image.",
              );
            }
            requestBody = {
              prompt: apiPrompt || "Bring the scene in the image to life.",
              originalPrompt: prompt,
              image_url: uploadedImages[0],
              duration: modelDuration,
              resolution,
              // enable_safety_checker: happyHorseSafetyChecker, // commented out per request
              generationType: "image-to-video",
              isPublic,
              // ...(parsedHappyHorseSeed !== undefined
              //   ? { seed: parsedHappyHorseSeed }
              //   : {}), // commented out per request
            };
            generationType = "image-to-video";
            apiEndpoint = "/api/fal/happy-horse/image-to-video/submit";
          } else {
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              aspect_ratio: ["16:9", "9:16", "1:1", "4:3", "3:4"].includes(
                frameSize,
              )
                ? frameSize
                : "16:9",
              duration: modelDuration,
              resolution,
              // enable_safety_checker: happyHorseSafetyChecker, // commented out per request
              generationType: "text-to-video",
              isPublic,
              // ...(parsedHappyHorseSeed !== undefined
              //   ? { seed: parsedHappyHorseSeed }
              //   : {}), // commented out per request
            };
            generationType = "text-to-video";
            apiEndpoint = "/api/fal/happy-horse/text-to-video/submit";
          }
        } else if (
          selectedModel.includes("wan-2.5") &&
          !selectedModel.includes("i2v")
        ) {
          // WAN 2.5 text-to-video generation (only if not i2v variant)
          const isFast = selectedModel.includes("fast");
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: isFast
              ? "wan-video/wan-2.5-t2v-fast"
              : "wan-video/wan-2.5-t2v",
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
          apiEndpoint = isFast
            ? "/api/replicate/wan-2-5-t2v/fast/submit"
            : "/api/replicate/wan-2-5-t2v/submit";
        } else if (selectedModel.startsWith("kling-v3") && !hasImage) {
          // Kling 3 text-to-video (FAL)
          const apiPrompt = getApiPrompt(prompt);
          const klingDuration =
            typeof duration === "number"
              ? duration
              : parseInt(String(duration), 10) || 5;
          const modelDuration = String(
            Math.min(15, Math.max(3, klingDuration)),
          );
          const isPro = selectedModel === "kling-v3-pro";
          requestBody = {
            model: isPro
              ? "fal-ai/kling-video/v3/pro/text-to-video"
              : "fal-ai/kling-video/v3/standard/text-to-video",
            prompt: apiPrompt,
            originalPrompt: prompt,
            duration: modelDuration,
            aspect_ratio:
              frameSize === "9:16"
                ? "9:16"
                : frameSize === "1:1"
                  ? "1:1"
                  : "16:9",
            negative_prompt: "blur, distort, and low quality",
            cfg_scale: 0.5,
            generate_audio: generateAudio,
            generationType: "text-to-video",
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = isPro
            ? "/api/fal/kling-v3/pro/text-to-video/submit"
            : "/api/fal/kling-v3/standard/text-to-video/submit";
        } else if (selectedModel === "kling-2.6-pro" && !hasImage) {
          // Kling 2.6 Pro text-to-video (FAL)
          const apiPrompt = getApiPrompt(prompt);
          const modelDuration = duration === 5 ? "5" : "10";
          requestBody = {
            model: "fal-ai/kling-video/v2.6/pro/text-to-video",
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            duration: modelDuration,
            aspect_ratio:
              frameSize === "9:16"
                ? "9:16"
                : frameSize === "1:1"
                  ? "1:1"
                  : "16:9",
            negative_prompt: "blur, distort, and low quality",
            cfg_scale: 0.5,
            generate_audio: generateAudio, // Explicitly pass true or false
            generationType: "text-to-video",
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = "/api/fal/kling-2.6-pro/text-to-video/submit";
        } else if (
          selectedModel.startsWith("kling-") &&
          !selectedModel.includes("i2v") &&
          selectedModel !== "kling-2.6-pro"
        ) {
          // Kling T2V (other models)
          const isV25 = selectedModel.includes("v2.5");
          const isV21Master = selectedModel.includes("v2.1-master");
          const isV21 = selectedModel.includes("v2.1") && !isV21Master;

          if (!isV25 && !isV21Master) {
            // Only Kling 2.5 Turbo Pro and Kling 2.1 Master allow pure T2V
            toast.error(
              "This Kling model requires an input image. Please upload an image or select Kling 2.1 Master / Kling 2.5 Turbo Pro for text-to-video.",
            );
            setIsGenerating(false);
            return;
          }

          const apiPrompt = getApiPrompt(prompt);
          const modelName = isV21Master
            ? "kwaivgi/kling-v2.1-master"
            : "kwaivgi/kling-v2.5-turbo-pro";
          requestBody = {
            model: modelName,
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            duration,
            aspect_ratio:
              frameSize === "9:16"
                ? "9:16"
                : frameSize === "1:1"
                  ? "1:1"
                  : "16:9",
            generationType: "text-to-video",
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = "/api/replicate/kling-t2v/submit";
        } else if (isSeedance2ReferenceModel(selectedModel)) {
          const apiPrompt = getApiPrompt(prompt);
          const seedanceRefVideos =
            uploadedVideos && uploadedVideos.length > 0
              ? uploadedVideos
              : uploadedVideo
                ? [uploadedVideo]
                : [];
          if (references.length === 0 && seedanceRefVideos.length === 0) {
            throw new Error(
              `${isSeedance2FastReferenceModel(selectedModel) ? "Seedance 2.0 Fast Reference" : "Seedance 2.0 Reference"} requires at least one reference image or video.`,
            );
          }

          // Handle local video uploads (blob:) if needed (up to 3).
          let videosForRequest = seedanceRefVideos.slice(0, 3);
          const resolvedVideos: string[] = [];
          for (const v of videosForRequest) {
            let nextV = v;
            if (nextV?.startsWith("blob:")) {
              const cached = uploadedUrlByLocalUrl[nextV];
              if (cached) {
                nextV = cached;
              } else {
                const file = localVideoFilesByUrl[nextV];
                if (!file) {
                  throw new Error(
                    "Selected local video is not available. Please re-select the video.",
                  );
                }
                const uploaded = await uploadLocalVideoFile(file);
                if (!uploaded?.url) throw new Error("Video upload failed");
                const remoteUrl = uploaded.url;
                setUploadedUrlByLocalUrl((prev) => ({ ...prev, [nextV]: remoteUrl }));
                nextV = remoteUrl;
              }
            }
            if (nextV) resolvedVideos.push(nextV);
          }

          // Persist resolved remote URLs back into state (keeps previews stable).
          if (resolvedVideos.length) {
            setUploadedVideos(resolvedVideos.slice(0, 3));
            setUploadedVideo(resolvedVideos[0] || "");
            videosForRequest = resolvedVideos.slice(0, 3);
          } else {
            videosForRequest = [];
          }

          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt,
            image_urls: references,
            resolution: seedanceResolution === "480p" ? "480p" : "720p",
            duration: duration === "auto" ? "auto" : String(duration),
            aspect_ratio: frameSize || "auto",
            generate_audio: generateAudio,
            generationType: "text-to-video",
            isPublic,
            ...(videosForRequest.length ? { video_urls: videosForRequest } : {}),
            ...(uploadedAudio ? { audio_urls: [uploadedAudio] } : {}),
          };
          generationType = "text-to-video";
          apiEndpoint = isSeedance2FastReferenceModel(selectedModel)
            ? "/api/fal/seedance-2.0/fast/reference-to-video/submit"
            : "/api/fal/seedance-2.0/reference-to-video/submit";
        } else if (isSeedance2TextModel(selectedModel)) {
          const apiPrompt = getApiPrompt(prompt);
          const seedanceInputImageUrl = uploadedImages[0] || lastFrameImage;
          const seedanceEndImageUrl = uploadedImages[0]
            ? lastFrameImage || uploadedImages[1]
            : undefined;

          if (isSeedance2FastModel(selectedModel) && seedanceInputImageUrl) {
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              image_url: seedanceInputImageUrl,
              resolution: seedanceResolution === "480p" ? "480p" : "720p",
              duration: duration === "auto" ? "auto" : String(duration),
              aspect_ratio: frameSize || "auto",
              generate_audio: generateAudio,
              generationType: "image-to-video",
              isPublic,
              ...(seedanceEndImageUrl
                ? { end_image_url: seedanceEndImageUrl }
                : {}),
            };
            generationType = "image-to-video";
            apiEndpoint = "/api/fal/seedance-2.0/fast/image-to-video/submit";
          } else {
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              resolution: seedanceResolution === "480p" ? "480p" : "720p",
              duration: duration === "auto" ? "auto" : String(duration),
              aspect_ratio: frameSize || "auto",
              generate_audio: generateAudio,
              generationType: "text-to-video",
              isPublic,
            };
            generationType = "text-to-video";
            apiEndpoint = isSeedance2FastModel(selectedModel)
              ? "/api/fal/seedance-2.0/fast/text-to-video/submit"
              : "/api/fal/seedance-2.0/text-to-video/submit";
          }
        } else if (
          selectedModel.includes("seedance") &&
          !selectedModel.includes("i2v")
        ) {
          // Seedance T2V
          const isSeedance15 = selectedModel.includes("seedance-1.5");
          // Seedance 1.0: supports first/last frame only for Pro/Lite (not Pro Fast)
          const isLite = selectedModel.includes("lite");
          const isProFast = selectedModel.includes("pro-fast");
          const apiPrompt = getApiPrompt(prompt);
          // First frame and last frame support (Pro and Lite only)
          const firstFrame =
            !isProFast && uploadedImages.length > 0 ? uploadedImages[0] : null;
          const lastFrame =
            !isProFast && lastFrameImage
              ? lastFrameImage
              : !isProFast && uploadedImages.length > 1
                ? uploadedImages[1]
                : null;
          const hasFirstFrame = Boolean(firstFrame);
          const hasLastFrame = Boolean(lastFrame);

          if (isSeedance15) {
            requestBody = {
              model: "bytedance/seedance-1.5-pro",
              prompt: apiPrompt,
              originalPrompt: prompt,
              duration,
              aspect_ratio: frameSize,
              generate_audio: generateAudio,
              generationType: "text-to-video",
              isPublic,
              ...(hasFirstFrame ? { image: firstFrame } : {}),
              ...(hasLastFrame ? { last_frame_image: lastFrame } : {}),
            };
          } else {
            let modelName = "bytedance/seedance-1-pro";
            if (isLite) {
              modelName = "bytedance/seedance-1-lite";
            } else if (isProFast) {
              modelName = "bytedance/seedance-1-pro-fast";
            }
            requestBody = {
              model: modelName,
              prompt: apiPrompt,
              originalPrompt: prompt, // Store original prompt for display
              duration,
              resolution: seedanceResolution,
              aspect_ratio: frameSize, // Seedance supports multiple aspect ratios for T2V
              generationType: "text-to-video",
              isPublic,
              ...(hasFirstFrame ? { image: firstFrame } : {}),
              ...(hasLastFrame ? { last_frame_image: lastFrame } : {}),
              ...(!hasFirstFrame &&
              !hasLastFrame &&
              seedanceResolution !== "1080p" &&
              references.length > 0
                ? {
                    reference_images: references.slice(0, 4),
                  }
                : {}),
            };
          }
          generationType = "text-to-video";
          apiEndpoint = isProFast
            ? "/api/replicate/seedance-pro-fast-t2v/submit"
            : "/api/replicate/seedance-t2v/submit";
        } else if (selectedModel === PIXVERSE_V6_T2V_MODEL) {
          const apiPrompt = getApiPrompt(prompt);
          let pvDur =
            typeof duration === "number"
              ? duration
              : parseInt(String(duration), 10) || 5;
          pvDur = Math.min(15, Math.max(5, pvDur));
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt,
            aspect_ratio: frameSize,
            resolution: pixverseQuality,
            duration: pvDur,
            generate_audio_switch: Boolean(pixverseV6GenerateAudio),
            generate_multi_clip_switch: Boolean(pixverseV6MultiClip),
            thinking_type: "auto",
            generationType: "text-to-video",
            isPublic,
          };
          if (pixverseV6Style) {
            (requestBody as any).style = pixverseV6Style;
          }
          generationType = "text-to-video";
          apiEndpoint = "/api/fal/pixverse/v6/text-to-video/submit";
        } else if (
          selectedModel.includes("pixverse") &&
          !selectedModel.includes("i2v")
        ) {
          // PixVerse V5 T2V (Replicate)
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: "pixverse/pixverse-v5",
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            duration,
            quality: pixverseQuality,
            aspect_ratio: frameSize, // PixVerse supports 16:9, 9:16, 1:1
            generationType: "text-to-video",
            isPublic,
          };
          generationType = "text-to-video";
          apiEndpoint = "/api/replicate/pixverse-v5-t2v/submit";
        } else if (
          selectedModel.includes("sora2") &&
          !selectedModel.includes("i2v") &&
          !selectedModel.includes("v2v")
        ) {
          // Sora 2 T2V
          const isPro = selectedModel.includes("pro");
          const apiPrompt = getApiPrompt(prompt);

          // Ensure duration is a number and one of [4, 8, 12]
          let soraDuration: number =
            typeof duration === "number"
              ? duration
              : parseInt(String(duration), 10) || 8;
          // Clamp to valid values: 4, 8, or 12
          if (![4, 8, 12].includes(soraDuration)) {
            // Round to nearest valid value
            if (soraDuration < 6) soraDuration = 4;
            else if (soraDuration < 10) soraDuration = 8;
            else soraDuration = 12;
          }

          // Ensure resolution is valid
          let soraResolution = selectedQuality || "720p";
          if (isPro) {
            // Pro supports 720p or 1080p
            if (soraResolution !== "720p" && soraResolution !== "1080p") {
              soraResolution = "1080p"; // Default to 1080p for Pro
            }
          } else {
            // Standard only supports 720p
            soraResolution = "720p";
          }

          // Ensure aspect_ratio is valid
          const soraAspectRatio =
            frameSize === "16:9"
              ? "16:9"
              : frameSize === "9:16"
                ? "9:16"
                : "16:9";

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
          generationType = "text-to-video";
          apiEndpoint = isPro
            ? "/api/fal/sora2/text-to-video/pro/submit"
            : "/api/fal/sora2/text-to-video/submit";
        } else if (
          selectedModel.includes("ltx2") &&
          !selectedModel.includes("i2v")
        ) {
          // LTX V2 Text-to-Video (Pro/Fast)
          const isPro = selectedModel.includes("pro");
          const normalizedRes = (selectedResolution || "1080p").toLowerCase();
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            resolution: normalizedRes,
            aspect_ratio: "16:9",
            duration,
            fps: fps,
            generate_audio: generateAudio,
            generationType: "text-to-video",
            isPublic,
          } as any;
          generationType = "text-to-video";
          apiEndpoint = isPro
            ? "/api/fal/ltx2/text-to-video/pro/submit"
            : "/api/fal/ltx2/text-to-video/fast/submit";
        } else if (
          (selectedModel.includes("ltx-2.3-fast") ||
            selectedModel.includes("ltx-2.3-pro")) &&
          !selectedModel.includes("i2v")
        ) {
          // LTX 2.3 Fast/Pro Text-to-Video (Replicate)
          const isPro = selectedModel.includes("ltx-2.3-pro");
          const normalizedRes = (selectedResolution || "1080p").toLowerCase();
          const apiPrompt = getApiPrompt(prompt);
          const ltxAspect = frameSize === "9:16" ? "9:16" : "16:9";
          const ltxFps = fps || 25;
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt,
            resolution:
              normalizedRes.includes("4k") || normalizedRes.includes("2160")
                ? "4k"
                : normalizedRes.includes("2k") || normalizedRes.includes("1440")
                  ? "2k"
                  : "1080p",
            aspect_ratio: ltxAspect,
            duration,
            fps: ltxFps,
            camera_motion: selectedCameraMovements[0] || "none",
            generate_audio: generateAudio,
            ...(isPro && uploadedAudio ? { audio: uploadedAudio } : {}),
            ...(isPro && uploadedVideo ? { video: uploadedVideo } : {}),
            generationType: "text-to-video",
            isPublic,
          } as any;
          generationType = "text-to-video";
          apiEndpoint = isPro
            ? "/api/replicate/ltx-2-3-pro-t2v/submit"
            : "/api/replicate/ltx-2-3-fast-t2v/submit";
        } else {
          // Runway models don't support text-to-video (they require an image)
          toast.error(
            "Runway models don't support text-to-video generation. Please use Image→Video mode or select a MiniMax/Veo3/Veo 3.1/WAN/Kling/Seedance/PixVerse/Sora 2 model.",
          );
          setError(
            "Runway models don't support text-to-video generation. Please use Image→Video mode or select a MiniMax/Veo3/Veo 3.1/WAN/Kling/Seedance/PixVerse/Sora 2 model.",
          );
          return;
        }
      } else if (actualGenerationMode === "image_to_video") {
        // Check if we need uploaded images
        // S2V-01 uses references, others need uploadedImages
        const needsImage =
          selectedModel !== "S2V-01" &&
          !selectedModel.includes("veo3") &&
          !selectedModel.includes("wan-2.5") &&
          !selectedModel.includes("seedance") &&
          (selectedModel === PIXVERSE_V5_I2V_MODEL ||
          selectedModel === PIXVERSE_V6_I2V_MODEL ||
          (selectedModel === PIXVERSE_V6_T2V_MODEL &&
            generationMode === "image_to_video")
            ? true
            : !selectedModel.includes("pixverse")) &&
          !selectedModel.includes("sora2") &&
          !selectedModel.includes("ltx2") &&
          !selectedModel.includes("ltx-2.3-fast") &&
          !selectedModel.includes("kling-");

        if (needsImage && uploadedImages.length === 0) {
          toast.error("Please upload at least one image");
          setError("Please upload at least one image");
          return;
        }

        // Validation: Ensure image is provided for I2V mode
        // This should have been caught by mode detection, but double-check for safety
        if (uploadedImages.length === 0 && references.length === 0) {
          // If model supports both, we could fall back to T2V, but for I2V-only models we must error
          if (!caps.supportsTextToVideo) {
            toast.error(
              "An input image is required for image-to-video generation with this model",
            );
            setError(
              "An input image is required for image-to-video generation with this model",
            );
            return;
          } else {
            // Model supports both but no image - should not happen due to mode detection, but handle gracefully
            console.warn(
              "⚠️ Image-to-video mode selected but no image provided, this should not happen",
            );
            toast.error(
              "Please upload an image for image-to-video generation, or switch to text-to-video mode",
            );
            setError(
              "Please upload an image for image-to-video generation, or switch to text-to-video mode",
            );
            return;
          }
        }

        if (
          selectedModel.includes("MiniMax") ||
          selectedModel === "I2V-01-Director" ||
          selectedModel === "S2V-01"
        ) {
          // MiniMax image to video - validate specific requirements

          // I2V-01-Director: Always requires first frame image
          if (
            selectedModel === "I2V-01-Director" &&
            uploadedImages.length === 0
          ) {
            toast.error("I2V-01-Director requires a first frame image");
            setError("I2V-01-Director requires a first frame image");
            return;
          }

          // S2V-01: Requires subject reference image (character image)
          if (selectedModel === "S2V-01" && references.length === 0) {
            toast.error(
              "S2V-01 requires a subject reference image (character image)",
            );
            setError(
              "S2V-01 requires a subject reference image (character image)",
            );
            return;
          }

          // MiniMax-Hailuo-02: first_frame_image required for 512P, optional for 768P/1080P
          if (
            selectedModel === "MiniMax-Hailuo-02" &&
            selectedResolution === "512P" &&
            uploadedImages.length === 0
          ) {
            toast.error(
              "MiniMax-Hailuo-02 requires a first frame image for 512P resolution",
            );
            setError(
              "MiniMax-Hailuo-02 requires a first frame image for 512P resolution",
            );
            return;
          }

          // MiniMax-Hailuo-2.3-Fast: Always requires first_frame_image (I2V only)
          if (
            selectedModel === "MiniMax-Hailuo-2.3-Fast" &&
            uploadedImages.length === 0
          ) {
            toast.error("MiniMax-Hailuo-2.3-Fast requires a first frame image");
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
                first_frame_image: uploadedImages[0],
              }),
              // last_frame_image is optional for supported resolutions
              ...(lastFrameImage &&
                (selectedResolution === "768P" ||
                  selectedResolution === "1080P") && {
                  last_frame_image: lastFrameImage,
                }),
            }),
            // MiniMax-Hailuo-2.3: Include duration and resolution, first_frame_image only (no last_frame_image support)
            ...((selectedModel === "MiniMax-Hailuo-2.3" ||
              selectedModel === "MiniMax-Hailuo-2.3-Fast") && {
              duration: selectedMiniMaxDuration,
              resolution: selectedResolution,
              // first_frame_image is required for Fast model, optional for standard 2.3
              // Note: These models do NOT support last_frame_image (First-and-Last-Frame-Video mode)
              ...(uploadedImages.length > 0 && {
                first_frame_image: uploadedImages[0],
              }),
            }),
            // I2V-01-Director: Always requires first_frame_image
            ...(selectedModel === "I2V-01-Director" && {
              first_frame_image: uploadedImages[0],
            }),
            // S2V-01: Uses subject_reference instead of first_frame_image
            ...(selectedModel === "S2V-01" && {
              subject_reference: [
                {
                  type: "character",
                  image: [references[0]],
                },
              ],
            }),
            generationType: "image-to-video",
            isPublic,
          };
          generationType = "image-to-video";
          apiEndpoint = "/api/minimax/video";
        } else if (
          selectedModel.includes("veo3.1-lite") &&
          (selectedModel.includes("i2v") ||
            uploadedImages.length > 0 ||
            references.length > 0 ||
            !!lastFrameImage)
        ) {
          const firstFrame = uploadedImages[0] || references[0] || null;
          const lastFrame =
            uploadedImages[1] || lastFrameImage || references[1] || null;
          const fallbackFrame = firstFrame || lastFrame;

          if (!fallbackFrame) {
            setError("Veo 3.1 Lite image-to-video requires an input image");
            return;
          }

          const apiPrompt = getApiPrompt(prompt);
          const modelDuration =
            duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";

          const normalizedAspectRatio =
            frameSize === "16:9"
              ? "16:9"
              : frameSize === "9:16"
                ? "9:16"
                : "auto";
          const normalizedResolution =
            selectedQuality === "1080p" && modelDuration === "8s"
              ? "1080p"
              : "720p";

          if (firstFrame && lastFrame) {
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              first_frame_url: firstFrame,
              last_frame_url: lastFrame,
              aspect_ratio: normalizedAspectRatio,
              resolution: normalizedResolution,
              auto_fix: true,
              isPublic,
            };
            generationType = "image-to-video";
            apiEndpoint = "/api/fal/veo3_1/lite/first-last/submit";
          } else {
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              image_url: fallbackFrame,
              aspect_ratio: normalizedAspectRatio,
              duration: modelDuration,
              resolution: normalizedResolution,
              auto_fix: true,
              isPublic,
            };
            generationType = "image-to-video";
            apiEndpoint = "/api/fal/veo3_1/lite/image-to-video/submit";
          }
        } else if (
          selectedModel.includes("veo3.1") &&
          (selectedModel.includes("i2v") ||
            uploadedImages.length > 0 ||
            references.length > 0)
        ) {
          // Veo 3.1: if two frames are present use first-last-frame model; otherwise image-to-video
          if (uploadedImages.length === 0 && references.length === 0) {
            setError("Veo 3.1 image-to-video requires an input image");
            return;
          }
          const isFast = selectedModel.includes("fast");
          const apiPrompt = getApiPrompt(prompt);
          const modelDuration =
            duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          const firstFrame = uploadedImages[0] || references[0];
          const lastFrame =
            uploadedImages[1] || lastFrameImage || references[1] || null;

          const isFirstLastMode = Boolean(firstFrame && lastFrame);

          if (isFirstLastMode) {
            // First/Last frame -> dedicated model, only two frame URLs
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt,
              first_frame_url: firstFrame,
              last_frame_url: lastFrame,
              aspect_ratio:
                frameSize === "16:9"
                  ? "16:9"
                  : frameSize === "9:16"
                    ? "9:16"
                    : "auto",
              duration: modelDuration,
              resolution: selectedQuality,
              generate_audio: true,
              isPublic,
            };
            generationType = "image-to-video";
            apiEndpoint = isFast
              ? "/api/fal/veo3_1/first-last/fast/submit"
              : "/api/fal/veo3_1/first-last/submit";
          } else {
            // Single frame -> standard I2V
            requestBody = {
              prompt: apiPrompt,
              originalPrompt: prompt, // Store original prompt for display
              image_url: firstFrame, // single image
              first_frame_url: firstFrame,
              ...(lastFrameImage && { last_frame_url: lastFrameImage }),
              aspect_ratio:
                frameSize === "16:9"
                  ? "16:9"
                  : frameSize === "9:16"
                    ? "9:16"
                    : "auto",
              duration: modelDuration, // Use selected duration (4s, 6s, or 8s)
              resolution: selectedQuality, // Use selected quality (720p or 1080p)
              generate_audio: true,
              isPublic,
            };
            generationType = "image-to-video";
            apiEndpoint = isFast
              ? "/api/fal/veo3_1/image-to-video/fast/submit"
              : "/api/fal/veo3_1/image-to-video/submit";
          }
        } else if (
          selectedModel.includes("veo3") &&
          !selectedModel.includes("veo3.1") &&
          (selectedModel.includes("i2v") ||
            uploadedImages.length > 0 ||
            references.length > 0)
        ) {
          // Veo3 image-to-video generation (i2v variant or when image is uploaded)
          if (uploadedImages.length === 0 && references.length === 0) {
            setError("Veo3 image-to-video requires an input image");
            return;
          }
          const isFast = selectedModel.includes("fast");
          const apiPrompt = getApiPrompt(prompt);
          const modelDuration =
            duration === 4 ? "4s" : duration === 6 ? "6s" : "8s";
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image_url: uploadedImages[0], // Veo3 expects a single image URL
            aspect_ratio:
              frameSize === "16:9"
                ? "16:9"
                : frameSize === "9:16"
                  ? "9:16"
                  : "auto",
            duration: modelDuration, // Use selected duration (4s, 6s, or 8s)
            resolution: selectedQuality, // Use selected quality
            generate_audio: true,
            isPublic,
          };
          generationType = "image-to-video";
          apiEndpoint = isFast
            ? "/api/fal/veo3/image-to-video/fast/submit"
            : "/api/fal/veo3/image-to-video/submit";
        } else if (selectedModel.includes("wan-2.5")) {
          // WAN 2.5 image-to-video generation
          if (uploadedImages.length === 0) {
            setError("WAN 2.5 image-to-video requires an input image");
            return;
          }
          const isFast = selectedModel.includes("fast");
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: isFast
              ? "wan-video/wan-2.5-i2v-fast"
              : "wan-video/wan-2.5-i2v",
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image: uploadedImages[0], // WAN expects image URL
            duration: duration, // 5 or 10 seconds
            resolution: frameSize.includes("480")
              ? "480p"
              : frameSize.includes("720")
                ? "720p"
                : "1080p",
            ...(uploadedAudio && { audio: uploadedAudio }), // Include audio if uploaded
            generationType: "image-to-video",
            isPublic,
          };
          generationType = "image-to-video";
          // Use fast alias route when selected fast model
          apiEndpoint = isFast
            ? "/api/replicate/wan-2-5-i2v/fast/submit"
            : "/api/replicate/wan-2-5-i2v/submit";
        } else if (selectedModel === "kling-o1") {
          // Kling o1 conditional logic:
          // - If only first frame: use reference-to-video model
          // - If both first and last frame: use image-to-video model
          if (uploadedImages.length === 0 && !lastFrameImage) {
            setError("Kling o1 requires at least a first frame image");
            return;
          }
          const firstFrame = uploadedImages[0];
          const lastFrame = uploadedImages[1] || lastFrameImage || null;

          if (!firstFrame) {
            setError("Kling o1 requires a first frame image");
            return;
          }

          // Duration must be "5" or "10" as string
          const durationStr =
            duration === 5 ? "5" : duration === 10 ? "10" : "5";

          // Check if both frames are provided
          if (lastFrame) {
            // Both frames provided - use image-to-video model
            // Format prompt with @Image1 and @Image2 references as required by the model
            const basePrompt = getApiPrompt(prompt);
            let formattedPrompt = basePrompt;
            // Ensure both @Image1 and @Image2 are present in the prompt
            if (!formattedPrompt.includes("@Image1")) {
              formattedPrompt += " @Image1";
            }
            if (!formattedPrompt.includes("@Image2")) {
              formattedPrompt += " @Image2";
            }

            requestBody = {
              prompt: formattedPrompt,
              originalPrompt: prompt,
              start_image_url: firstFrame,
              end_image_url: lastFrame,
              duration: durationStr,
              generationType: "image-to-video",
              isPublic,
            };
            generationType = "image-to-video";
            apiEndpoint = "/api/fal/kling-o1/first-last-frame-to-video/submit";
          } else {
            // Only first frame provided - use reference-to-video model
            const basePrompt = getApiPrompt(prompt);
            // Format prompt - user can reference @Image1, @Image2, etc. for image_urls
            // No need to force add @Image1 since user should control the prompt
            let formattedPrompt = basePrompt;
            // If no image reference in prompt, add @Image1 for the single uploaded image
            if (
              !formattedPrompt.includes("@Image") &&
              !formattedPrompt.includes("@Element")
            ) {
              formattedPrompt += " @Image1";
            }

            // Map aspect ratio to valid values
            const aspectRatioMap: Record<string, string> = {
              "16:9": "16:9",
              "9:16": "9:16",
              "1:1": "1:1",
              "4:3": "16:9", // Default to 16:9 if not supported
              "3:4": "9:16",
            };
            const aspectRatio = aspectRatioMap[frameSize] || "16:9";

            requestBody = {
              prompt: formattedPrompt,
              originalPrompt: prompt,
              image_urls: [firstFrame], // Single image in array
              duration: durationStr,
              aspect_ratio: aspectRatio,
              generationType: "image-to-video",
              isPublic,
            };
            generationType = "image-to-video";
            apiEndpoint = "/api/fal/kling-o1/reference-to-video/submit";
          }
        } else if (selectedModel.startsWith("kling-v3") && hasImage) {
          // Kling 3 image-to-video (FAL)
          if (uploadedImages.length === 0) {
            toast.error(
              "Kling 3 image-to-video requires an input image. Please upload an image.",
            );
            setIsGenerating(false);
            return;
          }
          const apiPrompt = getApiPrompt(prompt);
          const klingDuration =
            typeof duration === "number"
              ? duration
              : parseInt(String(duration), 10) || 5;
          const modelDuration = String(
            Math.min(15, Math.max(3, klingDuration)),
          );
          const isPro = selectedModel === "kling-v3-pro";
          requestBody = {
            model: isPro
              ? "fal-ai/kling-video/v3/pro/image-to-video"
              : "fal-ai/kling-video/v3/standard/image-to-video",
            prompt: apiPrompt,
            originalPrompt: prompt,
            start_image_url: uploadedImages[0],
            ...(uploadedImages[1] ? { end_image_url: uploadedImages[1] } : {}),
            duration: modelDuration,
            negative_prompt: "blur, distort, and low quality",
            cfg_scale: 0.5,
            generate_audio: generateAudio,
            generationType: "image-to-video",
            isPublic,
          };
          generationType = "image-to-video";
          apiEndpoint = isPro
            ? "/api/fal/kling-v3/pro/image-to-video/submit"
            : "/api/fal/kling-v3/standard/image-to-video/submit";
        } else if (selectedModel === "kling-2.6-pro" && hasImage) {
          // Kling 2.6 Pro image-to-video (FAL)
          if (uploadedImages.length === 0) {
            toast.error(
              "Kling 2.6 Pro image-to-video requires an input image. Please upload an image.",
            );
            setIsGenerating(false);
            return;
          }
          const apiPrompt = getApiPrompt(prompt);
          const modelDuration = duration === 5 ? "5" : "10";
          requestBody = {
            model: "fal-ai/kling-video/v2.6/pro/image-to-video",
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image_url: uploadedImages[0],
            duration: modelDuration,
            negative_prompt: "blur, distort, and low quality",
            cfg_scale: 0.5,
            generate_audio: generateAudio, // Explicitly pass true or false
            generationType: "image-to-video",
            isPublic,
          };
          generationType = "image-to-video";
          apiEndpoint = "/api/fal/kling-2.6-pro/image-to-video/submit";
        } else if (
          selectedModel.startsWith("kling-") &&
          selectedModel !== "kling-2.6-pro"
        ) {
          // Kling I2V - supports both t2v and i2v variants, use I2V when image is uploaded
          // Kling v2.1 and v2.1-master REQUIRE start_image (cannot do pure T2V)
          if (uploadedImages.length === 0) {
            const isV21 = selectedModel.includes("v2.1");
            if (isV21) {
              toast.error(
                "Kling 2.1 and Kling 2.1 Master require an input image. Please upload an image to use these models.",
              );
            } else {
              toast.error(
                "Kling image-to-video requires an input image. Please upload an image.",
              );
            }
            setIsGenerating(false);
            return;
          }
          const isV25 = selectedModel.includes("v2.5");
          if (isV25) {
            // Kling 2.5 Turbo Pro - uses 'image' parameter for I2V
            const apiPrompt = getApiPrompt(prompt);
            requestBody = {
              model: "kwaivgi/kling-v2.5-turbo-pro",
              prompt: apiPrompt,
              originalPrompt: prompt, // Store original prompt for display
              image: uploadedImages[0],
              duration,
              aspect_ratio:
                frameSize === "9:16"
                  ? "9:16"
                  : frameSize === "1:1"
                    ? "1:1"
                    : "16:9",
              generationType: "image-to-video",
              isPublic,
            };
          } else {
            // Kling v2.1 and v2.1-master - use 'start_image' parameter (required)
            const isMaster = selectedModel.includes("master");
            const modelName = isMaster
              ? "kwaivgi/kling-v2.1-master"
              : "kwaivgi/kling-v2.1";
            const apiPrompt = getApiPrompt(prompt);
            requestBody = {
              model: modelName,
              prompt: apiPrompt,
              originalPrompt: prompt, // Store original prompt for display
              start_image: uploadedImages[0], // Required for v2.1
              duration,
              aspect_ratio:
                frameSize === "9:16"
                  ? "9:16"
                  : frameSize === "1:1"
                    ? "1:1"
                    : "16:9",
              mode: isMaster ? undefined : klingMode, // Only send mode for base v2.1, not master
              generationType: "image-to-video",
              isPublic,
            };
          }
          generationType = "image-to-video";
          apiEndpoint = "/api/replicate/kling-i2v/submit";
        } else if (isSeedance2FamilyModel(selectedModel)) {
          const seedanceInputImageUrl = uploadedImages[0] || lastFrameImage;
          const seedanceEndImageUrl = uploadedImages[0]
            ? lastFrameImage || uploadedImages[1]
            : undefined;
          if (!seedanceInputImageUrl) {
            setError(
              `${isSeedance2FastModel(selectedModel) ? "Seedance 2.0 Fast" : "Seedance 2.0"} image-to-video requires an input image`,
            );
            return;
          }
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt,
            image_url: seedanceInputImageUrl,
            resolution: seedanceResolution === "480p" ? "480p" : "720p",
            duration: duration === "auto" ? "auto" : String(duration),
            aspect_ratio: frameSize || "auto",
            generate_audio: generateAudio,
            generationType: "image-to-video",
            isPublic,
            ...(seedanceEndImageUrl
              ? { end_image_url: seedanceEndImageUrl }
              : {}),
          };
          generationType = "image-to-video";
          apiEndpoint = isSeedance2FastModel(selectedModel)
            ? "/api/fal/seedance-2.0/fast/image-to-video/submit"
            : "/api/fal/seedance-2.0/image-to-video/submit";
        } else if (selectedModel.includes("seedance")) {
          // Seedance I2V - Image-to-video mode
          if (uploadedImages.length === 0) {
            setError("Seedance image-to-video requires an input image");
            return;
          }
          const isSeedance15 = selectedModel.includes("seedance-1.5");
          const isLite = selectedModel.includes("lite");
          const isProFast = selectedModel.includes("pro-fast");
          const apiPrompt = getApiPrompt(prompt);
          // Last frame support (Pro and Lite only, not Pro Fast)
          const lastFrame =
            !isProFast && lastFrameImage ? lastFrameImage : null;
          const hasLastFrame = Boolean(lastFrame);

          if (isSeedance15) {
            requestBody = {
              model: "bytedance/seedance-1.5-pro",
              prompt: apiPrompt,
              originalPrompt: prompt,
              image: uploadedImages[0],
              duration,
              aspect_ratio:
                frameSize === "9:16"
                  ? "9:16"
                  : frameSize === "1:1"
                    ? "1:1"
                    : "16:9",
              generate_audio: generateAudio,
              generationType: "image-to-video",
              isPublic,
              ...(hasLastFrame ? { last_frame_image: lastFrame } : {}),
            } as any;
          } else {
            let modelName = "bytedance/seedance-1-pro";
            if (isLite) {
              modelName = "bytedance/seedance-1-lite";
            } else if (isProFast) {
              modelName = "bytedance/seedance-1-pro-fast";
            }
            requestBody = {
              model: modelName,
              prompt: apiPrompt,
              originalPrompt: prompt, // Store original prompt for display
              image: uploadedImages[0], // First frame image for I2V
              duration,
              resolution: seedanceResolution,
              aspect_ratio:
                frameSize === "9:16"
                  ? "9:16"
                  : frameSize === "1:1"
                    ? "1:1"
                    : "16:9",
              generationType: "image-to-video",
              isPublic,
              ...(hasLastFrame ? { last_frame_image: lastFrame } : {}),
              ...(!hasLastFrame &&
              seedanceResolution !== "1080p" &&
              references.length > 0
                ? {
                    reference_images: references.slice(0, 4),
                  }
                : {}),
            } as any;
          }
          generationType = "image-to-video";
          apiEndpoint = isProFast
            ? "/api/replicate/seedance-pro-fast-i2v/submit"
            : "/api/replicate/seedance-i2v/submit";
        } else if (selectedModel === PIXVERSE_V5_I2V_MODEL) {
          // PixVerse V5 I2V (Replicate)
          if (uploadedImages.length === 0) {
            setError("PixVerse image-to-video requires an input image");
            return;
          }
          const apiPrompt = getApiPrompt(prompt);
          requestBody = {
            model: "pixverse/pixverse-v5",
            prompt: apiPrompt,
            originalPrompt: prompt, // Store original prompt for display
            image: uploadedImages[0],
            duration,
            quality: pixverseQuality,
            aspect_ratio: frameSize, // PixVerse supports 16:9, 9:16, 1:1
            generationType: "image-to-video",
            isPublic,
          };
          generationType = "image-to-video";
          apiEndpoint = "/api/replicate/pixverse-v5-i2v/submit";
        } else if (
          selectedModel === PIXVERSE_V6_I2V_MODEL ||
          selectedModel === PIXVERSE_V6_T2V_MODEL
        ) {
          const firstStill =
            uploadedImages[0] || references[0] || "";
          if (!firstStill) {
            setError("PixVerse V6 image-to-video requires an input image");
            return;
          }
          const apiPrompt = getApiPrompt(prompt);
          let pvDur =
            typeof duration === "number"
              ? duration
              : parseInt(String(duration), 10) || 5;
          pvDur = Math.min(15, Math.max(5, pvDur));
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt,
            image_url: firstStill,
            resolution: pixverseQuality,
            duration: pvDur,
            generate_audio_switch: Boolean(pixverseV6GenerateAudio),
            generate_multi_clip_switch: Boolean(pixverseV6MultiClip),
            thinking_type: "auto",
            generationType: "image-to-video",
            isPublic,
          };
          if (pixverseV6Style) {
            (requestBody as any).style = pixverseV6Style;
          }
          generationType = "image-to-video";
          apiEndpoint = "/api/fal/pixverse/v6/image-to-video/submit";
        } else if (
          selectedModel.includes("sora2") &&
          !selectedModel.includes("v2v")
        ) {
          // Sora 2 I2V - supports both t2v and i2v variants, use I2V when image is uploaded
          if (uploadedImages.length === 0) {
            setError("Sora 2 image-to-video requires an input image");
            return;
          }
          const isPro = selectedModel.includes("pro");
          const apiPrompt = getApiPrompt(prompt);

          // Ensure duration is a number and one of [4, 8, 12]
          let soraDuration: number =
            typeof duration === "number"
              ? duration
              : parseInt(String(duration), 10) || 8;
          // Clamp to valid values: 4, 8, or 12
          if (![4, 8, 12].includes(soraDuration)) {
            // Round to nearest valid value
            if (soraDuration < 6) soraDuration = 4;
            else if (soraDuration < 10) soraDuration = 8;
            else soraDuration = 12;
          }

          // Ensure resolution is valid for I2V
          let soraResolution = selectedQuality || "auto";
          if (isPro) {
            // Pro supports auto, 720p, or 1080p
            if (
              soraResolution !== "auto" &&
              soraResolution !== "720p" &&
              soraResolution !== "1080p"
            ) {
              soraResolution = "auto"; // Default to auto for Pro I2V
            }
          } else {
            // Standard supports auto or 720p
            if (soraResolution !== "auto" && soraResolution !== "720p") {
              soraResolution = "auto"; // Default to auto for Standard I2V
            }
          }

          // Ensure aspect_ratio is valid
          let soraAspectRatio =
            frameSize === "16:9"
              ? "16:9"
              : frameSize === "9:16"
                ? "9:16"
                : "auto";

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
          generationType = "image-to-video";
          apiEndpoint = isPro
            ? "/api/fal/sora2/image-to-video/pro/submit"
            : "/api/fal/sora2/image-to-video/submit";
        } else if (selectedModel.includes("ltx2")) {
          // LTX V2 Image-to-Video (Pro/Fast) - model currently outputs fixed 16:9
          const isPro = selectedModel.includes("pro");
          const normalizedRes = (selectedResolution || "1080p").toLowerCase();
          const ratio = "16:9";
          if (uploadedImages.length === 0) {
            setError("LTX V2 image-to-video requires an input image");
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
            generationType: "image-to-video",
            isPublic,
          } as any;
          generationType = "image-to-video";
          apiEndpoint = isPro
            ? "/api/fal/ltx2/image-to-video/pro/submit"
            : "/api/fal/ltx2/image-to-video/fast/submit";
        } else if (
          selectedModel.includes("ltx-2.3-fast") ||
          selectedModel.includes("ltx-2.3-pro")
        ) {
          // LTX 2.3 Fast/Pro Image-to-Video (Replicate) - supports first frame + optional last frame
          const isPro = selectedModel.includes("ltx-2.3-pro");
          if (uploadedImages.length === 0) {
            setError("LTX 2.3 image-to-video requires an input image");
            return;
          }
          const normalizedRes = (selectedResolution || "1080p").toLowerCase();
          const apiPrompt = getApiPrompt(prompt);
          const ltxAspect = frameSize === "9:16" ? "9:16" : "16:9";
          const ltxFps = fps || 25;
          const lastFrame =
            lastFrameImage ||
            (uploadedImages.length > 1 ? uploadedImages[1] : null);
          requestBody = {
            prompt: apiPrompt,
            originalPrompt: prompt,
            image: uploadedImages[0],
            ...(lastFrame ? { last_frame_image: lastFrame } : {}),
            resolution:
              normalizedRes.includes("4k") || normalizedRes.includes("2160")
                ? "4k"
                : normalizedRes.includes("2k") || normalizedRes.includes("1440")
                  ? "2k"
                  : "1080p",
            aspect_ratio: ltxAspect,
            duration,
            fps: ltxFps,
            camera_motion: selectedCameraMovements[0] || "none",
            generate_audio: generateAudio,
            ...(isPro && uploadedAudio ? { audio: uploadedAudio } : {}),
            ...(isPro && uploadedVideo ? { video: uploadedVideo } : {}),
            generationType: "image-to-video",
            isPublic,
          } as any;
          generationType = "image-to-video";
          apiEndpoint = isPro
            ? "/api/replicate/ltx-2-3-pro-i2v/submit"
            : "/api/replicate/ltx-2-3-fast-i2v/submit";
        } else if (
          selectedModel === "gen4_turbo" ||
          selectedModel === "gen3a_turbo"
        ) {
          // Runway image to video - only for gen4_turbo and gen3a_turbo
          // Ensure image is provided
          if (uploadedImages.length === 0) {
            setError(
              "An input image is required for Runway image-to-video generation",
            );
            return;
          }

          const runwaySku =
            selectedModel === "gen4_turbo"
              ? `Gen-4  Turbo ${duration}s`
              : `Gen-3a  Turbo ${duration}s`;
          const apiPrompt = getApiPrompt(prompt);
          const imageToVideoBody = buildImageToVideoBody({
            model: selectedModel as "gen4_turbo" | "gen3a_turbo",
            ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
            promptText: apiPrompt,
            duration: duration as 5 | 10,
            promptImage: uploadedImages[0],
          });

          console.log("🎬 Runway I2V payload:", {
            mode: "image_to_video",
            sku: runwaySku,
            imageToVideo: {
              ...imageToVideoBody,
              promptImage: imageToVideoBody.promptImage
                ? "provided"
                : "missing",
            },
          });

          requestBody = {
            mode: "image_to_video",
            sku: runwaySku,
            imageToVideo: imageToVideoBody,
            originalPrompt: prompt, // Store original prompt for display
            generationType: "image-to-video",
            isPublic,
          };
          apiEndpoint = "/api/runway/video";
        } else {
          // Unknown model for image-to-video mode
          setError(
            `Model "${selectedModel}" does not support image-to-video generation. Please select a different model.`,
          );
          return;
        }
        generationType = "image-to-video";
      } else {
        // Video to video generation
        if (selectedModel.includes("sora2-v2v")) {
          // Sora 2 V2V Remix - requires source_history_id pointing to a Sora 2 video
          // The source video must be from a previous Sora 2 generation (T2V or I2V)
          if (!sourceHistoryEntryId && !uploadedVideo) {
            setError(
              "Sora 2 Remix requires selecting a source video from history. Please upload or select a Sora 2 video from your history.",
            );
            return;
          }

          // If we have a history entry ID, use it (preferred)
          // Otherwise, try to find the entry by video URL
          let sourceHistoryId = sourceHistoryEntryId;
          let sourceEntry: any = null;

          if (sourceHistoryId) {
            // Find the entry by ID
            sourceEntry = historyEntries.find(
              (entry: any) => entry.id === sourceHistoryId,
            );
          } else if (uploadedVideo) {
            // Find the matching history entry by video URL
            const matchingEntry = historyEntries.find((entry: any) => {
              const entryVideos = entry?.images || entry?.videos || [];
              return entryVideos.some(
                (img: any) =>
                  img?.url === uploadedVideo ||
                  img?.firebaseUrl === uploadedVideo ||
                  img?.originalUrl === uploadedVideo,
              );
            });
            if (matchingEntry?.id) {
              sourceHistoryId = matchingEntry.id;
              sourceEntry = matchingEntry;
            }
          }

          if (!sourceHistoryId || !sourceEntry) {
            setError(
              "Could not find source video in history. Please select a Sora 2 video from your history for remix.",
            );
            return;
          }

          // Validate that the source video is from a Sora 2 generation
          const entryModel = String(sourceEntry?.model || "").toLowerCase();
          const hasSoraVideoId = !!(
            sourceEntry?.soraVideoId ||
            (Array.isArray(sourceEntry?.videos) &&
              sourceEntry?.videos[0]?.soraVideoId)
          );
          const isSoraModel =
            entryModel.includes("sora-2") || entryModel.includes("sora2");

          if (!isSoraModel && !hasSoraVideoId) {
            setError(
              "The selected video is not from a Sora 2 generation. Please select a video generated with Sora 2 (T2V or I2V).",
            );
            return;
          }

          // Extract soraVideoId if available (preferred by backend)
          const soraVideoId =
            sourceEntry?.soraVideoId ||
            (Array.isArray(sourceEntry?.videos) &&
              sourceEntry?.videos[0]?.soraVideoId);

          requestBody = {
            prompt,
            // Prefer video_id if available, otherwise use source_history_id
            ...(soraVideoId
              ? { video_id: soraVideoId }
              : { source_history_id: sourceHistoryId }),
            generationType: "video-to-video",
            isPublic,
          };
          generationType = "video-to-video";
          apiEndpoint = "/api/fal/sora2/video-to-video/remix/submit";
        } else if (selectedModel === "kling-lip-sync") {
          // Kling Lipsync - requires video_url or video_id, and text or audio_file
          if (!uploadedVideo && !sourceHistoryEntryId) {
            toast.error(
              "Kling Lip Sync requires a video input. Please upload a video or select a source video.",
            );
            setError(
              "Kling Lip Sync requires a video input. Please upload a video or select a source video.",
            );
            setIsGenerating(false);
            return;
          }
          if (!prompt.trim() && !uploadedAudio) {
            toast.error(
              "Kling Lip Sync requires either text or audio file input.",
            );
            setError(
              "Kling Lip Sync requires either text or audio file input.",
            );
            setIsGenerating(false);
            return;
          }

          // Handle local video upload if needed
          let videoForRequest = uploadedVideo;
          if (videoForRequest?.startsWith("blob:")) {
            const cached = uploadedUrlByLocalUrl[videoForRequest];
            if (cached) {
              videoForRequest = cached;
            } else {
              const file = localVideoFilesByUrl[videoForRequest];
              if (file) {
                const uploaded = await uploadLocalVideoFile(file);
                if (uploaded?.url) {
                  const remoteUrl = uploaded.url;
                  setUploadedUrlByLocalUrl(prev => ({ ...prev, [videoForRequest]: remoteUrl }));
                  setUploadedVideo(remoteUrl);
                  videoForRequest = remoteUrl;
                }
              }
            }
          }

          requestBody = {
            model: "kwaivgi/kling-lip-sync",
            video_url: videoForRequest || undefined, // Use video_url if uploaded
            video_id: sourceHistoryEntryId || undefined, // Use video_id if from history
            text: prompt.trim() || undefined, // Text for lip sync
            audio_file: uploadedAudio || undefined, // Audio file if uploaded
            voice_id: "en_AOT", // Default voice_id (can be made configurable later)
            voice_speed: 1, // Default voice speed (can be made configurable later)
            generationType: "video-to-video",
            isPublic,
            originalPrompt: prompt.trim() || "", // Store original prompt for display
          };
          generationType = "video-to-video";
          apiEndpoint = "/api/replicate/kling-lipsync/submit";
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
          if (!uploadedVideoDurationSec || uploadedVideoDurationSec <= 0) {
            toast.error(
              "Could not determine input video duration. Please re-upload the video.",
            );
            setIsGenerating(false);
            return;
          }

          const characterImage = uploadedCharacterImage || uploadedImages[0];

          // IMPORTANT: blob: URLs are NOT valid outside the browser.
          // Upload local device-selected video on Generate so backend/Replicate can access it.
          let videoForRequest = uploadedVideo;
          if (videoForRequest.startsWith("blob:")) {
            const cached = uploadedUrlByLocalUrl[videoForRequest];
            if (cached) {
              videoForRequest = cached;
            } else {
              const file = localVideoFilesByUrl[videoForRequest];
              if (!file) {
                throw new Error(
                  "Selected local video is not available. Please re-select the video from device.",
                );
              }
              const uploaded = await uploadLocalVideoFile(file);
              if (!uploaded?.url)
                throw new Error("Video upload failed: no URL returned");
              const remoteUrl = uploaded.url;
              setUploadedUrlByLocalUrl((prev) => ({
                ...prev,
                [videoForRequest]: remoteUrl,
              }));
              setUploadedVideo(remoteUrl);
              try {
                URL.revokeObjectURL(videoForRequest);
              } catch {}
              videoForRequest = remoteUrl;
            }
          } else if (videoForRequest.startsWith("data:video")) {
            // Fallback for legacy flows that store the video as a data URI.
            const match = /^data:([^;]+);base64,(.*)$/.exec(videoForRequest);
            if (!match) throw new Error("Invalid local video data");
            const contentType = match[1] || "video/mp4";
            const base64 = match[2] || "";
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++)
              bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: contentType });
            const ext = contentType.includes("webm")
              ? "webm"
              : contentType.includes("ogg")
                ? "ogg"
                : contentType.includes("quicktime")
                  ? "mov"
                  : "mp4";
            const file = new File([blob], `upload.${ext}`, {
              type: contentType,
            });
            const uploaded = await uploadLocalVideoFile(file);
            if (!uploaded?.url)
              throw new Error("Video upload failed: no URL returned");
            setUploadedVideo(uploaded.url);
            videoForRequest = uploaded.url;
          }

          requestBody = {
            model: "wan-video/wan-2.2-animate-replace",
            video: videoForRequest,
            character_image: characterImage,
            video_duration: uploadedVideoDurationSec,
            resolution: wanAnimateResolution,
            refert_num: wanAnimateRefertNum,
            go_fast: wanAnimateGoFast,
            merge_audio: wanAnimateMergeAudio,
            frames_per_second: wanAnimateFps,
            ...(wanAnimateSeed !== undefined && { seed: wanAnimateSeed }),
            generationType: "video-to-video",
            isPublic,
            originalPrompt: prompt.trim() || "", // Store original prompt for display
          };
          generationType = "video-to-video";
          apiEndpoint = "/api/replicate/wan-2-2-animate-replace/submit";
        } else if (
          selectedModel.includes("MiniMax") ||
          selectedModel === "T2V-01-Director" ||
          selectedModel === "I2V-01-Director" ||
          selectedModel === "S2V-01" ||
          selectedModel.includes("wan-2.5")
        ) {
          // MiniMax and WAN models don't support video to video
          setError(
            "MiniMax and WAN models don't support video to video generation",
          );
          return;
        } else {
          // Runway video to video
          if (!uploadedVideo) {
            toast.error("Please upload a video");
            setError("Please upload a video");
            return;
          }
          const runwayAlephSku = "Gen-4 Aleph 10s";
          requestBody = {
            mode: "video_to_video",
            sku: runwayAlephSku,
            videoToVideo: buildVideoToVideoBody({
              model: "gen4_aleph",
              ratio: convertFrameSizeToRunwayRatio(frameSize) as any,
              promptText: prompt,
              videoUri: uploadedVideo,
              references:
                references.length > 0
                  ? references.map((ref) => ({
                      type: "image",
                      uri: ref,
                    }))
                  : undefined,
            }),
            generationType: "video-to-video",
            isPublic,
          };
          apiEndpoint = "/api/runway/video";
        }
        generationType = "video-to-video";
      }

      // Create local preview entry (history-style) to show generating tile in today's row
      setLocalVideoPreview({
        id: `video-loading-${Date.now()}`,
        prompt,
        model: selectedModel,
        generationType: generationType as any,
        images: [{ id: "video-loading", url: "", originalUrl: "" }] as any,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 1,
        status: "generating",
      } as any);

      // Backend will handle history creation - no frontend history creation needed

      // Make API call
      console.log("🚀 Making API call to:", apiEndpoint);
      console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));
      console.log("📤 Selected model:", selectedModel);
      console.log("📤 Generation mode:", generationMode);
      console.log("📤 API Endpoint being used:", apiEndpoint);
      console.log(
        "📤 Is this a MiniMax model?",
        selectedModel.includes("MiniMax") ||
          selectedModel === "T2V-01-Director" ||
          selectedModel === "I2V-01-Director" ||
          selectedModel === "S2V-01",
      );
      console.log(
        "📤 Is this a Runway model?",
        !(
          selectedModel.includes("MiniMax") ||
          selectedModel === "T2V-01-Director" ||
          selectedModel === "I2V-01-Director" ||
          selectedModel === "S2V-01"
        ),
      );

      // Debug MiniMax specific fields
      if (
        selectedModel.includes("MiniMax") ||
        selectedModel === "T2V-01-Director" ||
        selectedModel === "I2V-01-Director" ||
        selectedModel === "S2V-01"
      ) {
        console.log("📤 MiniMax Debug Info:");
        console.log("📤 - Model:", selectedModel);
        const rb: any = requestBody as any;
        console.log("📤 - Duration:", rb?.duration);
        console.log("📤 - Resolution:", rb?.resolution);
        console.log("📤 - First frame image:", !!rb?.first_frame_image);
        console.log("📤 - Subject reference:", rb?.subject_reference);
        console.log("📤 - Prompt length:", rb?.prompt?.length || 0);

        if (selectedModel === "S2V-01") {
          console.log("📤 S2V-01 specific debug:");
          const rb2: any = requestBody as any;
          console.log("📤 - References array length:", references.length);
          console.log(
            "📤 - Subject reference structure:",
            JSON.stringify(rb2?.subject_reference, null, 2),
          );
        }
      }

      const api = getApiClient();
      let result: any;
      try {
        const { data } = await api.post(apiEndpoint, requestBody);
        result = data?.data || data;
        failedHistoryIdForRefresh =
          result?.historyId || failedHistoryIdForRefresh;
      } catch (e: any) {
        // Check if this is a network error (no response from server)
        const isNetworkError =
          !e?.response &&
          (e?.code === "ECONNABORTED" ||
            e?.code === "ERR_NETWORK" ||
            e?.code === "ETIMEDOUT" ||
            e?.message?.includes("Network Error") ||
            e?.message?.includes("Failed to fetch") ||
            e?.message?.includes("timeout"));

        if (isNetworkError) {
          const baseUrl = api.defaults.baseURL || "the server";
          const errorMsg = `Network error: Unable to connect to ${baseUrl}. Please check your internet connection and try again.`;
          console.error("❌ Network error details:", {
            code: e?.code,
            message: e?.message,
            endpoint: apiEndpoint,
            baseURL: baseUrl,
            stack: e?.stack,
          });
          throw new Error(errorMsg);
        }

        // Some providers may return 5xx while the task actually got queued; try to salvage known success fields
        const statusCode = e?.response?.status;
        const body = e?.response?.data;
        const msg = body?.message || e?.message || "Request failed";
        const queuedRequestId = body?.data?.requestId || body?.requestId;

        if (
          String(statusCode) === "413" ||
          /request entity too large/i.test(String(msg))
        ) {
          toast.error(
            "Video too large for provider. Max 16MB. Please upload ≤ 14MB",
          );
          console.error("❌ API 413 payload too large");
          throw new Error(`HTTP ${statusCode || 500}: ${msg}`);
        }

        // If a requestId is present despite error status, proceed as submitted
        if (queuedRequestId) {
          console.warn(
            "⚠️ Provider returned error but included requestId; proceeding as submitted",
            { statusCode, msg, queuedRequestId },
          );
          result = {
            requestId: queuedRequestId,
            historyId: body?.data?.historyId || body?.historyId,
            status: "submitted",
          };
          failedHistoryIdForRefresh =
            result?.historyId || failedHistoryIdForRefresh;
        } else {
          // Provide more detailed error information
          const errorDetails = {
            statusCode: statusCode || "No status",
            message: msg,
            endpoint: apiEndpoint,
            baseURL: api.defaults.baseURL,
            responseData: body,
            originalError: e?.message,
          };
          console.error("❌ API response not ok:", errorDetails);

          // Create a more helpful error message
          let userFriendlyMsg = msg;
          if (statusCode === 401) {
            userFriendlyMsg =
              "Authentication failed. Please try logging out and back in.";
          } else if (statusCode === 403) {
            userFriendlyMsg =
              "Access denied. You may not have permission to perform this action.";
          } else if (statusCode === 404) {
            userFriendlyMsg = `API endpoint not found: ${apiEndpoint}. Please contact support.`;
          } else if (
            statusCode === 500 ||
            statusCode === 502 ||
            statusCode === 503
          ) {
            userFriendlyMsg =
              "Server error. The service may be temporarily unavailable. Please try again in a few moments.";
          } else if (!statusCode) {
            userFriendlyMsg = `Request failed: ${msg}. Please check your connection and try again.`;
          }

          throw new Error(userFriendlyMsg);
        }
      }
      console.log("📥 API response:", result);

      failedHistoryIdForRefresh = result?.historyId || failedHistoryIdForRefresh;

      // Debug MiniMax response structure
      if (
        selectedModel.includes("MiniMax") ||
        selectedModel === "T2V-01-Director" ||
        selectedModel === "I2V-01-Director" ||
        selectedModel === "S2V-01"
      ) {
        console.log("📥 MiniMax Response Debug:");
        console.log("📥 - Response type:", typeof result);
        console.log("📥 - Response keys:", Object.keys(result));
        console.log("📥 - Success field:", result.success);
        console.log("📥 - TaskId field:", result.taskId);
        console.log("📥 - TaskId type:", typeof result.taskId);
        console.log("📥 - Error field:", result.error);
        console.log(
          "📥 - Full response structure:",
          JSON.stringify(result, null, 2),
        );
      }

      if (result.error) {
        console.error("❌ API returned error:", result.error);
        throw new Error(result.error);
      }

      // Validate that we have a taskId for MiniMax models
      console.log("🔍 Validation Debug:");
      console.log("🔍 - Selected model:", selectedModel);
      console.log(
        "🔍 - Is MiniMax model?",
        selectedModel.includes("MiniMax") ||
          selectedModel === "T2V-01-Director" ||
          selectedModel === "I2V-01-Director" ||
          selectedModel === "S2V-01",
      );
      console.log("🔍 - Has taskId?", !!result.taskId);
      console.log("🔍 - Result object:", result);

      if (
        (selectedModel.includes("MiniMax") ||
          selectedModel === "T2V-01-Director" ||
          selectedModel === "I2V-01-Director" ||
          selectedModel === "S2V-01") &&
        !result.taskId
      ) {
        console.error("❌ MiniMax API response missing taskId:", result);
        throw new Error("MiniMax API response missing taskId");
      }

      // Validate that we have a requestId for WAN models
      if (selectedModel.includes("wan-2.5") && !result.requestId) {
        console.error("❌ WAN API response missing requestId:", result);
        throw new Error("WAN API response missing requestId");
      }

      // Validate that we have a requestId for Seedance models
      if (selectedModel.includes("seedance") && !result.requestId) {
        console.error("❌ Seedance API response missing requestId:", result);
        throw new Error("Seedance API response missing requestId");
      }

      // Validate that we have a requestId for PixVerse models
      if (selectedModel.includes("pixverse") && !result.requestId) {
        console.error("❌ PixVerse API response missing requestId:", result);
        throw new Error("PixVerse API response missing requestId");
      }

      // Validate that we have a requestId for Kling models
      if (selectedModel.startsWith("kling-") && !result.requestId) {
        console.error("❌ Kling API response missing requestId:", result);
        throw new Error("Kling API response missing requestId");
      }

      // Validate that we have a requestId for WAN 2.2 Animate Replace
      if (selectedModel === "wan-2.2-animate-replace" && !result.requestId) {
        console.error(
          "❌ WAN Animate Replace API response missing requestId:",
          result,
        );
        throw new Error("WAN Animate Replace API response missing requestId");
      }

      // Validate that we have a requestId for Sora 2 models
      if (selectedModel.includes("sora2") && !result.requestId) {
        console.error("❌ Sora 2 API response missing requestId:", result);
        throw new Error("Sora 2 API response missing requestId");
      }

      // Validate that we have a requestId for LTX 2.3 Replicate models
      if (
        (selectedModel.startsWith("ltx-2.3-fast") ||
          selectedModel.startsWith("ltx-2.3-pro")) &&
        !result.requestId
      ) {
        console.error("❌ LTX 2.3 API response missing requestId:", result);
        throw new Error("LTX 2.3 API response missing requestId");
      }

      let videoUrl: string | undefined;

      if (
        selectedModel.includes("MiniMax") ||
        selectedModel === "T2V-01-Director" ||
        selectedModel === "I2V-01-Director" ||
        selectedModel === "S2V-01"
      ) {
        // MiniMax flow - same as Runway with polling
        console.log(
          "🎬 MiniMax video generation started, task ID:",
          result.taskId,
        );
        console.log("🎬 TaskId type:", typeof result.taskId);
        console.log(
          "🎬 TaskId length:",
          result.taskId ? result.taskId.length : "undefined",
        );
        console.log(
          "🎬 Using MiniMax status checking for model:",
          selectedModel,
        );
        console.log("🎬 Model type:", selectedModel);

        // Poll for completion like Runway
        const videoResult = await waitForMiniMaxVideoCompletion(result.taskId, {
          historyId: result.historyId,
        });
        console.log("🎬 MiniMax video result received:", videoResult);

        if (videoResult.status === "Success") {
          // Video generation completed successfully
          if (
            videoResult.videos &&
            Array.isArray(videoResult.videos) &&
            videoResult.videos[0]?.url
          ) {
            // File retrieval succeeded - use Zata URL
            videoUrl = videoResult.videos[0].url;
            console.log("✅ MiniMax video completed with Zata URL:", videoUrl);
            console.log(
              "📹 Video storage path:",
              videoResult.videos[0].storagePath,
            );
            console.log("📹 Original URL:", videoResult.videos[0].originalUrl);

            // Store video data for later use
            window.miniMaxVideoData = videoResult.videos[0];
          } else if (videoResult.download_url) {
            // Fallback to download_url if videos array is not available
            videoUrl = videoResult.download_url;
            console.log(
              "✅ MiniMax video completed with download URL:",
              videoUrl,
            );
          } else {
            // File retrieval failed, but video generation succeeded - video should be in database
            console.log(
              "✅ MiniMax video generation completed successfully. Video stored in database.",
            );
            videoUrl = ""; // We'll rely on the video being in the database
          }
        } else if (videoResult.status === "Fail") {
          console.error("❌ MiniMax video generation failed:", videoResult);
          throw new Error("MiniMax video generation failed");
        } else {
          console.error("❌ Unexpected MiniMax status:", videoResult);
          throw new Error("Unexpected MiniMax video generation status");
        }
      } else if (selectedModel === "kling-o1") {
        // Kling o1 (FAL queue) first/last frame flow
        console.log(
          "🎬 Kling o1 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          // up to 6 minutes
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000, // 20 minute timeout
            });
            const status = statusRes.data?.data || statusRes.data;
            const s = String(status?.status || "").toLowerCase();
            consecutiveErrors = 0; // Reset on success

            if (s === "completed" || s === "success" || s === "succeeded") {
              try {
                const resultRes = await api.get("/api/fal/queue/result", {
                  params: { model: result.model, requestId: result.requestId },
                  timeout: 1200000,
                });
                videoResult = resultRes.data?.data || resultRes.data;
                // CRITICAL: Update queue status immediately to mark as completed
                if (generationId) {
                  dispatch(
                    updateActiveGeneration({
                      id: generationId,
                      updates: {
                        status: "completed",
                        historyId: result.historyId,
                      },
                    }),
                  );
                  console.log("[queue] Kling o1 marked as completed in queue");
                }
              } catch (resultErr: any) {
                console.error(
                  "[queue] Kling o1 - Failed to fetch result:",
                  resultErr?.message,
                );
                throw resultErr;
              }
              break;
            }
            if (s === "failed" || s === "error") {
              throw new Error("Kling o1 video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (isNetworkError) {
              console.warn(
                `[queue] Kling o1 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] Kling o1 - Error (${attempts + 1}/360):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`Kling o1: Too many network errors. ${errorMsg}`);
            }
            if (attempts === 359)
              throw new Error(
                `Kling o1: Timeout after 360 attempts. ${errorMsg}`,
              );
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Kling o1 video completed with URL:", videoUrl);
        } else if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
          console.log(
            "✅ Kling o1 video completed with URL (video.url):",
            videoUrl,
          );
        } else {
          console.error(
            "❌ Kling o1 video generation did not complete properly",
          );
          throw new Error("Kling o1 video generation did not complete in time");
        }
      } else if (selectedModel.includes("veo3.1-lite")) {
        console.log(
          "🎬 Veo 3.1 Lite video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            if (
              status?.status === "COMPLETED" ||
              status?.status === "completed"
            ) {
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
              }
              break;
            }
            if (status?.status === "FAILED" || status?.status === "failed") {
              throw new Error("Veo 3.1 Lite video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(
                `Veo 3.1 Lite: Too many network errors. ${errorMsg}`,
              );
            }
            if (attempts === 359)
              throw new Error(
                `Veo 3.1 Lite: Timeout after 360 attempts. ${errorMsg}`,
              );
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
          console.log("✅ Veo 3.1 Lite video completed with URL:", videoUrl);
        } else if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Veo 3.1 Lite video completed with URL:", videoUrl);
        } else {
          throw new Error(
            "Veo 3.1 Lite video generation did not complete in time",
          );
        }
      } else if (selectedModel.includes("veo3.1")) {
        // Veo 3.1 flow - queue-based polling
        console.log(
          "🎬 Veo 3.1 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        // Poll for completion using FAL queue status
        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          // 6 minutes max
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            if (
              status?.status === "COMPLETED" ||
              status?.status === "completed"
            ) {
              // Get the result
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] Veo 3.1 marked as completed in queue");
              }
              break;
            }
            if (status?.status === "FAILED" || status?.status === "failed") {
              throw new Error("Veo 3.1 video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (isNetworkError) {
              console.warn(
                `[queue] Veo 3.1 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] Veo 3.1 - Error (${attempts + 1}/360):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`Veo 3.1: Too many network errors. ${errorMsg}`);
            }
            if (attempts === 359)
              throw new Error(
                `Veo 3.1: Timeout after 360 attempts. ${errorMsg}`,
              );
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Veo 3.1 video completed with URL:", videoUrl);
        } else {
          console.error(
            "❌ Veo 3.1 video generation did not complete properly",
          );
          throw new Error("Veo 3.1 video generation did not complete in time");
        }
      } else if (selectedModel.startsWith("alibaba/happy-horse")) {
        console.log(
          "🎬 Happy Horse video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            const statusValue = String(status?.status || "").toLowerCase();
            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              throw new Error("Happy Horse video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(
                `Happy Horse: Too many network errors. ${errorMsg}`,
              );
            }
            if (attempts === 359) {
              throw new Error(
                `Happy Horse: Timeout after 360 attempts. ${errorMsg}`,
              );
            }
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
        } else if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          videoUrl = videoResult.output;
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          videoUrl = videoResult.output[0];
        } else {
          throw new Error(
            "Happy Horse video generation did not complete in time",
          );
        }
      } else if (selectedModel.includes("ltx2")) {
        // LTX V2 flow - queue-based polling (same pattern as Veo 3.1)
        console.log(
          "🎬 LTX V2 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          // up to 6 minutes
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            const s = String(status?.status || "").toLowerCase();
            if (s === "completed" || s === "success" || s === "succeeded") {
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] LTX V2 marked as completed in queue");
              }
              break;
            }
            if (s === "failed" || s === "error") {
              throw new Error("LTX V2 video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (isNetworkError) {
              console.warn(
                `[queue] LTX V2 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] LTX V2 - Error (${attempts + 1}/360):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`LTX V2: Too many network errors. ${errorMsg}`);
            }
            if (attempts === 359)
              throw new Error(
                `LTX V2: Timeout after 360 attempts. ${errorMsg}`,
              );
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        // Parse LTX result shapes: { video: { url } } or { videos: [{url}]} or output fields
        if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
          console.log(
            "✅ LTX V2 video completed with URL (video.url):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log(
            "✅ LTX V2 video completed with URL (videos[0].url):",
            videoUrl,
          );
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          videoUrl = videoResult.output;
          console.log(
            "✅ LTX V2 video completed with URL (output string):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.output) &&
          typeof videoResult.output[0] === "string"
        ) {
          videoUrl = videoResult.output[0];
          console.log(
            "✅ LTX V2 video completed with URL (output array):",
            videoUrl,
          );
        } else {
          console.error("❌ LTX V2 video generation did not complete properly");
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          throw new Error("LTX V2 video generation did not complete in time");
        }
      } else if (
        selectedModel.includes("veo3") &&
        !selectedModel.includes("veo3.1")
      ) {
        // Veo3 flow - queue-based polling
        console.log(
          "🎬 Veo3 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        // Poll for completion using FAL queue status
        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          // 6 minutes max
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            if (
              status?.status === "COMPLETED" ||
              status?.status === "completed"
            ) {
              // Get the result
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] Veo3 marked as completed in queue");
              }
              break;
            }
            if (status?.status === "FAILED" || status?.status === "failed") {
              throw new Error("Veo3 video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (isNetworkError) {
              console.warn(
                `[queue] Veo3 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] Veo3 - Error (${attempts + 1}/360):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`Veo3: Too many network errors. ${errorMsg}`);
            }
            if (attempts === 359)
              throw new Error(`Veo3: Timeout after 360 attempts. ${errorMsg}`);
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Veo3 video completed with URL:", videoUrl);
        } else {
          console.error("❌ Veo3 video generation did not complete properly");
          throw new Error("Veo3 video generation did not complete in time");
        }
      } else if (selectedModel.includes("sora2")) {
        // Sora 2 flow - queue-based polling (same as Veo3/Veo 3.1)
        console.log(
          "🎬 Sora 2 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        // Poll for completion using FAL queue status
        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          // 6 minutes max
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            if (
              status?.status === "COMPLETED" ||
              status?.status === "completed"
            ) {
              // Get the result
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 15000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] Sora2 marked as completed in queue");
              }
              break;
            }
            if (status?.status === "FAILED" || status?.status === "failed") {
              throw new Error("Sora 2 video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (isNetworkError) {
              console.warn(
                `[queue] Sora2 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] Sora2 - Error (${attempts + 1}/360):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`Sora2: Too many network errors. ${errorMsg}`);
            }
            if (attempts === 359)
              throw new Error(`Sora2: Timeout after 360 attempts. ${errorMsg}`);
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Sora 2 video completed with URL:", videoUrl);
        } else {
          console.error("❌ Sora 2 video generation did not complete properly");
          throw new Error("Sora 2 video generation did not complete in time");
        }
      } else if (
        selectedModel === "kling-2.6-pro" ||
        selectedModel.startsWith("kling-v3")
      ) {
        // Kling 2.6 Pro / Kling 3 flow - queue-based polling (FAL)
        console.log(
          "🎬 Kling FAL video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        // Poll for completion using FAL queue status
        let videoResult: any;
        for (let attempts = 0; attempts < 360; attempts++) {
          // 6 minutes max
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
            });
            const status = statusRes.data?.data || statusRes.data;
            const s = String(status?.status || "").toLowerCase();

            if (s === "completed" || s === "success" || s === "succeeded") {
              // Get the result
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
              });
              videoResult = resultRes.data?.data || resultRes.data;
              break;
            }
            if (s === "failed" || s === "error") {
              throw new Error("Kling video generation failed");
            }
          } catch (statusError) {
            console.error("Status check failed:", statusError);
            if (attempts === 359) throw statusError;
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        // Parse Kling 2.6 Pro result: { video: { url } } format
        if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
          console.log(
            "✅ Kling 2.6 Pro video completed with URL (video.url):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log(
            "✅ Kling 2.6 Pro video completed with URL (videos[0].url):",
            videoUrl,
          );
        } else {
          console.error(
            "❌ Kling 2.6 Pro video generation did not complete properly",
          );
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          throw new Error(
            "Kling 2.6 Pro video generation did not complete in time",
          );
        }
      } else if (selectedModel.includes("wan-2.5")) {
        // WAN 2.5 flow - queue-based polling
        console.log(
          "🎬 WAN 2.5 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        // Poll for completion using Replicate queue status
        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const maxAttempts = 900; // 15 minutes max for WAN models (they can take longer)
        console.log(
          `🎬 Starting WAN 2.5 polling with ${maxAttempts} attempts (15 minutes max)`,
        );

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
          try {
            console.log(
              `🎬 WAN 2.5 polling attempt ${attempts + 1}/${maxAttempts}`,
            );
            console.log(
              `🎬 Checking status for requestId: ${result.requestId}`,
            );
            const statusRes = await api.get("/api/replicate/queue/status", {
              params: { requestId: result.requestId },
              timeout: 20000,
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            console.log(`🎬 WAN 2.5 status check result:`, status);
            // Normalize status for robust comparisons
            const statusValue = String(status?.status || "").toLowerCase();
            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              console.log(
                "✅ WAN 2.5 generation completed, fetching result...",
              );
              // Get the result
              const resultRes = await api.get("/api/replicate/queue/result", {
                params: { requestId: result.requestId },
                timeout: 20000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log("✅ WAN 2.5 result fetched:", videoResult);
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] WAN 2.5 marked as completed in queue");
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              console.error(
                "❌ WAN 2.5 generation failed with status:",
                status,
              );
              throw new Error("WAN 2.5 video generation failed");
            }

            // Handle other possible statuses
            if (statusValue === "processing" || statusValue === "pending") {
              console.log(
                `🎬 WAN 2.5 status: ${status.status} - continuing to poll...`,
              );
            } else if (statusValue) {
              console.log(
                `🎬 WAN 2.5 unknown status: ${status.status} - continuing to poll...`,
              );
            } else {
              console.log(
                "🎬 WAN 2.5 no status returned - continuing to poll...",
              );
            }

            // Log progress every 30 seconds
            if (attempts % 30 === 0 && attempts > 0) {
              console.log(
                `🎬 WAN 2.5 still processing... (${Math.floor(attempts / 60)} minutes elapsed)`,
              );

              // Fallback: Check if video is available in history after 2 minutes
              if (attempts >= 120 && result.historyId) {
                try {
                  console.log(
                    `🎬 Fallback: Checking history entry for completed video...`,
                  );
                  const historyRes = await api.get(
                    `/api/generations/${result.historyId}`,
                    {
                      timeout: 20000,
                    },
                  );
                  const historyData = historyRes.data?.data || historyRes.data;

                  if (
                    historyData?.videos &&
                    Array.isArray(historyData.videos) &&
                    historyData.videos.length > 0
                  ) {
                    const completedVideo = historyData.videos.find(
                      (v: any) => v.status === "completed" || v.url,
                    );
                    if (completedVideo?.url) {
                      console.log(
                        "✅ WAN 2.5 video found in history:",
                        completedVideo,
                      );
                      videoResult = { videos: [completedVideo] };
                      break;
                    }
                  }
                } catch (historyError) {
                  console.log(
                    "🎬 Fallback history check failed:",
                    historyError,
                  );
                }
              }
            }
          } catch (statusError: any) {
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            // Log less frequently for long-polling (every 10 attempts)
            if (attempts % 10 === 0 || isNetworkError) {
              if (isNetworkError) {
                console.warn(
                  `[queue] WAN 2.5 - Network error (${attempts + 1}/${maxAttempts}, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                  errorMsg,
                );
              } else {
                console.error(
                  `[queue] WAN 2.5 - Error (${attempts + 1}/${maxAttempts}):`,
                  errorMsg,
                );
              }
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`WAN 2.5: Too many network errors. ${errorMsg}`);
            }
            if (attempts === maxAttempts - 1) {
              throw new Error(
                `WAN 2.5: Timeout after ${maxAttempts} attempts. ${errorMsg}`,
              );
            }
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ WAN 2.5 video completed with URL:", videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          // Fallback: check for single video object
          videoUrl = videoResult.video.url;
          console.log(
            "✅ WAN 2.5 video completed with URL (fallback):",
            videoUrl,
          );
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          // Replicate-like payload where 'output' is a direct URL
          videoUrl = videoResult.output;
          console.log(
            "✅ WAN 2.5 video completed with URL (output string):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          // Replicate-like payload where 'output' is an array of URLs
          videoUrl = videoResult.output[0];
          console.log(
            "✅ WAN 2.5 video completed with URL (output array):",
            videoUrl,
          );
        } else {
          console.error(
            "❌ WAN 2.5 video generation did not complete properly",
          );
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          console.error("❌ Expected videos array or video object with URL");
          throw new Error("WAN 2.5 video generation did not complete in time");
        }
      } else if (selectedModel === "wan-2.2-animate-replace") {
        // WAN 2.2 Animate Replace flow - queue-based polling (same as WAN 2.5)
        console.log(
          "🎬 WAN 2.2 Animate Replace video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        // Poll for completion using Replicate queue status
        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const maxAttempts = 900; // 15 minutes max for WAN models
        console.log(
          `🎬 Starting WAN 2.2 Animate Replace polling with ${maxAttempts} attempts (15 minutes max)`,
        );

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
          try {
            console.log(
              `🎬 WAN 2.2 Animate Replace polling attempt ${attempts + 1}/${maxAttempts}`,
            );
            console.log(
              `🎬 Checking status for requestId: ${result.requestId}`,
            );
            const statusRes = await api.get("/api/replicate/queue/status", {
              params: { requestId: result.requestId },
              timeout: 20000,
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            console.log(
              `🎬 WAN 2.2 Animate Replace status check result:`,
              status,
            );
            // Normalize status for robust comparisons
            const statusValue = String(status?.status || "").toLowerCase();
            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              console.log(
                "✅ WAN 2.2 Animate Replace generation completed, fetching result...",
              );
              // Get the result
              const resultRes = await api.get("/api/replicate/queue/result", {
                params: { requestId: result.requestId },
                timeout: 20000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log(
                "✅ WAN 2.2 Animate Replace result fetched:",
                videoResult,
              );
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] WAN 2.2 marked as completed in queue");
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              console.error(
                "❌ WAN 2.2 Animate Replace generation failed with status:",
                status,
              );
              throw new Error(
                "WAN 2.2 Animate Replace video generation failed",
              );
            }

            // Handle other possible statuses
            if (statusValue === "processing" || statusValue === "pending") {
              console.log(
                `🎬 WAN 2.2 Animate Replace status: ${status.status} - continuing to poll...`,
              );
            } else if (statusValue) {
              console.log(
                `🎬 WAN 2.2 Animate Replace unknown status: ${status.status} - continuing to poll...`,
              );
            } else {
              console.log(
                "🎬 WAN 2.2 Animate Replace no status returned - continuing to poll...",
              );
            }

            // Log progress every 30 seconds
            if (attempts % 30 === 0 && attempts > 0) {
              console.log(
                `🎬 WAN 2.2 Animate Replace still processing... (${Math.floor(attempts / 60)} minutes elapsed)`,
              );

              // Fallback: Check if video is available in history after 2 minutes
              if (attempts >= 120 && result.historyId) {
                try {
                  console.log(
                    `🎬 Fallback: Checking history entry for completed video...`,
                  );
                  const historyRes = await api.get(
                    `/api/generations/${result.historyId}`,
                    {
                      timeout: 20000,
                    },
                  );
                  const historyData = historyRes.data?.data || historyRes.data;

                  if (
                    historyData?.videos &&
                    Array.isArray(historyData.videos) &&
                    historyData.videos.length > 0
                  ) {
                    const completedVideo = historyData.videos.find(
                      (v: any) => v.status === "completed" || v.url,
                    );
                    if (completedVideo?.url) {
                      console.log(
                        "✅ WAN 2.2 Animate Replace video found in history:",
                        completedVideo,
                      );
                      videoResult = { videos: [completedVideo] };
                      break;
                    }
                  }
                } catch (historyError) {
                  console.log(
                    "🎬 Fallback history check failed:",
                    historyError,
                  );
                }
              }
            }
          } catch (statusError) {
            console.error(
              "❌ WAN 2.2 Animate Replace status check failed:",
              statusError,
            );
            if (attempts === maxAttempts - 1) {
              console.error(
                "❌ WAN 2.2 Animate Replace polling exhausted all attempts",
              );
              throw statusError;
            }
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log(
            "✅ WAN 2.2 Animate Replace video completed with URL:",
            videoUrl,
          );
        } else if (videoResult?.video && videoResult.video?.url) {
          // Fallback: check for single video object
          videoUrl = videoResult.video.url;
          console.log(
            "✅ WAN 2.2 Animate Replace video completed with URL (fallback):",
            videoUrl,
          );
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          // Replicate-like payload where 'output' is a direct URL
          videoUrl = videoResult.output;
          console.log(
            "✅ WAN 2.2 Animate Replace video completed with URL (output string):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          // Replicate-like payload where 'output' is an array of URLs
          videoUrl = videoResult.output[0];
          console.log(
            "✅ WAN 2.2 Animate Replace video completed with URL (output array):",
            videoUrl,
          );
        } else {
          console.error(
            "❌ WAN 2.2 Animate Replace video generation did not complete properly",
          );
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          console.error("❌ Expected videos array or video object with URL");
          throw new Error(
            "WAN 2.2 Animate Replace video generation did not complete in time",
          );
        }
      } else if (
        selectedModel.startsWith("kling-") &&
        selectedModel !== "kling-2.6-pro" &&
        !selectedModel.startsWith("kling-v3")
      ) {
        // Kling flow - queue-based polling via replicate queue endpoints (excludes Kling 2.6 Pro which uses FAL)
        console.log(
          "🎬 Kling video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        const maxAttemptsK = 900; // up to 15 minutes
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < maxAttemptsK; attempts++) {
          try {
            const statusRes = await api.get("/api/replicate/queue/status", {
              params: { requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || "").toLowerCase();
            consecutiveErrors = 0;

            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              const resultRes = await api.get("/api/replicate/queue/result", {
                params: { requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] Kling marked as completed in queue");
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              throw new Error("Kling video generation failed");
            }
          } catch (e: any) {
            consecutiveErrors++;
            const errorMsg = e?.message || String(e);
            const isNetwork =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");
            if (isNetwork) {
              console.warn(
                `[queue] Kling - Network error (${attempts + 1}/${maxAttemptsK}, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] Kling - Error (${attempts + 1}/${maxAttemptsK}):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`Kling: Too many network errors. ${errorMsg}`);
            }
            if (attempts === maxAttemptsK - 1)
              throw new Error(
                `Kling: Timeout after ${maxAttemptsK} attempts. ${errorMsg}`,
              );
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Kling video completed with URL:", videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          videoUrl = videoResult.video.url;
          console.log(
            "✅ Kling video completed with URL (fallback):",
            videoUrl,
          );
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          videoUrl = videoResult.output;
          console.log(
            "✅ Kling video completed with URL (output string):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          videoUrl = videoResult.output[0];
          console.log(
            "✅ Kling video completed with URL (output array):",
            videoUrl,
          );
        } else {
          console.error("❌ Kling video generation did not complete properly");
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          throw new Error("Kling video generation did not complete in time");
        }
      } else if (isSeedance2TextModel(selectedModel)) {
        console.log(
          "🎬 Seedance 2.0 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;

        for (let attempts = 0; attempts < 360; attempts++) {
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            consecutiveErrors = 0;

            const statusValue = String(status?.status || "").toLowerCase();
            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log(
                  "[queue] Seedance 2.0 marked as completed in queue",
                );
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              throw new Error("Seedance 2.0 video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (isNetworkError) {
              console.warn(
                `[queue] Seedance 2.0 - Network error (${attempts + 1}/360, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] Seedance 2.0 - Error (${attempts + 1}/360):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(
                `Seedance 2.0: Too many network errors. ${errorMsg}`,
              );
            }
            if (attempts === 359) {
              throw new Error(
                `Seedance 2.0: Timeout after 360 attempts. ${errorMsg}`,
              );
            }
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Seedance 2.0 video completed with URL:", videoUrl);
        } else if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
          console.log(
            "✅ Seedance 2.0 video completed with URL (video.url):",
            videoUrl,
          );
        } else {
          console.error(
            "❌ Seedance 2.0 video generation did not complete properly",
          );
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          throw new Error(
            "Seedance 2.0 video generation did not complete in time",
          );
        }
      } else if (
        selectedModel.includes("seedance") &&
        !isSeedance2TextModel(selectedModel)
      ) {
        // Seedance flow - queue-based polling via replicate queue endpoints (same as WAN/Kling)
        console.log(
          "🎬 Seedance video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const maxAttemptsSeedance = 900; // up to 15 minutes (same as WAN/Kling)
        console.log(
          `🎬 Starting Seedance polling with ${maxAttemptsSeedance} attempts (15 minutes max)`,
        );

        for (let attempts = 0; attempts < maxAttemptsSeedance; attempts++) {
          try {
            console.log(
              `🎬 Seedance polling attempt ${attempts + 1}/${maxAttemptsSeedance}`,
            );
            console.log(
              `🎬 Checking status for requestId: ${result.requestId}`,
            );
            const statusRes = await api.get("/api/replicate/queue/status", {
              params: { requestId: result.requestId },
              timeout: 1200000,
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || "").toLowerCase();
            consecutiveErrors = 0;

            console.log(`🎬 Seedance status check result:`, status);
            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              console.log(
                "✅ Seedance generation completed, fetching result...",
              );
              // Get the result
              const resultRes = await api.get("/api/replicate/queue/result", {
                params: { requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log("✅ Seedance result fetched:", videoResult);
              // CRITICAL: Update queue status immediately to mark as completed
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] Seedance marked as completed in queue");
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              console.error(
                "❌ Seedance generation failed with status:",
                status,
              );
              throw new Error("Seedance video generation failed");
            }

            // Log progress every 30 seconds
            if (attempts % 30 === 0 && attempts > 0) {
              console.log(
                `🎬 Seedance still processing... (${Math.floor(attempts / 60)} minutes elapsed)`,
              );
            }
          } catch (statusError: any) {
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (attempts % 10 === 0 || isNetworkError) {
              if (isNetworkError) {
                console.warn(
                  `[queue] Seedance - Network error (${attempts + 1}/${maxAttemptsSeedance}, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                  errorMsg,
                );
              } else {
                console.error(
                  `[queue] Seedance - Error (${attempts + 1}/${maxAttemptsSeedance}):`,
                  errorMsg,
                );
              }
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`Seedance: Too many network errors. ${errorMsg}`);
            }
            if (attempts === maxAttemptsSeedance - 1)
              throw new Error(
                `Seedance: Timeout after ${maxAttemptsSeedance} attempts. ${errorMsg}`,
              );
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ Seedance video completed with URL:", videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          videoUrl = videoResult.video.url;
          console.log(
            "✅ Seedance video completed with URL (fallback):",
            videoUrl,
          );
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          videoUrl = videoResult.output;
          console.log(
            "✅ Seedance video completed with URL (output string):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          videoUrl = videoResult.output[0];
          console.log(
            "✅ Seedance video completed with URL (output array):",
            videoUrl,
          );
        } else {
          console.error(
            "❌ Seedance video generation did not complete properly",
          );
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          throw new Error("Seedance video generation did not complete in time");
        }
      } else if (
        selectedModel === PIXVERSE_V6_T2V_MODEL ||
        selectedModel === PIXVERSE_V6_I2V_MODEL
      ) {
        console.log(
          "🎬 PixVerse V6 (FAL) video generation started, request ID:",
          result.requestId,
        );
        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const maxAttemptsPixverseV6 = 900;

        for (let attempts = 0; attempts < maxAttemptsPixverseV6; attempts++) {
          try {
            const statusRes = await api.get("/api/fal/queue/status", {
              params: { model: result.model, requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            const s = String(status?.status || "").toLowerCase();
            consecutiveErrors = 0;

            if (s === "completed" || s === "success" || s === "succeeded") {
              const resultRes = await api.get("/api/fal/queue/result", {
                params: { model: result.model, requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
              }
              break;
            }
            if (s === "failed" || s === "error") {
              throw new Error("PixVerse V6 video generation failed");
            }
          } catch (statusError: any) {
            const terminalMessage = getTerminalFalErrorMessage(statusError);
            if (terminalMessage) {
              throw new Error(terminalMessage);
            }
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (isNetworkError) {
              console.warn(
                `[queue] PixVerse V6 - Network error (${attempts + 1}/${maxAttemptsPixverseV6}, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                errorMsg,
              );
            } else {
              console.error(
                `[queue] PixVerse V6 - Error (${attempts + 1}/${maxAttemptsPixverseV6}):`,
                errorMsg,
              );
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(
                `PixVerse V6: Too many network errors. ${errorMsg}`,
              );
            }
            if (attempts === maxAttemptsPixverseV6 - 1) {
              throw new Error(
                `PixVerse V6: Timeout after ${maxAttemptsPixverseV6} attempts. ${errorMsg}`,
              );
            }
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
        } else if (videoResult?.video?.url) {
          videoUrl = videoResult.video.url;
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          videoUrl = videoResult.output;
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          videoUrl = videoResult.output[0];
        } else {
          throw new Error("PixVerse V6 video generation did not complete in time");
        }
      } else if (
        selectedModel === PIXVERSE_V5_T2V_MODEL ||
        selectedModel === PIXVERSE_V5_I2V_MODEL
      ) {
        // PixVerse V5 — Replicate queue
        console.log(
          "🎬 PixVerse V5 video generation started, request ID:",
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const maxAttemptsPixverse = 900;
        console.log(
          `🎬 Starting PixVerse V5 polling with ${maxAttemptsPixverse} attempts (15 minutes max)`,
        );

        for (let attempts = 0; attempts < maxAttemptsPixverse; attempts++) {
          try {
            console.log(
              `🎬 PixVerse V5 polling attempt ${attempts + 1}/${maxAttemptsPixverse}`,
            );
            console.log(
              `🎬 Checking status for requestId: ${result.requestId}`,
            );
            const statusRes = await api.get("/api/replicate/queue/status", {
              params: { requestId: result.requestId },
              timeout: 1200000,
            });
            console.log(`🎬 Raw status response:`, statusRes.data);
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || "").toLowerCase();
            consecutiveErrors = 0;

            console.log(`🎬 PixVerse V5 status check result:`, status);
            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              console.log(
                "✅ PixVerse V5 generation completed, fetching result...",
              );
              const resultRes = await api.get("/api/replicate/queue/result", {
                params: { requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              console.log("✅ PixVerse V5 result fetched:", videoResult);
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: {
                      status: "completed",
                      historyId: result.historyId,
                    },
                  }),
                );
                console.log("[queue] PixVerse V5 marked as completed in queue");
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              console.error(
                "❌ PixVerse V5 generation failed with status:",
                status,
              );
              throw new Error("PixVerse V5 video generation failed");
            }

            if (attempts % 30 === 0 && attempts > 0) {
              console.log(
                `🎬 PixVerse V5 still processing... (${Math.floor(attempts / 60)} minutes elapsed)`,
              );
            }
          } catch (statusError: any) {
            consecutiveErrors++;
            const errorMsg = statusError?.message || String(statusError);
            const isNetworkError =
              errorMsg.includes("timeout") ||
              errorMsg.includes("ECONNREFUSED") ||
              errorMsg.includes("ENOTFOUND");

            if (attempts % 10 === 0 || isNetworkError) {
              if (isNetworkError) {
                console.warn(
                  `[queue] PixVerse V5 - Network error (${attempts + 1}/${maxAttemptsPixverse}, ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`,
                  errorMsg,
                );
              } else {
                console.error(
                  `[queue] PixVerse V5 - Error (${attempts + 1}/${maxAttemptsPixverse}):`,
                  errorMsg,
                );
              }
            }

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              throw new Error(`PixVerse V5: Too many network errors. ${errorMsg}`);
            }
            if (attempts === maxAttemptsPixverse - 1)
              throw new Error(
                `PixVerse V5: Timeout after ${maxAttemptsPixverse} attempts. ${errorMsg}`,
              );
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log("✅ PixVerse V5 video completed with URL:", videoUrl);
        } else if (videoResult?.video && videoResult.video?.url) {
          videoUrl = videoResult.video.url;
          console.log(
            "✅ PixVerse V5 video completed with URL (fallback):",
            videoUrl,
          );
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          videoUrl = videoResult.output;
          console.log(
            "✅ PixVerse V5 video completed with URL (output string):",
            videoUrl,
          );
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          videoUrl = videoResult.output[0];
          console.log(
            "✅ PixVerse V5 video completed with URL (output array):",
            videoUrl,
          );
        } else {
          console.error(
            "❌ PixVerse V5 video generation did not complete properly",
          );
          console.error(
            "❌ Video result structure:",
            JSON.stringify(videoResult, null, 2),
          );
          throw new Error("PixVerse V5 video generation did not complete in time");
        }
      } else if (
        selectedModel.startsWith("ltx-2.3-fast") ||
        selectedModel.startsWith("ltx-2.3-pro")
      ) {
        const buildReplicateErrorDisplay = (providerResult: any): string => {
          const err =
            providerResult?.error?.message ??
            providerResult?.error ??
            providerResult?.errors ??
            providerResult?.detail ??
            providerResult?.message ??
            providerResult;
          const errorObj =
            typeof err === "string"
              ? { message: err }
              : err && typeof err === "object"
                ? err
                : { message: String(err) };
          return `Failed to generate video: ${JSON.stringify({ type: "error", error: errorObj })}`;
        };

        // LTX 2.3 Fast/Pro flow - queue-based polling via replicate queue endpoints
        const ltxTierLabel = selectedModel.startsWith("ltx-2.3-pro")
          ? "Pro"
          : "Fast";
        console.log(
          `🎬 LTX 2.3 ${ltxTierLabel} video generation started, request ID:`,
          result.requestId,
        );
        console.log("🎬 Model:", result.model);
        console.log("🎬 History ID:", result.historyId);

        let videoResult: any;
        let consecutiveErrors = 0;
        const MAX_CONSECUTIVE_ERRORS = 5;
        const maxAttemptsLTX = 900; // up to 15 minutes
        console.log(
          `🎬 Starting LTX 2.3 ${ltxTierLabel} polling with ${maxAttemptsLTX} attempts`,
        );

        for (let attempts = 0; attempts < maxAttemptsLTX; attempts++) {
          try {
            const statusRes = await api.get("/api/replicate/queue/status", {
              params: { requestId: result.requestId },
              timeout: 1200000,
            });
            const status = statusRes.data?.data || statusRes.data;
            const statusValue = String(status?.status || "").toLowerCase();
            consecutiveErrors = 0;

            if (
              statusValue === "completed" ||
              statusValue === "success" ||
              statusValue === "succeeded"
            ) {
              const resultRes = await api.get("/api/replicate/queue/result", {
                params: { requestId: result.requestId },
                timeout: 1200000,
              });
              videoResult = resultRes.data?.data || resultRes.data;
              // Replicate can return a terminal error payload even when a poll endpoint
              // reports a completed-ish state. Detect and surface that error immediately.
              if (
                videoResult &&
                (videoResult?.status === "failed" ||
                  videoResult?.status === "canceled" ||
                  videoResult?.status === "cancelled" ||
                  videoResult?.status === "error" ||
                  videoResult?.error)
              ) {
                const display = buildReplicateErrorDisplay(videoResult);
                if (generationId) {
                  dispatch(
                    updateActiveGeneration({
                      id: generationId,
                      updates: { status: "failed", error: display },
                    }),
                  );
                }
                dispatch(addNotification({ type: "error", message: display }));
                // Terminal error: stop polling immediately
                consecutiveErrors = MAX_CONSECUTIVE_ERRORS;
                throw new Error(display);
              }
              break;
            }
            if (statusValue === "failed" || statusValue === "error") {
              // Fetch the provider result to extract the exact error message
              let providerResult: any = null;
              try {
                const resultRes = await api.get("/api/replicate/queue/result", {
                  params: { requestId: result.requestId },
                  timeout: 1200000,
                });
                providerResult = resultRes.data?.data || resultRes.data;
              } catch {}
              const display = buildReplicateErrorDisplay(providerResult || status);
              if (generationId) {
                dispatch(
                  updateActiveGeneration({
                    id: generationId,
                    updates: { status: "failed", error: display },
                  }),
                );
              }
              dispatch(addNotification({ type: "error", message: display }));
              // Terminal error: stop polling immediately
              consecutiveErrors = MAX_CONSECUTIVE_ERRORS;
              throw new Error(display);
            }
          } catch (e: any) {
            consecutiveErrors++;
            // Terminal failure should not be retried.
            // (We set consecutiveErrors to MAX_CONSECUTIVE_ERRORS before throwing for those.)
            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) throw e;
          }
          await new Promise((res) => setTimeout(res, 1000));
        }

        if (
          videoResult?.videos &&
          Array.isArray(videoResult.videos) &&
          videoResult.videos[0]?.url
        ) {
          videoUrl = videoResult.videos[0].url;
          console.log(
            `✅ LTX 2.3 ${ltxTierLabel} video completed with URL:`,
            videoUrl,
          );
        } else if (videoResult?.video && videoResult.video?.url) {
          videoUrl = videoResult.video.url;
        } else if (
          typeof videoResult?.output === "string" &&
          videoResult.output.startsWith("http")
        ) {
          videoUrl = videoResult.output;
        } else if (
          Array.isArray(videoResult?.output) &&
          videoResult.output[0] &&
          typeof videoResult.output[0] === "string"
        ) {
          videoUrl = videoResult.output[0];
        } else {
          console.error(
            `❌ LTX 2.3 ${ltxTierLabel} video generation did not complete properly`,
          );
          throw new Error(
            `LTX 2.3 ${ltxTierLabel} video generation did not complete in time`,
          );
        }

        // Mark as completed only after we have a usable URL.
        if (generationId) {
          dispatch(
            updateActiveGeneration({
              id: generationId,
              updates: {
                status: "completed",
                historyId: result.historyId,
              },
            }),
          );
        }
      } else if (apiEndpoint === "/api/runway/video") {
        // Runway video completion (only when using Runway endpoint)
        console.log(
          "🎬 Runway video generation started, task ID:",
          result.taskId,
        );
        console.log(
          "🎬 Using Runway status checking for model:",
          selectedModel,
        );
        const videoResult = await waitForRunwayVideoCompletion(result.taskId);

        if (
          videoResult.status === "SUCCEEDED" &&
          videoResult.output &&
          videoResult.output.length > 0
        ) {
          videoUrl = videoResult.output[0];
          console.log("✅ Runway video completed, URL:", videoUrl);
        } else if (videoResult.status === "FAILED") {
          console.error("❌ Runway video generation failed:", videoResult);
          throw new Error("Video generation failed");
        } else {
          console.error("❌ Unexpected Runway status:", videoResult);
          throw new Error("Unexpected video generation status");
        }
      } else {
        // Non-Runway providers (FAL/Replicate/MiniMax) handle completion via backend/history.
        // If backend returned an immediate URL within result, prefer it.
        try {
          const maybeUrl =
            result?.video?.url ||
            (Array.isArray(result?.videos) && result.videos[0]?.url) ||
            result?.output ||
            result?.url;
          if (typeof maybeUrl === "string" && maybeUrl.startsWith("http")) {
            videoUrl = maybeUrl;
            console.log(
              "✅ Non-Runway provider returned video URL immediately:",
              videoUrl,
            );
          } else {
            console.log(
              "ℹ️ Non-Runway provider; awaiting history refresh for final URL",
            );
          }
        } catch {}
      }

      // Handle video data from backend response
      let firebaseVideo;

      // Check if we have video data from MiniMax response (prefer this over videoUrl)
      if ((window as any).miniMaxVideoData) {
        const videoData = (window as any).miniMaxVideoData;
        console.log("🎬 Using video data from backend response:", videoData);

        firebaseVideo = {
          id: videoData.id,
          url: videoData.url, // This is the Zata URL
          firebaseUrl: videoData.url, // Same as URL since it's already in our storage
          originalUrl: videoData.originalUrl,
        };

        console.log("✅ Video data processed from backend:", firebaseVideo);

        // Clean up the temporary storage
        delete (window as any).miniMaxVideoData;
      } else if (videoUrl) {
        // Fallback: We have a video URL but no structured data
        console.log("🎬 Using fallback video URL processing...");
        const videoToUpload = {
          id: Date.now().toString(),
          url: videoUrl,
          originalUrl: videoUrl,
        };

        // IMPORTANT: Avoid browser-side fetch of third-party URL (CORS).
        // If URL already points to our storage (returned from backend with history_id), use it directly.
        const isOurStorage =
          /zata\.ai\//i.test(videoUrl) ||
          /firebasestorage\.googleapis\.com/i.test(videoUrl);
        try {
          if (isOurStorage) {
            firebaseVideo = {
              id: videoToUpload.id,
              url: videoUrl,
              firebaseUrl: videoUrl,
              originalUrl: videoUrl,
            };
          } else {
            // Fallback to client upload utility (may CORS-fail; we catch and keep provider URL)
            firebaseVideo = await uploadGeneratedVideo(videoToUpload);
          }
          console.log("✅ Video processed via fallback:", firebaseVideo);
        } catch (uploadError) {
          console.error("❌ Video upload to Firebase failed:", uploadError);
          // Continue with original URL if Firebase upload fails
          firebaseVideo = {
            id: videoToUpload.id,
            url: videoUrl,
            firebaseUrl: videoUrl,
            originalUrl: videoUrl,
          };
        }
      } else {
        // No videoUrl - video generation succeeded but file retrieval failed
        // The video should already be stored in the database by the backend
        console.log(
          "✅ Video generation completed. Video should be available in database.",
        );
        firebaseVideo = {
          id: result.taskId || Date.now().toString(),
          url: "", // Will be populated from database
          firebaseUrl: "", // Will be populated from database
          originalUrl: "", // Will be populated from database
        };
      }

      // Backend handles all history updates - no frontend Redux update needed
      console.log("🎬 Video generation completed successfully");
      console.log("🎬 History ID:", result.historyId);
      console.log("🎬 Model:", selectedModel);
      console.log("🎬 Video data processed:", firebaseVideo);

      // Update queue with completed video
      if (generationId) {
        // Try to fetch the full entry from backend to get storagePath
        let storagePath = (firebaseVideo as any)?.storagePath;
        if (result.historyId && !storagePath) {
          try {
            const entryRes = await api.get(
              `/api/generations/${result.historyId}`,
            );
            const entry =
              entryRes?.data?.data?.item ||
              entryRes?.data?.item ||
              entryRes?.data?.data ||
              entryRes?.data;
            if (
              entry?.videos &&
              Array.isArray(entry.videos) &&
              entry.videos[0]?.storagePath
            ) {
              storagePath = entry.videos[0].storagePath;
              console.log(
                "[queue] Fetched storagePath from backend:",
                storagePath,
              );
            }
          } catch (e) {
            console.warn("[queue] Failed to fetch entry for storagePath:", e);
          }
        }

        // Extract storagePath from Zata URL if not available
        if (!storagePath && firebaseVideo?.url) {
          const zataMatch = firebaseVideo.url.match(/devstoragev1\/(.+)$/i);
          if (zataMatch) {
            storagePath = zataMatch[1];
            console.log("[queue] Extracted storagePath from URL:", storagePath);
          }
        }

        const videoArray = firebaseVideo?.url
          ? [
              {
                id: firebaseVideo.id || generationId,
                url: firebaseVideo.url,
                originalUrl: firebaseVideo.originalUrl || firebaseVideo.url,
                firebaseUrl: firebaseVideo.firebaseUrl || firebaseVideo.url,
                ...(storagePath ? { storagePath } : {}),
              },
            ]
          : [];
        console.log(
          "[queue] Video generation completed, updating active generation:",
          {
            generationId,
            historyId: result.historyId,
            videoCount: videoArray.length,
            hasStoragePath: !!storagePath,
          },
        );
        dispatch(
          updateActiveGeneration({
            id: generationId,
            updates: {
              status: "completed",
              videos: videoArray,
              historyId: result.historyId,
            },
          }),
        );
      }

      // Update local preview to completed with a thumbnail frame if available
      try {
        const previewImageUrl =
          firebaseVideo?.url || firebaseVideo?.firebaseUrl || "";
        setLocalVideoPreview((prev) =>
          prev
            ? ({
                ...prev,
                status: "completed",
                images: [
                  {
                    id: "video-thumb",
                    url: previewImageUrl,
                    originalUrl: previewImageUrl,
                  },
                ] as any,
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              } as any)
            : prev,
        );
      } catch {}

      // Confirm credit transaction as successful (skip for WAN 2.2 Animate Replace)
      if (transactionId) {
        await handleGenerationSuccess(transactionId);
        console.log("✅ Credits confirmed for successful generation");
      }

      // Clear all inputs and configurations
      clearInputs();

      // Refresh only the single completed generation instead of reloading all
      if (result.historyId) {
        await refreshSingleGeneration(result.historyId);
      } else {
        // Fallback to full refresh if no historyId
        const fallbackFilters: any = { mode: "video" };
        dispatch(clearFilters());
        dispatch(setFilters(fallbackFilters));
        dispatch(
          loadHistory({
            filters: fallbackFilters as any,
            backendFilters: fallbackFilters as any,
            paginationParams: { limit: 20 },
            requestOrigin: "page",
            expectedType: "video",
            debugTag: `InputBox:refresh:video-mode:${Date.now()}`,
          } as any),
        );
      }

      // Also refresh the extra video entries to ensure text-to-video entries appear
      setTimeout(async () => {
        try {
          const [
            textToVideo,
            imageToVideoHyphen,
            imageToVideoUnderscore,
            videoToVideoHyphen,
            videoToVideoUnderscore,
          ] = await Promise.all([
            getHistoryEntries(
              { generationType: "text-to-video" as any },
              { limit: 20 },
            ),
            getHistoryEntries(
              { generationType: "image-to-video" as any },
              { limit: 20 },
            ),
            getHistoryEntries(
              { generationType: "image_to_video" as any },
              { limit: 20 },
            ),
            getHistoryEntries(
              { generationType: "video-to-video" as any },
              { limit: 20 },
            ),
            getHistoryEntries(
              { generationType: "video_to_video" as any },
              { limit: 20 },
            ),
          ]);

          const allResults = [
            ...(textToVideo.data || []),
            ...(imageToVideoHyphen.data || []),
            ...(imageToVideoUnderscore.data || []),
            ...(videoToVideoHyphen.data || []),
            ...(videoToVideoUnderscore.data || []),
          ];

          const byId: Record<string, any> = {};
          allResults.forEach((entry: any) => {
            byId[entry.id] = entry;
          });

          const combined = Object.values(byId);
          const sortedCombined = combined.sort((a: any, b: any) => {
            const timestampA = new Date(
              a.timestamp || a.createdAt || 0,
            ).getTime();
            const timestampB = new Date(
              b.timestamp || b.createdAt || 0,
            ).getTime();
            return timestampB - timestampA;
          });

          setExtraVideoEntries(sortedCombined);
          console.log(
            "[VideoPage] refreshed extra video entries after generation:",
            sortedCombined.length,
          );
        } catch (e) {
          console.error(
            "[VideoPage] failed to refresh extra video entries:",
            e,
          );
        }
      }, 1000); // Small delay to ensure backend has updated

      try {
        const toast = (await import("react-hot-toast")).default;
        toast.success("Video generated successfully!");
      } catch {}
    } catch (error: any) {
      console.error("❌ Video generation failed:", error);

      // Extract structured error info if available
      const terminalMessage = getTerminalFalErrorMessage(error);
      let errorMessage =
        terminalMessage ||
        (error instanceof Error ? error.message : "Video generation failed");
      let errorTitle = "Generation Failed";
      let errorCode: string | undefined;

      // Handle Axios/Backend API errors
      if (!terminalMessage && error?.response?.data) {
        const apiData = error.response.data;
        if (apiData.message) errorMessage = apiData.message;
        if (apiData.data?.title) errorTitle = apiData.data.title;
        if (apiData.data?.code) errorCode = apiData.data.code;
      } else if (!terminalMessage && error?.message) {
        // Fallback if no response data
        errorMessage = error.message;
      }

      // Distinguish User Credit Errors
      if (errorMessage.toLowerCase().includes("insufficient credits")) {
        errorTitle = "Insufficient Credits";
      }

      setError(errorMessage);
      setLocalVideoPreview((prev) =>
        prev ? ({ ...prev, status: "failed" } as any) : prev,
      );

      // Stop and remove the queue item on failure.
      stopActiveGeneration(generationId, errorMessage);

      const failedHistoryId =
        failedHistoryIdForRefresh ||
        error?.response?.data?.data?.historyId ||
        error?.response?.data?.historyId;
      if (failedHistoryId) {
        try {
          await refreshSingleGeneration(String(failedHistoryId));
        } catch (refreshError) {
          console.error(
            "[VideoPage] Failed to refresh failed generation after error:",
            refreshError,
          );
        }
      }

      // Handle credit transaction failure (skip for WAN 2.2 Animate Replace)
      if (transactionId) {
        try {
          await handleGenerationFailure(transactionId);
          console.log("✅ Credits rolled back for failed generation");
        } catch (creditError) {
          console.error("❌ Failed to rollback credits:", creditError);
        }
      }

      try {
        const toast = (await import("react-hot-toast")).default;

        // Custom error toast
        toast.error(
          <div className="flex flex-col gap-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{errorTitle}</span>
              {errorCode && (
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-white/50 font-mono">
                  {errorCode}
                </span>
              )}
            </div>
            <p className="text-sm text-white/80 leading-snug">{errorMessage}</p>
          </div>,
          {
            duration: 6000,
            style: {
              background:
                "linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.15) 100%)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: "12px",
              padding: "12px 16px",
              backdropFilter: "blur(10px)",
              maxWidth: "400px",
            },
          } as any,
        );
      } catch {}
    } finally {
      setIsGenerating(false);
    }
  };

  const newLocal =
    "pointer-events-none absolute top-full left-1/2 z-[80] mt-1 -translate-x-1/2 rounded-md bg-black/90 px-2 py-1 text-[10px] whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100";
  /** Multi-angle: strong blue (primary). Audio on: softer accent so only multi-angle reads as “selected”. */
  const pixverseV6ToggleActive =
    "bg-[#2F6BFF]/50 text-white ring-2 ring-[#6B9FFF] shadow-[0_0_20px_rgba(47,107,255,0.5)]";
  const pixverseV6ToggleAudioActive =
    "bg-white/[0.12] text-white ring-1 ring-[#4d7ee8]/80 shadow-[0_0_12px_rgba(47,107,255,0.22)]";
  const pixverseV6ToggleInactive =
    "bg-black/35 text-white/35 ring-1 ring-white/18 hover:bg-white/[0.1] hover:text-white/90 hover:ring-white/35";
  const isLtx23Model =
    selectedModel.includes("ltx-2.3-fast") ||
    selectedModel.includes("ltx-2.3-pro");
  const isLtx23ProModel = selectedModel.includes("ltx-2.3-pro");
  const isLtx2Model = selectedModel.includes("ltx2");
  const shouldUseHorizontalParamScroll = isLtx2Model || isLtx23Model;
  // (Removed duplicate hook declaration; initial load handled earlier)

  // Note: applySearch and live search logic are now handled by HistoryControls component

  const modelDropdownResolution = (() => {
    const resolutionForCredits =
      selectedModel.includes("veo3") || selectedModel.includes("sora2")
        ? selectedQuality
        : creditsResolution;
    return resolutionForCredits
      ? String(resolutionForCredits).toLowerCase()
      : undefined;
  })();

  const familyVariantOptions = isSeedanceFamilyModel(selectedModel)
    ? SEEDANCE_VARIANT_OPTIONS
    : isVeo31FamilyModel(selectedModel)
      ? VEO_31_VARIANT_OPTIONS
      : isKlingFamilyModel(selectedModel)
        ? KLING_VARIANT_OPTIONS
        : isHailuoFamilyModel(selectedModel)
          ? HAILUO_VARIANT_OPTIONS
          : isSoraFamilyModel(selectedModel)
            ? SORA_VARIANT_OPTIONS
            : isLtxFamilyModel(selectedModel)
              ? LTX_VARIANT_OPTIONS
              : isWanFamilyModel(selectedModel)
                ? WAN_VARIANT_OPTIONS
                : isPixverseFamilyModel(selectedModel)
                  ? PIXVERSE_VARIANT_OPTIONS.filter((o) =>
                      generationMode === "image_to_video"
                        ? o.value === PIXVERSE_V6_T2V_MODEL ||
                          o.value === PIXVERSE_V5_I2V_MODEL
                        : o.value !== PIXVERSE_V5_I2V_MODEL &&
                          o.value !== PIXVERSE_V6_I2V_MODEL,
                    )
                  : isHappyHorseFamilyModel(selectedModel)
                    ? HAPPY_HORSE_VARIANT_OPTIONS
      : [];

  const selectedFamilyVariant = familyVariantOptions.some(
    (option) => option.value === selectedModel,
  )
    ? selectedModel
    : familyVariantOptions[0]?.value || "";

  const handleFamilyVariantChange = (variant: string) => {
    handleModelChange(variant);
  };

  const renderFamilyVariantDropdown = () => {
    if (!shouldShowSecondaryFamilySelector(selectedModel)) return null;

    const sharedProps = {
      options: familyVariantOptions,
      selectedValue: selectedFamilyVariant,
      onChange: handleFamilyVariantChange,
      onCloseOtherDropdowns: () => {
        setCloseModelsDropdown(true);
        setCloseFrameSizeDropdown(true);
        setCloseDurationDropdown(true);
        setCloseCameraMotionDropdown(true);
        setTimeout(() => {
          setCloseModelsDropdown(false);
          setCloseFrameSizeDropdown(false);
          setCloseDurationDropdown(false);
          setCloseCameraMotionDropdown(false);
        }, 100);
      },
    };

    if (isVeo31FamilyModel(selectedModel)) {
      return <VeoFamilyVariantDropdown {...sharedProps} />;
    }

    if (isKlingFamilyModel(selectedModel)) {
      return <KlingFamilyVariantDropdown {...sharedProps} />;
    }

    if (isHailuoFamilyModel(selectedModel)) {
      return <HailuoFamilyVariantDropdown {...sharedProps} />;
    }

    if (isSoraFamilyModel(selectedModel)) {
      return <SoraFamilyVariantDropdown {...sharedProps} />;
    }

    if (isLtxFamilyModel(selectedModel)) {
      return <LtxFamilyVariantDropdown {...sharedProps} />;
    }

    if (isWanFamilyModel(selectedModel)) {
      return <WanFamilyVariantDropdown {...sharedProps} />;
    }

    if (isPixverseFamilyModel(selectedModel)) {
      return <PixverseFamilyVariantDropdown {...sharedProps} />;
    }

    if (isHappyHorseFamilyModel(selectedModel)) {
      return <KlingFamilyVariantDropdown {...sharedProps} />;
    }

    if (isSeedanceFamilyModel(selectedModel)) {
      return <SeedanceFamilyVariantDropdown {...sharedProps} />;
    }

    return null;
  };

  const renderMobileAudioControls = () => (
    <>
      {(selectedModel === "kling-2.6-pro" ||
        selectedModel.startsWith("kling-v3") ||
        isSeedance2FamilyModel(selectedModel) ||
        selectedModel.includes("seedance-1.5") ||
        (selectedModel.includes("sora2") &&
          !selectedModel.includes("v2v")) ||
        selectedModel.includes("ltx2") ||
        selectedModel.includes("ltx-2.3-fast") ||
        selectedModel.includes("ltx-2.3-pro") ||
        (selectedModel.includes("veo3.1") &&
          !selectedModel.includes("veo3.1-lite") &&
          !(
            activeFeature === "Lipsync" &&
            selectedModel.includes("veo3.1")
          )) ||
        (selectedModel.includes("veo3") &&
          !selectedModel.includes("veo3.1"))) && (
        <button
          onClick={() => setGenerateAudio((v) => !v)}
          className={`group md:h-[32px] h-[28px] md:w-[32px] w-[28px] rounded-lg flex items-center justify-center ring-1 ring-white/20 transition-all relative flex-shrink-0 ${
            generateAudio
              ? "bg-transparent text-white "
              : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
          }`}
        >
          <div className="relative">
            {generateAudio ? (
              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
            )}
            <div className={newLocal}>
              {generateAudio ? "Audio: On" : "Audio: Off"}
            </div>
          </div>
        </button>
      )}
      {selectedModel.includes("wan-2.5") &&
        selectedModel !== "wan-2.2-animate-replace" &&
        !selectedModel.includes("wan-2.2") && (
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
              {uploadedAudio ? "Uploaded" : "Audio"}
            </label>
            {uploadedAudio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadedAudio("");
                  toast.success("Audio file removed");
                }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-xs"
                title="Remove audio"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}
    </>
  );

  const renderMobileParameterControls = () => {
    const closeModelAndDuration = () => {
      setCloseModelsDropdown(true);
      setTimeout(() => setCloseModelsDropdown(false), 0);
      setCloseDurationDropdown(true);
      setTimeout(() => setCloseDurationDropdown(false), 0);
    };

    const closeModelAndFrame = () => {
      setCloseModelsDropdown(true);
      setTimeout(() => setCloseModelsDropdown(false), 0);
      setCloseFrameSizeDropdown(true);
      setTimeout(() => setCloseFrameSizeDropdown(false), 0);
    };

    const closeModelFrameAndDuration = () => {
      setCloseModelsDropdown(true);
      setCloseFrameSizeDropdown(true);
      setCloseDurationDropdown(true);
      setTimeout(() => {
        setCloseModelsDropdown(false);
        setCloseFrameSizeDropdown(false);
        setCloseDurationDropdown(false);
      }, 100);
    };

    if (
      selectedModel === "T2V-01-Director" ||
      selectedModel === "I2V-01-Director" ||
      selectedModel === "S2V-01"
    ) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <div className="h-[28px] px-2 rounded-lg text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
            <TvMinimalPlay className="w-3 h-3" />
            720P
          </div>
          <div className="h-[28px] px-2 rounded-lg text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            6s
          </div>
        </div>
      );
    }

    if (selectedModel.includes("sora2") && !selectedModel.includes("v2v")) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <VideoFrameSizeDropdown
            selectedFrameSize={frameSize}
            onFrameSizeChange={setFrameSize}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndDuration}
            onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
          />
          <ResolutionDropdown
            selectedModel={selectedModel}
            selectedResolution={selectedQuality}
            onResolutionChange={setSelectedQuality}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (selectedModel.includes("ltx2")) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          {generationMode === "image_to_video" ? (
            <VideoFrameSizeDropdown
              selectedFrameSize={frameSize}
              onFrameSizeChange={setFrameSize}
              selectedModel={selectedModel}
              generationMode={generationMode}
              onCloseOtherDropdowns={closeModelAndDuration}
              onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
            />
          ) : (
            <div className="h-[28px] px-2 rounded-lg text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
              16:9
            </div>
          )}
          <ResolutionDropdown
            selectedModel={selectedModel}
            selectedResolution={selectedResolution.toLowerCase?.() || "1080p"}
            onResolutionChange={setSelectedResolution as any}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (
      selectedModel.includes("ltx-2.3-fast") ||
      selectedModel.includes("ltx-2.3-pro")
    ) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <VideoFrameSizeDropdown
            selectedFrameSize={frameSize}
            onFrameSizeChange={handleFrameSizeChange}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelFrameAndDuration}
            onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
          />
          <ResolutionDropdown
            selectedModel={selectedModel}
            selectedResolution={selectedResolution.toLowerCase?.() || "1080p"}
            onResolutionChange={setSelectedResolution as any}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelFrameAndDuration}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
          <CameraMotionDropdown
            selectedMotion={selectedCameraMovements[0] || "none"}
            onMotionChange={(motion) => setSelectedCameraMovements([motion])}
            onCloseOtherDropdowns={closeModelFrameAndDuration}
            onCloseThisDropdown={closeCameraMotionDropdown}
          />
        </div>
      );
    }

    if (selectedModel.includes("veo3.1")) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <VideoFrameSizeDropdown
            selectedFrameSize={frameSize}
            onFrameSizeChange={setFrameSize}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndDuration}
            onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
          />
          <ResolutionDropdown
            selectedModel={selectedModel}
            selectedResolution={selectedQuality}
            onResolutionChange={setSelectedQuality}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (selectedModel.includes("veo3") && !selectedModel.includes("veo3.1")) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <VideoFrameSizeDropdown
            selectedFrameSize={frameSize}
            onFrameSizeChange={setFrameSize}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndDuration}
            onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
          />
          <ResolutionDropdown
            selectedModel={selectedModel}
            selectedResolution={selectedQuality}
            onResolutionChange={setSelectedQuality}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (selectedModel.startsWith("kling-")) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <VideoFrameSizeDropdown
            selectedFrameSize={frameSize}
            onFrameSizeChange={setFrameSize}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndDuration}
            onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (
      selectedModel.includes("wan-2.5") &&
      selectedModel !== "wan-2.2-animate-replace" &&
      !selectedModel.includes("wan-2.2")
    ) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <VideoFrameSizeDropdown
            selectedFrameSize={frameSize}
            onFrameSizeChange={setFrameSize}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndDuration}
            onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (selectedModel.includes("seedance")) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          {(generationMode === "text_to_video" ||
            isSeedance2FamilyModel(selectedModel)) && (
            <VideoFrameSizeDropdown
              selectedFrameSize={frameSize}
              onFrameSizeChange={handleFrameSizeChange}
              selectedModel={selectedModel}
              generationMode={generationMode}
              onCloseOtherDropdowns={closeModelAndDuration}
              onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
            />
          )}
          <QualityDropdown
            selectedModel={selectedModel}
            selectedQuality={seedanceResolution}
            onQualityChange={setSeedanceResolution}
            onCloseOtherDropdowns={closeModelFrameAndDuration}
            onCloseThisDropdown={undefined}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (selectedModel.includes("MiniMax")) {
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
          <VideoFrameSizeDropdown
            selectedFrameSize={selectedResolution}
            onFrameSizeChange={setSelectedResolution}
            selectedModel={selectedModel}
            generationMode={generationMode}
            miniMaxDuration={selectedMiniMaxDuration}
            onCloseOtherDropdowns={closeModelAndDuration}
            onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
          />
          <VideoDurationDropdown
            selectedDuration={selectedMiniMaxDuration}
            onDurationChange={(value) => {
              if (typeof value === "number") {
                setSelectedMiniMaxDuration(value);
              }
            }}
            selectedModel={selectedModel}
            generationMode={generationMode}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
        </div>
      );
    }

    if (selectedModel.includes("pixverse")) {
      const closePixverseOthers = () => {
        setCloseModelsDropdown(true);
        setTimeout(() => setCloseModelsDropdown(false), 0);
        setCloseFrameSizeDropdown(true);
        setTimeout(() => setCloseFrameSizeDropdown(false), 0);
        setCloseDurationDropdown(true);
        setTimeout(() => setCloseDurationDropdown(false), 0);
      };
      return (
        <div className="flex min-w-max flex-nowrap items-center gap-x-1 pr-1">
          {!hidePixverseV6AspectRatio && (
            <VideoFrameSizeDropdown
              selectedFrameSize={frameSize}
              onFrameSizeChange={setFrameSize}
              selectedModel={selectedModel}
              generationMode={generationMode}
              onCloseOtherDropdowns={closeModelAndDuration}
              onCloseThisDropdown={closeFrameSizeDropdown ? () => {} : undefined}
            />
          )}
          <QualityDropdown
            selectedModel={selectedModel}
            selectedQuality={pixverseQuality}
            onQualityChange={setPixverseQuality}
            onCloseOtherDropdowns={closePixverseOthers}
            onCloseThisDropdown={undefined}
          />
          <VideoDurationDropdown
            selectedDuration={duration}
            onDurationChange={setDuration}
            selectedModel={selectedModel}
            generationMode={generationMode}
            hasFirstFrame={pixverseV6HasFirstFrameImage}
            onCloseOtherDropdowns={closeModelAndFrame}
            onCloseThisDropdown={closeDurationDropdown ? () => {} : undefined}
          />
          {(selectedModel === PIXVERSE_V6_T2V_MODEL ||
            selectedModel === PIXVERSE_V6_I2V_MODEL) && (
            <>
              <PortalHoverTooltip
                wrapperClassName="shrink-0"
                content={
                  pixverseV6GenerateAudio
                    ? "Audio on: BGM, SFX, and dialogue"
                    : "Audio off: no generated soundtrack"
                }
              >
                <button
                  type="button"
                  aria-label="Toggle generated audio"
                  aria-pressed={pixverseV6GenerateAudio}
                  onClick={() => setPixverseV6GenerateAudio((v) => !v)}
                  className={`md:h-[32px] h-[28px] md:w-[32px] w-[28px] rounded-lg flex items-center justify-center transition-all duration-150 ${
                    pixverseV6GenerateAudio
                      ? pixverseV6ToggleAudioActive
                      : pixverseV6ToggleInactive
                  }`}
                >
                  {pixverseV6GenerateAudio ? (
                    <Volume2 className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  ) : (
                    <VolumeX className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                  )}
                </button>
              </PortalHoverTooltip>
              <PortalHoverTooltip
                wrapperClassName="shrink-0"
                content={`Multishot: ${pixverseV6MultiClip ? "on" : "off"}\nMulti-angle clips: camera moves and cuts between shots`}
              >
                <button
                  type="button"
                  aria-label="Multi-angle dynamic clips"
                  aria-pressed={pixverseV6MultiClip}
                  onClick={() => setPixverseV6MultiClip((v) => !v)}
                  className={`md:h-[32px] h-[28px] md:w-[32px] w-[28px] rounded-lg flex items-center justify-center transition-all duration-150 ${
                    pixverseV6MultiClip
                      ? pixverseV6ToggleActive
                      : pixverseV6ToggleInactive
                  }`}
                >
                  <Scan
                    className={`h-4 w-4 shrink-0 ${
                      pixverseV6MultiClip ? "text-white" : "opacity-80"
                    }`}
                    strokeWidth={pixverseV6MultiClip ? 2.35 : 1.85}
                  />
                </button>
              </PortalHoverTooltip>
              <PixverseV6StyleDropdown
                value={pixverseV6Style}
                onChange={setPixverseV6Style}
                onCloseOtherDropdowns={closePixverseOthers}
              />
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <React.Fragment>
      {/* Active Generations Queue Panel */}
      <ActiveGenerationsPanel />

      {authLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-white/70 text-sm">Loading your workspace...</div>
        </div>
      ) : user && activeFeature !== "Edit" ? (
        <HistorySection
          loading={loading}
          hasCompletedInitialHistoryLoad={hasCompletedInitialHistoryLoad}
          showHistory={showHistory}
          historyEntries={historyEntriesForDisplay as any[]}
          hasMore={hasMore}
          loadMore={loadMore}
          onDeleteVideo={handleDeleteVideo}
          onVideoClick={handleVideoClick}
          activeGenerations={activeGenerations}
          onSearch={onSearchChange}
          onSortChange={onSortOrderChange}
          onDateChange={onDateRangeChange}
        />
      ) : user ? (
        <VideoGenerationGuide />
      ) : (
        <VideoGenerationGuide />
      )}

      {/* Main Input Box with a sticky tabs row above it */}
      <div className="fixed left-1/2 z-[50] h-auto max-md:py-1 md:max-h-[min(100dvh-12px,calc(100vh-16px))] w-[92%] max-w-[92%] -translate-x-1/2 bottom-2 max-md:overscroll-y-contain overflow-y-auto overflow-x-hidden overscroll-x-none touch-pan-y md:bottom-6 md:max-h-none md:w-[90%] md:max-w-[900px] md:overflow-visible md:py-0">
        {/* Mobile: show uploaded previews OUTSIDE the input box (like Image 2). */}
        {(() => {
          const displayImages =
            selectedModel === SEEDANCE_2_MODEL
              ? uploadedImages.slice(0, 2)
              : selectedModel.includes("veo3.1") ||
                  selectedModel === "kling-o1" ||
                  (selectedModel.includes("seedance") &&
                    !selectedModel.includes("pro-fast") &&
                    !selectedModel.includes("i2v"))
                ? uploadedImages.slice(0, 2)
                : uploadedImages;

          const extraLastFrame =
            !!lastFrameImage &&
            (selectedModel.includes("veo3.1") ||
              selectedModel === "kling-o1" ||
              selectedModel.startsWith("ltx-2.3-fast") ||
              selectedModel.startsWith("ltx-2.3-pro") ||
              (selectedModel.includes("seedance") &&
                !selectedModel.includes("pro-fast") &&
                !selectedModel.includes("i2v")) ||
              (selectedModel === "MiniMax-Hailuo-02" &&
                ["768P", "1080P"].includes(selectedResolution) &&
                currentModelCapabilities.supportsImageToVideo));

          const hasAnything =
            displayImages.length > 0 ||
            extraLastFrame ||
            !!uploadedVideo ||
            !!uploadedCharacterImage;

          if (!hasAnything) return null;

          return (
            <div className="md:hidden mb-0">
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 pt-2">
                {displayImages.map((image, index) => (
                  <div key={`img-${index}`} className="relative shrink-0">
                    <button
                      type="button"
                      className="w-12 h-12 rounded-lg overflow-hidden ring-1 ring-white/20 bg-white/5"
                      onClick={() => {
                        setAssetViewer({
                          isOpen: true,
                          assetUrl: image,
                          assetType: "image",
                          title: `Uploaded Image ${index + 1}`,
                        });
                      }}
                    >
                      <img
                        src={image}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="absolute -top-1 -left-1 w-4 h-4 rounded bg-black/80 ring-1 ring-white/20 text-[10px] leading-none flex items-center justify-center text-white">
                      {index + 1}
                    </div>
                    <button
                      aria-label="Remove image"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-none flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedImages((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {extraLastFrame && (
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/20 bg-white/5"
                      onClick={() => {
                        setAssetViewer({
                          isOpen: true,
                          assetUrl: lastFrameImage,
                          assetType: "image",
                          title: "Last Frame Image",
                        });
                      }}
                    >
                      <img
                        src={lastFrameImage}
                        alt="Last Frame"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="absolute -top-1 -left-1 w-4 h-4 rounded bg-black/80 ring-1 ring-white/20 text-[10px] leading-none flex items-center justify-center text-white">
                      {displayImages.length + 1}
                    </div>
                    <button
                      aria-label="Remove last frame"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-none flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLastFrameImage("");
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {(() => {
                  const isSeedanceRef = isSeedance2ReferenceModel(selectedModel);
                  const videos =
                    isSeedanceRef && uploadedVideos && uploadedVideos.length > 0
                      ? uploadedVideos.slice(0, 3)
                      : uploadedVideo
                        ? [uploadedVideo]
                        : [];
                  if (!videos.length) return null;

                  return videos.map((v, idx) => (
                    <div key={`${v}-${idx}`} className="relative shrink-0">
                      <button
                        type="button"
                        className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/20 bg-white/5"
                        onClick={() => {
                          setAssetViewer({
                            isOpen: true,
                            assetUrl: v,
                            assetType: "video",
                            title: isSeedanceRef
                              ? `Reference Video ${idx + 1}`
                              : "Uploaded Video",
                          });
                        }}
                      >
                        <video
                          src={
                            v.startsWith("blob:") || v.startsWith("data:")
                              ? v
                              : toFrontendProxyMediaUrl(v)
                          }
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      </button>
                      {isSeedanceRef && (
                        <div className="absolute -top-1 -left-1 w-4 h-4 rounded bg-black/80 ring-1 ring-white/20 text-[10px] leading-none flex items-center justify-center text-white">
                          {idx + 1}
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-6 h-6 rounded-full bg-black/55 ring-1 ring-white/20 flex items-center justify-center">
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="text-white/90 translate-x-[1px]"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <button
                        aria-label="Remove video"
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-none flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSeedanceRef) {
                            setUploadedVideos((prev) => {
                              const next = (prev || []).filter((_, i) => i !== idx);
                              const first = next[0] || "";
                              setUploadedVideo(first);
                              return next;
                            });
                          } else {
                            setUploadedVideo("");
                          }
                          setSourceHistoryEntryId("");
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ));
                })()}

                {uploadedCharacterImage && (
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      className="w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/20 bg-white/5"
                      onClick={() => {
                        setAssetViewer({
                          isOpen: true,
                          assetUrl: uploadedCharacterImage,
                          assetType: "image",
                          title: "Character Image",
                        });
                      }}
                    >
                      <img
                        src={uploadedCharacterImage}
                        alt="Character"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <button
                      aria-label="Remove character image"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] leading-none flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedCharacterImage("");
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Toggle buttons removed - model selection determines input requirements */}
        <div
          className={`relative isolate w-full rounded-lg md:rounded-b-lg backdrop-blur-3xl ring-1 shadow-2xl px-1 pt-1 md:p-3 md:pb-3 pb-0 max-md:space-y-3 md:space-y-4 transition-all duration-300 overflow-x-hidden md:overflow-x-visible overflow-y-visible ${
            isInputBoxHovered
              ? "bg-black/40 ring-white/30 shadow-2xl md:scale-[1.01]"
              : "bg-black/20 ring-white/20 hover:ring-white/30 hover:shadow-2xl"
          }`}
          onMouseEnter={() => setIsInputBoxHovered(true)}
          onMouseLeave={() => setIsInputBoxHovered(false)}
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

            // 1. Handle Files (dragged from desktop/OS)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              const files = Array.from(e.dataTransfer.files);
              await processFiles(files);
              return;
            }

            // 2. Handle Dragged URLs (e.g. from History)
            const url =
              e.dataTransfer.getData("text/uri-list") ||
              e.dataTransfer.getData("text/plain");
            if (url) {
              // Check if Video
              if (
                url.match(/\.(mp4|webm|ogg|mov)$/i) ||
                url.startsWith("data:video/")
              ) {
                if (isSeedance2ReferenceModel(selectedModel)) {
                  setUploadedVideos((prev) => {
                    const existing = Array.isArray(prev) ? prev : [];
                    const next = [...existing, url].slice(0, 3);
                    setUploadedVideo(next[0] || "");
                    return next;
                  });
                } else {
                  setUploadedVideo(url);
                }
                toast.success("Video added from URL");
              }
              // Check if Image
              else if (
                url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) ||
                url.startsWith("data:image/")
              ) {
                const normalizedUrl = String(url || "").trim();
                if (isLocalImageUrl(normalizedUrl)) {
                  try {
                    const resp = await saveUpload({
                      url: normalizedUrl,
                      type: "image",
                    });
                    if (resp.responseStatus === "success" && resp.data?.url) {
                      setUploadedImages((prev) =>
                        [...prev, resp.data!.url].slice(0, 4),
                      );
                      toast.success("Image uploaded and added");
                    } else {
                      throw new Error(resp.message || "Failed to upload image");
                    }
                  } catch (error: any) {
                    toast.error(
                      error?.message ||
                        "Failed to upload image URL. Please try again.",
                    );
                  }
                } else {
                  setUploadedImages((prev) => [...prev, normalizedUrl].slice(0, 4));
                  toast.success("Image added from URL");
                }
              }
            }
          }}
        >
          {/* Outline Glow Effect - shows on hover or when typing */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 transition-opacity duration-700 blur-xl pointer-events-none rounded-lg"
            style={{
              opacity: prompt.trim() || isInputBoxHovered ? 0.2 : 0,
            }}
          ></div>
          {/* Input Row: prompt + actions */}
          <PromptInput
            prompt={prompt}
            onChange={setPrompt}
            onPasteFiles={processFiles}
            isEnhancing={isEnhancing}
            onEnhance={handleEnhancePrompt}
            onClear={() => {
              setPrompt("");
              if (inputEl.current) inputEl.current.focus();
            }}
            placeholder={placeholder}
            inputRef={inputEl as React.RefObject<HTMLTextAreaElement>}
            fixedHeightOnMobile
            actions={
              <InputActions
                generationMode={generationMode}
                selectedModel={selectedModel}
                activeFeature={activeFeature}
                currentModelCapabilities={currentModelCapabilities}
                selectedCameraMovements={selectedCameraMovements}
                setSelectedCameraMovements={setSelectedCameraMovements}
                onAddMovement={(text) =>
                  setPrompt(
                    (prev) => prev + (prev.endsWith(" ") ? "" : " ") + text,
                  )
                }
                references={references}
                removeReference={removeReference}
                setUploadModalType={setUploadModalType}
                setUploadModalTarget={setUploadModalTarget}
                setIsUploadModalOpen={setIsUploadModalOpen}
                uploadedImages={uploadedImages}
                lastFrameImage={lastFrameImage}
                selectedResolution={selectedResolution}
                canSwapFrames={canSwapFirstAndLastFrame}
                onSwapFrames={handleSwapFirstAndLastFrame}
              />
            }
          />

          {/* Uploaded Content Display */}
          <div className="">
            {/* Uploaded Images */}
            {(() => {
              const displayImages =
                selectedModel === SEEDANCE_2_MODEL
                  ? uploadedImages.slice(0, 2)
                  : selectedModel.includes("veo3.1") ||
                      selectedModel === "kling-o1" ||
                      (selectedModel.includes("seedance") &&
                        !selectedModel.includes("pro-fast") &&
                        !selectedModel.includes("i2v"))
                    ? uploadedImages.slice(0, 2)
                    : uploadedImages;
              const extraLastFrame =
                !!lastFrameImage &&
                (selectedModel.includes("veo3.1") ||
                  selectedModel === "kling-o1" ||
                  selectedModel.startsWith("ltx-2.3-fast") ||
                  selectedModel.startsWith("ltx-2.3-pro") ||
                  (selectedModel.includes("seedance") &&
                    !selectedModel.includes("pro-fast") &&
                    !selectedModel.includes("i2v")) ||
                  (selectedModel === "MiniMax-Hailuo-02" &&
                    ["768P", "1080P"].includes(selectedResolution) &&
                    currentModelCapabilities.supportsImageToVideo));
              return displayImages.length > 0 || extraLastFrame ? (
                <div className="md:mb-0 mb-0">
                  {/* Desktop: existing preview UI (unchanged). */}
                  <div className="hidden md:block">
                    <div className="text-xs text-white/60 mb-1">
                      Uploaded Images (
                      {displayImages.length + (extraLastFrame ? 1 : 0)})
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {displayImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div
                            className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                            onClick={() => {
                              setAssetViewer({
                                isOpen: true,
                                assetUrl: image,
                                assetType: "image",
                                title: `Uploaded Image ${index + 1}`,
                              });
                            }}
                          >
                            <img
                              src={image}
                              alt={`Uploaded ${index + 1}`}
                              className="w-full h-full object-cover"
                              onLoad={() =>
                                console.log(
                                  "Video generation - image loaded successfully:",
                                  image,
                                )
                              }
                              onError={(e) =>
                                console.error(
                                  "Video generation - image failed to load:",
                                  image,
                                  e,
                                )
                              }
                            />
                            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50">
                              {index === 0
                                ? selectedModel === SEEDANCE_2_MODEL
                                  ? displayImages.length > 1
                                    ? "First Frame"
                                    : "Input Image"
                                  : "First Frame"
                                : selectedModel === SEEDANCE_2_MODEL
                                  ? "Last Frame"
                                  : `Image ${index + 1}`}
                            </div>
                          </div>
                          <button
                            aria-label="Remove image"
                            className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            onClick={() => {
                              setUploadedImages((prev) =>
                                prev.filter((_, i) => i !== index),
                              );
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      {extraLastFrame && (
                        <div className="relative group">
                          <div
                            className="w-16 h-16 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                            onClick={() => {
                              setAssetViewer({
                                isOpen: true,
                                assetUrl: lastFrameImage,
                                assetType: "image",
                                title: "Last Frame Image",
                              });
                            }}
                          >
                            <img
                              src={lastFrameImage}
                              alt="Last Frame"
                              className="w-full h-full object-cover"
                            />
                            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50">
                              Last Frame
                            </div>
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
                </div>
              ) : null;
            })()}

            {/* Uploaded Video */}
            {(() => {
              const isSeedanceRef = isSeedance2ReferenceModel(selectedModel);
              const videos =
                isSeedanceRef && uploadedVideos && uploadedVideos.length > 0
                  ? uploadedVideos.slice(0, 3)
                  : uploadedVideo
                    ? [uploadedVideo]
                    : [];
              if (!videos.length) return null;

              return (
                <div className="hidden md:block md:mb-3 mb-0">
                  <div className="text-xs text-white/60 mb-2">
                    Uploaded Video
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {videos.map((v, idx) => {
                      const isBlob =
                        v.startsWith("blob:") || v.startsWith("data:");
                      const videoSrc = isBlob ? v : toFrontendProxyMediaUrl(v);
                      return (
                        <div key={`${v}-${idx}`} className="relative group w-fit">
                          <div
                            className="w-32 h-20 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer bg-white/5"
                            onClick={() => {
                              setAssetViewer({
                                isOpen: true,
                                assetUrl: v,
                                assetType: "video",
                                title: isSeedanceRef
                                  ? `Reference Video ${idx + 1}`
                                  : "Uploaded Video",
                              });
                            }}
                          >
                            <video
                              src={videoSrc}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              loop
                              preload="metadata"
                              onMouseEnter={(e) => {
                                const video = e.currentTarget;
                                video
                                  .play()
                                  .catch((err) =>
                                    console.error(
                                      "Video preview play failed:",
                                      err,
                                    ),
                                  );
                              }}
                              onMouseLeave={(e) => {
                                const video = e.currentTarget;
                                video.pause();
                                video.currentTime = 0;
                              }}
                            />
                          </div>

                          {/* Tooltip - Positioned outside overflow-hidden container */}
                          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-50">
                            {isSeedanceRef
                              ? `Reference Video ${idx + 1}`
                              : "Uploaded Video"}
                          </div>

                          {/* Delete Button - Positioned at corner */}
                          <button
                            aria-label="Remove video"
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-50 shadow-md hover:bg-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSeedanceRef) {
                                setUploadedVideos((prev) => {
                                  const next = (prev || []).filter(
                                    (_, i) => i !== idx,
                                  );
                                  setUploadedVideo(next[0] || "");
                                  return next;
                                });
                              } else {
                                setUploadedVideo("");
                              }
                              setSourceHistoryEntryId(""); // Clear source history entry when clearing video
                            }}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Uploaded Character Image (for WAN 2.2 Animate Replace) */}
            {uploadedCharacterImage && (
              <div className="mb-3">
                <div className="text-xs text-white/60 mb-2">
                  Character Image
                </div>
                <div className="relative group">
                  <div
                    className="w-32 h-32 rounded-lg overflow-hidden ring-1 ring-white/20 cursor-pointer"
                    onClick={() => {
                      setAssetViewer({
                        isOpen: true,
                        assetUrl: uploadedCharacterImage,
                        assetType: "image",
                        title: "Character Image",
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center md:gap-0">
            {/* Mobile: keep controls anchored and prevent sideways swipe. */}
            <div className="md:hidden sticky bottom-0 z-[25] px-0 pb-1 pt-2 bg-transparent border-white/10 rounded-b-lg overscroll-x-none overscroll-y-none touch-pan-y">
              {/* Mobile: model + family variant + generate */}
              <div className="relative z-[21] flex w-full min-w-0 shrink-0 items-center justify-between gap-1 px-1 py-0">
                <div className="flex min-h-[42px] min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none touch-pan-x no-scrollbar shrink -mb-4 ">
                  <div className="shrink-0 flex items-center">
                    <VideoModelsDropdown
                      selectedModel={selectedModel}
                      onModelChange={handleModelChange}
                      generationMode={generationMode}
                      selectedDuration={
                        selectedModel.includes("MiniMax")
                          ? `${selectedMiniMaxDuration}s`
                          : formatDurationForCreditLookup(duration)
                      }
                      selectedResolution={modelDropdownResolution}
                      pixverseV6GenerateAudio={pixverseV6GenerateAudio}
                      activeFeature={activeFeature}
                      onCloseOtherDropdowns={() => {
                        setCloseFrameSizeDropdown(true);
                        setCloseDurationDropdown(true);
                        setCloseCameraMotionDropdown(true);
                        setTimeout(() => {
                          setCloseFrameSizeDropdown(false);
                          setCloseDurationDropdown(false);
                          setCloseCameraMotionDropdown(false);
                        }, 100);
                      }}
                      onCloseThisDropdown={
                        closeModelsDropdown ? () => {} : undefined
                      }
                    />
                  </div>
                  {shouldShowSecondaryFamilySelector(selectedModel) ? (
                    <div className="shrink-0 flex items-center">
                      {renderFamilyVariantDropdown()}
                    </div>
                  ) : null}
                </div>

                {/* Mobile: generate button */}
                <div className="flex shrink-0 flex-col items-end gap-0.5 pl-1 pb-0 -mb-1.5">
                  <div className="text-white/80 text-[10px] leading-none mb-0">
                    Credits:{" "}
                    <span className="font-semibold">{liveCreditCost}</span>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={(() => {
                      const disabled =
                        runningGenerationsCount >= 4 ||
                        !prompt.trim() ||
                        (generationMode === "image_to_video" &&
                          selectedModel !== "S2V-01" &&
                          !selectedModel.includes("wan-2.5") &&
                          !selectedModel.startsWith("kling-") &&
                          selectedModel !== "gen4_turbo" &&
                          selectedModel !== "gen3a_turbo" &&
                          !selectedModel.includes("ltx-2.3-fast") &&
                          uploadedImages.length === 0) ||
                        (generationMode === "video_to_video" && !uploadedVideo) ||
                        (generationMode === "image_to_video" &&
                          selectedModel === "I2V-01-Director" &&
                          uploadedImages.length === 0) ||
                        (generationMode === "image_to_video" &&
                          selectedModel === "S2V-01" &&
                          references.length === 0) ||
                        (generationMode === "image_to_video" &&
                          selectedModel === "MiniMax-Hailuo-02" &&
                          selectedResolution === "512P" &&
                          uploadedImages.length === 0) ||
                        (generationMode === "image_to_video" &&
                          selectedModel.includes("wan-2.5") &&
                          uploadedImages.length === 0);
                      return disabled;
                    })()}
                    className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)]"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Mobile: parameters + audio — single row (scroll within row if needed). */}
              <div className="relative z-[20] flex w-full min-h-[46px] min-w-0 shrink-0 items-center overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none touch-pan-x no-scrollbar pb-0">
                <div className="flex w-max min-w-max flex-nowrap items-center gap-2 px-1 -mb-2.5">
                  <div className="flex flex-nowrap items-center gap-2">
                    {renderMobileParameterControls()}
                  </div>
                  <div className="flex flex-nowrap items-center gap-2">
                    {renderMobileAudioControls()}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop toolbar */}
            <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_auto] w-full flex-1 min-w-0 items-start gap-3 pb-0 pt-1.5">
              <div className="grid w-full min-w-0 grid-rows-[auto_auto] gap-0.5">
                <div className="flex w-full flex-wrap items-center gap-2 overflow-visible">
                  <div className="flex-shrink-0">
                    <VideoModelsDropdown
                      selectedModel={selectedModel}
                      onModelChange={handleModelChange}
                      generationMode={generationMode}
                      selectedDuration={
                        selectedModel.includes("MiniMax")
                          ? `${selectedMiniMaxDuration}s`
                          : formatDurationForCreditLookup(duration)
                      }
                      selectedResolution={modelDropdownResolution}
                      pixverseV6GenerateAudio={pixverseV6GenerateAudio}
                      activeFeature={activeFeature}
                      onCloseOtherDropdowns={() => {
                        setCloseFrameSizeDropdown(true);
                        setCloseDurationDropdown(true);
                        setCloseCameraMotionDropdown(true);
                        setTimeout(() => {
                          setCloseFrameSizeDropdown(false);
                          setCloseDurationDropdown(false);
                          setCloseCameraMotionDropdown(false);
                        }, 100);
                      }}
                      onCloseThisDropdown={
                        closeModelsDropdown ? () => {} : undefined
                      }
                    />
                  </div>
                  {shouldShowSecondaryFamilySelector(selectedModel) ? (
                    <div className="flex-shrink-0">{renderFamilyVariantDropdown()}</div>
                  ) : null}
                </div>

                <div className="relative z-[20] flex w-full min-w-0 flex-row gap-2 items-center overflow-visible">
                  <div
                  ref={desktopToolbarControlsRef}
                  onWheel={handleDesktopToolbarWheel}
                  onPointerDown={handleDesktopToolbarPointerDown}
                  onPointerMove={handleDesktopToolbarPointerMove}
                  onPointerUp={endDesktopToolbarDrag}
                  onPointerCancel={endDesktopToolbarDrag}
                  onPointerLeave={endDesktopToolbarDrag}
                  className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-none touch-pan-x py-1 pr-3 cursor-grab"
                >
                  {(() => {
                  // WAN 2.2 Animate Replace: Resolution, Refert Num, Go Fast, Merge Audio, FPS, Seed
                  // MUST BE FIRST CHECK to prevent other controls from showing
                  const isWanAnimateReplace =
                    selectedModel === "wan-2.2-animate-replace" ||
                    (activeFeature === "Animate" &&
                      selectedModel &&
                      (selectedModel.includes("wan-2.2") ||
                        selectedModel.includes("animate-replace")));

                if (isWanAnimateReplace) {
                  return (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max pl-0">
                        {/* Resolution Dropdown - 480 or 720 ONLY */}
                        <div className="relative">
                          <select
                            value={wanAnimateResolution}
                            onChange={(e) =>
                              setWanAnimateResolution(
                                e.target.value as "720" | "480",
                              )
                            }
                            className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors appearance-none cursor-pointer pr-8"
                          >
                            <option value="720">720p</option>
                            <option value="480">480p</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              className="text-white/60"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                        {/* Refert Num - 1 or 5 */}
                        <div className="relative">
                          <select
                            value={wanAnimateRefertNum}
                            onChange={(e) =>
                              setWanAnimateRefertNum(
                                Number(e.target.value) as 1 | 5,
                              )
                            }
                            className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors appearance-none cursor-pointer pr-8"
                          >
                            <option value="1">Ref Frames: 1</option>
                            <option value="5">Ref Frames: 5</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              className="text-white/60"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                        {/* Seed Input (Optional) */}
                        <div className="relative">
                          <input
                            type="number"
                            value={wanAnimateSeed || ""}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? undefined
                                  : parseInt(e.target.value, 10);
                              if (
                                val === undefined ||
                                (!isNaN(val) && Number.isInteger(val))
                              ) {
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
                            onChange={(e) =>
                              setWanAnimateGoFast(e.target.checked)
                            }
                            className="w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-2 focus:ring-white/50 cursor-pointer"
                          />
                          <span className="text-sm text-white/80">Go fast</span>
                          <span className="text-xs text-white/50">
                            (Default: true)
                          </span>
                        </label>
                        {/* Merge Audio Checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={wanAnimateMergeAudio}
                            onChange={(e) =>
                              setWanAnimateMergeAudio(e.target.checked)
                            }
                            className="w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-2 focus:ring-white/50 cursor-pointer"
                          />
                          <span className="text-sm text-white/80">
                            Merge audio
                          </span>
                          <span className="text-xs text-white/50">
                            (Default: true)
                          </span>
                        </label>
                      </div>
                      {/* FPS Input with Slider */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-white/80">
                            Frames per second:
                          </label>
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
                          <span className="text-xs text-white/50">
                            (min: 5, max: 60)
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={60}
                          value={wanAnimateFps}
                          onChange={(e) =>
                            setWanAnimateFps(parseInt(e.target.value, 10))
                          }
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                          style={{
                            background: `linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${((wanAnimateFps - 5) / (60 - 5)) * 100}%, rgba(255,255,255,0.1) ${((wanAnimateFps - 5) / (60 - 5)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                // Fixed Models: T2V-01, I2V-01, S2V-01 - No dropdowns, fixed 720P, 6s
                if (
                  selectedModel === "T2V-01-Director" ||
                  selectedModel === "I2V-01-Director" ||
                  selectedModel === "S2V-01"
                ) {
                  return (
                    <div className="flex flex-row gap-2">
                      {/* Fixed Resolution Display */}
                      <div className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                        <TvMinimalPlay className="w-4 h-4 mr-1" />
                        720P (Fixed)
                      </div>
                      {/* Fixed Duration Display */}
                      <div className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                        <Clock className="w-4 h-4 mr-1" />
                        6s (Fixed)
                      </div>
                    </div>
                  );
                }

                // Sora 2 Models: Full customization (check before Veo 3.1)
                if (
                  selectedModel.includes("sora2") &&
                  !selectedModel.includes("v2v")
                ) {
                  return (
                    <div className="flex flex-row gap-2 flex-wrap">
                      {/* Aspect Ratio - Always shown for Sora 2 models */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={handleFrameSizeChange}
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Resolution - Use unified ResolutionDropdown for Sora 2 */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          hasFirstFrame={hasVeo31LiteFirstFrame}
                          hasLastFrame={hasVeo31LiteLastFrame}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close frame size dropdown
                            setCloseFrameSizeDropdown(true);
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      {/* Audio toggle for Sora 2 */}
                      <button
                        onClick={() => setGenerateAudio((v) => !v)}
                        className={`group hidden md:flex h-[32px] w-[32px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                          generateAudio
                            ? "bg-transparent text-white "
                            : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                        }`}
                      >
                        <div className="relative">
                          {generateAudio ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )}
                          <div className={newLocal}>
                            {generateAudio ? "Audio: On" : "Audio: Off"}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // LTX V2 Models: Resolution + Duration (T2V fixed 16:9)
                if (selectedModel.includes("ltx2")) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
                      {/* Aspect Ratio - For I2V allow user selection; for T2V, fixed 16:9 */}
                      {generationMode === "image_to_video" ? (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={handleFrameSizeChange}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseDurationDropdown(true);
                            setTimeout(
                              () => setCloseDurationDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeFrameSizeDropdown ? () => {} : undefined
                          }
                        />
                      ) : (
                        <div className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          16:9 (Fixed)
                        </div>
                      )}
                      {/* Resolution - LTX V2 supports 1080p/1440p/2160p */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={
                          selectedResolution.toLowerCase?.() || "1080p"
                        }
                        onResolutionChange={setSelectedResolution as any}
                      />
                      {/* Duration - 6/8/10s */}
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {/* FPS selector for LTX V2 */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            /* simple toggle between 25 and 50 */ setFps(
                              (prev) => (prev === 25 ? 50 : 25),
                            );
                          }}
                          className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-transparent  text-white"
                        >
                          FPS: {fps}
                        </button>
                      </div>
                      {/* Audio toggle for LTX V2 */}
                      <button
                        onClick={() => setGenerateAudio((v) => !v)}
                        className={`group hidden md:flex md:h-[32px] h-[28px] md:w-[32px] w-[28px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                          generateAudio
                            ? "bg-transparent text-white "
                            : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                        }`}
                      >
                        <div className="relative">
                          {generateAudio ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )}
                          <div className={newLocal}>
                            {generateAudio ? "Audio: On" : "Audio: Off"}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // LTX 2.3 Fast / Pro Models: Resolution + Duration (T2V/I2V 1080p/2k/4k)
                if (
                  selectedModel.includes("ltx-2.3-fast") ||
                  selectedModel.includes("ltx-2.3-pro")
                ) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
                      {/* Aspect Ratio - Allow user selection for both T2V and I2V */}
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={handleFrameSizeChange}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setCloseDurationDropdown(true);
                          setCloseCameraMotionDropdown(true);
                          setTimeout(() => {
                            setCloseModelsDropdown(false);
                            setCloseDurationDropdown(false);
                            setCloseCameraMotionDropdown(false);
                          }, 100);
                        }}
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Resolution - LTX 2.3 Fast supports 1080p/2k/4k */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={
                          selectedResolution.toLowerCase?.() || "1080p"
                        }
                        onResolutionChange={setSelectedResolution as any}
                      />
                      {/* Duration - 2s to 20s (depending on cost calculation) */}
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setCloseFrameSizeDropdown(true);
                          setCloseCameraMotionDropdown(true);
                          setTimeout(() => {
                            setCloseModelsDropdown(false);
                            setCloseFrameSizeDropdown(false);
                            setCloseCameraMotionDropdown(false);
                          }, 100);
                        }}
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {/* Camera Motion selector for LTX 2.3 Fast */}
                      <CameraMotionDropdown
                        selectedMotion={selectedCameraMovements[0] || "none"}
                        onMotionChange={(motion) =>
                          setSelectedCameraMovements([motion])
                        }
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setCloseFrameSizeDropdown(true);
                          setCloseDurationDropdown(true);
                          setTimeout(() => {
                            setCloseModelsDropdown(false);
                            setCloseFrameSizeDropdown(false);
                            setCloseDurationDropdown(false);
                          }, 100);
                        }}
                        onCloseThisDropdown={closeCameraMotionDropdown}
                      />
                      {/* Audio toggle for LTX 2.3 Fast/Pro */}
                      <button
                        onClick={() => setGenerateAudio((v) => !v)}
                        className={`group hidden md:flex h-[32px] w-[32px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                          generateAudio
                            ? "bg-transparent text-white "
                            : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                        }`}
                      >
                        <div className="relative">
                          {generateAudio ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )}
                          <div className={newLocal}>
                            {generateAudio ? "Audio: On" : "Audio: Off"}
                          </div>
                        </div>
                      </button>
                      {/* LTX 2.3 Pro extra inputs: audio + video files */}
                      {selectedModel.startsWith("ltx-2.3-pro") && (
                        <div className="relative">
                          <input
                            type="file"
                            accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                            onChange={handleAudioUpload}
                            className="hidden"
                            id="audio-upload-ltx-pro"
                          />
                          <label
                            htmlFor="audio-upload-ltx-pro"
                            className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 b text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-2 transition-all"
                          >
                            <Music className="w-4 h-4" />
                            {uploadedAudio ? "Audio: Uploaded" : "Upload Audio"}
                          </label>
                        </div>
                      )}
                    </div>
                  );
                }

                if (selectedModel.startsWith("alibaba/happy-horse")) {
                  const isHappyHorseEditMode =
                    selectedModel === HAPPY_HORSE_EDIT_MODEL;
                  const isHappyHorseReferenceMode =
                    !isHappyHorseEditMode && references.length > 0;
                  const showAspectRatio = !isHappyHorseEditMode && !uploadedImages[0]
                    ? true
                    : isHappyHorseReferenceMode;
                  const showDuration = !isHappyHorseEditMode;
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
                      {showAspectRatio && (
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
                          onCloseThisDropdown={
                            closeFrameSizeDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {showDuration && (
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
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      {/* Seed and safety checker commented out per request */}
                      {isHappyHorseEditMode && (
                        <select
                          value={happyHorseAudioSetting}
                          onChange={(e) =>
                            setHappyHorseAudioSetting(
                              e.target.value as "default" | "auto" | "origin",
                            )
                          }
                          className="h-[32px] px-2 rounded-lg text-[12px] ring-1 ring-white/20 text-white/90 bg-transparent"
                        >
                          <option value="default" className="bg-black text-white">
                            default
                          </option>
                          <option value="auto" className="bg-black text-white">
                            auto
                          </option>
                          <option value="origin" className="bg-black text-white">
                            origin
                          </option>
                        </select>
                      )}
                    </div>
                  );
                }

                // Veo 3.1 Models: Full customization (check before Veo3)
                if (selectedModel.includes("veo3.1")) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Resolution - Veo 3.1 uses 720p/1080p */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          hasFirstFrame={hasVeo31LiteFirstFrame}
                          hasLastFrame={hasVeo31LiteLastFrame}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close frame size dropdown
                            setCloseFrameSizeDropdown(true);
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      {/* Audio toggle for Veo 3.1 - Hide in Lipsync feature */}
                      {!selectedModel.includes("veo3.1-lite") &&
                        !(
                          activeFeature === "Lipsync" &&
                          selectedModel.includes("veo3.1")
                        ) && (
                          <button
                            onClick={() => setGenerateAudio((v) => !v)}
                            className={`group hidden md:flex h-[32px] w-[32px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                              generateAudio
                                ? "bg-transparent text-white "
                                : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                            }`}
                          >
                            <div className="relative">
                              {generateAudio ? (
                                <Volume2 className="w-5 h-5" />
                              ) : (
                                <VolumeX className="w-5 h-5" />
                              )}
                              <div className={newLocal}>
                                {generateAudio ? "Audio: On" : "Audio: Off"}
                              </div>
                            </div>
                          </button>
                        )}
                    </div>
                  );
                }

                // Kling 2.6 Pro / Kling 3 Models: aspect ratio, duration, and audio
                if (
                  selectedModel === "kling-2.6-pro" ||
                  selectedModel.startsWith("kling-v3")
                ) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
                      {/* Aspect Ratio */}
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Duration */}
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {/* Audio toggle for Kling 2.6 Pro */}
                      <button
                        onClick={() => setGenerateAudio((v) => !v)}
                        className={`group hidden md:flex h-[32px] w-[32px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                          generateAudio
                            ? "bg-transparent text-white "
                            : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                        }`}
                      >
                        <div className="relative">
                          {generateAudio ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )}
                          <div className={newLocal}>
                            {generateAudio ? "Audio: On" : "Audio: Off"}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // Veo3 Models: Full customization (check after Veo 3.1)
                if (
                  selectedModel.includes("veo3") &&
                  !selectedModel.includes("veo3.1")
                ) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Resolution - Veo3 uses 720p/1080p */}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
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
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      {/* Audio toggle for Veo 3 */}
                      <button
                        onClick={() => setGenerateAudio((v) => !v)}
                        className={`group hidden md:flex h-[32px] w-[32px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                          generateAudio
                            ? "bg-transparent text-white "
                            : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                        }`}
                      >
                        <div className="relative">
                          {generateAudio ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )}
                          <div className={newLocal}>
                            {generateAudio ? "Audio: On" : "Audio: Off"}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                // Kling Models: Full customization
                if (selectedModel.startsWith("kling-")) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Mode - Only for Kling v2.1 base (standard/pro), not master variant */}
                      {selectedModel.includes("kling-v2.1") &&
                        !selectedModel.includes("master") && (
                          <KlingModeDropdown
                            value={klingMode}
                            onChange={setKlingMode}
                            onCloseOtherDropdowns={() => {
                              setCloseModelsDropdown(true);
                              setTimeout(
                                () => setCloseModelsDropdown(false),
                                0,
                              );
                              setCloseFrameSizeDropdown(true);
                              setTimeout(
                                () => setCloseFrameSizeDropdown(false),
                                0,
                              );
                              setCloseDurationDropdown(true);
                              setTimeout(
                                () => setCloseDurationDropdown(false),
                                0,
                              );
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
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                    </div>
                  );
                }

                // WAN 2.5 Models: Full customization (exclude wan-2.2-animate-replace)
                if (
                  selectedModel.includes("wan-2.5") &&
                  selectedModel !== "wan-2.2-animate-replace" &&
                  !selectedModel.includes("wan-2.2")
                ) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
                      {/* Aspect Ratio - Always shown for WAN models */}
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Duration - Always shown for WAN models */}
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
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
                          className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-2 transition-all"
                        >
                          <Music className="w-4 h-4" />
                          {uploadedAudio ? "Audio: Uploaded" : "Upload Audio"}
                        </label>
                        {uploadedAudio && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedAudio("");
                              toast.success("Audio file removed");
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
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max pl-0.25 -mb-0.5">
                      {/* Aspect Ratio - Seedance 2.0 supports this for both T2V and I2V */}
                      {(generationMode === "text_to_video" ||
                        isSeedance2FamilyModel(selectedModel)) && (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={handleFrameSizeChange}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            // Close models dropdown
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            // Close duration dropdown
                            setCloseDurationDropdown(true);
                            setTimeout(
                              () => setCloseDurationDropdown(false),
                              0,
                            );
                            // Close quality dropdown (for Seedance)
                            // QualityDropdown handles its own state
                          }}
                          onCloseThisDropdown={
                            closeFrameSizeDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      {/* Quality - Seedance 1.0 only (Seedance 1.5 doesn't use resolution) */}
                      {!selectedModel.includes("seedance-1.5") && (
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
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                            // Close duration dropdown
                            setCloseDurationDropdown(true);
                            setTimeout(
                              () => setCloseDurationDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={undefined}
                        />
                      )}
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {/* Audio toggle - Seedance 1.5 and 2.0 */}
                      {(selectedModel.includes("seedance-1.5") ||
                        isSeedance2FamilyModel(selectedModel)) && (
                        <button
                          onClick={() => setGenerateAudio((v) => !v)}
                          className={`group hidden md:flex h-[32px] w-[32px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                            generateAudio
                              ? "bg-transparent text-white "
                              : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                          }`}
                        >
                          <div className="relative">
                            {generateAudio ? (
                              <Volume2 className="w-5 h-5" />
                            ) : (
                              <VolumeX className="w-5 h-5" />
                            )}
                            <div className={newLocal}>
                              {generateAudio ? "Audio: On" : "Audio: Off"}
                            </div>
                          </div>
                        </button>
                      )}
                      {isSeedance2ReferenceModel(selectedModel) && (
                        <div className="relative">
                          <input
                            type="file"
                            accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                            onChange={handleAudioUpload}
                            className="hidden"
                            id="audio-upload-seedance-reference"
                          />
                          <label
                            htmlFor="audio-upload-seedance-reference"
                            className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20  text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-2 transition-all"
                          >
                            <Music className="w-4 h-4" />
                            {uploadedAudio ? "Audio: Uploaded" : "Upload Audio"}
                          </label>
                          {uploadedAudio && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedAudio("");
                                toast.success("Audio file removed");
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white text-xs"
                              title="Remove audio"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // PixVerse Models: Full customization
                if (selectedModel.includes("pixverse")) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
                      {!hidePixverseV6AspectRatio && (
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
                          onCloseThisDropdown={
                            closeFrameSizeDropdown ? () => {} : undefined
                          }
                        />
                      )}
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
                        hasFirstFrame={pixverseV6HasFirstFrameImage}
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {(selectedModel === PIXVERSE_V6_T2V_MODEL ||
                        selectedModel === PIXVERSE_V6_I2V_MODEL) && (
                        <>
                          <PortalHoverTooltip
                            wrapperClassName="shrink-0"
                            content={
                              pixverseV6GenerateAudio
                                ? "Audio on: BGM, SFX, and dialogue"
                                : "Audio off: no generated soundtrack"
                            }
                          >
                            <button
                              type="button"
                              aria-label="Toggle generated audio"
                              aria-pressed={pixverseV6GenerateAudio}
                              onClick={() =>
                                setPixverseV6GenerateAudio((v) => !v)
                              }
                              className={`h-[32px] w-[32px] shrink-0 rounded-lg flex items-center justify-center transition-all duration-150 ${
                                pixverseV6GenerateAudio
                                  ? pixverseV6ToggleAudioActive
                                  : pixverseV6ToggleInactive
                              }`}
                            >
                              {pixverseV6GenerateAudio ? (
                                <Volume2 className="h-5 w-5 shrink-0" strokeWidth={2.25} />
                              ) : (
                                <VolumeX className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} />
                              )}
                            </button>
                          </PortalHoverTooltip>
                          <PortalHoverTooltip
                            wrapperClassName="shrink-0"
                            content={`Multishot: ${pixverseV6MultiClip ? "on" : "off"}\nMulti-angle clips: camera moves and cuts between shots`}
                          >
                            <button
                              type="button"
                              aria-label="Multi-angle dynamic clips"
                              aria-pressed={pixverseV6MultiClip}
                              onClick={() => setPixverseV6MultiClip((v) => !v)}
                              className={`h-[32px] w-[32px] shrink-0 rounded-lg flex items-center justify-center transition-all duration-150 ${
                                pixverseV6MultiClip
                                  ? pixverseV6ToggleActive
                                  : pixverseV6ToggleInactive
                              }`}
                            >
                              <Scan
                                className={`h-5 w-5 shrink-0 ${
                                  pixverseV6MultiClip ? "text-white" : "opacity-80"
                                }`}
                                strokeWidth={pixverseV6MultiClip ? 2.35 : 1.85}
                              />
                            </button>
                          </PortalHoverTooltip>
                          <PixverseV6StyleDropdown
                            value={pixverseV6Style}
                            onChange={setPixverseV6Style}
                            onCloseOtherDropdowns={() => {
                              setCloseModelsDropdown(true);
                              setTimeout(() => setCloseModelsDropdown(false), 0);
                              setCloseFrameSizeDropdown(true);
                              setTimeout(
                                () => setCloseFrameSizeDropdown(false),
                                0,
                              );
                              setCloseDurationDropdown(true);
                              setTimeout(
                                () => setCloseDurationDropdown(false),
                                0,
                              );
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                }

                // Runway Models: Full customization (exclude wan-2.2-animate-replace)
                if (
                  (selectedModel.includes("gen4") ||
                    selectedModel.includes("gen3a")) &&
                  selectedModel !== "wan-2.2-animate-replace" &&
                  !selectedModel.includes("wan-2.2-animate")
                ) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Duration - For image→video and text→video modes */}
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
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
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                    </div>
                  );
                }

                // MiniMax & Director Models
                if (
                  selectedModel.includes("MiniMax") ||
                  selectedModel === "T2V-01-Director" ||
                  selectedModel === "I2V-01-Director" ||
                  selectedModel === "S2V-01"
                ) {
                  return (
                    <div className="flex flex-row gap-2 flex-nowrap items-center min-w-max">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {/* Duration - For MiniMax models */}
                      <VideoDurationDropdown
                        selectedDuration={selectedMiniMaxDuration}
                        onDurationChange={(value) => {
                          if (typeof value === "number") {
                            setSelectedMiniMaxDuration(value);
                          }
                        }}
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {isSeedance2ReferenceModel(selectedModel) && (
                        <div className="relative flex-shrink-0">
                          <input
                            type="file"
                            accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                            onChange={handleAudioUpload}
                            className="hidden"
                            id="audio-upload-seedance-reference-mobile"
                          />
                          <label
                            htmlFor="audio-upload-seedance-reference-mobile"
                            className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            <Music className="w-3.5 h-3.5" />
                            {uploadedAudio ? "Audio OK" : "Audio"}
                          </label>
                          {uploadedAudio && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedAudio("");
                                toast.success("Audio file removed");
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
                  );
                }

                  return null;
                })()}
              </div>
            </div>

            {/* Mobile: Second row - All other dropdowns (no overflow-x-auto: clips upward tooltips from nested controls). */}
            <div className="relative z-[20] order-2 flex md:hidden flex-wrap gap-2 w-full pl-1 overflow-visible py-1 mt-1">
              {/* Use the same dynamic controls logic as desktop - extract it to avoid duplication */}
              {(() => {
                // WAN 2.2 Animate Replace: Resolution, Refert Num, Go Fast, Merge Audio, FPS, Seed
                const isWanAnimateReplace =
                  selectedModel === "wan-2.2-animate-replace" ||
                  (activeFeature === "Animate" &&
                    selectedModel &&
                    (selectedModel.includes("wan-2.2") ||
                      selectedModel.includes("animate-replace")));

                if (isWanAnimateReplace) {
                  return (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex flex-row gap-2 flex-wrap">
                        <div className="relative">
                          <select
                            value={wanAnimateResolution}
                            onChange={(e) =>
                              setWanAnimateResolution(
                                e.target.value as "720" | "480",
                              )
                            }
                            className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors appearance-none cursor-pointer pr-8"
                          >
                            <option value="720">720p</option>
                            <option value="480">480p</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              className="text-white/60"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                        <div className="relative">
                          <select
                            value={wanAnimateRefertNum}
                            onChange={(e) =>
                              setWanAnimateRefertNum(
                                Number(e.target.value) as 1 | 5,
                              )
                            }
                            className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors appearance-none cursor-pointer pr-8"
                          >
                            <option value="1">Ref Frames: 1</option>
                            <option value="5">Ref Frames: 5</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              className="text-white/60"
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (
                  selectedModel === "T2V-01-Director" ||
                  selectedModel === "I2V-01-Director" ||
                  selectedModel === "S2V-01"
                ) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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

                if (
                  selectedModel.includes("sora2") &&
                  !selectedModel.includes("v2v")
                ) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                    </div>
                  );
                }

                if (selectedModel.includes("ltx2")) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
                      {generationMode === "image_to_video" ? (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={setFrameSize}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseDurationDropdown(true);
                            setTimeout(
                              () => setCloseDurationDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeFrameSizeDropdown ? () => {} : undefined
                          }
                        />
                      ) : (
                        <div className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 bg-white/10 text-white/70 flex items-center gap-1">
                          16:9 (Fixed)
                        </div>
                      )}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={
                          selectedResolution.toLowerCase?.() || "1080p"
                        }
                        onResolutionChange={setSelectedResolution as any}
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {/* Audio toggle for LTX V2 */}
                      <button
                        onClick={() => setGenerateAudio((v) => !v)}
                        className={`group hidden md:flex h-[32px] w-[32px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                          generateAudio
                            ? "bg-transparent text-white "
                            : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                        }`}
                      >
                        <div className="relative">
                          {generateAudio ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )}
                          <div className={newLocal}>
                            {generateAudio ? "Audio: On" : "Audio: Off"}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                if (
                  selectedModel.includes("ltx-2.3-fast") ||
                  selectedModel.includes("ltx-2.3-pro")
                ) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
                      <VideoFrameSizeDropdown
                        selectedFrameSize={frameSize}
                        onFrameSizeChange={handleFrameSizeChange}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setCloseDurationDropdown(true);
                          setCloseCameraMotionDropdown(true);
                          setTimeout(() => {
                            setCloseModelsDropdown(false);
                            setCloseDurationDropdown(false);
                            setCloseCameraMotionDropdown(false);
                          }, 100);
                        }}
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={
                          selectedResolution.toLowerCase?.() || "1080p"
                        }
                        onResolutionChange={setSelectedResolution as any}
                      />
                      <VideoDurationDropdown
                        selectedDuration={duration}
                        onDurationChange={setDuration}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setCloseFrameSizeDropdown(true);
                          setCloseCameraMotionDropdown(true);
                          setTimeout(() => {
                            setCloseModelsDropdown(false);
                            setCloseFrameSizeDropdown(false);
                            setCloseCameraMotionDropdown(false);
                          }, 100);
                        }}
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      <CameraMotionDropdown
                        selectedMotion={selectedCameraMovements[0] || "none"}
                        onMotionChange={(motion) =>
                          setSelectedCameraMovements([motion])
                        }
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setCloseFrameSizeDropdown(true);
                          setCloseDurationDropdown(true);
                          setTimeout(() => {
                            setCloseModelsDropdown(false);
                            setCloseFrameSizeDropdown(false);
                            setCloseDurationDropdown(false);
                          }, 100);
                        }}
                        onCloseThisDropdown={closeCameraMotionDropdown}
                      />
                      {isLtx23ProModel && (
                        <div className="relative flex-shrink-0">
                          <input
                            type="file"
                            accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                            onChange={handleAudioUpload}
                            className="hidden"
                            id="audio-upload-ltx-pro-mobile"
                          />
                          <label
                            htmlFor="audio-upload-ltx-pro-mobile"
                            className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            <Music className="w-3.5 h-3.5" />
                            {uploadedAudio ? "Audio OK" : "Audio"}
                          </label>
                        </div>
                      )}
                    </div>
                  );
                }

                if (selectedModel.startsWith("alibaba/happy-horse")) {
                  const isHappyHorseEditMode =
                    selectedModel === HAPPY_HORSE_EDIT_MODEL;
                  const isHappyHorseReferenceMode =
                    !isHappyHorseEditMode && references.length > 0;
                  const showAspectRatio = !isHappyHorseEditMode && !uploadedImages[0]
                    ? true
                    : isHappyHorseReferenceMode;
                  const showDuration = !isHappyHorseEditMode;
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
                      {showAspectRatio && (
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
                          onCloseThisDropdown={
                            closeFrameSizeDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {showDuration && (
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
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      {/* Seed and safety checker commented out per request */}
                      {isHappyHorseEditMode && (
                        <select
                          value={happyHorseAudioSetting}
                          onChange={(e) =>
                            setHappyHorseAudioSetting(
                              e.target.value as "default" | "auto" | "origin",
                            )
                          }
                          className="h-[28px] px-2 rounded-lg text-[10px] ring-1 ring-white/20 text-white/90 bg-transparent"
                        >
                          <option value="default" className="bg-black text-white">
                            default
                          </option>
                          <option value="auto" className="bg-black text-white">
                            auto
                          </option>
                          <option value="origin" className="bg-black text-white">
                            origin
                          </option>
                        </select>
                      )}
                    </div>
                  );
                }

                if (selectedModel.includes("veo3.1")) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                    </div>
                  );
                }

                if (
                  selectedModel.includes("veo3") &&
                  !selectedModel.includes("veo3.1")
                ) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      <ResolutionDropdown
                        selectedModel={selectedModel}
                        selectedResolution={selectedQuality}
                        onResolutionChange={setSelectedQuality}
                      />
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                      {/* Audio toggle for Veo 3 */}
                      <button
                        onClick={() => setGenerateAudio((v) => !v)}
                        className={`group hidden md:flex md:h-[32px] h-[28px] md:w-[32px] w-[28px] rounded-lg items-center justify-center ring-1 ring-white/20 transition-all relative ${
                          generateAudio
                            ? "bg-transparent text-white "
                            : "bg-transparent text-white hover:bg-white/20 hover:text-white/80"
                        }`}
                      >
                        <div className="relative">
                          {generateAudio ? (
                            <Volume2 className="w-5 h-5" />
                          ) : (
                            <VolumeX className="w-5 h-5" />
                          )}
                          <div className={newLocal}>
                            {generateAudio ? "Audio: On" : "Audio: Off"}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                }

                if (selectedModel.startsWith("kling-")) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {selectedModel.includes("kling-v2.1") &&
                        !selectedModel.includes("master") && (
                          <KlingModeDropdown
                            value={klingMode}
                            onChange={setKlingMode}
                            onCloseOtherDropdowns={() => {
                              setCloseModelsDropdown(true);
                              setTimeout(
                                () => setCloseModelsDropdown(false),
                                0,
                              );
                              setCloseFrameSizeDropdown(true);
                              setTimeout(
                                () => setCloseFrameSizeDropdown(false),
                                0,
                              );
                              setCloseDurationDropdown(true);
                              setTimeout(
                                () => setCloseDurationDropdown(false),
                                0,
                              );
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {isSeedance2ReferenceModel(selectedModel) && (
                        <div className="relative flex-shrink-0">
                          <input
                            type="file"
                            accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                            onChange={handleAudioUpload}
                            className="hidden"
                            id="audio-upload-seedance-reference-mobile"
                          />
                          <label
                            htmlFor="audio-upload-seedance-reference-mobile"
                            className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            <Music className="w-3.5 h-3.5" />
                            {uploadedAudio ? "Audio OK" : "Audio"}
                          </label>
                          {uploadedAudio && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedAudio("");
                                toast.success("Audio file removed");
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
                  );
                }

                if (
                  selectedModel.includes("wan-2.5") &&
                  selectedModel !== "wan-2.2-animate-replace" &&
                  !selectedModel.includes("wan-2.2")
                ) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                    </div>
                  );
                }

                if (selectedModel.includes("seedance")) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
                      {(generationMode === "text_to_video" ||
                        isSeedance2FamilyModel(selectedModel)) && (
                        <VideoFrameSizeDropdown
                          selectedFrameSize={frameSize}
                          onFrameSizeChange={handleFrameSizeChange}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseDurationDropdown(true);
                            setTimeout(
                              () => setCloseDurationDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeFrameSizeDropdown ? () => {} : undefined
                          }
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
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                      {isSeedance2ReferenceModel(selectedModel) && (
                        <div className="relative flex-shrink-0">
                          <input
                            type="file"
                            accept="audio/wav,audio/mp3,audio/mpeg,.wav,.mp3"
                            onChange={handleAudioUpload}
                            className="hidden"
                            id="audio-upload-seedance-reference-mobile"
                          />
                          <label
                            htmlFor="audio-upload-seedance-reference-mobile"
                            className="md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white/10 text-white/80 hover:text-white hover:bg-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            <Music className="w-3.5 h-3.5" />
                            {uploadedAudio ? "Audio OK" : "Audio"}
                          </label>
                          {uploadedAudio && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedAudio("");
                                toast.success("Audio file removed");
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
                  );
                }

                if (
                  (selectedModel.includes("gen4") ||
                    selectedModel.includes("gen3a")) &&
                  selectedModel !== "wan-2.2-animate-replace" &&
                  !selectedModel.includes("wan-2.2-animate")
                ) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      {(generationMode === "image_to_video" ||
                        generationMode === "text_to_video") && (
                        <VideoDurationDropdown
                          selectedDuration={duration}
                          onDurationChange={setDuration}
                          selectedModel={selectedModel}
                          generationMode={generationMode}
                          onCloseOtherDropdowns={() => {
                            setCloseModelsDropdown(true);
                            setTimeout(() => setCloseModelsDropdown(false), 0);
                            setCloseFrameSizeDropdown(true);
                            setTimeout(
                              () => setCloseFrameSizeDropdown(false),
                              0,
                            );
                          }}
                          onCloseThisDropdown={
                            closeDurationDropdown ? () => {} : undefined
                          }
                        />
                      )}
                    </div>
                  );
                }

                if (
                  selectedModel.includes("MiniMax") ||
                  selectedModel === "T2V-01-Director" ||
                  selectedModel === "I2V-01-Director" ||
                  selectedModel === "S2V-01"
                ) {
                  return (
                    <div className="flex min-w-max flex-nowrap items-center gap-2 pr-1">
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
                        onCloseThisDropdown={
                          closeFrameSizeDropdown ? () => {} : undefined
                        }
                      />
                      <VideoDurationDropdown
                        selectedDuration={selectedMiniMaxDuration}
                        onDurationChange={(value) => {
                          if (typeof value === "number") {
                            setSelectedMiniMaxDuration(value);
                          }
                        }}
                        selectedModel={selectedModel}
                        generationMode={generationMode}
                        onCloseOtherDropdowns={() => {
                          setCloseModelsDropdown(true);
                          setTimeout(() => setCloseModelsDropdown(false), 0);
                          setCloseFrameSizeDropdown(true);
                          setTimeout(() => setCloseFrameSizeDropdown(false), 0);
                        }}
                        onCloseThisDropdown={
                          closeDurationDropdown ? () => {} : undefined
                        }
                      />
                    </div>
                  );
                }

                    return null;
                  })()}
                </div>
              </div>
              </div>

              {/* Desktop: Generate button section */}
              <div className="hidden md:flex min-w-[100px] flex-shrink-0 flex-col items-end gap-0 justify-self-end -mb-5">

              <div className="text-white/60 text-[11px] pr-1">
                Total credits:{" "}
                <span className="font-medium text-white/80">
                  {liveCreditCost}
                </span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={(() => {
                  const disabled =
                    runningGenerationsCount >= 4 ||
                    !prompt.trim() ||
                    (generationMode === "image_to_video" &&
                      selectedModel !== "S2V-01" &&
                      !selectedModel.includes("wan-2.5") &&
                      !selectedModel.startsWith("kling-") &&
                      selectedModel !== "gen4_turbo" &&
                      selectedModel !== "gen3a_turbo" &&
                      uploadedImages.length === 0) ||
                    (generationMode === "video_to_video" && !uploadedVideo) ||
                    (generationMode === "image_to_video" &&
                      selectedModel === "I2V-01-Director" &&
                      uploadedImages.length === 0) ||
                    (generationMode === "image_to_video" &&
                      selectedModel === "S2V-01" &&
                      references.length === 0) ||
                    (generationMode === "image_to_video" &&
                      selectedModel === "MiniMax-Hailuo-02" &&
                      selectedResolution === "512P" &&
                      uploadedImages.length === 0) ||
                    (generationMode === "image_to_video" &&
                      selectedModel.includes("wan-2.5") &&
                      uploadedImages.length === 0);

                  if (selectedModel === "S2V-01") {
                    console.log("🔍 S2V-01 Validation Debug:", {
                      runningGenerationsCount,
                      hasPrompt: !!prompt.trim(),
                      referencesLength: references.length,
                      generationMode,
                      disabled,
                    });
                  }

                  return disabled;
                })()}
                className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-70 disabled:hover:bg-[#2F6BFF] text-white h-[34px] px-4 py-0 rounded-lg text-[13px] font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)] flex items-center justify-center"
              >
                {isEnhancing
                  ? "Enhancing..."
                  : runningGenerationsCount >= 4
                    ? "Queue Full"
                    : "Generate"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <VideoPreviewModal preview={preview} onClose={() => setPreview(null)} />
      )}

      {/* Asset Viewer Modal for uploaded assets */}
      <AssetViewerModal
        isOpen={assetViewer.isOpen}
        onClose={() => setAssetViewer((prev) => ({ ...prev, isOpen: false }))}
        assetUrl={assetViewer.assetUrl}
        assetType={assetViewer.assetType}
        title={assetViewer.title}
      />

      {/* UploadModal for image and reference uploads */}
      {uploadModalType !== "video" && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAdd={handleImageUploadFromModal}
          persistLocalDeviceUploads={false}
          accept={
            uploadModalType === "reference" && isSeedance2ReferenceModel(selectedModel)
              ? "image/jpeg,image/png,image/webp"
              : undefined
          }
          maxFileSizeBytes={
            uploadModalType === "reference" && isSeedance2ReferenceModel(selectedModel)
              ? 30 * 1024 * 1024
              : undefined
          }
          remainingSlots={
            uploadModalType === "image"
              ? // For WAN 2.2 Animate Replace character image, only 1 slot
                selectedModel === "wan-2.2-animate-replace" ||
                (activeFeature === "Animate" &&
                  selectedModel.includes("wan-2.2"))
                ? 1
                : selectedModel === "S2V-01"
                  ? 0
                  : 1 // S2V-01 doesn't use uploadedImages
                : generationMode === "image_to_video" &&
                    selectedModel === "S2V-01"
                  ? 1
                : isSeedance2ReferenceModel(selectedModel)
                  ? Math.min(
                      9 - (references?.length || 0),
                      12 -
                        ((references?.length || 0) +
                          (uploadedVideo ? 1 : 0) +
                          (uploadedAudio ? 1 : 0)),
                    )
                  : 4 // video-to-video needs up to 4
          }
        />
      )}

      {/* VideoUploadModal for video uploads */}
      {uploadModalType === "video" && (
        <VideoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onAdd={handleImageUploadFromModal}
          remainingSlots={isSeedance2ReferenceModel(selectedModel) ? 3 : 1}
        />
      )}
    </React.Fragment>
  );
};

export default InputBox;

