"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Monitor } from "lucide-react";

interface QualityDropdownProps {
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
  selectedModel?: string; // To determine which qualities to show
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
}

const QualityDropdown: React.FC<QualityDropdownProps> = ({
  selectedQuality,
  onQualityChange,
  selectedModel,
  onCloseOtherDropdowns,
  onCloseThisDropdown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get available qualities based on selected model
  const getAvailableQualities = () => {
    // Sora 2 models support different resolutions based on tier
    if (selectedModel?.includes("sora2-pro")) {
      // Sora 2 Pro supports 720p and 1080p
      return [
        { value: "720p", label: "720p", description: "HD Quality (1280x720)" },
        { value: "1080p", label: "1080p", description: "Full HD Quality (1920x1080)" }
      ];
    }
    if (selectedModel?.includes("sora2")) {
      // Sora 2 Standard supports only 720p
      return [
        { value: "720p", label: "720p", description: "HD Quality (1280x720)" }
      ];
    }
    // Veo 3.1 models support 720p, 1080p
    if (selectedModel?.includes("veo3.1")) {
      return [
        { value: "720p", label: "720p", description: "HD Quality (1280x720)" },
        { value: "1080p", label: "1080p", description: "Full HD Quality (1920x1080)" }
      ];
    }
    // PixVerse models support 360p, 540p, 720p, 1080p
    if (selectedModel?.includes("pixverse")) {
      return [
        { value: "360p", label: "360p", description: "SD Quality (640x360)" },
        { value: "540p", label: "540p", description: "HD- Quality (960x540)" },
        { value: "720p", label: "720p", description: "HD Quality (1280x720)" },
        { value: "1080p", label: "1080p", description: "Full HD Quality (1920x1080)" }
      ];
    }
    // Seedance models support 480p, 720p, 1080p
    if (selectedModel?.includes("seedance")) {
      return [
        { value: "480p", label: "480p", description: "SD Quality (854x480)" },
        { value: "720p", label: "720p", description: "HD Quality (1280x720)" },
        { value: "1080p", label: "1080p", description: "Full HD Quality (1920x1080)" }
      ];
    }
    // Default: other models support 720p and 1080p
    return [
      { value: "720p", label: "720p", description: "HD Quality" },
      { value: "1080p", label: "1080p", description: "Full HD Quality" }
    ];
  };

  const availableQualities = getAvailableQualities();

  const selectedQualityInfo = availableQualities.find(quality => quality.value === selectedQuality);

  // Auto-select first available quality if current selection is invalid
  useEffect(() => {
    if (availableQualities.length > 0 && !availableQualities.find(q => q.value === selectedQuality)) {
      onQualityChange(availableQualities[0].value);
    }
  }, [selectedModel, selectedQuality, availableQualities, onQualityChange]);

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

  return (
    <div className="relative dropdown-container" ref={dropdownRef}>
      <button
        onClick={() => {
          // Close other dropdowns if they exist
          if (onCloseOtherDropdowns) {
            onCloseOtherDropdowns();
          }
          setIsOpen(!isOpen);
        }}
        className={`h-[28px] md:h-[32px] px-2 md:px-4 rounded-lg text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 ${
          selectedQuality !== "720p" 
            ? 'bg-white text-black' 
            : 'bg-transparent text-white/90 hover:bg-white/5'
        }`}
      >
        <Monitor className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        {selectedQualityInfo?.label || selectedQuality}
        <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[70vw] md:w-40 bg-black/70 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/30 pb-1.5 md:pb-2 pt-1.5 md:pt-2 z-50">
          {availableQualities.map((quality) => (
            <button
              key={quality.value}
              onClick={() => {
                onQualityChange(quality.value);
                setIsOpen(false);
              }}
              className={`w-full px-2 md:px-4 py-1.5 md:py-2 text-left transition text-[10px] md:text-[13px] flex items-center justify-between ${
                selectedQuality === quality.value
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium">{quality.label}</span>
                <span className="text-[9px] md:text-xs opacity-70">{quality.description}</span>
              </div>
              {selectedQuality === quality.value && (
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QualityDropdown;
