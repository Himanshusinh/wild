"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cpu, ChevronUp, Infinity as InfinityIcon, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setSelectedModel, setFrameSize } from "@/store/slices/generationSlice";
import { toggleDropdown, addNotification } from "@/store/slices/uiSlice";
import { getModelCreditInfo } from "@/utils/modelCredits";
import { isModelAccessibleForPlan } from "@/config/planModelAccess";

const MODEL_DESCRIPTIONS: Record<string, string> = {
  "new-turbo-model":
    "Ultra-fast image generation for quick drafts and real-time applications.",
  "openai/gpt-image-1.5":
    "Balanced model for high-quality, general-purpose image generation.",
  "google/nano-banana-pro":
    "Premium creative image generation with strong detail and style control.",
  "flux-2-pro":
    "High-end photorealistic and artistic image generation with advanced coherence.",
  "google/nano-banana-2":
    "Improved version of Nano Banana with better quality and consistency.",
  "seedream-4.5": "Generates detailed images across 1K, 2K, and 4K sizes.",
  "gemini-25-flash-image":
    "Lightweight creative image model for decent quality at lower cost.",
  "seedream-5-lite":
    "Cost-efficient model for decent-quality images with faster speed.",
  "recraft-ai/recraft-v4":
    "Clean text-to-image generation on Replicate with aspect-ratio control and a fixed single-image output.",
  "flux-kontext-max":
    "Advanced contextual image editing and generation with deep understanding.",
  "qwen/qwen-image-2":
    "General-purpose image generation with multilingual prompt support.",
  "flux-kontext-pro":
    "Professional-grade contextual editing and controlled image generation.",
  "qwen/qwen-image-2-pro":
    "Enhanced version with higher fidelity and better prompt alignment.",
  "imagen-4":
    "High-quality image generation with strong realism and text rendering.",
  "minimax-image-01":
    "Budget-friendly model for simple image generation tasks.",
  "imagen-4-fast":
    "Faster version of Imagen 4 optimized for speed over detail.",
  "imagen-4-ultra":
    "Top-tier ultra-realistic image generation with maximum detail, lighting, and cinematic quality.",
  "qwen-image-edit-2511":
    "Professional-grade image editing model with advanced coherence and preservation.",
  "prunaai/p-image": "Optimized image generation with high efficiency.",
};

const MODEL_RESOLUTIONS: Record<string, string[]> = {
  "flux-2-pro": [
    "T2I 1080p (24 credits)",
    "T2I 2K (56 credits)",
    "I2I 1080p (36 credits)",
    "I2I 2K (68 credits)",
  ],
  "google/nano-banana-pro": ["1K/2K (120 credits)", "4K (240 credits)"],
  "google/nano-banana-2": [
    "1K (54 credits)",
    "2K (81 credits)",
    "4K (121 credits)",
  ],
  "qwen-image-edit-2512": ["1K (60 credits)"],
  "seedream-4.5": ["1K / 2K / 4K (32 credits)"],
};

type ModelsDropdownProps = {
  openDirection?: "up" | "down";
  imageOnly?: boolean;
};

