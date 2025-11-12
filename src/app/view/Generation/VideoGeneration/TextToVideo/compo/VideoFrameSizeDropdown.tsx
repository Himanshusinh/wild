"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Crop } from "lucide-react";

interface VideoFrameSizeDropdownProps {
  selectedFrameSize: string;
  onFrameSizeChange: (frameSize: string) => void;
  selectedModel: string;
  generationMode?: string;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
  // MiniMax specific: needed to filter resolutions per backend rules
  miniMaxDuration?: number;
}

const VideoFrameSizeDropdown: React.FC<VideoFrameSizeDropdownProps> = ({
  selectedFrameSize,
  onFrameSizeChange,
  selectedModel,
  generationMode,
  onCloseOtherDropdowns,
  onCloseThisDropdown,
  miniMaxDuration,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Get available frame sizes based on model and generation mode
  const getAvailableFrameSizes = () => {
    if (selectedModel?.includes("sora2")) {
      // Sora 2 models support limited aspect ratios
      if (generationMode === "image_to_video") {
        // Sora 2 I2V supports auto, 16:9, 9:16
        return [
          { value: "auto", label: "Auto", description: "Auto-detect aspect ratio", icon: "auto" },
          { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
          { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" }
        ];
      } else {
        // Sora 2 T2V supports 16:9, 9:16
        return [
          { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
          { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" }
        ];
      }
    } else if (selectedModel?.includes("veo3.1")) {
      // Veo 3.1 models support limited aspect ratios
      if (generationMode === "image_to_video") {
        // Veo 3.1 image-to-video only supports auto, 16:9, 9:16
        return [
          { value: "auto", label: "Auto", description: "Auto-detect aspect ratio", icon: "auto" },
          { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
          { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" }
        ];
      } else {
        // Veo 3.1 text-to-video supports more ratios
        return [
          { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
          { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" },
          { value: "1:1", label: "1:1", description: "960×960 square", icon: "square" }
        ];
      }
    } else if (selectedModel?.includes("veo3") && !selectedModel.includes("veo3.1")) {
      // Veo3 models support limited aspect ratios
      if (generationMode === "image_to_video") {
        // Veo3 image-to-video only supports auto, 16:9, 9:16
        return [
          { value: "auto", label: "Auto", description: "Auto-detect aspect ratio", icon: "auto" },
          { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
          { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" }
        ];
      } else {
        // Veo3 text-to-video supports more ratios
        return [
          { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
          { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" },
          { value: "1:1", label: "1:1", description: "960×960 square", icon: "square" }
        ];
      }
    } else if (selectedModel?.includes("pixverse")) {
      // PixVerse supports 16:9, 9:16, 1:1 for both T2V and I2V
      return [
        { value: "16:9", label: "16:9", description: "Widescreen landscape", icon: "landscape" },
        { value: "9:16", label: "9:16", description: "Widescreen portrait", icon: "portrait" },
        { value: "1:1", label: "1:1", description: "Square", icon: "square" }
      ];
    } else if (selectedModel?.includes("seedance")) {
      // Seedance supports many aspect ratios, but only for T2V (not I2V)
      if (generationMode === "image_to_video") {
        // For I2V, aspect_ratio is ignored by the API, but we can still show limited options
        return [
          { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
          { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" },
          { value: "1:1", label: "1:1", description: "Square", icon: "square" }
        ];
      } else {
        // For T2V, show all supported aspect ratios
        return [
          { value: "16:9", label: "16:9", description: "Widescreen landscape", icon: "landscape" },
          { value: "4:3", label: "4:3", description: "Classic landscape", icon: "landscape" },
          { value: "1:1", label: "1:1", description: "Square", icon: "square" },
          { value: "3:4", label: "3:4", description: "Classic portrait", icon: "portrait" },
          { value: "9:16", label: "9:16", description: "Widescreen portrait", icon: "portrait" },
          { value: "21:9", label: "21:9", description: "Ultrawide landscape", icon: "landscape" },
          { value: "9:21", label: "9:21", description: "Ultrawide portrait", icon: "portrait" }
        ];
      }
    } else if (selectedModel?.includes("wan-2.5")) {
      // WAN 2.5 models support specific size formats
      return [
        { value: "832*480", label: "480p", description: "832×480 landscape", icon: "landscape" },
        { value: "480*832", label: "480p", description: "480×832 portrait", icon: "portrait" },
        { value: "1280*720", label: "720p", description: "1280×720 landscape", icon: "landscape" },
        { value: "720*1280", label: "720p", description: "720×1280 portrait", icon: "portrait" },
        { value: "1920*1080", label: "1080p", description: "1920×1080 landscape", icon: "landscape" },
        { value: "1080*1920", label: "1080p", description: "1080×1920 portrait", icon: "portrait" }
      ];
    } else if (selectedModel?.startsWith('kling-')) {
      // Kling models use aspect ratios
      return [
        { value: "16:9", label: "16:9", description: "Landscape", icon: "landscape" },
        { value: "9:16", label: "9:16", description: "Portrait", icon: "portrait" },
        { value: "1:1", label: "1:1", description: "Square", icon: "square" }
      ];
    } else if (selectedModel === "gen3a_turbo") {
      return [
        { value: "16:10", label: "16:10", description: "1280×768 landscape", icon: "landscape" },
        { value: "10:16", label: "10:16", description: "768×1280 portrait", icon: "portrait" }
      ];
    } else if (selectedModel?.includes("MiniMax") || selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
      // MiniMax models use resolution values
      if (selectedModel === "T2V-01-Director" || selectedModel === "I2V-01-Director" || selectedModel === "S2V-01") {
        // Director models have fixed 720P resolution
        return [
          { value: "720P", label: "720P", description: "1280×720 HD", icon: "landscape" }
        ];
      } else {
        // MiniMax-Hailuo-02 supports multiple resolutions
        let options = [
          { value: "512P", label: "512P", description: "512×512 square", icon: "square" },
          { value: "768P", label: "768P", description: "768×768 square", icon: "square" },
          { value: "1080P", label: "1080P", description: "1080×1080 square", icon: "square" }
        ];
        // Backend rules:
        // - Text→Video does not support 512P
        if (generationMode === "text_to_video") {
          options = options.filter(o => o.value !== "512P");
        }
        // - 10s duration does not support 1080P
        if (miniMaxDuration === 10) {
          options = options.filter(o => o.value !== "1080P");
        }
        return options;
      }
    } else {
      // gen4_turbo and gen4_aleph support more ratios
      return [
        { value: "16:9", label: "16:9", description: "1280×720 landscape", icon: "landscape" },
        { value: "9:16", label: "9:16", description: "720×1280 portrait", icon: "portrait" },
        { value: "4:3", label: "4:3", description: "1104×832 landscape", icon: "landscape" },
        { value: "3:4", label: "3:4", description: "832×1104 portrait", icon: "portrait" },
        { value: "1:1", label: "1:1", description: "960×960 square", icon: "square" },
        { value: "21:9", label: "21:9", description: "1584×672 ultra-wide", icon: "ultrawide" }
      ];
    }
  };

  const availableFrameSizes = getAvailableFrameSizes();
  const selectedFrameSizeInfo = availableFrameSizes.find(size => size.value === selectedFrameSize);

  // Auto-adjust frame size if current selection is not available for the model
  useEffect(() => {
    const availableSizes = getAvailableFrameSizes();
    if (!availableSizes.find(size => size.value === selectedFrameSize)) {
      onFrameSizeChange(availableSizes[0].value);
    }
  }, [selectedModel, selectedFrameSize, onFrameSizeChange, generationMode, miniMaxDuration]);

  return (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          try {
            if (onCloseOtherDropdowns) {
              onCloseOtherDropdowns();
            }
          } catch {}
          setIsOpen(!isOpen);
        }}
        className={`h-[28px] md:h-[32px] px-2 md:px-4 rounded-lg text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5`}
      >
        <Crop className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        {selectedFrameSizeInfo?.label || selectedFrameSize}
        <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="
          fixed md:left-1/2 left-0 ml-3 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[16vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-32
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/30
          pb-1.5 md:pb-2 pt-1.5 md:pt-2 z-80 max-h-[40vh] md:max-h-150 overflow-y-auto dropdown-scrollbar">
          {availableFrameSizes.map((size) => (
            <button
              key={size.value}
              onClick={() => {
                onFrameSizeChange(size.value);
                setIsOpen(false);
              }}
              className={`w-full px-2 md:px-3 py-1.5 md:py-2 text-left transition text-[10px] md:text-[13px] flex items-center justify-between gap-2 md:gap-3 ${
                selectedFrameSize === size.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span className="flex items-center gap-2">
                {/* Icon */}
                {size.icon === 'square' && (
                  <span className={`inline-block w-3 h-3 md:w-4 md:h-4 border ${
                    selectedFrameSize === size.value ? 'border-black' : 'border-white/60'
                  }`}></span>
                )}
                {size.icon === 'portrait' && (
                  <span className={`inline-block w-2.5 h-3.5 md:w-3 md:h-4 border ${
                    selectedFrameSize === size.value ? 'border-black' : 'border-white/60'
                  }`}></span>
                )}
                {size.icon === 'landscape' && (
                  <span className={`inline-block w-3.5 h-2.5 md:w-4 md:h-3 border ${
                    selectedFrameSize === size.value ? 'border-black' : 'border-white/60'
                  }`}></span>
                )}
                {size.icon === 'ultrawide' && (
                  <span className={`inline-block w-4 h-1.5 md:w-5 md:h-2 border ${
                    selectedFrameSize === size.value ? 'border-black' : 'border-white/60'
                  }`}></span>
                )}
                <span>{size.label}</span>
              </span>
              {selectedFrameSize === size.value && (
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoFrameSizeDropdown;
