"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  ChevronDown,
  ChevronUp,
  Play,
  Image as ImageIcon,
  Cpu,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";
import { getModelCreditInfo } from "@/utils/modelCredits";
import { isModelAccessibleForPlan } from "@/config/planModelAccess";

const SEEDANCE_2_FAMILY_VALUES = new Set([
  "seedance-2.0-t2v",
  "seedance-2.0-r2v",
  "seedance-2.0-fast",
  "seedance-2.0-fast-t2v",
  "seedance-2.0-fast-i2v",
  "seedance-2.0-fast-r2v",
]);

const isSeedance2FamilyModel = (value: string) =>
  SEEDANCE_2_FAMILY_VALUES.has(value);

const isSeedanceFamilyModel = (value: string) => value.includes("seedance");
const isVeo31FamilyModel = (value: string) => value.includes("veo3.1");
const isKlingFamilyModel = (value: string) =>
  value === "kling-o1" ||
  value === "kling-v3-standard" ||
  value === "kling-v3-pro" ||
  value === "kling-2.6-pro" ||
  value === "kling-v2.5-turbo-pro-t2v";
const isHailuoFamilyModel = (value: string) =>
  value === "MiniMax-Hailuo-2.3" || value === "MiniMax-Hailuo-2.3-Fast";
const isSoraFamilyModel = (value: string) =>
  value === "sora2-t2v" || value === "sora2-pro-t2v";
const isLtxFamilyModel = (value: string) =>
  value === "ltx-2.3-pro-t2v" || value === "ltx-2.3-fast-t2v";
const isWanFamilyModel = (value: string) =>
  value === "wan-2.5-t2v" || value === "wan-2.5-t2v-fast";
const isHappyHorseFamilyModel = (value: string) =>
  value === "alibaba/happy-horse" || value.startsWith("alibaba/happy-horse/");
const isPixverseFamilyModel = (value: string) =>
  value === "pixverse-v6-t2v" ||
  value === "pixverse-v6-i2v" ||
  value === "pixverse-v5-t2v" ||
  value === "pixverse-v5-i2v";
const FAMILY_DISPLAY_ORDER = [
  "Seedance",
  "Veo 3.1",
  "Kling",
  "LTX",
  "WAN",
  "Happy Horse",
  "PixVerse",
  "Sora",
  "Hailuo",
] as const;

interface VideoModelsDropdownProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  generationMode: "text_to_video" | "image_to_video" | "video_to_video";
  selectedDuration?: string;
  selectedResolution?: string;
  selectedAspectRatio?: string;
  /** PixVerse V6 T2V credits depend on generate_audio_switch */
  pixverseV6GenerateAudio?: boolean;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
  activeFeature?: "Video" | "Lipsync" | "Animate" | "Edit" | "Video editor";
}

