"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

interface VideoDurationDropdownProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  onCloseOtherDropdowns?: () => void;
  onCloseThisDropdown?: () => void;
  selectedModel?: string;
  generationMode?: string;
}

const VideoDurationDropdown: React.FC<VideoDurationDropdownProps> = ({
  selectedDuration,
  onDurationChange,
  onCloseOtherDropdowns,
  onCloseThisDropdown,
  selectedModel,
  generationMode,
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

  // Get available durations based on model and generation mode
  const getAvailableDurations = () => {
    if (selectedModel?.includes("MiniMax")) {
      // MiniMax-Hailuo-02 supports only 6s and 10s
      return [
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" }
      ];
    }
    if (selectedModel === 'T2V-01-Director' || selectedModel === 'I2V-01-Director' || selectedModel === 'S2V-01') {
      // Director variants are fixed at 6s
      return [
        { value: 6, label: "6 seconds", description: "Fixed duration" }
      ];
    }
    if (selectedModel?.includes("sora2")) {
      // Sora 2 supports 4s, 8s, and 12s
      return [
        { value: 4, label: "4 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" },
        { value: 12, label: "12 seconds", description: "Long video" }
      ];
    }
    if (selectedModel?.includes("pixverse")) {
      // PixVerse supports 5s and 8s
      return [
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 8, label: "8 seconds", description: "Long" }
      ];
    }
    if (selectedModel?.includes("ltx2")) {
      // LTX V2 supports 6s, 8s, and 10s
      return [
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" },
        { value: 10, label: "10 seconds", description: "Long video" }
      ];
    }
    if (selectedModel?.includes("seedance")) {
      // Seedance supports 2-12 seconds
      return [
        { value: 2, label: "2 seconds", description: "Very short" },
        { value: 3, label: "3 seconds", description: "Short" },
        { value: 4, label: "4 seconds", description: "Short" },
        { value: 5, label: "5 seconds", description: "Standard" },
        { value: 6, label: "6 seconds", description: "Standard" },
        { value: 7, label: "7 seconds", description: "Medium" },
        { value: 8, label: "8 seconds", description: "Medium" },
        { value: 9, label: "9 seconds", description: "Long" },
        { value: 10, label: "10 seconds", description: "Long" },
        { value: 11, label: "11 seconds", description: "Very long" },
        { value: 12, label: "12 seconds", description: "Maximum" }
      ];
    }
    if (selectedModel?.includes("veo3.1")) {
      // For Veo 3.1 image-to-video, only show 8s
      if (generationMode === "image_to_video") {
        return [
          { value: 8, label: "8 seconds", description: "Standard length" }
        ];
      }
      // For Veo 3.1 text-to-video, show all options
      return [
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" }
      ];
    }
    if (selectedModel?.includes("veo3") && !selectedModel.includes("veo3.1")) {
      // For Veo3 image-to-video, only show 8s
      if (generationMode === "image_to_video") {
        return [
          { value: 8, label: "8 seconds", description: "Standard length" }
        ];
      }
      // For Veo3 text-to-video, show all options
      return [
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 8, label: "8 seconds", description: "Standard length" }
      ];
    }
    if (selectedModel?.startsWith('kling-')) {
      // Kling supports 5s and 10s
      return [
        { value: 5, label: "5 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" }
      ];
    }
    if (selectedModel?.includes("wan-2.5")) {
      // WAN 2.5 models support 5s and 10s
      return [
        { value: 5, label: "5 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" }
      ];
    }
    if (selectedModel?.includes("gen4") || selectedModel?.includes("gen3a")) {
      // Runway models support 4s, 6s, and 10s
      return [
        { value: 4, label: "4 seconds", description: "Quick video" },
        { value: 6, label: "6 seconds", description: "Short video" },
        { value: 10, label: "10 seconds", description: "Standard length" }
      ];
    }
    // Default fallback
    return [
      { value: 4, label: "4 seconds", description: "Quick video" },
      { value: 6, label: "6 seconds", description: "Short video" },
      { value: 10, label: "10 seconds", description: "Standard length" }
    ];
  };

  const availableDurations = getAvailableDurations();

  const selectedDurationInfo = availableDurations.find(duration => duration.value === selectedDuration);

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
        className={`h-[28px] md:h-[32px] px-2 md:px-4 rounded-lg text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-white text-black`}
      >
        <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
        {selectedDurationInfo?.label || `${selectedDuration}s`}
        <ChevronUp className={`w-3 h-3 md:w-4 md:h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="
          fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-32
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/30
          pb-1.5 md:pb-2 pt-1.5 md:pt-2 z-80 max-h-[40vh] md:max-h-150 overflow-y-auto dropdown-scrollbar
        ">
          {availableDurations.map((duration) => (
            <button
              key={duration.value}
              onClick={() => {
                onDurationChange(duration.value);
                setIsOpen(false);
              }}
              className={`w-full px-2 md:px-4 py-1.5 md:py-2 text-left transition text-[10px] md:text-[13px] flex items-center justify-between ${
                selectedDuration === duration.value
                  ? 'bg-white text-black'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <span>{duration.label}</span>
              {selectedDuration === duration.value && (
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoDurationDropdown;
