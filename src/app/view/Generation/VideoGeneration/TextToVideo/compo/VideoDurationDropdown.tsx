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
    if (selectedModel?.includes("veo3")) {
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
    return [
      { value: 5, label: "5 seconds", description: "Short video" },
      { value: 10, label: "10 seconds", description: "Standard length" }
    ];
  };

  const availableDurations = getAvailableDurations();

  const selectedDurationInfo = availableDurations.find(duration => duration.value === selectedDuration);

  return (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns if they exist
          if (onCloseOtherDropdowns) {
            onCloseOtherDropdowns();
          }
          setIsOpen(!isOpen);
        }}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-black/20 dark:ring-white/20 hover:ring-black/30 dark:hover:ring-white/30 bg-transparent text-black/90 dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1"
      >
        <Clock className="w-4 h-4 mr-1" />
        {selectedDurationInfo?.label || `${selectedDuration}s`}
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-32 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-black/30 dark:ring-white/30 pb-2 pt-2">
          {availableDurations.map((duration) => (
            <button
              key={duration.value}
              onClick={() => {
                onDurationChange(duration.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left transition text-[13px] flex items-center justify-between ${
                selectedDuration === duration.value
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-black/90 dark:text-white/90 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <span>{duration.label}</span>
              {selectedDuration === duration.value && (
                <div className="w-2 h-2 bg-white dark:bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoDurationDropdown;