const VideoModelsDropdown: React.FC<VideoModelsDropdownProps> = ({
  selectedModel,
  onModelChange,
  generationMode,
  selectedDuration = "5s",
  selectedResolution = "512P",
  selectedAspectRatio,
  pixverseV6GenerateAudio = false,
  onCloseOtherDropdowns,
  onCloseThisDropdown,
  activeFeature = "Video",
}) => {
  const router = useRouter();
  const currentPlanCode = useAppSelector(
    (state: any) => state.credits?.credits?.planCode || "free",
  );
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);
  const dropdownId = "video-models-dropdown";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (buttonRef.current?.contains(target)) return;
      if (target.closest(`[data-dropdown="${dropdownId}"]`)) return;
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownId, isOpen]);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) {
      setDropdownPosition(null);
      return;
    }

    const updateDropdownPosition = () => {
      if (!buttonRef.current) return;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth =
        window.innerWidth >= 768 ? 448 : Math.min(300, window.innerWidth - 24);
      let left = buttonRect.left;
      let top = buttonRect.top;
      let openUp = true;

      if (left + dropdownWidth > window.innerWidth - 12) {
        left = window.innerWidth - dropdownWidth - 12;
      }
      if (left < 12) {
        left = 12;
      }
      if (top < 8) {
        top = buttonRect.bottom + 8;
        openUp = false;
      }

      setDropdownPosition({ top, left, openUp });
    };

    updateDropdownPosition();
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);

  // Auto-close dropdown after 20 seconds
  useEffect(() => {
    if (isOpen) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for 20 seconds
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
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
  }, [isOpen]);

  // Close this dropdown when parent requests it
  useEffect(() => {
    if (onCloseThisDropdown && isOpen) {
      setIsOpen(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [onCloseThisDropdown, isOpen]);

  // Get available models - always return all 20 models for consistent visibility
  // Models will auto-convert between t2v/i2v variants based on mode and user input
  const getAvailableModels = () => {
    // For Animate feature, show WAN 2.2 Animate models and Runway Act-Two (check this FIRST)
    if (activeFeature === "Animate") {
      return [
        {
          value: "wan-2.2-animate-replace",
          label: "WAN  Replace",
          description:
            "Replace character in video with uploaded image, 480p/720p, 5-60fps",
          provider: "replicate",
        },
        {
          value: "wan-2.2-animate-animation",
          label: "WAN  Animation",
          description:
            "Animate character image using video motion reference, 480p/720p, 5-60fps",
          provider: "replicate",
        },
        {
          value: "runway-act-two",
          label: "Runway Act-Two",
          description:
            "Control character expressions and movements using reference video, 1280:720/720:1280/960:960",
          provider: "runway",
        },
      ];
    }

    // For Lipsync feature, only show specific models
    if (activeFeature === "Lipsync") {
      return [
        {
          value: "veo3.1-t2v-8s",
          label: "Veo 3.1",
          description: "Google's latest video model, 4s/6s/8s, 720p/1080p",
          provider: "fal",
        },
        {
          value: "veo3.1-lite-t2v-8s",
          label: "Veo 3.1 Lite",
          description:
            "Lower-cost Veo, T2V/I2V + first-last frames, 4s/6s/8s at 720p, 8s at 1080p",
          provider: "fal",
        },
        {
          value: "veo3.1-fast-t2v-8s",
          label: "Veo 3.1 Fast",
          description: "Faster generation, 4s/6s/8s, 720p/1080p",
          provider: "fal",
        },
        {
          value: "wan-2.5-t2v",
          label: "WAN 2.5 Speak",
          description: "Text→Video & Image→Video, 5s/10s, 480p/720p/1080p",
          provider: "replicate",
        },
        {
          value: "wan-2.5-t2v-fast",
          label: "WAN 2.5 Fast Speak",
          description:
            "Text→Video & Image→Video (faster), 5s/10s, 720p/1080p only",
          provider: "replicate",
        },
        {
          value: "ltx-2.3-pro-t2v",
          label: "LTX 2.3 Pro",
          description:
            "T2V & I2V, 6/8/10s, 1080p/2k/4k, Camera & audio controls",
          provider: "replicate",
        },
        {
          value: "ltx-2.3-fast-t2v",
          label: "LTX 2.3 Fast",
          description: "T2V & I2V, 2-20s, 1080p/2k/4k, Camera controls, Audio",
          provider: "replicate",
        },
        // { value: "kling-v2.5-turbo-pro-t2v", label: "Kling Lipsync", description: "Text→Video & Image→Video, 5s/10s, 16:9/9:16/1:1", provider: "replicate" }
      ];
    }

    // Handle video-to-video mode separately (but not for Animate feature)
    // if (generationMode === "video_to_video") {
    //   return [
    //     { value: "sora2-v2v-remix", label: "Sora 2 Remix", description: "OpenAI's Sora 2 V2V remix, transforms existing videos", provider: "fal" },
    //     { value: "gen4_aleph", label: "Gen-4 Aleph", description: "Style transfer and enhancement", provider: "runway" }
    //   ];
    // }

    // For text-to-video and image-to-video modes, always return all models
    // This ensures consistent visibility regardless of current mode
    return [
      {
        value: "veo3.1-t2v-8s",
        label: "Veo 3.1",
        description: "Google's latest video model, 4s/6s/8s, 720p/1080p",
        provider: "fal",
      },
      {
        value: "veo3.1-lite-t2v-8s",
        label: "Veo 3.1 Lite",
        description:
          "Lower-cost Veo, T2V/I2V + first-last frames, 4s/6s/8s at 720p, 8s at 1080p",
        provider: "fal",
      },
      {
        value: "veo3.1-fast-t2v-8s",
        label: "Veo 3.1 Fast",
        description: "Faster generation, 4s/6s/8s, 720p/1080p",
        provider: "fal",
      },
      {
        value: "alibaba/happy-horse",
        label: "Happy Horse",
        description:
          "T2V / I2V / Reference / Edit, 3s-15s, 720p/1080p, rich controls",
        provider: "fal",
      },
      {
        value: "kling-o1",
        label: "Kling o1",
        description: "First frame required, last frame optional, 5s/10s",
        provider: "fal",
      },
      {
        value: "kling-v3-standard",
        label: "Kling 3 Standard",
        description:
          "Text→Video & Image→Video, 3s-15s, 16:9/9:16/1:1, Audio On/Off",
        provider: "fal",
      },
      {
        value: "kling-v3-pro",
        label: "Kling 3 Pro",
        description:
          "Text→Video & Image→Video, 3s-15s, 16:9/9:16/1:1, Audio On/Off",
        provider: "fal",
      },
      {
        value: "sora2-t2v",
        label: "Sora 2",
        description: "OpenAI's Sora 2, 4s/8s/12s, 720p, 16:9/9:16",
        provider: "fal",
      },
      {
        value: "sora2-pro-t2v",
        label: "Sora 2 Pro",
        description: "OpenAI's Sora 2 Pro, 4s/8s/12s, 720p/1080p, 16:9/9:16",
        provider: "fal",
      },
      // { value: "sora2-v2v-remix", label: "Sora 2 Remix", description: "OpenAI's Sora 2 V2V remix, transforms existing videos", provider: "fal" },

      {
        value: "kling-2.6-pro",
        label: "Kling 2.6 Pro",
        description:
          "Text→Video & Image→Video, 5s/10s, 16:9/9:16/1:1, Audio On/Off",
        provider: "fal",
      },
      {
        value: "kling-v2.5-turbo-pro-t2v",
        label: "Kling 2.5 Turbo Pro",
        description: "Text→Video & Image→Video, 5s/10s, 16:9/9:16/1:1",
        provider: "replicate",
      },
      // { value: "kling-v2.1-t2v", label: "Kling 2.1", description: "Text→Video & Image→Video, 5s/10s, 720p/1080p", provider: "replicate" },
      // { value: "kling-v2.1-master-t2v", label: "Kling 2.1 Master", description: "Text→Video & Image→Video, 5s/10s, 1080p", provider: "replicate" },
      {
        value: "MiniMax-Hailuo-2.3",
        label: "Hailuo-2.3",
        description: "Text→Video / Image→Video, 6s/10s, 768P/1080P",
        provider: "minimax",
      },
      {
        value: "MiniMax-Hailuo-2.3-Fast",
        label: "Hailuo-2.3 Fast",
        description: "Image→Video only (faster), 6s/10s, 768P/1080P",
        provider: "minimax",
      },
      // { value: "MiniMax-Hailuo-02", label: "Hailuo-02", description: "Text→Video / Image→Video, 6s/10s, 512P/768P/1080P", provider: "minimax" },

      {
        value: "seedance-2.0-t2v",
        label: "Seedance 2.0",
        description:
          "Text→Video & Image→Video, auto/4-15s, 480p/720p, auto/21:9/16:9/4:3/1:1/3:4/9:16, Audio On/Off",
        provider: "fal",
      },
      {
        value: "seedance-2.0-r2v",
        label: "Seedance 2.0 Reference",
        description:
          "Reference-to-video with image/video/audio guides, auto/4-15s, 480p/720p, auto/21:9/16:9/4:3/1:1/3:4/9:16, Audio On/Off",
        provider: "fal",
      },
      {
        value: "seedance-2.0-fast",
        label: "Seedance 2.0 Fast",
        description:
          "Text→Video & Image→Video, auto/4-15s, 480p/720p, auto/21:9/16:9/4:3/1:1/3:4/9:16, Audio On/Off",
        provider: "fal",
      },
      {
        value: "seedance-2.0-fast-r2v",
        label: "Seedance 2.0 Fast Reference",
        description:
          "Reference-to-video with image/video/audio guides, auto/4-15s, 480p/720p, auto/21:9/16:9/4:3/1:1/3:4/9:16, Audio On/Off",
        provider: "fal",
      },
      {
        value: "seedance-1.5-pro-t2v",
        label: "Seedance 1.5 Pro",
        description:
          "Text→Video & Image→Video, 2-12s, 16:9/4:3/1:1/3:4/9:16/21:9/9:21, Audio On/Off",
        provider: "replicate",
      },
      {
        value: "seedance-1.0-pro-t2v",
        label: "Seedance 1.0 Pro",
        description:
          "Text→Video & Image→Video, 2-12s, 480p/720p/1080p, 16:9/4:3/1:1/3:4/9:16/21:9/9:21",
        provider: "replicate",
      },
      {
        value: "seedance-1.0-pro-fast-t2v",
        label: "Seedance 1.0 Pro Fast",
        description:
          "Text→Video & Image→Video (fastest), 2-12s, 480p/720p/1080p, 16:9/4:3/1:1/3:4/9:16/21:9/9:21",
        provider: "replicate",
      },
      {
        value: "seedance-1.0-lite-t2v",
        label: "Seedance 1.0 Lite",
        description:
          "Text→Video & Image→Video (faster), 2-12s, 480p/720p/1080p, 16:9/4:3/1:1/3:4/9:16/21:9/9:21",
        provider: "replicate",
      },
      // { value: "ltx2-pro-t2v", label: "LTX V2 Pro", description: "Text→Video & Image→Video, 6s/8s/10s, 1080p/1440p/2160p, 16:9 only", provider: "fal" },
      // { value: "ltx2-fast-t2v", label: "LTX V2 Fast", description: "Text→Video & Image→Video (fast), 6s/8s/10s, 1080p/1440p/2160p, 16:9 only", provider: "fal" },
      {
        value: "ltx-2.3-pro-t2v",
        label: "LTX 2.3 Pro",
        description:
          "T2V & I2V, 6/8/10s, 1080p/2k/4k, 16:9/9:16, Camera & audio controls",
        provider: "replicate",
      },
      {
        value: "ltx-2.3-fast-t2v",
        label: "LTX 2.3 Fast",
        description:
          "T2V & I2V, 2-20s, 1080p/2k/4k, 16:9/9:16, Camera controls, Audio",
        provider: "replicate",
      },
      {
        value: "pixverse-v6-t2v",
        label: "PixVerse V6",
        description:
          "Text or first-frame video, 5–15s / 1–15s with image, 360p–1080p, styles, audio & multi-angle",
        provider: "fal",
      },
      {
        value: "wan-2.5-t2v",
        label: "WAN 2.5",
        description: "Text→Video & Image→Video, 5s/10s, 480p/720p/1080p",
        provider: "replicate",
      },
      {
        value: "wan-2.5-t2v-fast",
        label: "WAN 2.5 Fast",
        description:
          "Text→Video & Image→Video (faster), 5s/10s, 720p/1080p only",
        provider: "replicate",
      },
      // { value: "gen4_turbo", label: "Gen-4 Turbo", description: "High-quality, fast generation", provider: "runway" },
      // { value: "gen4_aleph", label: "Gen-4 Aleph", description: "Style transfer and enhancement", provider: "runway" },

      // { value: "T2V-01-Director", label: "Hailuo-T2V-Director", description: "Text→Video only, 6s, 720P, Camera movements", provider: "minimax" },
      // { value: "I2V-01-Director", label: "Hailuo-I2V-Director", description: "Image→Video only, 6s, 720P, First frame required", provider: "minimax" },
      // { value: "S2V-01", label: "S2V-01", description: "Subject→Video (character reference), 6s, 720P", provider: "minimax" }
    ];
  };

  const availableModels = getAvailableModels()
    .filter((model) => {
      if (
        model.value === "veo3.1-lite-t2v-8s" ||
        model.value === "veo3.1-fast-t2v-8s" ||
        model.value === "kling-o1" ||
        model.value === "kling-v3-pro" ||
        model.value === "kling-2.6-pro" ||
        model.value === "kling-v2.5-turbo-pro-t2v" ||
        model.value === "MiniMax-Hailuo-2.3-Fast" ||
        model.value === "sora2-pro-t2v" ||
        model.value === "ltx-2.3-fast-t2v" ||
        model.value === "wan-2.5-t2v-fast" ||
        model.value === "seedance-2.0-r2v" ||
        model.value === "seedance-2.0-fast" ||
        model.value === "seedance-2.0-fast-r2v" ||
        model.value === "seedance-1.5-pro-t2v" ||
        model.value === "seedance-1.0-pro-t2v" ||
        model.value === "seedance-1.0-pro-fast-t2v" ||
        model.value === "seedance-1.0-lite-t2v" ||
        model.value === "pixverse-v5-t2v" ||
        model.value === "pixverse-v5-i2v" ||
        model.value === "pixverse-v6-i2v"
      ) {
        return false;
      }
      return true;
    })
    .map((model) =>
      model.value === "seedance-2.0-t2v"
        ? {
            ...model,
            label: "Seedance",
            description:
              "The premier choice for crafting stunning, movie-quality cinematic shots from any input.",
          }
        : model.value === "veo3.1-t2v-8s"
          ? {
              ...model,
              label: "Veo 3.1",
              description:
                "Top-tier cinematic realism and high-fidelity physical textures in 720p and 1080p.",
            }
          : model.value === "kling-v3-standard"
            ? {
                ...model,
                label: "Kling",
                description:
                  "Superior physics simulation and complex, dynamic character motion from text or image inputs.",
              }
            : model.value === "MiniMax-Hailuo-2.3"
              ? {
                  ...model,
                  label: "Hailuo",
                  description:
                    "Fast, highly prompt-accurate generation ideal for stylized and expressive shots.",
                }
              : model.value === "sora2-t2v"
                ? {
                    ...model,
                    label: "Sora",
                    description:
                      "Industry-leading temporal consistency and photorealism for complex, long-form storytelling.",
                  }
                : model.value === "ltx-2.3-pro-t2v"
                  ? {
                      ...model,
                      label: "LTX",
                      description:
                        "The precision-focused choice offering ultimate camera control and ultra-high resolutions up to 4K.",
                    }
                  : model.value === "wan-2.5-t2v"
                    ? {
                        ...model,
                        label: "WAN",
                        description:
                          "A highly flexible model specializing in fluid motion dynamics and variable generation speeds.",
                      }
                    : model.value === "alibaba/happy-horse"
                      ? {
                          ...model,
                          label: "Happy Horse",
                          description:
                            "Text, image, reference, and edit video workflows with flexible duration and resolution controls.",
                        }
                    : model.value === "pixverse-v6-t2v"
                      ? {
                          ...model,
                          label: "PixVerse",
                          description:
                            "Cinematic text or first-frame video, resolution tiers, optional generated audio, and multi-angle clips.",
                        }
          : model,
    )
    .sort((a, b) => {
      const aIndex = FAMILY_DISPLAY_ORDER.indexOf(
        a.label as (typeof FAMILY_DISPLAY_ORDER)[number],
      );
      const bIndex = FAMILY_DISPLAY_ORDER.indexOf(
        b.label as (typeof FAMILY_DISPLAY_ORDER)[number],
      );
      const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      return safeA - safeB;
    });
  // Prefer exact match; otherwise map t2v/i2v variants to the same base model for display
  const selectedModelInfo =
    availableModels.find((model) =>
      isSeedanceFamilyModel(selectedModel)
        ? model.value === "seedance-2.0-t2v"
        : isVeo31FamilyModel(selectedModel)
          ? model.value === "veo3.1-t2v-8s"
          : isKlingFamilyModel(selectedModel)
            ? model.value === "kling-v3-standard"
            : isHailuoFamilyModel(selectedModel)
              ? model.value === "MiniMax-Hailuo-2.3"
              : isSoraFamilyModel(selectedModel)
                ? model.value === "sora2-t2v"
                : isLtxFamilyModel(selectedModel)
                  ? model.value === "ltx-2.3-pro-t2v"
                  : isWanFamilyModel(selectedModel)
                    ? model.value === "wan-2.5-t2v"
                    : isHappyHorseFamilyModel(selectedModel)
                      ? model.value === "alibaba/happy-horse"
                    : isPixverseFamilyModel(selectedModel)
                      ? model.value === "pixverse-v6-t2v"
        : model.value === selectedModel,
    ) ||
    availableModels.find((model) => {
      if (isSeedanceFamilyModel(selectedModel)) {
        return model.value === "seedance-2.0-t2v";
      }
      if (isVeo31FamilyModel(selectedModel)) {
        return model.value === "veo3.1-t2v-8s";
      }
      if (isKlingFamilyModel(selectedModel)) {
        return model.value === "kling-v3-standard";
      }
      if (isHailuoFamilyModel(selectedModel)) {
        return model.value === "MiniMax-Hailuo-2.3";
      }
      if (isSoraFamilyModel(selectedModel)) {
        return model.value === "sora2-t2v";
      }
      if (isLtxFamilyModel(selectedModel)) {
        return model.value === "ltx-2.3-pro-t2v";
      }
      if (isWanFamilyModel(selectedModel)) {
        return model.value === "wan-2.5-t2v";
      }
      if (isHappyHorseFamilyModel(selectedModel)) {
        return model.value === "alibaba/happy-horse";
      }
      if (isPixverseFamilyModel(selectedModel)) {
        return model.value === "pixverse-v6-t2v";
      }
      const baseAvailable = model.value.replace(/-t2v$|-i2v$|-r2v$/, "");
      const baseSelected = selectedModel.replace(/-t2v$|-i2v$|-r2v$/, "");
      return baseAvailable === baseSelected;
    }) ||
    availableModels[0];

  // Add credits information to models
  // Normalize duration/resolution for credit lookup (accept number or string, enforce 'Xs' and lowercase res)
  // IMPORTANT: Normalize here with defaults so credits always resolve, even before user selects duration/resolution
  const normalizeDuration = (d: any, defaultDuration: string): string => {
    if (d == null) return defaultDuration;
    if (typeof d === "number") return `${d}s`;
    const s = String(d);
    if (s.toLowerCase() === "auto") return "auto";
    return /s$/.test(s) ? s : `${s}s`;
  };

  const normalizeResolution = (r: any, defaultRes: string): string => {
    if (!r) return defaultRes;
    return String(r).toLowerCase();
  };

  const modelsWithCredits = availableModels.map((model) => {
    // Per-model normalization/fallbacks so credits always resolve from the first render
    let d: string;
    let r: string | undefined;

    if (model.value.includes("wan-2.5")) {
      // WAN models: default to 5s and 720p if not provided
      d = normalizeDuration(selectedDuration, "5s");
      const rRaw = normalizeResolution(selectedResolution, "720p");
      const rLower = rRaw.toLowerCase();
      if (rLower.includes("480")) r = "480p";
      else if (rLower.includes("720")) r = "720p";
      else if (rLower.includes("1080")) r = "1080p";
      else r = "720p";
    } else if (model.value.startsWith("kling-")) {
      // Kling v2.5 only needs duration, v2.1 needs resolution
      d = normalizeDuration(selectedDuration, "5s");
      if (model.value.includes("v2.1")) {
        const rRaw = normalizeResolution(selectedResolution, "720p");
        const rLower = rRaw.toLowerCase();
        if (rLower.includes("1080")) r = "1080p";
        else r = "720p";
      } else {
        // For v2.5, don't pass resolution as it's not needed for pricing
        r = undefined;
      }
    } else if (model.value === "kling-o1") {
      // Kling o1 uses only duration (5s/10s)
      d = normalizeDuration(selectedDuration, "5s");
      r = undefined;
    } else if (model.value === "MiniMax-Hailuo-02") {
      // MiniMax requires explicit resolution and duration to price
      d = normalizeDuration(selectedDuration, "6s");
      const rRaw = selectedResolution || "1080P";
      const rUpper = String(rRaw).toUpperCase();
      if (rUpper.includes("512")) r = "512P";
      else if (rUpper.includes("768")) r = "768P";
      else if (rUpper.includes("1080")) r = "1080P";
      else r = "1080P";
    } else if (
      model.value === "MiniMax-Hailuo-2.3" ||
      model.value === "MiniMax-Hailuo-2.3-Fast"
    ) {
      // MiniMax Hailuo 2.3 requires explicit resolution and duration to price (768P/1080P only, no 512P)
      d = normalizeDuration(selectedDuration, "6s");
      const rRaw = selectedResolution || "768P";
      const rUpper = String(rRaw).toUpperCase();
      if (rUpper.includes("768")) r = "768P";
      else if (rUpper.includes("1080")) r = "1080P";
      else r = "768P"; // Default to 768P for 2.3 models
    } else if (
      model.value === "pixverse-v6-t2v" ||
      model.value === "pixverse-v6-i2v"
    ) {
      d = normalizeDuration(selectedDuration, "5s");
      const rRaw = normalizeResolution(selectedResolution, "720p");
      const rLower = rRaw.toLowerCase();
      if (rLower.includes("360")) r = "360p";
      else if (rLower.includes("540")) r = "540p";
      else if (rLower.includes("720")) r = "720p";
      else if (rLower.includes("1080")) r = "1080p";
      else r = "720p";
    } else if (model.value.includes("veo3") || model.value.includes("veo3.1")) {
      d = normalizeDuration(selectedDuration, "8s");
      const defaultRes = model.value.includes("veo3.1-lite") ? "720p" : "1080p";
      const rRaw = normalizeResolution(selectedResolution, defaultRes);
      const rLower = rRaw.toLowerCase();
      if (rLower.includes("1080")) r = "1080p";
      else r = "720p";
    } else if (model.value.includes("sora2")) {
      d = normalizeDuration(selectedDuration, "8s");
      // Sora 2 Pro needs resolution, standard Sora 2 doesn't
      if (model.value.includes("pro")) {
        const rRaw = normalizeResolution(selectedResolution, "720p");
        const rLower = rRaw.toLowerCase();
        if (rLower.includes("1080")) r = "1080p";
        else r = "720p";
      } else {
        r = undefined; // Standard Sora 2 doesn't need resolution
      }
    } else if (model.value.startsWith("ltx-2.3-fast")) {
      // LTX 2.3 Fast (Replicate) - supports 1080p/2k/4k and 6–20s
      d = normalizeDuration(selectedDuration, "6s");
      const rRaw = normalizeResolution(selectedResolution, "1080p");
      const rLower = rRaw.toLowerCase();
      if (rLower.includes("4k") || rLower.includes("2160")) r = "4k";
      else if (rLower.includes("2k") || rLower.includes("1440")) r = "2k";
      else r = "1080p";
    } else if (
      model.value === "seedance-2.0-t2v" ||
      model.value === "seedance-2.0-r2v" ||
      model.value === "seedance-2.0-fast" ||
      model.value === "seedance-2.0-fast-r2v"
    ) {
      d = normalizeDuration(selectedDuration, "auto");
      const rRaw = normalizeResolution(selectedResolution, "720p");
      const rLower = rRaw.toLowerCase();
      if (rLower.includes("480")) r = "480p";
      else r = "720p";
    } else if (model.value.includes("seedance-1.5")) {
      d = normalizeDuration(selectedDuration, "5s");
      r = undefined; // Seedance 1.5 pricing does not use resolution
    } else if (model.value.includes("seedance")) {
      d = normalizeDuration(selectedDuration, "5s");
      const rRaw = normalizeResolution(selectedResolution, "720p");
      const rLower = rRaw.toLowerCase();
      if (rLower.includes("480")) r = "480p";
      else if (rLower.includes("720")) r = "720p";
      else if (rLower.includes("1080")) r = "1080p";
      else r = "720p";
    } else if (
      model.value === "gen4_turbo" ||
      model.value === "gen3a_turbo" ||
      model.value === "gen4_aleph"
    ) {
      // Gen-4 Turbo, Gen-3a Turbo, and Gen-4 Aleph: only need duration, not resolution
      d = normalizeDuration(selectedDuration, "10s"); // Gen-4 Aleph defaults to 10s
      r = undefined; // These models don't use resolution for pricing
    } else {
      // For other models, normalize with defaults
      d = normalizeDuration(selectedDuration, "5s");
      r = normalizeResolution(selectedResolution, "720p");
    }

    const aspectRatioForCredits =
      model.value === "seedance-2.0-t2v" ? selectedAspectRatio || "auto" : undefined;

    const generateAudioForCredits =
      model.value === "pixverse-v6-t2v" || model.value === "pixverse-v6-i2v"
        ? pixverseV6GenerateAudio === true
        : undefined;

    const creditModelId =
      model.value === "pixverse-v6-t2v" || model.value === "pixverse-v6-i2v"
        ? selectedModel === "pixverse-v6-i2v"
          ? "pixverse-v6-i2v"
          : "pixverse-v6-t2v"
        : model.value;

    let creditInfo = getModelCreditInfo(
      creditModelId,
      d,
      r,
      generateAudioForCredits,
      undefined,
      aspectRatioForCredits,
    );
    // As a final safety net, retry with strict defaults if no credits resolved
    if (!creditInfo.hasCredits) {
      if (model.value.includes("wan-2.5")) {
        creditInfo = getModelCreditInfo(model.value, "5s", "720p");
      } else if (model.value.startsWith("kling-")) {
        // v2.5 only needs duration
        creditInfo = getModelCreditInfo(model.value, "5s");
      } else if (model.value === "MiniMax-Hailuo-02") {
        creditInfo = getModelCreditInfo(model.value, "6s", "1080P");
      } else if (
        model.value === "MiniMax-Hailuo-2.3" ||
        model.value === "MiniMax-Hailuo-2.3-Fast"
      ) {
        // MiniMax Hailuo 2.3: default to 6s and 768P
        creditInfo = getModelCreditInfo(model.value, "6s", "768P");
      } else if (model.value === "seedance-2.0-t2v") {
        creditInfo = getModelCreditInfo(
          model.value,
          "auto",
          "720p",
          undefined,
          undefined,
          aspectRatioForCredits,
        );
      } else if (
        model.value === "gen4_turbo" ||
        model.value === "gen3a_turbo"
      ) {
        // Gen-4 Turbo and Gen-3a Turbo: default to 5s, no resolution needed
        creditInfo = getModelCreditInfo(model.value, "5s");
      } else if (model.value === "gen4_aleph") {
        // Gen-4 Aleph: default to 10s, no resolution needed
        creditInfo = getModelCreditInfo(model.value, "10s");
      }
    }
    return {
      ...model,
      credits: creditInfo.credits,
      displayText: creditInfo.displayText,
      isLocked: !isModelAccessibleForPlan(
        currentPlanCode,
        "video",
        model.value,
      ),
    };
  });

  // Auto-select first available model if current selection is invalid
  useEffect(() => {
    // Check if selectedModel matches any available model directly
    const exactMatch = availableModels.find((model) =>
      isSeedanceFamilyModel(selectedModel)
        ? model.value === "seedance-2.0-t2v"
        : isVeo31FamilyModel(selectedModel)
          ? model.value === "veo3.1-t2v-8s"
          : isKlingFamilyModel(selectedModel)
            ? model.value === "kling-v3-standard"
            : isHailuoFamilyModel(selectedModel)
              ? model.value === "MiniMax-Hailuo-2.3"
              : isSoraFamilyModel(selectedModel)
                ? model.value === "sora2-t2v"
                : isLtxFamilyModel(selectedModel)
                  ? model.value === "ltx-2.3-pro-t2v"
                  : isWanFamilyModel(selectedModel)
                    ? model.value === "wan-2.5-t2v"
                    : isHappyHorseFamilyModel(selectedModel)
                      ? model.value === "alibaba/happy-horse"
                    : isPixverseFamilyModel(selectedModel)
                      ? model.value === "pixverse-v6-t2v"
        : model.value === selectedModel,
    );
    if (exactMatch) return;

    // Check if selectedModel is a variant (e.g. i2v vs t2v) of an available model
    // Common pattern: model-name-t2v vs model-name-i2v
    const variantMatch = availableModels.find((model) => {
      if (isSeedanceFamilyModel(selectedModel)) {
        return model.value === "seedance-2.0-t2v";
      }
      if (isVeo31FamilyModel(selectedModel)) {
        return model.value === "veo3.1-t2v-8s";
      }
      if (isKlingFamilyModel(selectedModel)) {
        return model.value === "kling-v3-standard";
      }
      if (isHailuoFamilyModel(selectedModel)) {
        return model.value === "MiniMax-Hailuo-2.3";
      }
      if (isSoraFamilyModel(selectedModel)) {
        return model.value === "sora2-t2v";
      }
      if (isLtxFamilyModel(selectedModel)) {
        return model.value === "ltx-2.3-pro-t2v";
      }
      if (isWanFamilyModel(selectedModel)) {
        return model.value === "wan-2.5-t2v";
      }
      if (isHappyHorseFamilyModel(selectedModel)) {
        return model.value === "alibaba/happy-horse";
      }
      if (isPixverseFamilyModel(selectedModel)) {
        return model.value === "pixverse-v6-t2v";
      }
      const baseAvailable = model.value.replace(/-t2v$|-i2v$|-r2v$/, "");
      const baseSelected = selectedModel.replace(/-t2v$|-i2v$|-r2v$/, "");
      return baseAvailable === baseSelected;
    });

    if (variantMatch) return;

    const firstAccessibleModel = modelsWithCredits.find(
      (model) => !model.isLocked,
    );
    if (firstAccessibleModel) {
      onModelChange(firstAccessibleModel.value);
    }
  }, [
    generationMode,
    availableModels,
    modelsWithCredits,
    selectedModel,
    onModelChange,
    activeFeature,
    pixverseV6GenerateAudio,
  ]);

  const selectedModelEntry = modelsWithCredits.find((model) =>
    isSeedanceFamilyModel(selectedModel)
      ? model.value === "seedance-2.0-t2v"
      : isVeo31FamilyModel(selectedModel)
        ? model.value === "veo3.1-t2v-8s"
        : isKlingFamilyModel(selectedModel)
          ? model.value === "kling-v3-standard"
          : isHailuoFamilyModel(selectedModel)
            ? model.value === "MiniMax-Hailuo-2.3"
            : isSoraFamilyModel(selectedModel)
              ? model.value === "sora2-t2v"
              : isLtxFamilyModel(selectedModel)
                ? model.value === "ltx-2.3-pro-t2v"
                : isWanFamilyModel(selectedModel)
                  ? model.value === "wan-2.5-t2v"
                  : isHappyHorseFamilyModel(selectedModel)
                    ? model.value === "alibaba/happy-horse"
                  : isPixverseFamilyModel(selectedModel)
                    ? model.value === "pixverse-v6-t2v"
      : model.value === selectedModel,
  );

  const isOptionSelected = (modelValue: string) =>
    modelValue === "seedance-2.0-t2v"
      ? isSeedanceFamilyModel(selectedModel)
      : modelValue === "veo3.1-t2v-8s"
        ? isVeo31FamilyModel(selectedModel)
        : modelValue === "kling-v3-standard"
          ? isKlingFamilyModel(selectedModel)
          : modelValue === "MiniMax-Hailuo-2.3"
            ? isHailuoFamilyModel(selectedModel)
            : modelValue === "sora2-t2v"
              ? isSoraFamilyModel(selectedModel)
              : modelValue === "ltx-2.3-pro-t2v"
                ? isLtxFamilyModel(selectedModel)
                : modelValue === "wan-2.5-t2v"
                  ? isWanFamilyModel(selectedModel)
                  : modelValue === "alibaba/happy-horse"
                    ? isHappyHorseFamilyModel(selectedModel)
                  : modelValue === "pixverse-v6-t2v"
                    ? isPixverseFamilyModel(selectedModel)
      : selectedModel === modelValue;

  const handleVideoModelSelect = (modelValue: string) => {
    if (!isModelAccessibleForPlan(currentPlanCode, "video", modelValue)) {
      setIsOpen(false);
      router.push("/view/pricing");
      return;
    }
    try {
      onModelChange(modelValue);
    } catch {}
    setIsOpen(false);
  };

  const dropdownContent =
    isOpen && dropdownPosition ? (
      <div
        data-dropdown={dropdownId}
        className="fixed z-[9999] w-[min(calc(100vw-24px),220px)] max-w-[calc(100vw-24px)] max-h-[36vh] overflow-y-auto overflow-x-hidden rounded-lg bg-black/90 pb-1.5 pt-1.5 shadow-2xl ring-1 ring-white/30 backdrop-blur-3xl dropdown-scrollbar-thin md:max-h-[min(42vh,40rem)] md:w-auto md:min-w-[300px] md:max-w-none md:pb-2 md:pt-2"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          transform: dropdownPosition.openUp
            ? "translateY(calc(-100% - 8px))"
            : "none",
        }}
      >
        {(() => {
          const filteredModels = modelsWithCredits;

          if (generationMode === "text_to_video") {
            return (
              <div className="divide-y divide-white/10">
                {filteredModels.map((model) => (
                  <button
                    key={`t2v-${model.value}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoModelSelect(model.value);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left transition text-[10px] md:gap-3 md:px-4 md:py-2 md:text-[13px] ${
                      isOptionSelected(model.value)
                        ? "bg-white text-black"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                    >
                    <div className="flex min-w-0 flex-1 flex-col mb-0">
                      <span className="flex flex-wrap items-center gap-1 md:gap-2">
                        {model.label}
                        {model.isLocked && (
                          <Lock className="h-2.5 w-2.5 text-amber-300 md:h-4 md:w-4" />
                        )}
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/crown.svg"
                          alt="pro"
                          className="h-2.5 w-2.5 md:h-4 md:w-4"
                        />
                      </span>
                      {model.isLocked ? (
                        <span className="-mt-0.5 font-normal text-[8px] opacity-80 md:text-[11px]">
                          Upgrade to access
                        </span>
                      ) : null}
                      {model.description ? (
                        <span
                          className={`mt-0.5 max-w-none text-[8px] leading-tight md:max-w-[240px] md:text-[10px] md:leading-snug ${
                            isOptionSelected(model.value)
                              ? "text-black/100"
                              : "text-white/70"
                          }`}
                        >
                          {model.description}
                        </span>
                      ) : null}
                    </div>
                    {isOptionSelected(model.value) && (
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-black md:h-2 md:w-2"></div>
                    )}
                  </button>
                ))}
              </div>
            );
          }

          const leftModels = filteredModels.slice(
            0,
            Math.ceil(filteredModels.length / 2),
          );
          const rightModels = filteredModels.slice(
            Math.ceil(filteredModels.length / 2),
          );

          return (
            <div className="md:grid md:grid-cols-2 grid-cols-1 gap-0">
              <div className="divide-y divide-white/10">
                {leftModels.map((model) => (
                  <button
                    key={`left-${model.value}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoModelSelect(model.value);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left transition text-[10px] md:gap-3 md:px-4 md:py-2 md:text-[13px] ${
                      isOptionSelected(model.value)
                        ? "bg-white text-black"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col mb-0">
                      <span className="flex flex-wrap items-center gap-1 md:gap-2">
                        {model.label}
                        {model.isLocked && (
                          <Lock className="h-2.5 w-2.5 text-amber-300 md:h-4 md:w-4" />
                        )}
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/crown.svg"
                          alt="pro"
                          className="h-2.5 w-2.5 md:h-4 md:w-4"
                        />
                      </span>
                      <span className="-mt-0.5 font-normal text-[8px] opacity-80 md:text-[11px]">
                        {model.isLocked
                          ? "Upgrade to access"
                          : model.displayText ||
                            (model.credits != null
                              ? `${model.credits} credits`
                              : "credits unavailable")}
                      </span>
                    </div>
                    {isOptionSelected(model.value) && (
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-black md:h-2 md:w-2"></div>
                    )}
                  </button>
                ))}
              </div>
              <div className="md:border-l border-white/10 divide-y divide-white/10">
                {rightModels.map((model) => (
                  <button
                    key={`right-${model.value}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoModelSelect(model.value);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left transition text-[10px] md:gap-3 md:px-4 md:py-2 md:text-[13px] ${
                      isOptionSelected(model.value)
                        ? "bg-white text-black"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col -mb-0">
                      <span className="flex flex-wrap items-center gap-1 md:gap-2">
                        {model.label}
                        {model.isLocked && (
                          <Lock className="h-2.5 w-2.5 text-amber-300 md:h-4 md:w-4" />
                        )}
                        <img
                          src="https://idr01.zata.ai/devstoragev1/public/icons/crown.svg"
                          alt="pro"
                          className="h-2.5 w-2.5 md:h-4 md:w-4"
                        />
                      </span>
                      <span className="-mt-0.5 font-normal text-[8px] opacity-80 md:text-[11px]">
                        {model.isLocked
                          ? "Upgrade to access"
                          : model.displayText ||
                            (model.credits != null
                              ? `${model.credits} credits`
                              : "credits unavailable")}
                      </span>
                    </div>
                    {isOptionSelected(model.value) && (
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-black md:h-2 md:w-2"></div>
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
    <>
    <div className="relative dropdown-container">
      <button
        ref={buttonRef}
        onClick={() => {
          try {
            if (onCloseOtherDropdowns) onCloseOtherDropdowns();
          } catch {}
          setIsOpen(!isOpen);
        }}
        className={`flex h-[28px] w-auto max-w-[44vw] min-w-0 items-center justify-between gap-0 rounded-lg bg-white px-1 text-[11px] font-medium text-black transition hover:bg-white/95 ring-1 ring-white/20 hover:ring-white/30 md:h-[32px] md:max-w-none md:w-auto md:px-4 md:text-[13px] md:justify-start ml-0.75`}
      >
        <Cpu className="md:w-4 w-3 h-3 md:h-4  mr-1" />
        <span className="truncate">{selectedModelInfo?.label || selectedModel}</span>
        {selectedModelEntry?.isLocked && (
          <Lock className="md:w-4 w-3 h-3 md:h-4 text-black/70" />
        )}
        <ChevronUp
          className={`md:w-4 w-3 h-3 md:h-4  transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
    </div>
    {typeof window !== "undefined" &&
      dropdownContent &&
      createPortal(dropdownContent, document.body)}
    </>
  );
};

export default VideoModelsDropdown;
