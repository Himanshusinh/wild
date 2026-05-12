"use client";

"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FilePlus, ChevronUp, Edit3 } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { getIsPublic } from "@/lib/publicFlag";
import FrameSizeDropdown from "@/app/view/Generation/ImageGeneration/TextToImage/compo/FrameSizeDropdown";
import StyleSelector from "@/app/view/Generation/ImageGeneration/TextToImage/compo/StyleSelector";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import UploadModal from "@/app/view/Generation/ImageGeneration/TextToImage/compo/UploadModal";
import { loadMoreHistory, loadHistory } from "@/store/slices/historySlice";
import { useHistoryLoader } from "@/hooks/useHistoryLoader";
import { downloadFileWithNaming } from "@/utils/downloadUtils";
import { getCreditsForModel } from "@/utils/modelCredits";
import { estimateCrystalUpscalerCredits } from "@/utils/pricing/crystalUpscalerCredits";
import { toast } from "react-hot-toast";
import { EditImageEraseFrame } from "./EditImageEraseFrame";
import { EditImageEraseControls } from "./EditImageEraseControls";
import { EditImageExpandFrame } from "./EditImageExpandFrame";
import { EditImageSidebar } from "./EditImageSidebar";
import { EditImageCanvasArea, CanvasTopBar } from "./EditImageCanvasArea";
import { EditImageStatusBar } from "./EditImageStatusBar";
import { EditImageExpandControls } from "./EditImageExpandControls";
import { saveUpload } from "@/lib/libraryApi";
import { useCredits } from "@/hooks/useCredits";
import { AUTH_ROUTES, getSignInUrl } from "@/routes/routes";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";
import { STYLE_CATALOG } from "@/styles/stylesCatalog";
import { ALL_INDIAN_STYLES } from "@/styles/indianStyles";
import {
  INDIAN_STYLE_LOOKUP,
  getIndianBasePrompt,
} from "@/app/view/Generation/ImageGeneration/TextToImage/compo/inputBox/indianStylePrompts";

import type { EditFeature } from "./editImageTypes";
import {
  STYLE_COMBO_GENERAL_IDS,
  STYLE_COMBO_MAX_SELECTIONS,
  STYLE_COMBO_BASE_MODELS,
  aspectPresets,
} from "./editImageConstants";
import {
  maskDataUrlHasPaintedRegion,
  normalizeEditImageUrl,
  isSvgUrl,
  isInlineImageUrl,
} from "./editImageUtils";


