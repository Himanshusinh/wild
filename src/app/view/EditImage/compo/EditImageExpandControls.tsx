"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { CustomDimensionInput } from "./CustomDimensionInput";
import { ChevronUp } from "lucide-react";

interface EditImageExpandControlsProps {
  aspectPreset: string;
  expandPrompt: string;
  isExpanding: boolean;
  externalIsExpanding?: boolean;
  sourceImageUrl: string | null;
  onAspectPresetChange: (preset: string) => void;
  onExpandPromptChange: (prompt: string) => void;
  onExpand: () => void;
  aspectPresets: Record<
    string,
    { label: string; sizeLabel?: string; width?: number; height?: number }
  >;
  customWidth: number;
  customHeight: number;
  onCustomWidthChange: (width: number) => void;
  onCustomHeightChange: (height: number) => void;
  imageSize?: { width: number; height: number } | null;
}

export const EditImageExpandControls: React.FC<
  EditImageExpandControlsProps
> = ({
  aspectPreset,
  expandPrompt,
  isExpanding,
  externalIsExpanding,
  sourceImageUrl,
  onAspectPresetChange,
  onExpandPromptChange,
  onExpand,
  aspectPresets,
  customWidth,
  customHeight,
  onCustomWidthChange,
  onCustomHeightChange,
  imageSize,
}) => {
  // Hardcoded dark mode
  const isDark = true;

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const customButtonRef = useRef<HTMLDivElement>(null);
  const presetDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate minimum frame dimensions based on image size
  const minWidth = imageSize ? imageSize.width : 1024;
  const minHeight = imageSize ? imageSize.height : 1024;

  // Use all presets (removed filtering)
  const availablePresets = aspectPresets;

  const inputBg = "#1a1a1a";
  const inputText = "#ffffff";
  const selectBg = "#121212";
  const selectText = "#ffffff";
  const selectBorder = "rgba(255, 255, 255, 0.2)";
  const buttonBg = aspectPreset === "custom" ? "#2F6BFF" : "#1a1a1a";
  const buttonText = "white";
  const promptInputBg = "#121212";
  const promptInputText = "#ffffff";
  const headingColor = "#ffffff";

  const selectedPresetKey =
    aspectPreset === "custom"
      ? Object.keys(availablePresets).find((k) => k !== "custom") || "1:1"
      : aspectPreset;

  const selectedPresetConfig = availablePresets[selectedPresetKey];
  const selectedPresetLabel = selectedPresetConfig
    ? `${selectedPresetConfig.label}${selectedPresetConfig.sizeLabel ? ` (${selectedPresetConfig.sizeLabel})` : ""}`
    : selectedPresetKey;

  const handlePresetSelect = (selectedPreset: string) => {
    const preset = availablePresets[selectedPreset];

    if (selectedPreset === "custom") {
      onAspectPresetChange("custom");
      setIsPresetDropdownOpen(false);
      return;
    }

    if (preset && preset.width && preset.height && imageSize) {
      if (preset.width < imageSize.width || preset.height < imageSize.height) {
        onCustomWidthChange(Math.max(preset.width, imageSize.width));
        onCustomHeightChange(Math.max(preset.height, imageSize.height));
        onAspectPresetChange("custom");
        setIsPresetDropdownOpen(false);
        return;
      }
    }

    onAspectPresetChange(selectedPreset);
    setIsPresetDropdownOpen(false);
  };

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (
        presetDropdownRef.current &&
        !presetDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPresetDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <p className="text-[12px] md:text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-1 pt-2 md:pt-1">
          Expand Image
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Aspect Ratio Dropdown */}
        <div
          ref={presetDropdownRef}
          className="relative edit-dropdown min-w-[200px]"
        >
          <button
            onClick={() => setIsPresetDropdownOpen((prev) => !prev)}
          className="h-[42px] md:h-[38px] w-full px-4 rounded-xl text-[13px] font-medium border border-white/12 hover:bg-white/3 transition flex items-center justify-between bg-transparent text-white/90"
          >
            <span className="truncate">{selectedPresetLabel}</span>
            <ChevronUp
              className={`w-4 h-4 ml-2 shrink-0 transition-transform duration-200 ${isPresetDropdownOpen ? "" : "rotate-180"}`}
            />
          </button>

          {isPresetDropdownOpen && (
            <div className="absolute top-full mt-1 z-30 left-0 w-full bg-black backdrop-blur-xl rounded-xl ring-1 ring-white/15 py-1 max-h-35 overflow-y-auto dropdown-scrollbar">
              {Object.entries(availablePresets)
                .filter(([key]) => key !== "custom")
                .map(([key, config]) => {
                  const isDisabled =
                    !!imageSize &&
                    !!config.width &&
                    !!config.height &&
                    (config.width < imageSize.width ||
                      config.height < imageSize.height);

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (isDisabled) return;
                        handlePresetSelect(key);
                      }}
                      disabled={isDisabled}
                      className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center gap-2 ${
                        selectedPresetKey === key
                          ? "bg-white/10 text-white font-medium"
                          : isDisabled
                            ? "text-white/35 cursor-not-allowed"
                            : "text-white/75 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {selectedPresetKey === key && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
                      )}
                      <span className="truncate">
                        {config.label}
                        {config.sizeLabel ? ` (${config.sizeLabel})` : ""}
                      </span>
                      {isDisabled && (
                        <span className="ml-auto text-[11px] text-white/35">
                          Too small
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Width Input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={
              aspectPreset === "custom"
                ? customWidth
                : aspectPresets[aspectPreset]?.width || 1500
            }
            onChange={(e) => {
              if (aspectPreset === "custom") {
                const value = parseInt(e.target.value) || minWidth;
                onCustomWidthChange(Math.max(minWidth, Math.min(5000, value)));
              }
            }}
            disabled={aspectPreset !== "custom"}
            min={minWidth}
            max={5000}
            placeholder="W"
            className={`h-[42px] md:h-[38px] w-[84px] md:w-[78px] px-3 rounded-xl border border-white/12 text-white text-[13px] focus:outline-none ${aspectPreset === "custom" ? "bg-white/3" : "bg-white/3 opacity-50 cursor-not-allowed"}`}
          />

          {/* Height Input */}
          <input
            type="number"
            value={
              aspectPreset === "custom"
                ? customHeight
                : aspectPresets[aspectPreset]?.height || 1500
            }
            onChange={(e) => {
              if (aspectPreset === "custom") {
                const value = parseInt(e.target.value) || minHeight;
                onCustomHeightChange(
                  Math.max(minHeight, Math.min(5000, value)),
                );
              }
            }}
            disabled={aspectPreset !== "custom"}
            min={minHeight}
            max={5000}
            placeholder="H"
            className={`h-[42px] md:h-[38px] w-[84px] md:w-[78px] px-3 rounded-xl border border-white/12 text-white text-[13px] focus:outline-none ${aspectPreset === "custom" ? "bg-white/3" : "bg-white/3 opacity-50 cursor-not-allowed"}`}
          />
        </div>

        {/* Custom Button */}
        <div ref={customButtonRef} className="relative">
          <button
            onClick={() => {
              onAspectPresetChange("custom");
              setShowCustomInput(!showCustomInput);
            }}
            className={`h-[42px] md:h-[38px] px-4 rounded-xl border border-white/12 text-[13px] font-medium transition-colors ${aspectPreset === "custom" ? "bg-[#2F6BFF] text-white shadow-[0_4px_16px_rgba(47,107,255,0.28)]" : "bg-white/3 text-white/80 hover:bg-white/10"}`}
          >
            Custom
          </button>
          {showCustomInput && aspectPreset === "custom" && (
            <CustomDimensionInput
              width={customWidth}
              height={customHeight}
              onWidthChange={onCustomWidthChange}
              onHeightChange={onCustomHeightChange}
              onClose={() => setShowCustomInput(false)}
              minWidth={minWidth}
              minHeight={minHeight}
              anchorElement={customButtonRef.current}
            />
          )}
        </div>
      </div>

      {/* Prompt Input */}
      {/* <div className="w-full">
        <input
          type="text"
          value={expandPrompt}
          onChange={(e) => onExpandPromptChange(e.target.value)}
          placeholder="Prompt (optional)"
          className="w-full h-[32px] px-3 rounded-lg bg-white/5 border border-white/20 text-white text-xs focus:outline-none placeholder-white/40"
        />
      </div> */}
    </div>
  );
};
