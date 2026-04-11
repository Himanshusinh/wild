"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

interface VideoDurationDropdownProps {
  selectedDuration: number | "auto";
  onDurationChange: (duration: number | "auto") => void;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
  selectedModel?: string;
  generationMode?: string;
  hasFirstFrame?: boolean;
  hasLastFrame?: boolean;
}

const VideoDurationDropdown: React.FC<VideoDurationDropdownProps> = ({
  selectedDuration,
  onDurationChange,
  onCloseOtherDropdowns,
  onCloseThisDropdown,
  selectedModel,
  generationMode,
  hasFirstFrame,
  hasLastFrame,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);
  const dropdownId = "video-duration-dropdown";

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
      const dropdownWidth = window.innerWidth >= 768 ? 192 : 112;
      let left = buttonRect.left;
      let top = buttonRect.top;
      let openUp = true;

      if (left + dropdownWidth > window.innerWidth - 8) {
        left = window.innerWidth - dropdownWidth - 8;
      }
      if (left < 8) {
        left = 8;
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

  // Get available durations based on model and generation mode
  const getAvailableDurations = () => {
    const isVeo31LiteFirstLastMode =
      selectedModel?.includes("veo3.1-lite") &&
      Boolean(hasFirstFrame) &&
      Boolean(hasLastFrame);

    if (selectedModel?.includes("MiniMax")) {
      // MiniMax-Hailuo-02 supports only 6s and 10s
      return [
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" },
      ];
    }
    if (
      selectedModel === "T2V-01-Director" ||
      selectedModel === "I2V-01-Director" ||
      selectedModel === "S2V-01"
    ) {
      // Director variants are fixed at 6s
      return [{ value: 6, label: "6 seconds", description: "Fixed duration" }];
    }
    if (selectedModel?.includes("sora2")) {
      // Sora 2 supports 4s, 8s, and 12s
      return [
        { value: 4, label: "4 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" },
        { value: 12, label: "12 seconds", description: "Long video" },
      ];
    }
    if (selectedModel?.includes("pixverse")) {
      // PixVerse supports 5s and 8s
      return [
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 8, label: "8 seconds", description: "Long" },
      ];
    }
    if (selectedModel?.startsWith("ltx-2.3-pro")) {
      // LTX 2.3 Pro supports only 6s/8s/10s
      return [
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" },
        { value: 10, label: "10 seconds", description: "Long video" },
      ];
    }
    if (
      selectedModel?.includes("ltx2") ||
      selectedModel?.startsWith("ltx-2.3-fast")
    ) {
      // LTX V2 and LTX 2.3 Fast support various durations
      if (selectedModel?.startsWith("ltx-2.3-fast")) {
        return [
          { value: 6, label: "6 seconds", description: "Short video" },
          { value: 8, label: "8 seconds", description: "Standard" },
          { value: 10, label: "10 seconds", description: "Medium" },
          { value: 12, label: "12 seconds", description: "Long" },
          { value: 14, label: "14 seconds", description: "Medium long" },
          { value: 16, label: "16 seconds", description: "Very long" },
          { value: 18, label: "18 seconds", description: "Extra long" },
          { value: 20, label: "20 seconds", description: "Maximum length" },
        ];
      }
      return [
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" },
        { value: 10, label: "10 seconds", description: "Long video" },
      ];
    }
    if (
      selectedModel === "seedance-2.0-t2v" ||
      selectedModel === "seedance-2.0-r2v" ||
      selectedModel === "seedance-2.0-fast" ||
      selectedModel === "seedance-2.0-fast-i2v" ||
      selectedModel === "seedance-2.0-fast-r2v"
    ) {
      return [
        {
          value: "auto" as const,
          label: "Auto",
          description: "Model decides",
        },
        { value: 4, label: "4 seconds", description: "Short video" },
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 6, label: "6 seconds", description: "Medium" },
        { value: 7, label: "7 seconds", description: "Medium long" },
        { value: 8, label: "8 seconds", description: "Long" },
        { value: 9, label: "9 seconds", description: "Extended" },
        { value: 10, label: "10 seconds", description: "Extended" },
        { value: 11, label: "11 seconds", description: "Extended" },
        { value: 12, label: "12 seconds", description: "Extended" },
        { value: 13, label: "13 seconds", description: "Extended" },
        { value: 14, label: "14 seconds", description: "Extended" },
        { value: 15, label: "15 seconds", description: "Maximum length" },
      ];
    }
    if (selectedModel?.includes("seedance-1.5")) {
      // Seedance 1.5 supports exact 4–12 seconds (2s/3s removed)
      return [
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 6, label: "6 seconds", description: "Medium" },
        { value: 7, label: "7 seconds", description: "Medium long" },
        { value: 8, label: "8 seconds", description: "Long" },
        { value: 9, label: "9 seconds", description: "Very long" },
        { value: 10, label: "10 seconds", description: "Maximum" },
        { value: 11, label: "11 seconds", description: "Maximum" },
        { value: 12, label: "12 seconds", description: "Maximum" },
      ];
    }
    if (selectedModel?.includes("seedance")) {
      // Seedance 1.0 pricing is bucketed on the frontend (5s/10s)
      return [
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 10, label: "10 seconds", description: "Long" },
      ];
    }
    if (selectedModel?.includes("veo3.1-lite")) {
      if (isVeo31LiteFirstLastMode) {
        return [
          {
            value: 8,
            label: "8 seconds",
            description: "First-last mode",
          },
        ];
      }

      return [
        { value: 4, label: "4 seconds", description: "Single-frame I2V" },
        { value: 6, label: "6 seconds", description: "Single-frame I2V" },
        {
          value: 8,
          label: "8 seconds",
          description: "Single-frame I2V or first-last mode",
        },
      ];
    }
    if (selectedModel?.includes("veo3.1")) {
      // For Veo 3.1 image-to-video, only show 8s
      if (generationMode === "image_to_video") {
        return [
          { value: 8, label: "8 seconds", description: "Standard length" },
        ];
      }
      // For Veo 3.1 text-to-video, show all options
      return [
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" },
      ];
    }
    if (selectedModel?.includes("veo3") && !selectedModel.includes("veo3.1")) {
      // For Veo3 image-to-video, only show 8s
      if (generationMode === "image_to_video") {
        return [
          { value: 8, label: "8 seconds", description: "Standard length" },
        ];
      }
      // For Veo3 text-to-video, show all options
      return [
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" },
      ];
    }
    if (selectedModel === "kling-v3-pro") {
      return [
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 6, label: "6 seconds", description: "Medium" },
        { value: 7, label: "7 seconds", description: "Medium long" },
        { value: 8, label: "8 seconds", description: "Long" },
        { value: 9, label: "9 seconds", description: "Extended" },
        { value: 10, label: "10 seconds", description: "Extended" },
        { value: 11, label: "11 seconds", description: "Extended" },
        { value: 12, label: "12 seconds", description: "Extended" },
        { value: 13, label: "13 seconds", description: "Extended" },
        { value: 14, label: "14 seconds", description: "Extended" },
        { value: 15, label: "15 seconds", description: "Maximum length" },
      ];
    }
    if (selectedModel?.startsWith("kling-v3")) {
      return [
        { value: 3, label: "3 seconds", description: "Quick video" },
        { value: 4, label: "4 seconds", description: "Short video" },
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 6, label: "6 seconds", description: "Medium" },
        { value: 7, label: "7 seconds", description: "Medium long" },
        { value: 8, label: "8 seconds", description: "Long" },
        { value: 9, label: "9 seconds", description: "Extended" },
        { value: 10, label: "10 seconds", description: "Extended" },
        { value: 11, label: "11 seconds", description: "Extended" },
        { value: 12, label: "12 seconds", description: "Extended" },
        { value: 13, label: "13 seconds", description: "Extended" },
        { value: 14, label: "14 seconds", description: "Extended" },
        { value: 15, label: "15 seconds", description: "Maximum length" },
      ];
    }
    if (selectedModel?.startsWith("kling-")) {
      // Kling supports 5s and 10s
      return [
        { value: 5, label: "5 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" },
      ];
    }
    if (selectedModel === "kling-lip-sync") {
      // Kling Lip Sync supports 2-10 seconds
      return [
        { value: 2, label: "2 seconds", description: "Very short" },
        { value: 3, label: "3 seconds", description: "Short" },
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 5, label: "5 seconds", description: "Standard short" },
        { value: 6, label: "6 seconds", description: "Medium" },
        { value: 7, label: "7 seconds", description: "Medium long" },
        { value: 8, label: "8 seconds", description: "Long" },
        { value: 9, label: "9 seconds", description: "Very long" },
        { value: 10, label: "10 seconds", description: "Maximum length" },
      ];
    }
    if (selectedModel?.includes("wan-2.5")) {
      // WAN 2.5 models support 5s and 10s
      return [
        { value: 5, label: "5 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" },
      ];
    }
    if (selectedModel === "gen4_turbo" || selectedModel === "gen3a_turbo") {
      // Gen-4 Turbo and Gen-3a Turbo support only 5s and 10s (per backend validation)
      return [
        { value: 5, label: "5 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" },
      ];
    }
    // Legacy check for other gen4/gen3a models (should not match gen4_turbo or gen3a_turbo)
    if (selectedModel?.includes("gen4") || selectedModel?.includes("gen3a")) {
      // Other Runway models (like gen4_aleph) may support different durations
      return [
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" },
      ];
    }
    // Default fallback
    return [
      { value: 4, label: "4 seconds", description: "Quick video" },
      { value: 6, label: "6 seconds", description: "Short video" },
      { value: 10, label: "10 seconds", description: "Standard length" },
    ];
  };

  const availableDurations = getAvailableDurations();

  useEffect(() => {
    if (
      availableDurations.length > 0 &&
      !availableDurations.find((option) => option.value === selectedDuration)
    ) {
      onDurationChange(availableDurations[0].value);
    }
  }, [availableDurations, selectedDuration, onDurationChange]);

  useEffect(() => {
    if (
      selectedModel === "kling-v3-pro" &&
      (selectedDuration === 3 || selectedDuration === 4)
    ) {
      onDurationChange(5);
    }
  }, [selectedDuration, selectedModel, onDurationChange]);

  const selectedDurationInfo = availableDurations.find(
    (duration) => duration.value === selectedDuration,
  );

  const dropdownContent =
    isOpen && dropdownPosition ? (
      <div
        data-dropdown={dropdownId}
        className="fixed md:w-48 w-28 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-2 pt-2 z-[9999]"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          transform: dropdownPosition.openUp
            ? "translateY(calc(-100% - 8px))"
            : "none",
        }}
      >
        {availableDurations.map((duration) => (
          <button
            key={duration.value}
            onClick={() => {
              onDurationChange(duration.value);
              setIsOpen(false);
            }}
            className={`w-full md:px-4 md:p-2 p-2 text-left transition md:text-[13px] text-[11px] flex items-center justify-between ${
              selectedDuration === duration.value
                ? "bg-white text-black"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            <span className="md:text-sm text-xs">{duration.label}</span>
            {selectedDuration === duration.value && (
              <div className="w-2 h-2 bg-black rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <>
    <div className="relative dropdown-container">
      <button
        ref={buttonRef}
        onClick={() => {
          try {
            if (onCloseOtherDropdowns) {
              onCloseOtherDropdowns();
            }
          } catch {}
          setIsOpen(!isOpen);
        }}
        className={`md:h-[32px] h-[28px] md:px-4 px-2 rounded-lg md:text-[13px] text-[11px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5`}
      >
        <Clock className="md:w-4 w-3 h-3 md:h-4  mr-1" />
        {selectedDurationInfo?.label ||
          (selectedDuration === "auto" ? "Auto" : `${selectedDuration}s`)}
        <ChevronUp
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
    </div>
    {typeof window !== "undefined" &&
      dropdownContent &&
      createPortal(dropdownContent, document.body)}
    </>
  );
};

export default VideoDurationDropdown;