const ModelsDropdown = ({
  openDirection = "up",
  imageOnly = false,
}: ModelsDropdownProps) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "new-turbo-model",
  );
  const currentPlanCode = useAppSelector(
    (state: any) => state.credits?.credits?.planCode || "free",
  );
  const uploadedImages = useAppSelector(
    (state: any) => state.generation?.uploadedImages || [],
  );
  const activeDropdown = useAppSelector(
    (state: any) => state.ui?.activeDropdown,
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
    width: number;
  } | null>(null);
  const [isActiveInstance, setIsActiveInstance] = useState(false);
  const buttonJustClickedRef = useRef(false);
  const shouldCloseRef = useRef(false);
  const selectingRef = useRef(false);
  const hasInputImage = uploadedImages.length > 0;

  let models = [
    { name: "GPT Image 1.5", value: "openai/gpt-image-1.5" },
    { name: "Flux 2 Pro", value: "flux-2-pro" },
    // { name: 'Seedream v4 4k', value: 'seedream-v4' },
    { name: "Seedream 4.5", value: "seedream-4.5" },
    { name: "Seedream 5 Lite ", value: "seedream-5-lite" },
    { name: "Recraft v4", value: "recraft-ai/recraft-v4" },
    { name: "Qwen Image 2", value: "qwen/qwen-image-2" },
    { name: "Qwen Image 2 Pro", value: "qwen/qwen-image-2-pro" },

    { name: "Flux Kontext Pro", value: "flux-kontext-pro" },
    { name: "Flux Kontext Max", value: "flux-kontext-max" },
    // { name: "Flux Pro 1.1", value: "flux-pro-1.1" },
    // { name: "FLUX.1 Pro", value: "flux-pro" },
    // { name: 'FLUX.1 Dev', value: 'flux-dev' },
    { name: "MiniMax Image-01", value: "minimax-image-01" },
    { name: "Nano Banana", value: "gemini-25-flash-image" },
    { name: "Nano Banana Pro", value: "google/nano-banana-pro" },
    { name: "Nano Banana 2", value: "google/nano-banana-2" },
    // { name: "Ideogram v3", value: "ideogram-ai/ideogram-v3" },
    // { name: "Ideogram v3 Quality", value: "ideogram-ai/ideogram-v3-quality" },
    // { name: 'Lucid Origin', value: 'leonardoai/lucid-origin' },
    // { name: 'Phoenix 1.0', value: 'leonardoai/phoenix-1.0' },
    { name: "Imagen 4 Ultra", value: "imagen-4-ultra" },
    { name: "Imagen 4", value: "imagen-4" },
    { name: "Imagen 4 Fast", value: "imagen-4-fast" },
    // { name: "P-Image", value: "prunaai/p-image" },

    // { name: "Qwen Image 2511", value: "qwen-image-2511" },
    // { name: "Qwen Image  2512", value: "qwen-image-edit-2512" },
    // TODO: Update model name and value with actual model identifier
    // TODO: Update value with actual Replicate model identifier (format: owner/name or owner/name:version)
    { name: "z-image-turbo", value: "new-turbo-model" },
    // { name: "WILDMINDIMAGE", value: "wildmindimage" },
    // Local models
    // { name: 'Flux Schnell (Local)', value: 'flux-schnell' },
    // { name: 'SD 3.5 Medium (Local)', value: 'stable-medium' },
    // { name: 'SD 3.5 Large (Local)', value: 'stable-large' },
    // { name: 'SD 3.5 Turbo (Local)', value: 'stable-turbo' },
    // { name: 'SDXL 1.0 (Local)', value: 'stable-xl' },
    // { name: 'Flux Krea (Local)', value: 'flux-krea' },
    // { name: 'Playground SDXL (Local)', value: 'playground' },
  ];

  // Add credits information to models from distribution data
  const modelsWithCredits = models.map((model) => {
    // For GPT Image 1.5, show minimum cost (low quality: 11 credits) in model dropdown
    // User can see actual credits per quality in the quality dropdown
    const quality = model.value === "openai/gpt-image-1.5" ? "low" : undefined;
    const creditInfo = getModelCreditInfo(
      model.value,
      undefined,
      undefined,
      undefined,
      quality,
    );
    const isFree = model.value === "wildmindimage";
    const creditLabel = isFree
      ? "Free (0 credits)"
      : creditInfo.displayText ||
        (creditInfo.credits != null ? `${creditInfo.credits} credits` : null);

    return {
      ...model,
      credits: creditInfo.credits,
      displayText: creditInfo.displayText,
      isFree,
      displayName: model.name,
      isLocked: !isModelAccessibleForPlan(currentPlanCode, "image", model.value),
    };
  });

  const renderTooltip = () => {
    if (!hoveredModel) return null;
    const description = MODEL_DESCRIPTIONS[hoveredModel];
    const resolutions = MODEL_RESOLUTIONS[hoveredModel];
    if (!description && !resolutions) return null;

    return (
      <div
        className="fixed z-[120] w-64 p-3 rounded-xl bg-[#13131a] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
        style={{
          left: `${hoverPos.x + 20}px`,
          top: `${hoverPos.y}px`,
          transform: "translateY(-50%)",
        }}
      >
        <div className="space-y-3">
          {description && (
            <p className="text-[11px] leading-relaxed text-white/80 font-medium font-sans">
              {description}
            </p>
          )}
          {resolutions && resolutions.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-2">
              <p className="text-[9px] uppercase tracking-widest text-[#2F6BFF] font-bold">
                Supported Resolutions
              </p>
              <div className="flex flex-col gap-1.5">
                {resolutions.map((res, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-[10px] text-white/60 font-medium"
                  >
                    <div className="w-1 h-1 rounded-full bg-[#2F6BFF]" />
                    {res}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (activeDropdown !== "models") {
      setIsActiveInstance(false);
      setDropdownPosition(null);
    }
  }, [activeDropdown]);

  useEffect(() => {
    const updateDropdownPosition = () => {
      if (activeDropdown === "models" && isActiveInstance && buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const desktopWidth = 448;
        const mobileWidth = Math.max(buttonRect.width, 160);
        const dropdownWidth =
          window.innerWidth >= 768 ? desktopWidth : mobileWidth;
        let left = buttonRect.left;
        let top = buttonRect.top;
        let openUp = true;

        if (left + dropdownWidth > window.innerWidth - 8) {
          left = window.innerWidth - dropdownWidth - 8;
        }
        if (left < 8) left = 8;
        if (top < 8) {
          top = buttonRect.bottom + 8;
          openUp = false;
        }

        setDropdownPosition({ top, left, openUp, width: dropdownWidth });
      } else {
        setDropdownPosition(null);
      }
    };

    updateDropdownPosition();

    if (activeDropdown === "models") {
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);

      const handleClickOutside = (event: MouseEvent) => {
        if (
          buttonJustClickedRef.current ||
          shouldCloseRef.current ||
          selectingRef.current
        ) {
          return;
        }

        const target = event.target as HTMLElement;
        if (buttonRef.current?.contains(target)) return;
        if (target.closest('[data-dropdown="models"]')) return;

        setIsActiveInstance(false);
        dispatch(toggleDropdown(""));
      };

      document.addEventListener("mousedown", handleClickOutside, true);

      return () => {
        window.removeEventListener("scroll", updateDropdownPosition, true);
        window.removeEventListener("resize", updateDropdownPosition);
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    }
  }, [activeDropdown, dispatch, isActiveInstance]);

  // If imageOnly or user uploaded images, restrict to models which support image inputs
  let filteredModels = modelsWithCredits;
  const restrictForImages = imageOnly || hasInputImage;
  if (restrictForImages) {
    filteredModels = modelsWithCredits.filter(
      (m) =>
        m.value.startsWith("flux-kontext") ||
        m.value === "gemini-25-flash-image" ||
        m.value === "google/nano-banana-pro" ||
        m.value === "google/nano-banana-2" ||
        m.value === "seedream-v4" ||
        m.value === "seedream-4.5" ||
        m.value === "seedream-5-lite" ||
        m.value === "flux-2-pro" ||
        m.value === "qwen/qwen-image-2" ||
        m.value === "qwen/qwen-image-2-pro" ||
        m.value === "prunaai/p-image" ||
        m.value === "qwen-image-edit-2512" ||
        m.value === "openai/gpt-image-1.5",
    );
  } else {
    // Hide image-to-image only models when no image is uploaded or requested
    filteredModels = modelsWithCredits.filter(
      (m) =>
        m.value !== "qwen-image-edit-2511" &&
        m.value !== "qwen-image-edit-2512",
    );
  }

  // Set default model to z-image-turbo on mount if not set (only if no images uploaded)
  useEffect(() => {
    if (!selectedModel || selectedModel === "flux-dev") {
      // If images are uploaded, use nano banana instead of z-image-turbo
      if (uploadedImages.length > 0) {
        dispatch(setSelectedModel("gemini-25-flash-image"));
      } else {
        dispatch(setSelectedModel("new-turbo-model"));
      }
    }
  }, []); // Only run on mount

  // If a previously saved/legacy model is no longer available (e.g. removed from dropdown),
  // switch to a valid fallback.
  useEffect(() => {
    const accessibleModels = modelsWithCredits.filter((m) => !m.isLocked);
    const selectedModelIsAccessible = accessibleModels.some(
      (m) => m.value === selectedModel,
    );

    if (selectedModelIsAccessible) return;

    const fallbackModel =
      accessibleModels.find((m) => m.value === "new-turbo-model")?.value ||
      accessibleModels.find((m) => m.value === "gemini-25-flash-image")?.value ||
      accessibleModels[0]?.value;

    if (fallbackModel) {
      dispatch(setSelectedModel(fallbackModel));
    }
  }, [selectedModel, modelsWithCredits, dispatch]);

  // If user switches to image-to-image (uploaded images) while an unsupported model is selected, auto-switch to nano banana
  useEffect(() => {
    if (!restrictForImages) return;
    const isIdeogram =
      typeof selectedModel === "string" &&
      selectedModel.startsWith("ideogram-ai/ideogram-v3");
    const isImagen4 =
      typeof selectedModel === "string" &&
      (selectedModel === "imagen-4" ||
        selectedModel === "imagen-4-fast" ||
        selectedModel === "imagen-4-ultra");
    const isLucidOrPhoenix =
      typeof selectedModel === "string" &&
      (selectedModel === "leonardoai/lucid-origin" ||
        selectedModel === "leonardoai/phoenix-1.0");
    const isMiniMax =
      typeof selectedModel === "string" && selectedModel === "minimax-image-01";
    const isRecraftV4 =
      typeof selectedModel === "string" &&
      (selectedModel === "recraft-ai/recraft-v4" ||
        selectedModel === "recraft-v4");
    const isZImageTurbo =
      typeof selectedModel === "string" &&
      (selectedModel === "new-turbo-model" ||
        selectedModel === "z-image-turbo");
    const isWildmindImage =
      typeof selectedModel === "string" && selectedModel === "wildmindimage";
    const isQwenNonEdit =
      typeof selectedModel === "string" &&
      (selectedModel === "qwen-image-2511" ||
        selectedModel === "qwen-image-2512");

    // If a non-edit Qwen Image model is selected while an input image is attached, switch to the matching Edit variant.
    if (hasInputImage && isQwenNonEdit) {
      const preferred =
        selectedModel === "qwen-image-2512"
          ? "qwen-image-edit-2512"
          : "gemini-25-flash-image";
      const exists = filteredModels.find((m) => m.value === preferred);
      dispatch(setSelectedModel(exists?.value || "gemini-25-flash-image"));
      return;
    }
    // If z-image-turbo or other unsupported models are selected when images are uploaded, switch to nano banana
    if (
      isZImageTurbo ||
      isWildmindImage ||
      isIdeogram ||
      isImagen4 ||
      isLucidOrPhoenix ||
      isMiniMax ||
      isRecraftV4
    ) {
      // Prefer nano banana (gemini-25-flash-image) for image-to-image
      const nanoBanana = filteredModels.find(
        (m) => m.value === "gemini-25-flash-image",
      );
      const fallback =
        nanoBanana?.value ||
        filteredModels[0]?.value ||
        "gemini-25-flash-image";
      dispatch(setSelectedModel(fallback));
    }
  }, [
    restrictForImages,
    hasInputImage,
    selectedModel,
    filteredModels,
    dispatch,
  ]);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    buttonJustClickedRef.current = true;
    const isCurrentlyOpen = activeDropdown === "models" && isActiveInstance;

    if (isCurrentlyOpen) {
      setIsActiveInstance(false);
      dispatch(toggleDropdown(""));
      shouldCloseRef.current = true;
    } else {
      setIsActiveInstance(true);
      dispatch(toggleDropdown("models"));
      shouldCloseRef.current = false;
    }

    setTimeout(() => {
      buttonJustClickedRef.current = false;
      shouldCloseRef.current = false;
    }, 300);
  };

  // Auto-close dropdown after 5 seconds
  useEffect(() => {
    if (activeDropdown === "models") {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for 5 seconds
      timeoutRef.current = setTimeout(() => {
        dispatch(toggleDropdown(""));
      }, 20000);
    } else {
      // Clear timeout if dropdown is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeDropdown, dispatch]);

  const handleModelSelect = (modelValue: string) => {
    selectingRef.current = true;

    if (!isModelAccessibleForPlan(currentPlanCode, "image", modelValue)) {
      setIsActiveInstance(false);
      dispatch(toggleDropdown(""));
      router.push("/view/pricing");
      setTimeout(() => {
        selectingRef.current = false;
      }, 100);
      return;
    }
    // Toast guidance for models that require image input
    if (modelValue === "gen4_image_turbo" && uploadedImages.length === 0) {
      dispatch(
        addNotification({
          type: "warning",
          message:
            "Runway Gen4 Image Turbo requires at least one reference image. Please attach an image.",
        }),
      );
    }
    if (modelValue === "minimax-image-01" && uploadedImages.length > 1) {
      dispatch(
        addNotification({
          type: "info",
          message:
            "MiniMax Image-01 uses only one reference image. The first image will be used.",
        }),
      );
    }
    if (modelValue === "prunaai/p-image") {
      dispatch(setFrameSize("16:9")); // schema default aspect ratio
    }
    if (modelValue === "recraft-ai/recraft-v4") {
      dispatch(setFrameSize("1:1"));
    }
    dispatch(setSelectedModel(modelValue));
    setIsActiveInstance(false);
    dispatch(toggleDropdown(""));
    setTimeout(() => {
      selectingRef.current = false;
    }, 100);
  };

  const selectedModelEntry = filteredModels.find((m) => m.value === selectedModel);

  const dropdownContent =
    activeDropdown === "models" && isActiveInstance && dropdownPosition ? (
      <div
        data-dropdown="models"
        style={{
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          transform: dropdownPosition.openUp
            ? "translateY(calc(-100% - 8px))"
            : "none",
        }}
        className="fixed bg-black/90 backdrop-blur-3xl shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/20 z-[9999] max-h-100 md:max-h-100 overflow-y-auto dropdown-scrollbar"
      >
        {(() => {
          const leftValues = [
            "new-turbo-model",
            "prunaai/p-image",
            "google/nano-banana-pro",
            "google/nano-banana-2",
            "gemini-25-flash-image",
            "qwen-image-edit-2512",
            "z-image-turbo",
            "flux-kontext-max",
            "flux-kontext-pro",
            "flux-pro-1.1-ultra",
            "imagen-4",
            "imagen-4-fast",
            "imagen-4-ultra",
          ];
          const leftSet = new Set(leftValues);
          const leftModels = filteredModels
            .filter((m) => leftSet.has(m.value))
            .sort(
              (a, b) => leftValues.indexOf(a.value) - leftValues.indexOf(b.value),
            );
          const rightModels = filteredModels.filter((m) => !leftSet.has(m.value));
          const allModels = [...leftModels, ...rightModels];

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="md:hidden divide-y divide-white/10">
                {allModels.map((model) => (
                  <button
                    key={`mobile-${model.value}`}
                    onMouseEnter={(e) => {
                      setHoveredModel(model.value);
                      setHoverPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) =>
                      setHoverPos({ x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setHoveredModel(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModelSelect(model.value);
                    }}
                    className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                      selectedModel === model.value
                        ? model.isFree
                          ? "bg-gradient-to-r from-[#60a5fa]/30 to-[#3b82f6]/30 text-white border border-[#60a5fa]/50"
                          : "bg-white text-black"
                        : model.isFree
                          ? "text-white/90 hover:bg-[#60a5fa]/10 border-l-2 border-transparent hover:border-[#60a5fa]/50"
                          : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex flex-col mb-0">
                      <span className="flex items-center gap-2">
                        {model.isFree && (
                          <InfinityIcon className="w-4 h-4 text-[#60a5fa]" />
                        )}
                        {model.isLocked && (
                          <Lock className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        {model.name}
                        {leftSet.has(model.value) && !model.isFree && (
                          <img
                            src="/icons/crown.svg"
                            alt="pro"
                            className="w-4 h-4"
                          />
                        )}
                      </span>
                      {!model.isFree && (
                        <span
                          className={`md:text-[11px] text-[9px] -mt-0.5 font-normal ${
                            selectedModel === model.value
                              ? "text-black/70"
                              : "opacity-80"
                          }`}
                        >
                          {model.isLocked
                            ? "Upgrade to access"
                            : model.displayText ||
                              (model.credits != null
                                ? `${model.credits} credits`
                                : "credits unavailable")}
                        </span>
                      )}
                    </div>
                    {selectedModel === model.value && (
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="hidden md:block divide-y divide-white/10">
                {leftModels.map((model) => (
                  <button
                    key={`left-${model.value}`}
                    onMouseEnter={(e) => {
                      setHoveredModel(model.value);
                      setHoverPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) =>
                      setHoverPos({ x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setHoveredModel(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModelSelect(model.value);
                    }}
                    className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                      selectedModel === model.value
                        ? model.isFree
                          ? "bg-gradient-to-r from-[#60a5fa]/30 to-[#3b82f6]/30 text-white "
                          : "bg-white text-black"
                        : model.isFree
                          ? "text-white/90 hover:bg-[#60a5fa]/10  "
                          : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex flex-col mb-0">
                      <span className="flex items-center gap-2">
                        {model.isFree && (
                          <span className="text-xs text-white/50">
                            <InfinityIcon className="w-4 h-4 text-[#60a5fa]" />
                          </span>
                        )}
                        {model.isLocked && (
                          <Lock className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        {model.name}
                        {!model.isFree && (
                          <img
                            src="/icons/crown.svg"
                            alt="pro"
                            className="w-4 h-4"
                          />
                        )}
                      </span>
                      {model.isFree && (
                        <span
                          className={`md:text-[11px] text-xs -mt-0.5 font-normal ${
                            selectedModel === model.value
                              ? "text-white/70"
                              : "opacity-80"
                          }`}
                        >
                          {model.isLocked
                            ? "Upgrade to access"
                            : model.displayText ||
                              (model.credits != null
                                ? `${model.credits} credits`
                                : "0 credits ")}
                        </span>
                      )}
                      {!model.isFree && (
                        <span
                          className={`md:text-[11px] text-xs -mt-0.5 font-normal ${
                            selectedModel === model.value
                              ? "text-black/70"
                              : "opacity-80"
                          }`}
                        >
                          {model.isLocked
                            ? "Upgrade to access"
                            : model.displayText ||
                              (model.credits != null
                                ? `${model.credits} credits`
                                : "credits unavailable")}
                        </span>
                      )}
                    </div>
                    {selectedModel === model.value && (
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              <div className="hidden md:block border-l border-white/10 divide-y divide-white/10">
                {rightModels.map((model) => (
                  <button
                    key={`right-${model.value}`}
                    onMouseEnter={(e) => {
                      setHoveredModel(model.value);
                      setHoverPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseMove={(e) =>
                      setHoverPos({ x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setHoveredModel(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModelSelect(model.value);
                    }}
                    className={`w-full px-4 py-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
                      selectedModel === model.value
                        ? model.isFree
                          ? "bg-gradient-to-r from-[#60a5fa]/30 to-[#3b82f6]/30 text-white border border-[#60a5fa]/50"
                          : "bg-white text-black"
                        : model.isFree
                          ? "text-white/90 hover:bg-[#60a5fa]/10 border-l-2 border-transparent hover:border-[#60a5fa]/50"
                          : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex flex-col -mb-0">
                      <span className="flex items-center gap-2">
                        {model.isFree && (
                          <InfinityIcon className="w-4 h-4 text-[#60a5fa]" />
                        )}
                        {model.isLocked && (
                          <Lock className="w-3.5 h-3.5 text-amber-300" />
                        )}
                        {model.name}
                      </span>
                      {!model.isFree && (
                        <span
                          className={`md:text-[11px] text-xs -mt-0.5 font-normal ${
                            selectedModel === model.value
                              ? "text-black/70"
                              : "opacity-80"
                          }`}
                        >
                          {model.isLocked
                            ? "Upgrade to access"
                            : model.displayText ||
                              (model.credits != null
                                ? `${model.credits} credits`
                                : "credits unavailable")}
                        </span>
                      )}
                    </div>
                    {selectedModel === model.value && (
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    ) : null;

  return (
    <div className="relative dropdown-container">
      <button
        ref={buttonRef}
        onClick={handleDropdownClick}
        className="z-50 h-[28px] md:h-[32px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 bg-white text-black hover:bg-white/95 transition flex items-center gap-1 flex-nowrap whitespace-nowrap"
      >
        {selectedModel === "new-turbo-model" ? (
          <Cpu className="w-4 h-4 mr-1" />
        ) : (
          <Cpu className="w-4 h-4 mr-1" />
        )}
        {selectedModelEntry?.name || "Models"}
        {selectedModelEntry?.isLocked && (
          <Lock className="w-3.5 h-3.5 text-black/70" />
        )}
        <ChevronUp
          className={`w-4 h-4 transition-transform duration-200 ${
            activeDropdown === "models" ? "rotate-180" : ""
          }`}
        />
      </button>

      {renderTooltip()}
      {typeof window !== "undefined" &&
        dropdownContent &&
        createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default ModelsDropdown;