export function useEditImageInterface() {

  // Erase / Replace state
  const [eraseBrushSize, setEraseBrushSize] = useState<number>(40);
  const [eraseIsDrawing, setEraseIsDrawing] = useState<boolean>(false);
  const [eraseMaskData, setEraseMaskData] = useState<string | null>(null);
  const [eraseIsPreviewing, setEraseIsPreviewing] = useState<boolean>(false);
  const [eraseModel, setEraseModel] = useState<string>("bria/eraser");
  const [erasePrompt, setErasePrompt] = useState<string>("");
  const [eraseActionMode, setEraseActionMode] = useState<"replace" | "erase">(
    "replace",
  );
  const [isAdjustingBrush, setIsAdjustingBrush] = useState<boolean>(false);
  /** Bumped to clear `EditImageEraseFrame` mask (fill + style combination). */
  const [eraseFrameMaskResetNonce, setEraseFrameMaskResetNonce] = useState(0);
  const [styleComboMaskPainted, setStyleComboMaskPainted] = useState(false);
  const eraseCredits = useMemo(
    () => getCreditsForModel("seedream-5-lite") ?? 90,
    [],
  );
  const expandCredits = useMemo(
    () => getCreditsForModel("replicate/bria/expand-image") ?? 100,
    [],
  );
  const vectorizeRecraftCredits = useMemo(
    () => getCreditsForModel("fal-recraft-vectorize") ?? 40,
    [],
  );
  const vectorizeImage2SvgCredits = useMemo(
    () => getCreditsForModel("fal-image2svg") ?? 30,
    [],
  );
  const vectorizeArtExtraCredits = 80; // Additional credits when Art Vector (super mode) is selected

  const [styleComboTab, setStyleComboTab] = useState<"general" | "indian">(
    "general",
  );
  const [styleComboSelectedIds, setStyleComboSelectedIds] = useState<string[]>(
    [],
  );
  const [styleComboIndianVersion, setStyleComboIndianVersion] = useState<
    "V1" | "V2" | "V3"
  >("V1");
  const [styleComboIndianSearch, setStyleComboIndianSearch] =
    useState<string>("");
  const [styleComboExtraPrompt, setStyleComboExtraPrompt] =
    useState<string>("");
  const [styleComboModel, setStyleComboModel] = useState<
    "google/nano-banana-pro" | "google/nano-banana-2"
  >("google/nano-banana-pro");
  const [styleComboFrameSize, setStyleComboFrameSize] = useState<
    "1:1" | "3:4" | "4:3" | "16:9" | "9:16"
  >("1:1");
  const [styleComboResolution, setStyleComboResolution] = useState<
    "1K" | "2K" | "4K"
  >("2K");
  const [styleComboDropdown, setStyleComboDropdown] = useState<
    "model" | "resolution" | "frame" | ""
  >("");

  const styleComboGeneralStyles = useMemo(
    () => STYLE_CATALOG.filter((s) => STYLE_COMBO_GENERAL_IDS.has(s.value)),
    [],
  );
  const styleComboIndianRows = useMemo(() => {
    const q = styleComboIndianSearch.trim().toLowerCase();
    return ALL_INDIAN_STYLES.filter((row) => {
      if (!q) return true;
      const hay = `${row.title} ${row.name} ${row.desc} ${row.id}`
        .toLowerCase()
        .replace(/\s+/g, " ");
      return hay.includes(q);
    }).sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
  }, [styleComboIndianSearch]);

  const toggleStyleComboId = useCallback((id: string) => {
    setStyleComboSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= STYLE_COMBO_MAX_SELECTIONS) {
        toast.error(
          `You can select at most ${STYLE_COMBO_MAX_SELECTIONS} styles.`,
        );
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const {
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,
    refreshCredits,
    creditBalance,
  } = useCredits();

  // Live Chat state
  // ... (rest of existing state)
  const user = useAppSelector((state: any) => state.auth?.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] =
    useState<EditFeature>("upscale");
  const [inputs, setInputs] = useState<Record<EditFeature, string | null>>({
    upscale: null,
    "remove-bg": null,
    resize: null,
    fill: null,
    vectorize: null,
    erase: null,
    expand: null,
    reimagine: null,
    "live-chat": null,
    "style-combination": null,
  });
  // Per-feature outputs and processing flags so operations don't block each other
  const [outputs, setOutputs] = useState<Record<EditFeature, string | null>>({
    upscale: null,
    "remove-bg": null,
    resize: null,
    fill: null,
    vectorize: null,
    erase: null,
    expand: null,
    reimagine: null,
    "live-chat": null,
    "style-combination": null,
  });
  const [processing, setProcessing] = useState<Record<EditFeature, boolean>>({
    upscale: false,
    "remove-bg": false,
    resize: false,
    fill: false,
    vectorize: false,
    erase: false,
    expand: false,
    reimagine: false,
    "live-chat": false,
    "style-combination": false,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [upscaleViewMode, setUpscaleViewMode] = useState<"comparison" | "zoom">(
    "comparison",
  );
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [hasLeftScroll, setHasLeftScroll] = useState(false);

  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPoint, setLastPoint] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // Fill mask drawing
  const fillCanvasRef = useRef<HTMLCanvasElement>(null);
  const fillContainerRef = useRef<HTMLDivElement>(null);
  const featureTabsRef = useRef<HTMLDivElement>(null);
  const [inputNaturalSize, setInputNaturalSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [isMasking, setIsMasking] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [brushSize, setBrushSize] = useState(18);

  useEffect(() => {
    if (selectedFeature !== "style-combination") {
      setStyleComboMaskPainted(false);
      return;
    }
    if (!eraseMaskData) {
      setStyleComboMaskPainted(false);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const ok = await maskDataUrlHasPaintedRegion(eraseMaskData);
      if (!cancelled) setStyleComboMaskPainted(ok);
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [selectedFeature, eraseMaskData]);

  const [eraseMode, setEraseMode] = useState(false);
  // Reimagine: Selection confirmation and floating prompt
  const [reimagineSelectionConfirmed, setReimagineSelectionConfirmed] =
    useState(false);
  const [reimaginePrompt, setReimaginePrompt] = useState("");
  const [reimagineSelectionBounds, setReimagineSelectionBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  // Real-time selection bounds for visual feedback
  const [reimagineLiveBounds, setReimagineLiveBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  // Reimagine: Selection mode (brush or rectangle)
  const [reimagineSelectionMode, setReimagineSelectionMode] = useState<
    "brush" | "rectangle"
  >("rectangle");
  // Reimagine: Model selection (auto, nano-banana, seedream-4k)
  const [reimagineModel, setReimagineModel] = useState<
    "auto" | "nano-banana" | "seedream-4k"
  >("auto");
  // Rectangle selection state
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false);
  const [rectangleStart, setRectangleStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [rectangleCurrent, setRectangleCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [fillSeed, setFillSeed] = useState<string>("");
  const [fillNegativePrompt, setFillNegativePrompt] = useState<string>("");
  const [fillNumImages, setFillNumImages] = useState<number>(1);
  const [fillSyncMode, setFillSyncMode] = useState<boolean>(false);
  // Expand feature state
  const [expandOriginalSize, setExpandOriginalSize] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [expandBounds, setExpandBounds] = useState({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  });
  const [expandAspectRatio, setExpandAspectRatio] = useState<string>("custom");
  const [expandCustomWidth, setExpandCustomWidth] = useState<number>(0);
  const [expandCustomHeight, setExpandCustomHeight] = useState<number>(0);
  // Effective provider-conformant size (after normalization)
  const [expandEffectiveWidth, setExpandEffectiveWidth] = useState<number>(0);
  const [expandEffectiveHeight, setExpandEffectiveHeight] = useState<number>(0);
  const expandCanvasRef = useRef<HTMLCanvasElement>(null);
  const expandContainerRef = useRef<HTMLDivElement>(null);
  const expandImageRef = useRef<HTMLImageElement | null>(null);
  const [expandResizing, setExpandResizing] = useState<string | null>(null); // 'left', 'right', 'top', 'bottom', 'top-left', etc.
  const [expandHoverEdge, setExpandHoverEdge] = useState<string | null>(null);

  // Form states
  const [model, setModel] = useState<
    | ""
    | "philz1337x/clarity-upscaler"
    | "fermatresearch/magic-image-refiner"
    | "nightmareai/real-esrgan"
    | "851-labs/background-remover"
    | "lucataco/remove-bg"
    | "philz1337x/crystal-upscaler"
    | "fal-ai/topaz/upscale/image"
    | "fal-ai/seedvr/upscale/image"
    | "fal-ai/bria/expand"
    | "fal-ai/bria/genfill"
    | "google_nano_banana"
    | "seedream_4"
    | "seedream-5-lite"
  >("philz1337x/crystal-upscaler");
  const [prompt, setPrompt] = useState("");
  const [scaleFactor, setScaleFactor] = useState("");
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [swinTask, setSwinTask] = useState<
    "classical_sr" | "real_sr" | "compressed_sr"
  >("real_sr");
  const getSwinTaskLabel = (
    t: "classical_sr" | "real_sr" | "compressed_sr",
  ) => {
    // Global scroll lock for Edit Image screen (Bug 51)
    useEffect(() => {
      // Lock scroll on mount
      const originalBodyStyle = window.getComputedStyle(document.body).overflow;
      const originalHtmlStyle = window.getComputedStyle(
        document.documentElement,
      ).overflow;

      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Unlock scroll on unmount
      return () => {
        document.body.style.overflow = originalBodyStyle || "auto";
        document.documentElement.style.overflow = originalHtmlStyle || "auto";
      };
    }, []);
    if (t === "classical_sr")
      return "classical_sr: Upscale high-quality inputs (classical super-resolution).";
    if (t === "real_sr")
      return "real_sr: Upscale real-world photos with mixed noise/compression (default).";
    return "compressed_sr: Upscale heavily compressed/low-bitrate images.";
  };
  const getUpscaleModelLabel = (m: string) => {
    if (m === "philz1337x/clarity-upscaler") return "Clarity Upscaler";
    if (m === "nightmareai/real-esrgan") return "Real-ESRGAN";
    if (m === "philz1337x/crystal-upscaler") return "Crystal Upscaler";
    if (m === "fal-ai/topaz/upscale/image") return "Topaz Upscaler";
    if (m === "fal-ai/seedvr/upscale/image") return "SeedVR Upscaler (factor)";
    if (m === "fal-ai/bria/expand") return "Bria Expand (Resize)";
    if (m === "fal-ai/bria/genfill") return "Bria GenFill";
    if (m === "google_nano_banana") return "Google Nano Banana";
    if (m === "seedream_4") return "Seedream 4";
    if (m === "seedream-5-lite") return "Seedream 5 Lite";
    if (m === "851-labs/background-remover") return "851 Labs Remove BG";
    if (m === "lucataco/remove-bg") return "Lucataco Remove BG";
    return m;
  };
  const [output, setOutput] = useState<"" | "png" | "jpg" | "jpeg" | "webp">(
    "png",
  );
  // Topaz upscaler state
  const [topazModel, setTopazModel] = useState<
    | "Low Resolution V2"
    | "Standard V2"
    | "CGI"
    | "High Fidelity V2"
    | "Text Refine"
    | "Recovery"
    | "Redefine"
    | "Recovery V2"
  >("Standard V2");
  const [topazUpscaleFactor, setTopazUpscaleFactor] = useState<number>(2);
  const [seedvrUpscaleFactor, setSeedvrUpscaleFactor] = useState<number>(2);
  const [topazCropToFill, setTopazCropToFill] = useState<boolean>(false);
  const [topazOutputFormat, setTopazOutputFormat] = useState<"jpeg" | "png">(
    "jpeg",
  );
  const [topazSubjectDetection, setTopazSubjectDetection] = useState<
    "All" | "Foreground" | "Background"
  >("All");
  const [topazFaceEnhance, setTopazFaceEnhance] = useState<boolean>(true);
  const [topazFaceCreativity, setTopazFaceCreativity] = useState<number>(0);
  const [topazFaceStrength, setTopazFaceStrength] = useState<number>(0.8);

  const estimateTopazCredits = useCallback((outputMegapixels: number) => {
    if (!Number.isFinite(outputMegapixels) || outputMegapixels <= 0) {
      return null;
    }
    if (outputMegapixels <= 24) return 64;
    if (outputMegapixels <= 48) return 128;
    if (outputMegapixels <= 96) return 256;
    return 1087;
  }, []);

  const seedvrEstimate = useMemo(() => {
    if (selectedFeature !== "upscale") return null;
    if (model !== "fal-ai/seedvr/upscale/image") return null;
    const w = Number(inputNaturalSize?.width || 0);
    const h = Number(inputNaturalSize?.height || 0);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
      return null;
    const factor = Math.max(
      1,
      Math.min(8, Math.round(Number(seedvrUpscaleFactor) || 2)),
    );
    const outW = Math.max(1, Math.round(w * factor));
    const outH = Math.max(1, Math.round(h * factor));
    const mp = (outW * outH) / 1_000_000;
    const credits = Math.max(1, Math.ceil(mp));
    return { factor, outW, outH, credits };
  }, [
    inputNaturalSize?.width,
    inputNaturalSize?.height,
    model,
    seedvrUpscaleFactor,
    selectedFeature,
  ]);

  const crystalEstimate = useMemo(() => {
    if (selectedFeature !== "upscale") return null;
    if (model !== "philz1337x/crystal-upscaler") return null;
    const w = Number(inputNaturalSize?.width || 0);
    const h = Number(inputNaturalSize?.height || 0);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
      return null;
    const factorRaw = Number(String(scaleFactor).replace("x", "")) || 2;
    return estimateCrystalUpscalerCredits(w, h, factorRaw);
  }, [
    inputNaturalSize?.width,
    inputNaturalSize?.height,
    model,
    scaleFactor,
    selectedFeature,
  ]);

  const topazEstimate = useMemo(() => {
    if (selectedFeature !== "upscale") return null;
    if (model !== "fal-ai/topaz/upscale/image") return null;
    const w = inputNaturalSize.width;
    const h = inputNaturalSize.height;
    if (w <= 0 || h <= 0) return null;
    const outW = Math.round(w * (topazUpscaleFactor || 2));
    const outH = Math.round(h * (topazUpscaleFactor || 2));
    const megapixels = (outW * outH) / 1_000_000;
    const credits = estimateTopazCredits(megapixels);
    if (!credits) return null;
    return { outW, outH, credits, megapixels };
  }, [
    estimateTopazCredits,
    inputNaturalSize,
    model,
    selectedFeature,
    topazUpscaleFactor,
  ]);

  const realEsrganEstimate = useMemo(() => {
    if (selectedFeature !== "upscale") return null;
    if (model !== "nightmareai/real-esrgan") return null;
    const w = inputNaturalSize.width;
    const h = inputNaturalSize.height;
    if (w <= 0 || h <= 0) return null;
    const factor = Number(String(scaleFactor).replace("x", "")) || 4;
    const outW = Math.round(w * factor);
    const outH = Math.round(h * factor);
    return { outW, outH, credits: 14 };
  }, [inputNaturalSize, model, scaleFactor, selectedFeature]);
  // Outpaint (resize) controls
  const [resizeExpandLeft, setResizeExpandLeft] = useState<number>(0);
  const [resizeExpandRight, setResizeExpandRight] = useState<number>(0);
  const [resizeExpandTop, setResizeExpandTop] = useState<number>(0);
  const [resizeExpandBottom, setResizeExpandBottom] = useState<number>(400);
  const [resizeZoomOutPercentage, setResizeZoomOutPercentage] =
    useState<number>(20);
  const [resizeNumImages, setResizeNumImages] = useState<number>(1);
  const [resizeSafetyChecker, setResizeSafetyChecker] = useState<boolean>(true);
  const [resizeSyncMode, setResizeSyncMode] = useState<boolean>(false);
  const [resizeOutputFormat, setResizeOutputFormat] = useState<
    "png" | "jpeg" | "jpg" | "webp"
  >("png");
  const [resizeAspectRatio, setResizeAspectRatio] = useState<
    "" | "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "2:3" | "3:2" | "4:5" | "5:4"
  >("");
  // Bria Expand specific fields
  const [resizeCanvasW, setResizeCanvasW] = useState<number | "">("");
  const [resizeCanvasH, setResizeCanvasH] = useState<number | "">("");
  const [resizeOrigW, setResizeOrigW] = useState<number | "">("");
  const [resizeOrigH, setResizeOrigH] = useState<number | "">("");
  const [resizeOrigX, setResizeOrigX] = useState<number | "">("");
  const [resizeOrigY, setResizeOrigY] = useState<number | "">("");
  const [resizeSeed, setResizeSeed] = useState<string>("");
  const [resizeNegativePrompt, setResizeNegativePrompt] = useState<string>("");
  const [dynamic, setDynamic] = useState("");
  const [sharpen, setSharpen] = useState("");
  const [backgroundType, setBackgroundType] = useState("");
  // Interactive expand overlay state (left/right/top/bottom margins added around original image)
  const [expandLeftPx, setExpandLeftPx] = useState<number>(0);
  const [expandRightPx, setExpandRightPx] = useState<number>(0);
  const [expandTopPx, setExpandTopPx] = useState<number>(0);
  const [expandBottomPx, setExpandBottomPx] = useState<number>(0);
  const [draggingEdge, setDraggingEdge] = useState<
    null | "left" | "right" | "top" | "bottom"
  >(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    l: number;
    r: number;
    t: number;
    b: number;
  } | null>(null);

  const [threshold, setThreshold] = useState<string>("");
  const [reverseBg, setReverseBg] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<
    | "model"
    | "output"
    | "swinTask"
    | "backgroundType"
    | "vectorizeModel"
    | "vColorMode"
    | "vHierarchical"
    | "vMode"
    | "resizeOutput"
    | "resizeAspect"
    | "replaceModel"
    | "expandAspect"
    | "topazModel"
    | ""
  >("");
  // Live Chat dropdown keys
  const [liveActiveDropdown, setLiveActiveDropdown] = useState<
    "liveModel" | "liveFrame" | "liveResolution" | "liveQuality" | ""
  >("");
  // Vectorize controls
  const [vectorizeModel, setVectorizeModel] = useState<
    "fal-ai/recraft/vectorize" | "fal-ai/image2svg"
  >("fal-ai/recraft/vectorize");
  const [vColorMode, setVColorMode] = useState<"color" | "binary">("color");
  const [vHierarchical, setVHierarchical] = useState<"stacked" | "cutout">(
    "stacked",
  );
  const [vMode, setVMode] = useState<"spline" | "polygon">("polygon");
  const [vFilterSpeckle, setVFilterSpeckle] = useState<number>(4);
  const [vColorPrecision, setVColorPrecision] = useState<number>(6);
  const [vLayerDifference, setVLayerDifference] = useState<number>(16);
  const [vCornerThreshold, setVCornerThreshold] = useState<number>(60);
  const [vLengthThreshold, setVLengthThreshold] = useState<number>(4);
  const [vMaxIterations, setVMaxIterations] = useState<number>(10);
  const [vSpliceThreshold, setVSpliceThreshold] = useState<number>(45);
  const [vPathPrecision, setVPathPrecision] = useState<number>(3);
  const [vectorizeSuperMode, setVectorizeSuperMode] = useState<boolean>(false);
  const currentVectorizeCredits = useMemo(
    () =>
      vectorizeModel === "fal-ai/recraft/vectorize"
        ? vectorizeRecraftCredits
        : vectorizeImage2SvgCredits,
    [vectorizeModel, vectorizeRecraftCredits, vectorizeImage2SvgCredits],
  );
  const effectiveVectorizeCredits = useMemo(
    () =>
      currentVectorizeCredits +
      (vectorizeSuperMode ? vectorizeArtExtraCredits : 0),
    [currentVectorizeCredits, vectorizeSuperMode, vectorizeArtExtraCredits],
  );
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  // Live Chat feature state
  const [liveModel, setLiveModel] = useState<
    | "google/nano-banana-pro"
    | "google/nano-banana-2"
    | "openai/gpt-image-2"
    | "seedream-v4.5"
    | "seedream-5-lite"
    | "qwen/qwen-image-2-pro"
    | "qwen-image-edit-2511"
  >("google/nano-banana-pro");
  const [liveFrameSize, setLiveFrameSize] = useState<
    "1:1" | "3:4" | "4:3" | "16:9" | "9:16"
  >("1:1");
  const [liveResolution, setLiveResolution] = useState<
    "1K" | "2K" | "3K" | "4K" | "auto"
  >("1K");
  const [liveQuality, setLiveQuality] = useState<
    "low" | "medium" | "high" | "auto"
  >("auto");
  const [livePrompt, setLivePrompt] = useState<string>("");
  const [liveChatMessages, setLiveChatMessages] = useState<
    Array<{
      role: "user" | "assistant";
      text: string;
      status?: "generating" | "done";
    }>
  >([]);
  const [liveHistory, setLiveHistory] = useState<
    { id?: string; url: string }[]
  >([]);
  const [activeLiveIndex, setActiveLiveIndex] = useState<number>(-1);
  const [liveOriginalInput, setLiveOriginalInput] = useState<string | null>(
    null,
  );
  const [hoveredThumbnailIdx, setHoveredThumbnailIdx] = useState<number | null>(
    null,
  );
  const [showThumbnailMenuIdx, setShowThumbnailMenuIdx] = useState<
    number | null
  >(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);
  const lastMsgRef = useRef<HTMLDivElement | null>(null);
  const thumbnailMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = chatListRef.current;
    if (!el) return;
    try {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } catch (e) {
      // older browsers fallback
      el.scrollTop = el.scrollHeight;
    }
  }, [liveChatMessages]);

  // Live Chat dropdowns are closed by default; frame dropdown opens only after model selection.

  const liveAllowedModels: Array<{
    label: string;
    value:
      | "google/nano-banana-pro"
      | "google/nano-banana-2"
      | "openai/gpt-image-2"
      | "seedream-v4.5"
      | "seedream-5-lite"
      | "qwen/qwen-image-2-pro"
      | "qwen-image-edit-2511";
  }> = [
    { label: "Nano Banana 2", value: "google/nano-banana-2" },
    { label: "Nano Banana Pro", value: "google/nano-banana-pro" },
    { label: "GPT Image 2", value: "openai/gpt-image-2" },
    { label: "Qwen Image 2 Pro", value: "qwen/qwen-image-2-pro" },
    { label: "Seedream v4.5", value: "seedream-v4.5" },
    { label: "Seedream 5 Lite", value: "seedream-5-lite" },
    { label: "Qwen Image Edit 2511", value: "qwen-image-edit-2511" },
  ];

  const liveResolutionOptionsByModel: Record<
    (typeof liveAllowedModels)[number]["value"],
    Array<"1K" | "2K" | "3K" | "4K" | "auto">
  > = {
    "google/nano-banana-pro": ["1K", "2K", "4K"],
    "google/nano-banana-2": ["1K", "2K", "4K"],
    // GPT Image 2 does not support "resolution" (1K/2K/4K) — it uses image_size + quality.
    // Keep the existing dropdown UI but lock it to a single supported value.
    "openai/gpt-image-2": ["auto"],
    "seedream-v4.5": ["1K", "2K", "4K"],
    "seedream-5-lite": ["2K", "3K"],
    "qwen/qwen-image-2-pro": ["1K", "2K"],
    "qwen-image-edit-2511": ["1K", "2K", "4K"],
  };

  const liveResolutionOptions = liveResolutionOptionsByModel[liveModel] || [
    "1K",
    "2K",
    "4K",
  ];

  useEffect(() => {
    if (!liveResolutionOptions.includes(liveResolution)) {
      setLiveResolution(liveResolutionOptions[0]);
    }
  }, [liveModel, liveResolution, liveResolutionOptions]);

  const getLiveModelCredits = (
    value:
      | "google/nano-banana-pro"
      | "google/nano-banana-2"
      | "openai/gpt-image-2"
      | "seedream-v4.5"
      | "seedream-5-lite"
      | "qwen/qwen-image-2-pro"
      | "qwen-image-edit-2511",
    resolution?: string,
    quality?: "low" | "medium" | "high" | "auto",
  ) => {
    const mapped = value;
    const resolvedQuality =
      mapped === "openai/gpt-image-2" ? quality || "auto" : undefined;
    const credits = getCreditsForModel(
      mapped,
      undefined,
      // GPT Image 2 isn't priced by "resolution" in our table.
      mapped === "openai/gpt-image-2" ? undefined : resolution,
      undefined,
      undefined,
      resolvedQuality,
    );
    if (credits != null) return credits;
    // Fallback defaults
    if (mapped === "google/nano-banana-pro") {
      if (resolution === "4K") return 620;
      return 320;
    }
    if (mapped === "google/nano-banana-2") {
      if (resolution === "4K") return 322;
      if (resolution === "2K") return 222;
      return 154;
    }
    if (mapped === "openai/gpt-image-2") {
      if (resolvedQuality === "low") return 10;
      if (resolvedQuality === "medium") return 38;
      return 102; // high/auto
    }
    if (mapped === "seedream-v4.5") return 100;
    if (mapped === "seedream-5-lite") return 90;
    if (mapped === "qwen/qwen-image-2-pro") return 170;
    if (mapped === "qwen-image-edit-2511") return 80;
    return 0;
  };

  const liveCredits = useMemo(
    () => getLiveModelCredits(liveModel, liveResolution, liveQuality),
    [liveModel, liveResolution, liveQuality],
  );

  const styleComboCredits = useMemo(
    () => getLiveModelCredits(styleComboModel, styleComboResolution, "auto"),
    [styleComboModel, styleComboResolution],
  );

  useEffect(() => {
    const opts =
      liveResolutionOptionsByModel[styleComboModel] ||
      (["1K", "2K", "4K"] as const);
    if (!opts.includes(styleComboResolution as (typeof opts)[number])) {
      setStyleComboResolution(opts[0] as "1K" | "2K" | "4K");
    }
  }, [styleComboModel, styleComboResolution]);

  const availableModels = useMemo(() => {
    if (selectedFeature === "remove-bg") {
      return [
        {
          label: "851 Labs Remove BG - 1 credit",
          value: "851-labs/background-remover",
        },
        {
          label: "Lucataco Remove BG - 1 credit",
          value: "lucataco/remove-bg",
        },
      ];
    }
    if (selectedFeature === "resize") {
      return [{ label: "Bria Expand", value: "fal-ai/bria/expand" }];
    }
    return [
      { label: "Crystal Upscaler", value: "philz1337x/crystal-upscaler" },
      {
        label: "SeedVR Upscaler (factor)",
        value: "fal-ai/seedvr/upscale/image",
      },
      { label: "Topaz Upscaler", value: "fal-ai/topaz/upscale/image" },
      // { label: "Real-ESRGAN", value: "nightmareai/real-esrgan" },
    ];
  }, [selectedFeature]);

  const liveFrameSizes = [
    { name: "Square", value: "1:1" },
    { name: "Portrait", value: "3:4" },
    { name: "Landscape", value: "4:3" },
    { name: "Wide", value: "16:9" },
    { name: "Vertical", value: "9:16" },
  ];

  const parseOutputUrl = (res: any): string =>
    res?.data?.images?.[0]?.url ||
    res?.data?.data?.images?.[0]?.url ||
    res?.data?.data?.url ||
    res?.data?.url ||
    "";

  // Helper function to upload image to Zata if it's still a blob URL or base64
  // Returns the Zata URL (either already uploaded or newly uploaded)
  const ensureZataUrl = async (
    url: string | null | undefined,
  ): Promise<string | null> => {
    if (!url) return null;
    const normalized = normalizeEditImageUrl(url);
    const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";

    // If normalizeEditImageUrl() rewrote a Zata URL to our local proxy path,
    // convert it back to an absolute Zata URL for provider APIs (Replicate/FAL/etc),
    // which require a fully-qualified public URI.
    try {
      if (normalized.startsWith("/api/proxy/media/")) {
        const encoded = normalized.substring("/api/proxy/media/".length);
        const decoded = decodeURIComponent(encoded);
        if (decoded) return `${ZATA_PREFIX}${decoded}`;
      }
    } catch {
      // fall through
    }

    // If it's already a Zata URL or HTTP URL, use it directly
    if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
      return normalized;
    }

    // If it's a blob URL or base64, upload it to Zata
    if (normalized.startsWith("data:") || normalized.startsWith("blob:")) {
      try {
        console.log(
          "[ensureZataUrl] Uploading image to Zata before generation:",
          normalized.substring(0, 50),
        );
        const resp = await saveUpload({ url: normalized, type: "image" });

        if (resp.responseStatus === "success" && resp.data?.url) {
          const zataUrl = resp.data.url;

          // Update inputs with the Zata URL
          setInputs((prev) => {
            const updated: typeof prev = { ...prev };
            Object.keys(prev).forEach((key) => {
              const currentValue = prev[key as EditFeature];
              if (currentValue === normalized || currentValue === url) {
                updated[key as EditFeature] = zataUrl;
                console.log("[ensureZataUrl] Updated input for feature:", key);
              }
            });
            return updated;
          });

          console.log(
            "[ensureZataUrl] Successfully uploaded to Zata:",
            zataUrl.substring(0, 50),
          );
          return zataUrl;
        } else {
          console.error("[ensureZataUrl] Upload failed:", resp);
          return normalized; // Fallback to original
        }
      } catch (error) {
        console.error("[ensureZataUrl] Error uploading to Zata:", error);
        return normalized; // Fallback to original
      }
    }

    return normalized;
  };

  // Handler to delete an image from the live chat history
  const handleDeleteLiveChatImage = async (
    origIdx: number,
    generationId?: string,
  ) => {
    try {
      // Close the menu first
      setShowThumbnailMenuIdx(null);
      setHoveredThumbnailIdx(null);

      // Capture current state BEFORE any updates
      const currentHistory = [...liveHistory];
      const currentActiveIdx = activeLiveIndex;

      // Optionally delete from server if generationId exists
      if (generationId) {
        try {
          await axiosInstance.delete(`/api/generations/${generationId}`);
        } catch (e) {
          console.error("Failed to delete from server:", e);
          // Continue with local deletion even if server deletion fails
        }
      }

      // Calculate new state based on CURRENT values
      let newActiveIndex = currentActiveIdx;
      let newImageUrl: string | null = null;
      let newHistoryId: string | null = null;

      // If the deleted image was active, switch to another image or reset
      if (currentActiveIdx === origIdx) {
        // Calculate which image to show next based on current array
        if (currentHistory.length > 1) {
          // Determine which image to show based on which index we're deleting
          let imageToShow;
          let newIdxAfterDeletion;

          if (origIdx === 0) {
            // Deleting first image, show what's currently at index 1 (will become index 0)
            imageToShow = currentHistory[1];
            newIdxAfterDeletion = 0;
          } else {
            // Deleting any other image, show the previous one (index doesn't change)
            imageToShow = currentHistory[origIdx - 1];
            newIdxAfterDeletion = origIdx - 1;
          }

          if (imageToShow) {
            newActiveIndex = newIdxAfterDeletion;
            newImageUrl = imageToShow.url;
            newHistoryId = imageToShow.id || null;
          } else {
            // Fallback to input if something went wrong
            newActiveIndex = -1;
            newImageUrl = liveOriginalInput || inputs["live-chat"] || null;
            newHistoryId = null;
          }
        } else {
          // This was the last image, reset to input
          newActiveIndex = -1;
          newImageUrl = liveOriginalInput || inputs["live-chat"] || null;
          newHistoryId = null;
        }
      } else if (currentActiveIdx > origIdx) {
        // Adjust active index if it was after the deleted image
        newActiveIndex = currentActiveIdx - 1;
      }

      // Now update all states together
      setLiveHistory((prev) => {
        const updated = [...prev];
        updated.splice(origIdx, 1);
        return updated;
      });

      // Update active index if it changed
      if (newActiveIndex !== currentActiveIdx) {
        setActiveLiveIndex(newActiveIndex);
      }

      // Update outputs and inputs if the active image changed
      if (currentActiveIdx === origIdx) {
        if (newImageUrl) {
          setOutputs((prev) => ({ ...prev, ["live-chat"]: newImageUrl }));
          setInputs((prev) => ({ ...prev, ["live-chat"]: newImageUrl }));
        } else {
          setOutputs((prev) => ({ ...prev, ["live-chat"]: null }));
          setInputs((prev) => ({ ...prev, ["live-chat"]: null }));
        }
        setCurrentHistoryId(newHistoryId);
      }
    } catch (error) {
      console.error("Error deleting live chat image:", error);
    }
  };

  const handleLiveGenerate = async () => {
    if (!user) {
      saveAutoResumeIntent("image", {
        isEditImage: true,
        selectedFeature: "live-chat",
        inputs,
        livePrompt,
        liveModel,
        liveFrameSize,
        liveResolution,
      });
      router.push(getSignInUrl("/text-to-image/edit-image"));
      return;
    }
    let optimisticDebit = 0;
    try {
      const img =
        inputs["live-chat"] ||
        (activeLiveIndex >= 0 ? liveHistory[activeLiveIndex]?.url : null);
      if (!img) {
        setErrorMsg("Please upload or select an image for Live Chat");
        return;
      }
      if (!livePrompt.trim()) return;

      // Optimistic debit for live chat
      if (liveCredits > 0) {
        try {
          deductCreditsOptimisticForGeneration(liveCredits);
          optimisticDebit = liveCredits;
        } catch {
          /* ignore optimistic errors */
        }
      }

      setProcessing((prev) => ({ ...prev, ["live-chat"]: true }));
      setErrorMsg("");
      setLiveChatMessages((prev) => [
        ...prev,
        { role: "user", text: livePrompt },
        { role: "assistant", text: "Generating...", status: "generating" },
      ]);

      // Upload image to Zata if it's still a blob URL or base64
      const imageUrl = await ensureZataUrl(img);

      const coerceGptImage15AspectRatio = (
        raw?: string,
      ): "1:1" | "3:2" | "2:3" => {
        const v = String(raw || "").trim();
        if (v === "1:1") return "1:1";
        // Portrait-ish ratios in this UI
        if (v === "3:4" || v === "9:16") return "2:3";
        // Landscape-ish ratios in this UI
        return "3:2";
      };

      let out = "";
      let res: any = null;
      if (liveModel === "seedream-v4.5") {
        const payload: any = {
          prompt: livePrompt,
          model: "bytedance/seedream-4.5",
          size: liveResolution,
          aspect_ratio: liveFrameSize,
          image_input: [imageUrl],
          sequential_image_generation: "disabled",
          max_images: 1,
          isPublic: true,
        };
        res = await axiosInstance.post("/api/replicate/generate", payload);
        out = parseOutputUrl(res);
      } else if (liveModel === "openai/gpt-image-2") {
        const payload: any = {
          prompt: livePrompt,
          model: "openai/gpt-image-2",
          // Backend handler supports: prompt, image_urls (edit), image_size, quality, output_format.
          quality: liveQuality,
          output_format: "jpeg",
          uploadedImages: [imageUrl],
          aspect_ratio: liveFrameSize,
          // Let backend map aspect_ratio -> image_size (square_hd / portrait_4_3 / etc).
          // Do NOT send "resolution" here; GPT Image 2 doesn't support it.
          num_images: 1,
          generationType: "live-chat",
          isPublic: true,
        };
        res = await axiosInstance.post("/api/fal/generate", payload);
        out = parseOutputUrl(res);
      } else if (liveModel === "seedream-5-lite") {
        const payload: any = {
          prompt: livePrompt,
          model: "seedream-5-lite",
          size: liveResolution,
          aspect_ratio: liveFrameSize,
          image_input: [imageUrl],
          sequential_image_generation: "disabled",
          max_images: 1,
          generationType: "live-chat",
          isPublic: true,
        };
        res = await axiosInstance.post("/api/replicate/generate", payload);
        out = parseOutputUrl(res);
      } else if (liveModel === "qwen/qwen-image-2-pro") {
        const payload: any = {
          prompt: livePrompt,
          model: "qwen/qwen-image-2-pro",
          uploadedImages: [imageUrl],
          aspect_ratio: liveFrameSize,
          size: liveResolution,
          num_images: 1,
          output_format: "jpg",
          generationType: "live-chat",
          isPublic: true,
        };
        res = await axiosInstance.post("/api/replicate/generate", payload);
        out = parseOutputUrl(res);
      } else if (liveModel === "qwen-image-edit-2511") {
        const payload: any = {
          prompt: livePrompt,
          model: "qwen-image-edit-2511",
          uploadedImages: [imageUrl],
          aspect_ratio: liveFrameSize,
          size: liveResolution,
          num_images: 1,
          output_format: "jpg",
          generationType: "live-chat",
          isPublic: true,
        };
        res = await axiosInstance.post("/api/replicate/generate", payload);
        out = parseOutputUrl(res);
      } else {
        const payload: any = {
          prompt: livePrompt,
          model: liveModel,
          n: 1,
          num_images: 1,
          uploadedImages: [imageUrl],
          output_format: "jpeg",
          frameSize: liveFrameSize,
          aspect_ratio: liveFrameSize,
          size: liveResolution,
          resolution: liveResolution,
          generationType: "live-chat",
        };
        res = await axiosInstance.post("/api/fal/generate", payload);
        out = parseOutputUrl(res);
      }

      if (out) {
        // Extract ID from response (support both Replicate and Fal structures)
        // Replicate: res.data.id
        // Fal: res.data.request_id (or sometimes directly in data)
        const generationId =
          res?.data?.id || res?.data?.request_id || res?.data?.data?.request_id; // Try to find an ID

        setOutputs((prev) => ({ ...prev, ["live-chat"]: out }));
        setLiveHistory((prev) => [...prev, { id: generationId, url: out }]);
        setActiveLiveIndex((prev) => (prev + 1 >= 0 ? prev + 1 : 0));
        setCurrentHistoryId(generationId || null); // Set current ID for deletion logic
        // Preserve the original input used for this generation so it can be shown
        // in the right-side thumbnail column below generated images.
        if (!liveOriginalInput && inputs["live-chat"]) {
          setLiveOriginalInput(inputs["live-chat"] as string);
        }
        // Continue using the latest generated image as the working input
        setInputs((prev) => ({ ...prev, ["live-chat"]: out }));
      }

      try {
        await refreshCredits();
      } catch { }

      setLiveChatMessages((prev) => {
        const idx = prev.findIndex(
          (m) => m.status === "generating" && m.role === "assistant",
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            role: "assistant",
            text: "Image generated",
            status: "done",
          };
          return copy;
        }
        return prev;
      });
    } catch (err: any) {
      // Roll back optimistic debit on failure
      if (optimisticDebit > 0) {
        try {
          rollbackOptimisticDeduction(liveCredits);
        } catch { }
      }
      setErrorMsg(
        err?.response?.data?.message || err?.message || "Generation failed",
      );
      setLiveChatMessages((prev) => {
        const idx = prev.findIndex(
          (m) => m.status === "generating" && m.role === "assistant",
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            role: "assistant",
            text: "Generation failed",
            status: "done",
          };
          return copy;
        }
        return prev;
      });
    } finally {
      setProcessing((prev) => ({ ...prev, ["live-chat"]: false }));
      setLivePrompt("");
    }
  };
  const selectedGeneratorModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "flux-dev",
  );
  const frameSize = useAppSelector(
    (state: any) => state.generation?.frameSize || "1:1",
  );
  const selectedStyle = useAppSelector(
    (state: any) => state.generation?.style || "none",
  );
  const reduxUploadedImages = useAppSelector(
    (state: any) => state.generation?.uploadedImages || [],
  );
  const dispatch = useAppDispatch();

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Get raw history entries from Redux
  const allHistoryEntries = useAppSelector(
    (s: any) => s.history?.entries || [],
  );
  const historyLoading = useAppSelector(
    (s: any) => s.history?.loading || false,
  );
  const historyHasMore = useAppSelector(
    (s: any) => s.history?.hasMore || false,
  );
  const historyFilters = useAppSelector((s: any) => s.history?.filters || {});
  const historyError = useAppSelector((s: any) => s.history?.error || null);

  // Memoize filtered history entries to prevent unnecessary rerenders
  const historyEntries = useMemo(() => {
    console.log("[EditImage] Filtering history entries:", {
      totalRawEntries: allHistoryEntries.length,
      filters: historyFilters,
    });

    const filtered = allHistoryEntries.filter((e: any) => {
      const isTextToImage = e.generationType === "text-to-image";
      const isCompleted = e.status === "completed";
      const hasImages = Array.isArray(e.images) && e.images.length > 0;
      const passes = isTextToImage && isCompleted && hasImages;

      if (!passes && isTextToImage) {
        console.log("[EditImage] Entry filtered out:", {
          id: e.id,
          status: e.status,
          hasImages: hasImages,
          imagesCount: Array.isArray(e.images) ? e.images.length : 0,
        });
      }

      return passes;
    });

    console.log("[EditImage] Filtered history entries result:", {
      filteredCount: filtered.length,
      rawCount: allHistoryEntries.length,
    });

    return filtered;
  }, [allHistoryEntries, historyFilters]);

  // Flatten history entries into UploadModal-friendly image items (similar shape to LibraryItem)
  const uploadModalHistoryEntries = useMemo(() => {
    const items: any[] = [];
    try {
      for (const entry of historyEntries as any[]) {
        const images = Array.isArray(entry?.images) ? entry.images : [];
        images.forEach((img: any, index: number) => {
          const storagePath = img?.storagePath || img?.storage_path;
          const url =
            storagePath ||
            img?.thumbnailUrl ||
            img?.avifUrl ||
            img?.url ||
            img?.originalUrl;

          if (!url) return;

          items.push({
            id: img?.id || `${entry.id || "history"}-${index}`,
            historyId: entry.id,
            url,
            type: "image",
            storagePath,
            originalUrl: img?.originalUrl || img?.url || storagePath,
            thumbnailUrl: img?.thumbnailUrl || img?.avifUrl || undefined,
            avifUrl: img?.avifUrl || undefined,
          });
        });
      }
    } catch (e) {
      // If anything goes wrong, fall back to empty list so modal still renders
      console.error(
        "[EditImage] Failed to build uploadModalHistoryEntries:",
        e,
      );
    }
    return items;
  }, [historyEntries]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTabChangeRef = useRef<string | null>(null);

  // Initialize from query params: feature and image + self-managed history load for library images
  // Use forceInitial to bypass cache on mount
  const { refreshImmediate: refreshHistoryImmediate } = useHistoryLoader({
    generationType: "text-to-image",
    initialLimit: 30,
    forceInitial: true, // Force initial load, bypass cache
  });

  // Load history when upload modal opens - ALWAYS make fresh API call
  const modalOpenedRef = useRef(false);
  useEffect(() => {
    if (isUploadOpen && !modalOpenedRef.current) {
      modalOpenedRef.current = true;
      // Always make fresh API call when modal opens
      refreshHistoryImmediate(30, true);
    } else if (!isUploadOpen) {
      modalOpenedRef.current = false;
    }
  }, [isUploadOpen, refreshHistoryImmediate]);

  // Log history entries when they change (for debugging)
  useEffect(() => {
    console.log("[EditImage] History state changed:", {
      allHistoryEntriesCount: allHistoryEntries.length,
      filteredHistoryEntriesCount: historyEntries.length,
      loading: historyLoading,
      hasMore: historyHasMore,
      filters: historyFilters,
      error: historyError,
      isModalOpen: isUploadOpen,
    });

    if (isUploadOpen && historyEntries.length > 0) {
      console.log(
        "[EditImage] Sample history entries (first 3):",
        historyEntries.slice(0, 3).map((e: any) => ({
          id: e.id,
          generationType: e.generationType,
          status: e.status,
          imagesCount: Array.isArray(e.images) ? e.images.length : 0,
          firstImageUrl: e.images?.[0]?.url?.substring(0, 50) + "...",
        })),
      );
    }
  }, [
    allHistoryEntries.length,
    historyEntries.length,
    historyLoading,
    historyHasMore,
    historyFilters,
    historyError,
    isUploadOpen,
  ]);
  useEffect(() => {
    try {
      // Allow tab selection via query or path (for /edit-image/fill)
      const featureParam =
        (searchParams?.get("feature") || "").toLowerCase() ||
        (typeof window !== "undefined" &&
          window.location.pathname.includes("/edit-image/fill")
          ? "fill"
          : "");
      const imageParam = searchParams?.get("image") || "";
      const storagePathParam = searchParams?.get("sp") || "";
      const validFeature = [
        "upscale",
        "remove-bg",
        "resize",
        "fill",
        "vectorize",
        "erase",
        "expand",
        "reimagine",
        "live-chat",
      ].includes(featureParam)
        ? (featureParam as EditFeature)
        : null;
      if (validFeature) {
        setSelectedFeature(validFeature);
        // Set default model based on feature
        if (validFeature === "remove-bg") {
          setModel("851-labs/background-remover");
        } else if (validFeature === "upscale") {
          setModel("philz1337x/crystal-upscaler");
        } else if (validFeature === "resize") {
          setModel("fal-ai/bria/expand");
        } else if (validFeature === "fill") {
          setModel("fal-ai/bria/genfill" as any);
        } else if (validFeature === "vectorize") {
          setModel("fal-ai/recraft/vectorize" as any);
        }
        // Prefer raw storage path if provided; use frontend proxy URL for preview rendering
        if (storagePathParam) {
          const decodedPath = decodeURIComponent(storagePathParam).replace(
            /^\/+/,
            "",
          );
          const ZATA_PREFIX = (
            process.env.NEXT_PUBLIC_ZATA_PREFIX || ""
          ).replace(/\/$/, "/");
          // Ensure we always pass a valid Next/Image src:
          // - If ZATA_PREFIX is configured, build absolute CDN URL.
          // - Otherwise, fall back to our resource proxy with a leading slash.
          const directUrl = decodedPath
            ? ZATA_PREFIX
              ? `${ZATA_PREFIX}${decodedPath}`
              : `/api/proxy/resource/${encodeURIComponent(decodedPath)}`
            : "";
          // Apply to all features so switching tabs preserves the same input
          setInputs({
            upscale: directUrl,
            "remove-bg": directUrl,
            resize: directUrl,
            fill: directUrl,
            vectorize: directUrl,
            erase: directUrl,
            expand: directUrl,
            reimagine: directUrl,
            "live-chat": directUrl,
            "style-combination": directUrl,
          });
        } else if (imageParam && imageParam.trim() !== "") {
          const normalizedImageParam = normalizeEditImageUrl(imageParam);
          setInputs({
            upscale: normalizedImageParam,
            "remove-bg": normalizedImageParam,
            resize: normalizedImageParam,
            fill: normalizedImageParam,
            vectorize: normalizedImageParam,
            erase: normalizedImageParam,
            expand: normalizedImageParam,
            reimagine: normalizedImageParam,
            "live-chat": normalizedImageParam,
            "style-combination": normalizedImageParam,
          });
        }
      } else if (imageParam && imageParam.trim() !== "") {
        // Fallback: if only image provided, attach to current feature
        const normalizedImageParam = normalizeEditImageUrl(imageParam);
        setInputs({
          upscale: normalizedImageParam,
          "remove-bg": normalizedImageParam,
          resize: normalizedImageParam,
          fill: normalizedImageParam,
          vectorize: normalizedImageParam,
          erase: normalizedImageParam,
          expand: normalizedImageParam,
          reimagine: normalizedImageParam,
          "live-chat": normalizedImageParam,
          "style-combination": normalizedImageParam,
        });
      }
    } catch { }
    // Only run once on mount for initial hydration from URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure Bria is the default model when switching to Resize
  useEffect(() => {
    if (selectedFeature === "resize" && model !== "fal-ai/bria/expand") {
      setModel("fal-ai/bria/expand");
    }
  }, [selectedFeature]);

  // Ensure Seedream 5 Lite is the default model when switching to Replace/Erase.
  // Reimagine keeps Google Nano Banana default behavior.
  useEffect(() => {
    if (selectedFeature === "fill" || selectedFeature === "erase") {
      if (model !== "seedream-5-lite") {
        setModel("seedream-5-lite");
      }
    } else if (selectedFeature === "reimagine") {
      if (model !== "google_nano_banana") {
        setModel("google_nano_banana");
      }
    }
    // Reset reimagine state when switching features
    if (selectedFeature !== "reimagine") {
      setReimagineSelectionConfirmed(false);
      setReimaginePrompt("");
      setReimagineSelectionBounds(null);
      setReimagineSelectionBounds(null);
      setReimagineLiveBounds(null);
      setReimagineReferenceImage(null);
    }
  }, [selectedFeature, model]);

  // Reimagine State
  const [reimagineReferenceImage, setReimagineReferenceImage] = useState<
    string | null
  >(null);

  // Ensure Seedream is the default model when switching to Expand
  useEffect(() => {
    if (selectedFeature === "expand") {
      // Always use Seedream for Expand feature
      if (model !== "seedream_4") {
        setModel("seedream_4");
      }
    }
  }, [selectedFeature, model]);

  // Initialize expand bounds when image loads
  useEffect(() => {
    if (
      selectedFeature === "expand" &&
      expandOriginalSize.width > 0 &&
      expandOriginalSize.height > 0
    ) {
      // Initialize bounds to original image (no expansion)
      setExpandBounds({ left: 0, top: 0, right: 0, bottom: 0 });
      setExpandCustomWidth(expandOriginalSize.width);
      setExpandCustomHeight(expandOriginalSize.height);
      setExpandEffectiveWidth(expandOriginalSize.width);
      setExpandEffectiveHeight(expandOriginalSize.height);
    }
  }, [selectedFeature, expandOriginalSize]);

  // Helper: normalize requested selection into provider constraints (Seedream: 1024..4096)
  const normalizeExpandDims = useCallback((w: number, h: number) => {
    const MIN = 1024;
    const MAX = 4096;
    if ((w < MIN || h < MIN) && Math.min(w, h) >= 512) {
      const factor = MIN / Math.min(w, h);
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
    w = Math.max(MIN, Math.min(MAX, w));
    h = Math.max(MIN, Math.min(MAX, h));
    const snap = (n: number) => n - (n % 8);
    return { w: snap(w), h: snap(h) };
  }, []);

  // Update expand dimensions when bounds change
  useEffect(() => {
    if (
      selectedFeature === "expand" &&
      expandOriginalSize.width > 0 &&
      expandOriginalSize.height > 0
    ) {
      // Calculate cropped region (negative bounds mean cropping)
      const cropLeft = Math.max(0, -expandBounds.left);
      const cropTop = Math.max(0, -expandBounds.top);
      const cropRight = Math.max(0, -expandBounds.right);
      const cropBottom = Math.max(0, -expandBounds.bottom);

      // Cropped dimensions
      const croppedWidth = expandOriginalSize.width - cropLeft - cropRight;
      const croppedHeight = expandOriginalSize.height - cropTop - cropBottom;

      // Expansion beyond cropped region (positive bounds)
      const expandLeft = Math.max(0, expandBounds.left);
      const expandTop = Math.max(0, expandBounds.top);
      const expandRight = Math.max(0, expandBounds.right);
      const expandBottom = Math.max(0, expandBounds.bottom);

      // Final dimensions = cropped region + expansion
      const newWidth = croppedWidth + expandLeft + expandRight;
      const newHeight = croppedHeight + expandTop + expandBottom;

      // Round to integers and clamp to valid range (64-4096); allow heights < 1024 when cropping
      const clamp = (v: number) => Math.max(64, Math.min(4096, Math.round(v)));
      const rw = clamp(newWidth);
      const rh = clamp(newHeight);
      setExpandCustomWidth(rw);
      setExpandCustomHeight(rh);
      const eff = normalizeExpandDims(rw, rh);
      setExpandEffectiveWidth(eff.w);
      setExpandEffectiveHeight(eff.h);
    }
  }, [expandBounds, expandOriginalSize, selectedFeature, normalizeExpandDims]);

  // Populate resize fields when switching to resize feature if image is already loaded
  useEffect(() => {
    if (
      selectedFeature === "resize" &&
      model === "fal-ai/bria/expand" &&
      inputNaturalSize.width > 0 &&
      inputNaturalSize.height > 0
    ) {
      // Update original image size to match detected dimensions
      setResizeOrigW(inputNaturalSize.width);
      setResizeOrigH(inputNaturalSize.height);
      // Update canvas size to match detected dimensions
      // This ensures fields are populated when switching to resize feature
      setResizeCanvasW(inputNaturalSize.width);
      setResizeCanvasH(inputNaturalSize.height);
      // Reset margins when entering resize tab
      setExpandLeftPx(0);
      setExpandRightPx(0);
      setExpandTopPx(0);
      setExpandBottomPx(0);
    }
  }, [selectedFeature, model, inputNaturalSize]);

  // State restoration for auto-resume
  useEffect(() => {
    if (typeof window === "undefined") return;
    const intent = getAutoResumeIntent();
    if (intent && intent.type === "image" && intent.data?.isEditImage) {
      console.log("[EditImage] Auto-resuming editor state:", intent.data);
      const data = intent.data;
      if (data.selectedFeature) setSelectedFeature(data.selectedFeature);
      if (data.inputs) setInputs(data.inputs);
      if (data.model) setModel(data.model);
      if (data.prompt) setPrompt(data.prompt);
      if (data.scaleFactor) setScaleFactor(data.scaleFactor);
      if (data.faceEnhance !== undefined) setFaceEnhance(data.faceEnhance);
      if (data.swinTask) setSwinTask(data.swinTask);
      if (data.expandBounds) setExpandBounds(data.expandBounds);
      if (data.expandAspectRatio) setExpandAspectRatio(data.expandAspectRatio);
      if (data.eraseBrushSize) setEraseBrushSize(data.eraseBrushSize);
      if (data.eraseActionMode) setEraseActionMode(data.eraseActionMode);
      if (data.erasePrompt) setErasePrompt(data.erasePrompt);
      if (data.reimaginePrompt) setReimaginePrompt(data.reimaginePrompt);
      if (data.reimagineModel) setReimagineModel(data.reimagineModel);
      if (data.reimagineSelectionMode)
        setReimagineSelectionMode(data.reimagineSelectionMode);
      if (data.topazModel) setTopazModel(data.topazModel);
      if (data.topazUpscaleFactor)
        setTopazUpscaleFactor(data.topazUpscaleFactor);
      if (data.seedvrUpscaleFactor)
        setSeedvrUpscaleFactor(data.seedvrUpscaleFactor);
      if (data.resizeAspectRatio) setResizeAspectRatio(data.resizeAspectRatio);
      if (data.livePrompt) setLivePrompt(data.livePrompt);
      if (data.liveModel) setLiveModel(data.liveModel);
      if (data.liveFrameSize) setLiveFrameSize(data.liveFrameSize);
      if (data.liveResolution) setLiveResolution(data.liveResolution);
      if (data.styleComboModel) setStyleComboModel(data.styleComboModel);
      if (data.styleComboFrameSize)
        setStyleComboFrameSize(data.styleComboFrameSize);
      if (data.styleComboResolution)
        setStyleComboResolution(data.styleComboResolution);
      if (Array.isArray(data.styleComboSelectedIds))
        setStyleComboSelectedIds(data.styleComboSelectedIds);
      if (typeof data.styleComboExtraPrompt === "string")
        setStyleComboExtraPrompt(data.styleComboExtraPrompt);
      if (data.styleComboTab) setStyleComboTab(data.styleComboTab);
      if (data.styleComboIndianVersion)
        setStyleComboIndianVersion(data.styleComboIndianVersion);

      clearAutoResumeIntent();
    }
  }, [user]);

  // Auto-detect input image dimensions and prefill Bria fields
  // Ensure we always know the natural dimensions of the input image so any mask
  // that we export can be scaled to the image's pixel size. This runs whenever
  // inputs change and picks the first available input image across features.
  useEffect(() => {
    const src =
      inputs.upscale ||
      inputs["remove-bg"] ||
      inputs.resize ||
      inputs.fill ||
      inputs.vectorize ||
      inputs[selectedFeature];
    if (!src) return;
    // Note: we intentionally run this regardless of currently selected feature
    // so mask export (fill/remove-bg) can scale to the true image pixel size.
    (async () => {
      try {
        let measurableSrc = String(src);
        // Make relative paths absolute for Image measurement
        if (!/^https?:|^data:|^blob:/i.test(measurableSrc)) {
          measurableSrc = new URL(measurableSrc, window.location.origin).href;
        }
        // If it's a proxy path that streams, load via fetch->blob to avoid CORS hiccups, then measure
        const needsBlob =
          measurableSrc.startsWith(window.location.origin) ||
          measurableSrc.startsWith("/");
        if (needsBlob && !/^data:|^blob:/i.test(measurableSrc)) {
          try {
            const resp = await fetch(measurableSrc, { cache: "force-cache" });
            const blob = await resp.blob();
            measurableSrc = URL.createObjectURL(blob);
          } catch {
            // fallback to direct src
          }
        }
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const w = Math.max(1, Math.floor(img.naturalWidth || 0));
            const h = Math.max(1, Math.floor(img.naturalHeight || 0));
            setInputNaturalSize({ width: w, height: h });
            // Auto-populate resize fields when resize feature is selected and using Bria Expand
            if (
              selectedFeature === "resize" &&
              model === "fal-ai/bria/expand"
            ) {
              // Always update original image size to match input image dimensions
              setResizeOrigW(w);
              setResizeOrigH(h);
              // Always update canvas size to match input image dimensions when a new image is loaded
              // This ensures both fields reflect the current input image dimensions
              setResizeCanvasW(w);
              setResizeCanvasH(h);
              // Reset interactive margins
              setExpandLeftPx(0);
              setExpandRightPx(0);
              setExpandTopPx(0);
              setExpandBottomPx(0);
            }
            try {
              if (measurableSrc.startsWith("blob:"))
                URL.revokeObjectURL(measurableSrc);
            } catch { }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = measurableSrc;
        });
      } catch { }
    })();
  }, [inputs, selectedFeature, model]);

  // Zoom and pan utility functions (improved from ImagePreviewModal)
  const clampOffset = useCallback(
    (newOffset: { x: number; y: number }, currentScale: number) => {
      if (!imageContainerRef.current) return newOffset;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const imgW = naturalSize.width * currentScale;
      const imgH = naturalSize.height * currentScale;
      const maxX = Math.max(0, (imgW - rect.width) / 2);
      const maxY = Math.max(0, (imgH - rect.height) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, newOffset.x)),
        y: Math.max(-maxY, Math.min(maxY, newOffset.y)),
      };
    },
    [naturalSize],
  );

  const zoomToPoint = useCallback(
    (point: { x: number; y: number }, newScale: number) => {
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const newOffsetX = centerX - point.x * newScale;
      const newOffsetY = centerY - point.y * newScale;
      const clamped = clampOffset({ x: newOffsetX, y: newOffsetY }, newScale);
      setScale(newScale);
      setOffset(clamped);
    },
    [clampOffset],
  );

  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current) return;

      const container = imageContainerRef.current;
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (Math.abs(scale - fitScale) < 1e-3) {
        // Zoom to 1.5x at click point (more reasonable)
        zoomToPoint({ x: clickX, y: clickY }, Math.min(6, fitScale * 1.5));
      } else {
        // Reset to fit
        resetZoom();
      }
    },
    [scale, fitScale, zoomToPoint, resetZoom],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPanning(true);
    setLastPoint({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning) return;

      e.preventDefault();
      const deltaX = e.clientX - lastPoint.x;
      const deltaY = e.clientY - lastPoint.y;

      const newOffset = {
        x: offset.x + deltaX,
        y: offset.y + deltaY,
      };

      const clampedOffset = clampOffset(newOffset, scale);
      setOffset(clampedOffset);
      setLastPoint({ x: e.clientX, y: e.clientY });
    },
    [isPanning, scale, offset, lastPoint, clampOffset],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!imageContainerRef.current) return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const next = Math.max(0.1, Math.min(6, scale + delta));
      if (next !== scale) zoomToPoint({ x: mx, y: my }, next);
    },
    [scale, zoomToPoint],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const newScale = Math.min(6, scale + 0.1);
        if (newScale !== scale) {
          setScale(newScale);
          setOffset(clampOffset(offset, newScale));
        }
      } else if (e.key === "-") {
        e.preventDefault();
        const newScale = Math.max(0.1, scale - 0.1);
        if (newScale !== scale) {
          setScale(newScale);
          setOffset(clampOffset(offset, newScale));
        }
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    },
    [scale, offset, clampOffset, resetZoom],
  );

  // Reset offsets on image change; scale will be computed on image load
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [outputs[selectedFeature]]);

  // Debug: Log when outputs change
  useEffect(() => {
    console.log("[EditImage] outputs changed:", {
      selectedFeature,
      "remove-bg": outputs["remove-bg"],
      outputs: outputs[selectedFeature],
      allOutputs: outputs,
    });
  }, [outputs, selectedFeature]);

  // Recompute fit scale when container resizes or natural size changes
  useEffect(() => {
    if (!imageContainerRef.current || !naturalSize.width || !naturalSize.height)
      return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const fitCandidate =
      Math.min(
        rect.width / naturalSize.width,
        rect.height / naturalSize.height,
      ) || 1;
    const newFit = Math.min(1, fitCandidate); // do not upscale by default
    const centerOffset = { x: 0, y: 0 };
    setFitScale(newFit);
    setScale(1); // Always start at 100% zoom
    setOffset(centerOffset);
  }, [naturalSize]);
  useEffect(() => {
    const handleResize = () => {
      if (
        !imageContainerRef.current ||
        !naturalSize.width ||
        !naturalSize.height
      )
        return;
      const rect = imageContainerRef.current.getBoundingClientRect();
      const fitCandidate =
        Math.min(
          rect.width / naturalSize.width,
          rect.height / naturalSize.height,
        ) || 1;
      const newFit = Math.min(1, fitCandidate);
      const centerOffset = { x: 0, y: 0 };
      setFitScale(newFit);
      setScale(1); // Always reset to 100% zoom on resize
      setOffset(centerOffset);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [naturalSize]);

  // Prevent page scroll when mouse is over image container
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (
        imageContainerRef.current &&
        imageContainerRef.current.contains(e.target as Node)
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add passive: false to allow preventDefault
    document.addEventListener("wheel", handleGlobalWheel, { passive: false });

    return () => {
      document.removeEventListener("wheel", handleGlobalWheel);
    };
  }, []);

  // Prevent page scroll on Space when the image viewer has focus
  useEffect(() => {
    const handleSpaceScrollBlock = (e: KeyboardEvent) => {
      if (e.key === " " && imageContainerRef.current) {
        const active = document.activeElement;
        if (active && imageContainerRef.current.contains(active)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener("keydown", handleSpaceScrollBlock, {
      passive: false,
    } as any);
    return () =>
      window.removeEventListener("keydown", handleSpaceScrollBlock as any);
  }, []);

  // Lock page scroll while Edit Image is mounted.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Close image menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close image actions menu
      if (showImageMenu) {
        const target = event.target as Node | null;
        const menuEl = menuRef.current;
        const btnEl = menuButtonRef.current;
        if (menuEl && menuEl.contains(target as Node)) return;
        if (btnEl && btnEl.contains(target as Node)) return;
        setShowImageMenu(false);
      }

      // Close edit dropdowns (model/output)
      if (activeDropdown) {
        const el = event.target as HTMLElement | null;
        if (!(el && el.closest(".edit-dropdown"))) {
          setActiveDropdown("");
        }
      }
      if (styleComboDropdown) {
        const el = event.target as HTMLElement | null;
        if (!(el && el.closest(".edit-dropdown"))) {
          setStyleComboDropdown("");
        }
      }
    };

    if (showImageMenu || activeDropdown || styleComboDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImageMenu, activeDropdown, styleComboDropdown]);

  // Debug menu state
  useEffect(() => {
    if (showImageMenu) {
      console.log("🎯 MENU IS NOW VISIBLE! showImageMenu:", showImageMenu);
      console.log(
        "TEST: Menu is now visible, outputs:",
        outputs[selectedFeature],
      );
    }
  }, [showImageMenu, outputs, selectedFeature]);

  const features = [
    {
      id: "upscale",
      label: "Upscale",
      description: "Increase resolution while preserving details",
    },
    {
      id: "remove-bg",
      label: "Remove BG",
      description: "Remove background from your image",
    },
    {
      id: "fill",
      label: "Erase/Replace",
      description: "Mask areas to regenerate with a prompt",
    },
    // { id: 'erase', label: 'Erase', description: 'Erase masked areas from the image' },
    // { id: 'expand', label: 'Expand', description: 'Expand image by stretching canvas boundaries' },
    {
      id: "resize",
      label: "Expand",
      description: "Expand image to specific dimensions",
    },
    {
      id: "vectorize",
      label: "Vectorize",
      description: "Convert raster to SVG vector",
    },
    // Reimagine feature is temporarily hidden from the tab list but kept in state for type-safety
    // { id: 'reimagine', label: 'Reimagine', description: 'Reimagine your image with AI' },
    {
      id: "live-chat",
      label: "Chat to Edit",
      description: "Chat-driven edits & regenerations",
    },
    {
      id: "style-combination",
      label: "Style Combination",
      description: "Combine styles from multiple images",
    },
  ] as const;

  // Feature preview assets and display labels
  const featurePreviewGif: Record<EditFeature, string> = {
    upscale: "https://idr01.zata.ai/devstoragev1/public/editimage/upscale-banner.avif",
    "remove-bg": "https://idr01.zata.ai/devstoragev1/public/editimage/removebg-banner.avif",
    fill:
      eraseActionMode === "erase"
        ? "https://idr01.zata.ai/devstoragev1/public/editimage/erase-banner.avif"
        : "https://idr01.zata.ai/devstoragev1/public/editimage/replace-banner.avif",
    erase: "https://idr01.zata.ai/devstoragev1/public/editimage/erase-banner.avif",
    expand: "https://idr01.zata.ai/devstoragev1/public/editimage/resize-banner.avif",
    resize: "https://idr01.zata.ai/devstoragev1/public/editimage/resize-banner.avif",
    vectorize: "https://idr01.zata.ai/devstoragev1/public/editimage/vector-banner.avif",
    reimagine: "https://idr01.zata.ai/devstoragev1/public/editimage/replace-banner.avif",
    "live-chat": "https://idr01.zata.ai/devstoragev1/public/editimage/resize-banner.avif",
    "style-combination":
      "https://idr01.zata.ai/devstoragev1/public/editimage/resize-banner.avif",
  };
  const featureDisplayName: Record<EditFeature, string> = {
    upscale: "Upscale",
    "remove-bg": "Remove BG",
    fill: eraseActionMode === "erase" ? "Erase" : "Replace",
    erase: "Erase",
    expand: "Expand",
    resize: "Expand",
    vectorize: "Vectorize",
    reimagine: "Reimagine",
    "live-chat": "Live Chat",
    "style-combination": "Style Combination",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = e.target?.result as string;
        // Apply selected image to all features
        setInputs({
          upscale: img,
          "remove-bg": img,
          resize: img,
          fill: img,
          vectorize: img,
          erase: img,
          expand: img,
          reimagine: img,
          "live-chat": img,
          "style-combination": img,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenUploadModal = () => setIsUploadOpen(true);

  // Fill: canvas helpers for mask drawing
  const getCanvasContext = useCallback(() => {
    const c = fillCanvasRef.current;
    if (!c) return null as any;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    // Ensure the transform is set correctly (it should be set in resizeCanvasToContainer)
    // But we verify it's correct here to handle edge cases
    const dpr = window.devicePixelRatio || 1;
    const currentTransform = ctx.getTransform();
    // We check if scale is 1 when DPR > 1, which would indicate transform wasn't applied
    if (dpr > 1 && currentTransform.a === 1 && currentTransform.d === 1) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
    return ctx;
  }, []);

  const resizeCanvasToContainer = useCallback(() => {
    const container = fillContainerRef.current;
    const canvas = fillCanvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save existing canvas content if there's a mask
    let savedDataUrl: string | null = null;
    if (hasMask) {
      try {
        savedDataUrl = canvas.toDataURL("image/png");
      } catch (e) {
        // If toDataURL fails, continue without saving
      }
    }

    const oldWidth = canvas.width / dpr;
    const oldHeight = canvas.height / dpr;
    const newWidth = Math.floor(rect.width * dpr);
    const newHeight = Math.floor(rect.height * dpr);

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const newCtx = getCanvasContext();
    if (newCtx) {
      newCtx.setTransform(1, 0, 0, 1, 0, 0);
      newCtx.scale(dpr, dpr);

      // Ensure canvas is transparent
      newCtx.clearRect(0, 0, rect.width, rect.height);

      // Restore saved content if it exists
      if (savedDataUrl) {
        const img = document.createElement("img");
        img.onload = () => {
          const currentCtx = fillCanvasRef.current?.getContext("2d");
          if (currentCtx) {
            currentCtx.setTransform(1, 0, 0, 1, 0, 0);
            currentCtx.scale(dpr, dpr);
            currentCtx.clearRect(0, 0, rect.width, rect.height);
            currentCtx.drawImage(img, 0, 0, rect.width, rect.height);
          }
        };
        img.src = savedDataUrl;
      } else {
        // No mask to preserve, ensure canvas is transparent
        newCtx.clearRect(0, 0, rect.width, rect.height);
        setHasMask(false);
      }
    }
  }, [getCanvasContext, hasMask]);

  useEffect(() => {
    if (
      selectedFeature !== "fill" &&
      selectedFeature !== "erase" &&
      selectedFeature !== "reimagine"
    )
      return;
    const onResize = () => resizeCanvasToContainer();
    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      resizeCanvasToContainer();
    }, 0);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize);
    };
  }, [selectedFeature, resizeCanvasToContainer]);

  // Recreate canvas when image changes on Fill or Erase or Reimagine
  useEffect(() => {
    if (
      selectedFeature !== "fill" &&
      selectedFeature !== "erase" &&
      selectedFeature !== "reimagine"
    )
      return;
    // Use setTimeout to ensure DOM is ready after image loads
    const timeoutId = setTimeout(() => {
      resizeCanvasToContainer();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [
    inputs.fill,
    inputs.erase,
    inputs.reimagine,
    selectedFeature,
    resizeCanvasToContainer,
  ]);

  const beginMaskStroke = useCallback(
    (x: number, y: number) => {
      const ctx = getCanvasContext();
      if (!ctx) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;
      ctx.globalCompositeOperation = eraseMode
        ? "destination-out"
        : "source-over";
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.strokeStyle = "rgba(255,255,255,1)";

      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsMasking(true);
      setHasMask(true);
    },
    [brushSize, eraseMode, getCanvasContext],
  );

  const continueMaskStroke = useCallback(
    (x: number, y: number) => {
      if (!isMasking) return;
      const ctx = getCanvasContext();
      if (!ctx) return;

      // The context is already scaled by DPR, so we use brushSize directly
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = brushSize;
      ctx.globalCompositeOperation = eraseMode
        ? "destination-out"
        : "source-over";
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.strokeStyle = "rgba(255,255,255,1)";

      // Continue the existing path - this creates a smooth continuous line
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw a filled circle at the current point to ensure complete coverage
      // This prevents gaps when moving the mouse quickly
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Continue the path from current point (don't start a new path)
      // This ensures smooth continuous strokes
      ctx.beginPath();
      ctx.moveTo(x, y);
      setHasMask(true);

      // For reimagine: Update live bounds in real-time for visual feedback
      if (selectedFeature === "reimagine") {
        requestAnimationFrame(() => {
          const canvas = fillCanvasRef.current;
          if (canvas) {
            const ctx2 = canvas.getContext("2d");
            if (ctx2) {
              const imageData = ctx2.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const data = imageData.data;
              let minX = canvas.width,
                minY = canvas.height,
                maxX = 0,
                maxY = 0;
              let found = false;

              for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                  const idx = (y * canvas.width + x) * 4;
                  const r = data[idx];
                  const g = data[idx + 1];
                  const b = data[idx + 2];
                  const a = data[idx + 3];
                  if (a > 128 && r > 200 && g > 200 && b > 200) {
                    found = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  }
                }
              }

              if (found) {
                const container = fillContainerRef.current;
                if (container) {
                  const rect = container.getBoundingClientRect();
                  const scaleX = rect.width / canvas.width;
                  const scaleY = rect.height / canvas.height;
                  setReimagineLiveBounds({
                    x: minX * scaleX,
                    y: minY * scaleY,
                    width: (maxX - minX) * scaleX,
                    height: (maxY - minY) * scaleY,
                  });
                }
              }
            }
          }
        });
      }
    },
    [isMasking, brushSize, eraseMode, getCanvasContext, selectedFeature],
  );

  const endMaskStroke = useCallback(() => {
    if (!isMasking) return;
    const ctx = getCanvasContext();
    if (ctx) ctx.closePath();
    setIsMasking(false);

    // For reimagine: Calculate selection bounds when stroke ends
    if (selectedFeature === "reimagine" && hasMask) {
      const canvas = fillCanvasRef.current;
      if (canvas) {
        const ctx2 = canvas.getContext("2d");
        if (ctx2) {
          const imageData = ctx2.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const data = imageData.data;
          let minX = canvas.width,
            minY = canvas.height,
            maxX = 0,
            maxY = 0;
          let found = false;

          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];
              if (a > 128 && r > 200 && g > 200 && b > 200) {
                found = true;
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }

          if (found) {
            const container = fillContainerRef.current;
            if (container) {
              const rect = container.getBoundingClientRect();
              const scaleX = rect.width / canvas.width;
              const scaleY = rect.height / canvas.height;
              setReimagineSelectionBounds({
                x: minX * scaleX,
                y: minY * scaleY,
                width: (maxX - minX) * scaleX,
                height: (maxY - minY) * scaleY,
              });
            }
          }
        }
      }
    }
  }, [isMasking, getCanvasContext, selectedFeature, hasMask]);

  // Expand: Canvas helpers for interactive expansion
  const getExpandCanvasContext = useCallback(() => {
    const c = expandCanvasRef.current;
    if (!c) return null as any;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    return ctx;
  }, []);

  const drawExpandCanvas = useCallback(() => {
    if (selectedFeature !== "expand") return;
    const ctx = getExpandCanvasContext();
    if (!ctx) return;
    const container = expandContainerRef.current;
    if (
      !container ||
      expandOriginalSize.width === 0 ||
      expandOriginalSize.height === 0
    )
      return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvas = expandCanvasRef.current;
    if (!canvas) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    // Reset any previous transform before scaling. Without this the scale accumulated
    // on repeated draws, causing incorrect handle hit detection (especially vertically).
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Get actual rendered image size from the Image element (object-contain)
    // The image is rendered with object-contain, so we need to calculate its actual display size
    const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
    const containerAspect = rect.width / rect.height;
    let imgDisplayW, imgDisplayH, imgDisplayX, imgDisplayY;

    // Calculate the same way object-contain does: fit image within container while maintaining aspect ratio
    if (imgAspect > containerAspect) {
      // Image is wider than container - fit to width
      imgDisplayW = rect.width;
      imgDisplayH = imgDisplayW / imgAspect;
    } else {
      // Image is taller than container - fit to height
      imgDisplayH = rect.height;
      imgDisplayW = imgDisplayH * imgAspect;
    }
    // Center the image
    imgDisplayX = (rect.width - imgDisplayW) / 2;
    imgDisplayY = (rect.height - imgDisplayH) / 2;

    // Calculate expansion bounds in display coordinates
    const maxWidth = 4096;
    const maxHeight = 4096;
    const maxDisplayW = (imgDisplayW / expandOriginalSize.width) * maxWidth;
    const maxDisplayH = (imgDisplayH / expandOriginalSize.height) * maxHeight;
    const maxDisplayX = imgDisplayX - (maxDisplayW - imgDisplayW) / 2;
    const maxDisplayY = imgDisplayY - (maxDisplayH - imgDisplayH) / 2;

    // Calculate cropped region (negative bounds = crop, positive = expand)
    const cropLeft = Math.max(0, -expandBounds.left);
    const cropTop = Math.max(0, -expandBounds.top);
    const cropRight = Math.max(0, -expandBounds.right);
    const cropBottom = Math.max(0, -expandBounds.bottom);

    // Expansion beyond cropped region (positive bounds)
    const expandLeft = Math.max(0, expandBounds.left);
    const expandTop = Math.max(0, expandBounds.top);
    const expandRight = Math.max(0, expandBounds.right);
    const expandBottom = Math.max(0, expandBounds.bottom);

    // Convert to display coordinates
    const cropLeftDisplay = (cropLeft / expandOriginalSize.width) * imgDisplayW;
    const cropTopDisplay = (cropTop / expandOriginalSize.height) * imgDisplayH;
    const cropRightDisplay =
      (cropRight / expandOriginalSize.width) * imgDisplayW;
    const cropBottomDisplay =
      (cropBottom / expandOriginalSize.height) * imgDisplayH;

    const expandLeftDisplay =
      (expandLeft / expandOriginalSize.width) * imgDisplayW;
    const expandRightDisplay =
      (expandRight / expandOriginalSize.width) * imgDisplayW;
    const expandTopDisplay =
      (expandTop / expandOriginalSize.height) * imgDisplayH;
    const expandBottomDisplay =
      (expandBottom / expandOriginalSize.height) * imgDisplayH;

    // White border position (cropped region + expansion)
    const currentDisplayX = imgDisplayX + cropLeftDisplay - expandLeftDisplay;
    const currentDisplayY = imgDisplayY + cropTopDisplay - expandTopDisplay;
    const croppedDisplayW = imgDisplayW - cropLeftDisplay - cropRightDisplay;
    const croppedDisplayH = imgDisplayH - cropTopDisplay - cropBottomDisplay;
    const currentDisplayW =
      croppedDisplayW + expandLeftDisplay + expandRightDisplay;
    const currentDisplayH =
      croppedDisplayH + expandTopDisplay + expandBottomDisplay;

    // Draw green border (max limits)
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(maxDisplayX, maxDisplayY, maxDisplayW, maxDisplayH);

    // Draw black border (original image)
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(imgDisplayX, imgDisplayY, imgDisplayW, imgDisplayH);

    // Draw current expansion border (dotted)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      currentDisplayX,
      currentDisplayY,
      currentDisplayW,
      currentDisplayH,
    );

    // Draw resize handles (small squares on edges)
    const handleSize = 8;
    ctx.fillStyle = "#22c55e";
    ctx.setLineDash([]);

    // Top handle
    ctx.fillRect(
      currentDisplayX + currentDisplayW / 2 - handleSize / 2,
      currentDisplayY - handleSize / 2,
      handleSize,
      handleSize,
    );
    // Bottom handle
    ctx.fillRect(
      currentDisplayX + currentDisplayW / 2 - handleSize / 2,
      currentDisplayY + currentDisplayH - handleSize / 2,
      handleSize,
      handleSize,
    );
    // Left handle
    ctx.fillRect(
      currentDisplayX - handleSize / 2,
      currentDisplayY + currentDisplayH / 2 - handleSize / 2,
      handleSize,
      handleSize,
    );
    // Right handle
    ctx.fillRect(
      currentDisplayX + currentDisplayW - handleSize / 2,
      currentDisplayY + currentDisplayH / 2 - handleSize / 2,
      handleSize,
      handleSize,
    );
  }, [
    selectedFeature,
    expandOriginalSize,
    expandBounds,
    getExpandCanvasContext,
  ]);

  // Redraw canvas when bounds or image changes
  useEffect(() => {
    if (selectedFeature === "expand") {
      drawExpandCanvas();
      const handleResize = () => drawExpandCanvas();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [selectedFeature, expandBounds, expandOriginalSize, drawExpandCanvas]);

  const getExpandHandle = (x: number, y: number): string | null => {
    const container = expandContainerRef.current;
    if (
      !container ||
      expandOriginalSize.width === 0 ||
      expandOriginalSize.height === 0
    )
      return null;

    const rect = container.getBoundingClientRect();
    const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
    const containerAspect = rect.width / rect.height;
    let imgDisplayW, imgDisplayH, imgDisplayX, imgDisplayY;

    // Use same calculation as drawExpandCanvas (object-contain sizing)
    if (imgAspect > containerAspect) {
      imgDisplayW = rect.width;
      imgDisplayH = imgDisplayW / imgAspect;
    } else {
      imgDisplayH = rect.height;
      imgDisplayW = imgDisplayH * imgAspect;
    }
    imgDisplayX = (rect.width - imgDisplayW) / 2;
    imgDisplayY = (rect.height - imgDisplayH) / 2;

    // Calculate cropped region (negative bounds = crop, positive = expand)
    const cropLeft = Math.max(0, -expandBounds.left);
    const cropTop = Math.max(0, -expandBounds.top);
    const cropRight = Math.max(0, -expandBounds.right);
    const cropBottom = Math.max(0, -expandBounds.bottom);

    // Expansion beyond cropped region (positive bounds)
    const expandLeft = Math.max(0, expandBounds.left);
    const expandTop = Math.max(0, expandBounds.top);
    const expandRight = Math.max(0, expandBounds.right);
    const expandBottom = Math.max(0, expandBounds.bottom);

    // Convert to display coordinates
    const cropLeftDisplay = (cropLeft / expandOriginalSize.width) * imgDisplayW;
    const cropTopDisplay = (cropTop / expandOriginalSize.height) * imgDisplayH;
    const cropRightDisplay =
      (cropRight / expandOriginalSize.width) * imgDisplayW;
    const cropBottomDisplay =
      (cropBottom / expandOriginalSize.height) * imgDisplayH;

    const expandLeftDisplay =
      (expandLeft / expandOriginalSize.width) * imgDisplayW;
    const expandRightDisplay =
      (expandRight / expandOriginalSize.width) * imgDisplayW;
    const expandTopDisplay =
      (expandTop / expandOriginalSize.height) * imgDisplayH;
    const expandBottomDisplay =
      (expandBottom / expandOriginalSize.height) * imgDisplayH;

    // White border position (cropped region + expansion)
    const currentDisplayX = imgDisplayX + cropLeftDisplay - expandLeftDisplay;
    const currentDisplayY = imgDisplayY + cropTopDisplay - expandTopDisplay;
    const croppedDisplayW = imgDisplayW - cropLeftDisplay - cropRightDisplay;
    const croppedDisplayH = imgDisplayH - cropTopDisplay - cropBottomDisplay;
    const currentDisplayW =
      croppedDisplayW + expandLeftDisplay + expandRightDisplay;
    const currentDisplayH =
      croppedDisplayH + expandTopDisplay + expandBottomDisplay;

    const threshold = 10; // px distance for grabbing near an edge anywhere along it

    // Edge hit-tests along the full length
    const nearTop =
      Math.abs(y - currentDisplayY) <= threshold &&
      x >= currentDisplayX - threshold &&
      x <= currentDisplayX + currentDisplayW + threshold;
    if (nearTop) return "top";
    const nearBottom =
      Math.abs(y - (currentDisplayY + currentDisplayH)) <= threshold &&
      x >= currentDisplayX - threshold &&
      x <= currentDisplayX + currentDisplayW + threshold;
    if (nearBottom) return "bottom";
    const nearLeft =
      Math.abs(x - currentDisplayX) <= threshold &&
      y >= currentDisplayY - threshold &&
      y <= currentDisplayY + currentDisplayH + threshold;
    if (nearLeft) return "left";
    const nearRight =
      Math.abs(x - (currentDisplayX + currentDisplayW)) <= threshold &&
      y >= currentDisplayY - threshold &&
      y <= currentDisplayY + currentDisplayH + threshold;
    if (nearRight) return "right";

    // If inside but not near edge, consider a move hit-test
    if (
      x >= currentDisplayX &&
      x <= currentDisplayX + currentDisplayW &&
      y >= currentDisplayY &&
      y <= currentDisplayY + currentDisplayH
    ) {
      return "move";
    }

    return null;
  };

  const handleExpandMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedFeature !== "expand" || expandOriginalSize.width === 0) return;
    const rect = expandContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const handle = getExpandHandle(x, y);

    if (handle && handle !== "move") {
      setExpandResizing(handle);
      e.preventDefault();
      dragStartRef.current = {
        x,
        y,
        l: expandBounds.left,
        r: expandBounds.right,
        t: expandBounds.top,
        b: expandBounds.bottom,
      };
    } else if (handle === "move") {
      // Allow moving the entire rectangle: click inside current display region (not on a handle)
      // Recompute current display rectangle similarly to drawExpandCanvas for hit testing.
      const container = expandContainerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
      const containerAspect = cRect.width / cRect.height;
      let imgDisplayW: number,
        imgDisplayH: number,
        imgDisplayX: number,
        imgDisplayY: number;
      if (imgAspect > containerAspect) {
        imgDisplayW = cRect.width;
        imgDisplayH = imgDisplayW / imgAspect;
      } else {
        imgDisplayH = cRect.height;
        imgDisplayW = imgDisplayH * imgAspect;
      }
      imgDisplayX = (cRect.width - imgDisplayW) / 2;
      imgDisplayY = (cRect.height - imgDisplayH) / 2;
      // Derive current display rect from bounds
      const cropLeft = Math.max(0, -expandBounds.left);
      const cropTop = Math.max(0, -expandBounds.top);
      const cropRight = Math.max(0, -expandBounds.right);
      const cropBottom = Math.max(0, -expandBounds.bottom);
      const expandLeft = Math.max(0, expandBounds.left);
      const expandTop = Math.max(0, expandBounds.top);
      const expandRight = Math.max(0, expandBounds.right);
      const expandBottom = Math.max(0, expandBounds.bottom);
      const cropLeftDisplay =
        (cropLeft / expandOriginalSize.width) * imgDisplayW;
      const cropTopDisplay =
        (cropTop / expandOriginalSize.height) * imgDisplayH;
      const expandLeftDisplay =
        (expandLeft / expandOriginalSize.width) * imgDisplayW;
      const expandTopDisplay =
        (expandTop / expandOriginalSize.height) * imgDisplayH;
      const croppedDisplayW =
        imgDisplayW -
        cropLeftDisplay -
        (cropRight / expandOriginalSize.width) * imgDisplayW;
      const croppedDisplayH =
        imgDisplayH -
        cropTopDisplay -
        (cropBottom / expandOriginalSize.height) * imgDisplayH;
      const currentDisplayX = imgDisplayX + cropLeftDisplay - expandLeftDisplay;
      const currentDisplayY = imgDisplayY + cropTopDisplay - expandTopDisplay;
      const currentDisplayW =
        croppedDisplayW +
        (expandLeft / expandOriginalSize.width) * imgDisplayW +
        (expandRight / expandOriginalSize.width) * imgDisplayW;
      const currentDisplayH =
        croppedDisplayH +
        (expandTop / expandOriginalSize.height) * imgDisplayH +
        (expandBottom / expandOriginalSize.height) * imgDisplayH;
      if (
        x >= currentDisplayX &&
        x <= currentDisplayX + currentDisplayW &&
        y >= currentDisplayY &&
        y <= currentDisplayY + currentDisplayH
      ) {
        setExpandResizing("move");
        dragStartRef.current = {
          x,
          y,
          l: expandBounds.left,
          r: expandBounds.right,
          t: expandBounds.top,
          b: expandBounds.bottom,
        };
        e.preventDefault();
      }
    }
  };

  const handleExpandMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedFeature !== "expand" || expandOriginalSize.width === 0) return;
    const rect = expandContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate image display size (same as drawExpandCanvas - object-contain sizing)
    const imgAspect = expandOriginalSize.width / expandOriginalSize.height;
    const containerAspect = rect.width / rect.height;
    let imgDisplayW, imgDisplayH, imgDisplayX, imgDisplayY;

    if (imgAspect > containerAspect) {
      imgDisplayW = rect.width;
      imgDisplayH = imgDisplayW / imgAspect;
    } else {
      imgDisplayH = rect.height;
      imgDisplayW = imgDisplayH * imgAspect;
    }
    imgDisplayX = (rect.width - imgDisplayW) / 2;
    imgDisplayY = (rect.height - imgDisplayH) / 2;

    // Convert display coordinates to image coordinates
    const scaleX = expandOriginalSize.width / imgDisplayW;
    const scaleY = expandOriginalSize.height / imgDisplayH;

    const maxWidth = 4096;
    const maxHeight = 4096;

    // Hover-only cursor feedback
    if (!expandResizing) {
      const h = getExpandHandle(x, y);
      setExpandHoverEdge(h);
      return;
    }

    if (expandResizing === "move" && dragStartRef.current) {
      // Move the rectangle without changing its size. Translate all four bounds.
      const start = dragStartRef.current;
      const dxDisplay = x - start.x;
      const dyDisplay = y - start.y;
      const scaleX = expandOriginalSize.width / imgDisplayW;
      const scaleY = expandOriginalSize.height / imgDisplayH;
      const dxImage = dxDisplay * scaleX;
      const dyImage = dyDisplay * scaleY;
      setExpandBounds({
        left: start.l + dxImage,
        right: start.r + dxImage,
        top: start.t + dyImage,
        bottom: start.b + dyImage,
      });
      return; // handled
    }

    setExpandBounds((prev) => {
      let newLeft = prev.left;
      let newRight = prev.right;
      let newTop = prev.top;
      let newBottom = prev.bottom;

      if (expandResizing === "left") {
        // Positive = expand outward to the left, Negative = crop from left
        const delta = (imgDisplayX - x) * scaleX;
        newLeft = Math.max(
          -expandOriginalSize.width + 1,
          Math.min(maxWidth - expandOriginalSize.width, delta),
        );
      } else if (expandResizing === "right") {
        // Positive = expand outward to the right, Negative = crop from right
        const delta = (x - (imgDisplayX + imgDisplayW)) * scaleX;
        newRight = Math.max(
          -expandOriginalSize.width + 1,
          Math.min(maxWidth - expandOriginalSize.width, delta),
        );
      } else if (expandResizing === "top") {
        // Positive = expand upward, Negative = crop from top
        const delta = (imgDisplayY - y) * scaleY;
        newTop = Math.max(
          -expandOriginalSize.height + 1,
          Math.min(maxHeight - expandOriginalSize.height, delta),
        );
      } else if (expandResizing === "bottom") {
        // Positive = expand downward, Negative = crop from bottom
        const delta = (y - (imgDisplayY + imgDisplayH)) * scaleY;
        newBottom = Math.max(
          -expandOriginalSize.height + 1,
          Math.min(maxHeight - expandOriginalSize.height, delta),
        );
      }

      // Ensure we don't crop more than the image size
      const newCropLeft = Math.max(0, -newLeft);
      const newCropTop = Math.max(0, -newTop);
      const newCropRight = Math.max(0, -newRight);
      const newCropBottom = Math.max(0, -newBottom);

      if (newCropLeft + newCropRight >= expandOriginalSize.width) {
        if (expandResizing === "left") newLeft = prev.left;
        if (expandResizing === "right") newRight = prev.right;
      }
      if (newCropTop + newCropBottom >= expandOriginalSize.height) {
        if (expandResizing === "top") newTop = prev.top;
        if (expandResizing === "bottom") newBottom = prev.bottom;
      }

      return { left: newLeft, top: newTop, right: newRight, bottom: newBottom };
    });
  };

  const handleExpandMouseUp = () => {
    setExpandResizing(null);
    setExpandHoverEdge(null);
  };

  // Compute the actual rendered image rectangle inside the mask container,
  // taking into account object-contain behavior (letterboxing).
  const getRenderedImageRect = () => {
    const container = fillContainerRef.current;
    if (!container || !inputNaturalSize.width || !inputNaturalSize.height)
      return null;

    const rect = container.getBoundingClientRect();
    const imgAspect = inputNaturalSize.width / inputNaturalSize.height;
    const containerAspect = rect.width / rect.height;

    let renderWidth: number;
    let renderHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (containerAspect > imgAspect) {
      // Container is wider than image - image fits height, letterbox on sides
      renderHeight = rect.height;
      renderWidth = rect.height * imgAspect;
      offsetX = (rect.width - renderWidth) / 2;
      offsetY = 0;
    } else {
      // Container is taller than image - image fits width, letterbox top/bottom
      renderWidth = rect.width;
      renderHeight = rect.width / imgAspect;
      offsetX = 0;
      offsetY = (rect.height - renderHeight) / 2;
    }

    return {
      x: offsetX,
      y: offsetY,
      width: renderWidth,
      height: renderHeight,
    };
  };

  const pointFromMouseEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = fillCanvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    // The context is already scaled by DPR in resizeCanvasToContainer,
    // so we use display coordinates directly, but clamp to the rendered image
    // area so strokes cannot go outside the actual input image.
    let x = e.clientX - r.left;
    let y = e.clientY - r.top;

    const imgRect = getRenderedImageRect();
    if (imgRect) {
      x = Math.max(imgRect.x, Math.min(x, imgRect.x + imgRect.width));
      y = Math.max(imgRect.y, Math.min(y, imgRect.y + imgRect.height));
    }

    return { x, y };
  };

  const pointFromTouchEvent = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const c = fillCanvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return { x: 0, y: 0 };
    // The context is already scaled by DPR in resizeCanvasToContainer,
    // so we use display coordinates directly, but clamp to the rendered image
    // area so strokes cannot go outside the actual input image.
    let x = touch.clientX - r.left;
    let y = touch.clientY - r.top;

    const imgRect = getRenderedImageRect();
    if (imgRect) {
      x = Math.max(imgRect.x, Math.min(x, imgRect.x + imgRect.width));
      y = Math.max(imgRect.y, Math.min(y, imgRect.y + imgRect.height));
    }

    return { x, y };
  };

  const handleRun = async () => {
    if (!user) {
      saveAutoResumeIntent("image", {
        isEditImage: true,
        selectedFeature,
        inputs,
        model,
        prompt,
        scaleFactor,
        faceEnhance,
        swinTask,
        expandBounds,
        expandAspectRatio,
        eraseBrushSize,
        eraseActionMode,
        erasePrompt,
        reimaginePrompt,
        reimagineModel,
        reimagineSelectionMode,
        topazModel,
        topazUpscaleFactor,
        seedvrUpscaleFactor,
        resizeAspectRatio,
        styleComboModel,
        styleComboFrameSize,
        styleComboResolution,
        styleComboSelectedIds,
        styleComboExtraPrompt,
        styleComboTab,
        styleComboIndianVersion,
      });
      router.push(getSignInUrl("/text-to-image/edit-image"));
      return;
    }
    if (processing[selectedFeature]) return;
    const toAbsoluteProxyUrl = (url: string | null | undefined) => {
      if (!url) return url as any;
      if (url.startsWith("data:")) return url as any;
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";
      // For Replicate, we must provide a publicly reachable URL. Use Zata public URL instead of localhost proxy.
      try {
        const RESOURCE_SEG = "/api/proxy/resource/";
        if (url.startsWith(RESOURCE_SEG)) {
          const decoded = decodeURIComponent(
            url.substring(RESOURCE_SEG.length),
          );
          return `${ZATA_PREFIX}${decoded}`;
        }
        // Absolute to frontend origin
        if (url.startsWith("http://") || url.startsWith("https://")) {
          const u = new URL(url);
          if (u.pathname.startsWith(RESOURCE_SEG)) {
            const decoded = decodeURIComponent(
              u.pathname.substring(RESOURCE_SEG.length),
            );
            return `${ZATA_PREFIX}${decoded}`;
          }
          return url as any;
        }
      } catch { }
      return url as any;
    };

    const toDataUriIfLocal = async (src: string): Promise<string> => {
      if (!src) return src as any;
      if (src.startsWith("data:")) return src;
      if (src.startsWith("blob:")) {
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          return src;
        }
      }
      // If the image is stored on Zata (or another known storage served via
      // the `/api/proxy/download/:path` backend route), fetch via our proxy
      // so we avoid cross-origin/read restrictions, then convert to data URI.
      try {
        const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        if (String(src).startsWith(ZATA_PREFIX)) {
          const path = src.substring(ZATA_PREFIX.length);
          const proxyUrl = `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}`;
          try {
            const pResp = await fetch(proxyUrl, { credentials: "include" });
            if (pResp && pResp.ok) {
              const blob = await pResp.blob();
              return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(String(reader.result || ""));
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch (e) {
            // fallthrough to attempt direct fetch below
            console.warn(
              "[toDataUriIfLocal] proxy fetch failed, falling back to direct fetch",
              e,
            );
          }
        }
      } catch (e) {
        // ignore and continue
      }

      // Last resort: try a direct fetch (may fail due to CORS). If it fails,
      // return the original src so existing behavior remains.
      return src;
    };

    const currentInputRaw = inputs[selectedFeature];
    const currentInput = toAbsoluteProxyUrl(currentInputRaw) as any;
    if (!currentInput) return;
    if (
      selectedFeature === "style-combination" &&
      styleComboSelectedIds.length === 0
    ) {
      setErrorMsg("Select at least one style to combine.");
      return;
    }
    setErrorMsg("");
    setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
    setProcessing((prev) => ({ ...prev, [selectedFeature]: true }));

    // Track optimistic debit so we can roll back on failure
    let optimisticDebit = 0;
    try {
      const normalizedInput = currentInputRaw
        ? await toDataUriIfLocal(String(currentInputRaw))
        : "";

      // Optimistic debit: expand or vectorize
      if (optimisticDebit === 0) {
        if (selectedFeature === "expand" && expandCredits > 0) {
          try {
            deductCreditsOptimisticForGeneration(expandCredits);
            optimisticDebit = expandCredits;
          } catch {
            /* ignore */
          }
        } else if (selectedFeature === "vectorize") {
          const vectorizeCost = effectiveVectorizeCredits;
          if (vectorizeCost > 0) {
            try {
              deductCreditsOptimisticForGeneration(vectorizeCost);
              optimisticDebit = vectorizeCost;
            } catch {
              /* ignore */
            }
          }
        } else if (
          (selectedFeature === "fill" || selectedFeature === "erase") &&
          eraseCredits > 0
        ) {
          try {
            deductCreditsOptimisticForGeneration(eraseCredits);
            optimisticDebit = eraseCredits;
          } catch {
            /* ignore */
          }
        } else if (
          selectedFeature === "style-combination" &&
          styleComboCredits > 0
        ) {
          try {
            deductCreditsOptimisticForGeneration(styleComboCredits);
            optimisticDebit = styleComboCredits;
          } catch {
            /* ignore */
          }
        }
      }
      const isPublic = await getIsPublic();
      if (selectedFeature === "vectorize") {
        const img = inputs[selectedFeature];
        if (!img) throw new Error("Please upload an image to vectorize");

        let vectorizeInput = normalizedInput;
        let vectorizeInputUrl = currentInput;

        // Super mode: First convert image to 2D vector using Seedream
        if (vectorizeSuperMode) {
          try {
            // Step 1: Upload image to Zata if needed, then use Seedream to convert image to 2D vector
            const imageInput = String(normalizedInput).startsWith("data:")
              ? normalizedInput
              : currentInput;
            const seedreamImageUrl = await ensureZataUrl(imageInput);
            const seedreamPayload: any = {
              prompt: "convert into 2D vector image",
              model: "bytedance/seedream-5-lite",
              size: "2K",
              image_input: [seedreamImageUrl],
              sequential_image_generation: "disabled",
              max_images: 1,
              isPublic: false, // Intermediate step, don't make public
            };

            const seedreamRes = await axiosInstance.post(
              "/api/replicate/generate",
              seedreamPayload,
            );
            const seedreamOut =
              seedreamRes?.data?.images?.[0]?.url ||
              seedreamRes?.data?.data?.images?.[0]?.url ||
              seedreamRes?.data?.data?.url ||
              seedreamRes?.data?.url ||
              "";

            if (!seedreamOut) {
              throw new Error("Seedream conversion failed. Please try again.");
            }

            // Step 2: Use the Seedream output as input for vectorization
            // Convert to data URI if needed for vectorize API
            try {
              const seedreamNormalized = await toDataUriIfLocal(seedreamOut);
              vectorizeInput = seedreamNormalized;
              vectorizeInputUrl = seedreamOut;
            } catch {
              // If conversion fails, use URL directly
              vectorizeInputUrl = seedreamOut;
            }
          } catch (seedreamError: any) {
            console.error(
              "[EditImage] Seedream conversion error:",
              seedreamError,
            );
            const errorMsg =
              seedreamError?.response?.data?.message ||
              seedreamError?.message ||
              "Seedream conversion failed";
            throw new Error(`Super mode failed: ${errorMsg}`);
          }
        }

        // Step 3: Vectorize the image (either original or Seedream output)
        if (vectorizeModel === "fal-ai/recraft/vectorize") {
          const body: any = { isPublic };
          if (String(vectorizeInput).startsWith("data:"))
            body.image = vectorizeInput;
          else {
            // Provider APIs require a fully-qualified HTTPS URL (not our local proxy path)
            body.image_url = await ensureZataUrl(vectorizeInputUrl);
          }
          const res = await axiosInstance.post(
            "/api/fal/recraft/vectorize",
            body,
          );
          const out =
            res?.data?.data?.images?.[0]?.url ||
            res?.data?.images?.[0]?.url ||
            res?.data?.data?.image?.url ||
            res?.data?.data?.url ||
            res?.data?.url ||
            "";
          if (out) setOutputs((prev) => ({ ...prev, ["vectorize"]: out }));
          try {
            setCurrentHistoryId(
              res?.data?.data?.historyId || res?.data?.historyId || null,
            );
          } catch { }
          try {
            await refreshCredits();
          } catch { }
          // Refresh global history so the Image Generation page sees the new vectorize entry immediately.
          // Omit generationType & expectedType so the thunk is not aborted while user is on edit-image view.
          try {
            await (dispatch as any)(
              loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                debugTag: `refresh-after-vectorize:${Date.now()}`,
              }),
            );
          } catch { }
        } else {
          // fal-ai/image2svg
          const body: any = {
            isPublic,
            colormode: vColorMode,
            hierarchical: vHierarchical,
            mode: vMode,
            filter_speckle: vFilterSpeckle,
            color_precision: vColorPrecision,
            layer_difference: vLayerDifference,
            corner_threshold: vCornerThreshold,
            length_threshold: vLengthThreshold,
            max_iterations: vMaxIterations,
            splice_threshold: vSpliceThreshold,
            path_precision: vPathPrecision,
          };
          if (String(vectorizeInput).startsWith("data:"))
            body.image = vectorizeInput;
          else {
            // Provider APIs require a fully-qualified HTTPS URL (not our local proxy path)
            body.image_url = await ensureZataUrl(vectorizeInputUrl);
          }
          const res = await axiosInstance.post("/api/fal/image2svg", body);
          const out =
            res?.data?.data?.images?.[0]?.url ||
            res?.data?.images?.[0]?.url ||
            res?.data?.data?.image?.url ||
            res?.data?.data?.url ||
            res?.data?.url ||
            "";
          if (out) setOutputs((prev) => ({ ...prev, ["vectorize"]: out }));
          try {
            setCurrentHistoryId(
              res?.data?.data?.historyId || res?.data?.historyId || null,
            );
          } catch { }
          try {
            await refreshCredits();
          } catch { }
          // Refresh global history so the Image Generation page sees the new vectorize entry immediately.
          // Omit generationType & expectedType so the thunk is not aborted while user is on edit-image view.
          try {
            await (dispatch as any)(
              loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                debugTag: `refresh-after-vectorize:${Date.now()}`,
              }),
            );
          } catch { }
        }
        return;
      }
      if (selectedFeature === "expand") {
        const img = inputs[selectedFeature];
        if (!img) throw new Error("Please upload an image to expand");
        if (expandOriginalSize.width === 0 || expandOriginalSize.height === 0) {
          throw new Error(
            "Image dimensions not detected. Please wait for image to load.",
          );
        }

        // Calculate cropped region (negative bounds = crop, positive = expand)
        const cropLeft = Math.max(0, -expandBounds.left);
        const cropTop = Math.max(0, -expandBounds.top);
        const cropRight = Math.max(0, -expandBounds.right);
        const cropBottom = Math.max(0, -expandBounds.bottom);

        // Cropped dimensions
        const croppedWidth = expandOriginalSize.width - cropLeft - cropRight;
        const croppedHeight = expandOriginalSize.height - cropTop - cropBottom;

        // Expansion beyond cropped region (positive bounds)
        const expandLeft = Math.max(0, expandBounds.left);
        const expandTop = Math.max(0, expandBounds.top);
        const expandRight = Math.max(0, expandBounds.right);
        const expandBottom = Math.max(0, expandBounds.bottom);

        // Final dimensions = cropped region + expansion (raw selection)
        const rawWidth = croppedWidth + expandLeft + expandRight;
        const rawHeight = croppedHeight + expandTop + expandBottom;
        const roundTo8 = (n: number) =>
          Math.max(64, Math.min(4096, Math.round(n / 8) * 8));
        const finalWidth = roundTo8(rawWidth);
        const finalHeight = roundTo8(rawHeight);

        // Crop the image if needed (if there's any cropping)
        let croppedImageDataUri = normalizedInput;
        if (cropLeft > 0 || cropTop > 0 || cropRight > 0 || cropBottom > 0) {
          // Create a canvas to crop the image
          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = croppedWidth;
          cropCanvas.height = croppedHeight;
          const cropCtx = cropCanvas.getContext("2d");
          if (cropCtx) {
            const sourceImg = document.createElement("img");
            sourceImg.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              sourceImg.onload = () => {
                try {
                  // Draw the cropped region
                  cropCtx.drawImage(
                    sourceImg,
                    cropLeft,
                    cropTop,
                    croppedWidth,
                    croppedHeight, // Source region
                    0,
                    0,
                    croppedWidth,
                    croppedHeight, // Destination
                  );
                  croppedImageDataUri = cropCanvas.toDataURL("image/png");
                  resolve();
                } catch (err) {
                  reject(err);
                }
              };
              sourceImg.onerror = reject;
              if (String(normalizedInput).startsWith("data:")) {
                sourceImg.src = normalizedInput;
              } else {
                sourceImg.src = currentInput || String(img);
              }
            });
          }
        }

        // Use cropped image (data URI) or currentInput (URL) for image_input
        // Backend will handle uploading data URIs to Zata
        const imageInput = String(croppedImageDataUri).startsWith("data:")
          ? croppedImageDataUri
          : currentInput || String(img);

        // Provider normalization (shared helper)
        const providerDims = normalizeExpandDims(finalWidth, finalHeight);

        const buildPayload = (w: number, h: number) => ({
          prompt: "Expand image likewise",
          model: "bytedance/seedream-4",
          size: "custom",
          width: w,
          height: h,
          image_input: [imageInput],
          sequential_image_generation: "disabled",
          max_images: 1,
          isPublic,
        });

        let res;
        try {
          res = await axiosInstance.post(
            "/api/replicate/generate",
            buildPayload(providerDims.w, providerDims.h),
          );
        } catch (err: any) {
          const msg = String(err?.response?.data?.message || "");
          if (/1024-4096/i.test(msg)) {
            // Fallback: force both dimensions to MIN keeping aspect
            const aspect = finalWidth / finalHeight || 1;
            let w = 1024,
              h = 1024;
            if (aspect > 1) {
              w = 1024;
              h = Math.round(1024 / aspect);
            } else {
              h = 1024;
              w = Math.round(1024 * aspect);
            }
            const fixed = normalizeExpandDims(w, h);
            res = await axiosInstance.post(
              "/api/replicate/generate",
              buildPayload(fixed.w, fixed.h),
            );
          } else {
            throw err;
          }
        }
        const out =
          res?.data?.images?.[0]?.url ||
          res?.data?.data?.images?.[0]?.url ||
          res?.data?.data?.url ||
          res?.data?.url ||
          "";
        if (out) setOutputs((prev) => ({ ...prev, ["expand"]: out }));
        try {
          setCurrentHistoryId(
            res?.data?.data?.historyId || res?.data?.historyId || null,
          );
        } catch { }
        try {
          await refreshCredits();
        } catch { }
        return;
      }
      if (selectedFeature === "style-combination") {
        const img = inputs["style-combination"];
        if (!img) throw new Error("Please upload an image for style combination");

        if (!eraseMaskData) {
          setErrorMsg("Paint the area to restyle with the brush.");
          setProcessing((prev) => ({ ...prev, ["style-combination"]: false }));
          return;
        }
        if (!(await maskDataUrlHasPaintedRegion(eraseMaskData))) {
          setErrorMsg("Paint the area to restyle with the brush.");
          setProcessing((prev) => ({ ...prev, ["style-combination"]: false }));
          return;
        }
        let maskDataUrl = eraseMaskData;

        try {
          const sanityOff = document.createElement("canvas");
          const natW = Math.max(
            1,
            Math.floor(inputNaturalSize.width || 1),
          );
          const natH = Math.max(
            1,
            Math.floor(inputNaturalSize.height || 1),
          );
          sanityOff.width = natW;
          sanityOff.height = natH;
          const sctx = sanityOff.getContext("2d");
          if (sctx) {
            const maskImg = new window.Image();
            await new Promise<void>((resolve) => {
              maskImg.onload = () => {
                try {
                  sctx.drawImage(maskImg, 0, 0, natW, natH);
                } catch { }
                resolve();
              };
              maskImg.onerror = () => resolve();
              maskImg.src = maskDataUrl;
            });
            try {
              const data = sctx.getImageData(0, 0, natW, natH).data;
              let hasBright = false;
              for (let i = 0; i < data.length; i += 4) {
                if (
                  data[i + 3] > 12 &&
                  data[i] + data[i + 1] + data[i + 2] > 380
                ) {
                  hasBright = true;
                  break;
                }
              }
              if (!hasBright) {
                setErrorMsg(
                  "Mask appears empty. Paint the region to restyle with the brush.",
                );
                setProcessing((prev) => ({
                  ...prev,
                  ["style-combination"]: false,
                }));
                return;
              }
            } catch { }
          }
        } catch { }

        const styleSourceImage = String(normalizedInput).startsWith("data:")
          ? normalizedInput
          : currentInput;
        if (!String(styleSourceImage).startsWith("data:")) {
          try {
            const probeImg = new window.Image();
            probeImg.crossOrigin = "anonymous";
            const imgUrl = currentInput as string;
            await new Promise<void>((resolve) => {
              probeImg.onload = () => resolve();
              probeImg.onerror = () => resolve();
              probeImg.src = imgUrl;
            });
            const imgW = Math.max(
              1,
              Math.floor((probeImg as any).naturalWidth || 0),
            );
            const imgH = Math.max(
              1,
              Math.floor((probeImg as any).naturalHeight || 0),
            );
            if (imgW && imgH) {
              const maskImg = new window.Image();
              maskImg.crossOrigin = "anonymous";
              await new Promise<void>((resolve) => {
                maskImg.onload = () => {
                  try {
                    const final = document.createElement("canvas");
                    final.width = imgW;
                    final.height = imgH;
                    const fctx = final.getContext("2d");
                    if (fctx) fctx.drawImage(maskImg, 0, 0, imgW, imgH);
                    maskDataUrl = final.toDataURL("image/png");
                  } catch { }
                  resolve();
                };
                maskImg.onerror = () => resolve();
                maskImg.src = maskDataUrl;
              });
            }
          } catch (e) {
            console.warn(
              "[Style combination] mask rescale probe failed",
              e,
            );
          }
        }

        const styleBlocks: string[] = [];
        for (const sid of styleComboSelectedIds) {
          if (INDIAN_STYLE_LOOKUP.has(sid)) {
            const bp = await getIndianBasePrompt(
              sid,
              styleComboIndianVersion,
            );
            if (bp && bp.trim()) {
              const row = ALL_INDIAN_STYLES.find((r) => r.id === sid);
              const label = row?.title || sid;
              styleBlocks.push(`[${label}]: ${bp.trim()}`);
            }
          } else {
            const def = STYLE_CATALOG.find((s) => s.value === sid);
            if (def && def.value !== "none" && def.prompt?.trim()) {
              styleBlocks.push(`[${def.name}]: ${def.prompt.trim()}`);
            }
          }
        }

        if (styleBlocks.length === 0) {
          throw new Error(
            "Could not load style descriptions. Try different styles or Indian version.",
          );
        }

        const extra = styleComboExtraPrompt.trim();
        const maskDirective =
          "A separate mask image is provided (mask_url). WHITE / bright areas in the mask mark where you MUST apply the combined style edits. BLACK areas must stay visually unchanged (preserve original pixels, texture, lighting, and geometry). Only the masked region should receive the new style treatment; keep a seamless blend at the boundary.";
        const finalPrompt = [
          maskDirective,
          "Restyle the input image by applying ALL of the following style directions together in one coherent result, limited to the masked region as described above.",
          "Preserve the main subject, pose, and composition in unmasked areas.",
          "Blend lighting, color, texture, and line quality in the edited region so the combined look feels intentional, not like a collage pasted on top.",
          "--- Combined style directions ---",
          styleBlocks.join("\n\n"),
          extra ? `--- Additional instructions ---\n${extra}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        const imageInput = String(normalizedInput).startsWith("data:")
          ? normalizedInput
          : await ensureZataUrl(String(currentInputRaw));

        const res = await axiosInstance.post("/api/fal/generate", {
          prompt: finalPrompt,
          model: styleComboModel,
          n: 1,
          num_images: 1,
          uploadedImages: [imageInput],
          mask_url: maskDataUrl,
          output_format: "jpeg",
          frameSize: styleComboFrameSize,
          aspect_ratio: styleComboFrameSize,
          size: styleComboResolution,
          resolution: styleComboResolution,
          generationType: "style-combination",
          isPublic,
        });
        const out =
          res?.data?.images?.[0]?.url ||
          res?.data?.data?.images?.[0]?.url ||
          res?.data?.data?.url ||
          res?.data?.url ||
          "";
        if (out) {
          setOutputs((prev) => ({ ...prev, ["style-combination"]: out }));
          try {
            setCurrentHistoryId(
              res?.data?.data?.historyId || res?.data?.historyId || null,
            );
          } catch { }
          try {
            await refreshCredits();
          } catch { }
          try {
            await (dispatch as any)(
              loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                debugTag: `refresh-after-style-combination:${Date.now()}`,
              }),
            );
          } catch { }
          toast.success("Style combination complete");
        } else {
          throw new Error("No image returned from style combination");
        }
        return;
      }
      if (selectedFeature === "fill" || selectedFeature === "erase") {
        const img = inputs[selectedFeature];
        if (!img)
          throw new Error(
            `Please upload an image for ${selectedFeature === "fill" ? "fill" : selectedFeature === "erase" ? "erase" : "reimagine"}`,
          );

        const hardErasePrompt =
          "remove or erase the masked part of mask from the image";
        const isEraseMode =
          selectedFeature === "fill" && eraseActionMode === "erase";
        const activePrompt =
          selectedFeature === "fill"
            ? isEraseMode
              ? hardErasePrompt
              : erasePrompt
            : prompt;

        // Only block if we are in a mode where prompt is absolutely mandatory and we have no fallback.
        // But here, empty prompt -> Erase, so we allow it.
        /*
        if (selectedFeature === 'fill' && (!activePrompt || !activePrompt.trim())) {
          setErrorMsg('Please enter a prompt for fill');
          setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
          return;
        }
        */

        // Export mask as PNG data URI and ensure its pixel size matches the
        // actual input image dimensions (FAL requires mask and image to have
        // identical width/height). This may involve fetching the image to
        // read its natural size and rescaling the mask accordingly.
        let maskDataUrl: string | undefined;

        if (selectedFeature === "fill" && eraseMaskData) {
          maskDataUrl = eraseMaskData;
        } else {
          const c = fillCanvasRef.current;
          if (!c) {
            // Check if we are in new UI mode but mask is missing?
            // If selectedFeature is fill and logic falls here, it implies eraseMaskData is null.
            // So we continue to return if c is null.
            return;
          }
          if (!hasMask) {
            setErrorMsg(
              "Please draw a mask on the image to specify the area to replace",
            );
            setProcessing((prev) => ({ ...prev, ["fill"]: false }));
            return;
          }
          try {
            const off = document.createElement("canvas");
            const dispRect = fillContainerRef.current?.getBoundingClientRect();
            const displayW = Math.max(
              1,
              Math.floor(dispRect?.width || c.width),
            );
            const displayH = Math.max(
              1,
              Math.floor(dispRect?.height || c.height),
            );
            const natW = Math.max(
              1,
              Math.floor(inputNaturalSize.width || displayW),
            );
            const natH = Math.max(
              1,
              Math.floor(inputNaturalSize.height || displayH),
            );
            off.width = natW;
            off.height = natH;
            const octx = off.getContext("2d");
            if (!octx) {
              maskDataUrl = c.toDataURL("image/png");
            } else {
              // Use the canvas's internal pixel dimensions as the source when
              // resampling. `c.width`/`c.height` are the device-pixel buffer
              // sizes; using them prevents accidental 1x1 outputs when the
              // display size differs (DPR scaling).

              // Get the source canvas image data to check what was actually drawn
              const sourceCtx = c.getContext("2d");
              if (!sourceCtx) {
                // Fallback: just fill with black
                octx.fillStyle = "rgb(0, 0, 0)";
                octx.fillRect(0, 0, natW, natH);
                maskDataUrl = off.toDataURL("image/png");
              } else {
                // Get source canvas data first to see what was actually drawn
                const sourceImgData = sourceCtx.getImageData(
                  0,
                  0,
                  c.width,
                  c.height,
                );
                const sourceData = sourceImgData.data;

                // Create the output image data directly from source
                const outputImgData = octx.createImageData(natW, natH);
                const outputData = outputImgData.data;

                // Fill with black background first
                for (let i = 0; i < outputData.length; i += 4) {
                  outputData[i] = 0; // R - black
                  outputData[i + 1] = 0; // G - black
                  outputData[i + 2] = 0; // B - black
                  outputData[i + 3] = 255; // A - fully opaque
                }

                // Compute the rendered image rectangle inside the canvas (object-contain)
                const containerRect =
                  fillContainerRef.current?.getBoundingClientRect();
                const imgRect = (() => {
                  if (
                    !containerRect ||
                    !inputNaturalSize.width ||
                    !inputNaturalSize.height
                  ) {
                    return { x: 0, y: 0, width: c.width, height: c.height };
                  }
                  const imgAspect =
                    inputNaturalSize.width / inputNaturalSize.height;
                  const containerAspect =
                    containerRect.width / containerRect.height;
                  let renderWidth: number;
                  let renderHeight: number;
                  let offsetX: number;
                  let offsetY: number;
                  if (containerAspect > imgAspect) {
                    // image fits height
                    renderHeight = containerRect.height;
                    renderWidth = renderHeight * imgAspect;
                    offsetX = (containerRect.width - renderWidth) / 2;
                    offsetY = 0;
                  } else {
                    // image fits width
                    renderWidth = containerRect.width;
                    renderHeight = renderWidth / imgAspect;
                    offsetX = 0;
                    offsetY = (containerRect.height - renderHeight) / 2;
                  }
                  const scaleX = c.width / containerRect.width;
                  const scaleY = c.height / containerRect.height;
                  return {
                    x: offsetX * scaleX,
                    y: offsetY * scaleY,
                    width: renderWidth * scaleX,
                    height: renderHeight * scaleY,
                  };
                })();

                // Now check source canvas and set white only where pixels were actually drawn
                // AND inside the rendered image area. Anything painted in the letterbox
                // region (outside the actual image) is ignored and treated as black.
                for (let y = 0; y < natH; y++) {
                  for (let x = 0; x < natW; x++) {
                    // Map output coordinates in image space to source canvas coordinates
                    const srcX = Math.floor(
                      imgRect.x + (x / natW) * imgRect.width,
                    );
                    const srcY = Math.floor(
                      imgRect.y + (y / natH) * imgRect.height,
                    );
                    const srcIdx = (srcY * c.width + srcX) * 4;
                    const outIdx = (y * natW + x) * 4;

                    if (srcIdx < sourceData.length) {
                      // Check if this pixel was actually drawn (has significant alpha and is white)
                      const srcAlpha = sourceData[srcIdx + 3];
                      const srcR = sourceData[srcIdx];
                      const srcG = sourceData[srcIdx + 1];
                      const srcB = sourceData[srcIdx + 2];

                      // Only set to white if source pixel was actually drawn (alpha > 50 and is white)
                      if (
                        srcAlpha > 50 &&
                        srcR > 200 &&
                        srcG > 200 &&
                        srcB > 200
                      ) {
                        // Masked area: set to white
                        outputData[outIdx] = 255; // R
                        outputData[outIdx + 1] = 255; // G
                        outputData[outIdx + 2] = 255; // B
                        outputData[outIdx + 3] = 255; // A
                      }
                      // Otherwise keep it black (already set above)
                    }
                  }
                }

                // Put the processed image data onto the canvas
                octx.putImageData(outputImgData, 0, 0);
                maskDataUrl = off.toDataURL("image/png");
              }
            }
          } catch {
            // Fallback: create a proper mask with black background
            const c2 = fillCanvasRef.current as HTMLCanvasElement | null;
            if (c2) {
              try {
                const fallbackCanvas = document.createElement("canvas");
                const dispRect =
                  fillContainerRef.current?.getBoundingClientRect();
                const displayW = Math.max(
                  1,
                  Math.floor(dispRect?.width || c2.width),
                );
                const displayH = Math.max(
                  1,
                  Math.floor(dispRect?.height || c2.height),
                );
                const natW = Math.max(
                  1,
                  Math.floor(inputNaturalSize.width || displayW),
                );
                const natH = Math.max(
                  1,
                  Math.floor(inputNaturalSize.height || displayH),
                );
                fallbackCanvas.width = natW;
                fallbackCanvas.height = natH;
                const fallbackCtx = fallbackCanvas.getContext("2d");
                if (fallbackCtx) {
                  const sourceCtx = c2.getContext("2d");
                  if (sourceCtx) {
                    // Get source canvas data
                    const sourceImgData = sourceCtx.getImageData(
                      0,
                      0,
                      c2.width,
                      c2.height,
                    );
                    const sourceData = sourceImgData.data;

                    // Create output image data
                    const outputImgData = fallbackCtx.createImageData(
                      natW,
                      natH,
                    );
                    const outputData = outputImgData.data;

                    // Fill with black background first
                    for (let i = 0; i < outputData.length; i += 4) {
                      outputData[i] = 0; // R - black
                      outputData[i + 1] = 0; // G - black
                      outputData[i + 2] = 0; // B - black
                      outputData[i + 3] = 255; // A - fully opaque
                    }

                    // Check source canvas and set white only where pixels were actually drawn
                    for (let y = 0; y < natH; y++) {
                      for (let x = 0; x < natW; x++) {
                        const srcX = Math.floor((x / natW) * c2.width);
                        const srcY = Math.floor((y / natH) * c2.height);
                        const srcIdx = (srcY * c2.width + srcX) * 4;
                        const outIdx = (y * natW + x) * 4;

                        if (srcIdx < sourceData.length) {
                          const srcAlpha = sourceData[srcIdx + 3];
                          const srcR = sourceData[srcIdx];
                          const srcG = sourceData[srcIdx + 1];
                          const srcB = sourceData[srcIdx + 2];

                          // Only set to white if source pixel was actually drawn
                          if (
                            srcAlpha > 50 &&
                            srcR > 200 &&
                            srcG > 200 &&
                            srcB > 200
                          ) {
                            outputData[outIdx] = 255;
                            outputData[outIdx + 1] = 255;
                            outputData[outIdx + 2] = 255;
                            outputData[outIdx + 3] = 255;
                          }
                        }
                      }
                    }

                    fallbackCtx.putImageData(outputImgData, 0, 0);
                    maskDataUrl = fallbackCanvas.toDataURL("image/png");
                  } else {
                    // If can't get source context, just fill with black
                    fallbackCtx.fillStyle = "rgb(0, 0, 0)";
                    fallbackCtx.fillRect(0, 0, natW, natH);
                    maskDataUrl = fallbackCanvas.toDataURL("image/png");
                  }
                } else {
                  maskDataUrl = c2.toDataURL("image/png");
                }
              } catch {
                maskDataUrl = c2.toDataURL("image/png");
              }
            } else {
              maskDataUrl = undefined;
            }
          }
        }
        if (!maskDataUrl) return; // Error already set above

        // Sanity-check the exported mask: ensure it actually contains painted
        // pixels (non-zero alpha). If the mask appears empty (often caused by
        // canvas sizing/probing failures) abort with a helpful message.
        try {
          const sanityOff = document.createElement("canvas");
          const dispRect = fillContainerRef.current?.getBoundingClientRect();
          const displayW = Math.max(
            1,
            Math.floor(dispRect?.width || fillCanvasRef.current?.width || 1),
          );
          const displayH = Math.max(
            1,
            Math.floor(dispRect?.height || fillCanvasRef.current?.height || 1),
          );
          const natW = Math.max(
            1,
            Math.floor(inputNaturalSize.width || displayW),
          );
          const natH = Math.max(
            1,
            Math.floor(inputNaturalSize.height || displayH),
          );
          sanityOff.width = natW;
          sanityOff.height = natH;
          const sctx = sanityOff.getContext("2d");
          if (sctx) {
            const maskImg = new window.Image();
            await new Promise<void>((resolve) => {
              maskImg.onload = () => {
                try {
                  sctx.drawImage(maskImg, 0, 0, natW, natH);
                } catch (e) { }
                resolve();
              };
              maskImg.onerror = () => resolve();
              maskImg.src = maskDataUrl as string;
            });
            try {
              const data = sctx.getImageData(
                0,
                0,
                Math.max(1, natW),
                Math.max(1, natH),
              ).data;
              let alphaNonZero = false;
              for (let i = 3; i < data.length; i += 4) {
                if (data[i] !== 0) {
                  alphaNonZero = true;
                  break;
                }
              }
              if (!alphaNonZero) {
                setErrorMsg(
                  "Mask appears empty. Please draw a mask with the brush and try again.",
                );
                setProcessing((prev) => ({
                  ...prev,
                  [selectedFeature]: false,
                }));
                return;
              }
            } catch (e) {
              // If getImageData fails (CORS), continue; we'll try rescaling below
            }
          }
        } catch (e) {
          // ignore sanity errors and proceed to probing/rescaling
        }

        // If we're sending an image_url (not a data URI), fetch the image to
        // obtain its true natural size and rescale the mask to match if needed.
        const fillSourceImage = String(normalizedInput).startsWith("data:")
          ? normalizedInput
          : currentInput;
        if (!String(fillSourceImage).startsWith("data:")) {
          try {
            const probeImg = new window.Image();
            probeImg.crossOrigin = "anonymous";
            const imgUrl = currentInput as string;
            await new Promise<void>((resolve) => {
              probeImg.onload = () => resolve();
              probeImg.onerror = () => resolve();
              probeImg.src = imgUrl;
            });
            const imgW = Math.max(
              1,
              Math.floor((probeImg as any).naturalWidth || 0),
            );
            const imgH = Math.max(
              1,
              Math.floor((probeImg as any).naturalHeight || 0),
            );
            if (imgW && imgH) {
              // Create an image from the mask data URL then draw into a canvas of the target size
              const maskImg = new window.Image();
              maskImg.crossOrigin = "anonymous";
              await new Promise<void>((resolve) => {
                maskImg.onload = () => {
                  try {
                    const final = document.createElement("canvas");
                    final.width = imgW;
                    final.height = imgH;
                    const fctx = final.getContext("2d");
                    if (fctx) fctx.drawImage(maskImg, 0, 0, imgW, imgH);
                    maskDataUrl = final.toDataURL("image/png");
                  } catch (e) {
                    // keep existing maskDataUrl on error
                  }
                  resolve();
                };
                maskImg.onerror = () => resolve();
                maskImg.src = maskDataUrl as string;
              });
            }
          } catch (e) {
            // Ignore probe failures; fallback maskDataUrl will be used and may fail server-side if sizes mismatch
            console.warn(
              "[Fill] failed to probe input image size for mask rescaling",
              e,
            );
          }
        }

        // Seedream 5 Lite masked edit flow for Replace/Erase.
        if (
          (selectedFeature === "erase" || selectedFeature === "fill") &&
          model === "seedream-5-lite"
        ) {
          try {
            const isReplace =
              selectedFeature === "fill"
                ? eraseActionMode === "replace"
                : false;

            // USE activePrompt to respect Fill mode's input
            const userPrompt = activePrompt ? activePrompt.trim() : "";

            // Keep prompts explicit but concise so the model prioritizes masked edits.
            const finalPrompt = isReplace
              ? `Image 0 is the original image and Image 1 is the mask. Replace ONLY white masked pixels in Image 0 with: ${userPrompt}. Keep all non-white masked areas unchanged and consistent with original lighting and perspective.`
              : `Image 0 is the original image and Image 1 is the mask. Remove/fill ONLY white masked pixels in Image 0. Keep all non-white masked areas unchanged and consistent with original lighting and perspective.`;

            const seedreamBaseInput = String(fillSourceImage).startsWith(
              "data:",
            )
              ? fillSourceImage
              : currentInput;
            const originalInputUrl = await ensureZataUrl(seedreamBaseInput);
            const maskInputUrl = maskDataUrl
              ? await ensureZataUrl(maskDataUrl)
              : null;

            const seedreamPayload: any = {
              prompt: finalPrompt,
              model: "bytedance/seedream-5-lite",
              size: "2K",
              image_input: maskInputUrl
                ? [originalInputUrl, maskInputUrl]
                : [originalInputUrl],
              aspect_ratio: "match_input_image",
              sequential_image_generation: "disabled",
              max_images: 1,
              isPublic,
            };

            const actionName = isReplace ? "Replace" : "Erase";
            const res = await axiosInstance.post(
              "/api/replicate/generate",
              seedreamPayload,
            );
            const generatedUrl =
              res?.data?.images?.[0]?.url ||
              res?.data?.data?.images?.[0]?.url ||
              res?.data?.data?.url ||
              res?.data?.url ||
              "";

            if (generatedUrl) {
              setOutputs((prev) => ({
                ...prev,
                [selectedFeature]: generatedUrl,
              }));

              try {
                setCurrentHistoryId(
                  res?.data?.data?.historyId || res?.data?.historyId || null,
                );
              } catch { }

              try {
                await (dispatch as any)(
                  loadHistory({
                    paginationParams: { limit: 60 },
                    requestOrigin: "page",
                    debugTag: `refresh-after-${selectedFeature}:${Date.now()}`,
                  }),
                );
              } catch { }
            } else {
              throw new Error(`No image URL returned from ${actionName} API`);
            }

            return;
          } catch (eraseErr) {
            console.error(`[EditImage] Seedream API Error:`, eraseErr);
            throw eraseErr;
          }
        }
        const promptToSend = (activePrompt || "").trim();
        const body: any = {
          isPublic,
          prompt: promptToSend,
        };
        // Add image (data URI or URL)
        if (String(fillSourceImage).startsWith("data:")) {
          body.image = fillSourceImage;
        } else {
          body.image_url = currentInput;
        }
        // Add mask (data URI or URL)
        if (String(maskDataUrl).startsWith("data:")) {
          body.mask = maskDataUrl;
        } else {
          body.mask_url = maskDataUrl;
        }
        // Optional parameters
        if (fillNegativePrompt && fillNegativePrompt.trim()) {
          body.negative_prompt = fillNegativePrompt.trim();
        }
        if (
          String(fillSeed).trim() !== "" &&
          Number.isFinite(Number(fillSeed))
        ) {
          body.seed = Math.floor(Number(fillSeed));
        }
        const numImages = Number(fillNumImages ?? 1);
        if (Number.isFinite(numImages) && numImages >= 1 && numImages <= 4) {
          body.num_images = Math.round(numImages);
        }
        if (fillSyncMode) {
          body.sync_mode = true;
        }
        console.log("[Fill] Request payload:", {
          ...body,
          image: body.image ? "[IMAGE_DATA]" : body.image_url,
          mask: body.mask ? "[MASK_DATA]" : body.mask_url,
        });
        try {
          const res = await axiosInstance.post("/api/fal/bria/genfill", body);
          const imagesArray =
            res?.data?.data?.images || res?.data?.images || [];
          const out =
            imagesArray[0]?.url ||
            res?.data?.data?.image?.url ||
            res?.data?.data?.url ||
            res?.data?.url ||
            "";
          if (out) setOutputs((prev) => ({ ...prev, ["fill"]: out }));
          try {
            setCurrentHistoryId(res?.data?.data?.historyId || null);
          } catch { }
          // Refresh global history so the Image Generation page sees the new fill entry immediately
          try {
            await (dispatch as any)(
              loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                debugTag: `refresh-after-fill:${Date.now()}`,
              }),
            );
          } catch { }
          return;
        } catch (fillError) {
          console.error("[Fill] API Error:", fillError);
          const fillErrorData = (fillError as any)?.response?.data;
          console.log("[Fill] Error response:", fillErrorData);
          throw fillError;
        }
      }

      if (selectedFeature === "resize" && model === "fal-ai/bria/expand") {
        // Build Bria Expand payload from UI.
        // Match payload structure exactly with wildmindcanvas/lib/api.ts expandImageForCanvas

        // 1. Validate Aspect Ratio
        let validAspectRatio: string | undefined = resizeAspectRatio;
        const validAspectRatios = [
          "1:1",
          "2:3",
          "3:2",
          "3:4",
          "4:3",
          "4:5",
          "5:4",
          "9:16",
          "16:9",
        ];
        if (validAspectRatio && !validAspectRatios.includes(validAspectRatio)) {
          // If "custom" or any other invalid value, allow backend to calculate or ignore
          // But api.ts logic says: if invalid, set to undefined.
          // Note: The UI sets 'custom' for custom dimensions. Brea API likely rejects 'custom'.
          validAspectRatio = undefined;
        }

        // 2. Prepare Payload
        // Note: We send Data URI directly to backend (via direct connection) to match Canvas logic
        // The backend (falService) handles uploading to Zata if needed.
        const inputStr = String(normalizedInput).startsWith("data:")
          ? normalizedInput
          : currentInput;

        const payload: any = {
          isPublic,
          sync_mode: !!resizeSyncMode,
        };

        if (String(inputStr).startsWith("data:")) {
          payload.image = inputStr;
        } else {
          payload.image_url = inputStr;
        }

        if (prompt && prompt.trim()) payload.prompt = prompt.trim();
        if (resizeNegativePrompt && resizeNegativePrompt.trim())
          payload.negative_prompt = resizeNegativePrompt.trim();
        if (resizeSeed !== "")
          payload.seed = Math.round(Number(resizeSeed) || 0);

        // Only include aspect_ratio if it's valid
        if (validAspectRatio) payload.aspect_ratio = validAspectRatio;

        // Dimensions must be number arrays
        if (resizeCanvasW && resizeCanvasH)
          payload.canvas_size = [Number(resizeCanvasW), Number(resizeCanvasH)];
        if (resizeOrigW && resizeOrigH)
          payload.original_image_size = [
            Number(resizeOrigW),
            Number(resizeOrigH),
          ];
        if (resizeOrigX !== "" && resizeOrigY !== "")
          payload.original_image_location = [
            Number(resizeOrigX),
            Number(resizeOrigY),
          ];

        // Bria Expand can take longer than default timeout, so set a longer timeout (300 seconds)
        console.log(
          "[EditImage] Specifying timeout: 300000ms for Expand request",
        );
        const expandStartTime = Date.now();

        // Optimistic credit deduction for Bria Expand (32 credits)
        let optimisticDeducted = false;
        try {
          deductCreditsOptimisticForGeneration(expandCredits);
          optimisticDeducted = true;
        } catch {
          // ignore optimistic debit errors
        }

        // DIRECT BACKEND CALL: Bypass Next.js proxy to avoid Vercel 60s timeout on rewrites
        // We construct the full URL to the backend service directly
        const backendBase = (
          process.env.NEXT_PUBLIC_API_BASE_URL || ""
        ).replace(/\/$/, "");
        const directUrl = `${backendBase}/api/wildmind/expand`;

        console.log("[EditImage] Making DIRECT backend call to:", directUrl);

        let res;
        try {
          res = await axiosInstance.post(directUrl, payload, {
            timeout: 300000, // 300 seconds
          });
        } catch (err) {
          // Rollback optimistic deduction on error
          if (optimisticDeducted) {
            try {
              rollbackOptimisticDeduction(expandCredits);
            } catch {
              // ignore rollback errors
            }
          }
          throw err;
        }

        console.log(
          `[EditImage] Expand request completed in ${Date.now() - expandStartTime}ms`,
        );
        const outUrl =
          res?.data?.data?.image?.url ||
          res?.data?.data?.images?.[0]?.url ||
          res?.data?.images?.[0]?.url ||
          res?.data?.data?.url ||
          res?.data?.url ||
          "";
        if (outUrl) setOutputs((prev) => ({ ...prev, ["resize"]: outUrl }));
        try {
          setCurrentHistoryId(res?.data?.data?.historyId || null);
        } catch { }
        // Refresh credits after successful generation
        try {
          await refreshCredits();
        } catch { }
        // Refresh global history so the Image Generation page sees the new resize entry immediately
        try {
          await (dispatch as any)(
            loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: "page",
              debugTag: `refresh-after-resize:${Date.now()}`,
            }),
          );
        } catch { }
        return;
      }

      if (selectedFeature === "remove-bg") {
        const body: any = {
          image: String(normalizedInput).startsWith("data:")
            ? normalizedInput
            : currentInput,
          isPublic,
          model,
        };
        if (model.startsWith("bria/eraser")) {
          // Export mask if drawn, scaled to input natural size
          const maskDataUrl = (() => {
            const c = fillCanvasRef.current;
            if (!c) return undefined as any;
            if (!hasMask) return undefined as any;
            try {
              const off = document.createElement("canvas");
              const dispRect =
                fillContainerRef.current?.getBoundingClientRect();
              const displayW = Math.max(
                1,
                Math.floor(dispRect?.width || c.width),
              );
              const displayH = Math.max(
                1,
                Math.floor(dispRect?.height || c.height),
              );
              const natW = Math.max(
                1,
                Math.floor(inputNaturalSize.width || displayW),
              );
              const natH = Math.max(
                1,
                Math.floor(inputNaturalSize.height || displayH),
              );
              off.width = natW;
              off.height = natH;
              const octx = off.getContext("2d");
              if (!octx) return c.toDataURL("image/png");
              // See note above: draw from the canvas's full pixel buffer.
              octx.drawImage(c, 0, 0, c.width, c.height, 0, 0, natW, natH);
              // Quick sanity: ensure mask has non-zero alpha
              try {
                const d = octx.getImageData(
                  0,
                  0,
                  Math.max(1, natW),
                  Math.max(1, natH),
                ).data;
                let hasAlpha = false;
                for (let i = 3; i < d.length; i += 4) {
                  if (d[i] !== 0) {
                    hasAlpha = true;
                    break;
                  }
                }
                if (!hasAlpha) return undefined as any;
              } catch (e) {
                // ignore getImageData errors (CORS)
              }
              return off.toDataURL("image/png");
            } catch {
              const c = fillCanvasRef.current as HTMLCanvasElement | null;
              return c ? c.toDataURL("image/png") : undefined;
            }
          })();
          if (maskDataUrl) body.mask = maskDataUrl;
          body.mask_type = "manual";
          body.preserve_alpha = true;
          body.sync = true;
        } else if (model.startsWith("851-labs/")) {
          if (output) body.format = output as any;
          if (backgroundType) body.background_type = backgroundType;
          if (threshold) body.threshold = Number(threshold);
          if (reverseBg) body.reverse = true;
        }
        const res = await axiosInstance.post("/api/replicate/remove-bg", body);
        console.log("[EditImage] remove-bg.res", res?.data);

        // Extract URL from response - match upscale pattern exactly
        // Backend returns { data: { images: [{ url, storagePath }] } }
        const first =
          res?.data?.data?.images?.[0]?.url ||
          res?.data?.data?.images?.[0] ||
          res?.data?.data?.url ||
          res?.data?.url ||
          "";

        if (first) {
          console.log("[EditImage] remove-bg output URL:", {
            first,
            selectedFeature,
          });
          // Set output directly like upscale does - no URL conversion needed since backend returns full URL
          setOutputs((prev) => ({ ...prev, ["remove-bg"]: first }));
          // Default to Zoom mode for remove-bg so transparent outputs are visible
          setUpscaleViewMode("zoom");
          // Ensure processing is set to false
          setProcessing((prev) => ({ ...prev, ["remove-bg"]: false }));
          try {
            setCurrentHistoryId(res?.data?.data?.historyId || null);
          } catch { }
          // Refresh global history so the Image Generation page sees the new remove-bg entry immediately
          try {
            await (dispatch as any)(
              loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                debugTag: `refresh-after-remove-bg:${Date.now()}`,
              }),
            );
          } catch { }
        } else {
          console.error(
            "[EditImage] remove-bg: No output URL found in response",
            res?.data,
          );
          setProcessing((prev) => ({ ...prev, ["remove-bg"]: false }));
        }
      } else if (false) {
        // Route to provider based on selected model
        const chosenModel = selectedGeneratorModel || "gemini-25-flash-image";
        const isRunway =
          chosenModel === "gen4_image" ||
          chosenModel === "gen4_image_turbo" ||
          chosenModel === "gemini_2.5_flash";
        const isFalImageModel =
          chosenModel === "gemini-25-flash-image" ||
          chosenModel.toLowerCase().includes("seedream");
        const isFluxKontext = chosenModel.startsWith("flux-kontext");
        const isMiniMax = chosenModel === "minimax-image-01";
        if (isMiniMax) {
          setErrorMsg(
            "MiniMax is not supported for image edit with prompt. Please choose Runway Gen4, Flux Kontext Pro/Max, Google Nano Banana, or Seedream v4.",
          );
          return;
        }
        if (!isRunway && !isFalImageModel && !isFluxKontext) {
          setErrorMsg(
            "This model does not support image edit with prompt. Please select Runway Gen4, Flux Kontext Pro/Max, Google Nano Banana, or Seedream v4.",
          );
          return;
        }

        if (isRunway) {
          // Map simple aspect ratios to Runway pixel ratios
          const mapToRunwayRatio = (ratio: string): string => {
            switch (ratio) {
              case "1:1":
                return "1024:1024"; // allowed
              case "9:16":
                return "720:1280"; // allowed
              case "16:9":
                return "1280:720"; // allowed
              case "3:4":
                return "1080:1440"; // allowed
              case "4:3":
                return "1440:1080"; // allowed
              case "2:3":
                return "720:1080"; // not listed; use closest allowed 720:1280
              case "3:2":
                return "1360:768"; // allowed set includes 1360:768
              case "21:9":
                return "1680:720"; // allowed
              default:
                return "1024:1024";
            }
          };
          // Upload image to Zata if needed
          const runwayImageUrl = await ensureZataUrl(currentInputRaw);
          const runwayPayload: any = {
            promptText: prompt || "",
            model: chosenModel,
            ratio: mapToRunwayRatio(String(frameSize)),
            referenceImages: [{ uri: runwayImageUrl }],
            uploadedImages: [runwayImageUrl],
            generationType: "text-to-image",
            isPublic,
          };
          const res = await axiosInstance.post(
            "/api/runway/generate",
            runwayPayload,
          );
          const taskId = res?.data?.data?.taskId || res?.data?.taskId;

          if (taskId) {
            // Poll for completion like the image generation flow
            let imageUrl: string | undefined;
            for (let attempts = 0; attempts < 360; attempts++) {
              try {
                const statusRes = await axiosInstance.get(
                  `/api/runway/status/${taskId}`,
                );
                const status = statusRes?.data?.data || statusRes?.data;

                if (
                  status?.status === "completed" &&
                  Array.isArray(status?.images) &&
                  status.images.length > 0
                ) {
                  imageUrl =
                    status.images[0]?.url || status.images[0]?.originalUrl;
                  break;
                }
                if (status?.status === "failed") {
                  throw new Error("Runway generation failed");
                }
              } catch (statusError) {
                console.error("Status check failed:", statusError);
                if (attempts === 359) throw statusError; // Only throw on final attempt
              }
              await new Promise((res) => setTimeout(res, 1000));
            }

            if (imageUrl) {
              // no-op after removing using-prompt feature
            } else {
              throw new Error("Runway generation did not complete in time");
            }
          } else {
            throw new Error("No task ID returned from Runway");
          }
        } else if (isFalImageModel) {
          // FAL models
          const promptWithStyle =
            selectedStyle && selectedStyle !== "none"
              ? `${prompt} [Style: ${selectedStyle}]`
              : prompt || "";
          let payload: any;
          if (chosenModel.toLowerCase().includes("seedream")) {
            // Seedream v4 expects specific fields
            // Upload image to Zata if needed
            const seedreamImageUrl = await ensureZataUrl(currentInputRaw);
            payload = {
              prompt: promptWithStyle,
              model: "bytedance/seedream-4",
              size: "2K",
              aspect_ratio: frameSize,
              image_input: [seedreamImageUrl],
              sequential_image_generation: "disabled",
              max_images: 1,
              isPublic,
            };

            // Use Replicate generate endpoint (same as image generation flow)
            const res = await axiosInstance.post(
              "/api/replicate/generate",
              payload,
            );
            const out =
              res?.data?.images?.[0]?.url ||
              res?.data?.data?.images?.[0]?.url ||
              res?.data?.data?.url ||
              res?.data?.url ||
              "";
            if (out) {
            }
            return;
          } else {
            // Google Nano Banana (gemini-25-flash-image)
            // Upload image to Zata if needed
            const falImageUrl = await ensureZataUrl(currentInputRaw);
            const imagesToUse =
              reduxUploadedImages && reduxUploadedImages.length > 0
                ? await Promise.all(
                  reduxUploadedImages.map((img: string) =>
                    ensureZataUrl(img),
                  ),
                )
                : [falImageUrl];
            payload = {
              prompt: promptWithStyle,
              model: chosenModel,
              uploadedImages: imagesToUse,
              aspect_ratio: frameSize,
              isPublic,
              num_images: 1,
              output_format: "jpeg",
            };
          }
          const res = await axiosInstance.post("/api/fal/generate", payload);
          const out =
            res?.data?.images?.[0]?.url ||
            res?.data?.data?.images?.[0]?.url ||
            res?.data?.data?.url ||
            res?.data?.url ||
            "";
          if (out) {
          }
        } else if (isFluxKontext) {
          // Flux Kontext I2I through the same payload shape as text-to-image
          // Upload image to Zata if needed
          const fluxKontextImageUrl = await ensureZataUrl(currentInputRaw);
          const payload: any = {
            prompt: prompt || "",
            model: chosenModel,
            n: 1,
            frameSize: frameSize,
            generationType: "text-to-image",
            uploadedImages: [fluxKontextImageUrl],
            style: "none",
            isPublic,
          };
          const res = await axiosInstance.post("/api/bfl/generate", payload);
          const out =
            res?.data?.images?.[0]?.url ||
            res?.data?.data?.images?.[0]?.url ||
            res?.data?.data?.url ||
            res?.data?.url ||
            "";
          if (out) {
          }
        }
      } else if (selectedFeature === "reimagine") {
        if (!reimagineSelectionBounds) {
          setErrorMsg("Please select a region to reimagine.");
          return;
        }

        if (!reimaginePrompt || !reimaginePrompt.trim()) {
          setErrorMsg("Please enter a prompt for reimagine.");
          return;
        }

        // Calculate selection bounds in natural image space
        const containerRect = fillContainerRef.current?.getBoundingClientRect();
        if (!containerRect) throw new Error("Container not found");

        const natW = inputNaturalSize.width;
        const natH = inputNaturalSize.height;

        if (!natW || !natH) throw new Error("Image dimensions not found");

        // CRITICAL FIX: When image uses object-fit:contain, we need to calculate
        // the actual displayed dimensions within the container
        const containerAspect = containerRect.width / containerRect.height;
        const imageAspect = natW / natH;

        let displayedWidth: number;
        let displayedHeight: number;
        let offsetX = 0;
        let offsetY = 0;

        if (imageAspect > containerAspect) {
          // Image is wider - constrained by width
          displayedWidth = containerRect.width;
          displayedHeight = containerRect.width / imageAspect;
          offsetY = (containerRect.height - displayedHeight) / 2;
        } else {
          // Image is taller - constrained by height
          displayedHeight = containerRect.height;
          displayedWidth = containerRect.height * imageAspect;
          offsetX = (containerRect.width - displayedWidth) / 2;
        }

        // Calculate scale factors based on displayed size
        const scaleX = natW / displayedWidth;
        const scaleY = natH / displayedHeight;

        // Adjust selection bounds to account for the offset (letterboxing/pillarboxing)
        const adjustedSelectionBounds = {
          x: reimagineSelectionBounds.x - offsetX,
          y: reimagineSelectionBounds.y - offsetY,
          width: reimagineSelectionBounds.width,
          height: reimagineSelectionBounds.height,
        };

        const scaledBounds = {
          x: Math.floor(adjustedSelectionBounds.x * scaleX),
          y: Math.floor(adjustedSelectionBounds.y * scaleY),
          width: Math.floor(adjustedSelectionBounds.width * scaleX),
          height: Math.floor(adjustedSelectionBounds.height * scaleY),
        };

        console.log("[Frontend] Image dimensions:", { natW, natH });
        console.log("[Frontend] Container dimensions:", {
          width: containerRect.width,
          height: containerRect.height,
        });
        console.log("[Frontend] Displayed dimensions:", {
          displayedWidth,
          displayedHeight,
        });
        console.log("[Frontend] Offset:", { offsetX, offsetY });
        console.log("[Frontend] Scale factors:", { scaleX, scaleY });
        console.log(
          "[Frontend] Original selection bounds:",
          reimagineSelectionBounds,
        );
        console.log(
          "[Frontend] Adjusted selection bounds:",
          adjustedSelectionBounds,
        );
        console.log("[Frontend] Scaled selection bounds:", scaledBounds);

        // Call backend reimagine endpoint
        const payload: any = {
          image_url: currentInput,
          selection_bounds: scaledBounds,
          prompt: reimaginePrompt.trim(),
          isPublic,
        };

        // Include reference image if available
        if (reimagineReferenceImage) {
          payload.referenceImage = reimagineReferenceImage;
        }

        // Only include model if user explicitly chose one (not 'auto')
        if (reimagineModel !== "auto") {
          payload.model = reimagineModel;
          console.log("🎯 [Frontend] MANUALLY SELECTED MODEL:", reimagineModel);
        } else {
          console.log(
            "🤖 [Frontend] AUTO MODEL SELECTION (backend will decide)",
          );
        }

        console.log("[Frontend] Reimagine Payload:", payload);

        const res = await axiosInstance.post(
          "/api/reimagine/generate",
          payload,
        );
        const reimaginedUrl =
          res?.data?.data?.reimagined_image ||
          res?.data?.reimagined_image ||
          "";

        if (!reimaginedUrl) throw new Error("No reimagined image returned");

        setOutputs((prev) => ({ ...prev, ["reimagine"]: reimaginedUrl }));
        try {
          setCurrentHistoryId(res?.data?.data?.historyId || null);
        } catch { }

        // Refresh history
        try {
          await (dispatch as any)(
            loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: "page",
              debugTag: `refresh-after-reimagine:${Date.now()}`,
            }),
          );
        } catch { }

        // Reset selection
        setReimagineSelectionConfirmed(false);
        setReimagineSelectionBounds(null);
        setReimagineLiveBounds(null);
        setHasMask(false);
        setReimaginePrompt("");

        // Clear visual mask
        const fillCtx = fillCanvasRef.current?.getContext("2d");
        if (fillCtx && fillContainerRef.current) {
          fillCtx.clearRect(
            0,
            0,
            fillContainerRef.current.clientWidth,
            fillContainerRef.current.clientHeight,
          );
        }

        toast.success("Reimagine complete!");
        return;
      } else {
        const parseScale = (fallback: number) => {
          const s = String(scaleFactor || "")
            .toLowerCase()
            .trim();
          const n = s.endsWith("x") ? Number(s.replace("x", "")) : Number(s);
          if (!Number.isFinite(n) || n <= 0) return fallback;
          return n;
        };
        // Defaults mirror UpscalePopup: clarity 2, esrgan 4
        const clarityScale = parseScale(2);
        const esrganScale = parseScale(4);
        let payload: any = {
          image: String(normalizedInput).startsWith("data:")
            ? normalizedInput
            : currentInput,
          model,
        };
        if (model === "philz1337x/clarity-upscaler") {
          const dyn = dynamic ? Number(dynamic) : 6;
          const shp = sharpen ? Number(sharpen) : 0;
          payload = {
            ...payload,
            scale_factor: clarityScale,
            output_format: output,
            dynamic: Number.isFinite(dyn) ? dyn : 6,
            sharpen: Number.isFinite(shp) ? shp : 0,
          };
        } else if (model === "nightmareai/real-esrgan") {
          payload = {
            ...payload,
            scale: esrganScale,
            face_enhance: faceEnhance,
          };
        } else if (model === "philz1337x/crystal-upscaler") {
          const crystalScale = Math.max(1, Math.min(4, clarityScale));
          const fmt = output === "jpg" || output === "png" ? output : "png";
          payload = {
            ...payload,
            scale_factor: crystalScale,
            output_format: fmt,
          };

          // Pre-check credits using the same pixel-tier pricing as backend.
          const w0 = Number(inputNaturalSize?.width || 0);
          const h0 = Number(inputNaturalSize?.height || 0);
          const estimate =
            Number.isFinite(w0) && Number.isFinite(h0) && w0 > 0 && h0 > 0
              ? estimateCrystalUpscalerCredits(w0, h0, crystalScale)
              : null;
          const expectedCredits = estimate?.credits;
          if (expectedCredits && expectedCredits > 0) {
            if ((creditBalance || 0) < expectedCredits) {
              throw new Error(
                `Insufficient credits. Need ${expectedCredits}, have ${creditBalance || 0}`,
              );
            }
            try {
              deductCreditsOptimisticForGeneration(expectedCredits);
              optimisticDebit = expectedCredits;
            } catch { }
          }
        } else if (model === "fal-ai/seedvr/upscale/image") {
          // SeedVR factor-only upscaler (credits: 1 per output megapixel, rounded up)
          const getNaturalSize = async () => {
            const w0 = Number(inputNaturalSize?.width || 0);
            const h0 = Number(inputNaturalSize?.height || 0);
            if (Number.isFinite(w0) && Number.isFinite(h0) && w0 > 0 && h0 > 0)
              return { width: w0, height: h0 };
            const src = String(normalizedInput).startsWith("data:")
              ? normalizedInput
              : String(currentInput || normalizedInput);
            return await new Promise<{ width: number; height: number }>(
              (resolve, reject) => {
                const img = document.createElement("img");
                img.onload = () => {
                  const width = Number(img.naturalWidth || img.width || 0);
                  const height = Number(img.naturalHeight || img.height || 0);
                  if (!width || !height)
                    return reject(new Error("Could not read image dimensions"));
                  resolve({ width, height });
                };
                img.onerror = () =>
                  reject(new Error("Failed to load image for sizing"));
                img.src = src;
              },
            );
          };

          const factor = Math.max(
            1,
            Math.min(8, Math.round(Number(seedvrUpscaleFactor) || 2)),
          );
          const { width: inW, height: inH } = await getNaturalSize();
          const outW = Math.max(1, Math.round(inW * factor));
          const outH = Math.max(1, Math.round(inH * factor));
          const expectedCredits = Math.max(
            1,
            Math.ceil((outW * outH) / 1_000_000),
          );

          if ((creditBalance || 0) < expectedCredits) {
            throw new Error(
              `Insufficient credits. Need ${expectedCredits}, have ${creditBalance || 0}`,
            );
          }

          if (expectedCredits > 0) {
            try {
              deductCreditsOptimisticForGeneration(expectedCredits);
              optimisticDebit = expectedCredits;
            } catch {
              /* ignore optimistic errors */
            }
          }

          const normalizedLocal = normalizedInput;
          const isData = String(normalizedLocal).startsWith("data:");
          const body: any = {
            ...(isData
              ? { image: normalizedLocal }
              : { image_url: currentInput }),
            upscale_mode: "factor",
            upscale_factor: factor,
            noise_scale: 0.1,
            output_format:
              output === "jpg" || output === "png" ? output : "jpg",
          };

          const res = await axiosInstance.post(
            "/api/fal/seedvr/upscale/image",
            body,
          );
          const first =
            res?.data?.data?.images?.[0]?.url ||
            res?.data?.images?.[0]?.url ||
            res?.data?.data?.image?.url ||
            res?.data?.data?.url ||
            res?.data?.url ||
            "";
          if (first) setOutputs((prev) => ({ ...prev, ["upscale"]: first }));
          try {
            setCurrentHistoryId(res?.data?.data?.historyId || null);
          } catch { }
          try {
            await (dispatch as any)(
              loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                debugTag: `refresh-after-upscale-seedvr:${Date.now()}`,
              }),
            );
          } catch { }
          try {
            await refreshCredits();
          } catch { }
          return;
        } else if (model === "fal-ai/topaz/upscale/image") {
          // Use FAL Topaz Upscaler endpoint
          const expectedCredits = topazEstimate?.credits;
          if (expectedCredits && expectedCredits > 0) {
            if ((creditBalance || 0) < expectedCredits) {
              throw new Error(
                `Insufficient credits. Need ${expectedCredits}, have ${creditBalance || 0}`,
              );
            }
            try {
              deductCreditsOptimisticForGeneration(expectedCredits);
              optimisticDebit = expectedCredits;
            } catch { }
          }

          const normalizedLocal = normalizedInput;
          const isData = String(normalizedLocal).startsWith("data:");
          const body: any = {
            ...(isData
              ? { image: normalizedLocal }
              : { image_url: currentInput }),
            model: topazModel,
            upscale_factor: Number(topazUpscaleFactor) || 2,
            crop_to_fill: Boolean(topazCropToFill),
            output_format: topazOutputFormat,
            subject_detection: topazSubjectDetection,
            face_enhancement: Boolean(topazFaceEnhance),
          };
          if (topazFaceCreativity != null)
            body.face_enhancement_creativity = Number(topazFaceCreativity) || 0;
          if (topazFaceStrength != null)
            body.face_enhancement_strength = Number(topazFaceStrength) || 0.8;
          const res = await axiosInstance.post(
            "/api/fal/topaz/upscale/image",
            body,
          );
          const first =
            res?.data?.data?.images?.[0]?.url ||
            res?.data?.images?.[0]?.url ||
            res?.data?.data?.image?.url ||
            res?.data?.data?.url ||
            res?.data?.url ||
            "";
          if (first) setOutputs((prev) => ({ ...prev, ["upscale"]: first }));
          try {
            setCurrentHistoryId(res?.data?.data?.historyId || null);
          } catch { }
          // Refresh global history so the Image Generation page sees the new upscale entry immediately
          try {
            await (dispatch as any)(
              loadHistory({
                paginationParams: { limit: 60 },
                requestOrigin: "page",
                debugTag: `refresh-after-upscale-topaz:${Date.now()}`,
              }),
            );
          } catch { }
          return;
        }
        // else if (model === 'fermatresearch/magic-image-refiner') {
        //   payload = { ...payload };

        // Provide input dimensions when available (helps server-side pricing for Crystal Upscaler)
        try {
          const w0 = Number((inputNaturalSize as any)?.width || 0);
          const h0 = Number((inputNaturalSize as any)?.height || 0);
          if (Number.isFinite(w0) && Number.isFinite(h0) && w0 > 0 && h0 > 0) {
            payload = { ...payload, width: w0, height: h0 };
          }
        } catch { }

        const res = await axiosInstance.post("/api/replicate/upscale", payload);
        console.log("[EditImage] upscale.res", res?.data);
        const first =
          res?.data?.data?.images?.[0]?.url ||
          res?.data?.data?.images?.[0] ||
          res?.data?.data?.url ||
          res?.data?.url ||
          "";
        if (first) setOutputs((prev) => ({ ...prev, ["upscale"]: first }));
        try {
          setCurrentHistoryId(res?.data?.data?.historyId || null);
        } catch { }
        // Refresh global history so the Image Generation page sees the new upscale entry immediately
        try {
          await (dispatch as any)(
            loadHistory({
              paginationParams: { limit: 60 },
              requestOrigin: "page",
              debugTag: `refresh-after-upscale:${Date.now()}`,
            }),
          );
        } catch { }
      }
    } catch (e) {
      if (optimisticDebit > 0) {
        try {
          rollbackOptimisticDeduction(optimisticDebit);
        } catch { }
      }
      console.error("[EditImage] run.error", e);
      const errorData = (e as any)?.response?.data;
      let msg =
        (errorData && (errorData.message || errorData.error)) ||
        (e as any)?.message ||
        "Request failed";
      if (!msg && Array.isArray(errorData)) {
        try {
          msg = errorData.map((x: any) => x?.msg || x).join(", ");
        } catch { }
      }
      if (typeof msg !== "string") {
        try {
          msg = JSON.stringify(errorData);
        } catch { }
      }
      console.log("[EditImage] Error details:", errorData);
      setErrorMsg(String(msg));
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
    }
  };

  const handleReset = () => {
    setInputs({
      upscale: null,
      "remove-bg": null,
      resize: null,
      fill: null,
      vectorize: null,
      erase: null,
      expand: null,
      reimagine: null,
      "live-chat": null,
      "style-combination": null,
    });
    setOutputs({
      upscale: null,
      "remove-bg": null,
      resize: null,
      fill: null,
      vectorize: null,
      erase: null,
      expand: null,
      reimagine: null,
      "live-chat": null,
      "style-combination": null,
    });
    // Set appropriate default model based on selected feature
    if (selectedFeature === "remove-bg") {
      setModel("851-labs/background-remover");
    } else if (selectedFeature === "upscale") {
      setModel("philz1337x/crystal-upscaler");
    } else if (selectedFeature === "resize") {
      setModel("fal-ai/bria/expand");
    } else if (selectedFeature === "vectorize") {
      setModel("fal-ai/recraft/vectorize" as any);
    }
    setPrompt("");
    setScaleFactor("");
    setOutput("png");
    setDynamic("");
    setSharpen("");
    setBackgroundType("rgba");
    setThreshold("");
    setResizeExpandLeft(0);
    setResizeExpandRight(0);
    setResizeExpandTop(0);
    setResizeExpandBottom(400);
    setResizeZoomOutPercentage(20);
    setResizeNumImages(1);
    setResizeSafetyChecker(true);
    setResizeSyncMode(false);
    setResizeOutputFormat("png");
    setResizeAspectRatio("");
    setFillSeed("");
    setFillNegativePrompt("");
    setFillNumImages(1);
    setFillSyncMode(false);
    setIsMasking(false);
    setHasMask(false);
    setStyleComboSelectedIds([]);
    setStyleComboExtraPrompt("");
    setStyleComboIndianSearch("");
    setStyleComboTab("general");
    setStyleComboIndianVersion("V1");
    setStyleComboModel("google/nano-banana-pro");
    setStyleComboFrameSize("1:1");
    setStyleComboResolution("2K");
    setStyleComboDropdown("");
    setEraseFrameMaskResetNonce((n) => n + 1);
    setStyleComboMaskPainted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper functions from ImagePreviewModal.tsx
  const toProxyPath = React.useCallback((urlOrPath: string | undefined) => {
    if (!urlOrPath) return "";
    const ZATA_PREFIX = "https://idr01.zata.ai/devstoragev1/";
    if (urlOrPath.startsWith(ZATA_PREFIX)) {
      return urlOrPath.substring(ZATA_PREFIX.length);
    }
    return urlOrPath;
  }, []);

  const toProxyDownloadUrl = (urlOrPath: string | undefined) => {
    const path = toProxyPath(urlOrPath);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    return path
      ? `${API_BASE}/api/proxy/download/${encodeURIComponent(path)}`
      : "";
  };

  const handleDownloadOutput = async () => {
    try {
      const url = outputs[selectedFeature];
      if (!url) {
        alert("No image available to download");
        return;
      }

      await downloadFileWithNaming(url, null, "image", "edited");
    } catch (e) {
      console.error("[EditImage] download.error", e);
      alert("Failed to download image. Please try again.");
    }
  };

  const handleShareOutput = async () => {
    const shareUrl = outputs[selectedFeature] || "";
    try {
      if (!shareUrl) {
        alert("No image available to share");
        return;
      }

      // Use the same logic as ImagePreviewModal
      if (!navigator.share) {
        // Fallback: Copy image URL to clipboard
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert("Image URL copied to clipboard!");
        return;
      }

      // Fetch the image as a blob
      const downloadUrl = toProxyDownloadUrl(shareUrl);
      if (!downloadUrl) {
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert("Image URL copied to clipboard!");
        return;
      }

      const response = await fetch(downloadUrl, {
        credentials: "include",
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      const blob = await response.blob();
      const fileName =
        (toProxyPath(shareUrl) || "generated-image").split("/").pop() ||
        "generated-image.jpg";

      // Create a File from the blob
      const file = new File([blob], fileName, { type: blob.type });

      // Use Web Share API
      await navigator.share({
        title: "Wild Mind AI Generated Image",
        text: `Check out this AI-generated image!`,
        files: [file],
      });

      console.log("Image shared successfully");
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.name === "AbortError") {
        console.log("Share cancelled by user");
        return;
      }

      // Fallback to copying URL
      console.error("Share failed:", error);
      try {
        await copyToClipboard(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1500);
        alert("Sharing not supported. Image URL copied to clipboard!");
      } catch (copyError) {
        console.error("Copy failed:", copyError);
        alert("Unable to share image. Please try downloading instead.");
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleFeatureTabsScroll = () => {
    try {
      const el = featureTabsRef.current;
      if (!el) return;
      setHasLeftScroll(el.scrollLeft > 4);
    } catch { }
  };

  const handleFeatureSelect = (featureId: EditFeature) => {
    setSelectedFeature(featureId);
    const params = new URLSearchParams(window.location.search);
    params.set("feature", featureId);
    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });

    if (featureId === "remove-bg") {
      setModel("851-labs/background-remover");
    } else if (featureId === "upscale") {
      setModel("philz1337x/crystal-upscaler");
    } else if (featureId === "resize") {
      setModel("fal-ai/bria/expand");
    } else if (featureId === "vectorize") {
      setModel("fal-ai/recraft/vectorize" as any);
    }

    setProcessing((prev) => ({ ...prev, [featureId]: false }));
  };

  return {
    activeDropdown,
    activeLiveIndex,
    allHistoryEntries,
    availableModels,
    backgroundType,
    beginMaskStroke,
    brushSize,
    chatListRef,
    clampOffset,
    continueMaskStroke,
    copyToClipboard,
    crystalEstimate,
    currentHistoryId,
    currentVectorizeCredits,
    dispatch,
    dragStart,
    dragStartRef,
    draggingEdge,
    drawExpandCanvas,
    dynamic,
    effectiveVectorizeCredits,
    endMaskStroke,
    ensureZataUrl,
    eraseActionMode,
    eraseBrushSize,
    eraseCredits,
    eraseFrameMaskResetNonce,
    eraseIsDrawing,
    eraseIsPreviewing,
    eraseMaskData,
    eraseMode,
    eraseModel,
    erasePrompt,
    errorMsg,
    estimateTopazCredits,
    expandAspectRatio,
    expandBottomPx,
    expandBounds,
    expandCanvasRef,
    expandContainerRef,
    expandCredits,
    expandCustomHeight,
    expandCustomWidth,
    expandEffectiveHeight,
    expandEffectiveWidth,
    expandHoverEdge,
    expandImageRef,
    expandLeftPx,
    expandOriginalSize,
    expandResizing,
    expandRightPx,
    expandTopPx,
    faceEnhance,
    featureDisplayName,
    featurePreviewGif,
    featureTabsRef,
    features,
    fileInputRef,
    fillCanvasRef,
    fillContainerRef,
    fillNegativePrompt,
    fillNumImages,
    fillSeed,
    fillSyncMode,
    fitScale,
    frameSize,
    getCanvasContext,
    getExpandCanvasContext,
    getExpandHandle,
    getLiveModelCredits,
    getRenderedImageRect,
    getSwinTaskLabel,
    getUpscaleModelLabel,
    handleDeleteLiveChatImage,
    handleDownloadOutput,
    handleExpandMouseDown,
    handleExpandMouseMove,
    handleExpandMouseUp,
    handleFeatureSelect,
    handleFeatureTabsScroll,
    handleFileSelect,
    handleImageClick,
    handleKeyDown,
    handleLiveGenerate,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleOpenUploadModal,
    handleReset,
    handleRun,
    handleShareOutput,
    handleWheel,
    hasLeftScroll,
    hasMask,
    historyEntries,
    historyError,
    historyFilters,
    historyHasMore,
    historyLoading,
    hoveredThumbnailIdx,
    imageContainerRef,
    imageRef,
    inputNaturalSize,
    inputs,
    isAdjustingBrush,
    isDraggingSelection,
    isDrawingRectangle,
    isMasking,
    isPanning,
    isUploadOpen,
    lastMsgRef,
    lastPoint,
    lastTabChangeRef,
    liveActiveDropdown,
    liveAllowedModels,
    liveChatMessages,
    liveCredits,
    liveFrameSize,
    liveFrameSizes,
    liveHistory,
    liveModel,
    liveOriginalInput,
    livePrompt,
    liveQuality,
    liveResolution,
    liveResolutionOptions,
    liveResolutionOptionsByModel,
    menuButtonRef,
    menuRef,
    modalOpenedRef,
    model,
    naturalSize,
    normalizeExpandDims,
    offset,
    output,
    outputs,
    parseOutputUrl,
    pointFromMouseEvent,
    pointFromTouchEvent,
    processing,
    prompt,
    realEsrganEstimate,
    rectangleCurrent,
    rectangleStart,
    reduxUploadedImages,
    reimagineLiveBounds,
    reimagineModel,
    reimaginePrompt,
    reimagineReferenceImage,
    reimagineSelectionBounds,
    reimagineSelectionConfirmed,
    reimagineSelectionMode,
    resetZoom,
    resizeAspectRatio,
    resizeCanvasH,
    resizeCanvasToContainer,
    resizeCanvasW,
    resizeExpandBottom,
    resizeExpandLeft,
    resizeExpandRight,
    resizeExpandTop,
    resizeNegativePrompt,
    resizeNumImages,
    resizeOrigH,
    resizeOrigW,
    resizeOrigX,
    resizeOrigY,
    resizeOutputFormat,
    resizeSafetyChecker,
    resizeSeed,
    resizeSyncMode,
    resizeZoomOutPercentage,
    reverseBg,
    router,
    scale,
    scaleFactor,
    searchParams,
    seedvrEstimate,
    seedvrUpscaleFactor,
    selectedFeature,
    selectedGeneratorModel,
    selectedStyle,
    setActiveDropdown,
    setActiveLiveIndex,
    setBackgroundType,
    setBrushSize,
    setCurrentHistoryId,
    setDragStart,
    setDraggingEdge,
    setDynamic,
    setEraseActionMode,
    setEraseBrushSize,
    setEraseFrameMaskResetNonce,
    setEraseIsDrawing,
    setEraseIsPreviewing,
    setEraseMaskData,
    setEraseMode,
    setEraseModel,
    setErasePrompt,
    setErrorMsg,
    setExpandAspectRatio,
    setExpandBottomPx,
    setExpandBounds,
    setExpandCustomHeight,
    setExpandCustomWidth,
    setExpandEffectiveHeight,
    setExpandEffectiveWidth,
    setExpandHoverEdge,
    setExpandLeftPx,
    setExpandOriginalSize,
    setExpandResizing,
    setExpandRightPx,
    setExpandTopPx,
    setFaceEnhance,
    setFillNegativePrompt,
    setFillNumImages,
    setFillSeed,
    setFillSyncMode,
    setFitScale,
    setHasLeftScroll,
    setHasMask,
    setHoveredThumbnailIdx,
    setInputNaturalSize,
    setInputs,
    setIsAdjustingBrush,
    setIsDraggingSelection,
    setIsDrawingRectangle,
    setIsMasking,
    setIsPanning,
    setIsUploadOpen,
    setLastPoint,
    setLiveActiveDropdown,
    setLiveChatMessages,
    setLiveFrameSize,
    setLiveHistory,
    setLiveModel,
    setLiveOriginalInput,
    setLivePrompt,
    setLiveQuality,
    setLiveResolution,
    setModel,
    setNaturalSize,
    setOffset,
    setOutput,
    setOutputs,
    setProcessing,
    setPrompt,
    setRectangleCurrent,
    setRectangleStart,
    setReimagineLiveBounds,
    setReimagineModel,
    setReimaginePrompt,
    setReimagineReferenceImage,
    setReimagineSelectionBounds,
    setReimagineSelectionConfirmed,
    setReimagineSelectionMode,
    setResizeAspectRatio,
    setResizeCanvasH,
    setResizeCanvasW,
    setResizeExpandBottom,
    setResizeExpandLeft,
    setResizeExpandRight,
    setResizeExpandTop,
    setResizeNegativePrompt,
    setResizeNumImages,
    setResizeOrigH,
    setResizeOrigW,
    setResizeOrigX,
    setResizeOrigY,
    setResizeOutputFormat,
    setResizeSafetyChecker,
    setResizeSeed,
    setResizeSyncMode,
    setResizeZoomOutPercentage,
    setReverseBg,
    setScale,
    setScaleFactor,
    setSeedvrUpscaleFactor,
    setSelectedFeature,
    setShareCopied,
    setSharpen,
    setShowImageMenu,
    setShowThumbnailMenuIdx,
    setSliderPosition,
    setStyleComboDropdown,
    setStyleComboExtraPrompt,
    setStyleComboFrameSize,
    setStyleComboIndianSearch,
    setStyleComboIndianVersion,
    setStyleComboMaskPainted,
    setStyleComboModel,
    setStyleComboResolution,
    setStyleComboSelectedIds,
    setStyleComboTab,
    setSwinTask,
    setThreshold,
    setTopazCropToFill,
    setTopazFaceCreativity,
    setTopazFaceEnhance,
    setTopazFaceStrength,
    setTopazModel,
    setTopazOutputFormat,
    setTopazSubjectDetection,
    setTopazUpscaleFactor,
    setUpscaleViewMode,
    setVColorMode,
    setVColorPrecision,
    setVCornerThreshold,
    setVFilterSpeckle,
    setVHierarchical,
    setVLayerDifference,
    setVLengthThreshold,
    setVMaxIterations,
    setVMode,
    setVPathPrecision,
    setVSpliceThreshold,
    setVectorizeModel,
    setVectorizeSuperMode,
    shareCopied,
    sharpen,
    showImageMenu,
    showThumbnailMenuIdx,
    sliderPosition,
    styleComboCredits,
    styleComboDropdown,
    styleComboExtraPrompt,
    styleComboFrameSize,
    styleComboGeneralStyles,
    styleComboIndianRows,
    styleComboIndianSearch,
    styleComboIndianVersion,
    styleComboMaskPainted,
    styleComboModel,
    styleComboResolution,
    styleComboSelectedIds,
    styleComboTab,
    swinTask,
    threshold,
    thumbnailMenuRef,
    toProxyDownloadUrl,
    toProxyPath,
    toggleStyleComboId,
    topazCropToFill,
    topazEstimate,
    topazFaceCreativity,
    topazFaceEnhance,
    topazFaceStrength,
    topazModel,
    topazOutputFormat,
    topazSubjectDetection,
    topazUpscaleFactor,
    uploadModalHistoryEntries,
    upscaleViewMode,
    user,
    vColorMode,
    vColorPrecision,
    vCornerThreshold,
    vFilterSpeckle,
    vHierarchical,
    vLayerDifference,
    vLengthThreshold,
    vMaxIterations,
    vMode,
    vPathPrecision,
    vSpliceThreshold,
    vectorizeArtExtraCredits,
    vectorizeImage2SvgCredits,
    vectorizeModel,
    vectorizeRecraftCredits,
    vectorizeSuperMode,
    zoomToPoint,
  };
}

export type EditImageInterfaceVm = ReturnType<typeof useEditImageInterface>;
